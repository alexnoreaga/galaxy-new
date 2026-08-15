// "Tanya Grisela" smart-bar — DESKTOP homepage only. One slim row (avatar + prompt pill +
// suggestion chips) that opens the existing GriselaGeneralChat modal. Mobile already has the
// Grisela tab in the bottom nav, so this renders md+ only.
//
// Design: premium "AI concierge" — house slate gradient inside a rose→gold gradient hairline
// border, dot texture, Grisela's rose glow behind her avatar, frosted chips, and a solid white
// prompt pill that pops on dark (same trick as the masthead search).

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
        {/* Gradient hairline border — the "AI product" frame */}
        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-rose-500/60 via-slate-600/30 to-amber-400/50">
          <div
            className="relative overflow-hidden rounded-[15px] flex items-center gap-4 px-4 py-2.5"
            style={{background: 'linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #26344a 100%)'}}
          >
            {/* Texture + glows: rose behind Grisela, faint gold at the far end */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
              style={{opacity: 0.05, backgroundImage: 'radial-gradient(circle at center, #fff 0.6px, transparent 0.6px)', backgroundSize: '22px 22px'}} />
            <div aria-hidden="true" className="absolute -left-8 -top-10 w-44 h-44 rounded-full bg-rose-500/25 blur-3xl pointer-events-none" />
            <div aria-hidden="true" className="absolute -right-10 -bottom-12 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

            {/* Avatar + identity */}
            <button type="button" onClick={openChat} className="relative flex items-center gap-3 flex-shrink-0 group">
              <span className="relative">
                <img
                  src="/Grisela.png"
                  alt="Grisela"
                  width={40}
                  height={40}
                  draggable={false}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-400/60 shadow-[0_0_18px_rgba(244,63,94,0.4)] group-hover:scale-105 transition-transform duration-200 select-none"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </span>
              <span className="text-left leading-tight">
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                  Tanya Grisela
                  <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wide uppercase text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full px-1.5 py-[2px]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2 h-2">
                      <path d="M10 1l1.9 5.1L17 8l-5.1 1.9L10 15l-1.9-5.1L3 8l5.1-1.9L10 1z" />
                    </svg>
                    AI
                  </span>
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">Online 24 jam — rekomendasi, stok, nego</span>
              </span>
            </button>

            {/* Prompt pill — solid white, pops on the dark bar (masthead-search trick) */}
            <button
              type="button"
              onClick={openChat}
              className="relative flex-1 min-w-0 flex items-center justify-between gap-3 bg-white hover:bg-gray-50 rounded-xl pl-4 pr-1.5 py-1.5 text-sm text-gray-400 shadow-sm transition-colors text-left"
            >
              <span className="truncate">Bingung pilih kamera? Tanya aja di sini…</span>
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.155.75.75 0 000-1.114A28.897 28.897 0 003.105 2.288z" />
                </svg>
              </span>
            </button>

            {/* Suggestion chips — frosted glass */}
            <div className="relative hidden lg:flex items-center gap-2 flex-shrink-0">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={openChat}
                  className="text-[12px] text-slate-200 bg-white/[0.07] ring-1 ring-white/15 hover:bg-white/15 hover:text-white rounded-full px-3 py-1.5 whitespace-nowrap transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <GriselaGeneralChat open={open} onClose={() => setOpen(false)} source="home-bar" />
    </>
  );
}
