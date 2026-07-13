import { json } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { getAutomaticDiscounts, getActiveFlashProducts, readEnvVar } from '~/lib/autoDiscounts';

// ── Date helpers ──────────────────────────────────────────────────────────────

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function getCurrentMonthYear() {
  const now = new Date();
  return `${BULAN[now.getMonth()]} ${now.getFullYear()}`;
}

// ── Social proof (rating + terjual) from Firestore, cached 5 min ──────────────

const FIRESTORE_PROJECT_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)';
const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU'; // Firebase web key — public by design

let socialCache = { at: 0, map: {} };

async function getSocialProof(handles) {
  if (Date.now() - socialCache.at < 5 * 60 * 1000) return socialCache.map;
  const map = {};
  try {
    // Sold counts — one batchGet for all handles
    const batchRes = await fetch(`${FIRESTORE_PROJECT_BASE}/documents:batchGet?key=${FIRESTORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documents: handles.map(h => `${FIRESTORE_PROJECT_BASE.replace('https://firestore.googleapis.com/v1/', '')}/documents/sold_counts/${h}`),
      }),
    });
    if (batchRes.ok) {
      const rows = await batchRes.json();
      for (const row of Array.isArray(rows) ? rows : []) {
        if (!row.found) continue;
        const handle = row.found.name.split('/').pop();
        const sold = parseInt(row.found.fields?.count?.integerValue ?? 0);
        if (sold > 0) map[handle] = { ...(map[handle] ?? {}), sold };
      }
    }

    // Approved reviews — IN-chunks of 10 handles per query
    for (let i = 0; i < handles.length; i += 10) {
      const chunk = handles.slice(i, i + 10);
      const res = await fetch(`${FIRESTORE_PROJECT_BASE}/documents:runQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'reviews' }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } },
                  { fieldFilter: { field: { fieldPath: 'productHandle' }, op: 'IN', value: { arrayValue: { values: chunk.map(h => ({ stringValue: h })) } } } },
                ],
              },
            },
            limit: 500,
          },
        }),
      });
      if (!res.ok) continue;
      const rows = await res.json();
      const agg = {};
      for (const row of Array.isArray(rows) ? rows : []) {
        const f = row.document?.fields;
        if (!f) continue;
        const h = f.productHandle?.stringValue;
        if (!h) continue;
        const rating = parseInt(f.rating?.integerValue ?? 5);
        agg[h] = agg[h] ?? { sum: 0, n: 0 };
        agg[h].sum += rating;
        agg[h].n += 1;
      }
      for (const [h, a] of Object.entries(agg)) {
        map[h] = { ...(map[h] ?? {}), avg: (a.sum / a.n).toFixed(1).replace('.0', ''), reviews: a.n };
      }
    }
    socialCache = { at: Date.now(), map };
  } catch (e) {
    console.error('[flash-sale] social proof fetch failed:', e?.message ?? e);
    socialCache = { at: Date.now() - 4.5 * 60 * 1000, map: socialCache.map };
  }
  return socialCache.map;
}

// ── Admin API token exchange (same pattern as harga-produk server.js) ─────────

