// "Pencarian terakhir kamu" — per-device, localStorage only. Never leaves the browser.
// Every function is safe on the server and when storage is blocked (private mode etc.).

const KEY = 'galaxy_recent_searches';
const MAX = 8;

function read() {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string' && s.trim()) : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* storage blocked — silently skip */
  }
}

export function getRecentSearches() {
  return read();
}

export function addRecentSearch(term) {
  const t = String(term ?? '').trim();
  if (t.length < 2 || t.length > 60) return read();
  const lower = t.toLowerCase();
  const next = [t, ...read().filter((s) => s.toLowerCase() !== lower)].slice(0, MAX);
  write(next);
  return next;
}

export function removeRecentSearch(term) {
  const lower = String(term ?? '').toLowerCase();
  const next = read().filter((s) => s.toLowerCase() !== lower);
  write(next);
  return next;
}

export function clearRecentSearches() {
  write([]);
  return [];
}

// Fallback for "Pencarian populer" when the `pencarian_populer` metaobject is missing/empty.
// Seeded from Storefront BEST_SELLING on 2026-09-11; staff can override any time in Admin.
export const DEFAULT_POPULAR_SEARCHES = [
  'Sony ZV-E10',
  'Canon G7X Mark III',
  'Insta360 X5',
  'DJI Osmo Pocket 4',
  'Fujifilm X-S20',
  'Insta360 Ace Pro 2',
  'DJI Osmo Action 5 Pro',
  'Hollyland Lark M2',
  'Fujifilm X half',
  'DJI Mic Mini 2',
];

/** Parse the metaobject's fields → string[] (first list-typed field wins). */
export function parsePopularSearches(metaobjectNode) {
  const fields = metaobjectNode?.fields ?? [];
  for (const f of fields) {
    if (!f?.value) continue;
    let list = null;
    if (String(f.type ?? '').startsWith('list.')) {
      try { list = JSON.parse(f.value); } catch { list = null; }
    } else if (f.value.includes('\n')) {
      list = f.value.split('\n');
    }
    if (Array.isArray(list)) {
      const clean = list.map((s) => String(s ?? '').trim()).filter((s) => s.length >= 2);
      if (clean.length) return clean.slice(0, 10);
    }
  }
  return null;
}
