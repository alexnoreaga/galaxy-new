import { json } from '@shopify/remix-oxygen';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
const SECRET = 'galaxy-backfill-2026';

export async function loader({ request, context }) {
  const url = new URL(request.url);
  if (url.searchParams.get('secret') !== SECRET) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const storeDomain = context.env?.PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;
  const adminToken = context.env?.PUBLIC_STOREFRONT_API_TOKEN || process.env.PUBLIC_STOREFRONT_API_TOKEN;
  const storefrontToken = context.env?.PUBLIC_STOREFRONT_API_TOKEN || process.env.PUBLIC_STOREFRONT_API_TOKEN;

  try {
    // ── Step 1: Fetch ALL paid orders (paginated) ──────────────────────────────
    const productQtyMap = {}; // gid → total qty
    let nextUrl = `https://${storeDomain}/admin/api/2024-01/orders.json?status=any&limit=250&fields=id,line_items`;

    let pageCount = 0;
    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: { 'X-Shopify-Access-Token': adminToken },
      });
      if (!res.ok) {
        const errText = await res.text();
        return json({ error: 'Admin API failed', status: res.status, body: errText, storeDomain, hasAdminToken: !!adminToken });
      }

      const data = await res.json();
      for (const order of data.orders || []) {
        for (const item of order.line_items || []) {
          if (!item.product_id) continue;
          const gid = `gid://shopify/Product/${item.product_id}`;
          productQtyMap[gid] = (productQtyMap[gid] || 0) + (item.quantity || 1);
        }
      }

      // Follow pagination via Link header
      const linkHeader = res.headers.get('Link') || '';
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = nextMatch ? nextMatch[1] : null;
      pageCount++;
    }

    const gids = Object.keys(productQtyMap);
    if (gids.length === 0) return json({ ok: true, message: 'No paid orders found.', products: 0, pages: pageCount });

    // ── Step 2: Resolve product_id → handle (Storefront GraphQL, 10 at a time) ─
    const handleMap = {};
    const chunks = [];
    for (let i = 0; i < gids.length; i += 10) chunks.push(gids.slice(i, i + 10));

    await Promise.all(chunks.map(async (chunk) => {
      const query = `{
        nodes(ids: ${JSON.stringify(chunk)}) {
          ... on Product { id handle }
        }
      }`;
      const res = await fetch(`https://${storeDomain}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontToken,
        },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return;
      const data = await res.json();
      for (const node of data?.data?.nodes || []) {
        if (node?.id && node?.handle) handleMap[node.id] = node.handle;
      }
    }));

    // ── Step 3: Write totals to Firestore ────────────────────────────────────
    const results = [];
    await Promise.all(
      Object.entries(productQtyMap).map(async ([gid, qty]) => {
        const handle = handleMap[gid];
        if (!handle) return;

        const docUrl = `${FIRESTORE_BASE}/sold_counts/${handle}?key=${FIRESTORE_KEY}`;
        await fetch(`${docUrl}&updateMask.fieldPaths=count&updateMask.fieldPaths=updatedAt`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              count: { integerValue: String(qty) },
              updatedAt: { stringValue: new Date().toISOString() },
            },
          }),
        });
        results.push({ handle, qty });
      })
    );

    results.sort((a, b) => b.qty - a.qty);

    return json({
      ok: true,
      pages: pageCount,
      products: results.length,
      totals: results,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return json({ error: String(error) }, { status: 500 });
  }
}
