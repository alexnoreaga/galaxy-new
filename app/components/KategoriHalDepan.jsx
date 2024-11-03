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

  console.log('Ini adalah')
  console.log(related)
  if (!related) return null;

  return (
    <div className='mb-2'>


<div className='flex flex-row items-center justify-between m-1 mb-2 mt-2'>
        <div className="text-gray-800 text-sm sm:text-lg sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead">
          Kategori Populer
        </div>
        <Link to={`/collections/`}>
        <div className='text-gray-500 block mx-1 text-sm sm:text-md border border-gray-200 px-1 rounded-lg'>Lihat Semua</div>
        </Link>
      </div>



    
    <div className='relative flex items-center'>
    <div className="flex overflow-x-auto snap-x items-center scroll-smooth" ref={scrollRef}>

        {related?.nodes.map((relate)=>{
            return(
              <div className="gap-1 p-1 mr-3 w-full" key={relate?.id}>
              <Link  
                to={`/collections/${relate?.handle}`}>
                <div className="flex flex-col items-center w-16">
                <img src={relate?.image?.url} className='w-full p-1' alt={relate?.title}/>
                <div className='mb-2 font-medium text-gray-800 whitespace-normal text-copy text-center text-xs'>{relate?.title.length > 50 ? relate?.title.substring(0, 50) + '...' : relate.title}</div>
            
                </div>
                </Link>
              </div>
            )
          })}

</div>

{/* <button className='absolute left-1 rounded-full p-1 bg-neutral-700/50' onClick={scrollLeft}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
    </svg>
    </button>

    <button className='absolute right-1 rounded-full p-1 bg-neutral-700/50' onClick={scrollRight}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
</svg>
</button> */}




    </div>
    </div>
  )
}
