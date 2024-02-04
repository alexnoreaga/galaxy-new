import React from 'react'
import { FaWhatsapp } from "react-icons/fa6";


export const FooterColumn1 = () => {
  return (
    <div className='py-3 m-1'>
        <img height={50} width={110} src='https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-final-bw.webp?v=1707024717' alt='Logo Galaxy Camera'/>
        {/* <div className='text-white text-sm mb-2'>Galaxy Camera merupakan salah satu toko e-commerce dan juga offline store yang berlokasi di Tangerang, Depok dan Jakarta</div>
        <div className='flex flex-row gap-1 mb-1'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <div className='text-white text-sm font-bold'>Alamat :</div>
            <div className='text-white text-sm'>Ruko Mall Metropolis Towns Square, Blok GM3 No.6, Kelapa Indah, Tangerang</div>
        </div>

        <div className='flex flex-row gap-1 mb-1'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <div className='text-white text-sm font-bold'>Alamat :</div>
            <div className='text-white text-sm'>Mall Depok Town Square, Lantai 2 Blok SS2 No.8 Beji, Depok</div>
        </div> */}

        <div className='text-white text-sm mb-2'>Lihat semua lokasi outlet Galaxy Camera Store</div>
        
        <div className='text-white text-sm mb-2'>Telp / Whatsapp</div>
        <a href="https://api.whatsapp.com/send?phone=6282111311131&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk" target="_blank" className='mb-2 flex items-center gap-1 text-white hover:no-underline'>
            <FaWhatsapp size="1.2em" />
            <div className='text-white text-sm font-bold'>0821-1131-1131</div>
        </a>

        <a href="https://api.whatsapp.com/send?phone=6282122335511&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk" target="_blank" className='mb-2 flex items-center gap-1 text-white hover:no-underline'>
            <FaWhatsapp size="1.2em" />
            <div className='text-white text-sm font-bold'>0821-2233-5511</div>
        </a>


    </div>
  )
}
