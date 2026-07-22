// ── "Harga best" for staff (secret double-click on the product image) ─────────
// Cost comes from Shopify's per-variant "Cost per item" (InventoryItem.unitCost), which is
// Admin-API only — so the raw cost never ships to the browser.
//
// Formula mirrors KalkulatorHarga v3 ("Bagi 2") in the harga-produk dashboard, so both
// tools always quote the same number:
//     realCost  = cost − (compareAt − price)   // a running promo lowers our true cost too
//     hargaBest = realCost + roundTo1000((price − realCost) × 0.50)
// No usable cost → fall back to the standard 3% nego ceiling.

import { readEnvVar } from '~/lib/autoDiscounts';

const costCache = new Map(); // productId -> { at, costs: {variantId: number} }
const TTL = 5 * 60 * 1000;

// Hard cap on the "harga best" discount — the giveaway can never exceed this fraction of price.
// Safety net against a too-low cost typo and a guard against over-discounting fat-margin items.
const MAX_DISCOUNT_PCT = 0.10;

function roundTo1000(n) {
  return Math.round(n / 1000) * 1000;
}

/** Per-variant "Cost per item" from the Admin API. Returns {} on any failure — callers fall back. */
export async function getVariantCosts(env, productId) {
  if (!productId) return {};
  const hit = costCache.get(productId);
  if (hit && Date.now() - hit.at < TTL) return hit.costs;

  try {
    const shop = readEnvVar(env, 'PUBLIC_STORE_DOMAIN');
    const clientId = readEnvVar(env, 'SHOPIFY_APP_CLIENT_ID');
    const clientSecret = readEnvVar(env, 'SHOPIFY_APP_CLIENT_SECRET');
    if (!shop || !clientId || !clientSecret) throw new Error('missing admin credentials');

    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });
    if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
    const { access_token } = await tokenRes.json();

    const gqlRes = await fetch(`https://${shop}/admin/api/2026-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': access_token },
      body: JSON.stringify({
        query: `query($id: ID!) {
          product(id: $id) {
            variants(first: 100) {
              nodes { id inventoryItem { unitCost { amount } } }
            }
          }
        }`,
        variables: { id: productId },
      }),
    });
    if (!gqlRes.ok) throw new Error(`gql ${gqlRes.status}`);
    const data = await gqlRes.json();

    const costs = {};
    for (const v of data?.data?.product?.variants?.nodes ?? []) {
      const amount = v?.inventoryItem?.unitCost?.amount;
      if (amount && Number(amount) > 0) costs[v.id] = Number(amount);
    }
    costCache.set(productId, { at: Date.now(), costs });
    return costs;
  } catch (e) {
    console.error('[hargaBest] variant cost fetch failed:', e?.message ?? e);
    // Don't poison the cache on a transient failure — retry in ~30s instead of waiting the full TTL
    costCache.set(productId, { at: Date.now() - (TTL - 30 * 1000), costs: {} });
    return {};
  }
}

/**
 * Build { [variantId]: copyText } plus the set of variants backed by a real cost figure.
 * Every variant gets text — those without a cost fall back to 3%.
 */
export function buildHargaBest({ variants = [], costs = {} }) {
  const byVariant = {};
  const withRealCost = [];

  for (const v of variants) {
    const price = Number(parseFloat(v?.price?.amount ?? 0));
    if (!price) continue;

    const compareAt = Number(parseFloat(v?.compareAtPrice?.amount ?? 0));
    const diskonBerjalan = compareAt > price ? compareAt - price : 0;

    const cost = costs[v.id] ?? 0;
    const realCost = cost > 0 ? cost - diskonBerjalan : 0;

    // realCost >= price means bad data — safer to quote the 3% ceiling than under-cost
    const pakaiModal = realCost > 0 && realCost < price;
    let hargaBest;
    if (pakaiModal) {
      const fiftyFifty = realCost + roundTo1000((price - realCost) * 0.5);
      // Hard ceiling: never discount more than MAX_DISCOUNT_PCT of price. Protects against a
      // too-low cost typo (a dropped digit would otherwise compute a huge discount) and caps
      // fat-margin giveaways. Clamp UP to the floor price (= higher price / smaller discount).
      const floor = roundTo1000(price * (1 - MAX_DISCOUNT_PCT));
      hargaBest = Math.max(fiftyFifty, floor);
    } else {
      hargaBest = roundTo1000(price * 0.97);
    }

    if (pakaiModal) withRealCost.push(v.id);
    byVariant[v.id] = `Harga best menjadi Rp ${hargaBest.toLocaleString('id-ID')} ya ka\nKhusus pembayaran debit, cash atau transfer ya.`;
  }

  return { byVariant, withRealCost };
}
