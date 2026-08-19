import {useLoaderData,Link,useNavigate,useSearchParams} from '@remix-run/react';
import {defer} from '@shopify/remix-oxygen';
// import {Image} from '@shopify/hydrogen-react';
import ProductOptions from '~/components/ProductOptions';
import {Image, Money, ShopPayButton} from '@shopify/hydrogen-react';
import {CartForm} from '@shopify/hydrogen';
import { ProductGallery } from '~/components/ProductGallery';
import React, { useEffect, useState, useRef } from 'react';
import ProductCard from '~/components/ProductCard';
import { Accordion } from '~/components/Accordion';
import { HitunganPersen } from '~/components/HitunganPersen';
import {InfoProduk} from '~/components/InfoProduk';
import {PertanyaanUmum} from '~/components/PertanyaanUmum';
import {ParseSpesifikasi} from '~/components/ParseSpesifikasi';
import {LiveShopee} from '~/components/LiveShopee';
import { Modal } from '~/components/Modal';
import { WishlistButton } from '~/components/WishlistButton';
import { FreeOngkirBadge } from '~/components/FreeOngkirBadge';
import {AnalyticsPageType} from '@shopify/hydrogen';
import { ProdukRelated } from '~/components/ProdukRelated';
import { RecentlyViewed } from '~/components/RecentlyViewed';
import { ModalBalasCepat } from '~/components/ModalBalasCepat';
import { TombolBalasCepat } from '~/components/TombolBalasCepat';
import { ProductAIChat } from '~/components/ProductAIChat';
import { VoucherInline } from '~/components/VoucherInline';
import { getAutomaticDiscounts, findProductAutoDiscount, findProductPwp } from '~/lib/autoDiscounts';
import { getVariantCosts, buildHargaBest } from '~/lib/hargaBest';
import { FaSquareWhatsapp, FaWhatsapp } from "react-icons/fa6";
import { FaPhone } from "react-icons/fa6";
import { FaComment } from "react-icons/fa6";
import { FaBagShopping } from "react-icons/fa6";
import { FaShareFromSquare } from "react-icons/fa6";
import { FaLink } from "react-icons/fa6";
import {Await, useMatches, useLocation} from '@remix-run/react';
import {Suspense} from 'react';
import {resolveFlashEdition, FlashEditionBadge, FlashEditionName} from '~/components/MastheadOrnament';

// ── Video (YouTube) helpers ──────────────────────────────────────────────────
// Accept a raw metafield value (full URL or bare 11-char ID) → normalized video ID, else ''.
function extractYouTubeId(input) {
  if (!input) return '';
  const s = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : '';
}
// The product video now lives in the gallery, so strip any YouTube <iframe> out of the description
// HTML — that raw embed is the heavy thing we're replacing with a click-to-load facade.
function stripYouTubeIframes(html) {
  if (!html) return html;
  return String(html).replace(/<iframe\b[^>]*(?:youtube\.com|youtu\.be)[^>]*>[\s\S]*?<\/iframe>/gi, '');
}

export const handle = {
  breadcrumbType: 'product',
};

// Skip full loader re-run when only variant search params change (same product)
export function shouldRevalidate({currentUrl, nextUrl, defaultShouldRevalidate}) {
  if (currentUrl.pathname === nextUrl.pathname) return false;
  return defaultShouldRevalidate;
}

// Relative "time ago" in Indonesian — "2 hari lalu", "1 minggu lalu", etc.
function waktuLalu(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const detik = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (detik < 60) return 'Baru saja';
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari === 1) return 'Kemarin';
  if (hari < 7) return `${hari} hari lalu`;
  const minggu = Math.floor(hari / 7);
  if (minggu < 5) return `${minggu} minggu lalu`;
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  const tahun = Math.floor(hari / 365);
  return `${tahun} tahun lalu`;
}

// Verified-seal check icon (used on review trust badges)
function CheckSeal({ className = 'w-3 h-3' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}

// ── Flash sale banner + live countdown ────────────────────────────────────────

// White card digits (marketplace convention) — navy numerals, red on the seconds so the
// fastest-changing unit carries the urgency.
function CountdownBox({ value, accent = false }) {
  return (
    <span
      className={`bg-white ${accent ? 'text-red-600' : 'text-slate-900'} font-mono font-bold text-xs sm:text-sm rounded-md px-1.5 sm:px-2 py-1 min-w-[26px] sm:min-w-[30px] text-center inline-block tabular-nums leading-none shadow-sm`}
    >
      {value}
    </span>
  );
}

function FlashSaleCountdown({ endsAt }) {
  // null until mounted — avoids SSR/client hydration mismatch on time
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = now === null ? null : Math.max(0, new Date(endsAt).getTime() - now);
  if (left !== null && left <= 0) return null;

  const d = left === null ? '--' : Math.floor(left / 86400000);
  const h = left === null ? '--' : String(Math.floor((left % 86400000) / 3600000)).padStart(2, '0');
  const m = left === null ? '--' : String(Math.floor((left % 3600000) / 60000)).padStart(2, '0');
  const s = left === null ? '--' : String(Math.floor((left % 60000) / 1000)).padStart(2, '0');

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {(left === null ? false : d > 0) && (
        <>
          <CountdownBox value={d} />
          <span className="text-white/70 text-[9px] sm:text-[10px] font-semibold mr-0.5">hari</span>
        </>
      )}
      <CountdownBox value={h} />
      <span className="text-white/50 font-bold text-xs">:</span>
      <CountdownBox value={m} />
      <span className="text-white/50 font-bold text-xs">:</span>
      <CountdownBox value={s} accent />
    </div>
  );
}

function FlashSaleBanner({ autoDiscount }) {
  // Monthly twin-date edition (8.8, 11.11, …) + seasonal skin — auto-follows the WIB month
  const location = useLocation();
  if (!autoDiscount) return null;
  const ed = resolveFlashEdition(location.search);
  const hemat = autoDiscount.type === 'amount'
    ? `Rp${autoDiscount.amount.toLocaleString('id-ID')}`
    : `${autoDiscount.percentage}%`;
  return (
    <div
      // Full-bleed edge-to-edge on mobile (square corners — rounded corners look cut at the
      // screen edge); contained rounded card from sm+.
      className="relative overflow-hidden -mx-4 sm:mx-0 rounded-none sm:rounded-lg order-2 md:order-4 mt-1 md:mt-1.5"
      style={{ background: ed.bg }}
    >
      {/* Fine diagonal weave — drifts very slowly, so the surface feels alive without shimmering */}
      <div
        aria-hidden="true"
        className="gx-flash-weave absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.07,
          backgroundImage: 'repeating-linear-gradient(115deg, #fff 0px, #fff 1px, transparent 1px, transparent 10px)',
        }}
      />
      {/* Occasional light catch — one narrow pass, then a long idle (not a shimmer loop) */}
      <div aria-hidden="true" className="gx-flash-gleam absolute inset-0 pointer-events-none" />

      <div className="relative flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
          {/* Drawn bolt in a quiet tile — an icon, not an emoji */}
          <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white/12 ring-1 ring-white/20 flex items-center justify-center mt-[1px]">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-[15px] h-[15px] sm:w-4 sm:h-4 text-white">
              <path d="M13.5 2 4 13.2h5.6L8.9 22 19 10.6h-5.9L13.5 2z" />
            </svg>
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className="m-0 text-white font-bold uppercase text-[13px] sm:text-[15px] tracking-[0.15em] leading-none whitespace-nowrap">
                Flash Sale
              </p>
              <span aria-hidden="true" className="flex-shrink-0 w-px h-3 bg-white/25" />
              <FlashEditionBadge ed={ed} />
              <span className="hidden md:inline-flex items-center"><FlashEditionName ed={ed} /></span>
            </div>
            <p className="m-0 mt-1.5 text-white/70 text-[11px] sm:text-xs leading-tight whitespace-nowrap">
              Hemat <span className="font-semibold text-white">{hemat}</span>
              <span className="hidden sm:inline"> · otomatis di checkout</span>
            </p>
          </div>
        </div>

        {autoDiscount.endsAt && (
          <div className="text-right flex-shrink-0">
            <p className="m-0 flex items-center justify-end gap-1.5 text-white/50 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.18em] mb-1.5">
              {/* Live dot — signals the timer is actually running */}
              <span aria-hidden="true" className="gx-flash-dot inline-block w-[5px] h-[5px] rounded-full bg-white/80" />
              Berakhir dalam
            </p>
            <FlashSaleCountdown endsAt={autoDiscount.endsAt} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── PWP "Tambah & Lebih Hemat" — auto-detected from Buy X Get Y automatic discounts ───────────
// Renders only when this product is the trigger of an active BXGY deal. Prices always match what
// checkout will charge (both derive from the same discount). Add-to-cart adds the ADD-ON only;
// the discount applies automatically at checkout once the main product is in the cart too.
function PwpSection({ pwp }) {
  if (!pwp?.deals?.length || !pwp?.products?.length) return null;
  const byId = new Map(pwp.products.map((p) => [p.id, p]));

  const rows = new Map();
  for (const deal of pwp.deals) {
    for (const pid of deal.addOnProductIds) {
      const prod = byId.get(pid);
      if (!prod || !prod.availableForSale) continue;
      const available = (prod.variants?.nodes ?? []).filter((v) => v.availableForSale);
      const scoped = deal.addOnVariantIds?.length
        ? available.filter((v) => deal.addOnVariantIds.includes(v.id))
        : available;
      const v = scoped[0] ?? available[0];
      if (!v) continue;
      const price = parseFloat(v.price?.amount ?? 0);
      if (!price) continue;
      const hemat = deal.discount.type === 'amount'
        ? Math.min(deal.discount.amount, price)
        : Math.round(price * deal.discount.percentage);
      if (hemat <= 0) continue;
      const key = prod.id + '|' + v.id;
      if (!rows.has(key)) {
        rows.set(key, { prod, variant: v, price, hemat, pwpPrice: Math.max(0, price - hemat), endsAt: deal.endsAt });
      }
    }
  }
  const list = [...rows.values()];
  if (!list.length) return null;

  const img = (u) => (u ? (u.includes('?') ? `${u}&width=112` : `${u}?width=112`) : null);

  return (
    <div className="border border-gray-200 rounded-xl mt-2 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
            <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="flex-1 text-sm font-semibold text-gray-800">Tambah &amp; Lebih Hemat</span>
        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 flex-shrink-0">PWP</span>
      </div>

      <p className="px-3 pt-2.5 pb-1 text-[11px] text-gray-500 m-0">
        Diskon otomatis di checkout saat dibeli bersama produk ini.
      </p>

      {/* Horizontal tile rail (Sony "Add More & Save More" style) — scales to many add-ons
          without eating vertical space; half-visible next card is the swipe cue */}
      <div
        className="flex gap-2.5 overflow-x-auto px-3 pb-3 pt-1.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {list.map((row) => (
          <div
            key={row.prod.id + row.variant.id}
            className="flex-shrink-0 w-36 rounded-xl border border-gray-100 bg-white overflow-hidden flex flex-col"
          >
            <Link
              to={`/products/${row.prod.handle}`}
              prefetch="intent"
              className="block bg-gray-50 aspect-square p-2 flex-shrink-0"
            >
              {row.prod.featuredImage?.url ? (
                <img
                  src={img(row.prod.featuredImage.url)}
                  alt={row.prod.featuredImage.altText || row.prod.title}
                  loading="lazy"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</span>
              )}
            </Link>
            <div className="p-2 flex flex-col gap-1 flex-1">
              <Link
                to={`/products/${row.prod.handle}`}
                prefetch="intent"
                className="text-[11px] text-gray-800 leading-snug line-clamp-2 no-underline hover:text-red-600 transition-colors"
                style={{ minHeight: 28 }}
              >
                {row.prod.title}
              </Link>
              <div className="mt-0.5">
                <span className="block text-[13px] font-bold text-red-600 leading-tight">
                  Rp{row.pwpPrice.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-gray-400 line-through leading-tight">
                  Rp{row.price.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="self-start bg-red-50 border border-red-200 text-red-600 text-[9px] font-bold px-1.5 py-[1px] rounded">
                HEMAT Rp{row.hemat.toLocaleString('id-ID')}
              </span>
              <CartForm
                route="/cart"
                inputs={{ lines: [{ merchandiseId: row.variant.id }] }}
                action={CartForm.ACTIONS.LinesAdd}
              >
                {(fetcher) => (
                  <button
                    type="submit"
                    onClick={() => { window.location.href = window.location.href + '#cart-aside'; }}
                    disabled={fetcher.state !== 'idle'}
                    className="mt-auto w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-[11px] font-semibold py-1.5 rounded-lg transition-colors"
                  >
                    + Tambah
                  </button>
                )}
              </CartForm>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bonus Gratis — quiet card (replaces the gradient-tile version that read as "AI-designed").
// Mobile/tablet: middle column. Desktop (lg+): lives in the sticky checkout card instead, under
// the "Dikirim dari" line, to declutter the crowded middle column.
function BonusGratis({ value, className = '' }) {
  const items = (value ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={`border border-gray-100 rounded-lg bg-gray-50/60 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-gray-100">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-600">Bonus Gratis</span>
        <span className="ml-auto text-[10px] text-gray-400">{items.length} item</span>
      </div>
      <ul className="px-3 py-2 m-0 list-none flex flex-col gap-1.5">
        {items.map((str, i) => (
          <li key={i} className="flex items-start gap-2 m-0 text-[13px] text-gray-700 leading-snug">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            {str}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Festive clearance banner — shown on product pages when the product is in the cuci-gudang collection
function CuciGudangBanner() {
  return (
    <Link
      to="/collections/cuci-gudang"
      prefetch="intent"
      className="relative overflow-hidden rounded-xl order-2 md:order-4 mt-3 md:mt-4 block no-underline"
      style={{ background: 'linear-gradient(100deg,#b91c1c 0%,#dc2626 35%,#ea580c 70%,#f59e0b 100%)' }}
    >
      <div
        className="absolute inset-y-0 w-24 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)',
          animation: 'cgBannerShine 2.8s ease-in-out infinite',
        }}
      />
      <style>{`@keyframes cgBannerShine { 0% { left:-25%; } 60% { left:110%; } 100% { left:110%; } }`}</style>

      <div className="relative flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-xl sm:text-2xl animate-pulse flex-shrink-0">🔥</span>
          <div className="min-w-0">
            <p className="text-white font-black italic text-sm sm:text-lg tracking-wider leading-none drop-shadow-sm">CUCI GUDANG</p>
            <p className="text-white/95 text-[10px] sm:text-xs font-semibold mt-0.5 leading-tight">
              Harga Miring · Stok Terbatas<span className="hidden sm:inline"> — Buruan Sebelum Kehabisan!</span>
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1 bg-white text-red-600 text-[10px] sm:text-xs font-black px-2.5 py-1.5 rounded-full shadow">
          Lihat Semua →
        </span>
      </div>
    </Link>
  );
}

export async function loader({params, context, request}) {

  const {session} = context;
  const customerAccessToken = await session.get('customerAccessToken');

  const {handle} = params;
  const searchParams = new URL(request.url).searchParams;
  const selectedOptions = [];
  searchParams.forEach((value, name) => {
    selectedOptions.push({name, value});
  });

  const canonicalUrl = request.url;
  const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

  let productReviews = [];
  let soldCount = 0;

  // Start non-critical queries immediately — do NOT block on them
  const liveshopeePromise = context.storefront.query(METAOBJECT_LIVE_SHOPEE, {
    variables: { type: 'live_shopee', first: 4 },
  });
  const discountVouchersPromise = context.storefront.query(METAOBJECT_DISCOUNT_VOUCHERS, {
    variables: { type: 'discount_voucher', first: 10 },
  });
  const autoDiscountsPromise = getAutomaticDiscounts(context.env).catch(() => []);

  // ROUND 1 — critical data only (blocks first byte)
  const [
    {shop, product},
    custEmail,
    admgalaxy,
    marketplace,
  ] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: { handle, selectedOptions },
    }),
    // Anonymous visitors (the vast majority) skip this round-trip entirely
    customerAccessToken?.accessToken
      ? context.storefront.query(CUSTOMER_EMAIL_QUERY, {
          variables: { customertoken: customerAccessToken.accessToken },
        })
      : Promise.resolve(null),
    context.storefront.query(METAOBJECT_ADMIN_GALAXY, {
      variables: { type: "admin_galaxy", first: 20 },
    }),
    context.storefront.query(METAOBJECT_MARKETPLACE, {
      variables: { type: "marketplace", first: 10 },
    }),
    fetch(
      `${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'reviews' }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  { fieldFilter: { field: { fieldPath: 'productHandle' }, op: 'EQUAL', value: { stringValue: handle } } },
                  { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } },
                ],
              },
            },
            limit: 50,
          },
        }),
      }
    ).then(async res => {
      if (!res.ok) return;
      const reviewData = await res.json();
      productReviews = (reviewData || [])
        .filter(r => r.document)
        .map(r => {
          const f = r.document.fields || {};
          return {
            id: r.document.name.split('/').pop(),
            customerName: f.customerName?.stringValue || '',
            rating: parseInt(f.rating?.integerValue || 5),
            reviewText: f.reviewText?.stringValue || '',
            verifiedPurchase: f.verifiedPurchase?.booleanValue || false,
            source: f.source?.stringValue || 'online',
            photoUrl: f.photoUrl?.stringValue || '',
            photoUrls: (f.photoUrls?.arrayValue?.values || []).map(v => v.stringValue).filter(Boolean),
            createdAt: f.createdAt?.stringValue || '',
          };
        })
        .filter(r => r.customerName && r.reviewText)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }).catch(() => {}),
    fetch(`${FIRESTORE_BASE}/sold_counts/${handle}?key=${FIRESTORE_KEY}`)
      .then(async res => {
        if (!res.ok) return;
        const doc = await res.json();
        soldCount = parseInt(doc.fields?.count?.integerValue || 0);
      }).catch(() => {}),
  ]);

  // Match active automatic discounts for this product — flash sale (Basic) + PWP (Buy X Get Y)
  const discounts = await autoDiscountsPromise;
  const autoDiscount = findProductAutoDiscount(discounts, product?.id);
  const pwpDeals = findProductPwp(discounts, product?.id);

  // PWP add-on display data (price/image/handle from Storefront) — deferred, below the fold
  const pwpPromise = (async () => {
    if (!pwpDeals.length) return null;
    const ids = [...new Set(pwpDeals.flatMap((dd) => dd.addOnProductIds))];
    if (!ids.length) return null;
    const data = await context.storefront.query(PWP_ADDONS_QUERY, { variables: { ids } });
    const products = (data?.nodes ?? []).filter(Boolean);
    return products.length ? { deals: pwpDeals, products } : null;
  })().catch(() => null);

  // Staff "harga best" + nego-bubble gate — DEFERRED. getVariantCosts hits the Admin API
  // sequentially after Round 1; on cache misses that added ~0.5s of first-byte latency for data
  // nobody needs at first paint. It now streams in right after the page renders.
  const hargaBestPromise = (async () => {
    try {
      return buildHargaBest({
        variants: product?.variants?.nodes ?? [],
        costs: await getVariantCosts(context.env, product?.id),
      });
    } catch {
      return { byVariant: {}, withRealCost: [] };
    }
  })();

  // Admin quick replies — only the admin modal uses this; deferred, streams in
  const balasCepatPromise = context.storefront.query(BALAS_CEPAT, { variables: { first: 20 } });

  const productNumId = product?.id?.split('/').pop();
  const brandValue = product.metafields[6]?.key == 'brand' && product.metafields[6].value;

  const selectedVariant =
    product.selectedVariant ??
    (selectedOptions.length > 0
      ? product?.variants?.nodes?.find((v) =>
          selectedOptions.every((opt) =>
            v.selectedOptions?.some(
              (so) => so.name === opt.name && so.value === opt.value,
            ),
          ),
        )
      : null) ??
    product?.variants?.nodes[0];

  // ROUND 2 — deferred promises, depend on product.id but do NOT block the response
  const relatedPromise = context.storefront.query(PRODUK_RELATED, { variables: { productId: product?.id } });

  const metaobjectPromise = brandValue
    ? context.storefront.query(METAOBJECT_QUERY, { variables: { id: brandValue } })
    : Promise.resolve(null);

  const cachedFaqsPromise = fetch(`${FIRESTORE_BASE}/product_faqs/faq_${productNumId}?key=${FIRESTORE_KEY}`)
    .then(async res => {
      if (!res.ok) return null;
      const faqDoc = await res.json();
      const faqValues = faqDoc.fields?.faqs?.arrayValue?.values || [];
      const parsed = faqValues.map(item => ({
        question: item.mapValue?.fields?.question?.stringValue || '',
        answer: item.mapValue?.fields?.answer?.stringValue || '',
      })).filter(f => f.question && f.answer);
      return parsed.length ? parsed : null;
    }).catch(() => null);

  return defer({
    // Critical — resolved before first byte
    balasCepat: balasCepatPromise,
    custEmail,
    admgalaxy,
    shop,
    product,
    selectedVariant,
    marketplace,
    customerAccessToken,
    canonicalUrl,
    productReviews,
    soldCount,
    analytics: {
      pageType: AnalyticsPageType.product,
      products: [product],
    },
    hargaBest: hargaBestPromise,
    pwp: pwpPromise,
    // Deferred — stream in after page renders
    related: relatedPromise,
    metaobject: metaobjectPromise,
    liveshopee: liveshopeePromise,
    discountVouchers: discountVouchersPromise,
    cachedFaqs: cachedFaqsPromise,
    autoDiscount,
  });

}

