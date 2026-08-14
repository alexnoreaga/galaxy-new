import {json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link, Form, useParams, useFetcher, useActionData, useNavigate, useSubmit} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/utils';
import {useLocation} from 'react-router-dom';
import React, {useEffect, useState, useRef} from 'react';
import {HitunganPersen} from '~/components/HitunganPersen';
import {CollectionSEOContent} from '~/components/CollectionSEOContent';
import {getAutomaticDiscounts, findProductAutoDiscount} from '~/lib/autoDiscounts';
import {FreeOngkirBadge} from '~/components/FreeOngkirBadge';
import {MastheadOrnament, resolveMastheadTheme} from '~/components/MastheadOrnament';
import {getSocialProof} from '~/lib/socialProof';

export const handle = {
  breadcrumbType: 'collection',
};

export const meta = ({data}) => {
  const collectionTitle = data?.collection?.seo?.title
    ? data?.collection?.seo.title
    : data?.collection?.title;

  const collectionDescription = data?.collection?.seo?.description
    ? data?.collection?.seo.description
    : data?.collection?.description;

  const today = new Date();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const indonesianMonth = monthNames[today.getMonth()];
  const year = today.getFullYear();

  const title = `${collectionTitle} - Harga Terbaik ${indonesianMonth} ${year} | Galaxy Camera`;
  const description = `Jelajahi koleksi ${collectionTitle} terlengkap dengan harga terbaik. Garansi resmi, cicilan 0%, gratis ongkir. Belanja aman di Galaxy Camera toko kamera terpercaya.`;
  const keywords = `${collectionTitle}, ${collectionTitle} murah, ${collectionTitle} original, jual ${collectionTitle}, harga ${collectionTitle}, ${collectionTitle} terbaik, ${collectionTitle} garansi resmi`;
  const canonicalUrl = data?.canonicalUrl || `https://galaxy.co.id/collections/${data?.collection?.handle}`;
  const productCount = data?.collection?.products?.nodes?.length || 0;

  return [
    {title},
    {name: 'title', content: title},
    {name: 'description', content: description.substring(0, 160)},
    {name: 'keywords', content: keywords},
    {name: 'author', content: 'Galaxy Camera'},
    {name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1'},
    {tagName: 'link', rel: 'canonical', href: canonicalUrl},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description.substring(0, 160)},
    {property: 'og:url', content: canonicalUrl},
    {property: 'og:site_name', content: 'Galaxy Camera'},
    {property: 'og:image', content: data?.collection?.image?.url || 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png'},
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {property: 'og:locale', content: 'id_ID'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:site', content: '@galaxycamera99'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description.substring(0, 160)},
    {name: 'twitter:image', content: data?.collection?.image?.url || 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png'},
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: collectionTitle,
        description,
        url: canonicalUrl,
        image: data?.collection?.image?.url || 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
        numberOfItems: productCount,
        publisher: {
          '@type': 'Organization',
          name: 'Galaxy Camera',
          logo: {'@type': 'ImageObject', url: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png'},
        },
        isPartOf: {'@type': 'WebSite', '@id': 'https://galaxy.co.id'},
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {'@type': 'ListItem', position: 1, name: 'Home', item: 'https://galaxy.co.id'},
          {'@type': 'ListItem', position: 2, name: 'Collections', item: 'https://galaxy.co.id/collections'},
          {'@type': 'ListItem', position: 3, name: collectionTitle, item: canonicalUrl},
        ],
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'ItemCollection',
        name: `Koleksi ${collectionTitle}`,
        description,
        url: canonicalUrl,
        numberOfItems: productCount,
        isPartOf: {'@type': 'Organization', name: 'Galaxy Camera', url: 'https://galaxy.co.id'},
      },
    },
  ];
};

export async function loader({request, params, context}) {
  const {handle} = params;
  const url = new URL(request.url);
  const reverse = url.searchParams.get('reverse') === 'true' ? true : false;
  const sortKey = url.searchParams.get('sortkey')?.toUpperCase();
  const {storefront} = context;

  const paginationVariables = getPaginationVariables(request, {pageBy: 8});

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, reverse, sortkey: sortKey, ...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  const nodes = collection.products.nodes;

  // Batched social proof (2 requests total) + module-cached discounts — the old version fired
  // 2 Firestore round-trips PER product (16+/page), which made slow connections crawl.
  const [{soldCounts, reviewSummaries}, discounts] = await Promise.all([
    getSocialProof(nodes.map((p) => p.handle)),
    getAutomaticDiscounts(context.env).catch(() => []),
  ]);

  // Flash sale — enrich each node with the live automatic-discount price so listing cards reflect
  // the same price as the product page. Product-level discounts apply to all variants; variant-level
  // ones only apply if the card's representative variant is covered.
  collection.products.nodes = nodes.map((node) => {
    const disc = findProductAutoDiscount(discounts, node.id);
    if (!disc) return node;
    const variantId = node.variants?.nodes?.[0]?.id;
    if (disc.variantIds && !(variantId && disc.variantIds.includes(variantId))) return node;
    const base = parseFloat(node.priceRange?.minVariantPrice?.amount ?? 0);
    if (!base) return node;
    const price = disc.type === 'amount'
      ? Math.max(0, base - disc.amount)
      : Math.round(base * (1 - disc.percentage / 100));
    if (!(price < base)) return node;
    return {
      ...node,
      flashSale: {
        price,
        base,
        type: disc.type,
        amount: disc.amount ?? null,
        percentage: disc.percentage ?? null,
        endsAt: disc.endsAt ?? null,
      },
    };
  });

  return json({
    collection,
    soldCounts,
    reviewSummaries,
  });
}

// Festive "heboh & meriah" hero — ONLY rendered on the cuci-gudang collection
function CuciGudangHero({ count, children }) {
  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(120deg,#b91c1c 0%,#dc2626 35%,#ea580c 70%,#f59e0b 100%)' }}>
      <style>{`
        @keyframes cgShine { 0%{transform:translateX(-130%) skewX(-20deg)} 60%,100%{transform:translateX(240%) skewX(-20deg)} }
        @keyframes cgFloat { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-10px) rotate(8deg)} }
        @keyframes cgPop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
      `}</style>

      {/* glow blobs */}
      <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-yellow-300/25 blur-3xl" />
      <div className="absolute -bottom-16 right-0 w-64 h-64 rounded-full bg-rose-600/30 blur-3xl" />
      {/* diagonal shine sweep */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-y-0 w-1/3" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)', animation: 'cgShine 3.5s ease-in-out infinite' }} />
      </div>
      {/* floating emojis */}
      <span className="absolute top-6 left-[8%] text-2xl sm:text-3xl" style={{ animation: 'cgFloat 3s ease-in-out infinite' }}>🏷️</span>
      <span className="absolute bottom-8 left-[18%] text-xl sm:text-2xl hidden sm:block" style={{ animation: 'cgFloat 3.6s ease-in-out infinite .4s' }}>💥</span>
      <span className="absolute top-8 right-[10%] text-2xl sm:text-3xl" style={{ animation: 'cgFloat 3.2s ease-in-out infinite .2s' }}>🔥</span>

      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12 text-center text-white">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase border border-white/30">
            ⚡ Promo Spesial Galaxy
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)]">
          <span className="inline-block" style={{ animation: 'cgPop 2s ease-in-out infinite' }}>CUCI</span>{' '}
          <span className="inline-block text-yellow-300" style={{ animation: 'cgPop 2s ease-in-out infinite .3s' }}>GUDANG</span>
        </h1>

        <p className="mt-3 text-base sm:text-2xl font-extrabold text-yellow-100 drop-shadow">
          Diskon Gila-Gilaan! 💥 Stok Terbatas — Sikat Sebelum Kehabisan!
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm font-bold">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-red-600 shadow-lg">🏷️ {count}+ Produk Harga Miring</span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30">🚚 Gratis Ongkir 3jt+</span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30">✅ Garansi Resmi</span>
        </div>

        <div className="mt-5 flex justify-center">{children}</div>
      </div>
    </div>
  );
}

