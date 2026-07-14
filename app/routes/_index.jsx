import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link,useOutletContext} from '@remix-run/react';
import {Suspense, lazy} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {HitunganPersen} from '~/components/HitunganPersen';
import {KategoriHalDepan} from '~/components/KategoriHalDepan';
import {ProductFeatureHalDepan} from '~/components/ProductFeatureHalDepan';

import { BrandPopular } from '../components/BrandPopular';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { SocialProofStrip } from '../components/SocialProofStrip';
import { MiniFaq } from '../components/MiniFaq';
import {useRef} from "react";
import { useLayoutEffect, useState, useEffect } from 'react';
import { getAutomaticDiscounts, getActiveFlashProducts } from '~/lib/autoDiscounts';
import { FaCalendarDays, FaYoutube } from "react-icons/fa6";

import { Carousel } from '~/components/Carousel';
import { TombolWa } from '~/components/TombolWa';
import { TombolBalasCepat } from '~/components/TombolBalasCepat';

// Lazy-load heavy below-fold / conditional components
const AboutSeo = lazy(() => import('~/components/AboutSeo').then(m => ({default: m.AboutSeo})));
const ModalBalasCepat = lazy(() => import('~/components/ModalBalasCepat').then(m => ({default: m.ModalBalasCepat})));




const FLASH_SALE_HOME_QUERY = `#graphql
  query FlashSaleHome($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        featuredImage { url altText }
        variants(first: 10) {
          nodes {
            availableForSale
            price { amount }
            compareAtPrice { amount }
          }
        }
      }
    }
  }
`;

export async function loader({context, request}) {
  const customerAccessToken = await context.session.get('customerAccessToken');
  const {storefront} = context;

  const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

  // Start deferred promises immediately — run in background while critical queries load
  const mirrorlessProducts = storefront.query(MIRRORLESS_PRODUCTS_QUERY).then(async (data) => {
    const nodes = data?.collection?.products?.nodes || [];
    const [soldEntries, reviewEntries] = await Promise.all([
      Promise.all(
        nodes.map(p =>
          fetch(`${FIRESTORE_BASE}/sold_counts/${p.handle}?key=${FIRESTORE_KEY}`)
            .then(res => res.ok ? res.json() : null)
            .then(doc => [p.handle, parseInt(doc?.fields?.count?.integerValue || 0)])
            .catch(() => [p.handle, 0])
        )
      ),
      Promise.all(
        nodes.map(p =>
          fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: 'reviews' }],
                where: {
                  compositeFilter: {
                    op: 'AND',
                    filters: [
                      { fieldFilter: { field: { fieldPath: 'productHandle' }, op: 'EQUAL', value: { stringValue: p.handle } } },
                      { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } },
                    ],
                  },
                },
                select: { fields: [{ fieldPath: 'rating' }] },
                limit: 100,
              },
            }),
          })
            .then(res => res.ok ? res.json() : null)
            .then(rows => {
              const ratings = (rows || [])
                .filter(r => r.document)
                .map(r => parseInt(r.document.fields?.rating?.integerValue || 5));
              const count = ratings.length;
              const avg = count > 0 ? parseFloat((ratings.reduce((s, r) => s + r, 0) / count).toFixed(1)) : 0;
              return [p.handle, count > 0 ? { count, avg } : null];
            })
            .catch(() => [p.handle, null])
        )
      ),
    ]);
    return {
      ...data,
      soldCounts: Object.fromEntries(soldEntries),
      reviewSummaries: Object.fromEntries(reviewEntries),
    };
  });

  // Flash sale strip — discount-driven: products come FROM the active discounts,
  // no collection maintenance needed. Deferred; renders only while a sale is live.
  const flashSalePromise = (async () => {
    const discounts = await getAutomaticDiscounts(context.env).catch(() => []);
    const flashMap = getActiveFlashProducts(discounts, 12);
    if (flashMap.size === 0) return { items: [], saleEndsAt: null };

    const data = await storefront.query(FLASH_SALE_HOME_QUERY, {
      variables: { ids: [...flashMap.keys()] },
    });
    const nodes = (data?.nodes ?? []).filter(Boolean);

    let saleEndsAt = null;
    const flashNodes = [];
    for (const p of nodes) {
      const d = flashMap.get(p.id);
      if (!d) continue;
      if (d.endsAt && (!saleEndsAt || new Date(d.endsAt) < new Date(saleEndsAt))) saleEndsAt = d.endsAt;
      flashNodes.push({ p, d });
    }
    if (flashNodes.length === 0) return { items: [], saleEndsAt: null };

    // Social proof per flash product (same pattern as MirrorlessProducts)
    const socials = await Promise.all(
      flashNodes.map(({ p }) =>
        Promise.all([
          fetch(`${FIRESTORE_BASE}/sold_counts/${p.handle}?key=${FIRESTORE_KEY}`)
            .then(res => res.ok ? res.json() : null)
            .then(doc => parseInt(doc?.fields?.count?.integerValue || 0))
            .catch(() => 0),
          fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: 'reviews' }],
                where: {
                  compositeFilter: {
                    op: 'AND',
                    filters: [
                      { fieldFilter: { field: { fieldPath: 'productHandle' }, op: 'EQUAL', value: { stringValue: p.handle } } },
                      { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } },
                    ],
                  },
                },
                select: { fields: [{ fieldPath: 'rating' }] },
                limit: 100,
              },
            }),
          })
            .then(res => res.ok ? res.json() : null)
            .then(rows => {
              const ratings = (rows || []).filter(r => r.document).map(r => parseInt(r.document.fields?.rating?.integerValue || 5));
              return ratings.length > 0
                ? { count: ratings.length, avg: parseFloat((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)) }
                : null;
            })
            .catch(() => null),
        ])
      )
    );

    const items = flashNodes.map(({ p, d }, i) => {
      // Variant-level discounts: price from the covered variant
      const variants = p.variants?.nodes ?? [];
      const v = d.variantIds
        ? (variants.find(x => d.variantIds.includes(x.id)) ?? null)
        : variants[0];
      if (!v) return null; // covered variant not fetched — skip rather than show a wrong price
      const base = parseFloat(v?.price?.amount ?? 0);
      const compareAt = parseFloat(v?.compareAtPrice?.amount ?? 0);
      const flashPrice = Math.max(0, d.type === 'amount' ? base - d.amount : Math.round(base * (1 - d.percentage / 100)));
      const strikeAt = Math.max(compareAt, base);
      return {
        title: p.title,
        handle: p.handle,
        image: p.featuredImage?.url ?? null,
        price: flashPrice,
        strikeAt,
        pct: strikeAt > flashPrice ? Math.round((1 - flashPrice / strikeAt) * 100) : 0,
        available: v?.availableForSale ?? true,
        sold: socials[i][0],
        review: socials[i][1],
        endsAt: d.endsAt ?? null,
      };
    }).filter(it => it && it.available);

    return { items, saleEndsAt };
  })().catch(() => ({ items: [], saleEndsAt: null }));

  // BrandPopular has <Await> — defer the 2-step chain (GET_BRANDS then N x GET_BRAND_IMAGE)
  const kumpulanBrandPromise = storefront.query(GET_BRANDS).then(async (brands) => {
    const hasilLoop = brands?.metaobjects?.nodes[0]?.fields[0]?.value;
    const dataArray = JSON.parse(hasilLoop || '[]');
    return Promise.all(
      dataArray.map((item) => storefront.query(GET_BRAND_IMAGE, {variables: {id: item}}))
    );
  });

  // VouchersSection has <Await> — defer vouchers
  const vouchersPromise = storefront.query(GET_VOUCHERS, {variables: {first: 10}});

  // All critical queries run in parallel — replaces 9+ sequential awaits
  const [
    collections2,
    banner,
    bannerKecil,
    custEmail,
    admgalaxy,
    blogs,
    balasCepat,
  ] = await Promise.all([
    storefront.query(COLLECTIONS_QUERY),
    storefront.query(BANNER_QUERY),
    storefront.query(BANNER_KECIL_QUERY),
    storefront.query(CUSTOMER_EMAIL_QUERY, {
      variables: {customertoken: customerAccessToken?.accessToken || ''},
    }),
    storefront.query(METAOBJECT_ADMIN_GALAXY, {variables: {type: 'admin_galaxy', first: 20}}),
    storefront.query(GET_ARTIKEL, {variables: {first: 3, reverse: true}}),
    storefront.query(BALAS_CEPAT, {variables: {first: 100}}),
  ]);

  const canonicalUrl = request.url;

  return defer({
    admgalaxy,
    balasCepat,
    vouchers: vouchersPromise,
    custEmail,
    customerAccessToken,
    canonicalUrl,
    bannerKecil,
    blogs,
    kumpulanBrand: kumpulanBrandPromise,
    hasilCollection: collections2,
    banner,
    mirrorlessProducts,
    flashSale: flashSalePromise,
  });
}






