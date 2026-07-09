import React, { useState, useEffect } from 'react';
import { FaWhatsapp } from "react-icons/fa6";
import { useLocation } from 'react-router-dom';
import { GriselaGeneralChat } from '~/components/GriselaGeneralChat';

const ADMIN_START = 9;  // 09.00 WIB
const ADMIN_END = 19;   // 19.00 WIB

function getWibHour() {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }).format(new Date())
  );
}

export const TombolWa = () => {
  // null until mounted — avoids SSR/client hydration mismatch on time-dependent UI
  const [wibHour, setWibHour] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setWibHour(getWibHour());
    const timer = setInterval(() => setWibHour(getWibHour()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const adminOnline = wibHour === null || (wibHour >= ADMIN_START && wibHour < ADMIN_END);

  function openWa() {
    window.open(
      'https://api.whatsapp.com/send?phone=6282111311131&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk%20yang%20dilink%20ini%20' + window.location.href,
      '_blank'
    );
  }

  function openGrisela() {
    // On product pages the full-context chat exists — open it via event
    if (location.pathname.includes('/products/')) {
      window.dispatchEvent(new CustomEvent('grisela:open'));
    } else {
      setChatOpen(true);
    }
  }

  if (adminOnline) {
    return (
      <div
        onClick={openWa}
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

  // Off-hours: Grisela takes over the floating button
  return (
    <>
      <div
        onClick={openGrisela}
        className="fixed bottom-40 right-4 sm:bottom-8 sm:right-6 md:bottom-40 z-50 cursor-pointer group"
      >
        <div className="relative w-12 h-12 sm:w-20 sm:h-20">
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-rose-400 opacity-40 animate-ping"></span>
          </span>
          <img
            src="/Grisela.png"
            alt="Tanya Grisela"
            draggable={false}
            className="relative w-full h-full rounded-full object-cover border-2 border-rose-300 shadow-lg sm:shadow-2xl group-hover:scale-105 transition-transform duration-200 select-none"
          />
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-400 border-2 border-white" />
          <span className="absolute right-14 sm:right-24 top-1/2 -translate-y-1/2 hidden sm:block bg-rose-600 text-white px-4 py-2 rounded-full shadow-lg font-semibold text-base opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
            Tanya Grisela — Online 24 Jam
          </span>
        </div>
      </div>

      <GriselaGeneralChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        source="floating-button"
      />
    </>
  );
};
