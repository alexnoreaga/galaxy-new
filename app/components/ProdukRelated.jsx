import { Link } from '@remix-run/react';
import { useRef, useState, useEffect } from 'react';

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

          return (
            <Link
              key={product.handle}
              to={`/products/${product.handle}`}
              prefetch="intent"
              className="flex-none w-[160px] sm:w-[180px] snap-start group no-underline"
              style={{ textDecoration: 'none' }}
            >
              <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                {/* Image */}
                <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                  {product.featuredImage?.url ? (
                    <img
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                  {hasDiscount && (
                    <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      -{discountPct}%
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-xs text-gray-700 font-medium leading-snug line-clamp-2 mb-1.5">
                    {product.title}
                  </p>
                  <p className="text-sm font-bold text-rose-700">
                    Rp{price.toLocaleString('id-ID')}
                  </p>
                  {hasDiscount && (
                    <p className="text-[10px] text-gray-400 line-through">
                      Rp{compareAt.toLocaleString('id-ID')}
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
};
