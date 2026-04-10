import { json } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { useEffect, useState } from 'react';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

export const meta = ({ data }) => {
  const title = 'Rekomendasi Kamera Terbaik 2025 | Galaxy Camera';
  const description = 'Rekomendasi kamera, mirrorless, action camera, dan drone terbaik pilihan editor Galaxy Camera. Panduan beli berdasarkan review nyata, spesifikasi lengkap, dan harga terkini di Indonesia.';
  const url = 'https://galaxy.co.id/rekomendasi';
  const image = 'https://galaxy.co.id/icon-512x512.png';
  return [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: 'rekomendasi kamera terbaik, kamera mirrorless terbaik, action camera terbaik, drone terbaik, panduan beli kamera indonesia' },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: 'Galaxy Camera' },
    { property: 'og:locale', content: 'id_ID' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ];
};

export async function loader() {
  try {
    const res = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'rekomendasi' }],
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 50,
        },
      }),
    });

    const data = res.ok ? await res.json() : [];
    const items = (data || [])
      .filter(r => r.document)
      .map(r => {
        const f = r.document.fields || {};
        return {
          slug: r.document.name.split('/').pop(),
          title: f.title?.stringValue || '',
          createdAt: f.createdAt?.stringValue || '',
          viewCount: parseInt(f.viewCount?.integerValue || 0),
          productCount: parseInt(f.productCount?.integerValue || 0),
          coverImage: f.coverImage?.stringValue || '',
          tags: f.tags?.stringValue ? JSON.parse(f.tags.stringValue) : [],
        };
      })
      .filter(d => d.title);

    return json({ items });
  } catch (_) {
    return json({ items: [] });
  }
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function RekomendasiIndex() {
  const { items } = useLoaderData();
  const [activeTag, setActiveTag] = useState('Semua');

  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#080d1a';
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  const [showAllTags, setShowAllTags] = useState(false);
  const MAX_VISIBLE_TAGS = 6;

  // Sort tags by frequency (most used first)
  const tagCounts = items.flatMap(item => item.tags || []).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  const allTags = ['Semua', ...sortedTags];
  const visibleTags = showAllTags ? allTags : allTags.slice(0, MAX_VISIBLE_TAGS + 1);
  const hiddenCount = allTags.length - (MAX_VISIBLE_TAGS + 1);

  const filtered = activeTag === 'Semua' ? items : items.filter(item => item.tags?.includes(activeTag));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Rekomendasi Kamera Terbaik 2025',
    description: 'Rekomendasi kamera, mirrorless, action camera, dan drone terbaik pilihan editor Galaxy Camera.',
    url: 'https://galaxy.co.id/rekomendasi',
    publisher: {
      '@type': 'Organization',
      name: 'Galaxy Camera',
      url: 'https://galaxy.co.id',
      logo: { '@type': 'ImageObject', url: 'https://galaxy.co.id/icon-512x512.png' },
    },
    hasPart: items.map(item => ({
      '@type': 'Article',
      name: item.title,
      url: `https://galaxy.co.id/rekomendasi/${item.slug}`,
      datePublished: item.createdAt,
      image: item.coverImage || 'https://galaxy.co.id/icon-512x512.png',
    })),
  };

  return (
    <div style={{ backgroundColor: '#080d1a', minHeight: '100vh' }} className="w-full pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-10">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Editorial Galaxy Camera</p>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-3">Rekomendasi Produk</h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl">
            Daftar pilihan terbaik dari editor kami — ditulis berdasarkan riset mendalam, review nyata, dan data pasar Indonesia.
          </p>
        </div>

        {/* Tag filter */}
        {allTags.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-7">
            {visibleTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all"
                style={
                  activeTag === tag
                    ? { background: 'rgba(59,130,246,0.8)', color: 'white', border: '1px solid rgba(59,130,246,0.8)' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {tag}
                {tag !== 'Semua' && (
                  <span className="ml-1.5 opacity-60">{tagCounts[tag]}</span>
                )}
              </button>
            ))}
            {!showAllTags && hiddenCount > 0 && (
              <button
                onClick={() => setShowAllTags(true)}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                +{hiddenCount} lainnya
              </button>
            )}
            {showAllTags && hiddenCount > 0 && (
              <button
                onClick={() => setShowAllTags(false)}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Lebih sedikit ↑
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">Belum ada rekomendasi tersedia.</p>
            <Link to="/" className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300">← Kembali ke Beranda</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">Tidak ada rekomendasi untuk tag "{activeTag}".</p>
            <button onClick={() => setActiveTag('Semua')} className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300">
              Lihat semua →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(item => (
              <Link
                key={item.slug}
                to={`/rekomendasi/${item.slug}`}
                className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {/* Cover image */}
                {item.coverImage ? (
                  <div className="aspect-[16/7] overflow-hidden">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/7] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" className="w-16 h-16">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </div>
                )}

                <div className="p-5">
                  {/* Tags */}
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors leading-snug mb-3">
                    {item.title}
                  </h2>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600">
                    <span>{item.productCount} produk</span>
                    <span>·</span>
                    <span>{formatDate(item.createdAt)}</span>
                    {item.viewCount > 0 && (
                      <>
                        <span>·</span>
                        <span>{item.viewCount.toLocaleString('id-ID')} views</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
