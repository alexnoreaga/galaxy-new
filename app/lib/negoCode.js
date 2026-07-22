// ── Grisela nego discount codes ───────────────────────────────────────────────
// Creates a REAL Shopify discount code, sized by the same 50:50-cost logic as the
// staff "harga best" tool (10% ceiling), or a flat 3% when the variant has no cost.
//
// SECURITY: the amount is always computed here from AUTHORITATIVE Shopify data
// (price + Cost per item fetched via Admin API) — never from anything the client sends.
// Guardrails: product-scoped, usageLimit 1, 24h expiry, and it refuses to stack on an
// active flash-sale discount (that could go below cost).

import { readEnvVar, getAutomaticDiscounts, findProductAutoDiscount } from '~/lib/autoDiscounts';

const MAX_DISCOUNT_PCT = 0.10;        // hard ceiling — matches hargaBest.js
const CODE_TTL_HOURS = 24;
const roundTo1000 = (n) => Math.round(n / 1000) * 1000;

async function adminToken(env) {
  const shop = readEnvVar(env, 'PUBLIC_STORE_DOMAIN');
  const clientId = readEnvVar(env, 'SHOPIFY_APP_CLIENT_ID');
  const clientSecret = readEnvVar(env, 'SHOPIFY_APP_CLIENT_SECRET');
  if (!shop || !clientId || !clientSecret) throw new Error('missing admin credentials');
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const { access_token } = await res.json();
  return { shop, access_token };
}

async function adminGql(env, query, variables) {
  const { shop, access_token } = await adminToken(env);
  const res = await fetch(`https://${shop}/admin/api/2026-01/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': access_token },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`gql ${res.status}`);
  return res.json();
}

function randomCode() {
  const s = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GLX-NEGO-${s}`;
}

const VARIANT_QUERY = `query($id: ID!) {
  product(id: $id) {
    title
    variants(first: 100) {
      nodes { id price compareAtPrice inventoryItem { unitCost { amount } } }
    }
  }
}`;

const CREATE_MUTATION = `mutation($d: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $d) {
    codeDiscountNode { id }
    userErrors { field message }
  }
}`;

/**
 * Create a nego code for one product. Returns { code, amount, endsAt, mode } on success,
 * or { skip, reason } when it declines (flash sale active, no margin, bad data, error).
 */
export async function createNegoCode(env, { productGid, variantGid }) {
  try {
    if (!productGid) return { skip: true, reason: 'no-product' };

    // Never stack on an active flash-sale discount — could go below cost
    const discounts = await getAutomaticDiscounts(env).catch(() => []);
    const flash = findProductAutoDiscount(discounts, productGid);
    if (flash && (!flash.variantIds || (variantGid && flash.variantIds.includes(variantGid)))) {
      return { skip: true, reason: 'flash-active' };
    }

    // Authoritative price + cost straight from Shopify
    const data = await adminGql(env, VARIANT_QUERY, { id: productGid });
    const variants = data?.data?.product?.variants?.nodes ?? [];
    const v = (variantGid && variants.find((x) => x.id === variantGid)) || variants[0];
    if (!v) return { skip: true, reason: 'no-variant' };

    const price = Number(parseFloat(v.price ?? 0));
    if (!price) return { skip: true, reason: 'no-price' };
    const compareAt = Number(parseFloat(v.compareAtPrice ?? 0));
    const diskonBerjalan = compareAt > price ? compareAt - price : 0;
    const cost = Number(parseFloat(v.inventoryItem?.unitCost?.amount ?? 0));
    const realCost = cost > 0 ? cost - diskonBerjalan : 0;

    // 50:50 when a valid cost exists, else flat 3% — both capped at MAX_DISCOUNT_PCT
    let amount;
    let mode;
    if (realCost > 0 && realCost < price) {
      amount = roundTo1000((price - realCost) * 0.5);
      mode = '50:50';
    } else {
      amount = roundTo1000(price * 0.03);
      mode = '3%';
    }
    const ceiling = roundTo1000(price * MAX_DISCOUNT_PCT);
    if (amount > ceiling) amount = ceiling;
    if (amount < 1000) return { skip: true, reason: 'too-small' };

    const now = new Date();
    const endsAt = new Date(now.getTime() + CODE_TTL_HOURS * 3600 * 1000);
    const code = randomCode();

    const res = await adminGql(env, CREATE_MUTATION, {
      d: {
        title: `Nego Grisela ${code}`,
        code,
        startsAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
        usageLimit: 1,
        appliesOncePerCustomer: true,
        customerSelection: { all: true },
        customerGets: {
          value: { discountAmount: { amount, appliesOnEachItem: false } },
          items: { products: { productsToAdd: [productGid] } },
        },
      },
    });
    const errs = res?.data?.discountCodeBasicCreate?.userErrors ?? [];
    if (errs.length > 0) {
      console.error('[negoCode] create failed:', JSON.stringify(errs).slice(0, 200));
      return { skip: true, reason: 'create-error' };
    }
    return { code, amount, endsAt: endsAt.toISOString(), mode };
  } catch (e) {
    console.error('[negoCode] error:', e?.message ?? e);
    return { skip: true, reason: 'error' };
  }
}
