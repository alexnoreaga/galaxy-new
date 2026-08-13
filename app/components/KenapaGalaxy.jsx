// Mid-page trust band ("Kenapa Galaxy") — a charcoal anchor matching the site's dark masthead,
// Brand Populer band and footer: slate gradient + subtle dot texture, frosted-glass icon tiles,
// red reserved for the accent bar/eyebrow. Full-bleed on mobile, rounded card on desktop.

const ITEMS = [
  {
    title: 'Produk 100% Resmi',
    sub: 'Bergaransi resmi Indonesia',
    path: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
  },
  {
    title: 'Cicilan 0%',
    sub: 'Tanpa kartu kredit, cukup KTP',
    path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  },
  {
    title: 'Gratis Ongkir',
    sub: 'Ke seluruh Indonesia',
    path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  },
  {
    title: 'Toko Fisik & COD',
    sub: 'Tangerang & Depok, cek langsung',
    path: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z',
  },
];

export function KenapaGalaxy() {
  return (
    <div className="relative -mx-4 sm:mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl sm:px-0 my-6 sm:my-8">
      <section
        className="relative overflow-hidden rounded-none sm:rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #263447 100%)' }}
      >
        {/* Subtle dotted texture (same language as the Brand Populer band) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.05,
            backgroundImage: 'radial-gradient(circle at center, #ffffff 0.6px, transparent 0.6px)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* Faint red glow — gives the guarantee band its own identity without shouting */}
        <div className="absolute -top-20 -left-16 w-56 h-56 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-12 w-64 h-64 rounded-full bg-amber-500/[0.07] blur-3xl pointer-events-none" />

        <div className="relative px-4 sm:px-6 py-4 sm:py-5">
          {/* Header */}
          <div className="flex items-baseline gap-2 mb-3.5 sm:mb-4">
            <div className="w-1 h-4 sm:h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full flex-shrink-0 self-center" />
            <h2 className="text-white text-sm sm:text-lg font-bold tracking-tight leading-none">
              Kenapa Belanja di Galaxy?
            </h2>
            <span className="hidden sm:inline text-[10px] font-semibold tracking-[0.2em] uppercase text-red-400/90 ml-1">
              Jaminan Galaxy
            </span>
          </div>

          {/* Compact icon-left rows: 4-up on desktop with hairline dividers, 2×2 on mobile */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 md:grid-cols-4 md:gap-0 md:divide-x md:divide-white/10">
            {ITEMS.map((it, i) => (
              <div key={i} className="flex items-center gap-2.5 sm:gap-3 md:px-4 lg:px-5 md:first:pl-0">
                {/* Frosted-glass icon tile */}
                <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-white/15 to-white/5 ring-1 ring-white/15 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d={it.path} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-[11.5px] sm:text-[13px] leading-tight">
                    {it.title}
                  </p>
                  <p className="text-slate-400 text-[9.5px] sm:text-[11px] leading-snug mt-0.5">
                    {it.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
