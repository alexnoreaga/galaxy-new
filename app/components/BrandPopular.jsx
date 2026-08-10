import { Await, Link } from '@remix-run/react';
import { Suspense, useRef } from 'react';

export const BrandPopular = ({ brands }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <Suspense fallback={null}>
      <Await resolve={brands}>
        {(resolvedBrands) => (
          // Full-bleed on mobile (-mx-4 cancels the 16px body gutter), contained rounded card on desktop
          <div className="relative -mx-4 sm:mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl sm:px-0 my-6 sm:my-8">
            <section
              className="relative overflow-hidden rounded-none sm:rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)' }}
            >
              {/* Subtle dotted texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: 0.06,
                  backgroundImage: 'radial-gradient(circle at center, #ffffff 0.6px, transparent 0.6px)',
                  backgroundSize: '22px 22px',
                }}
              />

              {/* Header */}
              <div className="relative flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-7 bg-gradient-to-b from-red-500 to-rose-600 rounded-full flex-shrink-0" />
                  <div>
                    <h2 className="text-white text-lg sm:text-2xl font-bold leading-none">Brand Populer</h2>
                    <p className="text-slate-300 text-[10px] sm:text-xs mt-1">Partner resmi &amp; terpercaya</p>
                  </div>
                </div>
                <Link
                  to="/brands/"
                  className="text-slate-200 hover:text-white flex items-center gap-1 text-xs sm:text-sm font-medium transition-colors duration-200 group no-underline flex-shrink-0"
                >
                  Lihat Semua
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>

              {/* Rail of white logo chips */}
              <div className="relative group/carousel">
                {/* Left button (desktop) */}
                <button
                  onClick={() => scroll('left')}
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 active:scale-95"
                  aria-label="Scroll Left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <div
                  ref={scrollRef}
                  className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x px-4 sm:px-6 pb-4 sm:pb-5"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {resolvedBrands.map((brand, index) => (
                    <Link
                      to={`/brands/${brand.metaobject.fields[0].value}`}
                      key={index}
                      className="snap-center flex-shrink-0 no-underline"
                    >
                      <div className="group bg-white rounded-xl p-3 sm:p-4 shadow-md hover:shadow-xl ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 w-24 sm:w-32 flex items-center justify-center">
                        <img
                          className="w-full h-auto object-contain aspect-square group-hover:scale-110 transition-transform duration-300"
                          src={brand.metaobject.fields[1].reference.image.url}
                          alt={brand.metaobject.fields[0].value}
                          width={128}
                          height={128}
                          loading="lazy"
                        />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Right button (desktop) */}
                <button
                  onClick={() => scroll('right')}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 active:scale-95"
                  aria-label="Scroll Right"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </section>
          </div>
        )}
      </Await>
    </Suspense>
  );
};
