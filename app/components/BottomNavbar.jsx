import React, { useState } from 'react'
import { Link, useLocation } from '@remix-run/react';
import { GriselaGeneralChat } from '~/components/GriselaGeneralChat';

export const BottomNavbar = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  function openGrisela() {
    // Product pages have the full-context chat — open it via event
    if (location.pathname.includes('/products/')) {
      window.dispatchEvent(new CustomEvent('grisela:open', { detail: { source: 'bottom-nav' } }));
    } else {
      setChatOpen(true);
    }
  }

  return (
    <>
      <div className="sm:block md:hidden fixed bottom-0 left-0 z-50 w-full bg-white/80 backdrop-blur-lg border-t border-gray-100/50 shadow-2xl">
        <div className="grid grid-cols-5 max-w-lg mx-auto px-2">
          {/* Home */}
          <Link className="m-auto" prefetch="intent" to="/">
            <button type="button" className="inline-flex flex-col items-center justify-center py-3 px-2 group relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-600 group-hover:text-blue-600 transition-colors duration-300 relative z-10 group-hover:scale-110 transform transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
              <p className="text-[10px] font-semibold text-gray-600 group-hover:text-blue-600 transition-colors duration-300 relative z-10">Home</p>
            </button>
          </Link>

          {/* Search */}
          <Link className="m-auto" prefetch="intent" to="/search">
            <button type="button" className="inline-flex flex-col items-center justify-center py-3 px-2 group relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-600 group-hover:text-blue-600 transition-colors duration-300 relative z-10 group-hover:scale-110 transform transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p className="text-[10px] font-semibold text-gray-600 group-hover:text-blue-600 transition-colors duration-300 relative z-10">Cari</p>
            </button>
          </Link>

          {/* FLASH SALE — elevated center button */}
          <Link className="m-auto relative" prefetch="intent" to="/flash-sale" aria-label="Flash Sale">
            <div className="inline-flex flex-col items-center justify-center pb-1.5 px-2 -mt-5">
              <div
                className="relative flex items-center justify-center w-12 h-12 rounded-full border-4 border-white"
                style={{ background: 'linear-gradient(135deg, #e53935 0%, #f4511e 100%)', boxShadow: '0 4px 14px rgba(229,57,53,0.45)' }}
              >
                <span className="absolute inline-flex h-11 w-11 rounded-full bg-red-400 opacity-30 animate-ping" />
                <span className="relative text-xl leading-none">⚡</span>
              </div>
              <p className="text-[10px] font-bold text-red-600 mt-0.5">Flash Sale</p>
            </div>
          </Link>

          {/* Categories */}
          <Link className="m-auto" prefetch="intent" to="/collections">
            <button type="button" className="inline-flex flex-col items-center justify-center py-3 px-2 group relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-600 group-hover:text-blue-600 transition-colors duration-300 relative z-10 group-hover:scale-110 transform transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <p className="text-[10px] font-semibold text-gray-600 group-hover:text-blue-600 transition-colors duration-300 relative z-10">Kategori</p>
            </button>
          </Link>

          {/* Tanya Grisela — AI chat */}
          <button type="button" onClick={openGrisela} className="m-auto inline-flex flex-col items-center justify-center py-3 px-2 group relative" aria-label="Tanya Grisela">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative mb-1">
              <img
                src="/Grisela.png"
                alt="Grisela"
                draggable={false}
                className="w-6 h-6 rounded-full object-cover border border-rose-200 relative z-10 group-hover:scale-110 transform transition-transform duration-300 select-none"
              />
              <span className="absolute -bottom-0.5 -right-0.5 z-20 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <p className="text-[10px] font-semibold text-rose-600 relative z-10">Grisela</p>
          </button>
        </div>
      </div>

      <GriselaGeneralChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        source="bottom-nav"
      />
    </>
  );
};
