import { json } from '@shopify/remix-oxygen';

const PRODUCT_SEARCH_QUERY = `#graphql
  query AdminProductSearch($query: String!) {
    products(first: 8, query: $query) {
      nodes {
        handle
        title
        featuredImage { url }
        variants(first: 1) {
          nodes { price { amount currencyCode } }
        }
      }
    }
  }
`;

export async function loader({ request, context }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  if (!q.trim()) return json({ products: [] });

  try {
    const data = await context.storefront.query(PRODUCT_SEARCH_QUERY, {
      variables: { query: q },
    });
    return json({ products: data?.products?.nodes || [] });
  } catch (e) {
    return json({ products: [] });
  }
}
