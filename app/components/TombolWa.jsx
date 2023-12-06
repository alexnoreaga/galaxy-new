import React from 'react'
import { FaWhatsapp } from "react-icons/fa6";


export const TombolWa = () => {
  return (
    <>
        <div className=" shadow-xl fixed bottom-16 text-right right-0 backdrop-blur-md rounded-l-full bg-gradient-to-r from-green-400/80 to-green-600/80">
            <div className='text-sm md:text-md flex text-white flex-row items-center gap-1 p-2'>
            <FaWhatsapp className='text-xl'/>
            <div>Chat Admin</div>
            </div>
        </div>
    </>
  )
}
