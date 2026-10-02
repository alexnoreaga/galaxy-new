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
import {transitionToProduct, isPlainClick} from '~/lib/viewTransition';
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

  // "harga <kategori>" is the biggest commercial query family in Search Console → lead with it.
  // Promo collections keep the plain form ("Harga Cuci Gudang Terbaru" reads wrong).
  const isPromoCollection = /cuci ?gudang|promo|flash|sale|diskon/i.test(collectionTitle || '');
  const title = isPromoCollection
    ? `${collectionTitle} - ${indonesianMonth} ${year} | Galaxy Camera`
    : `Harga ${collectionTitle} Terbaru ${indonesianMonth} ${year} | Galaxy Camera`;
  // Meta description: the collection's OWN text (unique per collection) instead of one template
  // shared by all 32 collections. Trimmed to ~155 chars on a word boundary.
  const ownText = String(collectionDescription || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const description = ownText.length >= 60
    ? (ownText.length > 155 ? ownText.slice(0, 155).replace(/\s+\S*$/, '') + '…' : ownText)
    : `Jelajahi koleksi ${collectionTitle} terlengkap dengan harga terbaik. Garansi resmi, cicilan 0%, gratis ongkir. Belanja aman di Galaxy Camera toko kamera terpercaya.`;
  const keywords = `${collectionTitle}, ${collectionTitle} murah, ${collectionTitle} original, jual ${collectionTitle}, harga ${collectionTitle}, ${collectionTitle} terbaik, ${collectionTitle} garansi resmi`;
  const canonicalUrl = data?.canonicalUrl || `https://www.galaxy.co.id/collections/${data?.collection?.handle}`;
  const productCount = data?.collection?.products?.nodes?.length || 0;

  return [
    {title},
    {name: 'title', content: title},
    {name: 'description', content: description.substring(0, 160)},
    {name: 'keywords', content: keywords},
    {name: 'author', content: 'Galaxy Camera'},
    {name: 'robots', content: data?.hasFilters ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'},
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
      // ItemList (was "ItemCollection", which is not a schema.org type and was ignored)
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Koleksi ${collectionTitle}`,
        description,
        url: canonicalUrl,
        numberOfItems: productCount,
        itemListElement: (data?.collection?.products?.nodes ?? []).slice(0, 24).map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.title, url: `https://www.galaxy.co.id/products/${p.handle}`,
        })),
      },
    },
  ];
};

// ── Collection filters (Storefront API productFilters) ───────────────────────────────────────
// Shopify computes the facets (`products.filters`) and we keep the selection in readable URL params
// so filtered views can be shared and the back button works:
//   ready=1                → {available:true}
//   hmin=5000000&hmax=…    → {price:{min,max}}
//   vendor=Sony,Canon      → {productVendor} ×n   (OR within a group, AND across groups)
//   tipe=Lensa             → {productType}
//   tag=x                  → {tag}
//   m.custom.mount=Sony+E  → {productMetafield:{namespace,key,value}}  (needs Search & Discovery)
//   o.Warna=Hitam          → {variantOption:{name,value}}
// Which groups exist is decided in Shopify Admin → Search & Discovery → Filters.
const FILTER_PARAM_KEYS = ['ready', 'hmin', 'hmax', 'vendor', 'tipe', 'tag'];
const isFilterParam = (k) => FILTER_PARAM_KEYS.includes(k) || k.startsWith('m.') || k.startsWith('o.');
const splitVals = (v) => String(v ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20);

