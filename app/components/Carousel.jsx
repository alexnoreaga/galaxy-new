import React, { useState, Suspense, useRef } from 'react';
import { Await } from 'react-router-dom';

export const Carousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  const nextImage = () => {
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.nodes.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevImage = () => {
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.nodes.length) % images.nodes.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - touchStartXRef.current;
    setSwipeOffset(offset * 0.3); // Reduce offset for smoother visual
    touchEndXRef.current = currentX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;

    const distance = touchStartXRef.current - touchEndXRef.current;

    if (distance > 50) {
      // Swiped left - next image
      nextImage();
    } else if (distance < -50) {
      // Swiped right - previous image
      prevImage();
    }

    setSwipeOffset(0);
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <Suspense fallback={<div>Loading carousel...</div>}>
      <Await resolve={images}>
        {(resolvedImages) => (
          <div 
            className='relative flex items-center select-none overflow-hidden rounded-2xl shadow-lg'
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'pan-y' }}
          >
            {/* Navigation Buttons */}
            <button 
              aria-label="Slide Kiri" 
              className='absolute left-4 rounded-full p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 z-10 transition-all duration-300 active:scale-95 group' 
              onClick={prevImage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            <a 
              href={resolvedImages.nodes[currentIndex].fields[1].value || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`m-auto w-full rounded-2xl pointer-events-none transition-all duration-700 ease-out ${
                isTransitioning ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'
              }`}
              style={{
                transform: `translateX(${swipeOffset}px)`,
              }}
            >
              <img 
                className='m-auto w-full rounded-2xl select-none transition-all duration-700 ease-out' 
                width={'1280'}
                height={'543'}
                src={`${resolvedImages.nodes[currentIndex].fields[0].reference.image.url}&width=800`}
                alt={`Image ${currentIndex + 1}`} 
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                fetchpriority={currentIndex === 0 ? 'high' : 'auto'}
                style={{ 
                  maxWidth: '100%', 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none',
                  transform: swipeOffset !== 0 ? `scale(${1 - Math.abs(swipeOffset) / 1200})` : 'scale(1)',
                }} 
                srcSet={`${resolvedImages.nodes[currentIndex].fields[0].reference.image.url}&width=400 400w,
                         ${resolvedImages.nodes[currentIndex].fields[0].reference.image.url}&width=800 800w,
                         ${resolvedImages.nodes[currentIndex].fields[0].reference.image.url}&width=1280 1280w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px"
              />
            </a>
            
            <button 
              aria-label="Slide Kanan" 
              className='absolute right-4 rounded-full p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 z-10 transition-all duration-300 active:scale-95 group' 
              onClick={nextImage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Modern Dot Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
              {resolvedImages.nodes.map((_, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ease-out ${
                    index === currentIndex
                      ? 'bg-white w-10 h-2 rounded-full shadow-lg'
                      : 'bg-white/40 backdrop-blur-sm w-2 h-2 rounded-full hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </Await>
    </Suspense>
  );
};
