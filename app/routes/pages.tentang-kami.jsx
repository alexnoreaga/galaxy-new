// Tentang Kami — custom-designed about page (overrides the generic pages.$handle CMS route).
// Design: editorial, not boxy — dark/light band rhythm (hero → light → dark visi/misi → light
// timeline → dark trust band → light CTA), gold-gradient accents, oversized timeline years.

import {Link, useLocation} from '@remix-run/react';
import {SocialProofStrip} from '~/components/SocialProofStrip';
import {KenapaGalaxy} from '~/components/KenapaGalaxy';
import {MastheadOrnament, resolveMastheadTheme} from '~/components/MastheadOrnament';

export const meta = () => {
  return [
    {title: 'Tentang Kami — Galaxy Camera | Toko Kamera Terpercaya Sejak 2014'},
    {tagName: 'link', rel: 'canonical', href: 'https://www.galaxy.co.id/pages/tentang-kami'},
    {property: 'og:url', content: 'https://www.galaxy.co.id/pages/tentang-kami'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Tentang Galaxy Camera — Toko Kamera Terpercaya Sejak 2014'},
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
    text: '60.000+ transaksi gabungan Tokopedia & Shopee, rating 4.9 dari ulasan Google. Didukung Grisela — asisten belanja AI kami — serta layanan pengadaan untuk perusahaan dan instansi.',
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

// Penghargaan dari brand & distributor resmi — read off the award wall photo (penghargaan.png).
const AWARDS_IMG = 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/penghargaan.png?v=1789551991';
const AWARDS = [
  { brand: 'Canon · Datascrip', title: 'Top Achiever & Target Achiever', year: '2024', detail: 'Appreciation "Break The Limit" — juga Good Performer & Excellent Payment' },
  { brand: 'Canon · Datascrip', title: 'Highest Contributor', year: '50 Sustainable Legacy', detail: 'Empat trofi kontributor tertinggi di perayaan 50 tahun Datascrip' },
  { brand: 'Canon · Datascrip', title: 'Good Performer & Excellent Payment', year: '2022', detail: 'Appreciation "Break The Limit"' },
  { brand: 'Hollyland', title: 'Outstanding Sales Dealer', year: '2026', detail: 'Dealer dengan penjualan terbaik' },
  { brand: 'Hollyland', title: 'Sales Excellence Dealer', year: '2025', detail: 'Certified Dealer resmi Hollyland' },
  { brand: 'Saramonic', title: 'Premium Partner', year: '2023', detail: 'Mitra premium resmi Saramonic Indonesia' },
];

export default function TentangKami() {
  const location = useLocation();
  const mastheadTheme = resolveMastheadTheme(location.search);

  return (
    <div className="pb-6">
      {/* Entity data for this page: AboutPage + Organization with founding year, legal name, awards
          (read off the award wall), socials — so search engines / AI assistants can attach these
          facts to the "Galaxy Camera" entity instead of only reading them as prose. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          '@id': 'https://www.galaxy.co.id/pages/tentang-kami',
          url: 'https://www.galaxy.co.id/pages/tentang-kami',
          name: 'Tentang Galaxy Camera',
          inLanguage: 'id-ID',
          isPartOf: { '@type': 'WebSite', name: 'Galaxy Camera', url: 'https://www.galaxy.co.id' },
          about: { '@id': 'https://www.galaxy.co.id/#organization' },
          mainEntity: { '@id': 'https://www.galaxy.co.id/#organization' },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': 'https://www.galaxy.co.id/#organization',
          name: 'Galaxy Camera',
          legalName: 'PT Galaxy Digital Niaga',
          url: 'https://www.galaxy.co.id',
          logo: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
          foundingDate: '2014-03-25',
          foundingLocation: { '@type': 'Place', name: 'Tangerang, Banten, Indonesia' },
          areaServed: 'ID',
          telephone: '+62-821-1131-1131',
          sameAs: [
            'https://www.instagram.com/galaxycamera99',
            'https://www.facebook.com/galaxycamera99',
            'https://www.tiktok.com/@galaxycameraid',
            'https://www.youtube.com/galaxycamera',
            'https://www.x.com/galaxycamera99',
          ],
          award: AWARDS.map((a) => `${a.title} (${a.brand}, ${a.year})`),
          knowsAbout: ['Kamera mirrorless', 'Kamera DSLR', 'Lensa kamera', 'Drone', 'Action camera', 'Peralatan videografi', 'Microphone wireless'],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.galaxy.co.id' },
            { '@type': 'ListItem', position: 2, name: 'Tentang Kami', item: 'https://www.galaxy.co.id/pages/tentang-kami' },
          ],
        },
      ]) }} />
      {/* ── HERO — cinematic charcoal, glow + texture, framed photo ──────────── */}
      <div className="relative -mx-4 sm:mx-auto sm:max-w-screen-xl overflow-hidden sm:rounded-2xl sm:mt-4"
        style={{background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 55%, #1e293b 100%)'}}>
        {/* texture + glows (same language as the dark bands) */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
          style={{opacity: 0.05, backgroundImage: 'radial-gradient(circle at center, #fff 0.6px, transparent 0.6px)', backgroundSize: '22px 22px'}} />
        <div aria-hidden="true" className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-28 right-1/4 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-56 pointer-events-none opacity-50 -scale-x-100 [mask-image:linear-gradient(to_right,black_35%,transparent)]">
          <MastheadOrnament theme={mastheadTheme} id="gxOrnAbout" />
        </div>

        <div className="relative px-5 py-10 sm:px-12 sm:py-16 grid sm:grid-cols-[1.15fr_1fr] gap-8 sm:gap-12 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-red-400 mb-3">Tentang Kami</p>
            <h1 className="text-white text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] m-0">
              Toko Kamera
              <span className="block">Terpercaya</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
                sejak 2014
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-4 max-w-md">
              Melayani fotografer &amp; videografer Indonesia — online dan offline — dengan produk
              100% resmi, harga bersaing, dan layanan purna jual yang jelas.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              <Link to="/collections" className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl no-underline hover:bg-gray-100 transition-colors">
                Mulai Belanja
              </Link>
              <Link to="/pengadaan" className="inline-flex items-center gap-1.5 border border-white/25 text-white text-sm font-semibold px-5 py-2.5 rounded-xl no-underline hover:bg-white/10 transition-colors">
                Pengadaan B2B
              </Link>
            </div>
          </div>

          {/* Framed photo — gold offset frame gives it depth instead of a flat rectangle */}
          <div className="hidden sm:block relative">
            <div aria-hidden="true" className="absolute -inset-2.5 rounded-2xl border border-amber-400/30 rotate-2" />
            <div aria-hidden="true" className="absolute -inset-2.5 rounded-2xl border border-white/10 -rotate-1" />
            <img
              src={STORE_PHOTO}
              alt="Toko Galaxy Camera Tangerang"
              loading="eager"
              className="relative w-full h-64 object-cover rounded-2xl ring-1 ring-white/20 shadow-2xl"
            />
            <span className="absolute bottom-3 left-3 text-[10px] font-semibold tracking-wider uppercase text-white/90 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
              Toko Tangerang
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats — animated counters ────────────────────────────────────────── */}
      <div className="relative mx-auto sm:max-w-screen-xl mt-2 sm:mt-5">
        <SocialProofStrip />
        <p className="text-[11px] text-gray-400 text-center mt-2 m-0">
          Angka transaksi gabungan Tokopedia &amp; Shopee; rating dari ulasan Google. Diperbarui September 2026.
        </p>
      </div>

      {/* ── Cerita Kami — editorial, pull-quote instead of a card ────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-8 sm:mt-14 grid sm:grid-cols-[1fr_260px] gap-8 sm:gap-12 items-center">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-red-600 mb-2">Cerita Kami</p>
          <h2 className="text-gray-900 text-xl sm:text-3xl font-bold tracking-tight m-0 mb-4">
            Dari satu toko di Tangerang,<br className="hidden sm:block" /> untuk seluruh Indonesia
          </h2>
          <div className="text-sm sm:text-[15px] text-gray-600 leading-relaxed space-y-3">
            <p>
              <strong className="text-gray-900">Galaxy Camera</strong> adalah perusahaan ritel dan
              distribusi peralatan fotografi &amp; videografi yang beroperasi sejak tahun 2014 —
              hadir online dan offline untuk individu, komunitas kreatif, hingga perusahaan dan
              institusi di seluruh Indonesia.
            </p>
            <blockquote className="border-l-2 border-amber-400 pl-4 py-0.5 m-0 text-gray-800 italic">
              “Fokus kami tidak pernah berubah: keaslian produk, kualitas layanan, dan pengalaman
              berbelanja yang profesional serta terpercaya.”
            </blockquote>
            <p>
              Dari toko fisik di Tangerang &amp; Depok sampai layanan online dengan pengiriman ke
              seluruh Indonesia — setiap transaksi kami jaga dengan standar yang sama.
            </p>
          </div>
        </div>
        <div className="hidden sm:block relative justify-self-end w-full">
          <div aria-hidden="true" className="absolute -inset-2.5 rounded-2xl border border-amber-400/40 -rotate-2" />
          <img
            src={STORE_PHOTO_PORTRAIT}
            alt="Suasana toko Galaxy Camera"
            loading="lazy"
            className="relative w-full h-80 object-cover rounded-2xl ring-1 ring-gray-200 shadow-lg"
          />
        </div>
      </div>

      {/* ── Visi & Misi — one dark band, frosted columns (house language) ────── */}
      <div className="relative -mx-4 sm:mx-auto sm:max-w-screen-xl overflow-hidden sm:rounded-2xl mt-10 sm:mt-14"
        style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #263447 100%)'}}>
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
          style={{opacity: 0.05, backgroundImage: 'radial-gradient(circle at center, #fff 0.6px, transparent 0.6px)', backgroundSize: '22px 22px'}} />
        <div aria-hidden="true" className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative grid sm:grid-cols-2 sm:divide-x sm:divide-white/10">
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-red-400 mb-2">Visi</p>
            <p className="text-white text-base sm:text-lg leading-relaxed m-0 font-medium">
              Memberikan pelayanan terbaik dan menciptakan pengalaman berbelanja kamera yang
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500"> konsisten, nyaman, dan bernilai </span>
              bagi setiap pelanggan.
            </p>
          </div>
          <div className="px-5 pb-6 sm:px-8 sm:py-8 pt-1 sm:pt-8">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-red-400 mb-2.5">Misi</p>
            <ul className="m-0 p-0 list-none flex flex-col gap-2 text-[13px] sm:text-sm text-slate-300">
              {[
                'Menjamin keaslian produk & garansi resmi Indonesia',
                'Layanan purna jual dan konsultasi yang jelas',
                'Kemudahan transaksi — cicilan 0% & tanpa kartu kredit',
                'Solusi pengadaan profesional untuk korporasi & institusi',
              ].map((m, i) => (
                <li key={i} className="flex items-start gap-2.5 m-0">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#0f172a" className="w-2.5 h-2.5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Timeline — editorial: oversized gold years, no boxes ─────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-10 sm:mt-16">
        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-red-600 mb-2 text-center">Perjalanan Kami</p>
        <h2 className="text-gray-900 text-xl sm:text-3xl font-bold tracking-tight text-center m-0 mb-8 sm:mb-10">
          Tumbuh bersama fotografer Indonesia
        </h2>
        <div className="relative pl-7 sm:pl-0">
          {/* mobile: left line · desktop: center line */}
          <div aria-hidden="true" className="absolute left-[9px] sm:left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-amber-300 via-amber-500/50 to-transparent" />
          <div className="flex flex-col gap-8 sm:gap-12">
            {TIMELINE.map((t, i) => (
              <div key={i} className={`relative sm:grid sm:grid-cols-2 sm:gap-14 sm:items-center`}>
                <span className="absolute -left-7 sm:left-1/2 sm:-translate-x-1/2 top-1 w-[17px] h-[17px] rounded-full bg-white ring-2 ring-amber-400 flex items-center justify-center z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                <div className={i % 2 === 0 ? 'sm:text-right sm:pr-2' : 'sm:order-2 sm:text-left sm:pl-2'}>
                  <p className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-amber-600 m-0 leading-none">
                    {t.year}
                  </p>
                  <p className="text-gray-900 font-bold text-sm sm:text-lg m-0 mt-1.5">{t.title}</p>
                </div>
                <div className={i % 2 === 0 ? 'sm:order-2 sm:pl-2' : 'sm:text-right sm:pr-2'}>
                  <p className="text-gray-500 text-[13px] sm:text-sm leading-relaxed m-0 mt-1 sm:mt-0 max-w-sm sm:inline-block">
                    {t.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Penghargaan — brand/distributor awards: proof, not claims ─────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-10 sm:mt-16">
        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-red-600 mb-2 text-center">Penghargaan</p>
        <h2 className="text-gray-900 text-xl sm:text-3xl font-bold tracking-tight text-center m-0 mb-3">
          Diakui langsung oleh brand yang kami jual
        </h2>
        <p className="text-sm sm:text-base text-gray-500 text-center max-w-2xl mx-auto m-0 mb-6 sm:mb-8 leading-relaxed">
          Penghargaan ini bukan kami yang menilai sendiri. Canon melalui Datascrip, Hollyland, dan Saramonic
          memberikannya atas kinerja penjualan, ketepatan pembayaran, dan layanan purna jual kami sebagai
          dealer resmi. Artinya, produk yang kamu beli di Galaxy datang dari jalur distribusi resmi, dengan
          garansi yang benar-benar dijamin.
        </p>

        {/* Award wall photo */}
        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-2 rounded-2xl border border-amber-400/30 rotate-1 hidden sm:block" />
          <img
            src={AWARDS_IMG}
            alt="Dinding penghargaan Galaxy Camera: plakat Canon Datascrip 2022 & 2024, trofi Highest Contributor, Hollyland Certified Dealer, Sales Excellence Dealer 2025, Outstanding Sales Dealer 2026, dan Saramonic Premium Partner 2023"
            width={1680}
            height={945}
            loading="lazy"
            decoding="async"
            className="relative w-full h-auto rounded-2xl ring-1 ring-gray-200 shadow-lg"
          />
        </div>

        {/* Award cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-5 sm:mt-6">
          {AWARDS.map((a) => (
            <div key={a.brand + a.title + a.year} className="flex gap-3 bg-white border border-gray-200 rounded-xl p-4">
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75V3h4.5a.75.75 0 01.75.75v1.5a4.75 4.75 0 01-3.53 4.59 5.51 5.51 0 01-1.72 2.02V13h1.5a2.25 2.25 0 012.25 2.25v.75h.75a.75.75 0 010 1.5H4.75a.75.75 0 010-1.5h.75v-.75A2.25 2.25 0 017.75 13h1.5v-1.14a5.51 5.51 0 01-1.72-2.02A4.75 4.75 0 014 5.25v-1.5A.75.75 0 014.75 3h4.5V1.75A.75.75 0 0110 1zM5.5 4.5v.75c0 1.3.77 2.42 1.87 2.93A5.5 5.5 0 017 6.5v-2H5.5zm9 0H13v2c0 .6-.1 1.17-.28 1.7a3.25 3.25 0 001.78-2.95V4.5z" clipRule="evenodd" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 m-0">{a.brand}</p>
                <p className="text-sm font-bold text-gray-900 m-0 mt-0.5 leading-snug">
                  {a.title} <span className="font-semibold text-amber-600">· {a.year}</span>
                </p>
                <p className="text-[12.5px] text-gray-500 m-0 mt-1 leading-relaxed">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-4 m-0">
          Sebagian penghargaan yang diterima Galaxy Camera dari brand dan distributor resmi, 2022–2026.
        </p>
      </div>

      {/* ── Produk & Layanan — centered chip row ─────────────────────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-10 sm:mt-16 text-center">
        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-red-600 mb-2">Produk &amp; Layanan</p>
        <h2 className="text-gray-900 text-xl sm:text-3xl font-bold tracking-tight m-0 mb-5">
          Lengkap untuk semua kebutuhan kreatif
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {PRODUK.map((p) => (
            <span key={p} className="text-[12.5px] sm:text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-1.5">
              {p}
            </span>
          ))}
          <Link to="/collections" className="text-[12.5px] sm:text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-3.5 py-1.5 no-underline hover:bg-red-100 transition-colors">
            Lihat Semua Kategori →
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4 max-w-xl mx-auto">
          Seluruh produk <strong className="text-gray-700">100% original</strong> dari{' '}
          <strong className="text-gray-700">distributor resmi di Indonesia</strong> — bergaransi
          resmi dengan layanan purna jual yang jelas.
        </p>
      </div>

      {/* ── Kenapa Galaxy — existing dark trust band ─────────────────────────── */}
      <div className="mt-8 sm:mt-12">
        <KenapaGalaxy />
      </div>

      {/* ── Closing CTA — centered, light, decisive ──────────────────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-8 sm:mt-12 text-center px-2">
        <h2 className="text-gray-900 text-xl sm:text-3xl font-bold tracking-tight m-0">
          Siap melengkapi gear kamera Anda?
        </h2>
        <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-lg mx-auto">
          Belanja online, kunjungi toko kami di Tangerang &amp; Depok, atau konsultasi langsung
          dengan tim Galaxy.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5 mt-5">
          <Link to="/collections" className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl no-underline transition-colors">
            Mulai Belanja
          </Link>
          <Link to="/stores" className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-800 text-sm font-semibold px-5 py-2.5 rounded-xl no-underline hover:border-gray-400 hover:bg-gray-50 transition-colors">
            Lokasi Toko
          </Link>
          <a href="https://wa.me/6282111311131" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl no-underline transition-colors">
            Chat WhatsApp
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Butuh pengadaan untuk perusahaan atau instansi?{' '}
          <Link to="/pengadaan" className="text-red-600 font-semibold no-underline hover:underline">Info Pengadaan →</Link>
        </p>
      </div>
    </div>
  );
}
