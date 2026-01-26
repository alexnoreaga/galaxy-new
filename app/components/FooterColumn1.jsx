import React from 'react'
import { FaWhatsapp } from "react-icons/fa6";
import { FaEnvelope } from "react-icons/fa6";


export const FooterColumn1 = () => {
  return (
    <div className='py-3 m-1'>
        <img height={50} width={110} src='https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-final-bw.webp?v=1707024717' alt='Logo Galaxy Camera'/>


        <div className='text-white text-sm mb-2'>Lihat semua lokasi outlet Galaxy Camera Store</div>
        
        <div className='text-white text-sm mb-2'>Telp / Whatsapp</div>
        {/* <a href="https://api.whatsapp.com/send?phone=6282111311131&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk" target="_blank" className='mb-2 flex items-center gap-1 text-white hover:no-underline'>
            <FaWhatsapp size="1.2em" />
            <div className='text-white text-sm font-bold'>0821-1131-1131</div>
        </a> */}

        <a href="https://api.whatsapp.com/send?phone=6282122335511&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk" target="_blank" className='mb-2 flex items-center gap-1 text-white hover:no-underline'>
            <FaWhatsapp size="1.2em" />
            <div className='text-white text-sm font-bold'>0821-2233-5511</div>
        </a>

        <div className='mb-2 flex items-center gap-1 text-white hover:no-underline'>
            <FaEnvelope size="1.2em" />
            <div className='text-white text-sm font-bold'>sales@galaxy.co.id</div>
        </div>


    </div>
  )
}
