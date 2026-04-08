import { json } from '@shopify/remix-oxygen';

export async function action({ request, context }) {
  if (request.method !== 'POST') return json({ products: [] });

  const formData = await request.formData();
  const q = String(formData.get('q') || '').toLowerCase().trim();
  const collectionHandle = String(formData.get('collection') || '');

  if (!q || !collectionHandle) return json({ products: [] });

  try {
    const { collection } = await context.storefront.query(COLLECTION_PRODUCTS_QUERY, {
      variables: { handle: collectionHandle },
    });

    if (!collection) return json({ products: [] });

    const products = collection.products.nodes
      .filter(p => p.title.toLowerCase().includes(q))
      .slice(0, 8)
      .map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        productType: p.productType || '',
        image: p.featuredImage,
        price: p.variants.nodes[0]?.price || null,
      }));

    return json({ products });
  } catch (_) {
    return json({ products: [] });
  }
}

const COLLECTION_PRODUCTS_QUERY = `#graphql
  query CollectionSearch($handle: String!) {
    collection(handle: $handle) {
      products(first: 50, sortKey: BEST_SELLING) {
        nodes {
          id
          title
          handle
          productType
          featuredImage { url altText }
          variants(first: 1) {
            nodes {
              price { amount currencyCode }
            }
          }
        }
      }
    }
  }
`;