export function filtersFromSearchParams(sp) {
  const out = [];
  if (sp.get('ready') === '1') out.push({available: true});
  const min = parseFloat(sp.get('hmin')), max = parseFloat(sp.get('hmax'));
  if (Number.isFinite(min) || Number.isFinite(max)) {
    const price = {};
    if (Number.isFinite(min) && min > 0) price.min = min;
    if (Number.isFinite(max) && max > 0) price.max = max;
    if (Object.keys(price).length) out.push({price});
  }
  for (const v of splitVals(sp.get('vendor'))) out.push({productVendor: v});
  for (const v of splitVals(sp.get('tipe'))) out.push({productType: v});
  for (const v of splitVals(sp.get('tag'))) out.push({tag: v});
  for (const [k, raw] of sp.entries()) {
    if (k.startsWith('m.')) {
      const [, namespace, ...rest] = k.split('.');
      const key = rest.join('.');
      if (namespace && key) for (const v of splitVals(raw)) out.push({productMetafield: {namespace, key, value: v}});
    } else if (k.startsWith('o.')) {
      const name = k.slice(2);
      if (name) for (const v of splitVals(raw)) out.push({variantOption: {name, value: v}});
    }
  }
  return out.slice(0, 40);
}

// Shopify filter id → our URL param key (metafield/option ids carry their own key)
function paramKeyForFilter(filterId) {
  if (filterId === 'filter.v.availability') return 'ready';
  if (filterId === 'filter.v.price') return 'harga';
  if (filterId === 'filter.p.vendor') return 'vendor';
  if (filterId === 'filter.p.product_type') return 'tipe';
  if (filterId === 'filter.p.tag') return 'tag';
  if (filterId.startsWith('filter.p.m.')) return 'm.' + filterId.slice('filter.p.m.'.length);
  if (filterId.startsWith('filter.v.option.')) return 'o.' + filterId.slice('filter.v.option.'.length);
  return null;
}
// Indonesian labels for Shopify's built-in groups; Search & Discovery labels are used as-is otherwise
const GROUP_LABEL = {'filter.v.availability': 'Ketersediaan', 'filter.v.price': 'Harga', 'filter.p.vendor': 'Brand', 'filter.p.product_type': 'Tipe produk', 'filter.p.tag': 'Tag'};

export async function loader({request, params, context}) {
  const {handle} = params;
  const url = new URL(request.url);
  const productFilters = filtersFromSearchParams(url.searchParams);
  const reverse = url.searchParams.get('reverse') === 'true' ? true : false;
  const sortKey = url.searchParams.get('sortkey')?.toUpperCase();
  const {storefront} = context;

  const paginationVariables = getPaginationVariables(request, {pageBy: 8});

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, reverse, sortkey: sortKey, filters: productFilters, ...paginationVariables},
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
    hasFilters: productFilters.length > 0,
    // Clean canonical (no ?sort/?cursor/?filter) on the www host the site actually serves.
    canonicalUrl: `https://www.galaxy.co.id/collections/${collection.handle}`,
  });
}

// ── Filter UI ────────────────────────────────────────────────────────────────────────────────
const rupiahShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e6) return `${(v / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} rb`;
  return String(v);
};

function useCollectionFilters() {
  const location = useLocation();
  const navigate = useNavigate();
  const sp = new URLSearchParams(location.search);
  const go = (next) => {
    next.delete('cursor'); next.delete('direction'); // a new filter set starts at page 1
    const qs = next.toString();
    navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, {preventScrollReset: true});
  };
  const has = (key, value) => (key === 'ready' ? sp.get('ready') === '1' : splitVals(sp.get(key)).includes(value));
  const toggle = (key, value) => {
    const next = new URLSearchParams(sp);
    if (key === 'ready') { if (next.get('ready') === '1') next.delete('ready'); else next.set('ready', '1'); }
    else {
      const cur = splitVals(next.get(key));
      const vals = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      if (vals.length) next.set(key, vals.join(',')); else next.delete(key);
    }
    go(next);
  };
  const setPrice = (min, max) => {
    const next = new URLSearchParams(sp);
    if (min > 0) next.set('hmin', String(min)); else next.delete('hmin');
    if (max > 0) next.set('hmax', String(max)); else next.delete('hmax');
    go(next);
  };
  const clearAll = () => {
    const next = new URLSearchParams(sp);
    for (const k of [...next.keys()]) if (isFilterParam(k)) next.delete(k);
    go(next);
  };
  const remove = (key, value) => (key === 'harga' ? setPrice(0, 0) : toggle(key, value));
  const active = [];
  for (const [k, raw] of sp.entries()) {
    if (k === 'ready' && raw === '1') active.push({key: 'ready', value: '1', label: 'Ready stock'});
    else if (k === 'vendor' || k === 'tipe' || k === 'tag' || k.startsWith('m.') || k.startsWith('o.')) for (const v of splitVals(raw)) active.push({key: k, value: v, label: v});
  }
  const hmin = parseFloat(sp.get('hmin')) || 0, hmax = parseFloat(sp.get('hmax')) || 0;
  if (hmin || hmax) active.push({key: 'harga', value: '', label: hmin && hmax ? `Rp${rupiahShort(hmin)} – ${rupiahShort(hmax)}` : hmin ? `≥ Rp${rupiahShort(hmin)}` : `≤ Rp${rupiahShort(hmax)}`});
  return {has, toggle, setPrice, clearAll, remove, active, hmin, hmax};
}

