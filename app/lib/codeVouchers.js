// ── Public voucher codes straight from Shopify Discounts (Admin API), module-cached 5 min ─
// Replaces the hand-typed `discount_voucher` metaobject: the website used to show whatever a
// staff member typed (stale "s/d 30 Sep"), while the real codes in Shopify had other dates or
// no end date at all. Consumers (homepage, product page, /promo, Grisela) still receive the
// old metaobject shape ({ metaobjects: { edges, nodes } } with key/value fields), so no UI changed.
//
// Which codes are public: ACTIVE, code starts with "GLX", not a Grisela nego code (GLX-NEGO-…),
// available to all customers, not a single-use code, and not already used up.
import { readEnvVar } from './autoDiscounts.js';

let cache = { at: 0, data: null };
const TTL = 5 * 60 * 1000;

const rp = (n) => `Rp${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;

export function isPublicVoucherCode(code) {
  const c = String(code || '').toUpperCase();
  return c.startsWith('GLX') && !c.startsWith('GLX-NEGO');
}

export async function getPublicVouchers(env) {
  if (cache.data && Date.now() - cache.at < TTL) return cache.data;
  const shop = readEnvVar(env, 'PUBLIC_STORE_DOMAIN');
  const clientId = readEnvVar(env, 'SHOPIFY_APP_CLIENT_ID');
  const clientSecret = readEnvVar(env, 'SHOPIFY_APP_CLIENT_SECRET');
  if (!shop || !clientId || !clientSecret) throw new Error('codeVouchers: missing Shopify app env');

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });
  if (!tokenRes.ok) throw new Error(`codeVouchers token ${tokenRes.status}`);
  const { access_token } = await tokenRes.json();

  const gqlRes = await fetch(`https://${shop}/admin/api/2026-01/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': access_token },
    body: JSON.stringify({
      query: `{
        codeDiscountNodes(first: 50, query: "status:active", sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            codeDiscount {
              __typename
              ... on DiscountCodeBasic {
                title status startsAt endsAt usageLimit asyncUsageCount appliesOncePerCustomer
                codes(first: 1) { nodes { code } }
                customerSelection { __typename }
                minimumRequirement {
                  __typename
                  ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount } }
                }
                customerGets {
                  value {
                    __typename
                    ... on DiscountAmount { amount { amount } }
                    ... on DiscountPercentage { percentage }
                  }
                }
              }
            }
          }
        }
      }`,
    }),
  });
  if (!gqlRes.ok) throw new Error(`codeVouchers gql ${gqlRes.status}`);
  const body = await gqlRes.json();
  if (body.errors) throw new Error(`codeVouchers: ${JSON.stringify(body.errors).slice(0, 200)}`);

  const now = Date.now();
  const list = [];
  for (const n of body.data?.codeDiscountNodes?.nodes ?? []) {
    const d = n.codeDiscount;
    if (d?.__typename !== 'DiscountCodeBasic') continue;
    const code = d.codes?.nodes?.[0]?.code || '';
    if (!isPublicVoucherCode(code)) continue;
    if (d.customerSelection?.__typename !== 'DiscountCustomerAll') continue; // segment-only codes stay private
    if (d.usageLimit === 1) continue; // single-use (nego-style) codes are never public
    if (d.usageLimit && Number(d.asyncUsageCount) >= Number(d.usageLimit)) continue; // used up
    if (d.startsAt && Date.parse(d.startsAt) > now) continue;
    if (d.endsAt && Date.parse(d.endsAt) < now) continue;
    const v = d.customerGets?.value || {};
    const isPct = v.__typename === 'DiscountPercentage';
    const amount = isPct ? Math.round((Number(v.percentage) || 0) * 100) : Math.round(Number(v.amount?.amount) || 0);
    if (!amount) continue;
    const min = Number(d.minimumRequirement?.greaterThanOrEqualToSubtotal?.amount) || 0;
    list.push({
      id: n.id,
      code,
      amount,
      isPct,
      min,
      endsAt: d.endsAt || '',
      description: `${isPct ? `Diskon ${amount}%` : `Potongan ${rp(amount)}`}${min ? ` untuk belanja min. ${rp(min)}` : ''} — order via website`,
    });
  }
  // small-basket vouchers first (the way the homepage strip reads naturally)
  list.sort((a, b) => a.min - b.min || a.amount - b.amount);

  const nodes = list.map((x) => ({
    id: x.id,
    handle: x.code.toLowerCase(),
    fields: [
      { key: 'code', value: x.code },
      { key: 'discount_value', value: String(x.amount) },
      { key: 'discount_type', value: x.isPct ? 'percentage' : 'fixed' },
      { key: 'description', value: x.description },
      { key: 'min_purchase', value: x.min ? rp(x.min) : '' },
      { key: 'expiry_date', value: x.endsAt },
    ],
  }));
  const data = { metaobjects: { nodes, edges: nodes.map((node) => ({ node })) }, source: 'shopify-discounts' };
  cache = { at: now, data };
  return data;
}
