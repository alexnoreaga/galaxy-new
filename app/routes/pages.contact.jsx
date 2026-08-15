// Hubungi Kami — custom-designed contact page (overrides the generic pages.$handle CMS route).
// Data-driven: store cards come from the same store_locations metaobject the header uses, with
// live Google Maps embeds (lazy-loaded). The "quick message" form composes a WhatsApp chat —
// full contact functionality without any form backend.

import {useState} from 'react';
import {Link, useLocation, useMatches} from '@remix-run/react';
import {FaWhatsapp, FaPhone, FaEnvelope, FaClock, FaLocationDot} from 'react-icons/fa6';
import {MastheadOrnament, resolveMastheadTheme} from '~/components/MastheadOrnament';

export const meta = () => {
  return [
    {title: 'Hubungi Kami — Galaxy Camera | Toko Kamera Tangerang & Depok'},
    {
      name: 'description',
      content:
        'Hubungi Galaxy Camera — chat WhatsApp 0821-1131-1131, email sales@galaxy.co.id, atau kunjungi toko kami di Mall Metropolis Town Square Tangerang dan Mall Depok Town Square. Buka setiap hari 10.00–19.00.',
    },
  ];
};

const WA_NUMBER = '6282111311131';

function parseStore(node) {
  const f = {};
  node.fields.forEach(({key, value}) => { f[key] = value; });
  return {
    id: node.id,
    name: f.name || '',
    address: f.address || '',
    latitude: parseFloat(f.latitude) || 0,
    longitude: parseFloat(f.longitude) || 0,
    mapsUrl: f.maps_url || '',
    phone: f.phone || '',
    hours: f.hours || '',
  };
}

// Fallback if the metaobject is ever empty — the page never renders blank
const FALLBACK_STORES = [
  {id: 'tgr', name: 'Galaxy Camera Tangerang', address: 'Ruko Mall Metropolis Town Square, Blok GM3 No.6, Kelapa Indah, Tangerang', latitude: 0, longitude: 0, mapsUrl: '', phone: '0821-1131-1131', hours: 'Buka setiap hari · 10.00–19.00'},
  {id: 'dpk', name: 'Galaxy Camera Depok', address: 'Mall Depok Town Square, Lantai 2 Blok SS2 No.8, Beji, Depok', latitude: 0, longitude: 0, mapsUrl: '', phone: '0821-1131-1131', hours: 'Buka setiap hari · 10.00–19.00'},
];

