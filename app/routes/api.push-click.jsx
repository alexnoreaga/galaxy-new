import { json } from '@shopify/remix-oxygen';

// Notification click beacon → Firestore `push_clicks/{logId}__{random}` (galaxypwa).
//
// Called by public/firebase-messaging-sw.js when a shopper taps a push notification. `logId` is
// the push_log document id the sender put into the message data, so the staff panel can count
// clicks per send (harga-produk /api/push-send aggregates with the service account).
// Public web key by design — rules: allow create with keys [logId, at, ua] only, deny the rest.
const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
const LOG_ID_RE = /^[a-z]+_[A-Za-z0-9_-]{1,60}$/; // manual_1758..., test_..., flash_<discountId>

export async function action({ request }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const body = await request.json().catch(() => ({}));
    const logId = String(body?.logId || '');
    if (!LOG_ID_RE.test(logId)) return json({ error: 'logId invalid' }, { status: 400 });
    const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const ua = (request.headers.get('user-agent') || '').slice(0, 200);
    const res = await fetch(`${FIRESTORE_BASE}/push_clicks?documentId=${logId}__${rand}&key=${FIRESTORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { logId: { stringValue: logId }, at: { stringValue: new Date().toISOString() }, ua: { stringValue: ua } } }),
    });
    if (!res.ok) {
      console.error('[push-click] firestore', res.status, (await res.text()).slice(0, 200));
      return json({ error: 'Failed' }, { status: 502 });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Failed' }, { status: 500 });
  }
}
