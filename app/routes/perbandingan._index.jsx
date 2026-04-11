import { json } from '@shopify/remix-oxygen';
import { useLoaderData, useNavigate, useLocation } from '@remix-run/react';
import { useState, useRef, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, getDocs, collection, query, orderBy, limit, startAfter } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU",
  authDomain: "galaxypwa.firebaseapp.com",
  projectId: "galaxypwa",
  storageBucket: "galaxypwa.firebasestorage.app",
  messagingSenderId: "1035942613391",
  appId: "1:1035942613391:web:468294eff27a18ac00bbfa",
};

function getDb() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export const meta = () => [
  { title: 'Bandingkan Produk | Galaxy Camera' },
  { name: 'description', content: 'Bandingkan kamera, drone, dan aksesoris fotografi secara lengkap dengan analisis AI. Temukan produk terbaik untuk kebutuhanmu.' },
];

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents`;

// ↑ kept for cache-check fetch (single document lookup)

export async function loader({ context }) {
  const { session } = context;
  const customerAccessToken = await session.get('customerAccessToken');
  const token = customerAccessToken?.accessToken || '';

  try {
    const [{ collections }, custEmail, admgalaxy, configRes] = await Promise.all([
      context.storefront.query(COLLECTIONS_QUERY, { variables: { first: 250 } }),
      context.storefront.query(CUSTOMER_EMAIL_QUERY, { variables: { customertoken: token } }),
      context.storefront.query(ADMIN_QUERY, { variables: { type: 'admin_galaxy', first: 20 } }),
      fetch(`${FIRESTORE_BASE}/perbandingan_config/settings?key=${FIRESTORE_KEY}`).catch(() => null),
    ]);

    const isAdmin = !!(admgalaxy?.metaobjects?.edges?.find(
      a => a?.node?.fields[0]?.value === custEmail?.customer?.email && custEmail?.customer?.email
    ));

    let allowedCollections = null; // null = not configured yet (allow all)
    if (configRes?.ok) {
      const configData = await configRes.json().catch(() => null);
      const raw = configData?.fields?.allowedCollections?.stringValue;
      if (raw) allowedCollections = JSON.parse(raw);
    }

    return json({ collections: collections.nodes, isAdmin, allowedCollections });
  } catch (_) {
    return json({ collections: [], isAdmin: false, allowedCollections: null });
  }
}

const COLLECTIONS_QUERY = `#graphql
  query MainCollections($first: Int!) {
    collections(first: $first, sortKey: TITLE) {
      nodes { handle title }
    }
  }
