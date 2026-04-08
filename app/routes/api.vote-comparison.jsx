import { json } from '@shopify/remix-oxygen';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

// Simple in-memory rate limiter: IP → { count, resetAt }
const rateLimitMap = new Map();
const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 3;  // max 3 votes per IP per minute (across all comparisons)

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_PER_WINDOW) return true;
  entry.count++;
  return false;
}

export async function action({ request }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Rate limit by IP
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  if (isRateLimited(ip)) {
    return json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 });
  }

  let slug, side;
  try {
    ({ slug, side } = await request.json());
  } catch {
    return json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!slug || (side !== 'A' && side !== 'B')) {
    return json({ error: 'Invalid params' }, { status: 400 });
  }

  // Validate slug format (only alphanumeric and hyphens)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return json({ error: 'Invalid slug' }, { status: 400 });
  }

  const fieldPath = side === 'A' ? 'votesA' : 'votesB';

  try {
    const res = await fetch(
      `${FIRESTORE_BASE}:commit?key=${FIRESTORE_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writes: [{
            transform: {
              document: `projects/galaxypwa/databases/(default)/documents/comparisons/${slug}`,
              fieldTransforms: [{ fieldPath, increment: { integerValue: '1' } }],
            },
          }],
        }),
      }
    );

    if (!res.ok) {
      return json({ error: 'Failed to save vote' }, { status: 500 });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Server error' }, { status: 500 });
  }
}
