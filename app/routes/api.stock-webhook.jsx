import { json } from '@shopify/remix-oxygen';

// Shopify webhooks (registered by our client-credentials app, so signed with SHOPIFY_APP_CLIENT_SECRET):
//   PRODUCTS_UPDATE          → payload has handle, title, status, variants[{price, inventory_quantity}]
//   INVENTORY_LEVELS_UPDATE  → only inventory_item_id + available → resolve the product via Admin GraphQL
// Either way we forward a compact {handle, title, available, minPrice} to harga-produk /api/stock-notify
// (shared secret CHAT_NOTIFY_SECRET), which holds the service account, matches waiting customers,
// pushes and clears their alerts. Always answers 200 quickly so Shopify never disables the webhook.
const envVar = (env, key) => env?.[key] ?? (typeof process !== 'undefined' ? process.env?.[key] : undefined);

async function hmacOk(secret, rawBody, header) {
  if (!secret || !header) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === header;
}

async function adminToken(env) {
  const shop = envVar(env, 'PUBLIC_STORE_DOMAIN'), id = envVar(env, 'SHOPIFY_APP_CLIENT_ID'), secret = envVar(env, 'SHOPIFY_APP_CLIENT_SECRET');
  const r = await fetch(`https://${shop}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=client_credentials&client_id=${id}&client_secret=${secret}` });
  const j = await r.json();
  return { shop, token: j.access_token };
}

// inventory_item_id → the product's current handle/title/availability/min price
async function productFromInventoryItem(env, inventoryItemId) {
  const { shop, token } = await adminToken(env);
  const q = `{ inventoryItem(id: "gid://shopify/InventoryItem/${inventoryItemId}") { variant { product { handle title status variants(first: 20) { nodes { price inventoryQuantity availableForSale } } } } } }`;
  const r = await fetch(`https://${shop}/admin/api/2026-01/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token }, body: JSON.stringify({ query: q }) });
  const p = (await r.json())?.data?.inventoryItem?.variant?.product;
  if (!p) return null;
  const vs = p.variants?.nodes || [];
  return { handle: p.handle, title: p.title, available: p.status === 'ACTIVE' && vs.some((v) => v.availableForSale), minPrice: Math.min(...vs.map((v) => Number(v.price) || Infinity)) };
}

function productFromPayload(p) {
  const vs = Array.isArray(p?.variants) ? p.variants : [];
  const available = p?.status === 'active' && vs.some((v) => (v.inventory_policy === 'continue') || (Number(v.inventory_quantity) > 0) || v.inventory_management == null);
  const minPrice = Math.min(...vs.map((v) => Number(v.price) || Infinity));
  return { handle: p?.handle, title: p?.title, available, minPrice };
}

export async function loader() {
  return json({ status: 'stock webhook active' });
}

export async function action({ request, context }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  const env = context?.env;
  const rawBody = await request.text();
  const ok = await hmacOk(envVar(env, 'SHOPIFY_APP_CLIENT_SECRET'), rawBody, request.headers.get('x-shopify-hmac-sha256'));
  if (!ok) return json({ error: 'Invalid signature' }, { status: 401 });

  const topic = request.headers.get('x-shopify-topic') || '';
  try {
    const payload = JSON.parse(rawBody);
    let info = null;
    if (topic === 'products/update') info = productFromPayload(payload);
    else if (topic === 'inventory_levels/update' && payload?.inventory_item_id) info = await productFromInventoryItem(env, payload.inventory_item_id);
    if (!info?.handle || !Number.isFinite(info.minPrice)) return json({ ok: true, skipped: 'no product' });

    const secret = envVar(env, 'CHAT_NOTIFY_SECRET');
    if (!secret) return json({ ok: true, skipped: 'no secret' });
    const base = envVar(env, 'LACAK_API_BASE') ?? 'https://galaxy-internal-tools.vercel.app';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${base}/api/stock-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-chat-secret': secret },
      body: JSON.stringify({ handle: info.handle, title: info.title, available: !!info.available, minPrice: info.minPrice, topic }),
      signal: ctrl.signal,
    }).catch(() => null);
    clearTimeout(timer);
    return json({ ok: true, forwarded: !!r?.ok });
  } catch (e) {
    console.error('[stock-webhook]', e?.message || e);
    return json({ ok: true, error: 'handled' });
  }
}
