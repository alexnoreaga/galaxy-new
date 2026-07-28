import {defer} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams} from '@remix-run/react';
import {getPaginationVariables} from '@shopify/hydrogen';

import {SearchForm, SearchResults, NoSearchResults} from '~/components/Search';
import {
  PredictiveSearchForm,
  PredictiveSearchResults,
} from '~/components/Search';
import {getAutomaticDiscounts, findProductAutoDiscount} from '~/lib/autoDiscounts';

export const meta = ({location, data}) => {
  // Get search query from URL
  const searchQuery = new URLSearchParams(location.search).get("q") || '';
  
  // ENHANCED - Better title with context
  const title = searchQuery 
    ? `Hasil Pencarian "${searchQuery}" - Galaxy Camera` 
    : 'Cari Produk | Galaxy Camera';

  // ENHANCED - Better description
  const description = searchQuery
    ? `Temukan ${searchQuery} dengan harga terbaik di Galaxy Camera. Garansi resmi, cicilan 0%, gratis ongkir. Belanja aman sekarang.`
    : `Cari produk fotografi dan videografi di Galaxy Camera. Ribuan produk dengan harga terbaik dan garansi resmi.`;

  // ENHANCED - Keywords
  const keywords = searchQuery
    ? `${searchQuery}, jual ${searchQuery}, ${searchQuery} murah, ${searchQuery} original, ${searchQuery} terbaik`
    : 'cari produk, toko kamera online, jual kamera, fotografi, videografi';

  // Canonical URL
  const canonicalUrl = `https://galaxy.co.id/search?q=${encodeURIComponent(searchQuery)}`;

  // Product count
  const productCount = data?.searchResults?.totalResults || 0;

  return [
    // Basic Meta Tags
    { title },
    {
      name: 'title',
      content: title,
    },
    {
      name: 'description',
      content: description.substring(0, 160),
    },
    {
      name: 'keywords',
      content: keywords,
    },
    {
      name: 'author',
      content: 'Galaxy Camera',
    },

    // Robots & Indexing
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large, max-snippet:-1',
    },

    // Canonical URL
    {
      tagName: 'link',
      rel: 'canonical',
      href: canonicalUrl,
    },

    // Open Graph Tags
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:description',
      content: description.substring(0, 160),
    },
    {
      property: 'og:url',
      content: canonicalUrl,
    },
    {
      property: 'og:site_name',
      content: 'Galaxy Camera',
    },
    {
      property: 'og:image',
      content: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
    },
    {
      property: 'og:locale',
      content: 'id_ID',
    },

    // Twitter Card Tags
    {
      name: 'twitter:card',
      content: 'summary',
    },
    {
      name: 'twitter:site',
      content: '@galaxycamera99',
    },
    {
      name: 'twitter:title',
      content: title,
    },
    {
      name: 'twitter:description',
      content: description.substring(0, 160),
    },

    // Search Results Page Schema
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        'name': title,
        'description': description,
        'url': canonicalUrl,
        'mainEntity': {
          '@type': 'ItemList',
          'name': `Search results for "${searchQuery}"`,
          'numberOfItems': productCount,
        },
      },
    },

    // BreadcrumbList Schema
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://galaxy.co.id',
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Search',
            'item': 'https://galaxy.co.id/search',
          },
          ...(searchQuery ? [{
            '@type': 'ListItem',
            'position': 3,
            'name': `Results for "${searchQuery}"`,
            'item': canonicalUrl,
          }] : []),
        ],
      },
    },
  ].filter(Boolean);
};

// OLD CODE - Commented for future reference
// export const meta = ({location,data}) => {
//   // console.log(data.searchResults.results.products.nodes[0].description)
//   const searchQuery = new URLSearchParams(
//     location.search
//   ).get("q");
//   return [{ title: searchQuery ? `Jual ${searchQuery.toUpperCase()} Murah dan Terbaik` : 'Cari Produk' },
//   {
//     name: "description",
//     content: data?.searchResults?.results?.products?.nodes[0]?.description
//       ? data.searchResults.results.products.nodes[0].description.substr(0, 155)
//       : "Galaxy Camera menjual berbagai kebutuhan fotografi dan videografi. Tersedia berbagai metode pembayaran",
//   }
//   
// ];
// };

