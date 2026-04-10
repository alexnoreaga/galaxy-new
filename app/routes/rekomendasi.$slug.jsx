import { json } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { useEffect } from 'react';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

const PRODUCT_QUERY = `#graphql
  query RekomendasiProduct($handle: String!) {
    product(handle: $handle) {
      title
      handle
      featuredImage { url altText }
      variants(first: 1) {
        nodes {
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          availableForSale
        }
      }
    }
  }
`;

export async function loader({ params, context }) {
  const { slug } = params;

  const res = await fetch(`${FIRESTORE_BASE}/rekomendasi/${slug}?key=${FIRESTORE_KEY}`);
  if (!res.ok) throw new Response('Not found', { status: 404 });

  const doc = await res.json();
  const f = doc.fields || {};

  const title = f.title?.stringValue || '';
  const content = f.content?.stringValue ? JSON.parse(f.content.stringValue) : null;
  const productsRaw = f.products?.stringValue ? JSON.parse(f.products.stringValue) : [];
  const tags = f.tags?.stringValue ? JSON.parse(f.tags.stringValue) : [];
  const createdAt = f.createdAt?.stringValue || '';

  if (!title || !content) throw new Response('Not found', { status: 404 });

  // Increment view count (fire and forget)
  fetch(
    `${FIRESTORE_BASE}/rekomendasi/${slug}?updateMask.fieldPaths=viewCount&key=${FIRESTORE_KEY}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { viewCount: { integerValue: (parseInt(f.viewCount?.integerValue || 0) + 1).toString() } } }),
    }
  ).catch(() => {});

  // Fetch live product data from Shopify in parallel
  const liveProducts = await Promise.all(
    productsRaw.map(async (p) => {
      try {
        const data = await context.storefront.query(PRODUCT_QUERY, { variables: { handle: p.handle } });
        const sp = data?.product;
        if (!sp) return p;
        const variant = sp.variants?.nodes?.[0];
        return {
          ...p,
          title: sp.title,
          image: sp.featuredImage?.url || p.image || '',
          imageAlt: sp.featuredImage?.altText || sp.title,
          price: variant?.price?.amount || null,
          compareAtPrice: variant?.compareAtPrice?.amount || null,
          availableForSale: variant?.availableForSale ?? true,
        };
      } catch (_) {
        return p;
      }
    })
  );

  return json({ slug, title, content, products: liveProducts, tags, createdAt });
}

export const meta = ({ data }) => {
  if (!data?.title) return [{ title: 'Rekomendasi | Galaxy Camera' }];
  const url = `https://galaxy.co.id/rekomendasi/${data.slug}`;
  const productNames = data.products?.map(p => p.title).join(', ') || '';
  const description = `${data.title}. Rekomendasi lengkap dari editor Galaxy Camera: ${productNames}. Analisis mendalam, pros & cons, harga terkini, dan verdict untuk setiap produk.`;
  const image = data.products?.[0]?.image || 'https://galaxy.co.id/icon-512x512.png';
  const tags = data.tags?.join(', ') || 'kamera, rekomendasi, galaxy camera';
  const fullTitle = `${data.title} | Galaxy Camera`;
  return [
    { title: fullTitle },
    { name: 'description', content: description.slice(0, 160) },
    { name: 'keywords', content: `${data.title}, rekomendasi kamera terbaik, ${tags}, galaxy camera indonesia` },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description.slice(0, 160) },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: 'Galaxy Camera' },
    { property: 'og:locale', content: 'id_ID' },
    { property: 'article:published_time', content: data.createdAt },
    { property: 'article:author', content: 'Galaxy Camera' },
    { property: 'article:section', content: 'Rekomendasi Kamera' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description.slice(0, 160) },
    { name: 'twitter:image', content: image },
  ];
};

const VERDICT_COLORS = {
  blue:   { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  text: '#93c5fd' },
  green:  { bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.3)',   text: '#86efac' },
  amber:  { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  text: '#fcd34d' },
  purple: { bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.3)',  text: '#d8b4fe' },
  rose:   { bg: 'rgba(244,63,94,0.15)',   border: 'rgba(244,63,94,0.3)',   text: '#fda4af' },
  orange: { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.3)',  text: '#fdba74' },
};

function formatPrice(amount) {
  if (!amount) return null;
  return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
}

