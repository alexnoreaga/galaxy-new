// Tentang Kami — custom-designed about page (overrides the generic pages.$handle CMS route).
// Built as a trust landing page (hero → stats → cerita → timeline → visi/misi → produk →
// Kenapa Galaxy → B2B → CTA) in the site's charcoal/gold design language.

import {Link, useLocation} from '@remix-run/react';
import {SocialProofStrip} from '~/components/SocialProofStrip';
import {KenapaGalaxy} from '~/components/KenapaGalaxy';
import {MastheadOrnament, resolveMastheadTheme} from '~/components/MastheadOrnament';

export const meta = () => {
  return [
    {title: 'Tentang Kami — Galaxy Camera | Toko Kamera Terpercaya Sejak 2014'},
    {
      name: 'description',
      content:
        'Galaxy Camera adalah toko kamera online & offline terpercaya sejak 2014. Toko fisik di Tangerang & Depok, 60.000+ produk terjual, rating 4.9, produk 100% resmi bergaransi, cicilan 0%, dan asisten AI Grisela.',
    },
  ];
};

const STORE_PHOTO = 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/Foto-toko-tangerang-2.webp?v=1706799592';
const STORE_PHOTO_PORTRAIT = 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/Foto-toko-tangerang-portrait.png?v=1706799750';

const TIMELINE = [
  {
    year: '2014',
    title: 'Galaxy Camera Berdiri',
    text: 'Berawal 25 Maret 2014 dengan toko pertama di Ruko Mall Metropolis Town Square, Tangerang — fokus pada produk resmi dan pelayanan yang jujur.',
  },
  {
    year: '2018',
    title: 'Ekspansi ke Depok',
    text: 'Membuka toko kedua di Mall Depok Town Square, memperluas jangkauan untuk komunitas fotografi Jabodetabek.',
  },
  {
    year: 'Era Digital',
    title: 'galaxy.co.id & Marketplace',
    text: 'Hadir online lewat website resmi dan marketplace — melayani pengiriman ke seluruh Indonesia dengan gratis ongkir.',
  },
  {
    year: 'Hari Ini',
    title: '60.000+ Produk Terjual · Rating 4.9',
    text: 'Dipercaya puluhan ribu pelanggan, didukung Grisela — asisten belanja AI kami — serta layanan pengadaan untuk perusahaan dan instansi.',
  },
];

const PRODUK = [
  'Kamera Mirrorless & DSLR',
  'Action Camera & Camcorder',
  'Instant Camera / Polaroid',
  'Drone',
  'Gimbal & Stabilizer',
  'Lensa & Aksesoris',
];

