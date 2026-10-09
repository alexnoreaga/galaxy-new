import { json } from '@shopify/remix-oxygen';

// Newsletter / promo opt-in → Shopify customer with email marketing consent SUBSCRIBED, so
// Shopify Email campaigns and automations have an audience. Works without a password-backed
// account (Admin API, server side); the register form uses Storefront acceptsMarketing instead.
//   POST { email, source }   → { ok, status: 'subscribed' | 'already' }
// Needs the custom app to have read_customers + write_customers (Admin → Apps → Develop apps →
// Configuration). Until then it answers 503 with `needsScope` so the UI can say "coba lagi nanti".
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCES = new Set(['footer', 'flash-sale', 'produk', 'cuci-gudang', 'account']);
const hits = new Map(); // ip → [timestamps] (best-effort per instance)
const LIMIT = 6, WINDOW = 10 * 60 * 1000;

async function adminToken(env) {
  const shop = env.PUBLIC_STORE_DOMAIN, id = env.SHOPIFY_APP_CLIENT_ID, secret = env.SHOPIFY_APP_CLIENT_SECRET;
  if (!shop || !id || !secret) throw new Error('admin env missing');
  const r = await fetch(`https://${shop}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=client_credentials&client_id=${id}&client_secret=${secret}` });
  const j = await r.json();
  if (!j.access_token) throw new Error('admin token');
  return { shop, token: j.access_token };
}
async function gql(ctx, query, variables) {
  const r = await fetch(`https://${ctx.shop}/admin/api/2026-01/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ctx.token }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) { const e = new Error(j.errors.map((x) => x.message).join('; ')); e.accessDenied = j.errors.some((x) => x.extensions?.code === 'ACCESS_DENIED'); throw e; }
  return j.data;
}

export async function action({ request, context }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  const body = await request.json().catch(() => ({}));
  if (body?.website) return json({ ok: true, status: 'subscribed' }); // honeypot filled → pretend
  const email = String(body?.email || '').trim().toLowerCase();
  const source = SOURCES.has(body?.source) ? body.source : 'footer';
  if (!EMAIL_RE.test(email) || email.length > 120) return json({ error: 'Email tidak valid' }, { status: 400 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('cf-connecting-ip') || 'na';
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  if (arr.length >= LIMIT) return json({ error: 'Terlalu sering, coba lagi nanti' }, { status: 429 });
  arr.push(now); hits.set(ip, arr); if (hits.size > 2000) hits.clear();

  try {
    const ctx = await adminToken(context.env);
    // no consentUpdatedAt: Shopify rejects any timestamp it considers "in the future" (clock skew) and fills it itself
    const consent = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' };
    // customerByIdentifier reads the primary store; customers(query:) is a search index that lags
    // several seconds behind a fresh create and made the second signup collide ("already taken").
    const found = await gql(ctx, `query($email: String!) { customerByIdentifier(identifier: { emailAddress: $email }) { id emailMarketingConsent { marketingState } tags } }`, { email });
    const existing = found?.customerByIdentifier;
    if (existing) {
      if (existing.emailMarketingConsent?.marketingState === 'SUBSCRIBED') return json({ ok: true, status: 'already' });
      const upd = await gql(ctx, `mutation($input: CustomerEmailMarketingConsentUpdateInput!) { customerEmailMarketingConsentUpdate(input: $input) { userErrors { field message } } }`,
        { input: { customerId: existing.id, emailMarketingConsent: consent } });
      const err = upd?.customerEmailMarketingConsentUpdate?.userErrors?.[0];
      if (err) throw new Error(err.message);
      await gql(ctx, `mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`, { id: existing.id, tags: ['newsletter', `newsletter-${source}`] }).catch(() => {});
      return json({ ok: true, status: 'subscribed' });
    }
    const created = await gql(ctx, `mutation($input: CustomerInput!) { customerCreate(input: $input) { customer { id } userErrors { field message } } }`,
      { input: { email, emailMarketingConsent: consent, tags: ['newsletter', `newsletter-${source}`], note: `Daftar promo via website (${source})` } });
    const err = created?.customerCreate?.userErrors?.[0];
    if (err && /already been taken/i.test(err.message)) return json({ ok: true, status: 'already' }); // race with a parallel signup
    if (err) throw new Error(err.message);
    return json({ ok: true, status: 'subscribed' });
  } catch (e) {
    console.error('[newsletter]', e?.message || e);
    if (e?.accessDenied) return json({ error: 'Pendaftaran email belum aktif, coba lagi nanti', needsScope: true }, { status: 503 });
    return json({ error: 'Gagal mendaftar, coba lagi' }, { status: 500 });
  }
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
