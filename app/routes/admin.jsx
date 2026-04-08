import { json, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { useState } from 'react';

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

        {/* Footer */}
        <p className="text-center text-xs text-slate-700 mt-10">
          Halaman ini hanya bisa diakses oleh admin · Data dari Firebase Firestore
        </p>
      </div>
    </div>
  );
}