// ── Flash sale section (homepage) ─────────────────────────────────────────────

function HomeMiniCountdown({ endsAt }) {
  // null until mounted — avoids SSR/client hydration mismatch on time
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = now === null ? null : Math.max(0, new Date(endsAt).getTime() - now);
  if (left !== null && left <= 0) return null;
  const d = left === null ? null : Math.floor(left / 86400000);
  const v = (n) => (left === null ? '--' : String(n).padStart(2, '0'));
  const h = left === null ? '--' : v(Math.floor((left % 86400000) / 3600000));
  const m = left === null ? '--' : v(Math.floor((left % 3600000) / 60000));
  const s = left === null ? '--' : v(Math.floor((left % 60000) / 1000));
  const Box = ({ val }) => (
    <span className="bg-black/40 text-white font-mono font-bold text-[11px] sm:text-xs rounded px-1 sm:px-1.5 py-0.5 min-w-[20px] sm:min-w-[24px] text-center inline-block tabular-nums leading-tight">
      {val}
    </span>
  );
  return (
    <div className="flex items-center gap-0.5">
      {(left === null ? false : d > 0) && (
        <>
          <Box val={d} />
          <span className="text-white/90 text-[9px] font-bold mx-0.5">hr</span>
        </>
      )}
      <Box val={h} />
      <span className="text-white font-black text-[11px]">:</span>
      <Box val={m} />
      <span className="text-white font-black text-[11px]">:</span>
      <Box val={s} />
    </div>
  );
}

function CardMiniCountdown({ endsAt }) {
  // null until mounted — avoids SSR/client hydration mismatch on time
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = now === null ? null : Math.max(0, new Date(endsAt).getTime() - now);
  if (left !== null && left <= 0) return null;
  const d = left === null ? null : Math.floor(left / 86400000);
  const v = (n) => (left === null ? '--' : String(n).padStart(2, '0'));
  const Box = ({ val }) => (
    <span className="bg-gray-900 text-white font-mono font-bold text-[9px] rounded px-[3px] py-[1px] min-w-[17px] text-center inline-block tabular-nums leading-tight">
      {val}
    </span>
  );
  return (
    <div className="flex items-center gap-[2px]">
      {(left === null ? false : d > 0) && (
        <>
          <Box val={left === null ? '--' : d} />
          <span className="text-red-500 font-bold" style={{ fontSize: 8 }}>hr</span>
        </>
      )}
      <Box val={v(left === null ? null : Math.floor((left % 86400000) / 3600000))} />
      <span className="text-red-500 font-black text-[9px]">:</span>
      <Box val={v(left === null ? null : Math.floor((left % 3600000) / 60000))} />
      <span className="text-red-500 font-black text-[9px]">:</span>
      <Box val={v(left === null ? null : Math.floor((left % 60000) / 1000))} />
    </div>
  );
}

