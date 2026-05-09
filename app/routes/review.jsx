import { json } from '@shopify/remix-oxygen';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

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

    const used = f.used?.booleanValue === true;
    const expiresAt = f.expiresAt?.stringValue;
    const expired = expiresAt ? new Date(expiresAt) < new Date() : false;

    if (used) return json({ status: 'used' });
    if (expired) return json({ status: 'expired' });

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

  if (!customerName || !reviewText || reviewText.length < 10) {
    return json({ error: 'Nama dan ulasan wajib diisi (minimal 10 karakter).' });
  }

  try {
    // Re-validate token before saving
    const tokenRes = await fetch(`${FIRESTORE_BASE}/review_tokens/${tokenId}?key=${key}`);
    if (!tokenRes.ok) return json({ error: 'Link tidak valid.' });
    const tokenDoc = await tokenRes.json();
    if (tokenDoc.fields?.used?.booleanValue === true) return json({ error: 'Link sudah digunakan.' });

    // Save review
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
          photoUrls: { arrayValue: { values: [] } },
          createdAt: { stringValue: new Date().toISOString() },
        },
      }),
    });

    // Mark token as used
    await fetch(
      `${FIRESTORE_BASE}/review_tokens/${tokenId}?key=${key}&updateMask.fieldPaths=used&updateMask.fieldPaths=usedAt`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            used: { booleanValue: true },
            usedAt: { stringValue: new Date().toISOString() },
          },
        }),
      }
    );

    return json({ success: true, reviewText, googleReviewLink });
  } catch (_) {
    return json({ error: 'Terjadi kesalahan. Coba lagi.' });
  }
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="text-3xl transition-transform active:scale-90"
          style={{ color: s <= (hovered || value) ? '#f59e0b' : '#374151' }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const data = useLoaderData();
  const fetcher = useFetcher();

  const [rating, setRating] = useState(5);
  const [copied, setCopied] = useState(false);

  const isSubmitting = fetcher.state !== 'idle';
  const result = fetcher.data;

  useEffect(() => {
    if (result?.success && result?.reviewText) {
      navigator.clipboard.writeText(result.reviewText).catch(() => {});
      setCopied(true);
    }
  }, [result]);

  if (data.status === 'used') {
    return <StatusPage icon="🔒" title="Link Sudah Digunakan" desc="Link review ini hanya bisa digunakan satu kali. Minta link baru ke kasir." />;
  }
  if (data.status === 'expired') {
    return <StatusPage icon="⏰" title="Link Sudah Kadaluarsa" desc="Link ini berlaku 48 jam. Silakan minta link baru ke kasir." />;
  }
  if (data.status === 'invalid') {
    return <StatusPage icon="❌" title="Link Tidak Valid" desc="Link review ini tidak ditemukan atau sudah tidak berlaku." />;
  }

  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Terima Kasih!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ulasan kamu untuk <strong>{data.productTitle}</strong> sudah terkirim dan sedang ditinjau tim kami.
          </p>

          {data.googleReviewLink && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 text-left">
              <p className="text-sm font-semibold text-gray-800 mb-1">Bantu kami di Google juga! 🙏</p>
              <p className="text-xs text-gray-500 mb-4">
                Teks ulasan kamu sudah {copied ? 'tersalin otomatis' : 'bisa disalin'} — tinggal paste di Google Review.
              </p>
              <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-600 leading-relaxed border border-gray-100">
                "{result.reviewText}"
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.reviewText).catch(() => {});
                  setCopied(true);
                  setTimeout(() => window.open(data.googleReviewLink, '_blank'), 300);
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

        <fetcher.Form method="post" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
          <input type="hidden" name="tokenId" value={data.tokenId} />
          <input type="hidden" name="productHandle" value={data.productHandle} />
          <input type="hidden" name="productTitle" value={data.productTitle} />
          <input type="hidden" name="googleReviewLink" value={data.googleReviewLink} />
          <input type="hidden" name="branch" value={data.branch} />
          <input type="hidden" name="rating" value={String(rating)} />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Kamu</label>
            <input
              name="customerName"
              type="text"
              placeholder="Nama lengkap atau nama panggilan"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ulasan</label>
            <textarea
              name="reviewText"
              placeholder="Ceritakan pengalaman kamu dengan produk ini..."
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {result?.error && (
            <p className="text-xs text-red-500">{result.error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#111827' }}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </button>
        </fetcher.Form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Link ini hanya bisa digunakan satu kali.
        </p>
      </div>
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
