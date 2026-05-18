import { json } from '@shopify/remix-oxygen';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

export async function action({ request }) {
  if (request.method !== 'POST') return json({ ok: true });

  try {
    const { refCode, url } = await request.json();
    if (!refCode) return json({ ok: true });

    // Verify affiliate exists and is approved
    const affRes = await fetch(`${FIRESTORE_BASE}/affiliates/${refCode}?key=${FIRESTORE_KEY}`);
    if (!affRes.ok) return json({ ok: true });
    const affDoc = await affRes.json();
    if (affDoc.fields?.status?.stringValue !== 'approved') return json({ ok: true });

    // Increment totalClicks
    const current = parseInt(affDoc.fields?.totalClicks?.integerValue || 0);
    fetch(`${FIRESTORE_BASE}/affiliates/${refCode}?key=${FIRESTORE_KEY}&updateMask.fieldPaths=totalClicks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { totalClicks: { integerValue: String(current + 1) } } }),
    }).catch(() => {});

    // Log click record (fire and forget)
    const clickId = `${refCode}_${Date.now()}`;
    fetch(`${FIRESTORE_BASE}/affiliate_clicks/${clickId}?key=${FIRESTORE_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          refCode: { stringValue: refCode },
          url: { stringValue: url || '/' },
          createdAt: { stringValue: new Date().toISOString() },
        },
      }),
    }).catch(() => {});

    return json({ ok: true });
  } catch {
    return json({ ok: true });
  }
}