`;
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


// Product search input component
// allowedCollections: string[] of handles admin configured, or null = not set (open search)
function ProductSearchInput({ label, selected, onSelect, placeholder, allowedCollections }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);

  const hasCollectionFilter = allowedCollections && allowedCollections.length > 0;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchResults(val, collectionHandle) {
    setLoading(true);
    try {
      let products = [];
      if (hasCollectionFilter && collectionHandle) {
        // Search within specific collection
        const fd = new FormData();
        fd.append('q', val);
        fd.append('collection', collectionHandle);
        const res = await fetch('/api/collection-search', { method: 'POST', body: fd });
        const data = await res.json();
        products = (data.products || []).map(p => ({ ...p, image: p.image }));
      } else if (hasCollectionFilter && !collectionHandle) {
        // Search across ALL allowed collections in parallel
        const fetches = allowedCollections.map(col => {
          const fd = new FormData();
          fd.append('q', val);
          fd.append('collection', col.handle);
          return fetch('/api/collection-search', { method: 'POST', body: fd })
            .then(r => r.json())
            .then(d => d.products || [])
            .catch(() => []);
        });
        const arrays = await Promise.all(fetches);
        const seen = new Set();
        products = arrays.flat().filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }).slice(0, 10);
      } else {
        // No collection filter configured — use predictive search
        const fd = new FormData();
        fd.append('q', val);
        fd.append('limit', '20');
        fd.append('type', 'PRODUCT');
        const res = await fetch('/api/predictive-search', { method: 'POST', body: fd });
        const data = await res.json();
        products = data.searchResults?.results?.find(r => r.type === 'products')?.items || [];
      }
      setResults(products);
      setOpen(true);
    } catch (_) {}
    setLoading(false);
  }

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val, ''), 300);
  }

function handleSelect(product) {
    onSelect(product);
    setQuery(product.title);
    setOpen(false);
    setResults([]);
  }

  function handleClear() {
    onSelect(null);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>


      {selected ? (
        <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-3">
          {selected.image?.url && (
            <img src={selected.image.url} alt={selected.title} className="w-14 h-14 object-contain rounded-xl bg-white/10 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white leading-snug line-clamp-2">{selected.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Rp {parseFloat(selected.price?.amount || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <button onClick={handleClear} className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInput}
            placeholder={placeholder}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Dropdown results */}
      {open && !selected && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-xs text-slate-500 px-4 py-3">Produk tidak ditemukan.</p>
          ) : (
            results.map(product => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
              >
                {product.image?.url && (
                  <img src={product.image.url} alt={product.title} className="w-10 h-10 object-contain rounded-lg bg-white/10 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white line-clamp-1">{product.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">Rp {parseFloat(product.price?.amount || 0).toLocaleString('id-ID')}</p>
                    {product.productType && (
                      <span className="text-[10px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded-full">{product.productType}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PerbandinganIndex() {
  const { collections, isAdmin, allowedCollections: initialAllowed } = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const autoState = location.state || {};

  // Admin: allowed collections config state
  const [allowedCollections, setAllowedCollections] = useState(initialAllowed); // null = not configured
  const [adminChecked, setAdminChecked] = useState(
    () => new Set(initialAllowed ? initialAllowed.map(c => c.handle) : [])
  );
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [productA, setProductA] = useState(null);
  const [productB, setProductB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popular, setPopular] = useState([]);
  const [all, setAll] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const lastDocRef = useRef(null);
  const autoCompareRef = useRef(false);

  // Pre-fill products from navigation state (coming from product page "Bandingkan" button)
  useEffect(() => {
    if (autoState.autoCompare && autoState.autoProductA && autoState.autoProductB) {
      setProductA(autoState.autoProductA);
      setProductB(autoState.autoProductB);
      autoCompareRef.current = true;
    }
  }, []);

  // Auto-trigger comparison once both products are set from navigation state
  useEffect(() => {
    if (autoCompareRef.current && productA && productB) {
      autoCompareRef.current = false;
      handleCompare();
    }
  }, [productA, productB]);

  const PAGE_SIZE = 12;

  function mapDoc(d) {
    const data = d.data();
    return {
      slug: d.id,
      titleA: data.titleA || '',
      titleB: data.titleB || '',
      imageA: data.imageA || '',
      imageB: data.imageB || '',
      viewCount: data.viewCount || 0,
      generatedAt: data.generatedAt || '',
    };
  }

  useEffect(() => {
    async function fetchList() {
      try {
        const db = getDb();

        // All: newest first, paginated
        const allSnap = await getDocs(
          query(collection(db, 'comparisons'), orderBy('generatedAt', 'desc'), limit(PAGE_SIZE))
        );

        const firstPage = allSnap.docs.map(mapDoc).filter(d => d.titleA && d.titleB);
        lastDocRef.current = allSnap.docs[allSnap.docs.length - 1] || null;
        setAll(firstPage);
        // Popular: top 6 by viewCount, no extra query or index needed
        setPopular([...firstPage].sort((a, b) => b.viewCount - a.viewCount).slice(0, 6));
        setHasMore(allSnap.docs.length === PAGE_SIZE);
      } catch (e) {
        setListError(e.message);
      } finally {
        setListLoading(false);
      }
    }
    fetchList();
  }, []);

  async function loadMore() {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const db = getDb();
      const snap = await getDocs(
        query(collection(db, 'comparisons'), orderBy('generatedAt', 'desc'), limit(PAGE_SIZE), startAfter(lastDocRef.current))
      );
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setAll(prev => [...prev, ...snap.docs.map(mapDoc).filter(d => d.titleA && d.titleB)]);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (_) {}
    setLoadingMore(false);
  }

  function buildSlug(handleA, handleB) {
    return [handleA, handleB].sort().join('-vs-');
  }

  async function handleCompare() {
    if (!productA || !productB) { setError('Pilih dua produk terlebih dahulu.'); return; }
    if (productA.id === productB.id) { setError('Pilih dua produk yang berbeda.'); return; }
    setError('');
    setLoading(true);

    const slug = buildSlug(productA.handle, productB.handle);

    // Check Firestore cache first
    try {
      const firestoreRes = await fetch(
        `${FIRESTORE_BASE}/comparisons/${slug}?key=${FIRESTORE_KEY}`
      );
      if (firestoreRes.ok) {
        const cachedDoc = await firestoreRes.json();
        const articleRaw = cachedDoc.fields?.article?.stringValue;
        if (articleRaw) {
          // Backfill missing title/image fields on the cached doc (from old bug)
          if (!cachedDoc.fields?.titleA?.stringValue) {
            fetch(
              `${FIRESTORE_BASE}/comparisons/${slug}?updateMask.fieldPaths=titleA&updateMask.fieldPaths=titleB&updateMask.fieldPaths=handleA&updateMask.fieldPaths=handleB&updateMask.fieldPaths=imageA&updateMask.fieldPaths=imageB&key=${FIRESTORE_KEY}`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: {
                    titleA:  { stringValue: productA.title },
                    titleB:  { stringValue: productB.title },
                    handleA: { stringValue: productA.handle },
                    handleB: { stringValue: productB.handle },
                    imageA:  { stringValue: productA.image?.url || '' },
                    imageB:  { stringValue: productB.image?.url || '' },
                  },
                }),
              }
            ).catch(() => {});
          }

          navigate(`/perbandingan/${slug}`, {
            state: {
              comparison: JSON.parse(articleRaw),
              titleA: productA.title,
              titleB: productB.title,
              handleA: productA.handle,
              handleB: productB.handle,
              imageA: productA.image?.url || '',
              imageB: productB.image?.url || '',
            },
          });
          return;
        }
      }
    } catch (_) {}

    // Generate new comparison (with 1 auto-retry)
    const payload = {
      productA: {
        title: productA.title, handle: productA.handle, vendor: productA.vendor,
        productType: productA.productType, description: productA.description,
        specs: productA.specs, garansi: productA.garansi,
      },
      productB: {
        title: productB.title, handle: productB.handle, vendor: productB.vendor,
        productType: productB.productType, description: productB.description,
        specs: productB.specs, garansi: productB.garansi,
      },
    };

    const fetchWithRetry = async (attempt = 1) => {
      const res = await fetch('/api/generate-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if ((!res.ok || !data.comparison) && attempt < 2) {
        await new Promise(r => setTimeout(r, 1500));
        return fetchWithRetry(2);
      }
      return { res, data };
    };

    try {
      const { res, data } = await fetchWithRetry();
      if (!res.ok || !data.comparison) throw new Error(data.error || 'Gagal');

      // Save to Firestore via REST API (more reliable than client SDK with security rules)
      try {
        await fetch(`${FIRESTORE_BASE}/comparisons/${slug}?key=${FIRESTORE_KEY}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              slug:        { stringValue: slug },
              titleA:      { stringValue: productA.title },
              titleB:      { stringValue: productB.title },
              handleA:     { stringValue: productA.handle },
              handleB:     { stringValue: productB.handle },
              imageA:      { stringValue: productA.image?.url || '' },
              imageB:      { stringValue: productB.image?.url || '' },
              article:     { stringValue: JSON.stringify(data.comparison) },
              generatedAt: { stringValue: new Date().toISOString() },
              viewCount:   { integerValue: '0' },
            },
          }),
        });
      } catch (_) {}

      // Navigate and pass comparison data as state so result page works
      // even if Firestore isn't set up yet
      navigate(`/perbandingan/${slug}`, {
        state: {
          comparison: data.comparison,
          titleA: productA.title,
          titleB: productB.title,
          handleA: productA.handle,
          handleB: productB.handle,
          imageA: productA.image?.url || '',
          imageB: productB.image?.url || '',
        },
      });
    } catch (e) {
      setError('AI membutuhkan waktu lebih lama dari biasa. Silakan coba lagi.');
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSavingConfig(true);
    const selected = collections.filter(c => adminChecked.has(c.handle));
    try {
      const res = await fetch(
        `${FIRESTORE_BASE}/perbandingan_config/settings?updateMask.fieldPaths=allowedCollections&key=${FIRESTORE_KEY}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: { allowedCollections: { stringValue: JSON.stringify(selected) } },
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        console.error('saveConfig failed:', errText);
        alert('Gagal menyimpan pengaturan: ' + errText);
        setSavingConfig(false);
        return;
      }
      setAllowedCollections(selected.length > 0 ? selected : null);
      setConfigSaved(true);
    } catch (e) {
      console.error('saveConfig error:', e);
      alert('Gagal menyimpan pengaturan: ' + e.message);
    }
    setSavingConfig(false);
  }

  async function deleteComparison(slug) {
    if (!confirm('Hapus perbandingan ini?')) return;
    await fetch(`${FIRESTORE_BASE}/comparisons/${slug}?key=${FIRESTORE_KEY}`, { method: 'DELETE' });
    setAll(prev => prev.filter(item => item.slug !== slug));
    setPopular(prev => prev.filter(item => item.slug !== slug));
  }

  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0f172a';
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#0f172a' }}>
      {/* Hero */}
      <div
        className="relative"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.2) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'auto, auto, 40px 40px',
        }}
      >
        {/* Decorative blobs — clipped separately so they don't affect dropdown */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600 opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-14 pb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Perbandingan Produk</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Bandingkan Produk</h1>
          <p className="text-slate-400 text-base max-w-lg mb-10">Pilih dua produk dan AI kami akan membuat analisis perbandingan lengkap untuk membantumu memilih.</p>

          {/* Search inputs */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ProductSearchInput
              label="Produk Pertama"
              selected={productA}
              onSelect={setProductA}
              placeholder="Cari produk..."
              allowedCollections={allowedCollections}
            />

            {/* VS divider */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 mt-6 z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-xs font-black text-white">VS</span>
              </div>
            </div>

            <ProductSearchInput
              label="Produk Kedua"
              selected={productB}
              onSelect={setProductB}
              placeholder="Cari produk..."
              allowedCollections={allowedCollections}
            />
          </div>

          {error && <p className="text-rose-400 text-sm mb-4 text-center">{error}</p>}

          <div className="flex justify-center">
            <button
              onClick={handleCompare}
              disabled={loading || !productA || !productB}
              className="inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-2xl transition-colors shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  AI sedang riset & menulis... (30-60 detik)
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.24a1 1 0 0 0 0 1.962l1.192.24a1 1 0 0 1 .785.785l.24 1.192a1 1 0 0 0 1.962 0l.24-1.192a1 1 0 0 1 .784-.785l1.192-.24a1 1 0 0 0 0-1.962l-1.192-.24a1 1 0 0 1-.785-.784l-.24-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684Z" />
                  </svg>
                  Bandingkan Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Popular comparisons */}
      {popular.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">Perbandingan Populer</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {popular.map(item => (
              <a
                key={item.slug}
                href={`/perbandingan/${item.slug}`}
                className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {item.imageA && <img src={item.imageA} alt={item.titleA} className="w-9 h-9 object-contain rounded-lg bg-white/10 flex-shrink-0" />}
                  <span className="text-[10px] font-black text-slate-500">VS</span>
                  {item.imageB && <img src={item.imageB} alt={item.titleB} className="w-9 h-9 object-contain rounded-lg bg-white/10 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-300 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                      {item.titleA} vs {item.titleB}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* All comparisons — always visible to show loading/error state */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Semua Perbandingan
            {!listLoading && <span className="ml-2 bg-white/10 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{all.length}</span>}
          </p>
        </div>

        {/* Search filter */}
        {!listLoading && all.length > 0 && (
          <div className="relative mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari perbandingan..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {listLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Memuat daftar...
          </div>
        )}

        {!listLoading && listError && (
          <p className="text-xs text-rose-400 font-mono bg-rose-900/20 px-3 py-2 rounded-lg">{listError}</p>
        )}

        {!listLoading && !listError && all.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada perbandingan yang tersimpan.</p>
        )}

        {!listLoading && all.length > 0 && (
          <>
            <div className="flex flex-col gap-2">
              {(searchQuery.trim()
                ? all.filter(item => {
                    const q = searchQuery.toLowerCase();
                    return item.titleA.toLowerCase().includes(q) || item.titleB.toLowerCase().includes(q);
                  })
                : all
              ).map(item => (
                <div key={item.slug} className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl px-4 py-3 transition-all">
                  <a href={`/perbandingan/${item.slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.imageA ? <img src={item.imageA} alt={item.titleA} className="w-10 h-10 object-contain rounded-lg bg-white/10" /> : <div className="w-10 h-10 rounded-lg bg-white/10" />}
                      <span className="text-[10px] font-black text-slate-600">VS</span>
                      {item.imageB ? <img src={item.imageB} alt={item.titleB} className="w-10 h-10 object-contain rounded-lg bg-white/10" /> : <div className="w-10 h-10 rounded-lg bg-white/10" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors line-clamp-1">
                        {item.titleA} <span className="text-slate-600 font-normal">vs</span> {item.titleB}
                      </p>
                    </div>
                    {item.viewCount > 0 && <p className="text-xs text-slate-600 flex-shrink-0">{item.viewCount}x dilihat</p>}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </a>
                  {/* Admin delete button */}
                  {isAdmin && (
                    <button
                      onClick={() => deleteComparison(item.slug)}
                      className="flex-shrink-0 w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500/30 flex items-center justify-center transition-colors"
                      title="Hapus perbandingan"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-rose-400">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-xl transition-all disabled:opacity-40"
                >
                  {loadingMore ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Memuat...
                    </>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── ADMIN PANEL ── */}
      {isAdmin && (
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex items-center gap-2 mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-400">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-bold text-amber-400">Panel Admin</p>
            </div>

            {/* Collection filter config */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Koleksi yang bisa dicari di Bandingkan Produk
            </p>
            <p className="text-xs text-slate-500 mb-4">Centang koleksi yang boleh muncul di kotak pencarian. Jika tidak ada yang dicentang, semua produk bisa dicari.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
              {collections.map(col => (
                <label key={col.handle} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={adminChecked.has(col.handle)}
                    onChange={() => {
                      setAdminChecked(prev => {
                        const next = new Set(prev);
                        next.has(col.handle) ? next.delete(col.handle) : next.add(col.handle);
                        return next;
                      });
                      setConfigSaved(false);
                    }}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{col.title}</span>
                </label>
              ))}
            </div>

            <button
              onClick={saveConfig}
              disabled={savingConfig}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              {savingConfig ? 'Menyimpan...' : configSaved ? '✓ Tersimpan' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
