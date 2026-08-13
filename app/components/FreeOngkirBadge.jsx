// Coded replacement for the old free-ongkir-1.png badge (Shopify Files) — vector-crisp on any
// screen, zero network cost, and styled in the site's language (red gradient + ring + shadow).
// Shown on products ≥ Rp3.000.000. Pass positioning via className; `size` fits the context.

export function FreeOngkirBadge({ size = 'sm', className = '' }) {
  const s = size === 'md'
    ? { pad: 'pl-2 pr-2.5 py-1.5', icon: 'w-5 h-5', text: 'text-[13px]' }
    : { pad: 'pl-1.5 pr-2 py-1', icon: 'w-4 h-4', text: 'text-[10px]' };
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded bg-gradient-to-br from-rose-600 via-red-600 to-red-700 shadow-md ring-1 ring-white/25 pointer-events-none select-none ${s.pad} ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${s.icon} text-white flex-shrink-0`}>
        <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3a.75.75 0 00.75-.75V15z" />
        <path d="M8.25 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15.75 6.75a.75.75 0 00-.75.75v11.25c0 .087.015.17.042.248a3 3 0 015.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 00-3.732-10.104 1.837 1.837 0 00-1.47-.725H15.75z" />
        <path d="M19.5 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
      {/* Stacked two-row wordmark, like the original badge */}
      <span className={`${s.text} text-white font-black italic tracking-tight leading-[1.1] flex flex-col`}>
        <span>FREE</span>
        <span>ONGKIR</span>
      </span>
    </div>
  );
}
