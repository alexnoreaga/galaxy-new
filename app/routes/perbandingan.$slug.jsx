import { json, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useLocation } from '@remix-run/react';

export async function loader({ params, context }) {
  const { slug } = params;

  // Fetch comparison from Firestore REST API
  let comparison = null;
  let titleA = '', titleB = '', handleA = '', handleB = '', imageA = '', imageB = '';

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents/comparisons/${slug}?key=AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU`
    );
    if (!res.ok) throw new Error('Not found');
    const doc = await res.json();
    const f = doc.fields || {};

    titleA = f.titleA?.stringValue || '';
    titleB = f.titleB?.stringValue || '';
    handleA = f.handleA?.stringValue || '';
    handleB = f.handleB?.stringValue || '';
    imageA = f.imageA?.stringValue || '';
    imageB = f.imageB?.stringValue || '';

    const articleRaw = f.article?.stringValue || '';
    comparison = articleRaw ? JSON.parse(articleRaw) : null;

    // Increment view count (fire and forget)
    fetch(
      `https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents/comparisons/${slug}?key=AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: { viewCount: { integerValue: (parseInt(f.viewCount?.integerValue || 0) + 1).toString() } }
        }),
      }
    ).catch(() => {});

  } catch (_) {
    // Firestore not set up yet — client will use navigation state
  }

  // comparison may be null if Firestore isn't set up yet —
  // the client will use navigation state as fallback

  // Fetch real-time prices from Shopify for both products
  let priceA = null, priceB = null, compareAtA = null, compareAtB = null;
  let realImageA = imageA, realImageB = imageB;

  try {
    const [dataA, dataB] = await Promise.all([
      handleA ? context.storefront.query(PRODUCT_PRICE_QUERY, { variables: { handle: handleA } }) : null,
      handleB ? context.storefront.query(PRODUCT_PRICE_QUERY, { variables: { handle: handleB } }) : null,
    ]);

    if (dataA?.product) {
      priceA = dataA.product.variants?.nodes?.[0]?.price;
      compareAtA = dataA.product.variants?.nodes?.[0]?.compareAtPrice;
      realImageA = dataA.product.featuredImage?.url || imageA;
    }
    if (dataB?.product) {
      priceB = dataB.product.variants?.nodes?.[0]?.price;
      compareAtB = dataB.product.variants?.nodes?.[0]?.compareAtPrice;
      realImageB = dataB.product.featuredImage?.url || imageB;
    }
  } catch (_) {}

  return json({
    slug,
    titleA, titleB, handleA, handleB,
    imageA: realImageA, imageB: realImageB,
    priceA, priceB, compareAtA, compareAtB,
    comparison,
  });
}

export const meta = ({ data }) => {
  if (!data) return [{ title: 'Perbandingan | Galaxy Camera' }];
  return [
    { title: `${data.titleA} vs ${data.titleB} — Perbandingan Lengkap | Galaxy Camera` },
    { name: 'description', content: `Perbandingan lengkap ${data.titleA} vs ${data.titleB}. Analisis AI mendalam — kualitas foto, video, harga, dan kesimpulan akhir. Temukan produk terbaik untuk kamu.` },
  ];
};

function formatPrice(price) {
  if (!price) return null;
  return `Rp ${parseFloat(price.amount).toLocaleString('id-ID')}`;
}

function discountPct(price, compareAt) {
  if (!price || !compareAt) return null;
  const p = parseFloat(price.amount);
  const c = parseFloat(compareAt.amount);
  if (c <= p) return null;
  return Math.round((1 - p / c) * 100);
}

