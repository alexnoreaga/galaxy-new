// Cost snapshot-diff sync — run on a schedule (GitHub Action) to keep the harga-modal
// monitor current. Reads every product's per-variant Cost per item (unitCost) from the
// Shopify Admin API, diffs against the last snapshot in Firestore `product_costs`, logs
// real changes to `cost_history`, and updates each product's fill status.
//
// Credentials: Shopify from env (SHOPIFY_APP_CLIENT_ID / SHOPIFY_APP_CLIENT_SECRET /
// PUBLIC_STORE_DOMAIN) — set as GitHub Action secrets. Falls back to the local .env for
// manual runs. Firebase uses the public web key (gated by Firestore rules).
import fs from 'node:fs';

function fromDotEnv(key) {
  try {
    for (const line of fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch { /* no .env in CI — that's fine */ }
  return undefined;
}
const cfg = (key) => process.env[key] ?? fromDotEnv(key);

const SHOP = cfg('PUBLIC_STORE_DOMAIN');
const CID = cfg('SHOPIFY_APP_CLIENT_ID');
const SEC = cfg('SHOPIFY_APP_CLIENT_SECRET');
// Firebase web key is public by design (Firestore rules control access)
const FB_PROJECT = 'galaxypwa';
const FB_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FS = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

if (!SHOP || !CID || !SEC) {
  console.error('Missing Shopify credentials (PUBLIC_STORE_DOMAIN / SHOPIFY_APP_CLIENT_ID / SHOPIFY_APP_CLIENT_SECRET)');
  process.exit(1);
}

const S = (v) => ({ stringValue: String(v ?? '') });
const I = (v) => ({ integerValue: String(Math.round(v ?? 0)) });
const T = () => ({ timestampValue: new Date().toISOString() });

async function adminToken() {
  const r = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${CID}&client_secret=${SEC}`,
  });
  if (!r.ok) throw new Error(`token ${r.status}`);
  return (await r.json()).access_token;
}
async function adminGql(token, query, variables) {
  const r = await fetch(`https://${SHOP}/admin/api/2026-01/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}
const fsGet = (coll, id) => fetch(`${FS}/${coll}/${id}?key=${FB_KEY}`).then((r) => (r.ok ? r.json() : null));
const fsPatch = (coll, id, fields) => fetch(`${FS}/${coll}/${id}?key=${FB_KEY}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
const fsCreate = (coll, fields) => fetch(`${FS}/${coll}?key=${FB_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });

const PRODUCTS_Q = `query($cursor: String) {
  products(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id title handle variants(first: 100) { nodes { id title price inventoryItem { unitCost { amount } } } } }
  }
}`;

async function main() {
  const token = await adminToken();
  let cursor = null, page = 0, scanned = 0, newDocs = 0, changed = 0, historyLogged = 0;
  const summary = { filled: 0, partial: 0, empty: 0 };

  while (true) {
    const res = await adminGql(token, PRODUCTS_Q, { cursor });
    if (res.errors) { console.error('GQL ERR', JSON.stringify(res.errors).slice(0, 300)); break; }
    const conn = res.data.products;
    for (const p of conn.nodes) {
      scanned++;
      const pid = p.id.split('/').pop();
      const variants = p.variants.nodes.map((v) => ({ id: v.id.split('/').pop(), title: v.title, price: Math.round(+v.price || 0), cost: Math.round(+(v.inventoryItem?.unitCost?.amount || 0)) }));
      const filledV = variants.filter((v) => v.cost > 0).length;
      const status = filledV === 0 ? 'empty' : (filledV === variants.length ? 'filled' : 'partial');
      summary[status]++;
      const minCost = Math.min(...variants.filter((v) => v.cost > 0).map((v) => v.cost), 0) || 0;
      const price = Math.min(...variants.map((v) => v.price).filter(Boolean), 0) || (variants[0]?.price ?? 0);

      const existing = await fsGet('product_costs', pid);
      const prevVariants = {};
      for (const vv of existing?.fields?.variants?.arrayValue?.values ?? []) {
        const f = vv.mapValue.fields; prevVariants[f.id.stringValue] = parseInt(f.cost?.integerValue || 0);
      }
      let didChange = !existing;
      for (const v of variants) {
        const prev = prevVariants[v.id];
        if (existing && prev !== undefined && prev !== v.cost && !(prev === 0 && v.cost === 0)) {
          await fsCreate('cost_history', { productId: S(pid), handle: S(p.handle), title: S(p.title), variantTitle: S(v.title), oldCost: I(prev), newCost: I(v.cost), changed_at: T() });
          historyLogged++; didChange = true;
        }
      }
      if (!existing) newDocs++; else if (didChange) changed++;

      if (!existing || didChange) {
        await fsPatch('product_costs', pid, {
          productId: S(pid), handle: S(p.handle), title: S(p.title),
          totalVariants: I(variants.length), filledVariants: I(filledV), status: S(status),
          minCost: I(minCost), price: I(price),
          variants: { arrayValue: { values: variants.map((v) => ({ mapValue: { fields: { id: S(v.id), title: S(v.title), price: I(v.price), cost: I(v.cost) } } })) } },
          ...(didChange && existing ? { lastChangedAt: T() } : {}),
          synced_at: T(),
        });
      }
    }
    page++;
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  console.log(`scanned ${scanned} products across ${page} page(s)`);
  console.log(`status: filled ${summary.filled} | partial ${summary.partial} | empty ${summary.empty}`);
  console.log(`firestore: new ${newDocs}, changed ${changed}, history logged ${historyLogged}`);
}

main().catch((e) => { console.error('SYNC FAILED:', e?.message ?? e); process.exit(1); });
