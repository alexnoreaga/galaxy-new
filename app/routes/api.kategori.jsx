// Lazy category feed for the desktop Kategori mega-menu — fetched only when someone opens the
// menu, paginated so the panel can infinite-scroll. Text-only payload (no images) keeps it tiny.

import {json} from '@shopify/remix-oxygen';

export async function loader({request, context}) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || null;

  const {collections} = await context.storefront.query(ALL_COLLECTIONS_QUERY, {
    variables: {first: 24, after: cursor},
    cache: context.storefront.CacheLong(),
  });

  return json({
    nodes: collections?.nodes ?? [],
    hasNextPage: collections?.pageInfo?.hasNextPage ?? false,
    endCursor: collections?.pageInfo?.endCursor ?? null,
  });
}

const ALL_COLLECTIONS_QUERY = `#graphql
  query MenuAllCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after, sortKey: TITLE) {
      nodes {
        id
        title
        handle
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