export default function PerbandinganSlug() {
  const loaderData = useLoaderData();
  const location = useLocation();

  // Use navigation state as fallback when Firestore isn't set up yet
  const navState = location.state || {};
  const titleA = loaderData.titleA || navState.titleA || '';
  const titleB = loaderData.titleB || navState.titleB || '';
  const handleA = loaderData.handleA || navState.handleA || '';
  const handleB = loaderData.handleB || navState.handleB || '';
  const imageA = loaderData.imageA || navState.imageA || '';
  const imageB = loaderData.imageB || navState.imageB || '';
  const priceA = loaderData.priceA;
  const priceB = loaderData.priceB;
  const compareAtA = loaderData.compareAtA;
  const compareAtB = loaderData.compareAtB;
  const comparison = loaderData.comparison || navState.comparison;

  if (!comparison || !titleA || !titleB) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 mb-2">Perbandingan tidak ditemukan</p>
          <p className="text-sm text-gray-500 mb-6">Halaman ini mungkin sudah tidak tersedia.</p>
          <Link to="/perbandingan" className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
            Buat Perbandingan Baru
          </Link>
        </div>
      </div>
    );
  }

  const countA = comparison.categories?.filter(c => c.winner === 'A').length || 0;
  const countB = comparison.categories?.filter(c => c.winner === 'B').length || 0;
  const overallWinner = countA > countB ? 'A' : countB > countA ? 'B' : null;
  const discA = discountPct(priceA, compareAtA);
  const discB = discountPct(priceB, compareAtB);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD Schema for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${titleA} vs ${titleB} — Perbandingan Lengkap`,
            description: comparison.intro,
            author: { '@type': 'Organization', name: 'Galaxy Camera' },
            publisher: { '@type': 'Organization', name: 'Galaxy Camera', url: 'https://galaxy.co.id' },
          }),
        }}
      />

      {/* Hero */}
      <div
        className="text-white relative overflow-hidden"
        style={{
          backgroundColor: '#0f172a',
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.2) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'auto, auto, 40px 40px',
        }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600 opacity-10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 py-12">
          <Link to="/perbandingan" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 mb-6 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L4.862 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Kembali ke Perbandingan
          </Link>

          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">Perbandingan Produk</p>

          {/* Product cards */}
          <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
            {[
              { title: titleA, image: imageA, price: priceA, compareAt: compareAtA, handle: handleA, side: 'A', disc: discA, wins: countA },
              { title: titleB, image: imageB, price: priceB, compareAt: compareAtB, handle: handleB, side: 'B', disc: discB, wins: countB },
            ].map((p, i) => (
              <div key={i} className={`relative text-center ${overallWinner === p.side ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''} bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6`}>
                {overallWinner === p.side && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Rekomendasi
                  </div>
                )}
                {p.image && (
                  <img src={p.image} alt={p.title} className="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto mb-3" />
                )}
                <p className="text-sm md:text-base font-bold text-white leading-snug mb-2 line-clamp-2">{p.title}</p>
                {p.wins > 0 && (
                  <p className="text-xs text-blue-400 font-semibold mb-2">Menang {p.wins} kategori</p>
                )}
                {p.compareAt && parseFloat(p.compareAt.amount) > parseFloat(p.price?.amount || 0) && (
                  <p className="text-xs text-slate-500 line-through">{formatPrice(p.compareAt)}</p>
                )}
                <p className="text-base md:text-lg font-black text-white">
                  {formatPrice(p.price) || '—'}
                  {p.disc && <span className="ml-1.5 text-xs font-bold text-rose-400">-{p.disc}%</span>}
                </p>
                <Link
                  to={`/products/${p.handle}`}
                  className="mt-3 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  Beli Sekarang
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>

          {/* VS badge center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl border-2 border-white/20">
              <span className="text-sm font-black text-white">VS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Intro */}
        {comparison.intro && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-700 leading-relaxed">{comparison.intro}</p>
          </div>
        )}

        {/* Winner per category */}
        {comparison.categories?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Pemenang Per Kategori</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {comparison.categories.map((cat, i) => {
                const isA = cat.winner === 'A';
                return (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 mb-1">{cat.name}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{cat.reason}</p>
                      </div>
                      <div className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${isA ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'}`}>
                        {isA ? titleA.split(' ').slice(0, 2).join(' ') : titleB.split(' ').slice(0, 2).join(' ')} ✓
                      </div>
                    </div>
                    {/* Fill bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isA ? 'bg-blue-500' : 'bg-gray-200'}`}
                          style={{ width: isA ? '75%' : '25%' }}
                        />
                      </div>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${!isA ? 'bg-indigo-500' : 'bg-gray-200'}`}
                          style={{ width: !isA ? '75%' : '25%' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Score summary */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
              <div className="px-6 py-4 text-center">
                <p className="text-2xl font-black text-blue-600">{countA}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{titleA.split(' ').slice(0, 3).join(' ')}</p>
              </div>
              <div className="px-6 py-4 text-center">
                <p className="text-2xl font-black text-indigo-600">{countB}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{titleB.split(' ').slice(0, 3).join(' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Detail review */}
        {(comparison.detailA || comparison.detailB) && (
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: titleA, detail: comparison.detailA, color: 'blue' },
              { title: titleB, detail: comparison.detailB, color: 'indigo' },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className={`text-sm font-bold mb-3 ${p.color === 'blue' ? 'text-blue-700' : 'text-indigo-700'}`}>
                  Review: {p.title.split(' ').slice(0, 3).join(' ')}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* Verdict */}
        {comparison.verdict && (
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: titleA, choose: comparison.verdict.chooseA, color: 'blue', handle: handleA },
              { title: titleB, choose: comparison.verdict.chooseB, color: 'indigo', handle: handleB },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${p.color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm ${p.color === 'blue' ? 'bg-blue-600' : 'bg-indigo-600'}`}>
                    🏆
                  </div>
                  <p className={`text-sm font-bold ${p.color === 'blue' ? 'text-blue-800' : 'text-indigo-800'}`}>
                    Pilih {p.title.split(' ').slice(0, 2).join(' ')} jika...
                  </p>
                </div>
                <ul className="space-y-2 mb-5">
                  {(p.choose || []).map((reason, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.color === 'blue' ? 'text-blue-500' : 'text-indigo-500'}`}>
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      {reason}
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/products/${p.handle}`}
                  className={`w-full inline-flex items-center justify-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors ${p.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  Lihat Produk
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Conclusion */}
        {comparison.conclusion && (
          <div className="bg-gray-900 text-white rounded-2xl p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Kesimpulan Akhir</p>
            <p className="text-base text-slate-200 leading-relaxed">{comparison.conclusion}</p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          Perbandingan ini dibuat otomatis oleh AI berdasarkan data produk dan pengetahuan umum. Untuk informasi lebih lanjut,{' '}
          <a href="https://wa.me/6282111311131" className="text-blue-500 hover:underline">hubungi toko kami</a>.
        </p>

        {/* Compare another */}
        <div className="text-center pt-2 pb-8">
          <Link
            to="/perbandingan"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-5 py-2.5 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
            </svg>
            Bandingkan Produk Lain
          </Link>
        </div>
      </div>
    </div>
  );
}

const PRODUCT_PRICE_QUERY = `#graphql
  query ProductPrice($handle: String!) {
    product(handle: $handle) {
      featuredImage { url }
      variants(first: 1) {
        nodes {
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
        }
      }
    }
  }
`;
