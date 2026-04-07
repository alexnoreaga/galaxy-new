import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU",
  authDomain: "galaxypwa.firebaseapp.com",
  projectId: "galaxypwa",
  storageBucket: "galaxypwa.firebasestorage.app",
  messagingSenderId: "1035942613391",
  appId: "1:1035942613391:web:468294eff27a18ac00bbfa",
};

function getFirestoreDb() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

const LOADING_MESSAGES = [
  'Sedang membuka FAQ...',
  'Menyusun pertanyaan umum...',
  'Memeriksa informasi produk...',
  'Hampir selesai...',
];

function SkeletonCard() {
  return (
    <div className="border border-gray-100 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
  );
}

function FAQItem({ faq, index, isAdmin, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(faq.question);
  const [editAnswer, setEditAnswer] = useState(faq.answer);

  function handleSave() {
    onEdit(index, { question: editQuestion, answer: editAnswer });
    setEditing(false);
  }

  if (editing && isAdmin) {
    return (
      <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
        <label className="block text-xs font-semibold text-gray-500 mb-1">Pertanyaan</label>
        <input
          value={editQuestion}
          onChange={e => setEditQuestion(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="block text-xs font-semibold text-gray-500 mb-1">Jawaban</label>
        <textarea
          value={editAnswer}
          onChange={e => setEditAnswer(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Simpan
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800 leading-snug">{faq.question}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && (
            <>
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); setEditing(true); }}
                onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), setEditing(true))}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                </svg>
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); onDelete(index); }}
                onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), onDelete(index))}
                className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                title="Hapus"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C9.327 4.025 10.163 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                </svg>
              </span>
            </>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export function PertanyaanUmum({ product, isAdmin, initialFaqs }) {
  const productId = product?.id?.split('/').pop();
  const docId = `faq_${productId}`;

  const [status, setStatus] = useState(initialFaqs?.length > 0 ? 'loaded' : 'idle');
  const [faqs, setFaqs] = useState(initialFaqs || []);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [hasChecked, setHasChecked] = useState(!!initialFaqs);

  // Check Firestore cache on mount only if server didn't provide initialFaqs
  useEffect(() => {
    if (initialFaqs?.length > 0 || !productId) {
      setHasChecked(true);
      return;
    }

    async function checkCache() {
      try {
        const db = getFirestoreDb();
        const ref = doc(db, 'product_faqs', docId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setFaqs(snap.data().faqs || []);
          setStatus('loaded');
        }
      } catch (e) {
        // Silently fail — user can still generate
      } finally {
        setHasChecked(true);
      }
    }

    checkCache();
  }, [productId]);

  // Cycle loading messages
  useEffect(() => {
    if (status !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [status]);

  async function handleGenerate() {
    setStatus('loading');
    setLoadingMsgIdx(0);

    try {
      const res = await fetch('/api/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: product.title,
          productDescription: product.description,
          productVendor: product.vendor,
          productType: product.productType,
          metafields: {
            garansi: product.metafields?.[0]?.value,
            bonus: product.metafields?.[1]?.value,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.faqs) throw new Error(data.error || 'Gagal');

      // Save to Firestore (silently — don't let this block showing results)
      try {
        const db = getFirestoreDb();
        const ref = doc(db, 'product_faqs', docId);
        await setDoc(ref, {
          faqs: data.faqs,
          productTitle: product.title,
          generatedAt: new Date().toISOString(),
        });
      } catch (_) {}

      setFaqs(data.faqs);
      setStatus('loaded');
    } catch (e) {
      setStatus('error');
    }
  }

  async function handleRegenerate() {
    try {
      const db = getFirestoreDb();
      await deleteDoc(doc(db, 'product_faqs', docId));
    } catch (_) {}
    setFaqs([]);
    setStatus('loading');
    setLoadingMsgIdx(0);
    handleGenerate();
  }

  async function handleEdit(index, updated) {
    const newFaqs = faqs.map((f, i) => (i === index ? updated : f));
    setFaqs(newFaqs);
    try {
      const db = getFirestoreDb();
      await setDoc(doc(db, 'product_faqs', docId), {
        faqs: newFaqs,
        productTitle: product.title,
        generatedAt: new Date().toISOString(),
      });
    } catch (_) {}
  }

  async function handleDelete(index) {
    const newFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(newFaqs);
    try {
      const db = getFirestoreDb();
      await setDoc(doc(db, 'product_faqs', docId), {
        faqs: newFaqs,
        productTitle: product.title,
        generatedAt: new Date().toISOString(),
      });
    } catch (_) {}
  }

  if (!hasChecked) return null;

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Pertanyaan Umum</h2>
          <p className="text-xs text-gray-400 mt-0.5">Pertanyaan yang sering ditanyakan tentang produk ini</p>
        </div>
        {isAdmin && status === 'loaded' && faqs.length > 0 && (
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
            </svg>
            Regenerate
          </button>
        )}
      </div>

      {/* States */}
      {status === 'idle' && (
        <div className="relative">
          {/* Blurred fake FAQ rows */}
          <div className="flex flex-col gap-2.5 select-none pointer-events-none" aria-hidden="true">
            {[
              { q: 'Apakah produk ini sudah termasuk garansi resmi?', a: 'Ya, produk ini dilengkapi dengan garansi resmi dari distributor. Klik lihat pertanyaan untuk detail selengkapnya.' },
              { q: 'Berapa lama masa garansi yang diberikan?', a: 'Masa garansi produk ini adalah 1 tahun untuk kerusakan pabrik.' },
              { q: 'Apakah tersedia bonus aksesori bawaan?', a: 'Produk ini dilengkapi dengan berbagai aksesori bonus yang bermanfaat.' },
              { q: 'Bagaimana cara klaim garansi jika ada kerusakan?', a: 'Proses klaim garansi dapat dilakukan melalui toko kami dengan membawa nota pembelian.' },
              { q: 'Apakah harga sudah termasuk ongkos kirim?', a: 'Ongkos kirim dihitung terpisah tergantung lokasi pengiriman.' },
            ].map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden" style={{ filter: 'blur(4px)' }}>
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <span className="text-sm font-semibold text-gray-800">{item.q}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Overlay with CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white via-white/80 to-transparent rounded-2xl">
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
              </svg>
              Lihat Pertanyaan Umum
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div>
          <div className="flex items-center gap-2.5 mb-4 px-1">
            <svg className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm text-gray-500 transition-all">{LOADING_MESSAGES[loadingMsgIdx]}</span>
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {status === 'loaded' && faqs.length > 0 && (
        <div>
          <div className="flex flex-col gap-2.5">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                index={i}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <p className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
            FAQ ini dibuat otomatis oleh AI berdasarkan informasi produk. Untuk informasi lebih lanjut, silakan{' '}
            <a href="https://wa.me/6282111311131" className="text-blue-500 hover:underline">hubungi toko kami</a>.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-8 border border-dashed border-rose-200 rounded-2xl bg-rose-50">
          <p className="text-sm font-semibold text-rose-700 mb-1">Gagal membuka FAQ</p>
          <p className="text-xs text-rose-400 mb-4">Terjadi kesalahan, silakan coba lagi</p>
          <button
            onClick={handleGenerate}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}