function FlashSaleHomeSection({ flashSale }) {
  return (
    <Suspense fallback={null}>
      <Await resolve={flashSale}>
        {({ items, saleEndsAt }) => {
          if (!items || items.length === 0) return null;
          return (
            <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-2 sm:px-0 mt-2 sm:mt-4">
              <section
                className="relative overflow-hidden rounded-xl"
                style={{ background: 'linear-gradient(110deg, #b71c1c 0%, #e53935 45%, #f4511e 100%)' }}
              >
                {/* Diagonal stripes + shine */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 16px)' }}
                />
                <div
                  className="absolute inset-y-0 w-28 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)',
                    animation: 'homeFlashShine 3s ease-in-out infinite',
                  }}
                />
                <style>{`@keyframes homeFlashShine { 0% { left: -30%; } 60% { left: 115%; } 100% { left: 115%; } }`}</style>

                {/* Header — countdown drops to its own row on mobile */}
                <div className="relative px-3 sm:px-4 pt-2.5 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="text-lg sm:text-2xl animate-pulse flex-shrink-0">⚡</span>
                      <h2 className="text-white font-black italic text-base sm:text-2xl tracking-wider leading-none drop-shadow-sm whitespace-nowrap">
                        FLASH SALE
                      </h2>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {saleEndsAt && (
                        <div className="hidden sm:block">
                          <HomeMiniCountdown endsAt={saleEndsAt} />
                        </div>
                      )}
                      <Link to="/flash-sale" className="text-white text-[11px] sm:text-xs font-bold whitespace-nowrap hover:underline no-underline">
                        Lihat Semua →
                      </Link>
                    </div>
                  </div>
                  {saleEndsAt && (
                    <div className="sm:hidden mt-1.5 flex items-center gap-1.5">
                      <span className="text-white/85 font-bold uppercase tracking-wider" style={{ fontSize: 9 }}>Berakhir dalam</span>
                      <HomeMiniCountdown endsAt={saleEndsAt} />
                    </div>
                  )}
                </div>

                {/* Product rail */}
                <div
                  className="relative flex gap-2 sm:gap-2.5 overflow-x-auto px-3 sm:px-4 pb-3"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {items.map(it => (
                    <Link
                      key={it.handle}
                      to={`/products/${it.handle}`}
                      prefetch="intent"
                      className="flex-shrink-0 w-32 sm:w-40 bg-white rounded-lg overflow-hidden no-underline group"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}
                    >
                      <div className="relative bg-gray-50" style={{ aspectRatio: '1/1' }}>
                        {it.pct > 0 && (
                          <div className="absolute top-1.5 left-1.5 z-10 bg-yellow-400 text-red-900 font-black text-[10px] px-1.5 py-0.5 rounded-sm leading-tight">
                            -{it.pct}%
                          </div>
                        )}
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.title}
                            loading="lazy"
                            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200 text-3xl">📷</div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-gray-800 text-[11px] leading-snug line-clamp-2 mb-1" style={{ minHeight: 28 }}>
                          {it.title}
                        </p>
                        {(it.review || it.sold > 0) && (
                          <div className="flex items-center gap-1 mb-1 text-[9px] text-gray-500 leading-none">
                            {it.review && (
                              <>
                                <span className="text-amber-400 text-[10px]">★</span>
                                <span className="font-bold text-gray-700">{it.review.avg}</span>
                                <span className="text-gray-400">({it.review.count})</span>
                              </>
                            )}
                            {it.review && it.sold > 0 && <span className="text-gray-300">·</span>}
                            {it.sold > 0 && <span>{it.sold} terjual</span>}
                          </div>
                        )}
                        <p className="font-black text-sm leading-tight" style={{ color: '#e53935' }}>
                          Rp{Math.round(it.price).toLocaleString('id-ID')}
                        </p>
                        {it.strikeAt > it.price && (
                          <p className="text-[10px] text-gray-400 line-through leading-tight mt-0.5">
                            Rp{Math.round(it.strikeAt).toLocaleString('id-ID')}
                          </p>
                        )}
                        {it.endsAt && (
                          <div
                            className="mt-1.5 -mx-2 -mb-2 px-2 py-1.5 flex items-center gap-1"
                            style={{ background: 'linear-gradient(90deg, #fef2f2, #fff7ed)', borderTop: '1px solid #fee2e2' }}
                          >
                            <span style={{ fontSize: 9 }}>⚡</span>
                            <CardMiniCountdown endsAt={it.endsAt} />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}

export default function Homepage() {
  const data = useLoaderData();
  const [bukaModalBalasCepat, setBukaModalBalasCepat] = useState(false)


  const foundAdmin = data?.admgalaxy?.metaobjects?.edges.find(admin => admin?.node?.fields[0]?.value === data?.custEmail?.customer?.email);


  return (
    <div>

      {bukaModalBalasCepat && (
        <Suspense fallback={null}>
          <ModalBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} data={data?.balasCepat?.metaobjects?.nodes}/>
        </Suspense>
      )}
      

      
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <Carousel images={data.banner.metaobjects} />
        <h1 className="sr-only">Toko Kamera Tangerang Depok Terlengkap — Galaxy Camera Store</h1>
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-2 sm:px-0">
        <SocialProofStrip />
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">

      <div className='hidden md:block'>
      <RenderCollection collections={data.hasilCollection.collections}/>
      </div>

      <div className='block md:hidden'>
      <KategoriHalDepan related={data.hasilCollection.collections}/>
      </div>

      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-2 sm:px-0">
        <VouchersSection vouchers={data.vouchers} />
      </div>

      {/* FLASH SALE — only renders while an automatic discount is active */}
      <FlashSaleHomeSection flashSale={data.flashSale} />

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-2 sm:px-0 mt-2 sm:mt-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-md hover:shadow-lg transition-shadow duration-300">
          {/* Modern gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10"></div>
          
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-pink-400/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-56 sm:h-56 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-3xl"></div>

          {/* Content */}
          <div className="mb-5 relative px-3 py-2 sm:px-6 sm:py-3 md:py-3.5 flex flex-row items-center justify-between gap-2 sm:gap-4 z-10">
            <div className="flex-1 min-w-0">
              <div className="hidden sm:inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-2 py-0.5 mb-1 sm:mb-1.5 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-300">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                <span className="text-white">Promo Cicilan</span>
              </div>
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white tracking-tight leading-tight mb-0.5 sm:mb-1">
                Cicil Kamera Tanpa Kartu Kredit
              </h2>
              <p className="text-[10px] sm:text-xs text-blue-50 hidden sm:flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-200">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                Proses cepat sekitar 15 menit
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/kredit-kamera"
                className="group inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg bg-white text-indigo-600 font-bold px-3 py-1.5 sm:px-5 sm:py-2 text-[10px] sm:text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Lihat Caranya</span>
                <span className="sm:hidden">Lihat</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>


      


      
{/* <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <div className='hidden md:block'>
        <RecommendedProducts products={data.recommendedProducts} />
        </div>


        <div className='block md:hidden'>
       <ProductFeatureHalDepan products={data.recommendedProducts} />
      </div>

        </div> */}

      <div className="relative mt-2 mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <MirrorlessProducts products={data.mirrorlessProducts} />
      </div>

      


      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-2 sm:px-0">
        <RecentlyViewed />
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <BannerKecil images={data.bannerKecil.metaobjects.nodes} />
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <BrandPopular brands={data.kumpulanBrand}/>
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <FeaturedBlogs blogs={data.blogs}/>
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-2 sm:px-0">
        <MiniFaq />
      </div>

      <Suspense fallback={null}>
        <AboutSeo/>
      </Suspense>

      {foundAdmin && <TombolBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} />}

    
    </div>
  );
}

// Banner Besar
function FeaturedCollection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
    </Link>
  );
}





function BannerKecil({ images }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -300,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Suspense fallback={<div>Loading banners...</div>}>
      <Await resolve={images}>
        {(resolvedImages) => (
          <div className='relative flex items-center my-8 group/banner'>
            {/* Left Navigation Button */}
            <button
              className='hidden md:flex absolute left-0 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 opacity-0 group-hover/banner:opacity-100 active:scale-95'
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Scrollable Container */}
            <div className="flex overflow-x-auto hide-scroll-bar snap-x snap-mandatory scroll-smooth items-center gap-3 sm:gap-4 pb-2" ref={scrollRef}>
              {resolvedImages?.map((image, index) => (
                <div key={image.fields[0].reference.image.url} className="relative flex-none snap-center group">
                  <a href={image.fields[1].value} target="_blank" rel="noopener noreferrer">
                    <div className='overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200'>
                      <img
                        src={image.fields[0].reference.image.url}
                        alt={`Promo ${(image.fields[1].value || '').split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Galaxy Camera'}`}
                        width={320}
                        height={120}
                        className='w-80 h-auto object-cover group-hover:scale-105 transition-transform duration-300'
                        loading="lazy"
                      />
                    </div>
                  </a>
                </div>
              ))}
            </div>

            {/* Right Navigation Button */}
            <button
              className='hidden md:flex absolute right-0 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 opacity-0 group-hover/banner:opacity-100 active:scale-95'
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </Await>
    </Suspense>
  );
}





function RenderCollection({ collections }) {
  return (
    <Suspense fallback={<div>Loading collections...</div>}>
      <Await resolve={collections}>
        {({ nodes }) => (
          <section className="w-full py-6 sm:py-8">
            <div className='flex flex-row items-end justify-between mb-6 gap-4'>
              <div>
                <h2 className="text-gray-900 text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">Kategori Populer</h2>
                <div className='h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2'></div>
              </div>
              <Link to={`/collections/`}>
                <button className='px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs sm:text-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 whitespace-nowrap'>
                  Lihat Semua →
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-3 lg:gap-4">
              {nodes.map((collection) => (
                <Link to={`/collections/${collection.handle}`} key={collection.id}>
                  <div className="group relative flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-2xl shadow-sm hover:shadow-2xl border border-gray-100 hover:border-blue-300 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 h-32 sm:h-40 lg:h-48 overflow-hidden cursor-pointer">
                    {/* Background Glow Effect */}
                    <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-400/5 to-indigo-400/5'></div>
                    
                    {collection?.image && (
                      <div className='relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-2 sm:mb-3 flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300'>
                        <Image
                          alt={`Image of ${collection.title}`}
                          data={collection.image}
                          sizes="(max-width: 640px) 56px, (max-width: 1024px) 64px, 80px"
                          crop="center"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <p className="text-gray-800 text-center text-xs sm:text-sm font-semibold line-clamp-2 leading-tight relative z-10 group-hover:text-blue-700 transition-colors duration-300">
                      {collection.title}
                    </p>
                    
                    {/* Hover Bottom Border */}
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </Await>
    </Suspense>
  );
}




function RecommendedProducts({products}) {

 
  return (
    <div className="recommended-products text-gray-800">
    
      <h2 className='text-gray-800 text-sm sm:text-lg sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead'>Produk Terbaru</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="hover:no-underline border bg-white shadow rounded-lg p-2"
                  to={`/products/${product.handle}`}
                >

                  <div className='relative'>
                  <Image
                    data={product.images.nodes[0]}
                    alt={product.featuredImage.altText || product.title}
                    aspectRatio="1/1"
                    sizes="(min-width: 40em) 20vw, 50vw"
                    className="hover:opacity-80"
                  />

                  {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                  <div className="absolute p-1 rounded bg-gradient-to-r from-rose-500 to-rose-700 font-bold text-xs text-white top-1 right-0">Promo</div>
                  ) }
                  </div>  
           
                  <div className='text-sm my-1 text-gray-800'>{product.title}</div>
                  
                  {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                  <div className='text-sm  line-through text-gray-600'>
                    {/* <Money data={product.compareAtPriceRange?.minVariantPrice} /> */}
                    <div>Rp{parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount).toLocaleString("id-ID")}</div>                    
                  </div>
                  ) }
                  <div className='text-xs font-bold text-gray-800 flex flex-row items-center gap-1 mb-2 mt-2'>
                  {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                    <div className='bg-rose-700 p-0.5 ml-0 text-white text-xs rounded'><HitunganPersen hargaSebelum={product.compareAtPriceRange.minVariantPrice.amount} hargaSesudah={product.priceRange.minVariantPrice.amount}/></div> ) }

                    <div className={`text-sm font-semibold ${parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && 'text-rose-800'}`}>Rp{parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString("id-ID")}</div>

                  </div>
                  <div className='flex flex-col md:flex-row gap-2'>
                  {product.metafields[1]?.value.length > 0 && <span className='rounded-md m-auto ml-0 bg-sky-100 text-xs font-bold text-sky-800 p-1 px-2'>
                    Free Item
                  </span>}
                  </div>
                  
                 


                </Link>
              ))}
            </div>
          )}
        </Await>
      </Suspense>
      <br />

    </div>
  );
}



