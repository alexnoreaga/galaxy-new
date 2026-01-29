import { Await, Link, useLoaderData } from '@remix-run/react';
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
    <Suspense fallback={<div>Loading popular brands...</div>}>
      <Await resolve={brands}>
        {(resolvedBrands) => (
          <div className="my-8">
            <div className="flex flex-row items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <h2 className="text-slate-800 text-lg sm:text-2xl font-bold">
                  Brand Popular
                </h2>
              </div>
              <Link to={`/brands/`}>
                <div className="text-slate-600 hover:text-blue-600 flex items-center gap-1 text-sm sm:text-base font-medium transition-colors duration-200 group">
                  Lihat Semua
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            </div>
            
            <div className="relative group/carousel">
              {/* Left Button */}
              <button
                onClick={() => scroll('left')}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 active:scale-95"
                aria-label="Scroll Left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Scrollable Container */}
              <div 
                ref={scrollRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {resolvedBrands.map((brand, index) => (
                  <Link to={`/brands/${brand.metaobject.fields[0].value}`} key={index} className="snap-center">
                    <div className="group relative bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:scale-105 w-24 sm:w-32 flex-shrink-0">
                      <img
                        className="w-full h-auto object-contain aspect-square group-hover:scale-110 transition-transform duration-300"
                        src={brand.metaobject.fields[1].reference.image.url}
                        alt={brand.metaobject.fields[0].value}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Right Button */}
              <button
                onClick={() => scroll('right')}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 active:scale-95"
                aria-label="Scroll Right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </Await>
    </Suspense>
  );
};
