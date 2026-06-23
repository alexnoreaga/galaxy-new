import { Link } from '@remix-run/react';
import { useState, useEffect } from 'react';

export function RecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('galaxy_recently_viewed') || '[]');
      setItems(parsed.slice(0, 10));
    } catch (_) {}
  }, []);

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

          return (
            <Link
              key={item.handle}
              to={`/products/${item.handle}`}
              prefetch="intent"
              className="flex-none w-[140px] sm:w-[160px] snap-start no-underline group"
            >
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
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
                <div className="p-2.5">
                  <p className="text-xs text-gray-700 font-medium leading-snug line-clamp-2 mb-1.5">
                    {item.title}
                  </p>
                  <p className="text-sm font-bold text-rose-700">
                    Rp{item.price.toLocaleString('id-ID')}
                  </p>
                  {hasDiscount && (
                    <p className="text-[10px] text-gray-400 line-through">
                      Rp{item.compareAtPrice.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