function MirrorlessProducts({products}) {
  return (
    <div className="mirrorless-products mb-8 mt-4">
      <div className='flex flex-row items-center justify-between mb-4 gap-2'>
        <div className="text-gray-900 text-sm sm:text-xl font-medium sm:font-semibold tracking-tight">Mirrorless Terbaru</div>
        <Link to="/collections/kamera-mirrorless">
          <div className='text-blue-600 hover:text-blue-800 text-xs sm:text-sm lg:text-base font-medium leading-tight whitespace-nowrap'>Lihat Semua →</div>
        </Link>
      </div>
      
      <Suspense fallback={<MirrorlessSkeleton />}>
        <Await resolve={products}>
          {(response) => {
            const productsList = response?.collection?.products;
            if (!productsList?.nodes?.length) {
              return <div className="text-center py-8 text-gray-500">No products found</div>;
            }
            
            const soldCounts = response.soldCounts || {};
            const reviewSummaries = response.reviewSummaries || {};
            return (
              <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory scroll-smooth sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 hide-scroll-bar">
                {productsList.nodes.map((product) => {
                  const sold = soldCounts[product?.handle] || 0;
                  return (
                  <Link
                    key={product?.id}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-32 sm:w-auto snap-start"
                    to={`/products/${product?.handle}`}
                  >
                    <div className='relative overflow-hidden bg-gray-50'>
                      <Image
                        data={product?.images?.nodes?.[0]}
                        alt={product?.title || 'Product'}
                        aspectRatio="1/1"
                        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 128px"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                      {parseFloat(product?.compareAtPriceRange?.minVariantPrice?.amount || 0) > parseFloat(product?.priceRange?.minVariantPrice?.amount || 0) && (
                        <div className="absolute top-1.5 right-1.5 flex items-center text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-lg shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}>
                          <HitunganPersen
                            hargaSebelum={product?.compareAtPriceRange?.minVariantPrice?.amount || 0}
                            hargaSesudah={product?.priceRange?.minVariantPrice?.amount || 0}
                          />
                        </div>
                      )}
                      {product?.metafields?.find(m => m?.key === 'free')?.value && (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-lg shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                          FREE
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0">
                            <path d="M7.25 3.688a8.035 8.035 0 0 0-1.128-.702C5.236 2.504 4.456 2.25 3.75 2.25a2 2 0 0 0-1.5 3.32V6h2.322a9.383 9.383 0 0 0 2.078-1.264 1 1 0 0 1 .6-.198V3.688ZM8.75 4.524V3.688a9.372 9.372 0 0 1 1.128-.702c.886-.482 1.666-.736 2.372-.736a2 2 0 0 1 1.5 3.32V6h-2.322A9.383 9.383 0 0 1 9.35 4.736a1 1 0 0 0-.6-.212ZM7.25 7.5H2.25v.75A2.75 2.75 0 0 0 5 11h2.25V7.5ZM8.75 11H11A2.75 2.75 0 0 0 13.75 8.25V7.5H8.75V11ZM7.25 12.5H5A4.243 4.243 0 0 1 2.25 11.5V13a1 1 0 0 0 1 1h4V12.5ZM8.75 14h4a1 1 0 0 0 1-1v-1.5A4.243 4.243 0 0 1 11 12.5H8.75V14Z" />
                          </svg>
                        </div>
                      )}
                      {parseFloat(product?.priceRange?.minVariantPrice?.amount || 0) >= 3000000 && (
                        <img
                          src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/free-ongkir-1.png?v=1782805426"
                          alt="Free Ongkir"
                          className="absolute bottom-1.5 left-1.5 w-10 sm:w-14 h-auto pointer-events-none z-10"
                        />
                      )}
                    </div>

                    <div className='p-2 sm:p-3'>
                      <h3 className='text-xs sm:text-sm font-medium text-gray-800 mb-1 sm:mb-2 line-clamp-2 min-h-[32px] sm:min-h-[40px]'>
                        {product?.title || 'Nama Produk'}
                      </h3>

                      {parseFloat(product?.compareAtPriceRange?.minVariantPrice?.amount || 0) > parseFloat(product?.priceRange?.minVariantPrice?.amount || 0) && (
                        <div className='text-[10px] sm:text-xs text-gray-400 line-through mb-0.5 sm:mb-1'>
                          Rp{parseFloat(product?.compareAtPriceRange?.minVariantPrice?.amount || 0).toLocaleString("id-ID")}
                        </div>
                      )}

                      <div className={`text-xs sm:text-base font-bold ${parseFloat(product?.compareAtPriceRange?.minVariantPrice?.amount || 0) > parseFloat(product?.priceRange?.minVariantPrice?.amount || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                        Rp{parseFloat(product?.priceRange?.minVariantPrice?.amount || 0).toLocaleString("id-ID")}
                      </div>

                      {(reviewSummaries[product?.handle] || sold > 0) && (
                        <div className='flex items-center justify-between mt-1 gap-1'>
                          {reviewSummaries[product?.handle] ? (
                            <div className='flex items-center gap-0.5'>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-yellow-400 flex-shrink-0">
                                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                              </svg>
                              <span className='text-[10px] sm:text-xs font-semibold text-gray-700'>{reviewSummaries[product.handle].avg}</span>
                              <span className='text-[10px] sm:text-xs text-gray-400'>({reviewSummaries[product.handle].count})</span>
                            </div>
                          ) : <span />}
                          {sold > 0 && (
                            <div className='text-[10px] sm:text-xs text-gray-400'>
                              Terjual <span className='font-semibold text-gray-500'>{sold.toLocaleString('id-ID')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                  );
                })}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}


function MirrorlessSkeleton() {
  return (
    <div className="flex overflow-x-auto gap-3 pb-4 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 hide-scroll-bar">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 w-32 sm:w-auto"
        >
          {/* image placeholder */}
          <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animationDelay: `${i * 0.1}s` }} />
          </div>

          <div className="p-2 sm:p-3 flex flex-col gap-2">
            {/* title lines */}
            <div className="flex flex-col gap-1.5">
              <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden w-full">
                <div className="absolute inset-0 -translate-x-full animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animationDelay: `${i * 0.1}s` }} />
              </div>
              <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden w-3/4">
                <div className="absolute inset-0 -translate-x-full animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animationDelay: `${i * 0.1}s` }} />
              </div>
            </div>

            {/* price */}
            <div className="relative h-4 rounded-full bg-gray-100 overflow-hidden w-2/3">
              <div className="absolute inset-0 -translate-x-full animate-shimmer"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animationDelay: `${i * 0.1}s` }} />
            </div>

            {/* rating + terjual */}
            <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden w-full">
              <div className="absolute inset-0 -translate-x-full animate-shimmer"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animationDelay: `${i * 0.1}s` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedBlogs({ blogs }) {
  const [articlesToShow, setArticlesToShow] = useState(1);

  useLayoutEffect(() => {
    const updateArticlesToShow = () => {
      const screenSize = window.innerWidth;
      if (screenSize <= 640) {
        setArticlesToShow(1);
      } else {
        setArticlesToShow(blogs.articles.edges.length);
      }
    };

    updateArticlesToShow();
    window.addEventListener('resize', updateArticlesToShow);

    return () => {
      window.removeEventListener('resize', updateArticlesToShow);
    };
  }, [blogs.articles.edges.length]);

  function formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  }

  return (
    <Suspense fallback={<div>Loading articles...</div>}>
      <Await resolve={blogs}>
        {(resolvedBlogs) => (
          <div>
            <div className='flex flex-row items-center justify-between m-1 mb-2'>
              <div className="text-gray-800 text-sm sm:text-lg sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead">
                Artikel dan Review
              </div>
              <Link to={`/blogs/`}>
                <div className='text-gray-500 block mx-1 text-sm sm:text-md'>Lihat Semua</div>
              </Link>
            </div>
            <div className='flex flex-col sm:flex-row gap-4 justify-between'>
              {resolvedBlogs.articles.edges.slice(0, articlesToShow).map((blog) => (
                <Link to={`/blogs/${blog.node.blog.handle}/${blog.node.handle}`} key={blog.node.title}>
                  <div className='mx-auto'>
                    <div className='h-60 w-80 mx-auto rounded-xl overflow-hidden bg-neutral-50 shadow-lg'>
                      <img
                        width={320}
                        height={240}
                        className='object-contain h-60 w-80 p-1 m-auto'
                        src={blog.node.image.url}
                        alt={blog.node.title}
                        loading="lazy"
                      />
                    </div>
                    <div className='flex flex-row items-center text-neutral-500 gap-2 pt-2'>
                      <FaCalendarDays />
                      <div className='text-sm py-2'>{formatDate(blog.node.publishedAt)}</div>
                    </div>
                    <div className='font-bold '>{blog.node.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Await>
    </Suspense>
  );
}


const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    featuredImage {
      id
      altText
      url
      width
      height
    }
    metafields(identifiers:[
      {namespace:"custom" key:"garansi"}
      {namespace:"custom" key:"free"}
      {namespace:"custom" key:"isi_dalam_box"}
      {namespace:"custom" key:"periode_promo"}
      {namespace:"custom" key:"periode_promo_akhir"}
      {namespace:"custom" key:"spesifikasi"}
      {namespace:"custom" key:"brand"}
    ]){
      key
      value
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange{
      minVariantPrice{
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 6, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;


const MIRRORLESS_PRODUCTS_QUERY = `#graphql
  fragment MirrorlessProduct on Product {
    id
    title
    handle
    featuredImage {
      id
      altText
      url
      width
      height
    }
    metafields(identifiers:[
      {namespace:"custom", key:"garansi"},
      {namespace:"custom", key:"free"},
      {namespace:"custom", key:"isi_dalam_box"},
      {namespace:"custom", key:"periode_promo"},
      {namespace:"custom", key:"periode_promo_akhir"},
      {namespace:"custom", key:"spesifikasi"},
      {namespace:"custom", key:"brand"}
    ]){
      key
      value
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange{
      minVariantPrice{
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query MirrorlessProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collection(handle: "kamera-mirrorless") {
      products(first: 6, sortKey: BEST_SELLING) {
        nodes {
          ...MirrorlessProduct
        }
      }
    }
  }
`;


const COLLECTIONS_QUERY = `#graphql
  query FeaturedCollections {
    collections(first: 9, query: "collection_type:smart") {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
  }
`;


const BANNER_QUERY = `#graphql
query BannerQuery{
  metaobjects(first:5 type:"banner"){
	
  nodes {
    id
    fields {
      value
      key
      reference{
      ... on MediaImage {
          image {
            url
          }
        }
      }
      
    }
  }
}}
`

const BANNER_KECIL_QUERY = `#graphql
query BannerQuery{
  metaobjects(first:5 type:"banner_kecil"){
	
  nodes {
    id
    fields {
      value
      key
      reference{
      ... on MediaImage {
          image {
            url
          }
        }
      }
      
    }
  }
}}
`

const GET_BRANDS = `#graphql
query BrandQuery{
    metaobjects(first:5 type:"brand_popular"){
      
    nodes {
      id
      fields {
        value
        key
           
        
      }
    }
  }}
`

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

const GET_BRAND_IMAGE = `#graphql
query BrandImage($id: ID!){
  metaobject(id:$id){
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
  
}}
`

const GET_BLOGS = `#graphql
  query BlogShow($first: Int!,$reverse:Boolean!){
    blogs( first:$first,reverse:$reverse) {
      edges {
        node {
          articles (first:10) {
            edges {
              node {
                blog {
                  handle
                }
                id
                handle
                publishedAt
                title
                content
                seo {
                  description
                  title
                }
                image {
                  url
                }
              }
            }
          }
        }
      }
  }}
`;

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


const GET_ARTIKEL = `#graphql
  query Artikel($first: Int!,$reverse:Boolean!){
    articles(first:$first,reverse:$reverse) {
    edges {
      node {
        blog {
          handle
        }
        id
        title
        handle
        publishedAt
        image {
          id
          url
        }
      }
    }
  }}
`;




export const meta = ({data}) => {

  return [
    {title: 'Galaxy Camera Store : Toko Kamera Tangerang Depok Terlengkap'},
    {
      name: "title",
      content: "Galaxy Camera Store : Toko Kamera Tangerang Depok Terlengkap"
    },
    {
      name: "description",
    content: "Toko Kamera Tangerang Depok Jakarta Online Terpercaya dan Terlengkap Garansi Harga Terbaik. Jual Kamera DSLR, Mirrorless, dan Aksesoris Kamera lainnya. Canon, Sony, DJI, Nikon dll"
  },

    { tagName:'link',
      rel:'canonical',
      href: data.canonicalUrl
    },

  {name: "keywords",
    content:"Galaxycamera99, Galaxycamera, Galaxy Camera Store, toko kamera, toko kamera online, toko kamera tangerang, toko kamera depok, toko kamera jakarta, kredit kamera, Galaxy Camera",
  },

  {
    property: "og:type",
    content: "website",
  },

  {
    property: "og:title",
    content: "Galaxy Camera Store : Toko Kamera Tangerang Depok Terlengkap",
  },

  {
    property: "og:description",
    content: "Toko Kamera Online Terpercaya dan Terlengkap Garansi Harga Terbaik. Jual Kamera DSLR, Mirrorless, dan Aksesoris Kamera lainnya. Canon, Sony, DJI, Nikon dll"
  },

  {
    property: "og:url",
    content: 'https://galaxy.co.id',
  },

  {
    property: "og:image",
    content: data?.banner?.metaobjects?.nodes[0]?.fields[0]?.reference?.image.url,
  },

  // banner.metaobjects.nodes[0].fields[0].reference.image.url


];
};


const CUSTOMER_EMAIL_QUERY = `#graphql
query CustomerEmailQuery($customertoken: String!) {
  customer(customerAccessToken: $customertoken) {
    email
  }
}`;

const GET_VOUCHERS = `#graphql
query GetVouchers($first: Int!) {
  metaobjects(first: $first, type: "discount_voucher") {
    nodes {
      id
      fields {
        key
        value
      }
    }
  }
}`;

// Compact Vouchers Section Component
function VouchersSection({ vouchers }) {
  const [copiedCode, setCopiedCode] = useState(null);

  function handleCopyCode(code) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <Suspense fallback={
      <div className='py-2 mb-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='h-5 w-36 bg-gray-100 rounded-full overflow-hidden relative'>
            <div className='absolute inset-0 -translate-x-full animate-shimmer' style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }} />
          </div>
        </div>
        <div className='flex gap-3'>
          {[1,2,3].map(i => (
            <div key={i} className='flex-shrink-0 w-72 h-20 rounded-2xl bg-gray-100 overflow-hidden relative'>
              <div className='absolute inset-0 -translate-x-full animate-shimmer' style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animationDelay: `${i * 0.1}s` }} />
            </div>
          ))}
        </div>
      </div>
    }>
      <Await resolve={vouchers}>
        {(resolvedVouchers) => {
          const voucherArray = resolvedVouchers?.metaobjects?.nodes?.map((node) => {
            const fields = node.fields;
            return {
              code: fields.find(f => f.key === 'code')?.value || '',
              discount: fields.find(f => f.key === 'discount_value')?.value || '',
              discountType: fields.find(f => f.key === 'discount_type')?.value || 'fixed',
              description: fields.find(f => f.key === 'description')?.value || '',
              minPurchase: fields.find(f => f.key === 'min_purchase')?.value || '',
              expiryDate: fields.find(f => f.key === 'expiry_date')?.value || '',
            };
          }) || [];

          if (!voucherArray.length) return null;

          const COINS = [
            { size: 40, top: '8%',  left: '1%',  blur: 0, opacity: 0.9,  rotate: -20, flipX: false, scaleY: 1.0 },
            { size: 22, top: '60%', left: '5%',  blur: 5, opacity: 0.45, rotate:  18, flipX: true,  scaleY: 0.15 },
            { size: 30, top: '18%', left: '24%', blur: 7, opacity: 0.28, rotate:  -6, flipX: true,  scaleY: 1.0 },
            { size: 48, top: '4%',  right: '2%', blur: 0, opacity: 0.82, rotate:  28, flipX: false, scaleY: 0.25 },
            { size: 20, top: '55%', right: '8%', blur: 4, opacity: 0.5,  rotate: -38, flipX: true,  scaleY: 0.12 },
            { size: 34, bottom: '6%',  right: '22%', blur: 2, opacity: 0.6,  rotate: 12,  flipX: false, scaleY: 1.0 },
            { size: 26, bottom: '12%', left: '42%', blur: 6, opacity: 0.32, rotate: -14, flipX: true,  scaleY: 0.2 },
            { size: 18, top: '35%',   right: '38%', blur: 8, opacity: 0.22, rotate: 42,  flipX: false, scaleY: 1.0 },
            { size: 32, bottom: '4%', left: '14%', blur: 1, opacity: 0.68, rotate: -9,  flipX: true,  scaleY: 0.18 },
          ];

          return (
            <div className='w-full rounded-2xl py-4 mb-4 relative overflow-hidden'
              style={{ background: 'linear-gradient(120deg, #e11d48 0%, #f97316 100%)' }}>

              {/* Dot texture */}
              <div className='absolute inset-0 pointer-events-none' style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.13) 1.5px, transparent 1.5px)',
                backgroundSize: '18px 18px',
              }} />

              {/* Coins */}
              {COINS.map((c, i) => (
                <div key={i} className='absolute pointer-events-none select-none' style={{
                  top: c.top, left: c.left, right: c.right, bottom: c.bottom,
                  filter: `blur(${c.blur}px)`, opacity: c.opacity,
                  transform: `rotate(${c.rotate}deg) scaleX(${c.flipX ? -1 : 1}) scaleY(${c.scaleY})`,
                }}>
                  <svg width={c.size} height={c.size} viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="19" fill="#d97706"/>
                    <circle cx="20" cy="20" r="17" fill="#f59e0b"/>
                    <circle cx="20" cy="20" r="13" fill="#fbbf24"/>
                    <circle cx="20" cy="20" r="10" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                    <ellipse cx="14" cy="13" rx="5" ry="3" fill="rgba(255,255,255,0.32)" transform="rotate(-30 14 13)"/>
                  </svg>
                </div>
              ))}

              <div className='relative px-4'>
                {/* Header */}
                <div className='flex items-center justify-between mb-3 gap-2'>
                  <div className='flex items-center gap-1.5'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white flex-shrink-0">
                      <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path d="M6 6h.008v.008H6V6z" />
                    </svg>
                    <h2 className="text-white text-sm font-bold tracking-wide">Voucher Eksklusif</h2>
                  </div>
                  <Link to="/promo" className='text-[11px] font-semibold whitespace-nowrap' style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Lihat Semua →
                  </Link>
                </div>

                {/* Voucher cards */}
                <div className='flex overflow-x-auto gap-2.5 pb-1 hide-scroll-bar sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0'>
                  {voucherArray.map((voucher, index) => (
                    <div key={index} className='flex-shrink-0 w-44 sm:w-auto flex items-stretch rounded-xl overflow-hidden'
                      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>

                      {/* Left: warm amber-brown panel */}
                      <div className='flex flex-col items-center justify-center px-2 py-3 sm:px-3 sm:py-5'
                        style={{ background: 'linear-gradient(160deg, #92400e, #431407)', width: '30%', minWidth: '52px', maxWidth: '96px' }}>
                        <span className='font-black leading-none text-center'
                          style={{
                            color: '#fef08a',
                            fontSize: voucher.discountType === 'percentage' ? 'clamp(0.9rem,3vw,1.7rem)' : 'clamp(0.55rem,1.5vw,0.9rem)',
                          }}>
                          {voucher.discountType === 'percentage'
                            ? `${voucher.discount}%`
                            : `Rp${parseFloat(voucher.discount).toLocaleString('id-ID')}`}
                        </span>
                        <span className='font-black uppercase mt-1' style={{ color: 'rgba(253,224,71,0.6)', fontSize: 'clamp(6px,1vw,9px)', letterSpacing: '0.18em' }}>OFF</span>
                      </div>

                      {/* Right: cream info panel */}
                      <div className='flex-1 flex flex-col justify-center px-2.5 py-2.5 sm:px-4 sm:py-4 min-w-0'
                        style={{ background: '#fffbeb', borderLeft: '1.5px dashed #d97706' }}>
                        {/* Code + copy */}
                        <div className='flex items-center gap-1.5 mb-1.5 sm:mb-2'>
                          <span className='font-mono font-black text-[9.5px] sm:text-sm tracking-widest flex-1 truncate'
                            style={{ color: '#1c1917' }}>
                            {voucher.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(voucher.code)}
                            className='flex-shrink-0 text-[8px] sm:text-xs font-black uppercase tracking-wide px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-white transition-all duration-200 active:scale-95'
                            style={copiedCode === voucher.code
                              ? { background: '#059669' }
                              : { background: 'linear-gradient(135deg,#d97706,#b45309)' }}>
                            {copiedCode === voucher.code ? '✓ OK' : 'Salin'}
                          </button>
                        </div>
                        {/* Meta */}
                        <div className='flex flex-wrap items-center gap-x-1.5 gap-y-0.5'>
                          {voucher.minPurchase && (
                            <span className='text-[7px] sm:text-[11px] font-semibold leading-none' style={{ color: '#92400e' }}>
                              Min. {voucher.minPurchase}
                            </span>
                          )}
                          {voucher.expiryDate && (
                            <span className='text-[7px] sm:text-[11px] leading-none' style={{ color: '#a16207' }}>
                              s/d {new Date(voucher.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}