function PriceFilter({filter, hmin, hmax, onApply}) {
  const bounds = (() => { try { return JSON.parse(filter.values?.[0]?.input || '{}').price || {}; } catch { return {}; } })();
  const [min, setMin] = useState(hmin ? String(hmin) : '');
  const [max, setMax] = useState(hmax ? String(hmax) : '');
  useEffect(() => { setMin(hmin ? String(hmin) : ''); setMax(hmax ? String(hmax) : ''); }, [hmin, hmax]);
  const apply = (e) => { e.preventDefault(); onApply(parseInt(min, 10) || 0, parseInt(max, 10) || 0); };
  const presets = [[0, 5000000, '< 5 jt'], [5000000, 10000000, '5–10 jt'], [10000000, 20000000, '10–20 jt'], [20000000, 0, '> 20 jt']];
  const inp = 'w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900';
  return (
    <form onSubmit={apply} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {presets.map(([a, b, l]) => {
          const on = hmin === a && hmax === b;
          return (
            <button key={l} type="button" onClick={() => onApply(on ? 0 : a, on ? 0 : b)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
              {l}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        <input className={inp} inputMode="numeric" placeholder={`Min ${bounds.min != null ? rupiahShort(bounds.min) : ''}`} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} aria-label="Harga minimum" />
        <span className="text-gray-300">–</span>
        <input className={inp} inputMode="numeric" placeholder={`Max ${bounds.max != null ? rupiahShort(bounds.max) : ''}`} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} aria-label="Harga maksimum" />
        <button type="submit" className="shrink-0 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-800">OK</button>
      </div>
    </form>
  );
}

function ListFilter({filter, paramKey, has, onToggle}) {
  const [all, setAll] = useState(false);
  const values = (filter.values || []).filter((v) => v.count > 0 || has(paramKey, v.label));
  const shown = all ? values : values.slice(0, 8);
  return (
    <div className="flex flex-col gap-1">
      {shown.map((v) => {
        const on = has(paramKey, v.label);
        return (
          <label key={v.id} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 hover:text-gray-900">
            <input type="checkbox" checked={on} onChange={() => onToggle(paramKey, v.label)} className="h-4 w-4 rounded border-gray-300 accent-gray-900" />
            <span className={`flex-1 min-w-0 truncate ${on ? 'font-semibold text-gray-900' : ''}`}>{v.label}</span>
            <span className="text-[11px] text-gray-400 tabular-nums">{v.count}</span>
          </label>
        );
      })}
      {values.length > 8 && (
        <button type="button" onClick={() => setAll((x) => !x)} className="self-start text-xs font-semibold text-gray-700 hover:text-gray-900 mt-0.5">
          {all ? 'Lebih sedikit' : `Lihat semua (${values.length})`}
        </button>
      )}
    </div>
  );
}

// One panel, used in the desktop sidebar and the mobile bottom sheet
function FilterPanel({filters, f}) {
  const groups = (filters || []).map((flt) => ({flt, key: paramKeyForFilter(flt.id)})).filter(({flt, key}) => key && (flt.type === 'PRICE_RANGE' || flt.id === 'filter.v.availability' || (flt.values || []).filter((v) => v.count > 0).length > 1));
  if (!groups.length) return <p className="text-[13px] text-gray-500">Belum ada filter untuk koleksi ini.</p>;
  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {groups.map(({flt, key}) => (
        <section key={flt.id} className="py-3 first:pt-0 last:pb-0">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">{GROUP_LABEL[flt.id] || flt.label}</h3>
          {flt.id === 'filter.v.availability' ? (
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700">
              <input type="checkbox" checked={f.has('ready')} onChange={() => f.toggle('ready')} className="h-4 w-4 rounded border-gray-300 accent-gray-900" />
              <span className={f.has('ready') ? 'font-semibold text-gray-900' : ''}>Ready stock saja</span>
              <span className="ml-auto text-[11px] text-gray-400 tabular-nums">{(flt.values || []).find((v) => v.label === 'In stock')?.count ?? ''}</span>
            </label>
          ) : flt.type === 'PRICE_RANGE' ? (
            <PriceFilter filter={flt} hmin={f.hmin} hmax={f.hmax} onApply={f.setPrice} />
          ) : (
            <ListFilter filter={flt} paramKey={key} has={f.has} onToggle={f.toggle} />
          )}
        </section>
      ))}
    </div>
  );
}

function ActiveFilterChips({f}) {
  if (!f.active.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {f.active.map((a) => (
        <button key={`${a.key}:${a.value}`} type="button" onClick={() => f.remove(a.key, a.value)}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 pl-2.5 pr-1.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200" aria-label={`Hapus filter ${a.label}`}>
          {a.label}
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gray-500"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
        </button>
      ))}
      <button type="button" onClick={f.clearAll} className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline">Hapus semua</button>
    </div>
  );
}

function MobileFilterSheet({open, onClose, filters, f, count}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[82vh] rounded-t-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-900">Filter</span>
          <button type="button" onClick={f.clearAll} className="text-xs font-semibold text-gray-500 hover:text-gray-900">Reset</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3"><FilterPanel filters={filters} f={f} /></div>
        <div className="px-4 py-3 border-t border-gray-100">
          <button type="button" onClick={onClose} className="w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold">
            Lihat {count}{count >= 8 ? '+' : ''} produk
          </button>
        </div>
      </div>
    </div>
  );
}

// Collection description as a short intro ABOVE the product grid (it used to sit below every
// product, where neither shoppers nor Google's snippet logic gave it much weight). Collapsed to
// ~260 chars; "Baca selengkapnya" reveals the full HTML in place.
function CollectionIntro({description, html}) {
  const [open, setOpen] = useState(false);
  const text = String(description ?? '').replace(/\s+/g, ' ').trim();
  if (text.length < 40) return null;
  const LIMIT = 180; // one to two short lines — a caption for the grid, not an article
  const short = text.length > LIMIT ? text.slice(0, LIMIT).replace(/\s+\S*$/, '') + '…' : text;
  const canExpand = text.length > LIMIT || (html && html.length > text.length + 40);
  return (
    <div className="mb-4 max-w-3xl text-[13px] md:text-sm text-gray-500 leading-relaxed">
      {open && html ? (
        <div className="prose prose-sm max-w-none text-gray-600 prose-p:text-[13px] md:prose-p:text-sm prose-headings:text-sm" dangerouslySetInnerHTML={{__html: html}} />
      ) : (
        <p className="m-0 text-[13px] md:text-sm text-gray-500 leading-relaxed">{open ? text : short}</p>
      )}
      {canExpand && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-0.5 text-xs font-semibold text-gray-700 hover:underline"
        >
          {open ? 'Tutup' : 'Baca selengkapnya'}
        </button>
      )}
    </div>
  );
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
  const {collection, soldCounts, reviewSummaries, hasFilters} = useLoaderData();
  const params = useParams();
  const isCuciGudang = params.handle === 'cuci-gudang';
  const filters = collection.products.filters || [];
  const f = useCollectionFilters();
  const [sheetOpen, setSheetOpen] = useState(false);

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

      {/* Products — lg+: filter sidebar (Shopify productFilters) beside the grid; mobile: toolbar + bottom sheet */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        {/* <div>, not <aside>: app.css styles every <aside> as the fixed off-canvas cart drawer */}
        <div className="hidden lg:block" role="complementary" aria-label="Filter produk">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Filter</h2>
              {f.active.length > 0 && <button type="button" onClick={f.clearAll} className="text-xs font-semibold text-gray-500 hover:text-gray-900">Reset</button>}
            </div>
            <FilterPanel filters={filters} f={f} />
          </div>
        </div>
        <div className="min-w-0">
        <CollectionIntro description={collection.description} html={collection.descriptionHtml} />
        {/* Mobile toolbar: Filter button (+ count) and the active chips; chips also show on desktop */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setSheetOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-gray-800 hover:border-gray-900">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-600"><path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" /></svg>
            Filter
            {f.active.length > 0 && <span className="ml-0.5 rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{f.active.length}</span>}
          </button>
          <ActiveFilterChips f={f} />
        </div>
        {hasFilters && collection.products.nodes.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm text-gray-700">Tidak ada produk yang cocok dengan filter ini.</p>
            <button type="button" onClick={f.clearAll} className="mt-3 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">Hapus semua filter</button>
          </div>
        )}
        <MobileFilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} filters={filters} f={f} count={collection.products.nodes.length} />
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
        </div>

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
  // View Transition: the tapped card's photo box morphs into the product page hero (see lib/viewTransition)
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const onCardClick = (e) => {
    if (!isPlainClick(e)) return;
    if (transitionToProduct(heroRef.current, () => navigate(variantUrl))) e.preventDefault();
  };

  const hasDiscount =
    parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) >
    parseFloat(product.priceRange.minVariantPrice.amount);
  const isDiscontinued = product?.metafields?.find((m) => m?.key === 'produk_discontinue')?.value === 'true';
  const isOutOfStock = !product.availableForSale && !isDiscontinued;
  const isPreorder = product.availableForSale && !isDiscontinued && product?.metafields?.find((m) => m?.key === 'pre_order')?.value === 'true';
  const hasFreeItem = (product.metafields?.find((m) => m?.key === 'free')?.value?.length ?? 0) > 0;

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
      onClick={onCardClick}
    >
      {/* Image — rounded on all four corners (it's the visible block now that cards are borderless) */}
      <div ref={heroRef} className="relative overflow-hidden bg-gray-50 aspect-square rounded-xl">
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
        {isPreorder && (
          <div className="absolute bottom-2 right-2 z-10 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide">
            PRE-ORDER
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
      # HTML-diet: spesifikasi (tabel HTML puluhan KB/produk) & isi_dalam_box dibuang —
      # grid collection tak menampilkannya. Pembaca posisi sudah diubah ke find(key).
      {namespace:"custom" key:"garansi"}
      {namespace:"custom" key:"free"}
      {namespace:"custom" key:"periode_promo"}
      {namespace:"custom" key:"periode_promo_akhir"}
      {namespace:"custom" key:"brand"}
      {namespace:"custom" key:"tokopedia"}
      {namespace:"custom" key:"shopee"}
      {namespace:"custom" key:"blibli"}
      {namespace:"custom" key:"bukalapak"}
      {namespace:"custom" key:"lazada"}
      {namespace:"custom" key:"produk_discontinue"}
      {namespace:"custom" key:"produk_serupa"}
      {namespace:"custom" key:"pre_order"}
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
    $filters:[ProductFilter!]
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
        sortKey:$sortkey,
        filters:$filters
      ) {
        filters {
          id
          label
          type
          values { id label count input }
        }
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