function discountPct(price, compareAt) {
  if (!price || !compareAt) return null;
  const p = parseFloat(price), c = parseFloat(compareAt);
  if (c <= p) return null;
  return Math.round((1 - p / c) * 100);
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function RekomendasiSlug() {
  const { slug, title, content, products, tags, createdAt } = useLoaderData();

  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#080d1a';
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  // Map content products by handle for easy lookup
  const contentMap = {};
  (content?.products || []).forEach(p => { contentMap[p.handle] = p; });

  return (
    <div style={{ backgroundColor: '#080d1a', minHeight: '100vh', color: 'white' }} className="w-full pb-24">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Article',
              mainEntityOfPage: { '@type': 'WebPage', '@id': `https://galaxy.co.id/rekomendasi/${slug}` },
              headline: title,
              description: content?.intro?.slice(0, 160),
              image: {
                '@type': 'ImageObject',
                url: products[0]?.image || 'https://galaxy.co.id/icon-512x512.png',
              },
              datePublished: createdAt || new Date().toISOString(),
              dateModified: createdAt || new Date().toISOString(),
              author: { '@type': 'Organization', name: 'Galaxy Camera', url: 'https://galaxy.co.id' },
              publisher: {
                '@type': 'Organization',
                name: 'Galaxy Camera',
                url: 'https://galaxy.co.id',
                logo: { '@type': 'ImageObject', url: 'https://galaxy.co.id/icon-512x512.png' },
              },
              keywords: tags.join(', '),
              inLanguage: 'id-ID',
              isPartOf: { '@type': 'WebSite', name: 'Galaxy Camera', url: 'https://galaxy.co.id' },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: title,
              description: content?.intro?.slice(0, 160),
              url: `https://galaxy.co.id/rekomendasi/${slug}`,
              numberOfItems: products.length,
              itemListElement: products.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: p.title,
                url: `https://galaxy.co.id/products/${p.handle}`,
                image: p.image || '',
              })),
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://galaxy.co.id' },
                { '@type': 'ListItem', position: 2, name: 'Rekomendasi', item: 'https://galaxy.co.id/rekomendasi' },
                { '@type': 'ListItem', position: 3, name: title, item: `https://galaxy.co.id/rekomendasi/${slug}` },
              ],
            },
          ]),
        }}
      />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg,#0f172a 0%,#080d1a 100%)' }} className="relative overflow-hidden pb-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600 opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-16 w-56 h-56 bg-indigo-500 opacity-10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 md:px-8 pt-8">
          <Link to="/rekomendasi" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L4.862 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Semua Rekomendasi
          </Link>

          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Rekomendasi Editor</p>

          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-4">{title}</h1>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            {tags.map(tag => (
              <span key={tag} className="text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
            <span className="text-xs text-slate-600">{formatDate(createdAt)}</span>
            <span className="text-xs text-slate-600">· {products.length} produk</span>
          </div>

          {/* Intro */}
          {content?.intro && (
            <div className="prose prose-sm max-w-none">
              {content.intro.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-slate-300 leading-relaxed mb-3 text-sm md:text-base">{para}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick jump list */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 mb-8">
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Isi</p>
          </div>
          <ol className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.05)' }}>
            {products.map((p, i) => {
              const cp = contentMap[p.handle];
              const vc = VERDICT_COLORS[cp?.verdictColor] || VERDICT_COLORS.blue;
              return (
                <li key={p.handle} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <a
                    href={`#produk-${i + 1}`}
                    className="flex items-center gap-3 px-4 py-2 group hover:bg-white/5 transition-colors"
                  >
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1 leading-snug line-clamp-1">{p.title}</span>
                    {cp?.verdict && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline-block"
                        style={{ background: vc.bg, color: vc.text, border: `1px solid ${vc.border}` }}
                      >
                        {cp.verdict}
                      </span>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-700 flex-shrink-0">
                      <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
                    </svg>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Product cards */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-10">
        {products.map((p, i) => {
          const cp = contentMap[p.handle];
          const vc = VERDICT_COLORS[cp?.verdictColor] || VERDICT_COLORS.blue;
          const disc = discountPct(p.price, p.compareAtPrice);

          return (
            <div key={p.handle} id={`produk-${i + 1}`} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>

              {/* Product header */}
              <div className="p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex gap-4 md:gap-6">

                  {/* Image */}
                  <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {p.image ? (
                      <img src={p.image} alt={p.imageAlt || p.title} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-black tabular-nums text-slate-600">#{i + 1}</span>
                      {cp?.verdict && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: vc.bg, color: vc.text, border: `1px solid ${vc.border}` }}>
                          {cp.verdict}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base md:text-lg font-bold text-white leading-snug mb-1">{p.title}</h2>

                    {cp?.tagline && (
                      <p className="text-xs text-slate-400 mb-3 italic">"{cp.tagline}"</p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.price ? (
                        <>
                          <span className="text-base font-black text-white">{formatPrice(p.price)}</span>
                          {p.compareAtPrice && parseFloat(p.compareAtPrice) > parseFloat(p.price) && (
                            <span className="text-xs text-slate-600 line-through">{formatPrice(p.compareAtPrice)}</span>
                          )}
                          {disc && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                              -{disc}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-slate-500">Cek harga di toko</span>
                      )}
                      {p.availableForSale === false && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">Stok Habis</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex gap-2 mt-4">
                  <a
                    href={`/products/${p.handle}`}
                    className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-all"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}
                  >
                    Lihat Produk →
                  </a>
                  <a
                    href={`/perbandingan?ref=${p.handle}`}
                    className="flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Bandingkan
                  </a>
                </div>
              </div>

              {/* Editorial */}
              {cp?.editorial && (
                <div className="px-5 md:px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {cp.editorial.split('\n').filter(Boolean).map((para, j) => (
                    <p key={j} className="text-sm text-slate-300 leading-relaxed mb-3 last:mb-0">{para}</p>
                  ))}
                </div>
              )}

              {/* Pros / cons + who for */}
              {(cp?.pros?.length > 0 || cp?.cons?.length > 0 || cp?.whoFor) && (
                <div className="px-5 md:px-6 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {cp?.pros?.length > 0 && (
                    <div className="pt-5">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Keunggulan</p>
                      <ul className="space-y-1.5">
                        {cp.pros.map((pro, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                            <svg className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cp?.cons?.length > 0 && (
                    <div className="pt-5">
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Kelemahan</p>
                      <ul className="space-y-1.5">
                        {cp.cons.map((con, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                            <svg className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cp?.whoFor && (
                    <div className="md:col-span-2 rounded-xl px-4 py-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Cocok untuk</p>
                      <p className="text-sm text-slate-300">{cp.whoFor}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conclusion */}
      {content?.conclusion && (
        <div className="max-w-3xl mx-auto px-4 md:px-8 mt-10">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Kesimpulan</p>
            {content.conclusion.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm md:text-base text-slate-300 leading-relaxed mb-3 last:mb-0">{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 mt-8">
        <Link
          to="/rekomendasi"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L4.862 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Lihat semua rekomendasi
        </Link>
      </div>
    </div>
  );
}
