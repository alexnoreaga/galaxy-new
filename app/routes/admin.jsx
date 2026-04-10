import { json, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { useState, useRef } from 'react';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
const PAGE_SIZE = 15;

export const meta = () => [
  { title: 'Admin Dashboard | Galaxy Camera' },
  { name: 'robots', content: 'noindex, nofollow' },
];

export const headers = () => ({
  'X-Robots-Tag': 'noindex, nofollow',
});

const CUSTOMER_EMAIL_QUERY = `#graphql
  query CustomerEmail($customertoken: String!) {
    customer(customerAccessToken: $customertoken) { email }
  }
`;
const ADMIN_QUERY = `#graphql
  query AdminGalaxy($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      edges { node { fields { value } } }
    }
  }
`;

function parseCompDocs(data) {
  return (data || [])
    .filter(r => r.document)
    .map(r => {
      const f = r.document.fields || {};
      const slug = r.document.name.split('/').pop();
      return {
        slug,
        titleA: f.titleA?.stringValue || '',
        titleB: f.titleB?.stringValue || '',
        viewCount: parseInt(f.viewCount?.integerValue || 0),
        votesA: parseInt(f.votesA?.integerValue || 0),
        votesB: parseInt(f.votesB?.integerValue || 0),
        generatedAt: f.generatedAt?.stringValue || '',
      };
    })
    .filter(d => d.titleA && d.titleB);
}

function parseFaqDocs(data) {
  return (data || [])
    .filter(r => r.document)
    .map(r => {
      const f = r.document.fields || {};
      const handle = r.document.name.split('/').pop();
      return {
        handle,
        productTitle: f.productTitle?.stringValue || handle,
        generatedAt: f.generatedAt?.stringValue || '',
      };
    });
}

export async function loader({ context }) {
  const { session } = context;
  const customerAccessToken = await session.get('customerAccessToken');
  const token = customerAccessToken?.accessToken || '';

  const [custEmail, admgalaxy] = await Promise.all([
    context.storefront.query(CUSTOMER_EMAIL_QUERY, { variables: { customertoken: token } }),
    context.storefront.query(ADMIN_QUERY, { variables: { type: 'admin_galaxy', first: 20 } }),
  ]);

  const isAdmin = !!(admgalaxy?.metaobjects?.edges?.find(
    a => a?.node?.fields[0]?.value === custEmail?.customer?.email && custEmail?.customer?.email
  ));

  if (!isAdmin) throw redirect('/');

  const [compCountRes, compAggRes, compTopRes, compAllRes, faqCountRes, faqAllRes, configRes] =
    await Promise.all([
      fetch(`${FIRESTORE_BASE}:runAggregationQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredAggregationQuery: {
            aggregations: [{ count: {}, alias: 'count' }],
            structuredQuery: { from: [{ collectionId: 'comparisons' }] },
          },
        }),
      }),
      fetch(`${FIRESTORE_BASE}:runAggregationQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredAggregationQuery: {
            aggregations: [
              { sum: { field: { fieldPath: 'viewCount' } }, alias: 'totalViews' },
              { sum: { field: { fieldPath: 'votesA' } }, alias: 'totalVotesA' },
              { sum: { field: { fieldPath: 'votesB' } }, alias: 'totalVotesB' },
            ],
            structuredQuery: { from: [{ collectionId: 'comparisons' }] },
          },
        }),
      }),
      fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'comparisons' }],
            orderBy: [{ field: { fieldPath: 'viewCount' }, direction: 'DESCENDING' }],
            limit: 5,
          },
        }),
      }),
      fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'comparisons' }],
            orderBy: [{ field: { fieldPath: 'generatedAt' }, direction: 'DESCENDING' }],
            limit: PAGE_SIZE + 1,
          },
        }),
      }),
      fetch(`${FIRESTORE_BASE}:runAggregationQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredAggregationQuery: {
            aggregations: [{ count: {}, alias: 'count' }],
            structuredQuery: { from: [{ collectionId: 'product_faqs' }] },
          },
        }),
      }),
      fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'product_faqs' }],
            orderBy: [{ field: { fieldPath: 'generatedAt' }, direction: 'DESCENDING' }],
            limit: PAGE_SIZE + 1,
          },
        }),
      }),
      fetch(`${FIRESTORE_BASE}/perbandingan_config/settings?key=${FIRESTORE_KEY}`).catch(() => null),
    ]);

  let compCount = 0, totalViews = 0, totalVotes = 0;
  let topComparisons = [], allComparisons = [], compCursor = null, hasMoreComp = false;
  let faqCount = 0, allFaqs = [], faqCursor = null, hasMoreFaq = false;
  let allowedCollections = null;

  if (compCountRes.ok) {
    const d = await compCountRes.json();
    compCount = parseInt(d[0]?.result?.aggregateFields?.count?.integerValue || 0);
  }
  if (compAggRes.ok) {
    const d = await compAggRes.json();
    const agg = d[0]?.result?.aggregateFields || {};
    totalViews = parseInt(agg.totalViews?.integerValue || 0);
    totalVotes = parseInt(agg.totalVotesA?.integerValue || 0) + parseInt(agg.totalVotesB?.integerValue || 0);
  }
  if (compTopRes.ok) topComparisons = parseCompDocs(await compTopRes.json());
  if (compAllRes.ok) {
    allComparisons = parseCompDocs(await compAllRes.json());
    hasMoreComp = allComparisons.length > PAGE_SIZE;
    if (hasMoreComp) allComparisons = allComparisons.slice(0, PAGE_SIZE);
    compCursor = allComparisons.length > 0 ? allComparisons[allComparisons.length - 1].generatedAt : null;
  }
  if (faqCountRes.ok) {
    const d = await faqCountRes.json();
    faqCount = parseInt(d[0]?.result?.aggregateFields?.count?.integerValue || 0);
  }
  if (faqAllRes.ok) {
    allFaqs = parseFaqDocs(await faqAllRes.json());
    hasMoreFaq = allFaqs.length > PAGE_SIZE;
    if (hasMoreFaq) allFaqs = allFaqs.slice(0, PAGE_SIZE);
    faqCursor = allFaqs.length > 0 ? allFaqs[allFaqs.length - 1].generatedAt : null;
  }
  if (configRes?.ok) {
    const d = await configRes.json().catch(() => null);
    const raw = d?.fields?.allowedCollections?.stringValue;
    if (raw) allowedCollections = JSON.parse(raw);
  }

  return json({ compCount, totalViews, totalVotes, topComparisons, allComparisons, hasMoreComp, compCursor, faqCount, allFaqs, hasMoreFaq, faqCursor, allowedCollections });
}

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
    orange: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', text: '#fb923c' },
    green: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', text: '#4ade80' },
    amber: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#fbbf24' },
  };
  const c = colors[color];
  return (
    <div className="rounded-2xl p-5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: c.text }}>{label}</p>
      <p className="text-3xl font-black text-white tabular-nums">{value.toLocaleString('id-ID')}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DateBadge({ iso }) {
  return (
    <span
      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
    >
      {formatDate(iso)}
    </span>
  );
}

function TrashIcon({ spinning }) {
  if (spinning) {
    return (
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default function AdminDashboard() {
  const {
    compCount, totalViews, totalVotes,
    topComparisons,
    allComparisons: initAllComp, hasMoreComp: initHasMoreComp, compCursor: initCompCursor,
    faqCount,
    allFaqs: initAllFaqs, hasMoreFaq: initHasMoreFaq, faqCursor: initFaqCursor,
    allowedCollections,
  } = useLoaderData();

  const [comparisons, setComparisons] = useState(initAllComp);
  const [compCursor, setCompCursor] = useState(initCompCursor);
  const [hasMoreComp, setHasMoreComp] = useState(initHasMoreComp);
  const [loadingMoreComp, setLoadingMoreComp] = useState(false);
  const [deletingComp, setDeletingComp] = useState(null);

  const [faqs, setFaqs] = useState(initAllFaqs);
  const [faqCursor, setFaqCursor] = useState(initFaqCursor);
  const [hasMoreFaq, setHasMoreFaq] = useState(initHasMoreFaq);
  const [loadingMoreFaq, setLoadingMoreFaq] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState(null);

  async function loadMoreComparisons() {
    if (!compCursor || loadingMoreComp) return;
    setLoadingMoreComp(true);
    try {
      const res = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'comparisons' }],
            orderBy: [{ field: { fieldPath: 'generatedAt' }, direction: 'DESCENDING' }],
            limit: PAGE_SIZE + 1,
            startAt: { values: [{ stringValue: compCursor }], before: false },
          },
        }),
      });
      const data = await res.json();
      const docs = parseCompDocs(data);
      const more = docs.length > PAGE_SIZE;
      const page = more ? docs.slice(0, PAGE_SIZE) : docs;
      setComparisons(prev => [...prev, ...page]);
      setHasMoreComp(more);
      setCompCursor(more && page.length > 0 ? page[page.length - 1].generatedAt : null);
    } catch (e) {
      console.error('loadMoreComparisons:', e);
    }
    setLoadingMoreComp(false);
  }

  async function deleteComparison(slug) {
    if (!confirm('Hapus perbandingan ini? Data tidak bisa dipulihkan.')) return;
    setDeletingComp(slug);
    try {
      await fetch(`${FIRESTORE_BASE}/comparisons/${slug}?key=${FIRESTORE_KEY}`, { method: 'DELETE' });
      setComparisons(prev => prev.filter(c => c.slug !== slug));
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
    setDeletingComp(null);
  }

  async function loadMoreFaqs() {
    if (!faqCursor || loadingMoreFaq) return;
    setLoadingMoreFaq(true);
    try {
      const res = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'product_faqs' }],
            orderBy: [{ field: { fieldPath: 'generatedAt' }, direction: 'DESCENDING' }],
            limit: PAGE_SIZE + 1,
            startAt: { values: [{ stringValue: faqCursor }], before: false },
          },
        }),
      });
      const data = await res.json();
      const docs = parseFaqDocs(data);
      const more = docs.length > PAGE_SIZE;
      const page = more ? docs.slice(0, PAGE_SIZE) : docs;
      setFaqs(prev => [...prev, ...page]);
      setHasMoreFaq(more);
      setFaqCursor(more && page.length > 0 ? page[page.length - 1].generatedAt : null);
    } catch (e) {
      console.error('loadMoreFaqs:', e);
    }
    setLoadingMoreFaq(false);
  }

  async function deleteFaq(handle) {
    if (!confirm('Hapus FAQ produk ini? Data tidak bisa dipulihkan.')) return;
    setDeletingFaq(handle);
    try {
      await fetch(`${FIRESTORE_BASE}/product_faqs/${handle}?key=${FIRESTORE_KEY}`, { method: 'DELETE' });
      setFaqs(prev => prev.filter(f => f.handle !== handle));
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
    setDeletingFaq(null);
  }

  return (
    <div style={{ backgroundColor: '#080d1a', minHeight: '100vh', color: 'white' }} className="pb-20">
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">Admin Only</p>
            <h1 className="text-2xl md:text-3xl font-black text-white">Dashboard GalaxyPWA</h1>
            <p className="text-sm text-slate-500 mt-1">Statistik Firebase Firestore — data real-time dari server</p>
          </div>
          <Link
            to="/"
            className="text-sm text-slate-500 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
          >
            ← Kembali
          </Link>
        </div>

        {/* ── PERBANDINGAN STATS ── */}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Perbandingan Produk</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <StatCard label="Total Perbandingan" value={compCount} sub="tersimpan di Firestore" color="blue" />
          <StatCard label="Total Views" value={totalViews} sub="dari semua perbandingan" color="orange" />
          <StatCard label="Total Votes" value={totalVotes} sub="suara dari pengunjung" color="green" />
        </div>

        {/* Top 5 most viewed */}
        {topComparisons.length > 0 && (
          <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Paling Banyak Dilihat</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {topComparisons.map((item, i) => (
                <div key={item.slug} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg font-black tabular-nums w-6 flex-shrink-0" style={{ color: i === 0 ? '#fbbf24' : '#475569' }}>
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/perbandingan/${item.slug}`}
                      className="text-sm font-semibold text-slate-300 hover:text-white transition-colors line-clamp-1"
                    >
                      {item.titleA} vs {item.titleB}
                    </a>
                    <DateBadge iso={item.generatedAt} />
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{item.viewCount.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-slate-600">views</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{(item.votesA + item.votesB).toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-slate-600">votes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Comparisons — paginated + deletable */}
        <div className="rounded-2xl mb-10 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Semua Perbandingan</p>
            <p className="text-xs text-slate-600">Terbaru · {comparisons.length} dari {compCount}</p>
          </div>
          {comparisons.length === 0 ? (
            <p className="text-sm text-slate-600 px-5 py-6">Belum ada perbandingan tersimpan.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {comparisons.map(item => (
                <div key={item.slug} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/perbandingan/${item.slug}`}
                      className="text-sm font-semibold text-slate-300 hover:text-white transition-colors line-clamp-1"
                    >
                      {item.titleA} vs {item.titleB}
                    </a>
                    <DateBadge iso={item.generatedAt} />
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-white">{item.viewCount.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-slate-600">views</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-white">{(item.votesA + item.votesB).toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-slate-600">votes</p>
                    </div>
                    <button
                      onClick={() => deleteComparison(item.slug)}
                      disabled={deletingComp === item.slug}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      title="Hapus perbandingan"
                    >
                      <TrashIcon spinning={deletingComp === item.slug} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMoreComp && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={loadMoreComparisons}
                disabled={loadingMoreComp}
                className="w-full text-sm font-semibold text-slate-400 hover:text-white py-2 rounded-xl transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {loadingMoreComp ? 'Memuat...' : `Muat ${PAGE_SIZE} lagi ↓`}
              </button>
            </div>
          )}
        </div>

        {/* ── FAQ STATS ── */}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Pertanyaan Umum (AI FAQ)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <StatCard label="Produk dengan FAQ" value={faqCount} sub="tersimpan di Firestore" color="amber" />
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Estimasi FAQ Items</p>
            <p className="text-3xl font-black text-white tabular-nums">{(faqCount * 10).toLocaleString('id-ID')}</p>
            <p className="text-xs text-slate-500 mt-1">rata-rata 10 Q&A per produk</p>
          </div>
        </div>

        {/* All FAQs — paginated + deletable */}
        <div className="rounded-2xl mb-10 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Semua FAQ Produk</p>
            <p className="text-xs text-slate-600">Terbaru · {faqs.length} dari {faqCount}</p>
          </div>
          {faqs.length === 0 ? (
            <p className="text-sm text-slate-600 px-5 py-6">Belum ada FAQ tersimpan.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {faqs.map(item => (
                <div key={item.handle} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/products/${item.handle}`}
                      className="text-sm font-semibold text-slate-300 hover:text-white transition-colors line-clamp-1"
                    >
                      {item.productTitle}
                    </a>
                    <DateBadge iso={item.generatedAt} />
                  </div>
                  <button
                    onClick={() => deleteFaq(item.handle)}
                    disabled={deletingFaq === item.handle}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    title="Hapus FAQ"
                  >
                    <TrashIcon spinning={deletingFaq === item.handle} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {hasMoreFaq && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={loadMoreFaqs}
                disabled={loadingMoreFaq}
                className="w-full text-sm font-semibold text-slate-400 hover:text-white py-2 rounded-xl transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {loadingMoreFaq ? 'Memuat...' : `Muat ${PAGE_SIZE} lagi ↓`}
              </button>
            </div>
          )}
        </div>

        {/* ── CONFIG ── */}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Konfigurasi Aktif</p>
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p className="text-xs font-semibold text-amber-400 mb-3">Koleksi yang diizinkan di pencarian Bandingkan</p>
          {allowedCollections && allowedCollections.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allowedCollections.map(col => (
                <span key={col.handle} className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  {col.title}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Semua koleksi diizinkan (tidak ada filter aktif)</p>
          )}
          <Link
            to="/perbandingan"
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-amber-500 hover:text-amber-300 transition-colors"
          >
            Ubah di halaman Perbandingan →
          </Link>
        </div>

        {/* ── REKOMENDASI CREATOR ── */}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4 mt-4">Buat Rekomendasi Baru</p>
        <RekomendasiCreator />

        {/* Footer */}
        <p className="text-center text-xs text-slate-700 mt-10">
          Halaman ini hanya bisa diakses oleh admin · Data dari Firebase Firestore
        </p>
      </div>
    </div>
  );
}

// ── REKOMENDASI CREATOR COMPONENT ────────────────────────────────────────────

const SHOPIFY_PRODUCT_SEARCH_QUERY = `#graphql
  query AdminProductSearch($query: String!) {
    products(first: 8, query: $query) {
      nodes {
        handle
        title
        featuredImage { url }
        variants(first: 1) {
          nodes { price { amount } }
        }
      }
    }
  }
`;

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function RekomendasiCreator() {
  const [rekTitle, setRekTitle] = useState('');
  const [rekTags, setRekTags] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [step, setStep] = useState(1); // 1=setup, 2=generated, 3=saved
  const [savedSlug, setSavedSlug] = useState('');
  const searchTimeout = useRef(null);

  const searchRef = useRef(null);

  async function searchProducts(q) {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin-product-search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || []);
      }
    } catch (_) {}
    setSearching(false);
  }

  function handleSearchInput(e) {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchProducts(val), 400);
  }

  function addProduct(p) {
    if (selectedProducts.find(s => s.handle === p.handle)) return;
    setSelectedProducts(prev => [...prev, {
      handle: p.handle,
      title: p.title,
      image: p.featuredImage?.url || '',
      price: p.variants?.nodes?.[0]?.price?.amount || null,
    }]);
    setSearchQuery('');
    setSearchResults([]);
  }

  function removeProduct(handle) {
    setSelectedProducts(prev => prev.filter(p => p.handle !== handle));
  }

  function moveProduct(index, dir) {
    const arr = [...selectedProducts];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setSelectedProducts(arr);
  }

  async function handleGenerate() {
    if (!rekTitle.trim()) { alert('Isi judul rekomendasi dulu.'); return; }
    if (selectedProducts.length < 2) { alert('Pilih minimal 2 produk.'); return; }
    setGenerating(true);
    setGeneratedContent(null);
    try {
      const res = await fetch('/api/generate-rekomendasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: rekTitle, products: selectedProducts }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { alert('Gagal generate: ' + (data.error || 'unknown error')); setGenerating(false); return; }
      setGeneratedContent(data.rekomendasi);
      setEditingContent(JSON.stringify(data.rekomendasi, null, 2));
      setStep(2);
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setGenerating(false);
  }

  async function handleSave() {
    let content = generatedContent;
    try { content = JSON.parse(editingContent); } catch (_) { alert('JSON tidak valid. Cek format JSON sebelum simpan.'); return; }

    const slug = slugify(rekTitle);
    if (!slug) { alert('Judul tidak valid untuk dijadikan URL.'); return; }

    setSaving(true);
    const tags = rekTags.split(',').map(t => t.trim()).filter(Boolean);
    const now = new Date().toISOString();

    const doc = {
      fields: {
        title: { stringValue: rekTitle },
        slug: { stringValue: slug },
        products: { stringValue: JSON.stringify(selectedProducts) },
        content: { stringValue: JSON.stringify(content) },
        tags: { stringValue: JSON.stringify(tags) },
        coverImage: { stringValue: selectedProducts[0]?.image || '' },
        productCount: { integerValue: selectedProducts.length.toString() },
        viewCount: { integerValue: '0' },
        createdAt: { stringValue: now },
      },
    };

    try {
      const res = await fetch(`${FIRESTORE_BASE}/rekomendasi/${slug}?key=${FIRESTORE_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (!res.ok) { alert('Gagal simpan: ' + await res.text()); setSaving(false); return; }
      setSavedSlug(slug);
      setStep(3);
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setSaving(false);
  }

  function handleReset() {
    setRekTitle(''); setRekTags(''); setSelectedProducts([]);
    setSearchQuery(''); setSearchResults([]);
    setGeneratedContent(null); setEditingContent('');
    setStep(1); setSavedSlug('');
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-10" style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)' }}>

      {/* Step indicator */}
      <div className="px-5 py-4 flex items-center gap-4" style={{ background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
        {[['1', 'Setup'], ['2', 'Preview & Edit'], ['3', 'Selesai']].map(([num, label]) => (
          <div key={num} className={`flex items-center gap-2 text-xs font-semibold ${step >= parseInt(num) ? 'text-indigo-300' : 'text-slate-600'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step >= parseInt(num) ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-600'}`}>{num}</span>
            <span className="hidden sm:inline">{label}</span>
            {num !== '3' && <span className="text-slate-700 hidden sm:inline">→</span>}
          </div>
        ))}
      </div>

      <div className="p-5 md:p-6">

        {/* ── STEP 1: SETUP ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Judul Rekomendasi</label>
              <input
                type="text"
                value={rekTitle}
                onChange={e => setRekTitle(e.target.value)}
                placeholder="Contoh: Kamera Terbaik untuk Vlogger 2025"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              {rekTitle && (
                <p className="text-[11px] text-slate-600 mt-1.5">URL: /rekomendasi/<span className="text-indigo-400">{slugify(rekTitle)}</span></p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Tags <span className="text-slate-600 normal-case font-normal">(pisahkan dengan koma)</span></label>
              <input
                type="text"
                value={rekTags}
                onChange={e => setRekTags(e.target.value)}
                placeholder="Mirrorless, Vlog, Pemula"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Product search */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Cari & Tambah Produk</label>
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  placeholder="Cari nama produk..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                {searching && (
                  <div className="absolute right-3 top-3">
                    <svg className="animate-spin w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0f172a' }}>
                  {searchResults.map(p => (
                    <button
                      key={p.handle}
                      onClick={() => addProduct(p)}
                      disabled={!!selectedProducts.find(s => s.handle === p.handle)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors disabled:opacity-40 text-left"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      {p.featuredImage?.url && (
                        <img src={p.featuredImage.url + '&width=48'} alt={p.title} className="w-8 h-8 object-contain rounded flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-300 flex-1 line-clamp-1">{p.title}</span>
                      <span className="text-xs text-indigo-400 flex-shrink-0">+ Tambah</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected products */}
            {selectedProducts.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Produk Dipilih ({selectedProducts.length})</label>
                <div className="space-y-2">
                  {selectedProducts.map((p, i) => (
                    <div key={p.handle} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-xs font-black text-slate-600 w-5 text-center">#{i + 1}</span>
                      {p.image && <img src={p.image + '&width=48'} alt={p.title} className="w-8 h-8 object-contain rounded flex-shrink-0" />}
                      <span className="text-sm text-slate-300 flex-1 line-clamp-1">{p.title}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => moveProduct(i, -1)} disabled={i === 0} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-white disabled:opacity-20 transition-colors">↑</button>
                        <button onClick={() => moveProduct(i, 1)} disabled={i === selectedProducts.length - 1} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-white disabled:opacity-20 transition-colors">↓</button>
                        <button onClick={() => removeProduct(p.handle)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-rose-400 transition-colors">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || selectedProducts.length < 2 || !rekTitle.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: generating ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.8)', color: 'white' }}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI sedang menulis rekomendasi...
                </span>
              ) : `Generate Rekomendasi dengan AI (${selectedProducts.length} produk)`}
            </button>
          </div>
        )}

        {/* ── STEP 2: PREVIEW & EDIT ── */}
        {step === 2 && generatedContent && (
          <div className="space-y-5">
            <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-xs font-bold text-emerald-400 mb-1">AI selesai menulis!</p>
              <p className="text-xs text-slate-400">Periksa hasilnya di bawah. Kamu bisa edit langsung di JSON editor, atau simpan langsung jika sudah oke.</p>
            </div>

            {/* Quick preview */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview Intro</p>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">{generatedContent.intro}</p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {generatedContent.products?.map((p, i) => (
                  <div key={p.handle} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-4">#{i + 1}</span>
                    <span className="text-xs font-semibold text-slate-300 flex-1">{selectedProducts.find(s => s.handle === p.handle)?.title || p.handle}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{p.verdict}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* JSON editor */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Edit Konten (JSON)</label>
              <textarea
                value={editingContent}
                onChange={e => setEditingContent(e.target.value)}
                rows={16}
                className="w-full rounded-xl px-4 py-3 text-xs text-slate-300 font-mono outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                ← Kembali
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {generating ? 'Generating...' : '↺ Generate Ulang'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: 'rgba(34,197,94,0.8)', color: 'white' }}
              >
                {saving ? 'Menyimpan...' : 'Simpan & Publikasikan →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: SAVED ── */}
        {step === 3 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-bold text-white">Rekomendasi berhasil dipublikasikan!</p>
            <p className="text-sm text-slate-500">{rekTitle}</p>
            <div className="flex gap-3 justify-center">
              <a
                href={`/rekomendasi/${savedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'rgba(99,102,241,0.8)' }}
              >
                Lihat Halaman →
              </a>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Buat Rekomendasi Baru
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

