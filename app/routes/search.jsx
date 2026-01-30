import {defer} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {getPaginationVariables} from '@shopify/hydrogen';

import {SearchForm, SearchResults, NoSearchResults} from '~/components/Search';
import {
  PredictiveSearchForm,
  PredictiveSearchResults,
} from '~/components/Search';

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

  if (!searchTerm) {
    return {
      searchResults: {results: null, totalResults: 0},
      searchTerm,
    };
  }

  const data = await context.storefront.query(SEARCH_QUERY, {
    variables: {
      query: searchTerm,
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

  return defer({searchTerm, searchResults});
}

export default function SearchPage() {
  const {searchTerm, searchResults} = useLoaderData();
  return (
    <div className="search relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <h1>Cari Produk</h1>
      {/* <SearchForm searchTerm={searchTerm} /> */}

      {/* KODE BARU */}
      <PredictiveSearchForm>
          {({fetchResults, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Cari Produk"
                ref={inputRef}
                type="search"
                className=' border-blue-500 rounded-md w-full'
                autoFocus

              />
              <button type="submit" className=''>Cari</button>
            </>
          )}
        </PredictiveSearchForm>
        <PredictiveSearchResults />
          {/* KODE BARU */}


      {!searchTerm || !searchResults.totalResults ? (
        <NoSearchResults />
      ) : (
        <SearchResults results={searchResults.results} />
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
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $query,
      unavailableProducts: HIDE,
      types: [PRODUCT],
      first: $first,
      sortKey: RELEVANCE,
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
