// Shared order-tracking lookup — used by the /lacak page AND by Grisela (api.ask)
// so "pesanan saya sampai mana?" answers from the same source of truth: our own
// website_orders via the harga-produk /api/lacak endpoint (service-account backed).
// harga-produk production (verified live: /api/ongkir 200, /api/lacak answers). Override via LACAK_API_BASE.
const API_BASE_DEFAULT = 'https://galaxy-internal-tools.vercel.app';

// context.env doesn't always carry vars on Vercel — fall back to process.env
// (same pattern as autoDiscounts.readEnvVar; inlined so this module has no alias deps)
const envVar = (env, key) => env?.[key] ?? (typeof process !== 'undefined' ? process.env?.[key] : undefined);

export async function lookupOrder(resi, hp, env) {
  const base = envVar(env, 'LACAK_API_BASE') ?? API_BASE_DEFAULT;
  try {
    const r = await fetch(`${base}/api/lacak?resi=${encodeURIComponent(resi)}&hp=${encodeURIComponent(hp)}`, {
      headers: { Accept: 'application/json' },
    });
    const j = await r.json().catch(() => ({}));
    if (j?.ok) return { ok: true, order: j.order };
    return { ok: false, error: j?.error || 'Data tidak ditemukan.' };
  } catch {
    return { ok: false, error: 'Layanan lacak sedang gangguan, coba lagi sebentar ya.' };
  }
}

// Customer is asking about an order / parcel / tracking number.
export const ORDER_INTENT_RE =
  /\b(status\s+(pesanan|order|paket|kiriman)|lacak|tracking|track|sampai\s+(mana|di\s*mana)|sudah\s+(dikirim|sampai|jalan)|dikirim\s+belum|belum\s+(dikirim|sampai)|no(mor)?\s*resi|resi\s*(ku|saya|nya)|paket\s*(saya|ku)|pesanan\s*(saya|ku)|order(an)?\s*(saya|ku)|kiriman\s*(saya|ku)|cek\s+(resi|pesanan|paket|kiriman))\b/i;

// Pull a tracking number + Indonesian phone out of free text (current message first,
// then recent history). Phone-like runs (with any spaces/dashes/dots, "+62 812-…") are
// stripped BEFORE the resi search so a phone fragment can never be mistaken for a resi.
// Resi: 8–25 chars, letters/digits/dashes, ≥3 digits (SiCepat/Anteraja can be short).
const PHONE_COMPACT_RE = /(?:\+?62|0)8\d{7,12}/;
const PHONE_LOOSE_RE = /(?:\+?62|0)[\s\-.()]*8(?:[\s\-.()]*\d){7,12}/g;

export function extractResiAndPhone(texts) {
  let resi = '';
  let hp = '';
  for (const raw of texts) {
    const t = String(raw ?? '');
    if (!hp) {
      const m = t.replace(/[\s\-.()]/g, '').match(PHONE_COMPACT_RE);
      if (m) hp = m[0];
    }
    if (!resi) {
      const cleaned = t.replace(PHONE_LOOSE_RE, ' ').toUpperCase();
      const cands = cleaned.match(/\b[A-Z0-9][A-Z0-9-]{6,24}\b/g) ?? [];
      const hit = cands.find((c) => (c.match(/\d/g) ?? []).length >= 3);
      if (hit) resi = hit;
    }
    if (resi && hp) break;
  }
  return { resi, hp };
}