async function getAdminToken(shop, clientId, clientSecret) {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });
  if (!res.ok) throw new Error(`Admin token fetch failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ context }) {
  const autoDiscountsPromise = getAutomaticDiscounts(context.env).catch(() => []);
  const data = await context.storefront.query(FLASH_SALE_QUERY);
  const collection = data?.collection ?? null;
  const collectionProducts = collection?.products?.nodes ?? [];

  // Discount-driven products: everything covered by an active automatic discount
  // joins the page automatically — no collection maintenance needed
  const autoFlashMap = {};
  let products = collectionProducts;
  try {
    const discounts = await autoDiscountsPromise;
    const flashMap = getActiveFlashProducts(discounts, 50);

    const collectionIds = new Set(collectionProducts.map(p => p.id));
    const extraIds = [...flashMap.keys()].filter(id => !collectionIds.has(id));
    let extraProducts = [];
    if (extraIds.length > 0) {
      const extra = await context.storefront.query(FLASH_EXTRA_PRODUCTS_QUERY, { variables: { ids: extraIds } });
      extraProducts = (extra?.nodes ?? []).filter(Boolean);
    }
    // Flash items first, then the rest of the curated collection
    products = [...extraProducts, ...collectionProducts];

    for (const p of products) {
      const d = flashMap.get(p.id);
      if (d) autoFlashMap[p.id] = d;
    }
  } catch {
    // best effort — collection + metafield fallback still works
  }

  // Social proof (rating + terjual)
  const socialPromise = getSocialProof(products.map(p => p.handle)).catch(() => ({}));

  // Fetch inventory quantities via Admin API (products.json correctly filters by product ids)
  let inventoryMap = {};
  try {
    const productIds = products.map(p => p.id.split('/').pop()).filter(Boolean);

    if (productIds.length > 0) {
      const shop = readEnvVar(context.env, 'PUBLIC_STORE_DOMAIN');
      const token = await getAdminToken(shop, readEnvVar(context.env, 'SHOPIFY_APP_CLIENT_ID'), readEnvVar(context.env, 'SHOPIFY_APP_CLIENT_SECRET'));

      const res = await fetch(
        `https://${shop}/admin/api/2026-01/products.json?ids=${productIds.join(',')}&fields=id,variants`,
        { headers: { 'X-Shopify-Access-Token': token } }
      );
      if (res.ok) {
        const data = await res.json();
        for (const product of data.products ?? []) {
          for (const v of product.variants ?? []) {
            inventoryMap[`gid://shopify/ProductVariant/${v.id}`] = v.inventory_quantity;
          }
        }
      } else {
        console.error('[flash-sale] products API error:', res.status, await res.text());
      }
    }
  } catch (e) {
    console.error('[flash-sale] inventory fetch exception:', e.message);
  }

  const discountPcts = products.map(p => {
    const v = p.variants?.nodes?.[0];
    const price = parseFloat(v?.price?.amount ?? 0);
    const cap = parseFloat(v?.compareAtPrice?.amount ?? 0);
    const d = autoFlashMap[p.id];
    const flashPrice = d
      ? Math.max(0, d.type === 'amount' ? price - d.amount : Math.round(price * (1 - d.percentage / 100)))
      : null;
    const eff = flashPrice !== null ? flashPrice : price;
    const strike = Math.max(cap, flashPrice !== null ? price : 0);
    return strike > eff && strike > 0 ? Math.round((1 - eff / strike) * 100) : 0;
  });
  const maxDiscount = discountPcts.length ? Math.max(...discountPcts) : 0;

  const monthYear = getCurrentMonthYear();

  // Sale-wide countdown = the earliest real end date among active flash discounts
  let saleEndsAt = null;
  for (const d of Object.values(autoFlashMap)) {
    if (d.endsAt && (!saleEndsAt || new Date(d.endsAt) < new Date(saleEndsAt))) saleEndsAt = d.endsAt;
  }

  const socialMap = await socialPromise;

  return json({ collection, products, maxDiscount, monthYear, inventoryMap, autoFlashMap, saleEndsAt, socialMap });
}

// ── SEO ───────────────────────────────────────────────────────────────────────

export const meta = ({ data }) => {
  const products = data?.collection?.products?.nodes ?? [];
  const { maxDiscount, monthYear } = data ?? {};
  const count = products.length;

  const dateStr = monthYear ?? 'Terbaru';
  const title = `Flash Sale Kamera ${dateStr} — Diskon s/d ${maxDiscount}% | Galaxy Camera`;
  const description = `Flash Sale Galaxy Camera ${dateStr}! Diskon hingga ${maxDiscount}% untuk ${count} produk kamera, lensa, dan aksesoris pilihan. Harga spesial terbatas — stok bisa habis kapan saja.`;

  return [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: `flash sale kamera ${dateStr.toLowerCase()}, diskon kamera, promo kamera murah, sale lensa kamera, galaxy camera promo, beli kamera diskon` },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:site_name', content: 'Galaxy Camera' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];
};

// ── Countdown ─────────────────────────────────────────────────────────────────

function calcTimeLeft(endDateStr) {
  if (!endDateStr) return null;
  const diff = new Date(endDateStr).getTime() - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const s = Math.floor(diff / 1000);
  return {
    expired: false,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function useCountdown(endDateStr) {
  // null until mounted — avoids SSR/client hydration mismatch on time
  const [t, setT] = useState(null);
  useEffect(() => {
    if (!endDateStr) { setT(null); return; }
    setT(calcTimeLeft(endDateStr));
    const id = setInterval(() => setT(calcTimeLeft(endDateStr)), 1000);
    return () => clearInterval(id);
  }, [endDateStr]);
  return t;
}

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-[3px]">
      <span
        className="tabular-nums font-black text-white text-[11px] leading-tight rounded-md px-[5px] py-[2px]"
        style={{ background: '#111827', minWidth: 23, textAlign: 'center' }}
      >
        {value}
      </span>
      <span className="text-gray-400 font-semibold uppercase tracking-wide" style={{ fontSize: 7 }}>{label}</span>
    </div>
  );
}

