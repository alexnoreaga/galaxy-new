import { json } from '@shopify/remix-oxygen';

// FCM device tokens → Firestore `push_tokens/{sha256(token)}` (galaxypwa).
//
// The template version wrote to a Cloudflare KV binding that does not exist on Vercel, so for a
// long time every "granted" permission was silently dropped. Now: one doc per device, upserted
// (token + user agent + lastSeen). The web key is public by design — Firestore rules must allow
// create/update on push_tokens and deny read; the staff sender (harga-produk /api/push-send)
// reads the collection with the service account.
const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function action({ request }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string' || token.length < 50 || token.length > 4096) {
      return json({ error: 'Token is required' }, { status: 400 });
    }
    const id = await sha256Hex(token);
    const ua = (request.headers.get('user-agent') || '').slice(0, 200);
    const now = new Date().toISOString();
    const res = await fetch(
      `${FIRESTORE_BASE}/push_tokens/${id}?updateMask.fieldPaths=token&updateMask.fieldPaths=ua&updateMask.fieldPaths=lastSeen&key=${FIRESTORE_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { token: { stringValue: token }, ua: { stringValue: ua }, lastSeen: { stringValue: now } } }),
      },
    );
    if (!res.ok) {
      console.error('[save-token] firestore', res.status, (await res.text()).slice(0, 200));
      return json({ error: 'Failed to save token' }, { status: 502 });
    }
    return json({ success: true });
  } catch (error) {
    console.error('Error saving token:', error);
    return json({ error: 'Failed to save token' }, { status: 500 });
  }
}
