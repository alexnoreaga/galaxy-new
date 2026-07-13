import { useState, useEffect } from 'react';
import { json } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { FaWhatsapp, FaTiktok, FaYoutube, FaLocationDot, FaCameraRetro, FaBuilding, FaChevronRight } from 'react-icons/fa6';
import { trackEvent, GriselaAvatar } from '~/components/ProductAIChat';
import { GriselaGeneralChat } from '~/components/GriselaGeneralChat';
import { getAutomaticDiscounts, getActiveFlashProducts } from '~/lib/autoDiscounts';

export async function loader({ context }) {
  const discounts = await getAutomaticDiscounts(context.env).catch(() => []);
  const flashMap = getActiveFlashProducts(discounts, 50);
  let saleEndsAt = null;
  for (const d of flashMap.values()) {
    if (d.endsAt && (!saleEndsAt || new Date(d.endsAt) < new Date(saleEndsAt))) saleEndsAt = d.endsAt;
  }
  return json({ flashCount: flashMap.size, saleEndsAt });
}

export const meta = () => {
  return [
    { title: 'Galaxy Camera — Semua Link' },
    { name: 'description', content: 'Toko kamera terpercaya sejak 2014 · Tangerang & Depok. Chat AI Grisela, belanja online, dan kunjungi toko kami.' },
    { name: 'robots', content: 'noindex' },
  ];
};

const LOGO = 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png?v=1731132105';
const WA_LINK = `https://wa.me/6282111311131?text=${encodeURIComponent('Halo admin Galaxy Camera 😊 Saya dari Instagram, mau tanya-tanya ya')}`;

const LINK_GROUPS = [
  {
    label: 'Belanja Online',
    links: [
      { name: 'Website Resmi Galaxy.co.id', href: '/', icon: <img src="/favicon-96x96.png" alt="" className="w-6 h-6 object-contain" />, iconBg: 'bg-white', featured: true },
      { name: 'Tokopedia', href: 'https://www.tokopedia.com/galaxycamera', badge: 'T', badgeColor: '#03ac0e' },
      { name: 'Shopee', href: 'https://shopee.co.id/galaxycamera', badge: 'S', badgeColor: '#ee4d2d' },
      { name: 'Blibli', href: 'https://www.blibli.com/merchant/galaxy-camera-flagship-store/GAC-49845', badge: 'B', badgeColor: '#0095da' },
    ],
  },
  {
    label: 'Kunjungi Toko — Bisa Nego Langsung!',
    links: [
      { name: 'Toko Tangerang · Metropolis Town Square', href: 'https://www.google.com/maps/search/?api=1&query=Galaxy+Camera+Mall+Metropolis+Town+Square+Tangerang', icon: <FaLocationDot className="text-emerald-600" />, iconBg: 'bg-emerald-50' },
      { name: 'Toko Depok · Depok Town Square', href: 'https://www.google.com/maps/search/?api=1&query=Galaxy+Camera+Depok+Town+Square', icon: <FaLocationDot className="text-emerald-600" />, iconBg: 'bg-emerald-50' },
    ],
  },
  {
    label: 'Layanan Lainnya',
    links: [
      { name: 'Jual Kamera Bekas Kamu', href: 'https://kamerabekas.id', icon: <FaCameraRetro className="text-amber-600" />, iconBg: 'bg-amber-50' },
      { name: 'Pengadaan Kantor / Sekolah / Instansi', href: '/pengadaan', icon: <FaBuilding className="text-blue-600" />, iconBg: 'bg-blue-50' },
    ],
  },
  {
    label: 'Ikuti Kami',
    links: [
      { name: 'TikTok @galaxycameraid', href: 'https://www.tiktok.com/@galaxycameraid', icon: <FaTiktok className="text-gray-900" />, iconBg: 'bg-gray-100' },
      { name: 'YouTube Galaxy Camera', href: 'https://www.youtube.com/galaxycamera', icon: <FaYoutube className="text-red-600" />, iconBg: 'bg-red-50' },
    ],
  },
];

function BioCountdown({ endsAt }) {
  // null until mounted — avoids SSR/client hydration mismatch on time
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = now === null ? null : Math.max(0, new Date(endsAt).getTime() - now);
  if (left !== null && left <= 0) return null;
  const d = left === null ? null : Math.floor(left / 86400000);
  const v = (n) => (left === null ? '--' : String(n).padStart(2, '0'));
  const Box = ({ val }) => (
    <span className="bg-black/40 text-white font-mono font-bold text-[11px] rounded px-1 py-0.5 min-w-[22px] text-center inline-block tabular-nums leading-tight">
      {val}
    </span>
  );
  return (
    <div className="flex items-center gap-0.5">
      {(left === null ? false : d > 0) && (
        <>
          <Box val={left === null ? '--' : d} />
          <span className="text-white/90 text-[9px] font-bold mx-0.5">hr</span>
        </>
      )}
      <Box val={v(left === null ? null : Math.floor((left % 86400000) / 3600000))} />
      <span className="text-white font-black text-[11px]">:</span>
      <Box val={v(left === null ? null : Math.floor((left % 3600000) / 60000))} />
      <span className="text-white font-black text-[11px]">:</span>
      <Box val={v(left === null ? null : Math.floor((left % 60000) / 1000))} />
    </div>
  );
}

