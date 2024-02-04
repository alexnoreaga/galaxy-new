import React from 'react'
import { FaWhatsapp } from "react-icons/fa6";


export const TombolWa = () => {
  function getUrl(){
    console.log('posisi window saat ini ',window.location.href)
    window.open('https://api.whatsapp.com/send?phone=6282111311131&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk%20yang%20dilink%20ini%20'+window.location.href , '_blank');
  }


  return (
    <>
        
        <div onClick={getUrl} className="cursor-pointer p-2 sm:py-3 shadow-xl fixed bottom-20 sm:bottom-16 text-right right-0 backdrop-blur-md rounded-l-full bg-gradient-to-r from-green-400/80 to-green-700/80">
            <div className=' text-sm md:text-md flex text-white flex-row items-center gap-1 '>
            <FaWhatsapp className='text-xl drop-shadow-lg'/>
            <div className='hidden sm:block drop-shadow-lg'>Chat WA</div>
            <div className='block sm:hidden drop-shadow-lg'>Chat</div>
            </div>
        </div>
    </>
  )
}