export default function Collection() {
  const {collection, soldCounts, reviewSummaries} = useLoaderData();
  const params = useParams();
  const isCuciGudang = params.handle === 'cuci-gudang';

  // Infinite scroll replaces loader data with each page, but <Pagination> keeps ALL products on
  // screen — so sold/rating maps must be accumulated across pages or earlier cards lose theirs.
  // Reset when the collection changes.
  const socialRef = useRef({key: null, sold: {}, reviews: {}});
  if (socialRef.current.key !== collection.handle) {
    socialRef.current = {key: collection.handle, sold: {}, reviews: {}};
  }
  Object.assign(socialRef.current.sold, soldCounts);
  Object.assign(socialRef.current.reviews, reviewSummaries);
  const allSoldCounts = socialRef.current.sold;
  const allReviewSummaries = socialRef.current.reviews;
  const location = useLocation();
  // Seasonal ornament — same monthly schedule (+ ?theme= preview) as the masthead
  const mastheadTheme = resolveMastheadTheme(location.search);
  const [formData, setFormData] = useState('');
  const submit = useSubmit();

  const formDatax = new FormData();

  const handleInputChange = (event) => {
    setFormData(event.target.selectedOptions[0].textContent.trim());
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('sortkey', event.target.selectedOptions[0].getAttribute('sortKey'));
    searchParams.set('reverse', event.target.selectedOptions[0].getAttribute('data-reverse'));
    window.history.replaceState(null, '', `${location.pathname}?${searchParams}`);
    searchParams.forEach((value, key) => {
      formDatax.append(key, value);
    });
    submit(formDatax, {method: 'get'});
  };

  // Sort control — reused in both the normal header and the cuci-gudang hero
  const sortControl = (
    <Form method="get">
      <div className="flex items-center gap-2">
        {/* Both headers are dark now (cuci-gudang hero + charcoal collection band) → white label */}
        <label htmlFor="reverse" className="text-sm font-medium whitespace-nowrap text-white/90">
          Urutkan:
        </label>
        <select
          name="reverse"
          id="reverse"
          value={formData}
          onChange={handleInputChange}
          className={`text-sm rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 border-0 shadow-lg ${
            isCuciGudang
              ? 'bg-white/95 text-red-700 font-semibold focus:ring-white'
              : 'bg-white text-gray-700 focus:ring-white/40'
          }`}
        >
          <option value="" disabled defaultValue>Pilih...</option>
          <option sortkey="RELEVANCE" data-reverse="false">Relevansi</option>
          <option sortkey="TITLE" data-reverse="false">A-Z</option>
          <option sortkey="TITLE" data-reverse="true">Z-A</option>
          <option sortkey="PRICE" data-reverse="false">Harga Terendah</option>
          <option sortkey="PRICE" data-reverse="true">Harga Tertinggi</option>
        </select>
      </div>
    </Form>
  );

  return (
    <div className={`min-h-screen -mx-4 ${isCuciGudang ? 'bg-gradient-to-b from-orange-50 via-red-50 to-white' : 'bg-white'}`}>
      {/* Collection header */}
      {isCuciGudang ? (
        <CuciGudangHero count={collection.products.nodes.length}>
          {sortControl}
        </CuciGudangHero>
      ) : (
        <div className="sm:max-w-7xl sm:mx-auto sm:px-4 sm:pt-5">
          {/* MOBILE: full-bleed dark hero merging seamlessly with the charcoal header, wavy bottom.
              DESKTOP: contained rounded card (like the Brand Populer / Flash bands) — a full-width
              dark bar under the light sub-bar read as zebra-striping against the masthead. */}
          <div className="relative overflow-hidden bg-gray-900 sm:rounded-2xl">
            {/* Seasonal ornament — right side only (title/count sit left; keeps text legible).
                Follows the same monthly schedule + ?theme= preview as the masthead. */}
            <div aria-hidden="true" className="absolute inset-y-0 right-0 w-56 pointer-events-none opacity-60 -scale-x-100 [mask-image:linear-gradient(to_right,black_35%,transparent)]">
              <MastheadOrnament theme={mastheadTheme} id="gxOrnCol" />
            </div>
            <div className="relative px-4 sm:px-6 pt-5 pb-10 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">{collection.title}</h1>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {collection.products.nodes.length > 0
                      ? `${collection.products.nodes.length}+ produk tersedia`
                      : 'Tidak ada produk'}
                  </p>
                </div>
                {sortControl}
              </div>
            </div>
            {/* Wave bottom edge — MOBILE only (the desktop card has rounded corners instead) */}
            <svg
              aria-hidden="true"
              className="sm:hidden absolute bottom-0 inset-x-0 w-full h-5"
              viewBox="0 0 1440 26"
              preserveAspectRatio="none"
            >
              <path
                d="M0 14 C180 26 360 2 540 10 C720 18 900 24 1080 14 C1260 4 1380 10 1440 16 L1440 26 L0 26 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Pagination connection={collection.products}>
          {({nodes, isLoading, PreviousLink, hasNextPage, nextPageUrl, state}) => (
            <>
              <PreviousLink>
                <div className="flex justify-center mb-6">
                  <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Memuat...
                      </>
                    ) : '↑ Produk sebelumnya'}
                  </span>
                </div>
              </PreviousLink>

              <ProductsGrid products={nodes} soldCounts={allSoldCounts} reviewSummaries={allReviewSummaries} festive={isCuciGudang} />

              {/* Infinite scroll — auto-loads the next page as the sentinel nears the viewport */}
              <InfiniteLoader
                hasNextPage={hasNextPage}
                nextPageUrl={nextPageUrl}
                isLoading={isLoading}
                state={state}
              />
            </>
          )}
        </Pagination>

        <CollectionSEOContent
          collectionTitle={collection.title}
          products={collection.products.nodes}
        />

        {collection.descriptionHtml && (
          <div
            dangerouslySetInnerHTML={{__html: collection.descriptionHtml}}
            className="mt-8 prose prose-sm max-w-none text-gray-600"
          />
        )}
      </div>
    </div>
  );
}

