// "Tanya Grisela" smart-bar — DESKTOP homepage only. One slim row (avatar + prompt pill +
// suggestion chips) that opens the existing GriselaGeneralChat modal. Mobile already has the
// Grisela tab in the bottom nav, so this renders md+ only. Styled in Grisela's rose language
// (matches the product page's Tanya AI card) so she's recognizable across the site.

import {useState} from 'react';
import {GriselaGeneralChat} from '~/components/GriselaGeneralChat';

const CHIPS = [
  'Kamera vlog untuk pemula?',
  'Mirrorless di bawah 15 juta?',
  'Bisa nego harga? 🤝',
];

export function GriselaHomeBar() {
  const [open, setOpen] = useState(false);
  const openChat = () => setOpen(true);

  return (
    <>
      <div className="hidden md:block relative mx-auto md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mt-3">
        <div className="flex items-center gap-4 rounded-2xl border border-rose-100 px-4 py-2.5"
          style={{background: 'linear-gradient(90deg, rgba(255,241,242,0.8) 0%, #ffffff 45%, rgba(255,241,242,0.45) 100%)'}}>

          {/* Avatar + identity */}
          <button type="button" onClick={openChat} className="flex items-center gap-2.5 flex-shrink-0 group">
            <span className="relative">
              <img
                src="/Grisela.png"
                alt="Grisela"
                width={38}
                height={38}
                draggable={false}
                className="w-[38px] h-[38px] rounded-full object-cover border border-rose-200 group-hover:scale-105 transition-transform duration-200 select-none"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[13px] font-bold text-gray-900">
                Tanya Grisela <span className="text-rose-600">· AI Galaxy</span>
              </span>
              <span className="block text-[11px] text-gray-500">Online 24 jam — rekomendasi, stok, nego</span>
            </span>
          </button>

          {/* Prompt pill (fake input → opens chat) */}
          <button
            type="button"
            onClick={openChat}
            className="flex-1 min-w-0 flex items-center justify-between gap-3 bg-white border border-rose-200 hover:border-rose-300 rounded-xl px-4 py-2 text-sm text-gray-400 transition-colors text-left"
          >
            <span className="truncate">Bingung pilih kamera? Tanya aja di sini…</span>
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.155.75.75 0 000-1.114A28.897 28.897 0 003.105 2.288z" />
              </svg>
            </span>
          </button>

          {/* Suggestion chips */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={openChat}
                className="text-[12px] text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <GriselaGeneralChat open={open} onClose={() => setOpen(false)} source="home-bar" />
    </>
  );
}
