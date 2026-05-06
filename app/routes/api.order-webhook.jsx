import { json } from '@shopify/remix-oxygen';
import crypto from 'crypto';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

export async function action({ request, context }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const e = context.env || process.env;
  const WEBHOOK_SECRET = e.SHOPIFY_WEBHOOK_SECRET;
  const FIRESTORE_KEY = e.FIRESTORE_API_KEY;

  const rawBody = await request.text();

  // Verify Shopify signature
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  if (!hmacHeader) return json({ error: 'Missing signature' }, { status: 401 });

  const computed = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');

  if (computed !== hmacHeader) return json({ error: 'Invalid signature' }, { status: 401 });

  try {
    const order = JSON.parse(rawBody);
    const lineItems = order.line_items || [];

    const storeDomain = '41a7e9-3.myshopify.com';
    const storefrontToken = context.env?.PUBLIC_STOREFRONT_API_TOKEN || process.env.PUBLIC_STOREFRONT_API_TOKEN;

    // Deduplicate product IDs and sum quantities
    const productQtyMap = {};
    for (const item of lineItems) {
      if (!item.product_id) continue;
      const gid = `gid://shopify/Product/${item.product_id}`;
      productQtyMap[gid] = (productQtyMap[gid] || 0) + (item.quantity || 1);
    }

    const gids = Object.keys(productQtyMap);
    if (gids.length === 0) return json({ ok: true });

    // Batch fetch handles via Storefront GraphQL (up to 10 at a time)
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

    // Increment sold_counts for each handle
    await Promise.all(
      Object.entries(productQtyMap).map(async ([gid, qty]) => {
        const handle = handleMap[gid];
        if (!handle) return;

        const docUrl = `${FIRESTORE_BASE}/sold_counts/${handle}?key=${FIRESTORE_KEY}`;

        const getRes = await fetch(docUrl);
        let currentCount = 0;
        if (getRes.ok) {
          const doc = await getRes.json();
          currentCount = parseInt(doc.fields?.count?.integerValue || 0);
        }

        await fetch(`${docUrl}&updateMask.fieldPaths=count&updateMask.fieldPaths=updatedAt`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              count: { integerValue: String(currentCount + qty) },
              updatedAt: { stringValue: new Date().toISOString() },
            },
          }),
        });
      })
    );

    return json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return json({ error: 'Processing failed' }, { status: 500 });
  }
}
