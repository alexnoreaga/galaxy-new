import { Link } from '@remix-run/react';
import { useState, useEffect } from 'react';

// Cheapest tenor (Kredivo 12x) — mirrors mulaiDari() on the product page & the collection card
const ADM_KREDIVO = 2.6;
const CICILAN_MIN_HARGA = 1000000; // below this a monthly figure is meaningless

// Live social-proof source (same project/collections as the homepage rails)
const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

function cicilanPerBulan(price) {
  const bunga = (ADM_KREDIVO * price) / 100;
  return Math.ceil((price / 12 + bunga) / 10) * 10;
}

// Compact for mobile: 939.000 -> "939rb", 1.093.330 -> "1,1jt"
function formatSingkat(n) {
  const rb = Math.round(n / 1000);
  if (rb >= 1000) return `${(n / 1000000).toFixed(1).replace('.', ',')}jt`;
  return `${rb}rb`;
}

export function RecentlyViewed() {
  const [items, setItems] = useState([]);
  const [proof, setProof] = useState({}); // handle -> { rating, count, sold }

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('galaxy_recently_viewed') || '[]');
      setItems(parsed.slice(0, 10));
    } catch (_) {}
  }, []);

  // Fetch rating + terjual LIVE (matches the homepage rails), so it works for items
  // saved before enrichment existed and always shows current numbers.
  const handleKey = items.map((i) => i.handle).join(',');
  useEffect(() => {
    const handles = items.map((i) => i.handle);
    if (!handles.length) return;
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        handles.map(async (h) => {
          const [sold, review] = await Promise.all([
            fetch(`${FIRESTORE_BASE}/sold_counts/${h}?key=${FIRESTORE_KEY}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => parseInt(d?.fields?.count?.integerValue || 0))
              .catch(() => 0),
            fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                structuredQuery: {
                  from: [{ collectionId: 'reviews' }],
                  where: {
                    compositeFilter: {
                      op: 'AND',
                      filters: [
                        { fieldFilter: { field: { fieldPath: 'productHandle' }, op: 'EQUAL', value: { stringValue: h } } },
                        { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } },
                      ],
                    },
                  },
                  select: { fields: [{ fieldPath: 'rating' }] },
                  limit: 100,
                },
              }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((rows) => {
                const rs = (rows || []).filter((x) => x.document).map((x) => parseInt(x.document.fields?.rating?.integerValue || 5));
                return rs.length ? { avg: parseFloat((rs.reduce((s, r) => s + r, 0) / rs.length).toFixed(1)), count: rs.length } : null;
              })
              .catch(() => null),
          ]);
          return [h, { sold, rating: review?.avg || 0, count: review?.count || 0 }];
        })
      );
      if (!cancelled) setProof(Object.fromEntries(entries));
    })();

    return () => { cancelled = true; };
  }, [handleKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length < 2) return null;

  return (
    <div className="py-4 px-2 sm:px-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-bold text-gray-900">Terakhir Dilihat</h2>
        <button
          onClick={() => {
            localStorage.removeItem('galaxy_recently_viewed');
            setItems([]);
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Hapus semua
        </button>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {items.map((item) => {
          const hasDiscount = item.compareAtPrice > item.price && item.compareAtPrice > 0;
          const discPct = hasDiscount ? Math.round((1 - item.price / item.compareAtPrice) * 100) : 0;
          const showCicilan = item.price >= CICILAN_MIN_HARGA;
          // Prefer live numbers; fall back to the view-time snapshot until they load
          const p = proof[item.handle];
          const rating = p?.rating || item.rating || 0;
          const sold = p?.sold || item.soldCount || 0;
          const showProof = rating > 0 || sold > 0;

          return (
            <Link
              key={item.handle}
              to={`/products/${item.handle}`}
              prefetch="intent"
              className="flex-none w-[150px] sm:w-[168px] snap-start no-underline group"
            >
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col h-full">
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                  {hasDiscount && (
                    <span className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      -{discPct}%
                    </span>
                  )}
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <p className="text-xs text-gray-700 font-medium leading-snug line-clamp-2 mb-1.5">
                    {item.title}
                  </p>

                  <div className="mt-auto">
                    <p className="text-sm font-bold text-rose-700">
                      Rp{item.price.toLocaleString('id-ID')}
                    </p>
                    {hasDiscount && (
                      <p className="text-[10px] text-gray-400 line-through leading-tight">
                        Rp{item.compareAtPrice.toLocaleString('id-ID')}
                      </p>
                    )}
                    {showCicilan && (
                      <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                        Cicilan{' '}
                        <span className="font-semibold text-rose-700">
                          {formatSingkat(cicilanPerBulan(item.price))}
                        </span>
                        /bln
                      </p>
                    )}

                    {showProof && (
                      <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-100 text-[10px] text-gray-500">
                        {rating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <svg viewBox="0 0 20 20" className="w-3 h-3" fill="#f59e0b">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-semibold text-gray-700">{rating}</span>
                          </span>
                        )}
                        {rating > 0 && sold > 0 && <span className="text-gray-300">·</span>}
                        {sold > 0 && (
                          <span>{sold.toLocaleString('id-ID')} terjual</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
