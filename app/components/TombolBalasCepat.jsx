import React from 'react';
import { FaRocketchat } from "react-icons/fa6";
import { FaKey } from "react-icons/fa6";

export const TombolBalasCepat = ({setBukaModalBalasCepat}) => {
  return (
    <>  
    <div  onClick={()=>setBukaModalBalasCepat(true)} className="cursor-pointer p-2 sm:py-3 shadow-xl fixed bottom-32 text-right right-0 backdrop-blur-md rounded-l-full bg-gradient-to-r from-sky-400/80 to-sky-700/80">
    <div className=' text-sm md:text-md flex text-white flex-row items-center gap-1 '>
    {/* <FaWhatsapp className='text-xl drop-shadow-lg'/> */}
    <FaKey className='text-xl drop-shadow-lg'/>

    <div className='hidden sm:block drop-shadow-lg'>Quick Reply</div>
    <div className='block sm:hidden drop-shadow-lg'>QR</div>
    </div>
</div>
</>
  )
}
