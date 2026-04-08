import { json } from '@shopify/remix-oxygen';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useRef, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

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

export async function loader() {
  let popular = [];
  let all = [];

  try {
    // Fetch all comparisons (max 100), sorted by generatedAt desc
    const res = await fetch(
      `${FIRESTORE_BASE}/comparisons?pageSize=100&key=${FIRESTORE_KEY}`
    );
    if (res.ok) {
      const data = await res.json();
      const docs = (data.documents || []).map(doc => {
        const f = doc.fields || {};
        return {
          slug: doc.name.split('/').pop(),
          titleA: f.titleA?.stringValue || '',
          titleB: f.titleB?.stringValue || '',
          imageA: f.imageA?.stringValue || '',
          imageB: f.imageB?.stringValue || '',
          viewCount: parseInt(f.viewCount?.integerValue || 0),
          generatedAt: f.generatedAt?.stringValue || '',
        };
      }).filter(c => c.titleA && c.titleB);

      // Popular = top 6 by viewCount
      popular = [...docs].sort((a, b) => b.viewCount - a.viewCount).slice(0, 6);
      // All = sorted by newest first
      all = [...docs].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    }
  } catch (_) {}

  return json({ popular, all });
}

// Product search input component
function ProductSearchInput({ label, selected, onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append('q', val);
        fd.append('limit', '6');
        fd.append('type', 'PRODUCT');
        const res = await fetch('/api/predictive-search', { method: 'POST', body: fd });
        const data = await res.json();
        const products = data.searchResults?.results?.find(r => r.type === 'products')?.items || [];
        setResults(products);
        setOpen(true);
      } catch (_) {}
      setLoading(false);
    }, 300);
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
      {open && results.length > 0 && !selected && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {results.map(product => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              {product.image?.url && (
                <img src={product.image.url} alt={product.title} className="w-10 h-10 object-contain rounded-lg bg-white/10 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white line-clamp-1">{product.title}</p>
                <p className="text-xs text-slate-400">Rp {parseFloat(product.price?.amount || 0).toLocaleString('id-ID')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PerbandinganIndex() {
  const { popular, all } = useLoaderData();
  const navigate = useNavigate();
  const [productA, setProductA] = useState(null);
  const [productB, setProductB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        `https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents/comparisons/${slug}?key=AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU`
      );
      if (firestoreRes.ok) {
        const doc = await firestoreRes.json();
        if (doc.fields?.article) {
          navigate(`/perbandingan/${slug}`);
          return;
        }
      }
    } catch (_) {}

    // Generate new comparison
    try {
      const res = await fetch('/api/generate-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productA: {
            title: productA.title,
            handle: productA.handle,
            vendor: productA.vendor,
            productType: productA.productType,
            description: productA.description,
            specs: productA.specs,
            garansi: productA.garansi,
          },
          productB: {
            title: productB.title,
            handle: productB.handle,
            vendor: productB.vendor,
            productType: productB.productType,
            description: productB.description,
            specs: productB.specs,
            garansi: productB.garansi,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.comparison) throw new Error(data.error || 'Gagal');

      // Save to Firestore
      try {
        const db = getDb();
        await setDoc(doc(db, 'comparisons', slug), {
          slug,
          titleA: productA.title,
          titleB: productB.title,
          handleA: productA.handle,
          handleB: productB.handle,
          imageA: productA.image?.url || '',
          imageB: productB.image?.url || '',
          article: JSON.stringify(data.comparison),
          generatedAt: new Date().toISOString(),
          viewCount: 0,
        });
      } catch (e) {
        console.error('Firestore save error:', e);
      }

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
      setError('Gagal membuat perbandingan. Coba lagi.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.2) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'auto, auto, 40px 40px',
        }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600 opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-2xl pointer-events-none" />

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
              placeholder="Cari kamera, drone..."
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
              placeholder="Cari kamera, drone..."
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
                  Membuat Perbandingan...
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

      {/* All comparisons */}
      {all.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Semua Perbandingan
              <span className="ml-2 bg-white/10 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{all.length}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {all.map(item => (
              <a
                key={item.slug}
                href={`/perbandingan/${item.slug}`}
                className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl px-4 py-3 transition-all"
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.imageA
                    ? <img src={item.imageA} alt={item.titleA} className="w-10 h-10 object-contain rounded-lg bg-white/10" />
                    : <div className="w-10 h-10 rounded-lg bg-white/10" />}
                  <span className="text-[10px] font-black text-slate-600">VS</span>
                  {item.imageB
                    ? <img src={item.imageB} alt={item.titleB} className="w-10 h-10 object-contain rounded-lg bg-white/10" />
                    : <div className="w-10 h-10 rounded-lg bg-white/10" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors line-clamp-1">
                    {item.titleA} <span className="text-slate-600 font-normal">vs</span> {item.titleB}
                  </p>
                </div>
                {item.viewCount > 0 && (
                  <p className="text-xs text-slate-600 flex-shrink-0">{item.viewCount}x dilihat</p>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
