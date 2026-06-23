import {json} from '@shopify/remix-oxygen';
import {NO_PREDICTIVE_SEARCH_RESULTS} from '~/components/Search';

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

  const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
  const productsGroup = searchResults.results.find(r => r.type === 'products');
  const productItems = productsGroup?.items || [];

  if (productItems.length) {
    const handles = productItems.map(p => p.handle);
    const [soldEntries, reviewEntries] = await Promise.all([
      Promise.all(handles.map(handle =>
        fetch(`${FIRESTORE_BASE}/sold_counts/${handle}?key=${FIRESTORE_KEY}`)
          .then(res => res.ok ? res.json() : null)
          .then(doc => [handle, parseInt(doc?.fields?.count?.integerValue || 0)])
          .catch(() => [handle, 0])
      )),
      Promise.all(handles.map(handle =>
        fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({structuredQuery: {from: [{collectionId: 'reviews'}], where: {fieldFilter: {field: {fieldPath: 'productHandle'}, op: 'EQUAL', value: {stringValue: handle}}}, select: {fields: [{fieldPath: 'rating'}]}, limit: 100}}),
        })
        .then(res => res.ok ? res.json() : null)
        .then(rows => {
          const ratings = (rows || []).filter(r => r.document).map(r => parseInt(r.document.fields?.rating?.integerValue || 5));
          const count = ratings.length;
          const avg = count > 0 ? parseFloat((ratings.reduce((s, r) => s + r, 0) / count).toFixed(1)) : 0;
          return [handle, count > 0 ? {count, avg} : null];
        })
        .catch(() => [handle, null])
      )),
    ]);
    const soldMap = Object.fromEntries(soldEntries);
    const reviewMap = Object.fromEntries(reviewEntries);
    productsGroup.items = productItems.map(item => ({
      ...item,
      sold: soldMap[item.handle] || 0,
      review: reviewMap[item.handle] || null,
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