export default function Bio() {
  const { flashCount, saleEndsAt } = useLoaderData();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <div className="max-w-md mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-7">
          <img src={LOGO} alt="Galaxy Camera" className="h-12 mx-auto mb-3 object-contain" />
          <p className="text-sm text-gray-500">
            Toko Kamera Terpercaya sejak 2014
            <br />
            Tangerang · Depok · Garansi Resmi
          </p>
        </div>

        {/* Grisela hero button */}
        <button
          onClick={() => setChatOpen(true)}
          className="w-full flex items-center gap-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-2xl px-4 py-3.5 shadow-lg shadow-rose-200 transition-all mb-7"
        >
          <div className="relative flex-shrink-0">
            <GriselaAvatar size="w-12 h-12" />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-rose-600">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-[15px] leading-tight">Tanya Grisela</p>
            <p className="text-xs text-rose-100 mt-0.5">Asisten AI Galaxy — Online 24 Jam</p>
          </div>
          <FaChevronRight className="text-rose-200 flex-shrink-0" />
        </button>

        {/* WhatsApp admin — right below Grisela */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('bio_link_clicked', '', 'Chat Admin WhatsApp')}
          className="w-full flex items-center gap-3 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white rounded-2xl px-4 py-3.5 shadow-lg shadow-green-200 transition-all -mt-4 mb-7"
        >
          <span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <FaWhatsapp className="text-2xl" />
          </span>
          <div className="flex-1 text-left">
            <p className="font-bold text-[15px] leading-tight">Chat Admin WhatsApp</p>
            <p className="text-xs text-green-100 mt-0.5">Dilayani langsung oleh tim kami</p>
          </div>
          <FaChevronRight className="text-green-200 flex-shrink-0" />
        </a>

        {/* FLASH SALE — only appears while a sale is live */}
        {flashCount > 0 && (
          <Link
            to="/flash-sale"
            onClick={() => trackEvent('bio_link_clicked', '', 'Flash Sale')}
            className="relative block w-full overflow-hidden rounded-2xl -mt-4 mb-7 active:scale-[0.98] transition-transform no-underline"
            style={{ background: 'linear-gradient(110deg, #b71c1c 0%, #e53935 45%, #f4511e 100%)', boxShadow: '0 8px 24px rgba(229,57,53,0.35)' }}
          >
            {/* Stripes + shine sweep */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 14px)' }}
            />
            <div
              className="absolute inset-y-0 w-20 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)',
                animation: 'bioFlashShine 2.4s ease-in-out infinite',
              }}
            />
            <style>{`@keyframes bioFlashShine { 0% { left: -25%; } 60% { left: 110%; } 100% { left: 110%; } }`}</style>

            <div className="relative flex items-center gap-3 px-4 py-3.5">
              <span className="text-2xl animate-pulse flex-shrink-0">⚡</span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white font-black italic text-[16px] tracking-wider leading-tight drop-shadow-sm">FLASH SALE</p>
                <p className="text-yellow-200 text-xs font-bold mt-0.5">
                  {flashCount} produk diskon kilat — buruan sebelum habis!
                </p>
                {saleEndsAt && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-white/85 font-bold uppercase tracking-wider" style={{ fontSize: 9 }}>Berakhir</span>
                    <BioCountdown endsAt={saleEndsAt} />
                  </div>
                )}
              </div>
              <FaChevronRight className="text-white/80 flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* Link groups */}
        {LINK_GROUPS.map(group => (
          <div key={group.label} className="mb-6">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{group.label}</p>
            <div className="flex flex-col gap-2">
              {group.links.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={() => trackEvent('bio_link_clicked', '', link.name)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all group ${
                    link.featured
                      ? 'bg-rose-50 border-2 border-rose-300 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-100'
                      : 'bg-white border border-gray-200 hover:border-rose-300 hover:shadow-md'
                  }`}
                >
                  {link.badge ? (
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                      style={{ backgroundColor: link.badgeColor }}
                    >
                      {link.badge}
                    </span>
                  ) : (
                    <span className={`w-9 h-9 rounded-full ${link.iconBg} flex items-center justify-center text-base flex-shrink-0 ${link.featured ? 'shadow-sm' : ''}`}>
                      {link.icon}
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-800 leading-snug">{link.name}</span>
                    {link.featured && (
                      <span className="block text-[11px] text-rose-600 font-medium mt-0.5">Ada voucher tambahan khusus website 🎟️</span>
                    )}
                  </span>
                  <FaChevronRight className={`text-xs flex-shrink-0 transition-colors ${link.featured ? 'text-rose-400 group-hover:text-rose-600' : 'text-gray-300 group-hover:text-rose-400'}`} />
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Buka Setiap Hari · 10.00–19.00 WIB
          <br />© {new Date().getFullYear()} Galaxy Camera
        </p>
      </div>

      <GriselaGeneralChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        source="instagram-bio"
        waMessage={'Halo admin Galaxy Camera 😊 Saya dari Instagram, sudah chat dengan Grisela. Mau tanya lebih lanjut ya.'}
      />
    </div>
  );
}
