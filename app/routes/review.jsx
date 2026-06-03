import { json } from '@shopify/remix-oxygen';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
const STORAGE_BUCKET = 'galaxypwa.firebasestorage.app';
const STORAGE_API_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';

export async function loader({ request, context }) {
  const url = new URL(request.url);
  const tokenId = url.searchParams.get('token');
  const key = context.env?.FIRESTORE_API_KEY;

  if (!tokenId) return json({ status: 'invalid' });

  try {
    const res = await fetch(`${FIRESTORE_BASE}/review_tokens/${tokenId}?key=${key}`);
    if (!res.ok) return json({ status: 'invalid' });

    const doc = await res.json();
    const f = doc.fields || {};

    if (f.used?.booleanValue === true) return json({ status: 'used' });
    if (f.expiresAt?.stringValue && new Date(f.expiresAt.stringValue) < new Date()) return json({ status: 'expired' });

    return json({
      status: 'valid',
      tokenId,
      productHandle: f.productHandle?.stringValue || '',
      productTitle: f.productTitle?.stringValue || '',
      googleReviewLink: f.googleReviewLink?.stringValue || '',
      branch: f.branch?.stringValue || '',
    });
  } catch (_) {
    return json({ status: 'invalid' });
  }
}

export async function action({ request, context }) {
  const key = context.env?.FIRESTORE_API_KEY;
  const fd = await request.formData();

  const tokenId = fd.get('tokenId');
  const productHandle = fd.get('productHandle');
  const productTitle = fd.get('productTitle');
  const customerName = fd.get('customerName')?.trim();
  const rating = parseInt(fd.get('rating') || '5');
  const reviewText = fd.get('reviewText')?.trim();
  const googleReviewLink = fd.get('googleReviewLink');
  const branch = fd.get('branch');
  const photoUrls = JSON.parse(fd.get('photoUrls') || '[]').filter(Boolean);

  if (!customerName || !reviewText || reviewText.length < 10) {
    return json({ error: 'Nama dan ulasan wajib diisi (minimal 10 karakter).' });
  }

  try {
    const tokenRes = await fetch(`${FIRESTORE_BASE}/review_tokens/${tokenId}?key=${key}`);
    if (!tokenRes.ok) return json({ error: 'Link tidak valid.' });
    const tokenDoc = await tokenRes.json();
    if (tokenDoc.fields?.used?.booleanValue === true) return json({ error: 'Link sudah digunakan.' });

    const reviewId = crypto.randomUUID();
    await fetch(`${FIRESTORE_BASE}/reviews?documentId=${reviewId}&key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          productHandle: { stringValue: productHandle },
          productTitle: { stringValue: productTitle },
          customerName: { stringValue: customerName },
          rating: { integerValue: String(rating) },
          reviewText: { stringValue: reviewText },
          verifiedPurchase: { booleanValue: false },
          source: { stringValue: 'toko' },
          branch: { stringValue: branch },
          status: { stringValue: 'pending' },
          photoUrls: { arrayValue: { values: photoUrls.map(u => ({ stringValue: u })) } },
          createdAt: { stringValue: new Date().toISOString() },
        },
      }),
    });

    await fetch(
      `${FIRESTORE_BASE}/review_tokens/${tokenId}?key=${key}&updateMask.fieldPaths=used&updateMask.fieldPaths=usedAt&updateMask.fieldPaths=reviewHasPhoto`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            used: { booleanValue: true },
            usedAt: { stringValue: new Date().toISOString() },
            // Drives the higher Google bonus for expensive products (bonus report).
            reviewHasPhoto: { booleanValue: photoUrls.length > 0 },
          },
        }),
      }
    );

    return json({ success: true, reviewText, googleReviewLink });
  } catch (_) {
    return json({ error: 'Terjadi kesalahan. Coba lagi.' });
  }
}

// ── Client-side photo helpers ────────────────────────────────────────────────

async function compressImage(file, maxWidth = 800, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          const ratio = Math.min(maxWidth / img.width, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(file); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
        } catch (_) { resolve(file); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(file) {
  const compressed = await compressImage(file);
  const filename = `reviews/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const encoded = encodeURIComponent(filename);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?name=${encoded}&key=${STORAGE_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: compressed, signal: controller.signal }
    );
  } finally { clearTimeout(timer); }
  if (!res.ok) throw new Error('Upload gagal');
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encoded}?alt=media`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          className="text-3xl transition-transform active:scale-90"
          style={{ color: s <= (hovered || value) ? '#f59e0b' : '#d1d5db' }}>
          ★
        </button>
      ))}
    </div>
  );
}

function StatusPage({ icon, title, desc }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-xs">
        <div className="text-5xl mb-4">{icon}</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ReviewPage() {
  const data = useLoaderData();
  const fetcher = useFetcher();

  const [rating, setRating] = useState(5);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Persist success data so loader revalidation can't replace it
  const [successData, setSuccessData] = useState(null);

  const isSubmitting = fetcher.state !== 'idle' || uploading;
  const result = fetcher.data;

  useEffect(() => {
    if (result?.success) {
      setSuccessData(result);
      navigator.clipboard.writeText(result.reviewText).catch(() => {});
      setCopied(true);
    }
    if (result?.error) setError(result.error);
  }, [result]);

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const toAdd = files.slice(0, 3 - photoFiles.length);
    for (const file of toAdd) {
      if (file.size > 10 * 1024 * 1024) { setError('Foto maksimal 10MB per gambar.'); return; }
    }
    const previews = await Promise.all(toAdd.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    })));
    const valid = toAdd.map((f, i) => ({ file: f, preview: previews[i] })).filter(x => x.preview);
    setPhotoFiles(prev => [...prev, ...valid.map(x => x.file)]);
    setPhotoPreviews(prev => [...prev, ...valid.map(x => x.preview)]);
    setError('');
  }

  function removePhoto(idx) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const customerName = form.customerName.value.trim();
    const reviewText = form.reviewText.value.trim();
    if (!customerName || !reviewText) { setError('Nama dan ulasan wajib diisi.'); return; }
    if (reviewText.length < 10) { setError('Ulasan terlalu singkat.'); return; }

    setError('');
    let photoUrls = [];
    if (photoFiles.length > 0) {
      setUploading(true);
      try {
        photoUrls = await Promise.all(photoFiles.map(f => uploadPhoto(f)));
      } catch (_) {
        setError('Gagal upload foto. Coba lagi atau kirim tanpa foto.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const fd = new FormData(form);
    fd.set('photoUrls', JSON.stringify(photoUrls));
    fetcher.submit(fd, { method: 'post' });
  }

  // Status screens (loader data)
  if (data.status === 'used' && !successData) {
    return <StatusPage icon="🔒" title="Link Sudah Digunakan" desc="Link review ini hanya bisa digunakan satu kali. Minta link baru ke kasir." />;
  }
  if (data.status === 'expired') {
    return <StatusPage icon="⏰" title="Link Sudah Kadaluarsa" desc="Link ini berlaku 48 jam. Silakan minta link baru ke kasir." />;
  }
  if (data.status === 'invalid') {
    return <StatusPage icon="❌" title="Link Tidak Valid" desc="Link review ini tidak ditemukan atau sudah tidak berlaku." />;
  }

  // Success screen — uses local state, survives loader revalidation
  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Terima Kasih!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ulasan kamu untuk <strong>{data.productTitle}</strong> sudah terkirim dan sedang ditinjau tim kami.
          </p>

          {successData.googleReviewLink && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 text-left">
              <p className="text-sm font-semibold text-gray-800 mb-1">Bantu kami di Google juga! 🙏</p>
              <p className="text-xs text-gray-500 mb-4">
                Teks ulasan kamu sudah {copied ? 'tersalin otomatis' : 'bisa disalin'} — tinggal paste di Google Review.
              </p>
              <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-600 leading-relaxed border border-gray-100">
                "{successData.reviewText}"
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(successData.reviewText).catch(() => {});
                  setCopied(true);
                  setTimeout(() => window.open(successData.googleReviewLink, '_blank'), 300);
                }}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: '#4285f4' }}
              >
                {copied ? '✓ Teks Tersalin — Buka Google Review →' : 'Salin & Buka Google Review →'}
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400">Halaman ini bisa ditutup setelah selesai.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⭐</div>
          <h1 className="text-lg font-bold text-gray-900">Tulis Ulasan</h1>
          <p className="text-sm text-gray-500 mt-1">{data.productTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
          <input type="hidden" name="tokenId" value={data.tokenId} />
          <input type="hidden" name="productHandle" value={data.productHandle} />
          <input type="hidden" name="productTitle" value={data.productTitle} />
          <input type="hidden" name="googleReviewLink" value={data.googleReviewLink} />
          <input type="hidden" name="branch" value={data.branch} />
          <input type="hidden" name="rating" value={String(rating)} />
          <input type="hidden" name="photoUrls" value="[]" />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Kamu</label>
            <input name="customerName" type="text" placeholder="Nama lengkap atau nama panggilan" required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ulasan</label>
            <textarea name="reviewText" placeholder="Ceritakan pengalaman kamu dengan produk ini..."
              required rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors resize-none" />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Foto Produk <span className="font-normal text-gray-400">(opsional, maks 3 foto)</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {photoPreviews.map((src, idx) => (
                <div key={idx} className="relative">
                  <img src={src} alt={`foto ${idx + 1}`} className="h-20 w-20 rounded-xl object-cover border border-gray-200" />
                  <button type="button" onClick={() => removePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center">
                    ×
                  </button>
                </div>
              ))}
              {photoFiles.length < 3 && (
                <label className="flex flex-col items-center justify-center gap-1 cursor-pointer h-20 w-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 text-gray-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-[10px]">{photoPreviews.length === 0 ? 'Tambah Foto' : 'Tambah Lagi'}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#111827' }}>
            {uploading ? `Mengupload foto...` : isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">Link ini hanya bisa digunakan satu kali.</p>
      </div>
    </div>
  );
}
