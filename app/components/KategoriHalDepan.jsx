import { Link } from '@remix-run/react';
import React from 'react'
import {useRef} from "react";


export const KategoriHalDepan = ({related}) => {

const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -200,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 200,
        behavior: 'smooth',
      });
    }
  };


  if (!related) return null;

  return (
    <div className="w-full py-4 sm:py-6">
      <div className='flex flex-row items-end justify-between mb-5 gap-3 px-3 sm:px-0'>
        <div>
          <div className="text-gray-900 text-lg sm:text-2xl font-bold tracking-tight">Kategori Populer</div>
          <div className='h-1 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2'></div>
        </div>
        <Link to="/collections">
          <button className='px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs sm:text-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 whitespace-nowrap'>
            Lihat Semua →
          </button>
        </Link>
      </div>

      <div className="relative flex items-center group/scroll">
        {/* Left Scroll Button */}
        <button
          onClick={scrollLeft}
          className='hidden sm:flex absolute left-0 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 opacity-0 group-hover/scroll:opacity-100 active:scale-95'
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Scrollable Container */}
        <div className="flex overflow-x-auto hide-scroll-bar snap-x snap-mandatory scroll-smooth gap-1.5 sm:gap-3 pb-2 w-full px-2 sm:px-12" ref={scrollRef}>
          {related?.nodes.map((relate) => (
            <Link
              to={`/collections/${relate?.handle}`}
              key={relate?.id}
              className="flex-shrink-0"
            >
              <div className="group relative flex flex-col items-center justify-center p-2 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-2xl border border-gray-100 hover:border-blue-300 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 w-16 sm:w-28 md:w-32 h-20 sm:h-32 md:h-36 overflow-hidden cursor-pointer snap-center">
                
                {/* Background Glow Effect */}
                <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-400/5 to-indigo-400/5'></div>
                
                {/* Image Container */}
                <div className='relative w-9 h-9 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-1 sm:mb-3 flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300'>
                  <img
                    src={relate?.image?.url}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                    alt={relate?.title}
                  />
                </div>
                
                {/* Text */}
                <p className="text-gray-800 text-center text-[10px] sm:text-sm font-semibold line-clamp-2 leading-tight relative z-10 group-hover:text-blue-700 transition-colors duration-300 px-1">
                  {relate?.title}
                </p>
                
                {/* Hover Bottom Border */}
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={scrollRight}
          className='hidden sm:flex absolute right-0 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 opacity-0 group-hover/scroll:opacity-100 active:scale-95'
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
