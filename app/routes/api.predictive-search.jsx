import {json} from '@shopify/remix-oxygen';
import {NO_PREDICTIVE_SEARCH_RESULTS} from '~/components/Search';
import {getAutomaticDiscounts, findProductAutoDiscount} from '~/lib/autoDiscounts';
import { getSocialProof } from '~/lib/socialProof';

// Applies an active flash-sale discount to a search item's price (returns {flashPrice, originalPrice} or null)
function computeFlash(item, discounts) {
  if (!item?.price || !discounts?.length) return null;
  const ad = findProductAutoDiscount(discounts, item.id);
  if (!ad) return null;
  // variantIds: null = whole product; array = only those variants (match the item's first variant)
  if (ad.variantIds && !(item.variantId && ad.variantIds.includes(item.variantId))) return null;
  const baseAmt = parseFloat(item.price.amount) || 0;
  const flashAmt = ad.type === 'amount'
    ? Math.max(0, baseAmt - ad.amount)
    : Math.max(0, Math.round(baseAmt * (1 - ad.percentage / 100)));
  if (!(flashAmt > 0 && flashAmt < baseAmt)) return null;
  return {
    flashPrice: {amount: String(flashAmt), currencyCode: item.price.currencyCode},
    originalPrice: item.price,
  };
}

const DEFAULT_SEARCH_TYPES = [
  'ARTICLE',
  'COLLECTION',
  'PAGE',
  'PRODUCT',
  'QUERY',
];

/**
 * Fetches the search results from the predictive search API
 * requested by the SearchForm component
 */
export async function action({request, params, context}) {
  if (request.method !== 'POST') {
    throw new Error('Invalid request method');
  }

  const search = await fetchPredictiveSearchResults({
    params,
    request,
    context,
  });

  return json(search);
}

async function fetchPredictiveSearchResults({params, request, context}) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  let body;
  try {
    body = await request.formData();
  } catch (error) {}
  const searchTerm = String(body?.get('q') || searchParams.get('q') || '');
  const limit = Number(body?.get('limit') || searchParams.get('limit') || 10);
  const rawTypes = String(
    body?.get('type') || searchParams.get('type') || 'ANY',
  );
  const searchTypes =
    rawTypes === 'ANY'
      ? DEFAULT_SEARCH_TYPES
      : rawTypes
          .split(',')
          .map((t) => t.toUpperCase())
          .filter((t) => DEFAULT_SEARCH_TYPES.includes(t));

  if (!searchTerm) {
    return {
      searchResults: {results: null, totalResults: 0},
      searchTerm,
      searchTypes,
    };
  }

  const data = await context.storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      limit,
      limitScope: 'EACH',
      searchTerm,
      types: searchTypes,
    },
  });

  if (!data) {
    throw new Error('No data returned from Shopify API');
  }

  const searchResults = normalizePredictiveSearchResults(
    data.predictiveSearch,
    params.locale,
  );

  let productsGroup = searchResults.results.find(r => r.type === 'products');

  // Shopify's predictive engine sometimes returns far fewer products than `limit` for broad
  // brand words ("sony" → 4 accessories, no ZV-E10 / A7 IV). Top the list up with best-selling
  // matches from the regular product search so brand queries always show a full, sensible row.
  const haveCount = productsGroup?.items?.length || 0;
  if (haveCount < limit && searchTerm.trim().length >= 2) {
    try {
      const fill = await context.storefront.query(PREDICTIVE_FILL_QUERY, {
        variables: { first: limit, query: searchTerm.trim() },
      });
      const seen = new Set((productsGroup?.items || []).map(p => p.handle));
      const localePrefix = params.locale ? `/${params.locale}` : '';
      // Free-text search also matches descriptions ("sony" → an Akaso cam that mentions Sony),
      // so rank: term in title first, then in-stock, then keep Shopify's best-selling order.
      const termLc = searchTerm.trim().toLowerCase();
      const extra = (fill?.products?.nodes || [])
        .filter(p => p?.handle && !seen.has(p.handle) && p.variants?.nodes?.[0]?.price)
        .map((p, i) => ({ p, i, score: (String(p.title).toLowerCase().includes(termLc) ? 2 : 0) + (p.availableForSale !== false ? 1 : 0) }))
        .sort((a, b) => b.score - a.score || a.i - b.i)
        .map(({ p }) => p)
        .slice(0, limit - haveCount)
        .map(p => ({
          __typename: 'Product',
          handle: p.handle,
          id: p.id,
          image: p.variants?.nodes?.[0]?.image,
          title: p.title,
          productType: p.productType || '',
          url: `${localePrefix}/products/${p.handle}`,
          price: p.variants.nodes[0].price,
          variantId: p.variants.nodes[0].id,
          availableForSale: p.availableForSale !== false,
        }));
      if (extra.length) {
        if (!productsGroup) {
          productsGroup = { type: 'products', items: [] };
          searchResults.results.push(productsGroup);
        }
        productsGroup.items = [...productsGroup.items, ...extra];
        searchResults.totalResults = (searchResults.totalResults || 0) + extra.length;
      }
    } catch {
      // best-effort: predictive results still render without the top-up
    }
  }
  const productItems = productsGroup?.items || [];

  if (productItems.length) {
    const handles = productItems.map(p => p.handle);
    // One batched (and cached) call instead of 2 Firestore requests per product per keystroke.
    const [{ soldCounts: soldMap, reviewSummaries: reviewMap }, discounts] = await Promise.all([
      getSocialProof(handles),
      getAutomaticDiscounts(context.env).catch(() => []),
    ]);
    productsGroup.items = productItems.map(item => ({
      ...item,
      sold: soldMap[item.handle] || 0,
      review: reviewMap[item.handle] || null,
      ...(computeFlash(item, discounts) || {}),
    }));
  }

  return {searchResults, searchTerm, searchTypes};
}