function mapEmbedSrc(store) {
  const q = store.latitude && store.longitude
    ? `${store.latitude},${store.longitude}`
    : `${store.name} ${store.address}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
}

export default function ContactPage() {
  const location = useLocation();
  const mastheadTheme = resolveMastheadTheme(location.search);

  const [root] = useMatches();
  const rawStores = root?.data?.storeLocations?.metaobjects?.edges?.map((e) => parseStore(e.node)) || [];
  const stores = rawStores.length > 0 ? rawStores : FALLBACK_STORES;

  // Quick-message form → composes a WhatsApp chat (no backend needed)
  const [nama, setNama] = useState('');
  const [pesan, setPesan] = useState('');
  const waText = `Halo admin Galaxy Camera 👋${nama ? `, saya ${nama}` : ''}.\n${pesan || 'Saya ingin bertanya tentang produk.'}`;
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`;

  const channels = [
    {icon: <FaWhatsapp className="w-4 h-4" />, tile: 'bg-emerald-500/15 text-emerald-400', label: 'WhatsApp', value: '0821-1131-1131', sub: 'Respon tercepat', href: `https://wa.me/${WA_NUMBER}`},
    {icon: <FaPhone className="w-3.5 h-3.5" />, tile: 'bg-sky-500/15 text-sky-400', label: 'Telepon', value: '0821-1131-1131', sub: 'Jam operasional', href: 'tel:+6282111311131'},
    {icon: <FaEnvelope className="w-3.5 h-3.5" />, tile: 'bg-amber-500/15 text-amber-400', label: 'Email', value: 'sales@galaxy.co.id', sub: 'Penawaran & pengadaan', href: 'mailto:sales@galaxy.co.id'},
    {icon: <FaClock className="w-3.5 h-3.5" />, tile: 'bg-rose-500/15 text-rose-400', label: 'Jam Operasional', value: '10.00 – 19.00', sub: 'Buka setiap hari', href: null},
  ];

  return (
    <div className="pb-6">
      {/* ── Hero — charcoal, ornament, contact channels INSIDE the band ──────── */}
      <div
        className="relative -mx-4 sm:mx-auto sm:max-w-screen-xl overflow-hidden sm:rounded-2xl sm:mt-4"
        style={{background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 55%, #1e293b 100%)'}}
      >
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
          style={{opacity: 0.05, backgroundImage: 'radial-gradient(circle at center, #fff 0.6px, transparent 0.6px)', backgroundSize: '22px 22px'}} />
        <div aria-hidden="true" className="absolute -top-20 -left-16 w-64 h-64 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-56 pointer-events-none opacity-50 -scale-x-100 [mask-image:linear-gradient(to_right,black_35%,transparent)]">
          <MastheadOrnament theme={mastheadTheme} id="gxOrnContact" />
        </div>

        <div className="relative px-5 py-8 sm:px-10 sm:py-12">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-red-400 mb-2">Hubungi Kami</p>
          <h1 className="text-white text-2xl sm:text-4xl font-bold tracking-tight leading-tight m-0">
            Kami siap membantu,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
              setiap hari
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-lg">
            Tanya produk, cek stok, nego harga, sampai pengadaan untuk perusahaan — tim Galaxy
            (dan Grisela, asisten AI kami) siap menjawab.
          </p>

          {/* Channel cards — frosted, inside the dark band */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-6">
            {channels.map((c) => {
              const inner = (
                <>
                  <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${c.tile}`}>{c.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400">{c.label}</span>
                    <span className="block text-white text-[13px] sm:text-sm font-semibold truncate">{c.value}</span>
                    <span className="block text-slate-400 text-[10.5px]">{c.sub}</span>
                  </span>
                </>
              );
              const cls = 'flex items-center gap-3 rounded-xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-3 no-underline transition-all duration-200';
              return c.href ? (
                <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`${cls} hover:bg-white/[0.12] hover:-translate-y-0.5`}>
                  {inner}
                </a>
              ) : (
                <div key={c.label} className={cls}>{inner}</div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Store locations — data-driven cards with live maps ───────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-8 sm:mt-12">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full" />
          <h2 className="text-gray-900 text-lg sm:text-2xl font-bold m-0">Kunjungi Toko Kami</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">Cek barang langsung, COD, dan konsultasi dengan tim kami.</p>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {stores.map((s) => (
            <div key={s.id} className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <iframe
                title={`Peta ${s.name}`}
                src={mapEmbedSrc(s)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-44 sm:h-52 border-0 block"
              />
              <div className="px-4 py-4 sm:px-5">
                <p className="text-gray-900 font-bold text-base m-0">{s.name}</p>
                <div className="flex items-start gap-2 text-sm text-gray-500 mt-1.5">
                  <FaLocationDot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                  <span>{s.address}</span>
                </div>
                {s.hours && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <FaClock className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span>{s.hours}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3.5">
                  {s.mapsUrl && (
                    <a href={s.mapsUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg no-underline transition-colors">
                      <FaLocationDot className="w-3 h-3" /> Lihat di Maps
                    </a>
                  )}
                  <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg no-underline transition-colors">
                    <FaWhatsapp className="w-3 h-3" /> Chat Toko
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick message → WhatsApp ─────────────────────────────────────────── */}
      <div className="mx-auto sm:max-w-screen-xl mt-8 sm:mt-12 grid sm:grid-cols-[1fr_320px] gap-6 sm:gap-10 items-start">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-5 py-5 sm:px-7 sm:py-6">
          <p className="text-gray-900 font-bold text-base sm:text-lg m-0">Kirim Pesan Cepat</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Tulis pesanmu — lanjut otomatis ke WhatsApp kami, dibalas di jam operasional.</p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama kamu"
              className="w-full h-11 rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent m-0"
            />
            <textarea
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              placeholder="Contoh: Halo, saya mau tanya stok Sony A7 IV…"
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-3 rounded-xl no-underline transition-colors w-full sm:w-fit"
            >
              <FaWhatsapp className="w-4 h-4" />
              Kirim via WhatsApp
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 px-5 py-4">
            <p className="text-gray-900 font-semibold text-sm m-0 mb-1">Respon cepat di jam operasional</p>
            <p className="text-[13px] text-gray-500 leading-relaxed m-0">
              Setiap hari 10.00–19.00 WIB. Di luar jam itu, Grisela — asisten AI kami — tetap siap
              menjawab pertanyaan produk di halaman produk.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 px-5 py-4">
            <p className="text-gray-900 font-semibold text-sm m-0 mb-1">Pengadaan perusahaan?</p>
            <p className="text-[13px] text-gray-500 leading-relaxed m-0 mb-2">
              Untuk penawaran resmi instansi & korporasi, gunakan email atau halaman pengadaan.
            </p>
            <Link to="/pengadaan" className="text-[13px] font-semibold text-red-600 no-underline hover:underline">
              Info Pengadaan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