export default function TentangKami() {
  const location = useLocation();
  const mastheadTheme = resolveMastheadTheme(location.search);

  return (
    <div className="pb-4">
      {/* ── Hero — charcoal band, seasonal ornament, store photo ─────────────── */}
      <div className="relative -mx-4 sm:mx-0 overflow-hidden sm:rounded-2xl sm:mt-4 bg-gray-900 sm:max-w-screen-xl sm:px-0 xl:mx-auto">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-56 pointer-events-none opacity-50 -scale-x-100 [mask-image:linear-gradient(to_right,black_35%,transparent)]"
        >
          <MastheadOrnament theme={mastheadTheme} id="gxOrnAbout" />
        </div>
        <div className="relative px-5 py-8 sm:px-10 sm:py-12 grid sm:grid-cols-[1.2fr_1fr] gap-6 sm:gap-10 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-red-400 mb-2">Tentang Kami</p>
            <h1 className="text-white text-2xl sm:text-4xl font-bold tracking-tight leading-tight m-0">
              Toko Kamera Terpercaya
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                sejak 2014
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-3 max-w-lg">
              Galaxy Camera melayani fotografer & videografer Indonesia — online dan offline — dengan
              produk 100% resmi, harga bersaing, dan layanan purna jual yang jelas.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-5">
              <Link to="/collections" className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-xl no-underline hover:bg-gray-100 transition-colors">
                Mulai Belanja
              </Link>
              <Link to="/pengadaan" className="inline-flex items-center gap-1.5 border border-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl no-underline hover:bg-white/10 transition-colors">
                Pengadaan B2B
              </Link>
            </div>
          </div>
          <div className="hidden sm:block">
            <img
              src={STORE_PHOTO}
              alt="Toko Galaxy Camera Tangerang"
              loading="eager"
              className="w-full h-56 object-cover rounded-2xl ring-1 ring-white/15 shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* ── Stats — the same animated counters as the homepage ───────────────── */}
      <div className="relative mx-auto sm:max-w-screen-xl mt-2 sm:mt-4">
        <SocialProofStrip />
      </div>

      {/* ── Cerita Kami ──────────────────────────────────────────────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-6 sm:mt-10 grid sm:grid-cols-[1fr_280px] gap-6 sm:gap-10 items-center">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full" />
            <h2 className="text-gray-900 text-lg sm:text-2xl font-bold m-0">Cerita Kami</h2>
          </div>
          <div className="text-sm sm:text-[15px] text-gray-600 leading-relaxed space-y-3">
            <p>
              <strong className="text-gray-900">Galaxy Camera</strong> adalah perusahaan ritel dan
              distribusi peralatan fotografi & videografi yang beroperasi sejak{' '}
              <strong className="text-gray-900">tahun 2014</strong>. Kami hadir secara online dan
              offline untuk melayani kebutuhan individu, komunitas kreatif, hingga perusahaan dan
              institusi di seluruh Indonesia.
            </p>
            <p>
              Sejak awal berdiri, fokus kami tidak pernah berubah: <strong className="text-gray-900">keaslian
              produk</strong>, kualitas layanan, dan pengalaman berbelanja yang profesional serta
              terpercaya — dari toko fisik di Tangerang & Depok sampai layanan online dengan
              pengiriman ke seluruh Indonesia.
            </p>
          </div>
        </div>
        <img
          src={STORE_PHOTO_PORTRAIT}
          alt="Suasana toko Galaxy Camera"
          loading="lazy"
          className="hidden sm:block w-full h-72 object-cover rounded-2xl ring-1 ring-gray-200"
        />
      </div>

      {/* ── Timeline — Perjalanan Galaxy ─────────────────────────────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-8 sm:mt-12">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full" />
          <h2 className="text-gray-900 text-lg sm:text-2xl font-bold m-0">Perjalanan Galaxy</h2>
        </div>
        <div className="relative pl-6 sm:pl-8">
          {/* the golden line */}
          <div className="absolute left-[7px] sm:left-[9px] top-1 bottom-1 w-px bg-gradient-to-b from-amber-300 via-amber-500/60 to-transparent" />
          <div className="flex flex-col gap-4 sm:gap-5">
            {TIMELINE.map((t, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-6 sm:-left-8 top-1.5 w-[15px] h-[15px] sm:w-[19px] sm:h-[19px] rounded-full bg-white ring-2 ring-amber-400 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm px-4 py-3 sm:px-5 sm:py-4">
                  <span className="inline-block text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 mb-1.5">
                    {t.year}
                  </span>
                  <p className="text-gray-900 font-semibold text-sm sm:text-base m-0">{t.title}</p>
                  <p className="text-gray-500 text-[12.5px] sm:text-sm leading-relaxed mt-1 m-0">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Visi & Misi ──────────────────────────────────────────────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-8 sm:mt-12 grid sm:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl px-5 py-5 sm:px-6 sm:py-6" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #263447 100%)'}}>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-red-400 mb-1.5">Visi</p>
          <p className="text-white text-sm sm:text-base leading-relaxed m-0">
            Memberikan <strong>pelayanan terbaik</strong> dan menciptakan pengalaman berbelanja kamera
            yang konsisten, nyaman, dan bernilai bagi setiap pelanggan di Indonesia.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-red-600 mb-1.5">Misi</p>
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5 text-sm text-gray-700">
            {[
              'Menjamin keaslian produk & garansi resmi Indonesia',
              'Layanan purna jual dan konsultasi yang jelas',
              'Kemudahan transaksi — cicilan 0% & tanpa kartu kredit',
              'Solusi pengadaan profesional untuk korporasi & institusi',
            ].map((m, i) => (
              <li key={i} className="flex items-start gap-2 m-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Produk & Layanan — chip grid ─────────────────────────────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-8 sm:mt-12">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full" />
          <h2 className="text-gray-900 text-lg sm:text-2xl font-bold m-0">Produk & Layanan</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRODUK.map((p) => (
            <span key={p} className="text-[12.5px] sm:text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-1.5">
              {p}
            </span>
          ))}
          <Link to="/collections" className="text-[12.5px] sm:text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-3.5 py-1.5 no-underline hover:bg-red-100 transition-colors">
            Lihat Semua Kategori →
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Seluruh produk <strong className="text-gray-700">100% original</strong> dan berasal dari{' '}
          <strong className="text-gray-700">distributor resmi di Indonesia</strong>, dengan garansi
          resmi dan layanan purna jual yang jelas.
        </p>
      </div>

      {/* ── Kenapa Galaxy — the existing trust band, reused ──────────────────── */}
      <KenapaGalaxy />

      {/* ── B2B + CTA ────────────────────────────────────────────────────────── */}
      <div className="mx-auto sm:max-w-screen-xl grid sm:grid-cols-2 gap-4 mt-2">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-gray-900 font-bold text-base m-0 mb-1">Pengadaan Perusahaan & Instansi</p>
          <p className="text-sm text-gray-500 leading-relaxed m-0 mb-3">
            Melayani perusahaan swasta, institusi pendidikan, dan lembaga pemerintahan dengan
            pendekatan pengadaan yang profesional dan transparan.
          </p>
          <Link to="/pengadaan" className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 no-underline hover:text-red-700">
            Info Pengadaan →
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-gray-900 font-bold text-base m-0 mb-1">Kunjungi atau Hubungi Kami</p>
          <p className="text-sm text-gray-500 leading-relaxed m-0 mb-3">
            Toko fisik di Tangerang & Depok — bisa cek barang langsung, COD, dan konsultasi dengan tim kami.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/stores" className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl no-underline transition-colors">
              Lokasi Toko
            </Link>
            <a href="https://wa.me/6282111311131" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl no-underline transition-colors">
              Chat WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
