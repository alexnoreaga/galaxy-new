import { json } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { useState, useEffect } from 'react';

// ── Date helpers ──────────────────────────────────────────────────────────────

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function getCurrentMonthYear() {
  const now = new Date();
  return `${BULAN[now.getMonth()]} ${now.getFullYear()}`;
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
  const data = await context.storefront.query(FLASH_SALE_QUERY);
  const collection = data?.collection ?? null;
  const products = collection?.products?.nodes ?? [];

  // Fetch inventory quantities via Admin API (products.json correctly filters by product ids)
  let inventoryMap = {};
  try {
    const productIds = products.map(p => p.id.split('/').pop()).filter(Boolean);

    if (productIds.length > 0) {
      const shop = context.env.PUBLIC_STORE_DOMAIN;
      const token = await getAdminToken(shop, context.env.SHOPIFY_APP_CLIENT_ID, context.env.SHOPIFY_APP_CLIENT_SECRET);

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

  const discounts = products.map(p => {
    const price = parseFloat(p.variants?.nodes?.[0]?.price?.amount ?? 0);
    const cap = parseFloat(p.variants?.nodes?.[0]?.compareAtPrice?.amount ?? 0);
    return cap > price && cap > 0 ? Math.round((1 - price / cap) * 100) : 0;
  });
  const maxDiscount = discounts.length ? Math.max(...discounts) : 0;

  const monthYear = getCurrentMonthYear();

  return json({ collection, maxDiscount, monthYear, inventoryMap });
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
  const [t, setT] = useState(() => calcTimeLeft(endDateStr));
  useEffect(() => {
    if (!endDateStr) return;
    const id = setInterval(() => setT(calcTimeLeft(endDateStr)), 1000);
    return () => clearInterval(id);
  }, [endDateStr]);
  return t;
}

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-[3px]">
      <span
        className="tabular-nums font-black text-white text-[11px] leading-tight rounded px-[5px] py-[2px]"
        style={{ background: '#e53935', minWidth: 22, textAlign: 'center' }}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-gray-400 font-semibold uppercase tracking-wide" style={{ fontSize: 7 }}>{label}</span>
    </div>
  );
}

const Sep = () => (
  <span className="font-black text-red-400 text-xs leading-none" style={{ marginBottom: 11 }}>:</span>
);

function Countdown({ endDate }) {
  const t = useCountdown(endDate);
  if (!t) return null;
  if (t.expired) return <p className="text-[9px] text-gray-400 font-semibold">Sale berakhir</p>;
  return (
    <div className="flex items-end gap-[3px]">
      {t.days > 0 && <><TimeUnit value={t.days} label="hari" /><Sep /></>}
      <TimeUnit value={t.hours} label="jam" />
      <Sep />
      <TimeUnit value={t.minutes} label="mnt" />
      <Sep />
      <TimeUnit value={t.seconds} label="dtk" />
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product, inventoryMap }) {
  const variant = product.variants?.nodes?.[0];
  const price = parseFloat(variant?.price?.amount ?? 0);
  const compareAt = parseFloat(variant?.compareAtPrice?.amount ?? 0);
  const hasDiscount = compareAt > price && compareAt > 0;
  const discountPct = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;
  const endDate = product.metafields?.find(m => m?.key === 'periode_promo_akhir')?.value ?? null;
  const isSoldOut = !variant?.availableForSale;
  const qty = variant?.id ? (inventoryMap?.[variant.id] ?? null) : null;
  const fmt = n => Math.round(n).toLocaleString('id-ID');

  return (
    <Link
      to={`/products/${product.handle}`}
      prefetch="intent"
      className="group flex flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl no-underline"
      style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textDecoration: 'none' }}
    >
      <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10 text-white font-black text-xs px-2 py-0.5 rounded-sm leading-tight" style={{ background: '#e53935' }}>
            -{discountPct}%
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
        <p className="text-gray-800 text-xs sm:text-sm leading-snug line-clamp-2 mb-2 flex-1">{product.title}</p>
        <div className="mb-2">
          <p className="font-black text-sm sm:text-base leading-tight" style={{ color: '#e53935' }}>Rp{fmt(price)}</p>
          {hasDiscount && <p className="text-xs text-gray-400 line-through leading-tight mt-0.5">Rp{fmt(compareAt)}</p>}
        </div>
        {endDate && hasDiscount && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1.5" style={{ fontSize: 8 }}>Berakhir dalam</p>
            <Countdown endDate={endDate} />
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FlashSale() {
  const { collection, maxDiscount, monthYear, inventoryMap } = useLoaderData();
  const products = collection?.products?.nodes ?? [];

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

            {/* Right stat card */}
            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl px-10 py-8 border border-white/20 flex-shrink-0">
              <p className="text-white/50 text-[10px] font-black tracking-[0.2em] uppercase mb-1">Hemat hingga</p>
              <p className="font-black leading-none text-white" style={{ fontSize: 72 }}>
                {maxDiscount > 0 ? maxDiscount : '—'}
                {maxDiscount > 0 && <span className="text-yellow-300 text-4xl">%</span>}
              </p>
              {monthYear && (
                <>
                  <div className="w-full h-px bg-white/20 my-3" />
                  <p className="text-yellow-200 text-xs font-bold text-center leading-snug">{monthYear}</p>
                </>
              )}
              <div className="w-full h-px bg-white/20 my-3" />
              <p className="text-white/50 text-[10px] font-black tracking-[0.2em] uppercase mb-1">Tersedia</p>
              <p className="text-white font-black text-3xl leading-none">{products.length}</p>
              <p className="text-white/50 text-xs font-semibold mt-0.5">produk</p>
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
            <p className="text-lg font-bold text-gray-700 mb-1">Flash sale sedang tidak aktif</p>
            <p className="text-sm text-gray-400">Pantau terus untuk penawaran berikutnya!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} inventoryMap={inventoryMap} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── GraphQL ───────────────────────────────────────────────────────────────────

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
