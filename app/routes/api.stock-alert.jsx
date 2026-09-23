import { json } from '@shopify/remix-oxygen';

// Customer subscribes a push token to a product: stock_alerts/{handle}__{sha256(token)}
//   POST { handle, title, kind: 'restock'|'price', price, token }
// Public web key by design — rules: allow create, update with keys
// [handle, title, token, kind, price_at, created_at, ua] only; read/delete denied (the notifier in
// harga-produk reads and deletes with the service account).
const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
const HANDLE_RE = /^[a-z0-9][a-z0-9._-]{0,200}$/;

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function action({ request }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const body = await request.json().catch(() => ({}));
    const handle = String(body?.handle || '').toLowerCase();
    const token = String(body?.token || '');
    const kind = body?.kind === 'price' ? 'price' : 'restock';
    const price = Math.max(0, Number(body?.price) || 0);
    if (!HANDLE_RE.test(handle) || token.length < 50 || token.length > 4096) return json({ error: 'invalid' }, { status: 400 });
    if (kind === 'price' && !price) return json({ error: 'price required' }, { status: 400 });
    const id = `${handle}__${(await sha256Hex(token)).slice(0, 32)}`;
    const fields = {
      handle: { stringValue: handle },
      title: { stringValue: String(body?.title || '').slice(0, 200) },
      token: { stringValue: token },
      kind: { stringValue: kind },
      price_at: { integerValue: String(Math.round(price)) },
      created_at: { timestampValue: new Date().toISOString() },
      ua: { stringValue: (request.headers.get('user-agent') || '').slice(0, 200) },
    };
    const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join('&');
    const r = await fetch(`${BASE}/stock_alerts/${id}?key=${FIRESTORE_KEY}&${mask}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
    if (!r.ok) {
      console.error('[stock-alert] firestore', r.status, (await r.text()).slice(0, 200));
      return json({ error: 'Failed' }, { status: 502 });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Failed' }, { status: 500 });
  }
}
