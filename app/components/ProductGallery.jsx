import {Image} from '@shopify/hydrogen';
import { useState, useRef, useEffect } from 'react';

/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */
export function ProductGallery({media, className}) {
  if (!media.length) {
    return null;
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const galleryRef = useRef(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev + 1) % media.length);
    } else if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length);
    }
  };

  // Scroll to current image on desktop
  useEffect(() => {
    if (galleryRef.current) {
      const children = galleryRef.current.children;
      if (children[currentImageIndex]) {
        children[currentImageIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentImageIndex]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main image display for mobile */}
      <div className="md:hidden relative bg-white dark:bg-contrast/10 rounded-lg overflow-hidden">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-square"
        >
          {media[currentImageIndex].__typename === 'MediaImage' && (
            <Image
              loading="eager"
              data={{...media[currentImageIndex].image, altText: media[currentImageIndex].alt || 'Product image'}}
              sizes="90vw"
              className="object-cover w-full h-full"
            />
          )}
        </div>

        {/* Image counter and navigation */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
            {currentImageIndex + 1}/{media.length}
          </div>
        </div>

        {/* Navigation arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % media.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Desktop gallery */}
      <div
        ref={galleryRef}
        className={`swimlane md:grid-flow-row hiddenScroll md:p-0 md:overflow-x-auto md:grid-cols-2 ${className}`}
      >
        {media.map((med, i) => {
          const isFirst = i === 0;
          const isFourth = i === 3;
          const isFullWidth = i % 3 === 0;

          const image =
            med.__typename === 'MediaImage'
              ? {...med.image, altText: med.alt || 'Product image'}
              : null;

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
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentImageIndex ? 'bg-gray-800 w-6' : 'bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}