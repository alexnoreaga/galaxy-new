import React from 'react'
import { FaWhatsapp } from "react-icons/fa6";


export const TombolWa = () => {
  return (
    <>
        <div className="p-2 sm:py-3 shadow-xl fixed bottom-20 sm:bottom-16 text-right right-0 backdrop-blur-md rounded-l-full bg-gradient-to-r from-green-400/80 to-green-700/80">
            <div className=' text-sm md:text-md flex text-white flex-row items-center gap-1 '>
            <FaWhatsapp className='text-xl drop-shadow-lg'/>
            <div className='hidden sm:block drop-shadow-lg'>Chat WA</div>
            <div className='block sm:hidden drop-shadow-lg'>Chat</div>
            </div>
        </div>
    </>
  )
}
