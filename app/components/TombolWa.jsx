import React from 'react'
import { FaWhatsapp } from "react-icons/fa6";


export const TombolWa = () => {
  function getUrl() {
    window.open(
      'https://api.whatsapp.com/send?phone=6282111311131&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk%20yang%20dilink%20ini%20' + window.location.href,
      '_blank'
    );
  }

  return (
    <div
      onClick={getUrl}
      className="fixed bottom-40 right-4 sm:bottom-8 sm:right-6 md:bottom-40 z-50 cursor-pointer group"
    >
      <div className="relative flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/70 sm:bg-white/60 shadow-lg sm:shadow-2xl border border-green-200 hover:bg-green-600 transition-all duration-200 backdrop-blur-xl">
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-green-400 opacity-40 animate-ping"></span>
        </span>
        <FaWhatsapp className="text-2xl sm:text-4xl text-green-600 group-hover:text-white drop-shadow-md transition-all z-10" />
        <span className="absolute left-14 sm:left-20 top-1/2 -translate-y-1/2 hidden sm:block bg-green-600 text-white px-4 py-2 rounded-full shadow-lg font-semibold text-base opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">Chat WhatsApp</span>
      </div>
    </div>
  );
}
