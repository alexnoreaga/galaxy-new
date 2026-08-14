// Batched social proof from Firestore — 1 batchGet for all sold_counts + chunked IN query for
// reviews (approved only), instead of 2 round-trips PER product. Extracted from the homepage
// loader so collection pages get the same fast path. Firebase web key is public by design
// (Firestore rules control access).

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

export async function getSocialProof(handles) {
  const list = [...new Set((handles || []).filter(Boolean))];
  const soldCounts = {};
  const reviewSummaries = {};
  if (list.length === 0) return { soldCounts, reviewSummaries };
  await Promise.all([
    (async () => {
      try {
        const documents = list.map(h => `projects/galaxypwa/databases/(default)/documents/sold_counts/${h}`);
        const r = await fetch(`${FIRESTORE_BASE}:batchGet?key=${FIRESTORE_KEY}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents }),
        });
        const rows = r.ok ? await r.json() : [];
        for (const row of rows) {
          if (row.found) soldCounts[row.found.name.split('/').pop()] = parseInt(row.found.fields?.count?.integerValue || 0);
        }
      } catch { /* best effort */ }
    })(),
    (async () => {
      try {
        const chunks = [];
        for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));
        const perHandle = {};
        await Promise.all(chunks.map(async chunk => {
          const r = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            // Single-field IN (no composite index needed); status filtered client-side
            body: JSON.stringify({ structuredQuery: {
              from: [{ collectionId: 'reviews' }],
              where: { fieldFilter: { field: { fieldPath: 'productHandle' }, op: 'IN', value: { arrayValue: { values: chunk.map(h => ({ stringValue: h })) } } } },
              select: { fields: [{ fieldPath: 'productHandle' }, { fieldPath: 'rating' }, { fieldPath: 'status' }] },
              limit: 300,
            } }),
          });
          const rows = r.ok ? await r.json() : [];
          for (const row of rows) {
            const f = row.document?.fields;
            if (!f || f.status?.stringValue !== 'approved') continue;
            const h = f.productHandle?.stringValue;
            if (!h) continue;
            (perHandle[h] = perHandle[h] || []).push(parseInt(f.rating?.integerValue || 5));
          }
        }));
        for (const h in perHandle) {
          const rs = perHandle[h];
          reviewSummaries[h] = { count: rs.length, avg: parseFloat((rs.reduce((s, x) => s + x, 0) / rs.length).toFixed(1)) };
        }
      } catch { /* best effort */ }
    })(),
  ]);
  return { soldCounts, reviewSummaries };
}
