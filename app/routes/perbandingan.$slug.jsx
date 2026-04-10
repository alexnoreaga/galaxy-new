import { json } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useLocation } from '@remix-run/react';
import { useState, useEffect } from 'react';

export async function loader({ params, context }) {
  const { slug } = params;

  // Fetch comparison from Firestore REST API
  let comparison = null;
  let titleA = '', titleB = '', handleA = '', handleB = '', imageA = '', imageB = '';
  let votesA = 0, votesB = 0, generatedAt = '';

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
    votesA = parseInt(f.votesA?.integerValue || 0);
    votesB = parseInt(f.votesB?.integerValue || 0);
    generatedAt = f.generatedAt?.stringValue || '';

    // Increment view count (fire and forget) — updateMask ensures only viewCount is touched
    fetch(
      `https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents/comparisons/${slug}?updateMask.fieldPaths=viewCount&key=AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU`,
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

  // Fetch real-time prices + related comparisons in parallel
  let priceA = null, priceB = null, compareAtA = null, compareAtB = null;
  let realImageA = imageA, realImageB = imageB;
  let related = [];

  try {
    const [dataA, dataB, relatedRes] = await Promise.all([
      handleA ? context.storefront.query(PRODUCT_PRICE_QUERY, { variables: { handle: handleA } }) : null,
      handleB ? context.storefront.query(PRODUCT_PRICE_QUERY, { variables: { handle: handleB } }) : null,
      fetch(`https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents/comparisons?key=AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU&pageSize=50`).catch(() => null),
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

    if (relatedRes?.ok) {
      const relatedData = await relatedRes.json();
      related = (relatedData.documents || [])
        .map(doc => {
          const docSlug = doc.name.split('/').pop();
          const f = doc.fields || {};
          return {
            slug: docSlug,
            titleA: f.titleA?.stringValue || '',
            titleB: f.titleB?.stringValue || '',
            imageA: f.imageA?.stringValue || '',
            imageB: f.imageB?.stringValue || '',
          };
        })
        .filter(d =>
          d.slug !== slug &&
          d.titleA && d.titleB &&
          (d.slug.includes(handleA) || d.slug.includes(handleB))
        )
        .slice(0, 4);
    }
  } catch (_) {}

  const distinct = getDistinctShortName(titleA, titleB);
  const shortNameA = comparison?.shortNameA || distinct.shortA;
  const shortNameB = comparison?.shortNameB || distinct.shortB;

  return json({
    slug,
    titleA, titleB, handleA, handleB,
    shortNameA, shortNameB,
    imageA: realImageA, imageB: realImageB,
    priceA, priceB, compareAtA, compareAtB,
    comparison, votesA, votesB, related,
    generatedAt,
  });
}

export const meta = ({ data }) => {
  if (!data || !data.titleA) return [{ title: 'Perbandingan | Galaxy Camera' }];
  const shortA = data.shortNameA || data.titleA;
  const shortB = data.shortNameB || data.titleB;
  const title = `Perbandingan ${shortA} vs ${shortB} | Galaxy Camera`;
  const description = `Perbandingan lengkap ${shortA} vs ${shortB}. Analisis mendalam — kualitas foto, video, fitur, harga, dan kesimpulan akhir. Temukan produk terbaik untuk kebutuhanmu.`;
  const url = `https://galaxy.co.id/perbandingan/${data.slug}`;
  const image = data.imageA || data.imageB || 'https://galaxy.co.id/icon-512x512.png';

  return [
    { title },
    { name: 'description', content: description },
    // Canonical
    { tagName: 'link', rel: 'canonical', href: url },
    // Open Graph
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: 'Galaxy Camera' },
    { property: 'og:locale', content: 'id_ID' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ];
};

// Computes distinct short names by removing shared prefix
function getDistinctShortName(titleA, titleB) {
  const wordsA = titleA.trim().split(/\s+/);
  const wordsB = titleB.trim().split(/\s+/);
  let commonLen = 0;
  while (
    commonLen < wordsA.length &&
    commonLen < wordsB.length &&
    wordsA[commonLen].toLowerCase() === wordsB[commonLen].toLowerCase()
  ) commonLen++;

  if (commonLen > 0) {
    const uniqueA = wordsA.slice(commonLen).join(' ') || wordsA[wordsA.length - 1];
    const uniqueB = wordsB.slice(commonLen).join(' ') || wordsB[wordsB.length - 1];
    // Carry one context word before the divergence point
    const context = commonLen >= 2 ? wordsA[commonLen - 1] : '';
    return {
      shortA: context ? `${context} ${uniqueA}` : uniqueA,
      shortB: context ? `${context} ${uniqueB}` : uniqueB,
    };
  }
  return { shortA: wordsA.slice(0, 3).join(' '), shortB: wordsB.slice(0, 3).join(' ') };
}

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

  const related = loaderData.related || [];

  const [voteChoice, setVoteChoice] = useState(null);
  const [votesA, setVotesA] = useState(loaderData.votesA || 0);
  const [votesB, setVotesB] = useState(loaderData.votesB || 0);

  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#080d1a';
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`vote_${loaderData.slug}`);
    if (saved) setVoteChoice(saved);
  }, [loaderData.slug]);

  async function handleVote(side) {
    if (voteChoice) return;
    setVoteChoice(side);
    localStorage.setItem(`vote_${loaderData.slug}`, side);
    if (side === 'A') setVotesA(v => v + 1);
    else setVotesB(v => v + 1);
    fetch('/api/vote-comparison', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: loaderData.slug, side }),
    }).catch(() => {});
  }

  if (!comparison || !titleA || !titleB) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080d1a' }}>
        <div className="text-center px-6">
          <p className="text-lg font-bold text-white mb-2">Perbandingan tidak ditemukan</p>
          <p className="text-sm text-slate-500 mb-6">Halaman ini mungkin sudah tidak tersedia.</p>
          <Link to="/perbandingan" className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-500 transition-colors">
            Buat Perbandingan Baru
          </Link>
        </div>
      </div>
    );
  }

  const countA = comparison.categories?.filter(c => c.winner === 'A').length || 0;
  const countB = comparison.categories?.filter(c => c.winner === 'B').length || 0;
  const total = countA + countB || 1;
  const overallWinner = countA > countB ? 'A' : countB > countA ? 'B' : null;
  const discA = discountPct(priceA, compareAtA);
  const discB = discountPct(priceB, compareAtB);
  const distinct = getDistinctShortName(titleA, titleB);
  const shortA = comparison.shortNameA || distinct.shortA;
  const shortB = comparison.shortNameB || distinct.shortB;
  const pctA = Math.round((countA / total) * 100);
  const pctB = 100 - pctA;

  const totalVotes = votesA + votesB;
  const vPctA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const vPctB = 100 - vPctA;

  return (
    <div style={{ backgroundColor: '#080d1a', minHeight: '100vh', color: 'white' }}>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Article',
              mainEntityOfPage: { '@type': 'WebPage', '@id': `https://galaxy.co.id/perbandingan/${loaderData.slug}` },
              headline: `Perbandingan ${shortA} vs ${shortB}`,
              description: comparison.intro,
              image: (imageA || imageB) ? { '@type': 'ImageObject', url: imageA || imageB } : 'https://galaxy.co.id/icon-512x512.png',
              datePublished: loaderData.generatedAt || new Date().toISOString(),
              dateModified: loaderData.generatedAt || new Date().toISOString(),
              author: { '@type': 'Organization', name: 'Galaxy Camera', url: 'https://galaxy.co.id' },
              publisher: { '@type': 'Organization', name: 'Galaxy Camera', url: 'https://galaxy.co.id', logo: { '@type': 'ImageObject', url: 'https://galaxy.co.id/icon-512x512.png' } },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://galaxy.co.id' },
                { '@type': 'ListItem', position: 2, name: 'Bandingkan Produk', item: 'https://galaxy.co.id/perbandingan' },
                { '@type': 'ListItem', position: 3, name: `Perbandingan ${shortA} vs ${shortB}`, item: `https://galaxy.co.id/perbandingan/${loaderData.slug}` },
              ],
            },
          ]),
        }}
      />

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(180deg,#0f172a 0%,#080d1a 100%)' }} className="relative overflow-hidden pb-6">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600 opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-16 w-72 h-72 bg-orange-500 opacity-10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 md:px-8 pt-6">
          <Link to="/perbandingan" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L4.862 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Kembali
          </Link>

          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Perbandingan Produk · AI Analysis</p>
          <h1 className="text-xl md:text-3xl font-black text-white mb-6 leading-snug">
            {shortA} <span className="text-slate-600 font-normal text-base md:text-xl mx-1">vs</span> {shortB}
          </h1>

          {/* ── PRODUCT CARDS ── */}
          <div className="grid grid-cols-2 gap-3 md:gap-6 relative mb-2">
            {[
              { title: titleA, short: shortA, image: imageA, price: priceA, compareAt: compareAtA, handle: handleA, side: 'A', disc: discA, wins: countA, accent: 'blue' },
              { title: titleB, short: shortB, image: imageB, price: priceB, compareAt: compareAtB, handle: handleB, side: 'B', disc: discB, wins: countB, accent: 'orange' },
            ].map((p) => {
              const isWinner = overallWinner === p.side;
              const accentColor = p.accent === 'blue' ? { main: '#3b82f6', dark: '#2563eb', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd' }
                                                       : { main: '#f97316', dark: '#ea580c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.4)', text: '#fdba74' };
              return (
                <div
                  key={p.side}
                  className="relative rounded-2xl flex flex-col items-center text-center overflow-hidden"
                  style={{
                    background: isWinner ? accentColor.bg : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isWinner ? accentColor.border : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {isWinner && (
                    <div className="w-full py-1.5 text-center text-[10px] font-black uppercase tracking-widest text-white" style={{ background: accentColor.dark }}>
                      ✓ Pilihan Terbaik
                    </div>
                  )}
                  <div className="p-3 md:p-6 flex flex-col items-center w-full">
                    {p.image
                      ? <img src={p.image} alt={p.title} className="w-20 h-20 md:w-36 md:h-36 object-contain mb-3" />
                      : <div className="w-20 h-20 md:w-36 md:h-36 rounded-xl bg-white/5 mb-3" />
                    }
                    <p className="text-xs md:text-sm font-bold text-white leading-snug line-clamp-2 mb-2">{p.title}</p>
                    <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full mb-2" style={{ background: accentColor.bg, color: accentColor.text, border: `1px solid ${accentColor.border}` }}>
                      {p.wins} menang
                    </span>
                    {p.disc && <p className="text-[10px] text-rose-400 font-bold mb-0.5">-{p.disc}%</p>}
                    <p className="text-sm md:text-lg font-black text-white mb-3">{formatPrice(p.price) || '—'}</p>
                    <Link
                      to={`/products/${p.handle}`}
                      className="w-full inline-flex items-center justify-center text-white text-xs md:text-sm font-bold px-3 py-2 rounded-xl transition-colors"
                      style={{ background: accentColor.dark }}
                    >
                      Beli →
                    </Link>
                  </div>
                </div>
              );
            })}
            {/* VS pill */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#0f172a', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <span className="text-[10px] font-black text-slate-500">VS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCORE BAR ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        <div className="rounded-2xl p-4 md:p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-4 text-center">Skor Keseluruhan</p>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl md:text-4xl font-black text-blue-400 tabular-nums w-8 text-right">{countA}</span>
            <div className="flex-1 h-4 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${pctA}%`, background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }} />
              <div className="h-full rounded-r-full transition-all duration-700" style={{ width: `${pctB}%`, background: 'linear-gradient(90deg,#ea580c,#f97316)' }} />
            </div>
            <span className="text-3xl md:text-4xl font-black text-orange-400 tabular-nums w-8">{countB}</span>
          </div>
          <div className="flex justify-between px-11">
            <p className="text-[11px] text-blue-400 font-semibold truncate max-w-[40%]">{shortA}</p>
            <p className="text-[11px] text-orange-400 font-semibold truncate max-w-[40%] text-right">{shortB}</p>
          </div>
        </div>
      </div>

      {/* ── VISITOR VOTE ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6">
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pilihan Pengunjung</p>
          </div>
          <div className="p-4">
            {!voteChoice ? (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { side: 'A', short: shortA, color: '#2563eb', textColor: '#93c5fd', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
                  { side: 'B', short: shortB, color: '#ea580c', textColor: '#fdba74', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
                ].map(p => (
                  <button
                    key={p.side}
                    onClick={() => handleVote(p.side)}
                    className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-4 transition-all active:scale-95"
                    style={{ background: p.bg, border: `1.5px solid ${p.border}` }}
                  >
                    <span className="text-xl">👍</span>
                    <span className="text-xs font-bold leading-snug text-center line-clamp-2" style={{ color: p.textColor }}>{p.short}</span>
                    <span className="text-[10px] text-slate-600">{p.side === 'A' ? votesA : votesB} suara</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-blue-400 w-9 text-right tabular-nums">{vPctA}%</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${vPctA}%`, background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }} />
                    <div className="h-full rounded-r-full transition-all duration-700" style={{ width: `${vPctB}%`, background: 'linear-gradient(90deg,#ea580c,#f97316)' }} />
                  </div>
                  <span className="text-xs font-bold text-orange-400 w-9 tabular-nums">{vPctB}%</span>
                </div>
                <div className="flex justify-between px-1 mb-1">
                  <p className="text-[10px] text-slate-600">{shortA} · {votesA} suara</p>
                  <p className="text-[10px] text-slate-600">{votesB} suara · {shortB}</p>
                </div>
                <p className="text-center text-[10px] text-slate-700">
                  Kamu memilih {voteChoice === 'A' ? shortA : shortB} · {totalVotes} total suara
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── INTRO ── */}
      {comparison.intro && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6">
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">{comparison.intro}</p>
        </div>
      )}

      {/* ── CATEGORIES ── */}
      {comparison.categories?.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Perbandingan Kategori</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {comparison.categories.map((cat, i) => {
              const isA = cat.winner === 'A';
              const accent = isA
                ? { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#93c5fd', pill: 'rgba(59,130,246,0.15)' }
                : { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', text: '#fdba74', pill: 'rgba(249,115,22,0.15)' };
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-400 mb-1">{cat.name}</p>
                    {cat.reason && <p className="text-[11px] text-slate-600 leading-relaxed">{cat.reason}</p>}
                  </div>
                  <span
                    className="flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full mt-0.5"
                    style={{ background: accent.pill, color: accent.text, border: `1px solid ${accent.border}` }}
                  >
                    {isA ? shortA : shortB}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VERDICT ── */}
      {comparison.verdict && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Pilih Yang Mana?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { short: shortA, choose: comparison.verdict.chooseA, handle: handleA, accent: 'blue', side: 'A' },
              { short: shortB, choose: comparison.verdict.chooseB, handle: handleB, accent: 'orange', side: 'B' },
            ].map((p) => {
              const ac = p.accent === 'blue'
                ? { bg: 'rgba(37,99,235,0.08)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa', btn: '#2563eb', check: '#3b82f6' }
                : { bg: 'rgba(234,88,12,0.08)', border: 'rgba(249,115,22,0.2)', text: '#fb923c', btn: '#ea580c', check: '#f97316' };
              return (
                <div key={p.side} className="rounded-2xl p-4 md:p-5 flex flex-col" style={{ background: ac.bg, border: `1px solid ${ac.border}` }}>
                  <p className="text-sm font-bold mb-3" style={{ color: ac.text }}>Pilih {p.short} jika...</p>
                  <ul className="space-y-2 flex-1 mb-4">
                    {(p.choose || []).slice(0, 3).map((reason, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs md:text-sm text-slate-300 leading-snug">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ color: ac.check }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {reason}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/products/${p.handle}`}
                    className="w-full inline-flex items-center justify-center text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all"
                    style={{ background: ac.btn }}
                  >
                    Lihat Produk →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CONCLUSION ── */}
      {comparison.conclusion && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6">
          <div className="rounded-2xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Kesimpulan</p>
            <h2 className="sr-only">Kesimpulan: {titleA} vs {titleB}</h2>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">"{comparison.conclusion}"</p>
          </div>
        </div>
      )}

      {/* ── RELATED ── */}
      {related.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Perbandingan Terkait</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {related.map(item => (
              <a
                key={item.slug}
                href={`/perbandingan/${item.slug}`}
                className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.imageA ? <img src={item.imageA} alt={item.titleA} className="w-9 h-9 object-contain rounded-lg bg-white/10" /> : <div className="w-9 h-9 rounded-lg bg-white/10" />}
                  <span className="text-[9px] font-black text-slate-700">VS</span>
                  {item.imageB ? <img src={item.imageB} alt={item.titleB} className="w-9 h-9 object-contain rounded-lg bg-white/10" /> : <div className="w-9 h-9 rounded-lg bg-white/10" />}
                </div>
                <p className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors line-clamp-2 leading-snug flex-1">
                  {item.titleA} <span className="text-slate-700 font-normal">vs</span> {item.titleB}
                </p>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-700 flex-shrink-0">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER CTA ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16 pt-2">
        <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs text-slate-600 text-center sm:text-left">
            Analisis AI berdasarkan data produk.{' '}
            <a href="https://wa.me/6282111311131" className="text-blue-500 hover:underline">Tanya toko kami</a> untuk saran personal.
          </p>
          <Link
            to="/perbandingan"
            className="flex-shrink-0 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
          >
            Bandingkan Produk Lain →
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