export async function loader({request, context}) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const variables = getPaginationVariables(request, {pageBy: 8});
  const searchTerm = String(searchParams.get('q') || '');

  // Sort — Shopify search supports RELEVANCE and PRICE (asc/desc via reverse)
  const sort = searchParams.get('sort') || 'relevance';
  const SORT_MAP = {
    'relevance': {sortKey: 'RELEVANCE', reverse: false},
    'price-asc': {sortKey: 'PRICE', reverse: false},
    'price-desc': {sortKey: 'PRICE', reverse: true},
  };
  const {sortKey, reverse} = SORT_MAP[sort] || SORT_MAP['relevance'];

  if (!searchTerm) {
    return {
      searchResults: {results: null, totalResults: 0},
      searchTerm,
      sort,
    };
  }

  const data = await context.storefront.query(SEARCH_QUERY, {
    variables: {
      query: searchTerm,
      sortKey,
      reverse,
      ...variables,
    },
  });

  if (!data) {
    throw new Error('No search data returned from Shopify API');
  }

  const totalResults = Object.values(data).reduce((total, value) => {
    return total + value.nodes.length;
  }, 0);

  const searchResults = {
    results: data,
    totalResults,
  };

  const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
  const productNodes = data.products?.nodes || [];

  const [soldEntries, reviewEntries, discounts] = await Promise.all([
    Promise.all(productNodes.map(p =>
      fetch(`${FIRESTORE_BASE}/sold_counts/${p.handle}?key=${FIRESTORE_KEY}`)
        .then(res => res.ok ? res.json() : null)
        .then(doc => [p.handle, parseInt(doc?.fields?.count?.integerValue || 0)])
        .catch(() => [p.handle, 0])
    )),
    Promise.all(productNodes.map(p =>
      fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({structuredQuery: {from: [{collectionId: 'reviews'}], where: {fieldFilter: {field: {fieldPath: 'productHandle'}, op: 'EQUAL', value: {stringValue: p.handle}}}, select: {fields: [{fieldPath: 'rating'}]}, limit: 100}}),
      })
      .then(res => res.ok ? res.json() : null)
      .then(rows => {
        const ratings = (rows || []).filter(r => r.document).map(r => parseInt(r.document.fields?.rating?.integerValue || 5));
        const count = ratings.length;
        const avg = count > 0 ? parseFloat((ratings.reduce((s, r) => s + r, 0) / count).toFixed(1)) : 0;
        return [p.handle, count > 0 ? {count, avg} : null];
      })
      .catch(() => [p.handle, null])
    )),
    getAutomaticDiscounts(context.env).catch(() => []),
  ]);

  const soldCounts = Object.fromEntries(soldEntries);
  const reviewSummaries = Object.fromEntries(reviewEntries);

  // Flash-sale prices keyed by handle (mirrors the product page's flash logic)
  const flashMap = {};
  for (const p of productNodes) {
    const price = p.variants?.nodes?.[0]?.price;
    const variantId = p.variants?.nodes?.[0]?.id;
    if (!price) continue;
    const ad = findProductAutoDiscount(discounts, p.id);
    if (!ad) continue;
    if (ad.variantIds && !(variantId && ad.variantIds.includes(variantId))) continue;
    const baseAmt = parseFloat(price.amount) || 0;
    const flashAmt = ad.type === 'amount'
      ? Math.max(0, baseAmt - ad.amount)
      : Math.max(0, Math.round(baseAmt * (1 - ad.percentage / 100)));
    if (flashAmt > 0 && flashAmt < baseAmt) {
      flashMap[p.handle] = {flashAmount: flashAmt, currencyCode: price.currencyCode, originalAmount: baseAmt};
    }
  }

  return defer({searchTerm, searchResults, soldCounts, reviewSummaries, flashMap, sort});
}

export default function SearchPage() {
  const {searchTerm, searchResults, soldCounts = {}, reviewSummaries = {}, flashMap = {}, sort = 'relevance'} = useLoaderData();
  const [, setSearchParams] = useSearchParams();

  function onSortChange(e) {
    // Reset pagination (drop cursor params) but keep the query when changing sort
    const next = new URLSearchParams();
    if (searchTerm) next.set('q', searchTerm);
    next.set('sort', e.target.value);
    setSearchParams(next, {preventScrollReset: true});
  }

  return (
    <div className="search relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <h1 className="sr-only">Cari Produk — Galaxy Camera</h1>

      {/* Styled search input */}
      <div className="pt-4">
        <PredictiveSearchForm>
          {({fetchResults, inputRef}) => (
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Cari kamera, lensa, drone…"
                ref={inputRef}
                type="search"
                defaultValue={searchTerm}
                autoFocus
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          )}
        </PredictiveSearchForm>
        <PredictiveSearchResults />
      </div>

      {/* Results header — query echo + sort */}
      {searchTerm && (
        <div className="flex items-center justify-between gap-3 mt-5 mb-1">
          <p className="text-sm text-gray-600 min-w-0 truncate">
            Hasil untuk <span className="font-semibold text-gray-900">&quot;{searchTerm}&quot;</span>
          </p>
          {searchResults.totalResults ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <label htmlFor="sortby" className="text-xs text-gray-400">Urutkan</label>
              <select
                id="sortby"
                value={sort}
                onChange={onSortChange}
                className="text-xs font-medium text-gray-800 border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="relevance">Paling Sesuai</option>
                <option value="price-asc">Harga Terendah</option>
                <option value="price-desc">Harga Tertinggi</option>
              </select>
            </div>
          ) : null}
        </div>
      )}

      {searchTerm && searchResults.totalResults ? (
        <SearchResults results={searchResults.results} soldCounts={soldCounts} reviewSummaries={reviewSummaries} flashMap={flashMap} />
      ) : (
        <NoSearchResults searchTerm={searchTerm} />
      )}
    </div>
  );
}

const SEARCH_QUERY = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    description
    trackingParameters
    vendor
    variants(first: 1) {
      nodes {
        id
        image {
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
        product {
          handle
          title
        }
      }
    }
  }
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
    blog {
      handle
    }
  }
  query search(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $query: String!
    $startCursor: String
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $query,
      unavailableProducts: HIDE,
      types: [PRODUCT],
      first: $first,
      sortKey: $sortKey,
      reverse: $reverse,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
    pages: search(
      query: $query,
      types: [PAGE],
      first: 10
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    articles: search(
      query: $query,
      types: [ARTICLE],
      first: 10
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
  }
`;