// Sits bottom-LEFT: the right side is taken by the floating WA/Grisela button,
// and the bottom strip by the mobile navbar + sticky checkout bar.
function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Kembali ke atas"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-20 left-4 md:bottom-40 md:left-6 z-40 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-lg text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}

// Fullscreen image zoom — pinch (2 fingers), double-tap to toggle, drag to pan, swipe to change.
// Opened via the magnifier button on the gallery, so it never interferes with the
// staff double-click-to-copy secret on the inline product image.
function ZoomViewer({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const s = useRef({ mode: null, pinchDist: 0, baseScale: 1, sx: 0, sy: 0, baseTx: 0, baseTy: 0, lastTap: 0, swipeX: 0 });

  const reset = () => { setScale(1); setTx(0); setTy(0); };
  useEffect(() => { reset(); }, [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(index);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [images.length, onClose, index]);

  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  const onTouchStart = (e) => {
    const st = s.current;
    if (e.touches.length === 2) {
      st.mode = 'pinch'; st.pinchDist = dist(e.touches); st.baseScale = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - st.lastTap < 300) { scale > 1 ? reset() : setScale(2.5); st.lastTap = 0; st.mode = null; return; }
      st.lastTap = now;
      if (scale > 1) { st.mode = 'pan'; st.sx = e.touches[0].clientX; st.sy = e.touches[0].clientY; st.baseTx = tx; st.baseTy = ty; }
      else { st.mode = 'swipe'; st.swipeX = e.touches[0].clientX; }
    }
  };
  const onTouchMove = (e) => {
    const st = s.current;
    if (st.mode === 'pinch' && e.touches.length === 2) {
      setScale(Math.min(4, Math.max(1, st.baseScale * (dist(e.touches) / st.pinchDist))));
    } else if (st.mode === 'pan' && e.touches.length === 1) {
      setTx(st.baseTx + (e.touches[0].clientX - st.sx));
      setTy(st.baseTy + (e.touches[0].clientY - st.sy));
    }
  };
  const onTouchEnd = (e) => {
    const st = s.current;
    if (st.mode === 'pinch' && scale < 1.05) reset();
    if (st.mode === 'swipe') {
      const dx = (e.changedTouches[0]?.clientX ?? 0) - st.swipeX;
      if (dx > 50) prev(); else if (dx < -50) next();
    }
    st.mode = null;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col select-none" onClick={(e) => { if (e.target === e.currentTarget) onClose(index); }}>
      <div className="flex items-center justify-between px-4 py-3 text-white/90 flex-shrink-0">
        <span className="text-sm tabular-nums">{index + 1} / {images.length}</span>
        <button type="button" onClick={() => onClose(index)} aria-label="Tutup" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div
        className="flex-1 overflow-hidden flex items-center justify-center"
        style={{ touchAction: 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(2.5))}
      >
        <img
          src={images[index]?.src}
          alt=""
          draggable={false}
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transition: s.current.mode ? 'none' : 'transform 0.2s', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>

      {images.length > 1 && (
        <>
          <button type="button" onClick={prev} aria-label="Sebelumnya" className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-95 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
          </button>
          <button type="button" onClick={next} aria-label="Berikutnya" className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-95 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </button>
        </>
      )}

      <p className="text-center text-white/40 text-[11px] py-3 flex-shrink-0">Cubit untuk zoom · Ketuk 2× · Geser untuk ganti foto</p>
    </div>
  );
}

  const bungaHCI = 3.2
  const admKredivo = 2.6
  const adminFee3BulanKredivo = 3
  const adminKartuKredit6Bulan = 1.5
  const adminKartuKredit12Bulan = 3.5

  function mulaiDari(selectedVariant){
    let newHargaFinal = Number(parseFloat(selectedVariant.price.amount))
    // Cheapest: Kredivo 12-month
    let bungaKredivo = (admKredivo * newHargaFinal) / 100
    let cicilanKredivo12Bulan = Math.ceil(((newHargaFinal / 12) + bungaKredivo) / 10) * 10
    return cicilanKredivo12Bulan
  }

  function cicilanKartuKredit(selectedVariant,product,canonicalUrl){
    let newHargaFinal = Number(parseFloat(selectedVariant.price.amount))
    // HITUNGAN KARTU KREDIT START HERE
    let biayaAdmKartuKredit6Bln = (adminKartuKredit6Bulan * newHargaFinal) / 100
    let biayaAdmKartuKredit12Bln = (adminKartuKredit12Bulan * newHargaFinal) / 100

    let cicilanKartuKredit3Bulan = (Math.ceil(newHargaFinal / 3))
    let cicilanKartuKredit6Bulan = (Math.ceil(((newHargaFinal + biayaAdmKartuKredit6Bln) / 6)/10)*10)
    let cicilanKartuKredit12Bulan = (Math.ceil(((newHargaFinal + biayaAdmKartuKredit12Bln) / 12)/10)*10)

    const hargaCash = `${product.title}${selectedVariant?.title && selectedVariant.title !== "Default Title" ? ' - ' + selectedVariant.title.replace(/ \/ /g, ' - ') : ''}\n` +
    `${Number(parseFloat(selectedVariant?.price?.amount)) < Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) ? 'Harga Normal : Rp ' + parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")  + '\n' + 'Promo Diskon : Rp ' + (Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) - Number(parseFloat(selectedVariant?.price?.amount))).toLocaleString("id-ID") + '\n' + 'Harga Spesial : Rp ' + Number(parseFloat(selectedVariant?.price?.amount)).toLocaleString("id-ID") + '\n' : 'Harga : Rp ' + parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")+ '\n'}` +
    `${product?.metafields[1]?.value ? 'FREE : ' + product?.metafields[1].value + '\n' : ''}`+
    `${product?.metafields[0]?.value ? 'Garansi : ' + product?.metafields[0]?.value + ' ' + (product.vendor !== 'galaxy' && product.vendor) + '\n':''}`+
    `${product?.metafields[3]?.value ? 'Periode : ' + perubahTanggal(product.metafields[3]?.value) + ' - ' + perubahTanggal(product.metafields[4]?.value) + '\n':''}`+
    `Info Produk : ${canonicalUrl}`;


    if(parseFloat(selectedVariant.price.amount)>=500000){
      let listCicilan = `${hargaCash}

Cicilan Kartu Kredit (Via Blibli)
3x : ${cicilanKartuKredit3Bulan.toLocaleString("id-ID")}
6x : ${cicilanKartuKredit6Bulan.toLocaleString("id-ID")}
12x : ${cicilanKartuKredit12Bulan.toLocaleString("id-ID")}
  `
    return listCicilan
    
    }
    return 'Produk tidak dapat dicicil'
}


 


  function listAngsuran(product,selectedVariant,canonicalUrl){
    let newHargaFinal = Number(parseFloat(selectedVariant.price.amount))
    let bungaKredivo = (admKredivo * newHargaFinal) / 100 
    let adminFee3Bulan = (adminFee3BulanKredivo * newHargaFinal) / 100
    let cicilanKredivo3Bulan = Math.ceil(((newHargaFinal + adminFee3Bulan) / 3) / 10) * 10;
    let cicilanKredivo6Bulan = Math.ceil(((newHargaFinal / 6) + bungaKredivo) / 10) * 10;
    let cicilanKredivo12Bulan = Math.ceil(((newHargaFinal / 12) + bungaKredivo) / 10) * 10;

    let bungaHci = (bungaHCI * newHargaFinal) / 100;
    let cicilanHci6Bulan = Math.ceil(((newHargaFinal / 6) + bungaHci) / 10) * 10;
    let cicilanHci9Bulan = Math.ceil(((newHargaFinal / 9) + bungaHci) / 10) * 10;
    let cicilanHci12Bulan = Math.ceil(((newHargaFinal / 12) + bungaHci) / 10) * 10;
    let cicilanHci15Bulan = Math.ceil(((newHargaFinal / 15) + bungaHci) / 10) * 10;
    let cicilanHci18Bulan = Math.ceil(((newHargaFinal / 18) + bungaHci) / 10) * 10;


    
      
    const hargaCash = `${product.title}${selectedVariant?.title && selectedVariant.title !== "Default Title" ? ' - ' + selectedVariant.title.replace(/ \/ /g, ' - ') : ''}\n` +
    `${Number(parseFloat(selectedVariant?.price?.amount)) < Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) ? 'Harga Normal : Rp ' + parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")  + '\n' + 'Promo Diskon : Rp ' + (Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) - Number(parseFloat(selectedVariant?.price?.amount))).toLocaleString("id-ID") + '\n' + 'Harga Spesial : Rp ' + Number(parseFloat(selectedVariant?.price?.amount)).toLocaleString("id-ID") + '\n' : 'Harga : Rp ' + parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")+ '\n'}` +
    `${product?.metafields[1]?.value ? 'FREE : ' + product?.metafields[1].value + '\n' : ''}`+
    `${product?.metafields[0]?.value ? 'Garansi : ' + product?.metafields[0]?.value + ' ' + (product.vendor !== 'galaxy' && product.vendor) + '\n':''}`+
    `${product?.metafields[3]?.value ? 'Periode : ' + perubahTanggal(product.metafields[3]?.value) + ' - ' + perubahTanggal(product.metafields[4]?.value) + '\n':''}`+
    `Info Produk : ${canonicalUrl}`;


      if(parseFloat(selectedVariant.price.amount)>=500000 && parseFloat(selectedVariant.price.amount)<1000000){
        let listCicilan = `${hargaCash}
Cicilan Tanpa Kartu Kredit
Estimasi Cicilan Kredivo
DP : 0
3X : ${cicilanKredivo3Bulan.toLocaleString("id-ID")}
6X : ${cicilanKredivo6Bulan.toLocaleString("id-ID")}
12X : ${cicilanKredivo12Bulan.toLocaleString("id-ID")}
`
      return listCicilan
      
      }else if (parseFloat(selectedVariant.price.amount)>=1000000){
      
          let listCicilan = `${hargaCash}

Cicilan Tanpa Kartu Kredit
Estimasi Cicilan Kredivo
DP : 0
3x : ${cicilanKredivo3Bulan.toLocaleString("id-ID")}
6x : ${cicilanKredivo6Bulan.toLocaleString("id-ID")}
12x : ${cicilanKredivo12Bulan.toLocaleString("id-ID")}
      
Estimasi Cicilan Homecredit
DP : 0
6x : ${cicilanHci6Bulan.toLocaleString("id-ID")}
9x : ${cicilanHci9Bulan.toLocaleString("id-ID")}
12x : ${cicilanHci12Bulan.toLocaleString("id-ID")}
15x : ${cicilanHci15Bulan.toLocaleString("id-ID")}
18x : ${cicilanHci18Bulan.toLocaleString("id-ID")}
`
    return listCicilan
      
      }
      return 'Produk tidak dapat dicicil'
  }
  
  




  const ImageGallery = ({ productData, selectedVariant, wishlistHandle, wishlistTitle, wishlistImage, wishlistPrice, wishlistEmail, onSecretCopy, youtubeRaw }) => {
    const images = productData.images.edges.map((e) => e.node);
    const youtubeId = extractYouTubeId(youtubeRaw); // '' when no video metafield → gallery behaves exactly as before

    // displayUrl is the source of truth for the main image
    // It is set directly from selectedVariant or from manual navigation
    const [displayUrl, setDisplayUrl] = useState(selectedVariant || images[0]?.src);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [videoMode, setVideoMode] = useState(false);   // B&H style: photo is the hero; video opens via the "Lihat Video" button
    const [videoPlaying, setVideoPlaying] = useState(false);   // facade clicked → real iframe loaded
    const goToVideo = () => { setVideoMode(true); setVideoPlaying(false); };
    const touchStartXRef = useRef(null);
    const touchEndXRef = useRef(null);
    const thumbRef = useRef(null);

    // When variant changes from parent, show its image directly — no matching needed
    useEffect(() => {
      if (selectedVariant) {
        setIsTransitioning(true);
        setDisplayUrl(selectedVariant);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    }, [selectedVariant]);

    const goTo = (idx) => {
      setVideoMode(false); setVideoPlaying(false); // navigating to a photo leaves video mode
      setIsTransitioning(true);
      setDisplayUrl(images[idx]?.src);
      setTimeout(() => setIsTransitioning(false), 300);
      if (thumbRef.current) {
        const thumbEl = thumbRef.current.children[idx];
        if (thumbEl) thumbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    };

    const baseUrl = (url) => url?.split('?')[0];
    const currentIndex = images.findIndex((img) => baseUrl(img.src) === baseUrl(displayUrl));

    // Photos cycle among themselves; the video is entered ONLY via its button/thumbnail,
    // and any swipe/arrow while watching exits back to the photos.
    const goNext = () => {
      if (videoMode) return goTo(0);
      goTo(currentIndex >= 0 ? (currentIndex + 1) % images.length : 0);
    };
    const goPrev = () => {
      if (videoMode) return goTo(0);
      goTo(currentIndex >= 0 ? (currentIndex - 1 + images.length) % images.length : 0);
    };

    const handleTouchStart = (e) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchEndXRef.current = null;
    };
    const handleTouchMove = (e) => {
      touchEndXRef.current = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
      if (touchStartXRef.current === null || touchEndXRef.current === null) return;
      const dist = touchStartXRef.current - touchEndXRef.current;
      if (dist > 50) goNext();
      else if (dist < -50) goPrev();
      touchStartXRef.current = null;
      touchEndXRef.current = null;
    };

    const currentImg = { src: displayUrl, altText: productData?.title };

    const THUMBS_PER_PAGE = 4;
    const totalThumbPages = Math.ceil(images.length / THUMBS_PER_PAGE);
    const thumbPage = currentIndex >= 0 ? Math.floor(currentIndex / THUMBS_PER_PAGE) : 0;
    const visibleThumbs = images.slice(thumbPage * THUMBS_PER_PAGE, thumbPage * THUMBS_PER_PAGE + THUMBS_PER_PAGE);

    return (
      <div className="flex flex-col gap-2 select-none w-full md:max-w-xl md:mx-auto lg:max-w-2xl">

        {zoomOpen && (
          <ZoomViewer
            images={images}
            startIndex={currentIndex >= 0 ? currentIndex : 0}
            onClose={(i) => { if (typeof i === 'number') goTo(i); setZoomOpen(false); }}
          />
        )}

        {/* Main image — full-bleed edge-to-edge on mobile (Shopee-style), contained + rounded on desktop.
            w-auto + -mx-4 widens a block element past the 16px body gutter to the screen edges. */}
        <div
          className="relative w-auto sm:w-full -mx-4 sm:mx-0 bg-white rounded-none sm:rounded-xl overflow-hidden"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={onSecretCopy}
        >
          <div className="aspect-square w-full">
            {videoMode && youtubeId ? (
              videoPlaying ? (
                // Real embed — loaded ONLY after the user clicks play (facade avoids the heavy iframe on load)
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title="Video produk"
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                // Facade: lightweight YouTube thumbnail + play button
                <button
                  type="button"
                  onClick={() => setVideoPlaying(true)}
                  aria-label="Putar video"
                  className="group/vid relative w-full h-full block bg-black"
                >
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                    alt="Video produk"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vid:bg-black/30 transition-colors">
                    <span className="w-16 h-16 rounded-full bg-red-600/95 flex items-center justify-center shadow-xl group-hover/vid:scale-105 transition-transform">
                      <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-1"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                </button>
              )
            ) : (
              <img
                src={currentImg?.src}
                alt={currentImg?.altText || productData?.title}
                loading="eager"
                decoding="async"
                width={600}
                height={600}
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  isTransitioning ? 'opacity-40' : 'opacity-100'
                }`}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              />
            )}
          </div>

          {/* Floating back — MOBILE only (Blibli-style immersive top). It scrolls away with the
              image; the sticky header's back button slides in once you scroll down. Double-click
              secret-copy is unaffected — it fires on the image body, not this corner circle. */}
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Kembali"
            className="sm:hidden absolute top-3 left-3 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white active:scale-95 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* "Lihat Foto" — MOBILE only, shown on the video slide so users can jump to the photos
              (needed because a playing iframe swallows swipe gestures). Sits on the video, not the photo. */}
          {youtubeId && videoMode && (
            <button
              type="button"
              onClick={() => goTo(0)}
              aria-label="Lihat foto produk"
              style={{ background: 'rgba(17, 24, 39, 0.75)', backdropFilter: 'blur(4px)' }}
              className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1 rounded-full text-white text-[11px] font-semibold px-3 py-1 active:scale-95 transition shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M4.5 19.5h15a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
              </svg>
              Lihat Foto
            </button>
          )}

          {/* Zoom / magnifier — opens fullscreen viewer. On mobile it moves to bottom-right so the
              top-left is free for the floating back; on desktop it stays top-left. Separate from the
              image's double-click, so it never clashes with the staff harga-best shortcut. Hidden in video mode. */}
          {!videoMode && (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label="Perbesar foto"
            className="absolute bottom-2 right-2 sm:top-2 sm:left-2 sm:bottom-auto sm:right-auto z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white active:scale-95 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </button>
          )}

          {/* Free Ongkir badge — products 3jt+ (hidden in video mode) */}
          {!videoMode && parseFloat(wishlistPrice) >= 3000000 && (
            <FreeOngkirBadge size="md" className="absolute bottom-2 left-2 z-10" />
          )}

          {/* Prev / Next buttons — desktop only */}
          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Previous image"
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={goNext}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Next image"
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Counter badge — mobile only. Moved to bottom-center so it clears the zoom button
              (now bottom-right) and the Free-Ongkir badge (bottom-left). */}
          {!videoMode && images.length > 1 && currentIndex >= 0 && (
            <div className="md:hidden absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full pointer-events-none">
              {currentIndex + 1}/{images.length}
            </div>
          )}

          {/* Wishlist button — top right */}
          <div className="absolute top-3 right-3 z-10 shadow-md rounded-full">
            <WishlistButton
              handle={wishlistHandle}
              title={wishlistTitle}
              image={wishlistImage}
              price={wishlistPrice}
              customerEmail={wishlistEmail}
            />
          </div>

          {/* Lihat Video — B&H-style floating entry below the wishlist. Photo stays the hero;
              double-click secret-copy on the image body is unaffected (this is a small corner
              button). Pairs with the "Lihat Foto" pill shown while in video mode. */}
          {youtubeId && !videoMode && (
            <button
              type="button"
              onClick={goToVideo}
              aria-label="Lihat video produk"
              // Inline background: the pill must ALWAYS be visible over white product photos
              style={{ background: 'rgba(17, 24, 39, 0.75)', backdropFilter: 'blur(4px)' }}
              className="absolute top-14 right-3 z-10 inline-flex items-center gap-1.5 rounded-full hover:opacity-90 pl-1.5 pr-3 py-1 active:scale-95 transition shadow-md"
            >
              <span className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 ml-0.5" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              </span>
              <span className="text-white text-[11px] font-semibold leading-none whitespace-nowrap">Lihat Video</span>
            </button>
          )}

        </div>

        {/* Thumbnail row — desktop only. Shows for a video too, even with a single photo. */}
        {(images.length > 1 || youtubeId) && (
          <div className="hidden md:flex items-center gap-2">
            {/* Prev thumb page */}
            <button
              onClick={() => goTo(Math.max(0, thumbPage * THUMBS_PER_PAGE - 1))}
              disabled={thumbPage === 0}
              aria-label="Previous thumbnails"
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Video thumb (first) + image thumbnails */}
            <div ref={thumbRef} className="flex gap-2 flex-1 py-1">
              {youtubeId && (
                <button
                  type="button"
                  onClick={() => { setVideoMode(true); setVideoPlaying(false); }}
                  aria-label="Tonton video"
                  className={`relative flex-1 aspect-square rounded-lg overflow-hidden transition-all duration-200 ${videoMode ? 'ring-2 ring-rose-500 opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                  <img src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} alt="Video produk" loading="lazy" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shadow">
                      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                </button>
              )}
              {visibleThumbs.map((img, i) => {
                const realIdx = thumbPage * THUMBS_PER_PAGE + i;
                const isActive = !videoMode && realIdx === currentIndex;
                return (
                  <button
                    key={img.src}
                    onClick={() => goTo(realIdx)}
                    aria-label={`View image ${realIdx + 1}`}
                    className={`flex-1 aspect-square rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'ring-2 ring-rose-500 opacity-100'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={img.src}
                        alt={img.altText || productData?.title}
                        loading="lazy"
                        width={72}
                        height={72}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  </button>
                );
              })}
              {Array.from({ length: THUMBS_PER_PAGE - visibleThumbs.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1 aspect-square" />
              ))}
            </div>

            {/* Next thumb page */}
            <button
              onClick={() => goTo(Math.min(images.length - 1, (thumbPage + 1) * THUMBS_PER_PAGE))}
              disabled={thumbPage >= totalThumbPages - 1}
              aria-label="Next thumbnails"
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 bg-white disabled:opacity-30 hover:border-rose-400 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };


  const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

  function StarRating({ value, onChange, size = 'md' }) {
    const s = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map(star => (
          <button key={star} type="button" onClick={() => onChange?.(star)} className={`${s} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}>
            <svg viewBox="0 0 20 20" fill={star <= value ? '#f59e0b' : '#e5e7eb'} xmlns="http://www.w3.org/2000/svg">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        ))}
      </div>
    );
  }

  const STORAGE_BUCKET = 'galaxypwa.firebasestorage.app';
  const STORAGE_API_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';

  async function compressImage(file, maxWidth = 800, quality = 0.82) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(file);
      reader.onload = (e) => {
        const img = new window.Image();
        img.onerror = () => resolve(file);
        img.onload = () => {
          try {
            const ratio = Math.min(maxWidth / img.width, 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(file); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
          } catch (_) {
            resolve(file);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadPhoto(file) {
    const compressed = await compressImage(file);
    const filename = `reviews/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const encoded = encodeURIComponent(filename);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let res;
    try {
      res = await fetch(
        `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?name=${encoded}&key=${STORAGE_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: compressed, signal: controller.signal }
      );
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error('Upload gagal');
    return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encoded}?alt=media`;
  }

  function ReviewSection({ product, initialReviews }) {
    const [reviews, setReviews] = useState(initialReviews || []);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [name, setName] = useState('');
    const [text, setText] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [expandedPhoto, setExpandedPhoto] = useState(null);

    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
    const source = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('source');

    async function handlePhotoChange(e) {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length) return;
      const remaining = 3 - photoFiles.length;
      const toAdd = files.slice(0, remaining);
      for (const file of toAdd) {
        if (file.size > 10 * 1024 * 1024) { setError('Foto maksimal 10MB per gambar.'); return; }
      }
      const previews = await Promise.all(toAdd.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      })));
      const valid = toAdd.map((f, i) => ({ file: f, preview: previews[i] })).filter(x => x.preview);
      setPhotoFiles(prev => [...prev, ...valid.map(x => x.file)]);
      setPhotoPreviews(prev => [...prev, ...valid.map(x => x.preview)]);
      setError('');
    }

    function removePhoto(idx) {
      setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
      setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
    }

    async function handleVerifyOrder() {
      if (!orderNumber.trim()) return;
      setVerifying(true);
      try {
        const fd = new FormData();
        fd.append('orderNumber', orderNumber);
        const res = await fetch('/api/verify-order', { method: 'POST', body: fd });
        const data = await res.json();
        setVerified(data.verified);
        if (!data.verified) setError('Nomor order tidak ditemukan. Review tetap bisa dikirim tanpa badge terverifikasi.');
        else setError('');
      } catch (_) {}
      setVerifying(false);
    }

    async function handleSubmit(e) {
      e.preventDefault();
      if (!name.trim() || !text.trim()) { setError('Nama dan review wajib diisi.'); return; }
      if (text.trim().length < 10) { setError('Review terlalu singkat.'); return; }
      setSubmitting(true);
      setError('');
      try {
        let photoUrls = [];
        if (photoFiles.length > 0) {
          setUploading(true);
          try {
            photoUrls = await Promise.all(photoFiles.map(f => uploadPhoto(f)));
          } catch (_) {
            setError('Gagal upload foto. Coba lagi atau kirim tanpa foto.');
            setSubmitting(false);
            setUploading(false);
            return;
          }
          setUploading(false);
        }
        const fd = new FormData();
        fd.append('productHandle', product.handle);
        fd.append('productTitle', product.title);
        fd.append('customerName', name.trim());
        fd.append('rating', String(rating));
        fd.append('reviewText', text.trim());
        fd.append('orderNumber', orderNumber.trim());
        fd.append('verifiedPurchase', String(verified));
        fd.append('source', source === 'toko' ? 'toko' : 'online');
        fd.append('photoUrls', JSON.stringify(photoUrls));
        const res = await fetch('/api/submit-review', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || data.error) { setError(data.error || 'Gagal mengirim review.'); setSubmitting(false); return; }
        setSubmitted(true);
        setShowForm(false);
      } catch (_) {
        setError('Terjadi kesalahan. Coba lagi.');
      }
      setSubmitting(false);
    }

    return (
      <>
      <div className="mt-8 border-t pt-6" id="review">
        {/* JSON-LD Review schema for Google */}
        {reviews.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: avg,
              reviewCount: reviews.length,
              bestRating: '5',
              worstRating: '1',
            },
            review: reviews.slice(0, 5).map(r => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.customerName },
              reviewRating: { '@type': 'Rating', ratingValue: String(r.rating) },
              reviewBody: r.reviewText,
              datePublished: r.createdAt?.split('T')[0] || '',
            })),
          })}} />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900">Ulasan Pelanggan</h2>
            {avg && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <StarRating value={Math.round(parseFloat(avg))} />
                <span className="text-sm font-semibold text-gray-700">{avg}</span>
                <span className="text-xs text-gray-400">({reviews.length})</span>
              </div>
            )}
          </div>
          {!submitted && (
            <button onClick={() => setShowForm(f => !f)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: showForm ? '#f3f4f6' : '#111827', color: showForm ? '#374151' : '#ffffff' }}>
              {showForm ? 'Batal' : '+ Ulasan'}
            </button>
          )}
        </div>

        {/* Success message */}
        {submitted && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-medium">
            Terima kasih! Ulasan Anda sedang ditinjau dan akan tampil setelah disetujui.
          </div>
        )}

        {/* Review Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800 mb-3">Tulis Ulasan untuk {product.title}</p>

            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Rating</p>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Nama Anda</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
            </div>

            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Ulasan</label>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Ceritakan pengalaman Anda dengan produk ini..." required rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none" />
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Nomor Order (opsional — untuk badge Pembelian Terverifikasi)</label>
              <div className="flex gap-2">
                <input value={orderNumber} onChange={e => { setOrderNumber(e.target.value); setVerified(false); }} placeholder="#12345"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                <button type="button" onClick={handleVerifyOrder} disabled={verifying || !orderNumber.trim()}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  {verifying ? '...' : verified ? '✓ Terverifikasi' : 'Verifikasi'}
                </button>
              </div>
              {verified && <p className="text-xs text-green-600 mt-1">✓ Pembelian terverifikasi</p>}
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Foto Produk (opsional, maks 3 foto, 10MB per foto)</label>
              <div className="flex items-center gap-2 flex-wrap">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} alt={`preview ${idx + 1}`} className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
                    <button type="button" onClick={() => removePhoto(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors">
                      ×
                    </button>
                  </div>
                ))}
                {photoFiles.length < 3 && (
                  <label className="flex flex-col items-center justify-center gap-1 cursor-pointer h-20 w-20 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-[10px]">{photoPreviews.length === 0 ? 'Tambah Foto' : 'Tambah Lagi'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} multiple />
                  </label>
                )}
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button type="submit" disabled={submitting || uploading}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {uploading ? `Mengupload foto (${photoFiles.length})...` : submitting ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
          </form>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Belum ada ulasan. Jadilah yang pertama!</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {reviews.map(r => (
              <div key={r.id} className="py-4">
                <div className="flex items-start gap-3 mb-1">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br ${['from-blue-500 to-indigo-500','from-rose-500 to-pink-500','from-emerald-500 to-teal-500','from-amber-500 to-orange-500','from-violet-500 to-purple-500'][(r.customerName?.charCodeAt(0) || 0) % 5]}`}>
                    {(r.customerName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* Name + trust badge */}
                    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{r.customerName}</span>
                      {r.verifiedPurchase ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 pl-1 pr-1.5 py-0.5 rounded-full">
                          <CheckSeal className="w-3 h-3 text-emerald-600" /> Pembelian Terverifikasi
                        </span>
                      ) : r.source === 'toko' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 pl-1 pr-1.5 py-0.5 rounded-full">
                          <CheckSeal className="w-3 h-3 text-blue-600" /> Pembeli Toko
                        </span>
                      ) : null}
                    </div>
                    {/* Stars + relative time */}
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={r.rating} />
                      <span className="text-[11px] text-gray-400">{waktuLalu(r.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">{r.reviewText}</p>
                {(r.photoUrls?.length > 0 || r.photoUrl) && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(r.photoUrls?.length > 0 ? r.photoUrls : [r.photoUrl]).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`foto review ${i + 1}`}
                        className="h-24 w-24 rounded-lg object-cover cursor-pointer active:opacity-75 transition-opacity"
                        loading="lazy"
                        decoding="async"
                        onClick={() => setExpandedPhoto(url)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setExpandedPhoto(null)}
        >
          <img src={expandedPhoto} alt="foto ulasan" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
      </>
    );
  }

  function BandingkanModal({ productA, onClose }) {
    const navigate = useNavigate();
    const [allowedCollections, setAllowedCollections] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(null);
    const [comparing, setComparing] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
      async function fetchConfig() {
        try {
          const res = await fetch(`${FIRESTORE_BASE}/perbandingan_config/settings?key=${FIRESTORE_KEY}`);
          if (res.ok) {
            const data = await res.json();
            const raw = data?.fields?.allowedCollections?.stringValue;
            if (raw) setAllowedCollections(JSON.parse(raw));
          }
        } catch (_) {}
        setLoadingConfig(false);
      }
      fetchConfig();
    }, []);

    async function search(val) {
      if (!val.trim()) { setResults([]); return; }
      setSearching(true);
      try {
        let products = [];
        if (allowedCollections && allowedCollections.length > 0) {
          const fetches = allowedCollections.map(col => {
            const fd = new FormData();
            fd.append('q', val);
            fd.append('collection', col.handle);
            return fetch('/api/collection-search', { method: 'POST', body: fd })
              .then(r => r.json()).then(d => d.products || []).catch(() => []);
          });
          const arrays = await Promise.all(fetches);
          const seen = new Set();
          products = arrays.flat().filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }).slice(0, 8);
        } else {
          const fd = new FormData();
          fd.append('q', val);
          fd.append('limit', '8');
          fd.append('type', 'PRODUCT');
          const res = await fetch('/api/predictive-search', { method: 'POST', body: fd });
          const data = await res.json();
          products = data.searchResults?.results?.find(r => r.type === 'products')?.items || [];
        }
        setResults(products.filter(p => p.handle !== productA.handle));
      } catch (_) {}
      setSearching(false);
    }

    function handleInput(e) {
      const val = e.target.value;
      setQuery(val);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(val), 300);
    }

    async function handleCompare() {
      if (!selected) return;
      setComparing(true);
      const slug = [productA.handle, selected.handle].sort().join('-vs-');
      try {
        const res = await fetch(`${FIRESTORE_BASE}/comparisons/${slug}?key=${FIRESTORE_KEY}`);
        if (res.ok) {
          const doc = await res.json();
          if (doc.fields?.article?.stringValue) {
            navigate(`/perbandingan/${slug}`);
            return;
          }
        }
      } catch (_) {}
      navigate('/perbandingan', {
        state: {
          autoProductA: productA,
          autoProductB: selected,
          autoCompare: true,
        },
      });
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Bandingkan dengan</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-1">{productA.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={handleInput}
              placeholder={loadingConfig ? 'Memuat...' : 'Cari produk untuk dibandingkan...'}
              disabled={loadingConfig}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 pr-10"
            />
            {searching && (
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>

          {selected ? (
            <div className="flex items-center gap-3 border border-blue-200 bg-blue-50 rounded-xl p-3 mb-4">
              {selected.image?.url && <img src={selected.image.url} alt={selected.title} className="w-12 h-12 object-contain rounded-lg bg-white flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{selected.title}</p>
                {selected.productType && <p className="text-xs text-gray-400 mt-0.5">{selected.productType}</p>}
              </div>
              <button onClick={() => { setSelected(null); setQuery(''); setResults([]); }} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          ) : results.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-4 shadow-sm">
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setResults([]); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  {p.image?.url && <img src={p.image.url} alt={p.title} className="w-10 h-10 object-contain rounded-lg bg-gray-50 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.title}</p>
                    {p.productType && <p className="text-xs text-gray-400 mt-0.5">{p.productType}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={!selected || comparing}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {comparing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Mengecek...
              </>
            ) : (
              'Bandingkan Sekarang'
            )}
          </button>
        </div>
      </div>
    );
  }

  export default function ProductHandle() {
    const {balasCepat,custEmail,related,admgalaxy,canonicalUrl,customerAccessToken,shop, product, selectedVariant: loaderVariant,metaobject,liveshopee,marketplace,discountVouchers,cachedFaqs,productReviews,soldCount,autoDiscount,hargaBest,pwp} = useLoaderData();

    // Compute selected variant from URL params — all 50 variants are already in product.variants.nodes
    // so this is instant, no server call needed on variant switch
    const [searchParams] = useSearchParams();
    const selectedVariant = (() => {
      const opts = [];
      searchParams.forEach((value, name) => opts.push({name, value}));
      if (!opts.length) return loaderVariant;
      return product.variants.nodes.find(v =>
        opts.every(opt => v.selectedOptions.some(so => so.name === opt.name && so.value === opt.value))
      ) ?? loaderVariant;
    })();

    // Variant-level discounts only apply to the covered variant(s)
    const flashForVariant = autoDiscount && (!autoDiscount.variantIds || autoDiscount.variantIds.includes(selectedVariant?.id))
      ? autoDiscount
      : null;

    // Effective price for the cart subtotal — reflects the flash sale when active
    const subtotalBase = parseFloat(selectedVariant?.price?.amount ?? 0);
    const subtotalPrice = flashForVariant
      ? Math.max(0, flashForVariant.type === 'amount' ? subtotalBase - flashForVariant.amount : Math.round(subtotalBase * (1 - flashForVariant.percentage / 100)))
      : subtotalBase;

    // Product belongs to the cuci-gudang (clearance) collection?
    const inCuciGudang = product?.collections?.nodes?.some(c => c.handle === 'cuci-gudang');

    const [root] = useMatches();
    const cart = root.data?.cart;

  
    // const { cart, applyDiscount } = useCart();

    // console.log('cartttt',cart)

    // console.log(customerAccessToken)
    // console.log('liveshopee',liveshopee)
    // console.log('marketplace',marketplace)

    const [bukaModalBalasCepat, setBukaModalBalasCepat] = useState(false)
    const [bukaModalBandingkan, setBukaModalBandingkan] = useState(false)

    // Affiliate — read from localStorage (set by account.affiliate.jsx after approval)
    const [affiliateRef, setAffiliateRef] = useState(null);
    const [affiliateIsApproved, setAffiliateIsApproved] = useState(false);
    const [affiliateLinkCopied, setAffiliateLinkCopied] = useState(false);
    useEffect(() => {
      if (!custEmail?.customer?.email) return;
      const ref = localStorage.getItem('galaxy_ref') || localStorage.getItem('galaxy_aff_code');
      const status = localStorage.getItem('galaxy_aff_status');
      if (ref) setAffiliateRef(ref);
      if (status === 'approved') setAffiliateIsApproved(true);
    }, [custEmail]);

    const [visitorCount, setVisitorCount] = useState(() => Math.floor(Math.random() * 18) + 8);
    useEffect(() => {
      const interval = setInterval(() => {
        setVisitorCount(prev => {
          const change = Math.random() < 0.5 ? 1 : -1;
          const next = prev + change;
          return Math.min(Math.max(next, 6), 35);
        });
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      try {
        const item = {
          handle: product.handle,
          title: product.title,
          image: product.featuredImage?.url || selectedVariant?.image?.url || '',
          price: parseFloat(selectedVariant.price.amount),
          compareAtPrice: parseFloat(selectedVariant?.compareAtPrice?.amount || 0),
          rating: productReviews?.length ? Number((productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1)) : 0,
          reviewCount: productReviews?.length || 0,
          soldCount: soldCount || 0,
          savedAt: Date.now(),
        };
        const existing = JSON.parse(localStorage.getItem('galaxy_recently_viewed') || '[]')
          .filter(p => p.handle !== item.handle);
        localStorage.setItem('galaxy_recently_viewed', JSON.stringify([item, ...existing].slice(0, 10)));
      } catch (_) {}
    }, [product.handle]);

    const foundAdmin = admgalaxy?.metaobjects?.edges.find(admin => admin?.node?.fields[0]?.value === custEmail?.customer?.email);
  // console.log('Admin ketemu ?', foundAdmin)



    // console.log(liveshopee.metaobjects?.edges[0]?.node)

    // console.log('Garansisssssssssssssssssssssssssss ',related)
    // console.log('Selected Variant ',selectedVariant?.image?.url)



    const [bukaModal, setBukaModal] = useState(false)
    const [isiDalamBoxOpen, setIsiDalamBoxOpen] = useState(false)

    const checkoutCardRef = useRef(null);
    const [showStickyBar, setShowStickyBar] = useState(false);
    useEffect(() => {
      const el = checkoutCardRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (window.innerWidth >= 1024) {
            setShowStickyBar(!entry.isIntersecting);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    // Flash-aware "copy on title click". When a flash sale applies to this variant, the price block
    // shows the extra flash discount + flash price, and the date line becomes the flash end date.
    const rpFmt = (n) => 'Rp ' + Number(Math.max(0, Math.round(n))).toLocaleString('id-ID');
    const copyBasePrice = Number(parseFloat(selectedVariant?.price?.amount)) || 0;
    const copyCompareAt = Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) || 0;
    const copyNormalPrice = copyCompareAt > copyBasePrice ? copyCompareAt : copyBasePrice;
    const copyRegularDiscount = copyNormalPrice - copyBasePrice;

    let copyFlashPrice = copyBasePrice;
    let copyFlashDiscount = 0;
    if (flashForVariant) {
      copyFlashPrice = Math.max(0, flashForVariant.type === 'amount'
        ? copyBasePrice - flashForVariant.amount
        : Math.round(copyBasePrice * (1 - flashForVariant.percentage / 100)));
      copyFlashDiscount = copyBasePrice - copyFlashPrice;
    }

    const copyPriceBlock = flashForVariant
      ? (
          `Harga Normal : ${rpFmt(copyNormalPrice)}\n` +
          (copyRegularDiscount > 0
            ? `Promo Diskon : ${rpFmt(copyRegularDiscount)} + ${rpFmt(copyFlashDiscount)} (Extra Flash Sale)\n`
            : `Promo Flash Sale : ${rpFmt(copyFlashDiscount)}\n`) +
          `Harga Flash Sale : ${rpFmt(copyFlashPrice)}\n\n`
        )
      : (
          copyBasePrice < copyCompareAt
            ? `Harga Normal : ${rpFmt(copyCompareAt)}\nPromo Diskon : ${rpFmt(copyRegularDiscount)}\nHarga Spesial : ${rpFmt(copyBasePrice)}\n`
            : `Harga : ${rpFmt(copyBasePrice)}\n`
        );

    const copyDateBlock = (flashForVariant && flashForVariant.endsAt)
      ? `Berakhir pada : ${new Date(flashForVariant.endsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`
      : (product?.metafields[3]?.value ? 'Periode : ' + perubahTanggal(product.metafields[3]?.value) + ' - ' + perubahTanggal(product.metafields[4]?.value) + '\n' : '');

    const hargaCashCopy = `${product.title}${selectedVariant?.title && selectedVariant.title !== "Default Title" ? ' - ' + selectedVariant.title.replace(/ \/ /g, ' - ') : ''}\n` +
      copyPriceBlock +
      `${product?.metafields[1]?.value ? 'FREE : ' + product?.metafields[1].value + '\n' : ''}`+
      `${product?.metafields[0]?.value ? 'Garansi : ' + product?.metafields[0]?.value + ' ' + (product.vendor !== 'galaxy' && product.vendor) + '\n':''}`+
      copyDateBlock +
      `Info Produk : ${canonicalUrl}`;

      
    // hargaBest is DEFERRED (the Admin-API cost lookup no longer blocks first byte). Resolve the
    // streamed promise into state — the nego bubble & staff secret-copy activate once it lands.
    const [hargaBestData, setHargaBestData] = useState(null);
    useEffect(() => {
      let active = true;
      Promise.resolve(hargaBest).then((v) => { if (active) setHargaBestData(v); }).catch(() => {});
      return () => { active = false; };
    }, [hargaBest]);
    const hargaBestCopy = hargaBestData?.byVariant?.[selectedVariant?.id] ?? '';
    const variantPunyaModal = !!hargaBestData?.withRealCost?.includes(selectedVariant?.id);

    const copyToClipboard = (objekCopy) => {



      const textToCopy = objekCopy

      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      
      // Select and copy the text
      textArea.select();
      document.execCommand('copy');
      
      // Remove the temporary textarea
      document.body.removeChild(textArea);
    };

    // Same copy text but with the "Info Produk : <link>" line removed — used on DOUBLE-click,
    // for Instagram DM (IG blocks product links). Single-click keeps the link (for WhatsApp).
    const stripInfoLink = (text) =>
      (text || '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('Info Produk :'))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s+$/, '');





    return (
      <>
      {bukaModalBalasCepat && (
        <Suspense fallback={null}>
          <Await resolve={balasCepat}>
            {(bc) => <ModalBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} data={bc?.metaobjects?.nodes}/>}
          </Await>
        </Suspense>
      )}
      {bukaModalBandingkan && (
        <BandingkanModal
          productA={{
            id: product.id,
            title: product.title,
            handle: product.handle,
            image: { url: product.featuredImage?.url || selectedVariant?.image?.url || '' },
            price: selectedVariant.price,
            productType: product.productType || '',
          }}
          onClose={() => setBukaModalBandingkan(false)}
        />
      )}

      <section className="lg:container mx-auto w-full gap-2 md:gap-2 grid px-0 md:px-8 lg:px-12 sm:overflow-x-hidden pt-0 md:pt-8">
        <div className="grid grid-cols-1 items-start gap-2 lg:gap-4 md:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr] min-w-0">
          <div className="grid md:grid-flow-row md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full min-w-0">
            <div className="md:col-span-2 md:w-full lg:w-full min-w-0">
              
              <ImageGallery
                productData={product}
                selectedVariant={selectedVariant?.image?.url}
                wishlistHandle={product.handle}
                wishlistTitle={product.title}
                wishlistImage={selectedVariant?.image?.url || product.featuredImage?.url || ''}
                wishlistPrice={String(selectedVariant?.price?.amount || '')}
                wishlistEmail={custEmail?.customer?.email || null}
                onSecretCopy={() => hargaBestCopy && copyToClipboard(hargaBestCopy)}
                youtubeRaw={product?.metafields[15]?.value}
              />
            </div>
          </div>
          <div className="min-w-0">
          {/* Clip only from sm+ — on mobile the flash banner bleeds past the 16px body gutter */}
          <div className="rounded-lg w-full flex flex-col gap-2 py-2 md:px-4 md:py-4 min-w-0 sm:overflow-x-hidden">


            <div className="flex flex-col gap-2 w-full">

              {/* OPTIONS — mobile only (position 1); desktop version rendered below outside this div */}
              <div className='text-sm order-1 md:hidden'>
                {product.options[0].values.length > 1 && (
                  <ProductOptions options={product.options} selectedVariant={selectedVariant} product={product} />
                )}
              </div>

              {/* FLASH SALE banner + countdown */}
              <FlashSaleBanner autoDiscount={flashForVariant} />

              {/* CUCI GUDANG clearance banner — only if product is in that collection */}
              {inCuciGudang && <CuciGudangBanner />}

              {/* PRICE + CICILAN — two-column layout. min-w-0 on the row + the cicilan column lets
                  the text wrap instead of overflowing (was cropping "Lihat ›" on narrow phones). */}
              <div className="flex items-stretch order-2 md:order-4 md:mt-1.5 min-w-0">

                {/* Left: main price + discount — never shrinks, it's the hero */}
                <div
                  className="flex flex-col justify-center cursor-pointer pr-3 sm:pr-4 select-none flex-shrink-0"
                  onClick={() => copyToClipboard(listAngsuran(product, selectedVariant, canonicalUrl))}
                  onDoubleClick={() => copyToClipboard(stripInfoLink(listAngsuran(product, selectedVariant, canonicalUrl)))}
                >
                  {flashForVariant ? (
                    (() => {
                      const basePrice = parseFloat(selectedVariant.price.amount);
                      const flashPrice = Math.max(0, flashForVariant.type === 'amount'
                        ? basePrice - flashForVariant.amount
                        : Math.round(basePrice * (1 - flashForVariant.percentage / 100)));
                      return (
                        <>
                          <div className="text-2xl max-[389px]:text-xl font-bold text-red-600 leading-tight">
                            Rp{flashPrice.toLocaleString("id-ID")}
                          </div>
                          {/* Mobile: HEMAT sits BELOW the coret price (keeps the column narrow so
                              the cicilan side never crops). Desktop: back on one row. */}
                          <div className="flex flex-col items-start gap-1 mt-1 sm:flex-row sm:items-center sm:gap-1.5 sm:flex-wrap">
                            <div className="text-xs line-through text-slate-400 whitespace-nowrap">
                              Rp{basePrice.toLocaleString("id-ID")}
                            </div>
                            <span className="bg-red-50 border border-red-200 text-red-600 px-1.5 py-[1px] rounded-md text-[10px] font-bold tracking-wide whitespace-nowrap">
                              HEMAT {flashForVariant.type === 'amount' ? `Rp${flashForVariant.amount.toLocaleString('id-ID')}` : `${flashForVariant.percentage}%`}
                            </span>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <div className="text-2xl max-[389px]:text-xl font-bold text-rose-700 leading-tight">
                        Rp{parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")}
                      </div>
                      {parseFloat(selectedVariant?.compareAtPrice?.amount) > parseFloat(selectedVariant.price.amount) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="bg-rose-700 px-1.5 py-0.5 font-bold text-white text-[10px] rounded">
                            <HitunganPersen hargaSebelum={selectedVariant.compareAtPrice.amount} hargaSesudah={selectedVariant.price.amount}/>
                          </div>
                          <div className="text-xs line-through text-slate-400">
                            Rp{parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Vertical divider — hidden when the columns stack on ultra-narrow screens */}
                <div className="w-px bg-gray-200 self-stretch flex-shrink-0" />

                {/* Right: cicilan info — centered (as before), with slightly LARGER text on mobile
                    so the column fills its height and sits balanced next to the price block. */}
                <div className="flex flex-col justify-center pl-3 sm:pl-4 gap-1 sm:gap-0.5 min-w-0 flex-1">
                  <div className="text-[13px] sm:text-xs max-[389px]:text-[11px] text-gray-500">Cicilan</div>
                  <div className="text-[15px] sm:text-sm max-[389px]:text-[12.5px] font-bold text-rose-700 leading-tight">
                    <span
                      className="cursor-pointer select-none"
                      onClick={() => copyToClipboard(cicilanKartuKredit(selectedVariant, product, canonicalUrl))}
                      onDoubleClick={() => copyToClipboard(stripInfoLink(cicilanKartuKredit(selectedVariant, product, canonicalUrl)))}
                    >
                      Rp{mulaiDari(selectedVariant).toLocaleString("id-ID")}
                    </span>
                    <span className="font-normal text-gray-600">/bln.</span>
                    <span
                      onClick={() => setBukaModal(true)}
                      className="cursor-pointer text-rose-600 underline underline-offset-2 font-semibold ml-2 whitespace-nowrap"
                    >
                      Lihat ›
                    </span>
                  </div>
                  <div className="text-[13px] sm:text-xs max-[389px]:text-[11px] text-gray-500">Cukup KTP · ±30 menit</div>
                </div>

              </div>

              {/* TITLE — position 4 mobile, 1 desktop */}
              <h1 className="text-base mt-2 md:mt-0 mb-0 md:text-lg font-medium leading-snug whitespace-normal order-4 md:order-1 select-none" onClick={()=>copyToClipboard(hargaCashCopy)} onDoubleClick={()=>copyToClipboard(stripInfoLink(hargaCashCopy))}>
                {product.title}
              </h1>

              {/* SOCIAL PROOF — position 5 mobile, 2 desktop */}
              <div className="flex items-center gap-2 flex-wrap order-5 md:order-2">
                {productReviews?.length > 0 && (() => {
                  const avg = (productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1);
                  return (
                    <button onClick={() => { window.location.hash = '#review'; }}
                      className="flex items-center gap-1.5">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} viewBox="0 0 20 20" className="w-3.5 h-3.5" fill={s <= Math.round(parseFloat(avg)) ? '#f59e0b' : '#e5e7eb'}>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs md:text-sm text-gray-500 underline underline-offset-2">{avg} ({productReviews.length} ulasan)</span>
                    </button>
                  );
                })()}
                {soldCount > 0 && (
                  <>
                    {productReviews?.length > 0 && <span className="text-gray-300 text-xs">·</span>}
                    <span className="text-xs md:text-sm text-gray-500">
                      Terjual <span className="font-semibold text-gray-700">{soldCount.toLocaleString('id-ID')}</span>
                    </span>
                  </>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-xs md:text-sm text-gray-500"><span className="font-semibold text-gray-700">{visitorCount} orang</span> sedang melihat produk ini</span>
                </span>
              </div>

              {/* STOCK + GARANSI + RETUR — Blibli-style trust chips: colored seal icon + muted
                  label, separated by subtle dots. Position 6 mobile, 3 desktop. */}
              {(() => {
                const showStock = !product?.metafields[12]?.value && selectedVariant?.availableForSale;
                const showGaransi = !!product.metafields[0]?.value;
                const showRetur = showStock; // 14-hari tukar baru applies to in-stock, non-discontinued items
                const Dot = () => <span className="text-gray-300 select-none">·</span>;
                return (
                  <div className="flex items-center gap-x-2 order-6 md:order-5 text-xs border-t border-gray-100 pt-2 overflow-x-auto whitespace-nowrap hide-scroll-bar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {showStock && (
                      <span className="inline-flex items-center gap-1 text-gray-700 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.751-3.75 3 3 0 00-5.305 0 3 3 0 00-3.75 3.751 3 3 0 000 5.305 3 3 0 003.75 3.75 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        Stock Ready
                      </span>
                    )}
                    {showStock && showGaransi && <Dot />}
                    {showGaransi && (
                      <span className="inline-flex items-center gap-1 text-gray-700 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-sky-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.749zm4.196 5.954a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.061 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        Garansi Resmi
                      </span>
                    )}
                    {(showStock || showGaransi) && showRetur && <Dot />}
                    {showRetur && (
                      <span className="inline-flex items-center gap-1 text-gray-700 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                        </svg>
                        14 Hari Tukar Baru
                      </span>
                    )}
                  </div>
                );
              })()}

            </div>

            <div className='border-t border-gray-100' />

              {product?.metafields[12]?.value == "true" && (
                <div className='relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/60 shadow-xl'>
                  <div className='absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10'></div>
                  <div className='relative flex items-center gap-4 px-6 py-5'>
                    <div className='flex-shrink-0'>
                      <div className='w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-7 h-7">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4M12 8h.01"></path>
                        </svg>
                      </div>
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-sm font-bold text-white uppercase tracking-widest'>Produk Discontinued</h3>
                      <p className='text-xs text-slate-400 mt-1.5'>Produk ini tidak lagi tersedia untuk pembelian</p>
                    </div>
                  </div>
                </div>
              )}



 

          {/* Bonus Gratis — mobile/tablet only here; on lg+ it lives in the sticky checkout card */}
          {product.metafields[1] && (
            <BonusGratis value={product.metafields[1].value} className="mt-2 lg:hidden" />
          )}


           

            

                <div className='text-sm hidden md:block'>
                  {product.options[0].values.length > 1 && (
                  <ProductOptions
                    options={product.options}
                    selectedVariant={selectedVariant}
                    product={product}
                  />
                  )}
                  </div>
              
     
              {/* AI CHAT — question bubbles */}
              <ProductAIChat product={product} selectedVariant={selectedVariant} autoDiscount={flashForVariant} hasHargaModal={variantPunyaModal} inCuciGudang={inCuciGudang} />

              {/* KODE VOUCHER — inline strip below Tanya AI Galaxy */}
              <Suspense fallback={null}>
                <Await resolve={discountVouchers}>
                  {(vd) => <VoucherInline voucherData={vd} />}
                </Await>
              </Suspense>

              {/* PWP — Tambah & Lebih Hemat (auto-detected from Buy X Get Y automatic discounts) */}
              <Suspense fallback={null}>
                <Await resolve={pwp}>
                  {(pw) => <PwpSection pwp={pw} />}
                </Await>
              </Suspense>




  {product?.metafields[12]?.value == "true" && <TombolWaDiscontinue product={product} />}


    <Suspense fallback={null}>
      <Await resolve={liveshopee}>
        {(ls) => ls?.metaobjects?.edges[0]?.node?.fields[1]?.value === 'true'
          ? <LiveShopee url={ls.metaobjects.edges[0].node.fields[0].value} />
          : null}
      </Await>
    </Suspense>

  
    
  

    <WhyShopHere />


          {product.metafields[2]?.value &&
          <div className='hidden lg:block w-full mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white'>
            <button
              onClick={() => setIsiDalamBoxOpen(o => !o)}
              className={`w-full flex items-center justify-between px-3 py-3 ${isiDalamBoxOpen ? 'border-b border-gray-100' : ''}`}
            >
              <div className='flex items-center gap-2.5'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                <span className='font-medium text-gray-700 text-sm'>Isi Dalam Box</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-gray-400 ${isiDalamBoxOpen ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {isiDalamBoxOpen && (
              <ul
                onClick={() => copyToClipboard(product.metafields[2]?.value)}
                title="Klik untuk menyalin semua"
                className='px-4 py-3 flex flex-col gap-2 cursor-pointer group bg-white'
              >
                {product.metafields[2]?.value.split('\n').filter(Boolean).map((str) => (
                  <li key={str} className='flex items-start gap-2.5 text-sm text-gray-700 leading-snug'>
                    <span className='mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0' />
                    <span>{str}</span>
                  </li>
                ))}
                <div className='mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-600 transition-colors'>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='w-3 h-3'>
                    <path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/>
                  </svg>
                  Klik untuk salin semua
                </div>
              </ul>
            )}
          </div>}
          



          </div>




          



          </div>

          {/* 3RD COLUMN — desktop checkout card, hidden on mobile/tablet */}
          <div className="hidden lg:block">
            <div
              ref={checkoutCardRef}
              className="sticky top-4 border border-gray-200 rounded-2xl shadow-lg bg-white p-4 flex flex-col gap-4"
            >
              {/* Subtotal — reflects the flash-sale price when active */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-500">Subtotal</span>
                <div className="text-right leading-tight">
                  <span className="text-lg font-bold text-rose-700">
                    Rp{subtotalPrice.toLocaleString('id-ID')}
                  </span>
                  {flashForVariant && subtotalBase > subtotalPrice && (
                    <span className="block text-xs text-gray-400 line-through">
                      Rp{subtotalBase.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5">
                <a
                  href={selectedVariant?.availableForSale
                    ? `https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20%22${encodeURIComponent(product.title)}%22%20.%20Link%20Produk%3A%20%22${encodeURIComponent(canonicalUrl)}`
                    : `https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy%2C%20saya%20ingin%20menanyakan%20ketersediaan%20stok%20untuk%20produk%20%22${encodeURIComponent(product.title)}%22.%20Apakah%20masih%20tersedia%20atau%20kapan%20akan%20restock%3F%20Terima%20kasih%20%F0%9F%99%8F%20Link%20Produk%3A%20${encodeURIComponent(canonicalUrl)}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                >
                  <FaWhatsapp className="text-base" />
                  {selectedVariant?.availableForSale ? 'Order via WhatsApp' : 'Tanya Ketersediaan'}
                </a>

                {selectedVariant?.availableForSale && (
                  <CartForm
                    route="/cart"
                    inputs={{ lines: [{ merchandiseId: selectedVariant.id }] }}
                    action={CartForm.ACTIONS.LinesAdd}
                  >
                    {(fetcher) => (
                      <>
                        {affiliateRef && <input type="hidden" name="affiliate_ref" value={affiliateRef} />}
                        <button
                          type="submit"
                          onClick={() => { window.location.href = window.location.href + '#cart-aside'; }}
                          disabled={fetcher.state !== 'idle'}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors shadow-sm"
                        >
                          <FaBagShopping className="text-base" />
                          Beli Sekarang
                        </button>
                      </>
                    )}
                  </CartForm>
                )}

                <button
                  onClick={() => setBukaModalBandingkan(true)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
                  </svg>
                  Bandingkan Produk
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-1 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  Toko Sejak 2014
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  100% Original
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  Pembayaran Aman
                </span>
              </div>

              {/* Ships-from line — local trust + speed cue */}
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-6.375m0-11.25h4.125c.621 0 1.125.504 1.125 1.125v6.375" />
                </svg>
                Dikirim dari Galaxy Camera Tangerang
              </p>

              {/* Bonus Gratis — desktop home (middle column shows it below lg) */}
              {product.metafields[1] && (
                <BonusGratis value={product.metafields[1].value} />
              )}

              {/* Brand authorized dealer row */}
              <Suspense fallback={null}>
                <Await resolve={metaobject}>
                  {(mo) => mo?.metaobject?.logo?.reference?.image?.url ? (
                    <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                      <img
                        src={mo.metaobject.logo.reference.image.url}
                        alt={mo?.metaobject?.field?.value || 'Brand'}
                        className="w-20 h-12 object-contain flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-600">Authorized Dealer</span>
                      </div>
                    </div>
                  ) : null}
                </Await>
              </Suspense>
            </div>
          </div>


          {/* (Tebus Murah removed — replaced by the PWP "Tambah & Lebih Hemat" section) */}
          
          


          

          
        </div>



        


            <div className='px-4 py-1 md:px-0 flex items-center gap-1.5'>
              <span className='text-xs text-gray-400 font-medium mr-1'>Share</span>

              {/* Copy link */}
              <button
                onClick={() => copyToClipboard(canonicalUrl)}
                title="Copy link"
                className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all active:scale-95'
              >
                <FaLink size={13} />
              </button>

              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${canonicalUrl}`}
                data-action="share/whatsapp/share"
                target="_blank"
                rel="noopener noreferrer"
                title="Share via WhatsApp"
                className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-[#25d366]/20 transition-all active:scale-95'
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='w-4 h-4'><path fill="#25d366" d="M92.1 254.6c0 24.9 7 49.2 20.2 70.1l3.1 5-13.3 48.6L152 365.2l4.8 2.9c20.2 12 43.4 18.4 67.1 18.4h.1c72.6 0 133.3-59.1 133.3-131.8c0-35.2-15.2-68.3-40.1-93.2c-25-25-58-38.7-93.2-38.7c-72.7 0-131.8 59.1-131.9 131.8zM274.8 330c-12.6 1.9-22.4 .9-47.5-9.9c-36.8-15.9-61.8-51.5-66.9-58.7c-.4-.6-.7-.9-.8-1.1c-2-2.6-16.2-21.5-16.2-41c0-18.4 9-27.9 13.2-32.3c.3-.3 .5-.5 .7-.8c3.6-4 7.9-5 10.6-5c2.6 0 5.3 0 7.6 .1c.3 0 .5 0 .8 0c2.3 0 5.2 0 8.1 6.8c1.2 2.9 3 7.3 4.9 11.8c3.3 8 6.7 16.3 7.3 17.6c1 2 1.7 4.3 .3 6.9c-3.4 6.8-6.9 10.4-9.3 13c-3.1 3.2-4.5 4.7-2.3 8.6c15.3 26.3 30.6 35.4 53.9 47.1c4 2 6.3 1.7 8.6-1c2.3-2.6 9.9-11.6 12.5-15.5c2.6-4 5.3-3.3 8.9-2s23.1 10.9 27.1 12.9c.8 .4 1.5 .7 2.1 1c2.8 1.4 4.7 2.3 5.5 3.6c.9 1.9 .9 9.9-2.4 19.1c-3.3 9.3-19.1 17.7-26.7 18.8zM448 96c0-35.3-28.7-64-64-64H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96zM148.1 393.9L64 416l22.5-82.2c-13.9-24-21.2-51.3-21.2-79.3C65.4 167.1 136.5 96 223.9 96c42.4 0 82.2 16.5 112.2 46.5c29.9 30 47.9 69.8 47.9 112.2c0 87.4-72.7 158.5-160.1 158.5c-26.6 0-52.7-6.7-75.8-19.3z"/></svg>
              </a>

              {/* Copy title */}
              <button
                onClick={() => copyToClipboard(product.title)}
                title="Copy product name"
                className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all active:scale-95'
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='w-3.5 h-3.5'><path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/></svg>
              </button>

              {/* Affiliate copy link — only shown for approved affiliates */}
              {affiliateIsApproved && affiliateRef && (
                <button
                  onClick={() => {
                    const link = `${canonicalUrl}?ref=${affiliateRef}`;
                    navigator.clipboard.writeText(link);
                    setAffiliateLinkCopied(true);
                    setTimeout(() => setAffiliateLinkCopied(false), 2000);
                  }}
                  title="Salin link affiliate"
                  className='flex items-center gap-1.5 px-2.5 h-8 rounded-full text-[11px] font-bold transition-all active:scale-95'
                  style={{ background: affiliateLinkCopied ? '#059669' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}
                >
                  {affiliateLinkCopied ? '✓ Disalin' : '🔗 Affiliate'}
                </button>
              )}
            </div>




      
    <div className='px-4 py-1 md:px-0 text-sm flex flex-col md:flex-row sm:gap-8'>

        {/* Brand authorized dealer — mobile/tablet only (lg has it in 3rd column) */}
        <Suspense fallback={null}>
          <Await resolve={metaobject}>
            {(mo) => mo?.metaobject?.logo?.reference?.image?.url ? (
              <div className="lg:hidden flex items-center gap-2 mb-1 pl-1">
                <img
                  src={mo.metaobject.logo.reference.image.url}
                  alt={mo?.metaobject?.field?.value || 'Brand'}
                  className="w-16 h-10 object-contain flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-600">Authorized Dealer</span>
                </div>
              </div>
            ) : null}
          </Await>
        </Suspense>

        <Suspense fallback={null}>
          <Await resolve={metaobject}>
            {(mo) => mo?.metaobject?.field?.value ? (
              <div className='flex flex-row gap-1 mb-1 pl-1'>
                <div className=' mr-3 '>Brand</div>
                <Link to={`/brands/${mo.metaobject.field?.value}`}>
                  <div className='font-bold text-slate-600'>{mo.metaobject.field?.value}</div>
                </Link>
              </div>
            ) : null}
          </Await>
        </Suspense>


        {product.metafields[0]?.value &&
        <div className='flex flex-row gap-1 mb-1 pl-1'>
          <div className=' mr-3 '>Garansi</div>
          <div className='font-bold text-slate-600'>Resmi {product.metafields[0]?.value} {product.vendor !== 'galaxy' && product.vendor}</div>
        </div>
      }

        {product.metafields[3]?.value &&
        <div className='flex flex-row gap-1 mb-1 pl-1'>
          <div className=' mr-3 '>Periode</div>
          <div className='font-bold text-slate-600'>{perubahTanggal(product.metafields[3]?.value)} - {perubahTanggal(product.metafields[4]?.value)}</div>
        </div>
        }



    </div>


 



{/* 
            <div className="w-full prose md:border-t md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/> */}


            {/* <div className="w-full prose md:border-t md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html:product.metafields[5]?.value }}/> */}
        <div className='px-4 md:px-0 min-w-0'>

        <div className='w-full'>

        
        <InfoProduk
        deskripsi={(<div className="w-full"><div className="w-full max-w-none prose prose-sm prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-4 prose-headings:mb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2 prose-li:text-gray-700 prose-li:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:my-4 prose-img:max-w-full prose-ul:my-2 prose-ol:my-2 pt-2 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-4 [&_iframe]:max-w-full"
              dangerouslySetInnerHTML={{ __html: stripYouTubeIframes(product.descriptionHtml) }}/></div>)}
        isibox={product.metafields[2]?.value}
        specs={(<div className="overflow-x-auto w-full"><div className="w-full max-w-none prose prose-sm prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-strong:font-semibold prose-table:text-sm pt-2"
              dangerouslySetInnerHTML={{ __html:product.metafields[5]?.value }}/></div>)}
        ulasan={<ReviewSection product={product} initialReviews={productReviews} />}
        reviewCount={productReviews?.length || 0}
        />

          </div>



          
        </div>

        {/* FAQ Schema + Pertanyaan Umum — deferred, streams in after critical content */}
        <Suspense fallback={null}>
          <Await resolve={cachedFaqs}>
            {(faqs) => {
              const EXCLUDED_COLLECTIONS = ['aksesoris', 'accessories', 'used', 'bekas', 'spare-part'];
              const MIN_PRICE = 500000;
              const productCollections = product.collections?.nodes?.map(c => c.handle) || [];
              const isExcludedCollection = productCollections.some(h => EXCLUDED_COLLECTIONS.includes(h));
              const price = parseFloat(selectedVariant?.price?.amount || 0);
              if (isExcludedCollection || price < MIN_PRICE) return null;
              return (
                <>
                  {faqs?.length > 0 && (
                    <script
                      type="application/ld+json"
                      dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                          '@context': 'https://schema.org',
                          '@type': 'FAQPage',
                          mainEntity: faqs.map(faq => ({
                            '@type': 'Question',
                            name: faq.question,
                            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                          })),
                        }),
                      }}
                    />
                  )}
                  <PertanyaanUmum key={product.id} product={product} isAdmin={!!foundAdmin} initialFaqs={faqs} />
                </>
              );
            }}
          </Await>
        </Suspense>

        {/* <ParseSpesifikasi jsonString={product.metafields[5]?.value}/> */}



      {bukaModal&&<Modal 
      canonicalUrl={canonicalUrl} 
      perubahTanggal={perubahTanggal} 
      product={product} 
      selectedVariant={selectedVariant} 
      statusOpen={bukaModal} 
      setBukaModal={setBukaModal}
      bungaHCI={bungaHCI}
      admKredivo={admKredivo}
      adminFee3BulanKredivo={adminFee3BulanKredivo}
      adminKartuKredit6Bulan={adminKartuKredit6Bulan}
      adminKartuKredit12Bulan={adminKartuKredit12Bulan}
      />}
      
      <div className='mt-5 pt-5 font-bold border-t'>PRODUK SERUPA</div>

      <BackToTop />

      {/* DESKTOP STICKY CHECKOUT START HERE */}

      {selectedVariant?.availableForSale
        && product?.metafields[12]?.value != "true"
         && (
      
      <div className={`hidden md:flex ${showStickyBar ? '' : 'lg:hidden'} fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]`}>
        <div className='max-w-5xl mx-auto w-full px-4 md:px-8 py-3 flex items-center gap-6'>

          {/* Product info */}
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            {(selectedVariant?.image?.url || product?.featuredImage?.url) && (
              <img
                src={selectedVariant?.image?.url || product.featuredImage.url}
                alt={product.title}
                className='w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100'
              />
            )}
            <div className='min-w-0'>
              <p className='text-xs text-gray-500 truncate max-w-xs lg:max-w-sm'>{product.title}</p>
              <div className='flex items-baseline gap-2'>
                <span className='text-xl font-bold text-gray-900'>
                  Rp{parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")}
                </span>
                {parseFloat(selectedVariant?.compareAtPrice?.amount) > parseFloat(selectedVariant.price.amount) && (
                  <span className='text-sm text-gray-400 line-through'>
                    Rp{parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")}
                  </span>
                )}
                {parseFloat(selectedVariant?.compareAtPrice?.amount) > parseFloat(selectedVariant.price.amount) && (
                  <span className='text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded'>
                    -{Math.round((1 - parseFloat(selectedVariant.price.amount) / parseFloat(selectedVariant.compareAtPrice.amount)) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2.5 flex-shrink-0 ml-auto'>

            <button
              onClick={() => setBukaModalBandingkan(true)}
              className='inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors whitespace-nowrap'
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
              </svg>
              <span className='hidden lg:inline'>Bandingkan</span>
            </button>

            <a
              href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20"${product.title}"%20.%20Link%20Produk:%20" ${canonicalUrl}`}
              target="_blank"
              rel="noreferrer"
            >
              <button className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors whitespace-nowrap'>
                <FaWhatsapp className='text-base' />
                <span className='hidden lg:inline'>Order via WhatsApp</span>
                <span className='lg:hidden'>WhatsApp</span>
              </button>
            </a>

            <CartForm
              route="/cart"
              inputs={{ lines: [{ merchandiseId: selectedVariant.id }] }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <>
                  {affiliateRef && <input type="hidden" name="affiliate_ref" value={affiliateRef} />}
                  <button
                    type="submit"
                    onClick={() => { window.location.href = window.location.href + '#cart-aside'; }}
                    disabled={!selectedVariant.availableForSale ?? fetcher.state !== 'idle'}
                    className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shadow-sm'
                  >
                    <FaBagShopping className='text-base' />
                    {selectedVariant?.availableForSale ? 'Beli Sekarang' : 'Sold Out'}
                  </button>
                </>
              )}
            </CartForm>
          </div>

        </div>
      </div>
    )}

        {/* DESKTOP STICKY CHECKOUT END HERE */}

      {/* DESKTOP — slim Bandingkan bar for out-of-stock / discontinued */}
      {(!selectedVariant?.availableForSale || product?.metafields[12]?.value == "true") && (
        <div className={`hidden md:flex ${showStickyBar ? '' : 'lg:hidden'} fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-sm shadow-[0_-2px_12px_rgba(0,0,0,0.06)]`}>
          <div className='max-w-5xl mx-auto w-full px-4 md:px-8 py-2.5 flex items-center justify-between gap-4'>
            <p className='text-sm text-gray-500 truncate min-w-0'>{product.title}</p>
            <button
              onClick={() => setBukaModalBandingkan(true)}
              className='flex-shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold transition-colors'
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
              </svg>
              Bandingkan dengan Produk Lain
            </button>
          </div>
        </div>
      )}

      </section>

     

        <div className="mt-2 mb-5 relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">

        <Suspense fallback={null}>
          <Await resolve={related}>
            {(rel) => <ProdukRelated related={rel} />}
          </Await>
        </Suspense>

        {/* Recently viewed — exit-intent rail for comparison shoppers */}
        <RecentlyViewed />
        </div>


        {foundAdmin && <TombolBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} />}

        {/* BOTTOM CHECKOUT START HERE */}

        {selectedVariant?.availableForSale 
          && product?.metafields[12]?.value != "true" 
           && (
        
        <div className='md:hidden fixed left-0 bottom-0 w-full z-50 bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2'>

          {/* Bandingkan — icon only */}
          <button
            onClick={() => setBukaModalBandingkan(true)}
            className='flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700'
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Call — icon only */}
          <a href="tel:082111311131" target="_blank" className='flex-shrink-0'>
            <div className='w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700'>
              <FaPhone className='text-base' />
            </div>
          </a>

          {/* Nego */}
          <a
            href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20"${product.title}"%20.%20Link%20Produk:%20" ${canonicalUrl}`}
            target="_blank"
            className='flex-1'
          >
            <div className='w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold'>
              <FaWhatsapp className='text-base' />
              Nego
            </div>
          </a>

          {/* Beli */}
          <div className='flex-1'>
            <CartForm
              route="/cart"
              inputs={{ lines: [{ merchandiseId: selectedVariant.id }] }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <>
                  {affiliateRef && <input type="hidden" name="affiliate_ref" value={affiliateRef} />}
                  <button
                    type="submit"
                    onClick={() => { window.location.href = window.location.href + '#cart-aside'; }}
                    disabled={!selectedVariant.availableForSale ?? fetcher.state !== 'idle'}
                    className='w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 text-white text-sm font-semibold'
                  >
                    <FaBagShopping className='text-base' />
                    {selectedVariant?.availableForSale ? 'Beli' : 'Sold Out'}
                  </button>
                </>
              )}
            </CartForm>
          </div>

        </div>
      )}

      {/* MOBILE — slim Bandingkan bar for out-of-stock / discontinued */}
      {(!selectedVariant?.availableForSale || product?.metafields[12]?.value == "true") && (
        <div className='md:hidden fixed left-0 bottom-0 w-full z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-3 py-2'>
          <button
            onClick={() => setBukaModalBandingkan(true)}
            className='w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-semibold active:bg-gray-50 transition-colors'
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
              <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
            </svg>
            Bandingkan dengan Produk Lain
          </button>
        </div>
      )}



          {/* BOTTOM CHECKOUT END HERE */}

      </>

    );
  }



// "Why shop with us" trust cards (Zalora-style) — replaces the old accordion list
const GALAXY_STORES = [
  { name: 'Galaxy Camera Tangerang', addr: 'Ruko Mall Metropolis Town Square, Blok GM3 No.6, Kelapa Indah, Tangerang', maps: 'https://share.google/ZiBByg1aC3SE57Prk' },
  { name: 'Galaxy Camera Depok', addr: 'Mall Depok Town Square, Lantai 2 Blok SS2 No.8, Beji, Depok', maps: 'https://share.google/vJXAelUjHdYQlkF0b' },
];

function WhyShopHere() {
  const [storeOpen, setStoreOpen] = useState(false);
  const cardBase = 'relative overflow-hidden rounded-xl p-2.5 sm:p-3.5 text-left transition-colors block no-underline';
  return (
    <div className="mt-3">
      <p className="text-sm sm:text-base font-bold text-gray-900 mb-2.5 px-0.5">Mengapa belanja di Galaxy.co.id?</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">

        {/* Ambil di Toko — expands the store addresses below */}
        <button
          type="button"
          onClick={() => setStoreOpen(o => !o)}
          className={`${cardBase} ${storeOpen ? 'bg-emerald-100' : 'bg-emerald-50 hover:bg-emerald-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mb-1 relative z-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 21v-3.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21" />
          </svg>
          <p className="text-[11px] sm:text-sm font-bold text-emerald-900 leading-tight relative z-10">Bisa Ambil di Toko</p>
          <p className="text-[9px] sm:text-[11px] text-emerald-700/80 mt-0.5 leading-tight relative z-10 flex items-center gap-0.5">
            2 cabang
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform ${storeOpen ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" /></svg>
          </p>
        </button>

        {/* 14 Hari Tukar Baru */}
        <div className={`${cardBase} bg-lime-50`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-lime-600 mb-1 relative z-10">
            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
          <p className="text-[11px] sm:text-sm font-bold text-lime-900 leading-tight relative z-10">14 Hari Tukar Baru</p>
          <p className="text-[9px] sm:text-[11px] text-lime-700/80 mt-0.5 leading-tight relative z-10">Cacat / DOA dijamin</p>
        </div>

        {/* Pengadaan Barang — WhatsApp */}
        <a
          href={`https://wa.me/6282111311131?text=${encodeURIComponent('Halo admin Galaxy Camera, saya mau tanya soal pengadaan barang')}`}
          target="_blank"
          rel="noreferrer"
          className={`${cardBase} bg-sky-50 hover:bg-sky-100`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 mb-1 relative z-10">
            <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 0 0 0 1.5v16.5h-.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5h-.75V3.75a.75.75 0 0 0 0-1.5h-15ZM9 6a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H9Zm-.75 3.75A.75.75 0 0 1 9 9h1.5a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM9 12a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H9Zm3.75-5.25A.75.75 0 0 1 13.5 6H15a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM13.5 9a.75.75 0 0 0 0 1.5H15A.75.75 0 0 0 15 9h-1.5Zm-.75 3.75a.75.75 0 0 1 .75-.75H15a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM9 19.5v-2.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 9 19.5Z" clipRule="evenodd" />
          </svg>
          <p className="text-[11px] sm:text-sm font-bold text-sky-900 leading-tight relative z-10">Pengadaan Barang</p>
          <p className="text-[9px] sm:text-[11px] text-sky-700/80 mt-0.5 leading-tight relative z-10">Kantor & instansi</p>
        </a>
      </div>

      {/* Store addresses — revealed by the Ambil di Toko card */}
      {storeOpen && (
        <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex flex-col gap-3">
          {GALAXY_STORES.map(s => (
            <div key={s.name}>
              <p className="text-xs sm:text-sm font-semibold text-gray-800">{s.name}</p>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-snug">{s.addr}</p>
              <a href={s.maps} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1 no-underline">
                📍 Lihat di Google Maps →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarketPlace({link}){
  
  const {marketplace} = useLoaderData();
  return(
    <div className='flex flex-wrap gap-2'>
      {marketplace.metaobjects?.edges.map((item)=>{
        const linkS = item.node?.fields[1]?.value.toLowerCase()
        const linkTokopediaObject = link.find(item => item && item.key === linkS);
        {/* console.log('Hello workds',linkTokopediaObject?.value) */}
        return(
          <div key={item.node?.id} >
            <a href={linkTokopediaObject?.value ? linkTokopediaObject.value : item.node?.fields[2]?.value} target="_blank">
            <div>
              <img src={item.node?.fields[0]?.reference?.image?.url} alt={item.node?.fields[1]?.value} className='border p-1 h-9 w-auto rounded-md'/>
              {/* {linkTokopediaObject?.value ? linkTokopediaObject.value : item.node?.fields[2]?.value} */}
            </div>
            </a>
          </div>
        )
      })}
    </div>
  )
}



  function perubahTanggal(tanggalInput){
    const inputDateString = tanggalInput;
    const date = new Date(inputDateString);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate
  }

function TombolWa({product,canonicalUrl}){
  // const infoChat = `Hi admin Galaxy saya berminat tentang produk ${namaProduk}. Boleh dibantu untuk info lebih lanjut`
  const namaProduk = product.title
  const urlProduk = product.handle


  return(
    <>
        <div className='text-sm text-gray-500 mt-3 mb-2'>Ingin harga best price dari kami? Yuk Negoin aja</div>
        <div className='gap-2 items-center border border-emerald-500 rounded-md p-2 cursor-pointer font-semibold text-center hover:font-bold'>
            <a href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20"${namaProduk}"%20.%20Link%20Produk:%20" ${canonicalUrl}`} target="_blank" rel="noopener noreferrer" className='drop-shadow-sm text-emerald-700 '>ORDER VIA WHATSAPP</a>
      </div>

     
    </>
  )
}

function TombolWaDiscontinue({product}){
  // const infoChat = `Hi admin Galaxy saya berminat tentang produk ${namaProduk}. Boleh dibantu untuk info lebih lanjut`
  const namaProduk = product.title
  const urlProduk = product.handle


  return(
    <>
    
        <div className='gap-2 items-center bg-gradient-to-r from-green-200 to-emerald-800 rounded p-2 cursor-pointer font-semibold text-white text-center'>
            <a href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20bertanya%20tentang%20produk%20pengganti%20"${namaProduk}"%20.%20Link%20Produk:%20" ${urlProduk}`} target="_blank" className='drop-shadow-sm text-white'>Chat Admin</a>
      </div>

     
    </>
  )
}



  const PRODUCT_QUERY = `#graphql
  query product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
    shop {
      primaryDomain {
        url
      }
    }

    


    product(handle: $handle) {
      images(first:10){
        edges{
          node{
            src
          }
        }
      }
 
      id
      title
      handle
      vendor
      description
      metafields(identifiers:[
        {namespace:"custom" key:"garansi"}
        {namespace:"custom" key:"free"}
        {namespace:"custom" key:"isi_dalam_box"}
        {namespace:"custom" key:"periode_promo"}
        {namespace:"custom" key:"periode_promo_akhir"}
        {namespace:"custom" key:"spesifikasi"}
        {namespace:"custom" key:"brand"}
        {namespace:"custom" key:"tokopedia"}
        {namespace:"custom" key:"shopee"}
        {namespace:"custom" key:"blibli"}
        {namespace:"custom" key:"bukalapak"}
        {namespace:"custom" key:"lazada"}
        {namespace:"custom" key:"produk_discontinue"}
        {namespace:"custom" key:"produk_serupa"}
        # tebus_murah feature removed, but the identifier stays: metafields are read by POSITION
        # (metafields[15] = youtube) — removing this row would shift every index after it
        {namespace:"custom" key:"tebus_murah"}
        {namespace:"custom" key:"youtube"}
      ]){
        key
        value
      }
      descriptionHtml
      featuredImage {
        id
        url
        altText
        width
        height
      }
      options {
        name,
        values
      }

      collections(first:50){
        nodes{
          title
          handle
        }
      }


      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }

      variants(first: 50) {
        nodes {
          id
          title
          image{
          url
          }
          availableForSale
          sku
          price {
            currencyCode
            amount
          }
          compareAtPrice {
            currencyCode
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

const METAOBJECT_QUERY = `#graphql
  query metaobject($id: ID!) {
    metaobject(id: $id) {
      field(key: "brand") {
        value
      }
      logo: field(key: "logo") {
        reference {
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
`;





const METAOBJECT_LIVE_SHOPEE = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          value
        }
      }
    }
  }
}`;

const METAOBJECT_DISCOUNT_VOUCHERS = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          key
          value
        }
      }
    }
  }
}`;

const METAOBJECT_MARKETPLACE = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          value
          reference{
            ... on MediaImage {
           image {
             url
           }
         }
           }
        }
      }
    }
  }
}`;


const PRODUK_RELATED = `#graphql
query productRecommendations($productId:ID!){
productRecommendations(productId: $productId,intent: RELATED) {
    id
  	handle
  	title
  	compareAtPriceRange{
      minVariantPrice{
        amount
      }
    }
  	priceRange{
      minVariantPrice{
        amount
      }
    }
  	featuredImage {
      url
  	}
  }
}`;

const METAOBJECT_ADMIN_GALAXY = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          value
        }
      }
    }
  }
}`;


const CUSTOMER_EMAIL_QUERY = `#graphql
query CustomerEmailQuery($customertoken: String!) {
  customer(customerAccessToken: $customertoken) {
    email
  }
}`;


const BALAS_CEPAT = `#graphql
query BrandQuery($first:Int!){
    metaobjects(first:$first type:"balas_cepat"){
    nodes {
      id
      fields {
        value
        key
      }
    }
  }}
`





export const meta = ({data}) => {

  


  const today = new Date();
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const indonesianMonth = monthNames[today.getMonth()];
    const year = today.getFullYear();

  // Get the end of the current month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Format the end date as "YYYY-MM-DD"
  const endDateFormatted = endOfMonth.toISOString().split('T')[0];

  // OLD TITLE - Commented for future reference
  // const title = data?.product?.title + ' Harga Murah ' + indonesianMonth + ' ' +year

  // ENHANCED TITLE - Better SEO with brand and urgency
  const title = data?.product?.title + ' - Harga Terbaik ' + indonesianMonth + ' ' + year + ' | Galaxy Camera'

  // OLD DESCRIPTION - Commented for future reference
  // const deskripsiBaru =  'Beli ' + data?.product?.title + ' Harga Murah ' + indonesianMonth + ' ' +year + ' Gratis Ongkir, Cicilan 0%.'

  // ENHANCED DESCRIPTION - More compelling with trust signals
  const deskripsiBaru = '✓ Beli ' + data?.product?.title + ' Harga Terbaik ' + indonesianMonth + ' ' + year + 
    ' ✓ Gratis Ongkir ✓ Cicilan 0% ✓ Garansi Resmi ✓ Bergaransi ✓ Terpercaya sejak 2012'

  // ENHANCED KEYWORDS - Long-tail and variations
  const productKeywords = data?.product?.title + ', ' +
    data?.product?.title + ' murah, ' +
    data?.product?.title + ' original, ' +
    data?.product?.title + ' terbaik, ' +
    'beli ' + data?.product?.title + ', ' +
    data?.product?.title + ' jakarta, ' +
    data?.product?.title + ' tangerang, ' +
    (data?.metaobject?.metaobject?.field?.value || '') + ' camera'




  return [
    { title: title },
    {
      name: "title",
      content: title,
    },
    {
      name: "description",
      content: deskripsiBaru.substring(0, 160), // Extended to 160 chars for better SEO
    },
    {
      name: "keywords",
      content: productKeywords, // Enhanced keywords
    },





    {
      property: "og:title",
      content: title,
    },

    {
      property: "og:description",
      content: deskripsiBaru.substring(0, 155),
    },
    {
      property: "og:type",
      content: "product",
    },
    // ENHANCED - Added product-specific OG tags
    {
      property: "product:price:amount",
      content: data?.selectedVariant?.price?.amount,
    },
    {
      property: "product:price:currency",
      content: "IDR",
    },
    {
      property: "product:availability",
      content: data?.selectedVariant?.availableForSale ? "in stock" : "out of stock",
    },
    {
      property: "product:brand",
      content: data?.metaobject?.metaobject?.field?.value || "Galaxy Camera",
    },
    {
      property: "product:condition",
      content: "new",
    },
    {
      property: "og:site_name",
      content: "galaxy.co.id",
    },
    {
      property: "og:image",
      content: data?.product?.featuredImage?.url,
    },
    {
      property: "og:url",
      content: data.canonicalUrl,
    },

    // ENHANCED - Changed to summary_large_image for better display
    {
      property: "twitter:card",
      content: 'summary_large_image', // Changed from 'summary' to 'summary_large_image'
    },

    {
      property: "twitter:site",
      content: '@galaxycamera99', // Added @ prefix for proper Twitter handle
    },

    {
      property: "twitter:title",
      content: title,
    },

    {
      property: "twitter:description",
      content: deskripsiBaru.substring(0, 160), // Extended to 160 chars
    },

    {
      property: "twitter:image",
      content: data?.product?.featuredImage?.url,
    },


    {
      name: "mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "apple-touch-fullscreen",
      content: "yes",
    },
    {
    name: "apple-mobile-web-app-title",
    content: "Galaxy Camera",
  },
  {
    name: "apple-mobile-web-app-capable",
    content: "yes",
  },
  {
    name: "apple-mobile-web-app-status-bar-style",
    content: "default",
  },

  { tagName:'link',
  rel:'canonical',
  href: data.canonicalUrl
},

// PRODUCT SCHEMA - Keep existing Product schema
{
  "script:ld+json": {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": data?.product?.title,
    "image": data?.product?.images.edges[0].node.src,
    "description": data?.product?.description,
    "sku": data?.selectedVariant?.sku,
    "mpn": data?.selectedVariant?.sku,
    "brand": {
      "@type": "Brand",
      "name": data?.metaobject?.metaobject?.field?.value || "Galaxy Camera"
    },
    "review": {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 5,
        "bestRating": 5
      },
      "author": {
        "@type": "Person",
        "name": "Sistiana"
      },
      // ENHANCED - Added review body
      "reviewBody": "Pelayanan cepat dan produk original. Sangat puas berbelanja di Galaxy Camera!"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 5,
      "reviewCount": 1
    },
    "offers": {
      "@type": "Offer",
      "price":data?.selectedVariant?.price?.amount && parseInt(data?.selectedVariant?.price?.amount,10).toString(),
      "url":data.canonicalUrl,
      "availability":data?.selectedVariant?.availableForSale? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceCurrency": "IDR",
      "priceValidUntil": endDateFormatted,
      // ENHANCED - Added seller info
      "seller": {
        "@type": "Organization",
        "name": "PT Galaxy Digital Niaga"
      },
      "itemCondition": "https://schema.org/NewCondition",
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnPolicyUrl": "https://galaxy.co.id/policies/refund-policy",
        "applicableCountry": "ID"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "IDR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          }
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "ID"
        }
      }
    }
  },
},

// NEW - LOCAL BUSINESS SCHEMA for Local SEO
{
  "script:ld+json": {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Galaxy Camera - PT Galaxy Digital Niaga",
    "image": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png?v=1731132105",
    "@id": "https://galaxy.co.id",
    "url": "https://galaxy.co.id",
    "telephone": "+62-821-1131-1131",
    "email": "sales@galaxy.co.id",
    "priceRange": "$$",
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": "Ruko Mall Metropolis Town Square, Blok GM3 No.6",
        "addressLocality": "Kelapa Indah",
        "addressRegion": "Tangerang",
        "postalCode": "15810",
        "addressCountry": "ID"
      },
      {
        "@type": "PostalAddress",
        "streetAddress": "Mall Depok Town Square, Lantai 2 Blok SS2 No.8",
        "addressLocality": "Beji",
        "addressRegion": "Depok",
        "postalCode": "16421",
        "addressCountry": "ID"
      }
    ],
    "geo": [
      {
        "@type": "GeoCoordinates",
        "latitude": -6.2088,
        "longitude": 106.6408
      },
      {
        "@type": "GeoCoordinates",
        "latitude": -6.3914,
        "longitude": 106.8317
      }
    ],
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "10:00",
      "closes": "19:00"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+62-821-1131-1131",
      "contactType": "customer service",
      "email": "sales@galaxy.co.id",
      "areaServed": "ID",
      "availableLanguage": ["Indonesian", "English"]
    },
    "sameAs": [
      "https://www.instagram.com/galaxycamera99",
      "https://www.facebook.com/galaxycamera99",
      "https://www.tiktok.com/@galaxycameraid",
      "https://www.youtube.com/@galaxycamera",
      "https://twitter.com/galaxycamera99"
    ],
    "paymentAccepted": "Cash, Credit Card, Debit Card, Bank Transfer, Kredivo, Home Credit, Gopay, OVO, Dana, ShopeePay",
    "currenciesAccepted": "IDR",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": -6.2088,
        "longitude": 106.8456
      },
      "geoRadius": "100000"
    }
  }
},


  ];
};






// PWP add-on display data — customer-visible price/image/availability from the Storefront API
const PWP_ADDONS_QUERY = `#graphql
  query PwpAddons($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        availableForSale
        featuredImage {
          url
          altText
        }
        variants(first: 10) {
          nodes {
            id
            title
            availableForSale
            price { amount }
          }
        }
      }
    }
  }
`;