/**
 * Normalize results and apply tracking qurery parameters to each result url
 */
export function normalizePredictiveSearchResults(predictiveSearch, locale) {
  let totalResults = 0;
  if (!predictiveSearch) {
    return {
      results: NO_PREDICTIVE_SEARCH_RESULTS,
      totalResults,
    };
  }

  function applyTrackingParams(resource, params) {
    if (params) {
      return resource.trackingParameters
        ? `?${params}&${resource.trackingParameters}`
        : `?${params}`;
    } else {
      return resource.trackingParameters
        ? `?${resource.trackingParameters}`
        : '';
    }
  }

  const localePrefix = locale ? `/${locale}` : '';
  const results = [];

  if (predictiveSearch.queries.length) {
    results.push({
      type: 'queries',
      items: predictiveSearch.queries.map((query) => {
        const trackingParams = applyTrackingParams(
          query,
          `q=${encodeURIComponent(query.text)}`,
        );

        totalResults++;
        return {
          __typename: query.__typename,
          handle: '',
          id: query.text,
          image: undefined,
          title: query.text,
          styledTitle: query.styledText,
          url: `${localePrefix}/search${trackingParams}`,
        };
      }),
    });
  }

  if (predictiveSearch.products.length) {
    results.push({
      type: 'products',
      items: predictiveSearch.products.map((product) => {
        totalResults++;
        const trackingParams = applyTrackingParams(product);
        return {
          __typename: product.__typename,
          handle: product.handle,
          id: product.id,
          image: product.variants?.nodes?.[0]?.image,
          title: product.title,
          productType: product.productType || '',
          url: `${localePrefix}/products/${product.handle}${trackingParams}`,
          price: product.variants.nodes[0].price,
          variantId: product.variants.nodes[0].id,
          availableForSale: product.availableForSale !== false,
        };
      }),
    });
  }

  if (predictiveSearch.collections.length) {
    results.push({
      type: 'collections',
      items: predictiveSearch.collections.map((collection) => {
        totalResults++;
        const trackingParams = applyTrackingParams(collection);
        return {
          __typename: collection.__typename,
          handle: collection.handle,
          id: collection.id,
          image: collection.image,
          title: collection.title,
          url: `${localePrefix}/collections/${collection.handle}${trackingParams}`,
        };
      }),
    });
  }

  if (predictiveSearch.pages.length) {
    results.push({
      type: 'pages',
      items: predictiveSearch.pages.map((page) => {
        totalResults++;
        const trackingParams = applyTrackingParams(page);
        return {
          __typename: page.__typename,
          handle: page.handle,
          id: page.id,
          image: undefined,
          title: page.title,
          url: `${localePrefix}/pages/${page.handle}${trackingParams}`,
        };
      }),
    });
  }

  if (predictiveSearch.articles.length) {


    results.push({
      type: 'articles',
      items: predictiveSearch.articles.map((article) => {
        totalResults++;
        const trackingParams = applyTrackingParams(article);
        return {
          __typename: article.__typename,
          handle: article.handle,
          id: article.id,
          image: article.image,
          title: article.title,
          url: `${localePrefix}/blogs/${article.blog.handle}/${article.handle}${trackingParams}`,
        };
      }),
    });
  }

  return {results, totalResults};
}

// Regular product search, best-selling first — used only to top up short predictive lists.
const PREDICTIVE_FILL_QUERY = `#graphql
  query PredictiveFill($first: Int!, $query: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: $first, query: $query, sortKey: BEST_SELLING) {
      nodes {
        __typename
        id
        title
        handle
        productType
        availableForSale
        variants(first: 1) {
          nodes {
            id
            image { url altText width height }
            price { amount currencyCode }
          }
        }
      }
    }
  }
`;

const PREDICTIVE_SEARCH_QUERY = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
    blog {
      handle
    }
    
  }
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    productType
    trackingParameters
    availableForSale
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
      }
    }
  }
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
  query predictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $searchTerm: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $searchTerm,
      types: $types,
      unavailableProducts: SHOW,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
`;
