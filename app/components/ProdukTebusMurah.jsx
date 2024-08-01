import { Link } from '@remix-run/react';
import {useRef} from "react";


export const ProdukTebusMurah = ({related}) => {

    console.log('related disini ',related)

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


  return (
    <div className=''>
    <div className='font-bold text-lg text-white mb-2'>Tebus Murah!</div>
    <div className='relative flex items-center'>
    <div className="flex overflow-x-auto hide-scroll-bar snap-x items-center" ref={scrollRef}>

        {related[1]?.map((relate,index)=>{
            return(
              <div className="w-60 gap-1 p-1 border shadow-md bg-white rounded-md relative flex-none mr-4 snap-center" key={relate?.product?.title}>
              <Link  
                to={`/products/${relate?.product?.handle}`}>
                <div className="flex flex-row">
                <img src={relate?.product?.featuredImage.url} className='h-28 w-28 rounded-md' alt={relate?.product?.title}/>
                <div className="flex flex-col">
                    <div className='text-xs font-bold pt-1'>{relate?.product?.title> 50 ? relate?.product?.title.substring(0, 50) + '...' : relate?.product?.title}</div>
                    <div className="text-rose-700 font-bold text-sm mt-2">Rp{parseFloat(related[0][index].metaobject.fields[0].value).toLocaleString("id-ID")}</div>
                </div>
                </div>
                </Link>
              </div>
            )
          })}

</div>

<button className='absolute left-1 rounded-full p-1 bg-neutral-700/50' onClick={scrollLeft}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
    </svg>
    </button>

    <button className='absolute right-1 rounded-full p-1 bg-neutral-700/50' onClick={scrollRight}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
</svg>
</button>




    </div>
    </div>
  )
}