// Infinite scroll: observes a sentinel and navigates to the next page when it nears the viewport.
// Replicates Hydrogen's <NextLink> (navigate to nextPageUrl with the pagination `state`, replace +
// no scroll reset) so the new products append instead of replacing the list.
function InfiniteLoader({hasNextPage, nextPageUrl, isLoading, state}) {
  const navigate = useNavigate();
  const sentinelRef = useRef(null);
  const triggeredRef = useRef(null); // guards against firing twice for the same URL

  useEffect(() => {
    if (!hasNextPage || !nextPageUrl) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          triggeredRef.current !== nextPageUrl
        ) {
          triggeredRef.current = nextPageUrl;
          navigate(nextPageUrl, {replace: true, preventScrollReset: true, state});
        }
      },
      {rootMargin: '600px 0px'}, // begin loading ~600px before the sentinel is visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, nextPageUrl, isLoading, state, navigate]);

  if (!hasNextPage) {
    return (
      <p className="text-center text-xs text-gray-400 mt-10 mb-2">— Semua produk sudah ditampilkan —</p>
    );
  }

  return (
    <div ref={sentinelRef} className="flex justify-center py-10">
      <span className="inline-flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Memuat produk...
      </span>
    </div>
  );
}

function ProductsGrid({products, soldCounts, reviewSummaries, festive = false}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {products.map((product, index) => (
        <ProductItem
          key={product.id}
          product={product}
          loading={index < 8 ? 'eager' : undefined}
          sold={soldCounts?.[product.handle] || 0}
          review={reviewSummaries?.[product.handle] || null}
          festive={festive}
        />
      ))}
    </div>
  );
}

