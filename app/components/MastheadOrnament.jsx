// ── Seasonal masthead ornaments ───────────────────────────────────────────────
// Each theme is a small SVG illustration drawn on the same 240×64 stage (edge of the
// charcoal masthead; mirrored on the right side by the caller). Themes run FULL MONTHS
// (WIB) via MONTH_THEME below; every month without an entry falls back to 'batik'.
//
// Preview any theme without waiting for its month:  add ?theme=<name> to any URL
// (e.g. galaxy.co.id/?theme=merdeka). Invalid names are ignored.
//
// Adding a theme: draw a new <XxxPattern id>, register it in THEMES, claim a month in
// MONTH_THEME. Movable holidays (Imlek, Idul Fitri/Adha) drift across months — confirm
// their month assignment once a year.
//
// `id` must be unique per instance: duplicate SVG ids resolve to the first in the DOM.

// ── Batik (default) — gold kawung vine, flowers shrink toward center for depth ──
function BatikPattern({id}) {
  const gold = `url(#${id}-gold)`;
  const goldHi = `url(#${id}-goldHi)`;
  return (
    <svg className="w-full h-full" viewBox="0 0 240 64" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9e08e" />
          <stop offset="55%" stopColor="#e0b34a" />
          <stop offset="100%" stopColor="#a9761f" />
        </linearGradient>
        <linearGradient id={`${id}-goldHi`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="100%" stopColor="#e8b94e" />
        </linearGradient>
        <g id={`${id}-flower`}>
          <ellipse cx="0" cy="-9" rx="4.5" ry="8" />
          <ellipse cx="0" cy="9" rx="4.5" ry="8" />
          <ellipse cx="-9" cy="0" rx="8" ry="4.5" />
          <ellipse cx="9" cy="0" rx="8" ry="4.5" />
        </g>
        <path id={`${id}-leaf`} d="M0 0 Q8 -7 17 0 Q8 7 0 0 Z" />
      </defs>

      <path d="M-8 12 C40 8, 80 46, 140 40 S200 46 244 36" fill="none" stroke={gold} strokeWidth="1" opacity="0.28" />
      <path d="M-8 54 C30 50, 56 30, 96 32 S172 20 244 30" fill="none" stroke={gold} strokeWidth="1.3" opacity="0.55" />

      <use href={`#${id}-leaf`} transform="translate(52,42) rotate(-28) scale(0.9)" fill={gold} opacity="0.45" />
      <use href={`#${id}-leaf`} transform="translate(104,26) rotate(24) scale(0.75)" fill={gold} opacity="0.35" />
      <use href={`#${id}-leaf`} transform="translate(146,38) rotate(-8) scale(0.6)" fill={gold} opacity="0.3" />

      <g fill="none" stroke={gold} strokeWidth="1.5" opacity="0.9">
        <use href={`#${id}-flower`} transform="translate(26,32) scale(1.35)" />
      </g>
      <circle cx="26" cy="32" r="3" fill={goldHi} opacity="0.95" />
      <g fill="none" stroke={gold} strokeWidth="1.3" opacity="0.6">
        <use href={`#${id}-flower`} transform="translate(80,17) rotate(22) scale(0.9)" />
      </g>
      <circle cx="80" cy="17" r="2" fill={goldHi} opacity="0.7" />
      <g fill="none" stroke={gold} strokeWidth="1.2" opacity="0.4">
        <use href={`#${id}-flower`} transform="translate(126,46) rotate(-14) scale(0.65)" />
      </g>
      <circle cx="126" cy="46" r="1.5" fill={goldHi} opacity="0.5" />
      <g fill="none" stroke={gold} strokeWidth="1" opacity="0.28">
        <use href={`#${id}-flower`} transform="translate(168,22) scale(0.5)" />
      </g>

      <g fill={gold}>
        <circle cx="44" cy="20" r="1.4" opacity="0.5" />
        <circle cx="58" cy="14" r="1" opacity="0.4" />
        <circle cx="66" cy="48" r="1.3" opacity="0.45" />
        <circle cx="96" cy="44" r="1" opacity="0.35" />
        <circle cx="112" cy="12" r="1.1" opacity="0.3" />
        <circle cx="150" cy="20" r="1" opacity="0.25" />
        <circle cx="184" cy="40" r="0.9" opacity="0.2" />
      </g>
    </svg>
  );
}

// ── Merdeka (August) — merah-putih pennants on a gold cord + gold fireworks ─────
function MerdekaPattern({id}) {
  const gold = `url(#${id}-gold)`;
  return (
    <svg className="w-full h-full" viewBox="0 0 240 64" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9e08e" />
          <stop offset="55%" stopColor="#e0b34a" />
          <stop offset="100%" stopColor="#a9761f" />
        </linearGradient>
        {/* Pennant triangle, hanging from its top edge */}
        <path id={`${id}-flag`} d="M-6 0 L6 0 L0 13 Z" />
        {/* Fireworks burst: 8 rays + spark tips */}
        <g id={`${id}-burst`} strokeLinecap="round">
          <path d="M0 -4 L0 -10 M0 4 L0 10 M-4 0 L-10 0 M4 0 L10 0 M-2.8 -2.8 L-7 -7 M2.8 -2.8 L7 -7 M-2.8 2.8 L-7 7 M2.8 2.8 L7 7" fill="none" strokeWidth="1.2" />
          <circle cx="0" cy="-11.5" r="0.9" stroke="none" />
          <circle cx="8.5" cy="-8.5" r="0.8" stroke="none" />
          <circle cx="11.5" cy="0" r="0.9" stroke="none" />
          <circle cx="-8.5" cy="8.5" r="0.8" stroke="none" />
        </g>
      </defs>

      {/* Gold cord, dipping across the stage */}
      <path d="M-8 10 C30 26, 70 8, 120 16 S200 12 244 18" fill="none" stroke={gold} strokeWidth="1.3" opacity="0.6" />

      {/* Pennants — big & bright at the edge, smaller & dimmer toward center.
          Alternating merah / putih, tiny gold ring at each attach point. */}
      <g>
        <use href={`#${id}-flag`} transform="translate(16,17) rotate(4) scale(1.35)" fill="#ef4444" opacity="0.95" />
        <circle cx="16" cy="17" r="1.2" fill={gold} />
        <use href={`#${id}-flag`} transform="translate(44,22) rotate(-3) scale(1.15)" fill="#ffffff" opacity="0.9" />
        <circle cx="44" cy="22" r="1.1" fill={gold} />
        <use href={`#${id}-flag`} transform="translate(72,14) rotate(5) scale(1)" fill="#ef4444" opacity="0.8" />
        <circle cx="72" cy="14" r="1" fill={gold} />
        <use href={`#${id}-flag`} transform="translate(100,17) rotate(-4) scale(0.85)" fill="#ffffff" opacity="0.65" />
        <circle cx="100" cy="17" r="0.9" fill={gold} opacity="0.8" />
        <use href={`#${id}-flag`} transform="translate(128,15) rotate(3) scale(0.7)" fill="#ef4444" opacity="0.5" />
        <use href={`#${id}-flag`} transform="translate(154,17) rotate(-3) scale(0.55)" fill="#ffffff" opacity="0.38" />
        <use href={`#${id}-flag`} transform="translate(178,16) rotate(2) scale(0.45)" fill="#ef4444" opacity="0.28" />
      </g>

      {/* Fireworks — a bright gold burst near the edge, echoes fading inward */}
      <use href={`#${id}-burst`} transform="translate(26,48) scale(1.15)" stroke={gold} fill={gold} opacity="0.85" />
      <use href={`#${id}-burst`} transform="translate(64,44) scale(0.7) rotate(20)" stroke="#f87171" fill="#f87171" opacity="0.55" />
      <use href={`#${id}-burst`} transform="translate(104,50) scale(0.55) rotate(-12)" stroke={gold} fill={gold} opacity="0.4" />
      <use href={`#${id}-burst`} transform="translate(146,42) scale(0.4)" stroke="#ffffff" fill="#ffffff" opacity="0.3" />

      {/* Sparkle dust */}
      <g fill={gold}>
        <circle cx="46" cy="52" r="1.2" opacity="0.5" />
        <circle cx="86" cy="38" r="1" opacity="0.4" />
        <circle cx="122" cy="34" r="0.9" opacity="0.3" />
        <circle cx="166" cy="48" r="0.9" opacity="0.25" />
        <circle cx="192" cy="30" r="0.8" opacity="0.2" />
      </g>
    </svg>
  );
}

// ── Imlek (February) — red lanterns, gold plum blossoms, cloud swirls ──────────
function ImlekPattern({id}) {
  const gold = `url(#${id}-gold)`;
  const goldHi = `url(#${id}-goldHi)`;
  return (
    <svg className="w-full h-full" viewBox="0 0 240 64" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9e08e" />
          <stop offset="55%" stopColor="#e0b34a" />
          <stop offset="100%" stopColor="#a9761f" />
        </linearGradient>
        <linearGradient id={`${id}-goldHi`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="100%" stopColor="#e8b94e" />
        </linearGradient>
        {/* Lantern: gold caps, red body with gold ribs, tassel */}
        <g id={`${id}-lantern`}>
          <rect x="-5" y="-15" width="10" height="3" rx="1" fill={`url(#${id}-gold)`} />
          <ellipse cx="0" cy="0" rx="10" ry="11.5" fill="#dc2626" />
          <ellipse cx="0" cy="0" rx="6.5" ry="11.5" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="0.7" opacity="0.7" />
          <ellipse cx="0" cy="0" rx="3" ry="11.5" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="0.7" opacity="0.7" />
          <rect x="-4" y="11.5" width="8" height="2.5" rx="1" fill={`url(#${id}-gold)`} />
          <line x1="0" y1="14" x2="0" y2="19" stroke={`url(#${id}-gold)`} strokeWidth="0.8" />
          <circle cx="0" cy="20.5" r="1.3" fill="#ef4444" />
        </g>
        {/* Plum blossom: five round petals + gold heart */}
        <g id={`${id}-blossom`} fill="none">
          <circle cx="0" cy="-4.2" r="2.6" />
          <circle cx="4" cy="-1.3" r="2.6" />
          <circle cx="2.5" cy="3.4" r="2.6" />
          <circle cx="-2.5" cy="3.4" r="2.6" />
          <circle cx="-4" cy="-1.3" r="2.6" />
        </g>
      </defs>

      {/* Hanging cords */}
      <line x1="26" y1="-2" x2="26" y2="11" stroke={gold} strokeWidth="0.8" opacity="0.7" />
      <line x1="74" y1="-2" x2="74" y2="9" stroke={gold} strokeWidth="0.7" opacity="0.5" />
      <line x1="118" y1="-2" x2="118" y2="18" stroke={gold} strokeWidth="0.6" opacity="0.35" />

      {/* Lanterns — big at the edge, fading inward */}
      <use href={`#${id}-lantern`} transform="translate(26,26) scale(1.15)" opacity="0.95" />
      <use href={`#${id}-lantern`} transform="translate(74,20) scale(0.8)" opacity="0.65" />
      <use href={`#${id}-lantern`} transform="translate(118,29) scale(0.55)" opacity="0.4" />

      {/* Blossom branch drifting toward center */}
      <path d="M44 52 C90 44, 150 50, 244 42" fill="none" stroke={gold} strokeWidth="1" opacity="0.4" />
      <g stroke={gold} strokeWidth="1.1">
        <use href={`#${id}-blossom`} transform="translate(56,48) scale(1.05)" opacity="0.75" />
        <use href={`#${id}-blossom`} transform="translate(96,46) scale(0.8)" opacity="0.5" />
        <use href={`#${id}-blossom`} transform="translate(140,47) scale(0.6)" opacity="0.35" />
        <use href={`#${id}-blossom`} transform="translate(178,44) scale(0.45)" opacity="0.22" />
      </g>
      <circle cx="56" cy="48" r="1.8" fill={goldHi} opacity="0.9" />
      <circle cx="96" cy="46" r="1.3" fill={goldHi} opacity="0.6" />
      <circle cx="140" cy="47" r="1" fill={goldHi} opacity="0.4" />

      {/* Cloud swirls + sparkle */}
      <path d="M148 16 a4.5 4.5 0 1 1 9 0 a3 3 0 1 1 6 0" fill="none" stroke={gold} strokeWidth="0.9" opacity="0.35" />
      <path d="M186 30 a3.5 3.5 0 1 1 7 0 a2.4 2.4 0 1 1 4.8 0" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.22" />
      <g fill={gold}>
        <circle cx="48" cy="14" r="1.2" opacity="0.5" />
        <circle cx="98" cy="12" r="1" opacity="0.35" />
        <circle cx="160" cy="40" r="0.9" opacity="0.25" />
        <circle cx="204" cy="18" r="0.8" opacity="0.2" />
      </g>
    </svg>
  );
}

// ── Ramadan / Idul Fitri (March) — crescent, ketupat, star sparkles ────────────
function FitriPattern({id}) {
  const gold = `url(#${id}-gold)`;
  const goldHi = `url(#${id}-goldHi)`;
  return (
    <svg className="w-full h-full" viewBox="0 0 240 64" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9e08e" />
          <stop offset="55%" stopColor="#e0b34a" />
          <stop offset="100%" stopColor="#a9761f" />
        </linearGradient>
        <linearGradient id={`${id}-goldHi`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="100%" stopColor="#e8b94e" />
        </linearGradient>
        {/* Crescent moon */}
        <path id={`${id}-crescent`} d="M0 -12 A12 12 0 1 0 0 12 A9 9 0 1 1 0 -12 Z" />
        {/* Four-point star */}
        <path id={`${id}-star4`} d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" />
        {/* Ketupat: woven diamond */}
        <g id={`${id}-ketupat`}>
          <g transform="rotate(45)">
            <rect x="-7.5" y="-7.5" width="15" height="15" rx="1.5" fill="none" />
            <line x1="-2.5" y1="-7.5" x2="-2.5" y2="7.5" />
            <line x1="2.5" y1="-7.5" x2="2.5" y2="7.5" />
            <line x1="-7.5" y1="-2.5" x2="7.5" y2="-2.5" />
            <line x1="-7.5" y1="2.5" x2="7.5" y2="2.5" />
          </g>
        </g>
      </defs>

      {/* Grand crescent at the edge + companion star */}
      <use href={`#${id}-crescent`} transform="translate(28,30) scale(1.5) rotate(-20)" fill={gold} opacity="0.9" />
      <use href={`#${id}-star4`} transform="translate(44,14) scale(0.95)" fill={goldHi} opacity="0.9" />

      {/* Ketupat strung from the top, shrinking inward — gold weave with a soft green sheen */}
      <line x1="78" y1="-2" x2="78" y2="12" stroke={gold} strokeWidth="0.8" opacity="0.6" />
      <line x1="114" y1="-2" x2="114" y2="10" stroke={gold} strokeWidth="0.7" opacity="0.45" />
      <line x1="148" y1="-2" x2="148" y2="14" stroke={gold} strokeWidth="0.6" opacity="0.3" />
      <g fill="none" stroke={gold} strokeWidth="1.1">
        <use href={`#${id}-ketupat`} transform="translate(78,25) scale(1.05)" opacity="0.8" />
        <use href={`#${id}-ketupat`} transform="translate(114,22) scale(0.8)" opacity="0.55" />
        <use href={`#${id}-ketupat`} transform="translate(148,26) scale(0.6)" opacity="0.35" />
      </g>
      <g fill="none" stroke="#86efac" strokeWidth="0.6" opacity="0.4">
        <use href={`#${id}-ketupat`} transform="translate(78,25) scale(0.75)" />
        <use href={`#${id}-ketupat`} transform="translate(114,22) scale(0.55)" />
      </g>

      {/* Star field fading toward center */}
      <use href={`#${id}-star4`} transform="translate(64,48) scale(0.7)" fill={gold} opacity="0.6" />
      <use href={`#${id}-star4`} transform="translate(100,46) scale(0.55)" fill={gold} opacity="0.45" />
      <use href={`#${id}-star4`} transform="translate(134,44) scale(0.45)" fill={gold} opacity="0.3" />
      <use href={`#${id}-star4`} transform="translate(172,24) scale(0.4)" fill={gold} opacity="0.22" />

      <g fill={gold}>
        <circle cx="56" cy="12" r="1.1" opacity="0.45" />
        <circle cx="92" cy="10" r="0.9" opacity="0.35" />
        <circle cx="126" cy="12" r="0.8" opacity="0.25" />
        <circle cx="188" cy="40" r="0.8" opacity="0.18" />
      </g>
    </svg>
  );
}

// ── Idul Adha (May) — mosque dome, minaret, geometric stars: quiet & elegant ───
function AdhaPattern({id}) {
  const gold = `url(#${id}-gold)`;
  return (
    <svg className="w-full h-full" viewBox="0 0 240 64" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9e08e" />
          <stop offset="55%" stopColor="#e0b34a" />
          <stop offset="100%" stopColor="#a9761f" />
        </linearGradient>
        {/* Onion dome with finial */}
        <g id={`${id}-dome`} fill="none">
          <path d="M-14 16 C-14 2 -7 -5 0 -12 C7 -5 14 2 14 16 Z" />
          <line x1="-17" y1="16" x2="17" y2="16" />
          <line x1="0" y1="-12" x2="0" y2="-17" />
          <circle cx="0" cy="-18.5" r="1.3" />
        </g>
        {/* Khatam: 8-point star from two overlapping squares */}
        <g id={`${id}-khatam`} fill="none">
          <rect x="-5" y="-5" width="10" height="10" />
          <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" />
        </g>
        <path id={`${id}-crescent`} d="M0 -12 A12 12 0 1 0 0 12 A9 9 0 1 1 0 -12 Z" />
      </defs>

      {/* Mosque dome at the edge, small crescent floating above */}
      <use href={`#${id}-dome`} transform="translate(28,38) scale(1.35)" stroke={gold} strokeWidth="1.4" opacity="0.85" />
      <use href={`#${id}-crescent`} transform="translate(54,12) scale(0.55) rotate(-18)" fill={gold} opacity="0.7" />

      {/* Minaret */}
      <g stroke={gold} strokeWidth="1" opacity="0.5" fill="none">
        <line x1="72" y1="54" x2="72" y2="30" />
        <line x1="78" y1="54" x2="78" y2="30" />
        <path d="M70 30 C70 24 75 21 75 21 C75 21 80 24 80 30 Z" />
      </g>

      {/* Geometric stars fading inward */}
      <use href={`#${id}-khatam`} transform="translate(106,26) scale(1)" stroke={gold} strokeWidth="1" opacity="0.5" />
      <use href={`#${id}-khatam`} transform="translate(140,42) scale(0.7)" stroke={gold} strokeWidth="0.9" opacity="0.35" />
      <use href={`#${id}-khatam`} transform="translate(172,20) scale(0.5)" stroke={gold} strokeWidth="0.8" opacity="0.24" />

      {/* Grounding arc + dots */}
      <path d="M-8 56 C60 50, 150 54, 244 48" fill="none" stroke={gold} strokeWidth="1" opacity="0.3" />
      <g fill={gold}>
        <circle cx="94" cy="48" r="1" opacity="0.4" />
        <circle cx="124" cy="14" r="0.9" opacity="0.3" />
        <circle cx="156" cy="30" r="0.8" opacity="0.22" />
        <circle cx="196" cy="38" r="0.8" opacity="0.16" />
      </g>
    </svg>
  );
}

// ── Harbolnas 11.11 (November) — gift boxes, sale tag, confetti ────────────────
function HarbolnasPattern({id}) {
  const gold = `url(#${id}-gold)`;
  return (
    <svg className="w-full h-full" viewBox="0 0 240 64" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9e08e" />
          <stop offset="55%" stopColor="#e0b34a" />
          <stop offset="100%" stopColor="#a9761f" />
        </linearGradient>
        {/* Gift: red box, gold ribbon + bow */}
        <g id={`${id}-gift`}>
          <rect x="-9" y="-7" width="18" height="14" rx="1.5" fill="#dc2626" />
          <line x1="0" y1="-7" x2="0" y2="7" stroke={`url(#${id}-gold)`} strokeWidth="1.6" />
          <line x1="-9" y1="0" x2="9" y2="0" stroke={`url(#${id}-gold)`} strokeWidth="1.6" />
          <path d="M0 -7 C-4 -12 -8.5 -9.5 -3.5 -7 M0 -7 C4 -12 8.5 -9.5 3.5 -7" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="1.2" />
        </g>
        {/* Sale tag with a drawn % */}
        <g id={`${id}-tag`} fill="none">
          <path d="M-9 -5.5 L4 -5.5 L9.5 0 L4 5.5 L-9 5.5 Z" />
          <circle cx="6" cy="0" r="1.2" />
          <circle cx="-5.5" cy="-1.8" r="1.4" />
          <circle cx="-1" cy="2" r="1.4" />
          <line x1="-6.2" y1="3.2" x2="0.2" y2="-3.4" />
        </g>
        <g id={`${id}-burst`} strokeLinecap="round">
          <path d="M0 -4 L0 -9 M0 4 L0 9 M-4 0 L-9 0 M4 0 L9 0 M-2.8 -2.8 L-6.3 -6.3 M2.8 -2.8 L6.3 -6.3 M-2.8 2.8 L-6.3 6.3 M2.8 2.8 L6.3 6.3" fill="none" strokeWidth="1.1" />
        </g>
      </defs>

      {/* Big gift at the edge, echo further in */}
      <use href={`#${id}-gift`} transform="translate(24,40) scale(1.3) rotate(-6)" opacity="0.95" />
      <use href={`#${id}-gift`} transform="translate(96,46) scale(0.7) rotate(8)" opacity="0.5" />

      {/* Sale tag */}
      <use href={`#${id}-tag`} transform="translate(62,20) rotate(-18) scale(1.15)" stroke={gold} strokeWidth="1.2" opacity="0.85" />

      {/* Bursts */}
      <use href={`#${id}-burst`} transform="translate(126,22) scale(0.8)" stroke={gold} opacity="0.5" />
      <use href={`#${id}-burst`} transform="translate(160,44) scale(0.55) rotate(15)" stroke="#f87171" opacity="0.35" />

      {/* Confetti — mixed shapes/colors, thinning toward center */}
      <g>
        <rect x="44" y="46" width="3" height="3" rx="0.5" transform="rotate(25 45.5 47.5)" fill="#ef4444" opacity="0.7" />
        <rect x="84" y="12" width="2.6" height="2.6" rx="0.5" transform="rotate(-20 85.3 13.3)" fill="#ffffff" opacity="0.55" />
        <rect x="112" y="48" width="2.4" height="2.4" rx="0.5" transform="rotate(40 113.2 49.2)" fill={gold} opacity="0.5" />
        <rect x="142" y="12" width="2.2" height="2.2" rx="0.5" transform="rotate(-30 143.1 13.1)" fill="#ef4444" opacity="0.35" />
        <circle cx="70" cy="50" r="1.3" fill={gold} opacity="0.55" />
        <circle cx="104" cy="10" r="1.1" fill="#f87171" opacity="0.4" />
        <circle cx="150" cy="52" r="1" fill="#ffffff" opacity="0.3" />
        <circle cx="180" cy="20" r="0.9" fill={gold} opacity="0.22" />
        <circle cx="200" cy="42" r="0.8" fill="#ef4444" opacity="0.16" />
      </g>
    </svg>
  );
}

// ── Natal + Tahun Baru (December) — bauble, gold star, white snowflakes ────────
function NatalPattern({id}) {
  const gold = `url(#${id}-gold)`;
  const goldHi = `url(#${id}-goldHi)`;
  return (
    <svg className="w-full h-full" viewBox="0 0 240 64" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9e08e" />
          <stop offset="55%" stopColor="#e0b34a" />
          <stop offset="100%" stopColor="#a9761f" />
        </linearGradient>
        <linearGradient id={`${id}-goldHi`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="100%" stopColor="#e8b94e" />
        </linearGradient>
        {/* Bauble: gold cap + red ball with a gold band */}
        <g id={`${id}-bauble`}>
          <circle cx="0" cy="-13.5" r="1.6" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="0.8" />
          <rect x="-2.5" y="-12.5" width="5" height="3.5" rx="1" fill={`url(#${id}-gold)`} />
          <circle cx="0" cy="0" r="9" fill="#dc2626" />
          <path d="M-8.6 -2 Q0 3.5 8.6 -2" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="1" opacity="0.9" />
          <circle cx="-3" cy="-4" r="2" fill="#ffffff" opacity="0.25" />
        </g>
        {/* Six-arm snowflake */}
        <g id={`${id}-flake`} fill="none" strokeLinecap="round">
          <path d="M0 -6 L0 6 M-5.2 -3 L5.2 3 M-5.2 3 L5.2 -3" />
          <path d="M-1.6 -4.6 L0 -3.2 L1.6 -4.6 M-1.6 4.6 L0 3.2 L1.6 4.6" />
        </g>
        {/* Five-point star */}
        <path id={`${id}-star5`} d="M0 -7 L1.9 -2.2 L7 -2.2 L2.9 0.9 L4.4 5.8 L0 2.9 L-4.4 5.8 L-2.9 0.9 L-7 -2.2 L-1.9 -2.2 Z" />
      </defs>

      {/* Garland cord */}
      <path d="M-8 6 C40 18, 100 4, 160 12 S220 8 244 12" fill="none" stroke={gold} strokeWidth="1.1" opacity="0.5" />

      {/* Bauble hanging at the edge */}
      <line x1="24" y1="8" x2="24" y2="16" stroke={gold} strokeWidth="0.8" opacity="0.7" />
      <use href={`#${id}-bauble`} transform="translate(24,32) scale(1.2)" opacity="0.95" />

      {/* Gold stars */}
      <use href={`#${id}-star5`} transform="translate(66,20) scale(1)" fill={goldHi} opacity="0.85" />
      <use href={`#${id}-star5`} transform="translate(150,16) scale(0.55)" fill={gold} opacity="0.4" />

      {/* Snowflakes — white, drifting smaller toward center */}
      <g stroke="#ffffff">
        <use href={`#${id}-flake`} transform="translate(96,36) scale(1)" strokeWidth="1" opacity="0.6" />
        <use href={`#${id}-flake`} transform="translate(124,14) scale(0.8)" strokeWidth="0.9" opacity="0.45" />
        <use href={`#${id}-flake`} transform="translate(148,44) scale(0.65)" strokeWidth="0.9" opacity="0.33" />
        <use href={`#${id}-flake`} transform="translate(182,26) scale(0.5)" strokeWidth="0.8" opacity="0.22" />
      </g>

      {/* Pine sprig — gold stem, soft green needles */}
      <g opacity="0.55">
        <path d="M44 52 C58 48, 72 47, 84 46" fill="none" stroke={gold} strokeWidth="1" />
        <g stroke="#86efac" strokeWidth="0.9" opacity="0.7">
          <line x1="50" y1="51" x2="46" y2="45" /><line x1="50" y1="51" x2="47" y2="57" />
          <line x1="58" y1="49.5" x2="54" y2="43.5" /><line x1="58" y1="49.5" x2="55" y2="55.5" />
          <line x1="66" y1="48" x2="62" y2="42" /><line x1="66" y1="48" x2="63" y2="54" />
          <line x1="74" y1="47" x2="70" y2="41" /><line x1="74" y1="47" x2="71" y2="53" />
        </g>
      </g>

      {/* Snow dust */}
      <g fill="#ffffff">
        <circle cx="52" cy="14" r="1" opacity="0.4" />
        <circle cx="110" cy="52" r="0.9" opacity="0.3" />
        <circle cx="166" cy="48" r="0.8" opacity="0.22" />
        <circle cx="204" cy="30" r="0.8" opacity="0.16" />
      </g>
    </svg>
  );
}

// ── Registry + month schedule ────────────────────────────────────────────────
const THEMES = {
  batik: BatikPattern,
  merdeka: MerdekaPattern,
  imlek: ImlekPattern,
  fitri: FitriPattern,
  adha: AdhaPattern,
  harbolnas: HarbolnasPattern,
  natal: NatalPattern,
};

// Month (1–12, WIB) → theme. Unlisted months fall back to 'batik'.
// NOTE: Imlek/Fitri/Adha follow lunar/Hijri calendars and DRIFT — reconfirm their months each
// January. Galaxy's anniversary is 25 Maret (2014); March belongs to Ramadan/Fitri while Fitri
// falls there (2026–2027) — the anniversary can claim March once Fitri drifts into February.
const MONTH_THEME = {
  2: 'imlek',
  3: 'fitri',
  5: 'adha',
  8: 'merdeka',
  11: 'harbolnas',
  12: 'natal',
};

/** Active theme name: ?theme= override (validated) → month schedule (WIB) → 'batik'. */
export function resolveMastheadTheme(search) {
  try {
    const q = new URLSearchParams(search || '').get('theme');
    if (q && THEMES[q]) return q;
  } catch { /* ignore malformed search */ }
  // WIB is fixed UTC+7 (no DST) — same result on server and client, so no hydration mismatch
  const wibMonth = new Date(Date.now() + 7 * 3600 * 1000).getUTCMonth() + 1;
  return MONTH_THEME[wibMonth] ?? 'batik';
}

export function MastheadOrnament({theme = 'batik', id}) {
  const Pattern = THEMES[theme] ?? BatikPattern;
  return <Pattern id={id} />;
}
