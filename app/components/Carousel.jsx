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
            className='relative flex items-center select-none overflow-hidden rounded-lg'
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'pan-y' }}
          >
            <button 
              aria-label="Slide Kiri" 
              className='absolute left-2 rounded-full p-1 bg-neutral-700/50 hover:bg-neutral-700/80 z-10 transition-colors active:bg-neutral-900' 
              onClick={prevImage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
              </svg>
            </button>
            
            <a 
              href={resolvedImages.nodes[currentIndex].fields[1].value || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`m-auto w-full rounded-lg pointer-events-none transition-all duration-500 ${
                isTransitioning ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
              }`}
              style={{
                transform: `translateX(${swipeOffset}px)`,
              }}
            >
              <img 
                className='m-auto w-full rounded-lg select-none transition-all duration-500' 
                width={'1280'}
                height={'543'}
                src={resolvedImages.nodes[currentIndex].fields[0].reference.image.url} 
                alt={`Image ${currentIndex + 1}`} 
                style={{ 
                  maxWidth: '100%', 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none',
                  transform: swipeOffset !== 0 ? `scale(${1 - Math.abs(swipeOffset) / 1000})` : 'scale(1)',
                }} 
                srcSet={`${resolvedImages.nodes[currentIndex].fields[0].reference.image.url} 1280w,
                         ${resolvedImages.nodes[currentIndex].fields[0].reference.image.url}?w=640 640w,
                         ${resolvedImages.nodes[currentIndex].fields[0].reference.image.url}?w=320 320w`}
              />
            </a>
            
            <button 
              aria-label="Slide Kanan" 
              className='absolute right-2 rounded-full p-1 bg-neutral-700/50 hover:bg-neutral-700/80 z-10 transition-colors active:bg-neutral-900' 
              onClick={nextImage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 pointer-events-none">
              {resolvedImages.nodes.map((_, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index === currentIndex
                      ? 'bg-white w-8 h-2 rounded-full'
                      : 'bg-white/50 w-2 h-2 rounded-full'
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
