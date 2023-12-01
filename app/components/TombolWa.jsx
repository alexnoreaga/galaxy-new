import React from 'react'
import { FaWhatsapp } from "react-icons/fa6";


export const TombolWa = () => {
  return (
    <>
        <div className="shadow-xl fixed bottom-20 text-right right-6 rounded-full bg-gradient-to-r from-green-400 to-green-600">
            <div className='text-md flex text-white flex-row items-center gap-1 p-2'>
            <FaWhatsapp className='text-xl'/>
            <div>Chat Admin</div>
            </div>
        </div>
    </>
  )
}
