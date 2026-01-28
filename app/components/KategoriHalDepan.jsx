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

    <div className="mirrorless-products mb-2 mt-1">
      <div className='flex flex-row items-center justify-between mb-2 gap-'>
        <div className="text-gray-900 text-sm sm:text-xl font-medium sm:font-semibold tracking-tight">Kategori Populer</div>
        <Link to="/collections">
          <div className='text-blue-600 hover:text-blue-800 text-xs sm:text-sm lg:text-base font-medium leading-tight whitespace-nowrap'>Lihat Semua →</div>
        </Link>
      </div>



    

      <div className="relative flex items-center">
        <div className="flex overflow-x-auto snap-x items-center scroll-smooth gap-2 pb-2" ref={scrollRef}>
          {related?.nodes.map((relate) => (
            <div
              className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 md:w-28 md:h-32 p-1 bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-150 hover:border-blue-300 transition-all duration-300 mr-[2px] sm:mr-1 last:mr-0 cursor-pointer group flex flex-col items-center justify-between hover:bg-blue-50"
              key={relate?.id}
            >
              <Link to={`/collections/${relate?.handle}`}
                className="flex flex-col items-center justify-center w-full h-full">
                <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mt-1 group-hover:scale-105 transition-transform duration-200 shadow-sm sm:border sm:border-gray-200">
                  <img
                    src={relate?.image?.url}
                    className="object-cover w-full h-full"
                    alt={relate?.title}
                  />
                </div>
                <div className="text-xs sm:text-sm text-gray-700 text-center px-0 whitespace-normal leading-tight break-words w-full mt-1 mb-1" style={{wordBreak: 'break-word', fontWeight: 400}}>
                  {relate?.title}
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/*
        <button className='absolute left-1 rounded-full p-1 bg-neutral-700/50' onClick={scrollLeft}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
          </svg>
        </button>
        <button className='absolute right-1 rounded-full p-1 bg-neutral-700/50' onClick={scrollRight}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
          </svg>
        </button>
        */}





      </div>
    </div>
  );
}
