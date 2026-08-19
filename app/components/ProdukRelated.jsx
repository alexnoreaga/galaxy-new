import { Link } from '@remix-run/react';
import { useRef, useState, useEffect } from 'react';

// Cheapest tenor (Kredivo 12x) — mirrors the collection cards
const ADM_KREDIVO = 2.6;
const CICILAN_MIN_HARGA = 1000000; // below this a monthly figure is meaningless

function cicilanPerBulan(price) {
  const bunga = (ADM_KREDIVO * price) / 100;
  return Math.ceil((price / 12 + bunga) / 10) * 10;
}

// Compact: 939.000 -> "939rb", 1.093.330 -> "1,1jt"
function formatSingkat(n) {
  const rb = Math.round(n / 1000);
  if (rb >= 1000) return `${(n / 1000000).toFixed(1).replace('.', ',')}jt`;
  return `${rb}rb`;
}

export const ProdukRelated = ({ related }) => {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateButtons();
    el.addEventListener('scroll', updateButtons, { passive: true });
    return () => el.removeEventListener('scroll', updateButtons);
  }, []);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  const products = related?.productRecommendations ?? [];
  const soldCounts = related?.soldCounts || {};
  const reviewSummaries = related?.reviewSummaries || {};
  if (!products.length) return null;

  return (
    <div className="py-4">
      {/* Nav buttons */}
      <div className="flex justify-end gap-1.5 mb-3 px-1">
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm transition-all duration-150 disabled:opacity-30 hover:border-gray-400 hover:shadow-md active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm transition-all duration-150 disabled:opacity-30 hover:border-gray-400 hover:shadow-md active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scroll track */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((product) => {
          const price = parseFloat(product?.priceRange?.minVariantPrice?.amount ?? 0);
          const compareAt = parseFloat(product?.priceRange?.maxVariantPrice?.amount ?? 0);
          const hasDiscount = compareAt > price && compareAt > 0;
          const discountPct = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;
          const sold = soldCounts[product.handle] || 0;
          const review = reviewSummaries[product.handle] || null;
          const showCicilan = price >= CICILAN_MIN_HARGA;

          return (
            <Link
              key={product.handle}
              to={`/products/${product.handle}`}
              prefetch="intent"
              className="flex-none w-[160px] sm:w-[180px] snap-start group no-underline"
              style={{ textDecoration: 'none' }}
            >
              {/* Borderless Tokopedia-style card — matches collections/homepage grids */}
              <div className="bg-white rounded-xl overflow-hidden">
                {/* Image — rounded all corners, subtle tint so white photos stay defined */}
                <div className="relative w-full aspect-square bg-gray-50 overflow-hidden rounded-xl">
                  {product.featuredImage?.url ? (
                    <img
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      width={180}
                      height={180}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 6.75h.008v.008H6.75V6.75z" />
                      </svg>
                    </div>
                  )}
                  <div aria-hidden="true" className="absolute inset-0 bg-black/[0.03] group-hover:bg-black/[0.06] transition-colors duration-300 pointer-events-none" />
                  {hasDiscount && (
                    <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      -{discountPct}%
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 pt-2">
                  <p className="text-xs text-gray-700 font-medium leading-snug line-clamp-2 mb-1.5 group-hover:text-rose-600 transition-colors duration-200">
                    {product.title}
                  </p>
                  {hasDiscount && (
                    <p className="text-[10px] text-gray-400 line-through leading-tight m-0">
                      Rp{compareAt.toLocaleString('id-ID')}
                    </p>
                  )}
                  <p className="text-sm font-bold text-rose-700 m-0">
                    Rp{price.toLocaleString('id-ID')}
                  </p>
                  {showCicilan && (
                    <p className="text-[10px] sm:text-[11px] text-gray-500 leading-tight mt-0.5 m-0">
                      Cicilan <span className="font-semibold text-rose-700">{formatSingkat(cicilanPerBulan(price))}</span>/bln
                    </p>
                  )}
                  {(review || sold > 0) && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 leading-none flex-wrap">
                      {review && (
                        <>
                          <span className="text-amber-400 text-[11px]">★</span>
                          <span className="font-bold text-gray-700">{review.avg}</span>
                          <span className="text-gray-400">({review.count})</span>
                        </>
                      )}
                      {review && sold > 0 && <span className="text-gray-300">·</span>}
                      {sold > 0 && (
                        <span>Terjual <span className="font-semibold text-gray-600">{sold.toLocaleString('id-ID')}</span></span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
