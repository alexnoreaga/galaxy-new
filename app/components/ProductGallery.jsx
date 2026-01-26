import {Image} from '@shopify/hydrogen';
import { useState, useRef, useCallback } from 'react';

/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */
export function ProductGallery({media, className}) {
  if (!media.length) {
    return null;
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);
  const containerRef = useRef(null);

  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => (prev + 1) % media.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [media.length]);

  const goToPrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [media.length]);

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
      console.log('Swiped LEFT - Next Image');
      goToNext();
    } else if (distance < -50) {
      console.log('Swiped RIGHT - Previous Image');
      goToPrev();
    }

    setSwipeOffset(0);
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const getImageData = (med) => {
    if (med && med.__typename === 'MediaImage') {
      return {...med.image, altText: med.alt || 'Product image'};
    }
    return null;
  };

  const currentImage = media[currentImageIndex];
  const imageData = getImageData(currentImage);

  const ArrowLeft = () => (
    <span className="text-2xl font-bold">‹</span>
  );

  const ArrowRight = () => (
    <span className="text-2xl font-bold">›</span>
  );

  // Main image container
  const MainImage = () => (
    <div 
      ref={containerRef}
      className="relative bg-white dark:bg-contrast/10 rounded-lg overflow-hidden w-full select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      <div 
        className={`relative w-full aspect-square bg-gray-100 select-none transition-all duration-500 ${
          isTransitioning ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none',
          transform: `translateX(${swipeOffset}px) scale(${1 - Math.abs(swipeOffset) / 2000})`
        }}
      >
        {imageData ? (
          <Image
            loading="eager"
            data={imageData}
            sizes="90vw"
            className="w-full h-full object-cover select-none"
            style={{ userSelect: 'none', pointerEvents: 'none', WebkitUserSelect: 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>

      {/* Left Arrow Button */}
      {media.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-30 transition-colors active:bg-black flex items-center justify-center w-12 h-12 shadow-lg"
          aria-label="Previous image"
        >
          <ArrowLeft />
        </button>
      )}

      {/* Right Arrow Button */}
      {media.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-30 transition-colors active:bg-black flex items-center justify-center w-12 h-12 shadow-lg"
          aria-label="Next image"
        >
          <ArrowRight />
        </button>
      )}

      {/* Image counter */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentImageIndex + 1}/{media.length}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile view */}
      <div className="md:hidden">
        <MainImage />
      </div>

      {/* Desktop main image with arrows */}
      <div className="hidden md:block">
        <MainImage />
      </div>

      {/* Desktop gallery grid */}
      <div
        className={`swimlane md:grid-flow-row hiddenScroll md:p-0 md:overflow-x-auto md:grid-cols-2 ${className}`}
      >
        {media.map((med, i) => {
          const isFirst = i === 0;
          const isFourth = i === 3;
          const isFullWidth = i % 3 === 0;

          const image = getImageData(med);

          const style = [
            isFullWidth ? 'md:col-span-2' : 'md:col-span-1',
            isFirst || isFourth ? '' : 'md:aspect-[4/5]',
            'aspect-square snap-center card-image bg-white dark:bg-contrast/10 w-mobileGallery md:w-full cursor-pointer transition-all hover:shadow-lg',
          ].join(' ');

          return (
            <div 
              className={style} 
              key={med.id || image?.id}
              onClick={() => setCurrentImageIndex(i)}
            >
              {image && (
                <Image
                  loading={i === 0 ? 'eager' : 'lazy'}
                  data={image}
                  aspectRatio={!isFirst && !isFourth ? '4/5' : undefined}
                  sizes={
                    isFirst || isFourth
                      ? '(min-width: 48em) 60vw, 90vw'
                      : '(min-width: 48em) 30vw, 90vw'
                  }
                  className="object-cover w-full h-full aspect-square fadeIn"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Thumbnail indicators for mobile */}
      <div className="md:hidden flex justify-center gap-2">
        {media.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentImageIndex(i)}
            className={`transition-all ${
              i === currentImageIndex 
                ? 'bg-gray-800 w-8 h-2 rounded-full' 
                : 'bg-gray-400 w-2 h-2 rounded-full'
            }`}
            aria-label={`Go to image ${i + 1}`}
            aria-current={i === currentImageIndex}
          />
        ))}
      </div>
    </div>
  );
}