// Cheapest tenor (Kredivo 12x) — mirrors mulaiDari() on the product page
const ADM_KREDIVO = 2.6;
const CICILAN_MIN_HARGA = 1000000; // below this a monthly figure is meaningless

function cicilanPerBulan(price) {
  const bunga = (ADM_KREDIVO * price) / 100;
  return Math.ceil((price / 12 + bunga) / 10) * 10;
}

// Compact for mobile: 939.000 -> "939rb", 1.093.330 -> "1,1jt"
function formatSingkat(n) {
  const rb = Math.round(n / 1000);
  if (rb >= 1000) return `${(n / 1000000).toFixed(1).replace('.', ',')}jt`;
  return `${rb}rb`;
}

function ProductItem({product, loading, sold, review, festive = false}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  const hasDiscount =
    parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) >
    parseFloat(product.priceRange.minVariantPrice.amount);
  const isDiscontinued = product?.metafields[12]?.value === 'true';
  const isOutOfStock = !product.availableForSale && !isDiscontinued;
  const hasFreeItem = product.metafields[1]?.value?.length > 0;

  const harga = parseFloat(product.priceRange.minVariantPrice.amount);
  const flash = product.flashSale || null; // live automatic-discount price from the loader
  const effectiveHarga = flash ? flash.price : harga;
  const showCicilan = effectiveHarga >= CICILAN_MIN_HARGA && !isDiscontinued && !isOutOfStock;

  // Discount % for the Blibli-style ribbon (flash beats compare-at promo)
  const compareAtNum = parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount || 0);
  const pctOff = flash
    ? Math.round(((flash.base - flash.price) / flash.base) * 100)
    : hasDiscount && compareAtNum > 0
    ? Math.round(((compareAtNum - harga) / compareAtNum) * 100)
    : 0;

  return (
    <Link
      className={`group relative bg-white rounded-xl flex flex-col no-underline ${
        festive
          ? 'border-2 border-red-400 hover:border-red-500 shadow-sm hover:shadow-md hover:shadow-red-100 transition-shadow duration-200'
          : ''
      }`}
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {/* Image — rounded on all four corners (it's the visible block now that cards are borderless) */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square rounded-xl">
        {festive && !isDiscontinued && !isOutOfStock && (
          <span className="absolute top-0 left-0 z-20 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-br-xl shadow tracking-wide">
            🔥 CUCI GUDANG
          </span>
        )}
        {product.featuredImage && (
          <Image
            alt={product.featuredImage.altText || product.title}
            aspectRatio="1/1"
            data={product.featuredImage}
            loading={loading}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ${
              isDiscontinued || isOutOfStock ? 'opacity-50' : ''
            }`}
          />
        )}

        {/* Tokopedia-style tint — a ~3% black veil over the photo so white product backgrounds
            read as a soft gray card instead of blending into the page. Deepens slightly on hover
            (the product "responds" instead of a card-shadow box materializing). Badges sit above. */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/[0.03] group-hover:bg-black/[0.06] transition-colors duration-300 pointer-events-none" />

        {/* Free Ongkir badge */}
        {parseFloat(product.priceRange.minVariantPrice.amount) >= 3000000 && !isDiscontinued && !isOutOfStock && (
          <FreeOngkirBadge className="absolute bottom-2 left-2 z-10" />
        )}

        {/* Flash badge — top right (the % now lives in the ribbon, so no more "Promo" pill) */}
        {flash && !isDiscontinued && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow inline-flex items-center gap-0.5">
            ⚡ FLASH
          </div>
        )}
        {isDiscontinued && (
          <div className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            Discontinue
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-amber-400 text-black text-xs font-bold px-2 py-1 rounded-lg shadow">
              Stock Kosong
            </span>
          </div>
        )}
      </div>

      {/* Discount ribbon — Blibli-style: overhangs the card's left edge, with a dark fold
          triangle under the overhang so it reads as wrapping from behind the image */}
      {pctOff > 0 && !isDiscontinued && (
        <div className="absolute top-2 -left-1 z-20 pointer-events-none">
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-500 text-white text-[10px] sm:text-[11px] font-black leading-none px-1.5 py-1 rounded-r-md shadow-md">
            -{pctOff}%
          </div>
          <svg width="4" height="4" viewBox="0 0 4 4" className="block" aria-hidden="true">
            <path d="M0 0 L4 0 L4 4 Z" fill="#881337" />
          </svg>
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col gap-1 p-2.5 sm:p-3 flex-1">
        {/* No flex-1: content stacks tight from the top (Tokopedia-style). With borderless cards,
            leftover space at the card BOTTOM is invisible — a mid-card gap before the price isn't. */}
        <p className="text-xs sm:text-sm text-gray-800 leading-snug line-clamp-2 group-hover:text-rose-600 transition-colors duration-200">
          {product.title}
        </p>

        {/* Price — flash-sale price wins; else compare-at promo; else plain */}
        <div className="mt-1">
          {flash ? (
            <>
              <div className="flex items-center gap-1.5 mb-0.5">
                {/* Faded hemat pill (matches the product page) — the PRICE is the loud red element */}
                <span className="bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-1 py-[1px] rounded whitespace-nowrap">
                  {flash.type === 'amount'
                    ? `-Rp${Number(flash.amount).toLocaleString('id-ID')}`
                    : `-${flash.percentage}%`}
                </span>
                <span className="text-[11px] text-gray-400 line-through">
                  Rp{flash.base.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-sm font-bold text-red-600">
                Rp{flash.price.toLocaleString('id-ID')}
              </p>
            </>
          ) : (
            <>
              {/* % pill moved to the image ribbon — only the strikethrough stays here */}
              {hasDiscount && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] text-gray-400 line-through">
                    Rp{parseFloat(product.compareAtPriceRange.minVariantPrice.amount).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <p className={`text-sm font-bold ${hasDiscount ? 'text-rose-700' : 'text-gray-900'}`}>
                Rp{parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString('id-ID')}
              </p>
            </>
          )}
          {showCicilan && (
            <p className="text-[10px] sm:text-[11px] text-gray-500 leading-tight mt-0.5">
              Cicilan{' '}
              <span className="font-semibold text-rose-700">
                {formatSingkat(cicilanPerBulan(effectiveHarga))}
              </span>
              /bln
            </p>
          )}
        </div>

        {/* Free item badge */}
        {hasFreeItem && (
          <span className="self-start bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5">
            Free Item
          </span>
        )}

        {/* Rating + Terjual */}
        {(review || sold > 0) && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-1 flex-wrap">
            {review ? (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-amber-400 flex-shrink-0">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-gray-800">{review.avg}</span>
                <span className="text-xs text-gray-400">({review.count})</span>
              </div>
            ) : <span />}
            {sold > 0 && (
              <span className="text-xs text-gray-400">
                <span className="font-semibold text-gray-600">{sold.toLocaleString('id-ID')}</span> terjual
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    availableForSale
    title
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
      {namespace:"custom" key:"tokopedia"}
      {namespace:"custom" key:"shopee"}
      {namespace:"custom" key:"blibli"}
      {namespace:"custom" key:"bukalapak"}
      {namespace:"custom" key:"lazada"}
      {namespace:"custom" key:"produk_discontinue"}
      {namespace:"custom" key:"produk_serupa"}
    ]){
      key
      value
    }
    compareAtPriceRange{
      minVariantPrice{
        amount
        currencyCode
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        id
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $reverse:Boolean=false
    $sortkey:ProductCollectionSortKeys
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      seo {
        description
        title
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        reverse:$reverse,
        sortKey:$sortkey
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;
