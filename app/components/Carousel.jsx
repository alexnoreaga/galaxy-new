import { useState, useEffect, useRef, Suspense } from 'react';
import { Await } from 'react-router-dom';

export const Carousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);
  const swipeDistanceRef = useRef(0);
  const isPausedRef = useRef(false);
  const isTouchingRef = useRef(false);
  const imageCountRef = useRef(0);

  const goTo = (index) => {
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const nextImage = () => goTo((prev) => (prev + 1) % imageCountRef.current);
  const prevImage = () => goTo((prev) => (prev - 1 + imageCountRef.current) % imageCountRef.current);

  // Auto-slide: 5s interval, pauses on hover or touch
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPausedRef.current && !isTouchingRef.current) {
        setCurrentIndex(prev => (prev + 1) % imageCountRef.current);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTouchStart = (e) => {
    isTouchingRef.current = true;
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
    swipeDistanceRef.current = 0;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - touchStartXRef.current;
    swipeDistanceRef.current = offset;
    setSwipeOffset(offset * 0.3);
    touchEndXRef.current = currentX;
  };

  const handleTouchEnd = () => {
    isTouchingRef.current = false;
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;

    const distance = touchStartXRef.current - touchEndXRef.current;
    if (distance > 50) nextImage();
    else if (distance < -50) prevImage();

    setSwipeOffset(0);
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Prevent link navigation if user swiped (not tapped)
  const handleLinkClick = (e) => {
    if (Math.abs(swipeDistanceRef.current) > 10) {
      e.preventDefault();
    }
  };

  return (
    <Suspense fallback={<div>Loading carousel...</div>}>
      <Await resolve={images}>
        {(resolvedImages) => {
          imageCountRef.current = resolvedImages.nodes.length;
          const currentNode = resolvedImages.nodes[currentIndex];
          const linkUrl = currentNode?.fields[1]?.value || null;
          const imgUrl = currentNode?.fields[0]?.reference?.image?.url;

          return (
            <div
              className="relative flex items-center select-none overflow-hidden rounded-2xl shadow-lg"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => { isPausedRef.current = true; }}
              onMouseLeave={() => { isPausedRef.current = false; }}
              style={{ touchAction: 'pan-y' }}
            >
              {/* Prev button */}
              <button
                aria-label="Slide Kiri"
                className="absolute left-4 rounded-full p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 z-10 transition-all duration-300 active:scale-95 group"
                onClick={prevImage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Banner image — clickable only if link exists */}
              {linkUrl ? (
                <a
                  href={linkUrl}
                  onClick={handleLinkClick}
                  className={`m-auto w-full rounded-2xl transition-all duration-700 ease-out ${
                    isTransitioning ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'
                  }`}
                  style={{ transform: `translateX(${swipeOffset}px)` }}
                >
                  <BannerImage imgUrl={imgUrl} currentIndex={currentIndex} swipeOffset={swipeOffset} />
                </a>
              ) : (
                <div
                  className={`m-auto w-full rounded-2xl transition-all duration-700 ease-out ${
                    isTransitioning ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'
                  }`}
                  style={{ transform: `translateX(${swipeOffset}px)` }}
                >
                  <BannerImage imgUrl={imgUrl} currentIndex={currentIndex} swipeOffset={swipeOffset} />
                </div>
              )}

              {/* Next button */}
              <button
                aria-label="Slide Kanan"
                className="absolute right-4 rounded-full p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 z-10 transition-all duration-300 active:scale-95 group"
                onClick={nextImage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                {resolvedImages.nodes.map((_, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-500 ease-out ${
                      index === currentIndex
                        ? 'bg-white w-10 h-2 rounded-full shadow-lg'
                        : 'bg-white/40 backdrop-blur-sm w-2 h-2 rounded-full'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
};

function BannerImage({ imgUrl, currentIndex, swipeOffset }) {
  if (!imgUrl) return null;
  return (
    <img
      className="m-auto w-full rounded-2xl select-none transition-all duration-700 ease-out"
      width="1280"
      height="543"
      src={`${imgUrl}&width=800`}
      alt="Promo Galaxy Camera"
      loading={currentIndex === 0 ? 'eager' : 'lazy'}
      fetchpriority={currentIndex === 0 ? 'high' : 'auto'}
      style={{
        maxWidth: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transform: swipeOffset !== 0 ? `scale(${1 - Math.abs(swipeOffset) / 1200})` : 'scale(1)',
      }}
      srcSet={`${imgUrl}&width=400 400w, ${imgUrl}&width=800 800w, ${imgUrl}&width=1280 1280w`}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px"
    />
  );
}
