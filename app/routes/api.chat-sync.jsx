import { json } from '@shopify/remix-oxygen';

// Customer side of the staff live takeover.
//   GET  ?presence=1                              → { staffOnline, names }   (staff_presence, 20 s cache)
//   GET  ?conversationId=X[&since=N]              → { mode, staff, wantsStaff, total, messages }
//        `messages` = staff/system messages from index N on (omit `since` → just state + total)
//   POST { conversationId, wantsStaff: true }     → flags the conversation for staff pickup
// Conversation ids are unguessable Firestore auto-ids that the customer's own browser already holds.
const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const NO_STORE = { headers: { 'Cache-Control': 'no-store' } };
const ONLINE_WINDOW_MS = 120 * 1000; // heartbeat every 30 s from the dashboard
let presenceCache = { at: 0, data: { staffOnline: false, names: [] } };

const ts = () => ({ timestampValue: new Date().toISOString() });

export async function loader({ request }) {
  const url = new URL(request.url);
  if (url.searchParams.get('presence')) {
    if (Date.now() - presenceCache.at < 20 * 1000) return json(presenceCache.data, NO_STORE);
    try {
      const r = await fetch(`${BASE}/staff_presence?pageSize=50&key=${FIRESTORE_KEY}`);
      const j = r.ok ? await r.json() : {};
      const now = Date.now();
      const names = (j.documents || [])
        .filter((d) => now - Date.parse(d.fields?.last_seen?.timestampValue || 0) < ONLINE_WINDOW_MS)
        .map((d) => d.fields?.name?.stringValue || 'Staf');
      presenceCache = { at: now, data: { staffOnline: names.length > 0, names } };
    } catch {
      presenceCache = { at: Date.now(), data: { staffOnline: false, names: [] } };
    }
    return json(presenceCache.data, NO_STORE);
  }

  const id = url.searchParams.get('conversationId') || '';
  if (!ID_RE.test(id)) return json({ error: 'conversationId invalid' }, { status: 400 });
  const sinceRaw = url.searchParams.get('since');
  const since = sinceRaw == null ? null : Math.max(0, parseInt(sinceRaw, 10) || 0);
  const r = await fetch(`${BASE}/conversations/${id}?key=${FIRESTORE_KEY}`);
  if (!r.ok) return json({ error: 'not found' }, { status: 404, ...NO_STORE });
  const f = (await r.json()).fields || {};
  const msgs = f.messages?.arrayValue?.values || [];
  const mode = f.mode?.stringValue === 'staff' ? 'staff' : 'ai';
  const sf = f.staff?.mapValue?.fields;
  const staff = mode === 'staff' ? { name: sf?.name?.stringValue || 'Staf Galaxy' } : null;
  const messages = since == null ? [] : msgs.slice(since)
    .map((m) => { const mf = m.mapValue?.fields || {}; return { role: mf.role?.stringValue || 'ai', text: mf.text?.stringValue || '', name: mf.name?.stringValue || '' }; })
    .filter((m) => m.role === 'staff' || m.role === 'system');
  return json({ mode, staff, wantsStaff: !!f.wants_staff?.booleanValue, total: msgs.length, messages }, NO_STORE);
}

export async function action({ request }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  const body = await request.json().catch(() => ({}));
  const id = String(body?.conversationId || '');
  if (!ID_RE.test(id) || !body?.wantsStaff) return json({ error: 'invalid' }, { status: 400 });
  const fields = { wants_staff: { booleanValue: true }, wants_staff_at: ts(), updated_at: ts() };
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join('&');
  const r = await fetch(`${BASE}/conversations/${id}?key=${FIRESTORE_KEY}&${mask}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
  return json({ ok: r.ok }, NO_STORE);
}
