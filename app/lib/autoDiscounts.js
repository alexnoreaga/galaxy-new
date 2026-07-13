// ── Shopify automatic discounts (flash sale) — Admin API, module-cached 5 min ─
// Shared by products.$handle.jsx (product page price) and flash-sale.jsx (countdown).

let autoDiscountsCache = { at: 0, list: [] };

// context.env doesn't always carry vars on Vercel — fall back to process.env (same fix as Gemini key)
export function readEnvVar(env, key) {
  return env?.[key] ?? (typeof process !== 'undefined' ? process.env?.[key] : undefined);
}

export async function getAutomaticDiscounts(env) {
  if (Date.now() - autoDiscountsCache.at < 5 * 60 * 1000) return autoDiscountsCache.list;
  try {
    const shop = readEnvVar(env, 'PUBLIC_STORE_DOMAIN');
    const clientId = readEnvVar(env, 'SHOPIFY_APP_CLIENT_ID');
    const clientSecret = readEnvVar(env, 'SHOPIFY_APP_CLIENT_SECRET');
    if (!shop || !clientId || !clientSecret) {
      throw new Error(`missing env — shop:${!!shop} clientId:${!!clientId} clientSecret:${!!clientSecret}`);
    }
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });
    if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}: ${(await tokenRes.text()).slice(0, 150)}`);
    const { access_token } = await tokenRes.json();

    const gqlRes = await fetch(`https://${shop}/admin/api/2026-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': access_token },
      body: JSON.stringify({
        query: `{
          automaticDiscountNodes(first: 25) {
            nodes {
              automaticDiscount {
                __typename
                ... on DiscountAutomaticBasic {
                  title
                  startsAt
                  endsAt
                  customerGets {
                    value {
                      __typename
                      ... on DiscountAmount { amount { amount } }
                      ... on DiscountPercentage { percentage }
                    }
                    items {
                      __typename
                      ... on DiscountProducts { products(first: 100) { nodes { id } } }
                      ... on AllDiscountItems { allItems }
                    }
                  }
                }
              }
            }
          }
        }`,
      }),
    });
    const data = await gqlRes.json();
    const list = (data?.data?.automaticDiscountNodes?.nodes ?? [])
      .map(n => n.automaticDiscount)
      .filter(d => d?.__typename === 'DiscountAutomaticBasic');
    autoDiscountsCache = { at: Date.now(), list };
  } catch (e) {
    console.error('[flash] auto discount fetch failed:', e?.message ?? e);
    // Don't poison the cache on a transient failure — keep old data, retry in ~30s
    autoDiscountsCache = { at: Date.now() - 4.5 * 60 * 1000, list: autoDiscountsCache.list };
  }
  return autoDiscountsCache.list;
}

// All product IDs covered by currently-active basic discounts → Map<productGid, discountInfo>
export function getActiveFlashProducts(discounts, max = 20) {
  const now = Date.now();
  const map = new Map();
  for (const d of discounts) {
    const startsOk = !d.startsAt || new Date(d.startsAt).getTime() <= now;
    const endsOk = !d.endsAt || new Date(d.endsAt).getTime() >= now;
    if (!startsOk || !endsOk) continue;
    const value = d.customerGets?.value;
    let info = null;
    if (value?.__typename === 'DiscountAmount') {
      const amount = parseFloat(value.amount?.amount ?? 0);
      if (amount > 0) info = { title: d.title, type: 'amount', amount, endsAt: d.endsAt ?? null };
    }
    if (value?.__typename === 'DiscountPercentage') {
      const pct = Number(value.percentage ?? 0);
      if (pct > 0) info = { title: d.title, type: 'percentage', percentage: pct, endsAt: d.endsAt ?? null };
    }
    if (!info) continue;
    for (const p of d.customerGets?.items?.products?.nodes ?? []) {
      if (map.size >= max) break;
      if (!map.has(p.id)) map.set(p.id, info);
    }
  }
  return map;
}

export function findProductAutoDiscount(discounts, productGid) {
  const now = Date.now();
  for (const d of discounts) {
    const startsOk = !d.startsAt || new Date(d.startsAt).getTime() <= now;
    const endsOk = !d.endsAt || new Date(d.endsAt).getTime() >= now;
    if (!startsOk || !endsOk) continue;
    const items = d.customerGets?.items;
    const applies =
      items?.allItems === true ||
      (items?.products?.nodes ?? []).some(p => p.id === productGid);
    if (!applies) continue;
    const value = d.customerGets?.value;
    if (value?.__typename === 'DiscountAmount') {
      const amount = parseFloat(value.amount?.amount ?? 0);
      if (amount > 0) return { title: d.title, type: 'amount', amount, endsAt: d.endsAt ?? null };
    }
    if (value?.__typename === 'DiscountPercentage') {
      const pct = Number(value.percentage ?? 0);
      if (pct > 0) return { title: d.title, type: 'percentage', percentage: pct, endsAt: d.endsAt ?? null };
    }
  }
  return null;
}
