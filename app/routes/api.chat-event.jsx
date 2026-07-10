import { json } from '@shopify/remix-oxygen';

const FIREBASE_PROJECT = 'galaxypwa';
const FIREBASE_API_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU'; // Firebase web key — public by design, access gated by Firestore rules
const FIREBASE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

const ALLOWED_TYPES = new Set([
  'chat_opened',
  'product_card_clicked',
  'voucher_copied',
  'wa_clicked',
  'bio_link_clicked',
  'marketplace_clicked',
]);

export async function action({ request }) {
  try {
    const { type, handle = '', sessionId = '', meta = '' } = await request.json();
    if (!ALLOWED_TYPES.has(type)) return json({ ok: false }, { status: 400 });

    await fetch(`${FIREBASE_BASE}/chat_events?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          type: { stringValue: type },
          handle: { stringValue: String(handle).slice(0, 200) },
          session_id: { stringValue: String(sessionId).slice(0, 64) },
          meta: { stringValue: String(meta).slice(0, 200) },
          created_at: { timestampValue: new Date().toISOString() },
        },
      }),
    });
  } catch {
    // analytics must never break anything
  }
  return json({ ok: true });
}
