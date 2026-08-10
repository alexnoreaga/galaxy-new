// Staff-only cost / margin / "harga best" endpoint for the Galaxy Staff Tools Chrome extension.
// Password-gated (STAFF_TOOL_PASSWORD env var). Reads per-variant cost from the Admin API
// (InventoryItem.unitCost) and can write it back — so the raw cost never ships to customers.
//
// Requires Vercel env: STAFF_TOOL_PASSWORD, PUBLIC_STORE_DOMAIN, SHOPIFY_APP_CLIENT_ID,
// SHOPIFY_APP_CLIENT_SECRET. The Shopify app needs read_inventory (get) + write_inventory (set).

import {json} from '@shopify/remix-oxygen';
import {readEnvVar} from '~/lib/autoDiscounts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const roundTo1000 = (n) => Math.round(n / 1000) * 1000;

// Mirrors ~/lib/hargaBest.js: realCost = cost − running promo; 50:50 split, clamped to a 10% floor.
// The running promo (compareAt − price) is treated as the brand's cashback/subsidy, so it lowers our
// TRUE cost ("modal setelah harga coret" = realCost). We never quote below that real cost.
function computeHargaBest(price, compareAt, cost) {
  const diskon = compareAt > price ? compareAt - price : 0;
  const realCost = cost > 0 ? cost - diskon : 0; // modal setelah harga coret (cashback-adjusted)
  const pakaiModal = realCost > 0 && realCost < price;
  let hargaBest;
  if (pakaiModal) {
    const fiftyFifty = realCost + roundTo1000((price - realCost) * 0.5);
    const floor = roundTo1000(price * 0.9); // never discount more than 10%
    hargaBest = Math.max(fiftyFifty, floor);
  } else {
    hargaBest = roundTo1000(price * 0.97); // no cost → 3% ceiling
  }
  // Guard: never quote below our real (cashback-adjusted) cost…
  if (realCost > 0) hargaBest = Math.max(hargaBest, realCost);
  // …and if there's no room left at all, hold the price — never quote a loss.
  let noNego = false;
  if (hargaBest >= price) {
    hargaBest = price;
    noNego = true;
  }
  return {hargaBest, pakaiModal, realCost, noNego};
}

async function adminGraphql(env, query, variables) {
  const shop = readEnvVar(env, 'PUBLIC_STORE_DOMAIN');
  const clientId = readEnvVar(env, 'SHOPIFY_APP_CLIENT_ID');
  const clientSecret = readEnvVar(env, 'SHOPIFY_APP_CLIENT_SECRET');
  if (!shop || !clientId || !clientSecret) throw new Error('missing admin credentials');

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });
  if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
  const {access_token} = await tokenRes.json();

  const res = await fetch(`https://${shop}/admin/api/2026-01/graphql.json`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': access_token},
    body: JSON.stringify({query, variables}),
  });
  if (!res.ok) throw new Error(`admin gql ${res.status}`);
  return res.json();
}

export async function loader() {
  return json({ok: false, error: 'method not allowed'}, {status: 405, headers: CORS});
}

export async function action({request, context}) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: CORS});
  }
  const env = context?.env;

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Auth — shared staff password validated server-side (revoke by changing the env var)
  const staffPassword = readEnvVar(env, 'STAFF_TOOL_PASSWORD');
  if (!staffPassword || body.password !== staffPassword) {
    return json({ok: false, error: 'unauthorized'}, {status: 401, headers: CORS});
  }

  try {
    if (body.action === 'get') {
      const handle = String(body.handle || '').trim();
      if (!handle) return json({ok: false, error: 'handle required'}, {status: 400, headers: CORS});

      const data = await adminGraphql(env, PRODUCT_BY_HANDLE, {q: `handle:${handle}`});
      const node = data?.data?.products?.nodes?.[0];
      if (!node) return json({ok: false, error: 'produk tidak ditemukan'}, {status: 404, headers: CORS});

      const variants = (node.variants?.nodes ?? []).map((v) => {
        const price = parseFloat(v.price) || 0;
        const compareAt = parseFloat(v.compareAtPrice) || 0;
        const cost = parseFloat(v.inventoryItem?.unitCost?.amount) || 0;
        const {hargaBest, pakaiModal, realCost, noNego} = computeHargaBest(price, compareAt, cost);
        const hasCoret = compareAt > price && cost > 0;
        // ONE margin only — the REAL profit. When there's a coret, that discount is the brand
        // cashback we claim, so our true cost is realCost (modal setelah cashback), NOT the raw
        // cost. realCost already equals cost when there's no coret, so this is correct either way.
        const netMargin = cost > 0 ? price - realCost : 0; // = compareAt − cost when a coret exists
        const netMarginPct = cost > 0 && price > 0 ? netMargin / price : 0;
        return {
          variantId: v.id,
          inventoryItemId: v.inventoryItem?.id || null,
          title: v.title,
          price,
          compareAt,
          cost,
          netMargin,
          netMarginPct,
          modalAsli: hasCoret ? realCost : null, // after-cashback cost — shown only when a coret exists
          hargaBest,
          hasCost: cost > 0,
          pakaiModal,
          noNego,
          copyText: `Harga best menjadi Rp ${hargaBest.toLocaleString('id-ID')} ya ka\nKhusus pembayaran debit, cash atau transfer ya.`,
        };
      });

      return json({ok: true, product: {title: node.title, handle: node.handle}, variants}, {headers: CORS});
    }

    if (body.action === 'set') {
      const inventoryItemId = String(body.inventoryItemId || '');
      const cost = Number(body.cost);
      if (!inventoryItemId || !(cost >= 0)) {
        return json({ok: false, error: 'inventoryItemId & cost wajib diisi'}, {status: 400, headers: CORS});
      }
      const data = await adminGraphql(env, UPDATE_COST, {id: inventoryItemId, cost: String(cost)});
      const errs = data?.data?.inventoryItemUpdate?.userErrors ?? [];
      if (errs.length) {
        return json({ok: false, error: errs.map((e) => e.message).join('; ')}, {status: 400, headers: CORS});
      }
      const saved = data?.data?.inventoryItemUpdate?.inventoryItem?.unitCost?.amount;
      return json({ok: true, cost: parseFloat(saved) || cost}, {headers: CORS});
    }

    return json({ok: false, error: 'unknown action'}, {status: 400, headers: CORS});
  } catch (e) {
    return json({ok: false, error: e?.message ?? 'server error'}, {status: 500, headers: CORS});
  }
}

const PRODUCT_BY_HANDLE = `query($q: String!) {
  products(first: 1, query: $q) {
    nodes {
      id
      title
      handle
      variants(first: 100) {
        nodes {
          id
          title
          price
          compareAtPrice
          inventoryItem { id unitCost { amount } }
        }
      }
    }
  }
}`;

const UPDATE_COST = `mutation($id: ID!, $cost: Decimal!) {
  inventoryItemUpdate(id: $id, input: { cost: $cost }) {
    inventoryItem { id unitCost { amount } }
    userErrors { field message }
  }
}`;
