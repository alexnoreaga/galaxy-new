import { json } from '@shopify/remix-oxygen';
import crypto from 'crypto';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

export async function loader() {
  return json({ status: 'webhook endpoint active' });
}

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

    // ── Affiliate commission logic ──────────────────────────────────────
    const noteAttrs = order.note_attributes || [];
    const affiliateAttr = noteAttrs.find(a => a.name === 'affiliate_ref');
    const refCode = affiliateAttr?.value;

    if (refCode) {
      try {
        // Fetch affiliate doc + config in parallel
        const [affRes, configRes] = await Promise.all([
          fetch(`${FIRESTORE_BASE}/affiliates/${refCode}?key=${FIRESTORE_KEY}`),
          fetch(`${FIRESTORE_BASE}/affiliate_config/settings?key=${FIRESTORE_KEY}`),
        ]);

        const affDoc = affRes.ok ? await affRes.json() : null;
        const configDoc = configRes.ok ? await configRes.json() : null;

        if (affDoc && !affDoc.error && affDoc.fields?.status?.stringValue === 'approved') {
          // Build commission rates from config — supports new dynamic map schema and old fixed fields
          const cf = configDoc?.fields || {};
          const rateDefault = parseFloat(cf.rateDefault?.doubleValue || cf.rateDefault?.integerValue || 2);
          let rates = {};
          if (cf.rates?.mapValue?.fields) {
            for (const [k, v] of Object.entries(cf.rates.mapValue.fields)) {
              rates[k] = parseFloat(v.doubleValue || v.integerValue || 0);
            }
          } else {
            rates = {
              Kamera: parseFloat(cf.rateKamera?.doubleValue || cf.rateKamera?.integerValue || 2),
              Lensa: parseFloat(cf.rateLensa?.doubleValue || cf.rateLensa?.integerValue || 2.5),
              Aksesoris: parseFloat(cf.rateAksesoris?.doubleValue || cf.rateAksesoris?.integerValue || 4),
              Bundle: parseFloat(cf.rateBundle?.doubleValue || cf.rateBundle?.integerValue || 3),
            };
          }

          // Calculate commission per line item
          let totalCommission = 0;
          const commissionItems = lineItems.map(item => {
            const productType = item.product_type || '';
            const rate = rates[productType] !== undefined ? rates[productType] : rateDefault;
            const itemTotal = parseFloat(item.price) * (item.quantity || 1);
            const commission = Math.round(itemTotal * (rate / 100));
            totalCommission += commission;
            return { title: item.title, productType, price: itemTotal, rate, commission };
          });

          const orderId = String(order.id);
          const orderTotal = parseFloat(order.total_price || 0);

          // Save commission record
          await fetch(`${FIRESTORE_BASE}/affiliate_commissions/${orderId}?key=${FIRESTORE_KEY}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                refCode: { stringValue: refCode },
                orderId: { stringValue: orderId },
                orderNumber: { integerValue: String(order.order_number || 0) },
                orderTotal: { doubleValue: orderTotal },
                commissionAmount: { integerValue: String(totalCommission) },
                status: { stringValue: 'pending' },
                lineItems: { stringValue: JSON.stringify(commissionItems) },
                createdAt: { stringValue: new Date().toISOString() },
                paidAt: { nullValue: null },
              },
            }),
          });

          // Update affiliate totals
          const curOrders = parseInt(affDoc.fields?.totalOrders?.integerValue || 0);
          const curEarned = parseInt(affDoc.fields?.totalEarned?.integerValue || 0);
          await fetch(
            `${FIRESTORE_BASE}/affiliates/${refCode}?key=${FIRESTORE_KEY}&updateMask.fieldPaths=totalOrders&updateMask.fieldPaths=totalEarned`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  totalOrders: { integerValue: String(curOrders + 1) },
                  totalEarned: { integerValue: String(curEarned + totalCommission) },
                },
              }),
            }
          );
        }
      } catch (affErr) {
        console.error('Affiliate commission error:', affErr);
      }
    }
    // ── End affiliate commission logic ──────────────────────────────────

    return json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return json({ error: 'Processing failed' }, { status: 500 });
  }
}
