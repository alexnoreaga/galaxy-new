import React, { useState, Suspense } from 'react';
import { Await } from 'react-router-dom';

export const Carousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.nodes.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.nodes.length) % images.nodes.length);
  };

  return (
    <Suspense fallback={<div>Loading carousel...</div>}>
      <Await resolve={images}>
        {(resolvedImages) => (
          <div className='relative flex items-center'>
            <button 
              aria-label="Slide Kiri" 
              className='absolute left-2 rounded-full p-1 bg-neutral-700/50' 
              onClick={prevImage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
              </svg>
            </button>
            
            <a href={resolvedImages.nodes[currentIndex].fields[1].value || '#'} target="_blank" rel="noopener noreferrer" className='m-auto w-full rounded-lg'>
              <img 
                className='m-auto w-full rounded-lg' 
                width={'1280'}
                height={'543'}
                src={resolvedImages.nodes[currentIndex].fields[0].reference.image.url} 
                alt={`Image ${currentIndex + 1}`} 
                style={{ maxWidth: '100%' }} 
                srcSet={`${resolvedImages.nodes[currentIndex].fields[0].reference.image.url} 1280w,
                         ${resolvedImages.nodes[currentIndex].fields[0].reference.image.url}?w=640 640w,
                         ${resolvedImages.nodes[currentIndex].fields[0].reference.image.url}?w=320 320w`}
              />
            </a>
            
            <button 
              aria-label="Slide Kanan" 
              className='absolute right-2 rounded-full p-1 bg-neutral-700/50' 
              onClick={nextImage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </Await>
    </Suspense>
  );
};