const Sep = () => (
  <span className="font-black text-red-500 text-xs leading-none" style={{ marginBottom: 11 }}>:</span>
);

function Countdown({ endDate }) {
  const t = useCountdown(endDate);
  if (endDate && t?.expired) return <p className="text-[9px] text-gray-400 font-semibold">Sale berakhir</p>;
  const v = (n) => (t === null ? '--' : String(n).padStart(2, '0'));
  return (
    <div className="flex items-end gap-[3px]">
      {(t === null || t.days > 0) && <><TimeUnit value={t === null ? '--' : t.days} label="hari" /><Sep /></>}
      <TimeUnit value={v(t?.hours)} label="jam" />
      <Sep />
      <TimeUnit value={v(t?.minutes)} label="mnt" />
      <Sep />
      <TimeUnit value={v(t?.seconds)} label="dtk" />
    </div>
  );
}

// ── Hero countdown — the big one ──────────────────────────────────────────────

function HeroTimeBox({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="bg-black/40 backdrop-blur-sm border border-white/20 text-white font-mono font-black rounded-lg text-center tabular-nums text-xl sm:text-3xl px-2 sm:px-3 py-1.5 sm:py-2 min-w-[44px] sm:min-w-[60px] leading-none">
        {value}
      </span>
      <span className="text-white/60 font-bold uppercase tracking-widest" style={{ fontSize: 9 }}>{label}</span>
    </div>
  );
}

const HeroSep = () => (
  <span className="text-white/60 font-black text-xl sm:text-2xl pb-4">:</span>
);

function HeroCountdown({ endsAt }) {
  const t = useCountdown(endsAt);
  if (t?.expired) return <p className="text-white font-bold text-sm">Sale telah berakhir</p>;
  const v = (n) => (t === null ? '--' : String(n).padStart(2, '0'));
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {(t === null || t.days > 0) && (
        <>
          <HeroTimeBox value={t === null ? '--' : t.days} label="Hari" />
          <HeroSep />
        </>
      )}
      <HeroTimeBox value={v(t?.hours)} label="Jam" />
      <HeroSep />
      <HeroTimeBox value={v(t?.minutes)} label="Menit" />
      <HeroSep />
      <HeroTimeBox value={v(t?.seconds)} label="Detik" />
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product, inventoryMap, flash, social }) {
  const variant = product.variants?.nodes?.[0];
  const basePrice = parseFloat(variant?.price?.amount ?? 0);
  const compareAt = parseFloat(variant?.compareAtPrice?.amount ?? 0);

  // Real automatic discount (flash sale) takes priority over compareAt pricing
  const flashPrice = flash
    ? Math.max(0, flash.type === 'amount' ? basePrice - flash.amount : Math.round(basePrice * (1 - flash.percentage / 100)))
    : null;
  const price = flashPrice !== null ? flashPrice : basePrice;
  const strikeAt = flashPrice !== null
    ? Math.max(compareAt, basePrice)
    : compareAt;
  const hasDiscount = strikeAt > price && strikeAt > 0;
  const discountPct = hasDiscount ? Math.round((1 - price / strikeAt) * 100) : 0;

  // Countdown: real discount end date wins; manual metafield is the fallback
  const endDate = flash?.endsAt ?? (product.metafields?.find(m => m?.key === 'periode_promo_akhir')?.value ?? null);
  const isSoldOut = !variant?.availableForSale;
  const qty = variant?.id ? (inventoryMap?.[variant.id] ?? null) : null;
  const fmt = n => Math.round(n).toLocaleString('id-ID');

  return (
    <Link
      to={`/products/${product.handle}`}
      prefetch="intent"
      className="group flex flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl no-underline"
      style={{ border: flash ? '1.5px solid #fca5a5' : '1px solid #f0f0f0', boxShadow: flash ? '0 2px 12px rgba(229,57,53,0.12)' : '0 2px 8px rgba(0,0,0,0.06)', textDecoration: 'none' }}
    >
      <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10 text-white font-black text-xs px-2 py-0.5 rounded-sm leading-tight" style={{ background: '#e53935' }}>
            {flash ? '⚡' : ''}-{discountPct}%
          </div>
        )}
        {product.featuredImage?.url ? (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">📷</div>
        )}
        {!isSoldOut && qty !== null && (
          <div
            className="absolute bottom-2 left-2 z-10 text-white font-black text-[10px] px-2 py-0.5 rounded-sm leading-tight"
            style={{ background: qty <= 5 ? '#dc2626' : qty <= 10 ? '#ea580c' : 'rgba(0,0,0,0.45)' }}
          >
            {qty <= 5 ? `⚠ Sisa ${qty}` : `Sisa ${qty}`}
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-gray-800/90 text-white font-bold text-xs px-3 py-1.5 rounded-sm tracking-wider">HABIS</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3">
        <p className="text-gray-800 text-xs sm:text-sm leading-snug line-clamp-2 mb-1.5 flex-1">{product.title}</p>
        {(social?.reviews > 0 || social?.sold > 0) && (
          <div className="flex items-center gap-1 mb-1.5 text-[10px] text-gray-500 leading-none">
            {social?.reviews > 0 && (
              <>
                <span className="text-amber-400 text-[11px]">★</span>
                <span className="font-bold text-gray-700">{social.avg}</span>
                <span className="text-gray-400">({social.reviews})</span>
              </>
            )}
            {social?.reviews > 0 && social?.sold > 0 && <span className="text-gray-300 mx-0.5">·</span>}
            {social?.sold > 0 && <span>{social.sold} terjual</span>}
          </div>
        )}
        <div className="mb-2">
          <p className="font-black text-sm sm:text-base leading-tight" style={{ color: '#e53935' }}>Rp{fmt(price)}</p>
          {hasDiscount && <p className="text-xs text-gray-400 line-through leading-tight mt-0.5">Rp{fmt(strikeAt)}</p>}
        </div>
        {endDate && hasDiscount && (
          <div
            className="-mx-3 -mb-3 px-3 pt-2 pb-2.5 mt-auto"
            style={{ background: 'linear-gradient(90deg, #fef2f2, #fff7ed)', borderTop: '1px solid #fee2e2' }}
          >
            <p className="text-red-500 font-bold uppercase tracking-wider mb-1.5" style={{ fontSize: 8 }}>
              {flash ? '⚡ Berakhir dalam' : 'Berakhir dalam'}
            </p>
            <Countdown endDate={endDate} />
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FlashSale() {
  const { collection, products: loaderProducts, maxDiscount, monthYear, inventoryMap, autoFlashMap, saleEndsAt, socialMap } = useLoaderData();
  const products = loaderProducts ?? collection?.products?.nodes ?? [];

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>

      {/* ── Header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(110deg, #b71c1c 0%, #e53935 45%, #f4511e 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 18px)' }}
        />
        {/* Diagonal shine sweep — same treatment as the product page flash banner */}
        <div
          className="absolute inset-y-0 w-40 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)',
            animation: 'flashShine 3.2s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes flashShine { 0% { left: -30%; } 60% { left: 115%; } 100% { left: 115%; } }`}</style>
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute -right-8 bottom-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

          {/* Desktop */}
          <div className="hidden sm:flex items-stretch gap-8 py-8">
            <div className="flex-1 flex flex-col justify-center">
              {/* Badges row */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="flex items-center gap-1.5 bg-white/15 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                  SEDANG BERLANGSUNG
                </span>
                {monthYear && (
                  <span className="bg-yellow-400/20 text-yellow-200 border border-yellow-300/30 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                    📅 {monthYear}
                  </span>
                )}
              </div>

              <h1
                className="font-black text-white leading-none tracking-tight mb-3"
                style={{ fontSize: 'clamp(40px, 5vw, 72px)', textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}
              >
                FLASH<br />SALE
              </h1>

              <p className="text-white/60 text-sm font-medium mb-5">
                Harga terbaik · Stok terbatas · Berakhir sewaktu-waktu
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-300">
                    <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
                  </svg>
                  <span className="text-white font-bold text-sm">{products.length} produk</span>
                </div>
                {maxDiscount > 0 && (
                  <div className="bg-yellow-400 rounded-full px-4 py-2">
                    <span className="text-red-900 font-black text-sm">Diskon s/d {maxDiscount}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: live countdown card */}
            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-7 border border-white/20 flex-shrink-0">
              {saleEndsAt ? (
                <>
                  <p className="text-white/70 text-[10px] font-black tracking-[0.25em] uppercase mb-3">⏰ Berakhir dalam</p>
                  <HeroCountdown endsAt={saleEndsAt} />
                  <div className="w-full h-px bg-white/20 my-4" />
                </>
              ) : monthYear ? (
                <>
                  <p className="text-yellow-200 text-xs font-bold text-center leading-snug">{monthYear}</p>
                  <div className="w-full h-px bg-white/20 my-4" />
                </>
              ) : null}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-white/50 text-[9px] font-black tracking-[0.2em] uppercase mb-1">Hemat hingga</p>
                  <p className="font-black leading-none text-white text-4xl">
                    {maxDiscount > 0 ? maxDiscount : '—'}
                    {maxDiscount > 0 && <span className="text-yellow-300 text-2xl">%</span>}
                  </p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <p className="text-white/50 text-[9px] font-black tracking-[0.2em] uppercase mb-1">Tersedia</p>
                  <p className="text-white font-black text-4xl leading-none">{products.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="sm:hidden py-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="flex items-center gap-1.5 bg-white/15 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                SEDANG BERLANGSUNG
              </span>
              {monthYear && (
                <span className="bg-yellow-400/20 text-yellow-200 border border-yellow-300/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {monthYear}
                </span>
              )}
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <h1
                  className="text-white font-black text-4xl leading-none tracking-tight mb-1.5"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
                >
                  FLASH<br />SALE
                </h1>
                <p className="text-white/55 text-xs font-medium">Stok terbatas · Berakhir sewaktu-waktu</p>
              </div>
              {maxDiscount > 0 && (
                <div className="text-center flex-shrink-0">
                  <p className="text-white/50 text-[9px] font-black tracking-widest uppercase leading-none mb-1">Hemat s/d</p>
                  <p className="font-black leading-none" style={{ color: '#fdd835', fontSize: 38 }}>
                    {maxDiscount}<span className="text-xl">%</span>
                  </p>
                </div>
              )}
            </div>

            {saleEndsAt && (
              <div className="mt-4 bg-black/25 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/15">
                <p className="text-white/70 font-black tracking-[0.25em] uppercase mb-2 text-center" style={{ fontSize: 9 }}>⏰ Berakhir dalam</p>
                <div className="flex justify-center">
                  <HeroCountdown endsAt={saleEndsAt} />
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-yellow-300">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
                </svg>
                <span className="text-white font-bold text-xs">{products.length} produk tersedia</span>
              </div>
              {maxDiscount > 0 && (
                <div className="bg-yellow-400 rounded-full px-3 py-1.5">
                  <span className="text-red-900 font-black text-xs">Diskon s/d {maxDiscount}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-3" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.06))' }} />
      </div>

      <div style={{ height: 3, background: 'linear-gradient(90deg, #b71c1c, #e53935, #f4511e, #ffb300)' }} />

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-7">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">⚡</p>
            <p className="text-lg font-bold text-gray-700 mb-1">Flash sale sedang tidak aktif</p>
            <p className="text-sm text-gray-400">Pantau terus — penawaran kilat berikutnya bisa muncul kapan saja!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} inventoryMap={inventoryMap} flash={autoFlashMap?.[p.id]} social={socialMap?.[p.handle]} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── GraphQL ───────────────────────────────────────────────────────────────────

const FLASH_EXTRA_PRODUCTS_QUERY = `#graphql
  query FlashExtraProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        featuredImage { url altText }
        variants(first: 1) {
          nodes {
            id
            availableForSale
            price { amount }
            compareAtPrice { amount }
          }
        }
      }
    }
  }
`;

const FLASH_SALE_QUERY = `#graphql
  query FlashSale {
    collection(handle: "flash-sale") {
      title
      description
      products(first: 50) {
        nodes {
          id
          title
          handle
          featuredImage {
            url
            altText
          }
          metafields(identifiers: [
            { namespace: "custom" key: "periode_promo" }
            { namespace: "custom" key: "periode_promo_akhir" }
          ]) {
            key
            value
          }
          variants(first: 1) {
            nodes {
              id
              availableForSale
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;
