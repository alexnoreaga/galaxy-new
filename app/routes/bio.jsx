import { useState, useEffect } from 'react';
import { json } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { FaWhatsapp, FaTiktok, FaYoutube, FaLocationDot, FaCameraRetro, FaBuilding, FaChevronRight } from 'react-icons/fa6';
import { trackEvent, GriselaAvatar } from '~/components/ProductAIChat';
import { GriselaGeneralChat } from '~/components/GriselaGeneralChat';
import { getAutomaticDiscounts, getActiveFlashProducts, isAccessoryTitle } from '~/lib/autoDiscounts';

export async function loader({ context }) {
  const discounts = await getAutomaticDiscounts(context.env).catch(() => []);
  const flashMap = getActiveFlashProducts(discounts, 20);
  let saleEndsAt = null;
  for (const d of flashMap.values()) {
    if (d.endsAt && (!saleEndsAt || new Date(d.endsAt) < new Date(saleEndsAt))) saleEndsAt = d.endsAt;
  }

  // Fetch + rank flash products: deepest discount first, main devices boosted over accessories
  let flashItems = [];
  if (flashMap.size > 0) {
    try {
      const data = await context.storefront.query(BIO_FLASH_QUERY, {
        variables: { ids: [...flashMap.keys()] },
      });
      flashItems = (data?.nodes ?? [])
        .filter(Boolean)
        .map(p => {
          const d = flashMap.get(p.id);
          if (!d) return null;
          const variants = p.variants?.nodes ?? [];
          const v = d.variantIds
            ? (variants.find(x => d.variantIds.includes(x.id)) ?? null)
            : variants[0];
          if (!v || !v.availableForSale) return null;
          const base = parseFloat(v.price?.amount ?? 0);
          const compareAt = parseFloat(v.compareAtPrice?.amount ?? 0);
          const price = Math.max(0, d.type === 'amount' ? base - d.amount : Math.round(base * (1 - d.percentage / 100)));
          const strikeAt = Math.max(compareAt, base);
          return {
            title: p.title,
            handle: p.handle,
            image: p.featuredImage?.url ?? null,
            price,
            strikeAt,
            pct: strikeAt > price ? Math.round((1 - price / strikeAt) * 100) : 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const score = it => (isAccessoryTitle(it.title) ? 0 : 15) + it.pct;
          return score(b) - score(a);
        })
        .slice(0, 6);
    } catch {
      // rail is best-effort — the FLASH SALE header still renders
    }
  }

  // Cuci Gudang clearance rail (collection-driven), same ranking as flash
  let cuciItems = [];
  try {
    const cg = await context.storefront.query(BIO_CUCI_GUDANG_QUERY, { variables: { handle: 'cuci-gudang' } });
    cuciItems = (cg?.collection?.products?.nodes ?? [])
      .filter(Boolean)
      .map(p => {
        const price = parseFloat(p.priceRange?.minVariantPrice?.amount ?? 0);
        const strikeAt = parseFloat(p.compareAtPriceRange?.minVariantPrice?.amount ?? 0);
        if (!price) return null;
        return {
          title: p.title,
          handle: p.handle,
          image: p.featuredImage?.url ?? null,
          price,
          strikeAt,
          pct: strikeAt > price ? Math.round((1 - price / strikeAt) * 100) : 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const score = it => (isAccessoryTitle(it.title) ? 0 : 15) + it.pct;
        return score(b) - score(a);
      })
      .slice(0, 6);
  } catch {
    // best-effort — section just won't render
  }

  return json({ flashCount: flashMap.size, saleEndsAt, flashItems, cuciItems });
}

const BIO_FLASH_QUERY = `#graphql
  query BioFlashProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        featuredImage { url altText }
        variants(first: 10) {
          nodes {
            id
            availableForSale
            price { amount }
            compareAtPrice { amount }
          }
        }
      }
    }
  }
`;

const BIO_CUCI_GUDANG_QUERY = `#graphql
  query BioCuciGudang($handle: String!) {
    collection(handle: $handle) {
      products(first: 12) {
        nodes {
          id
          title
          handle
          featuredImage { url altText }
          priceRange { minVariantPrice { amount } }
          compareAtPriceRange { minVariantPrice { amount } }
        }
      }
    }
  }
`;

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
  const { flashCount, saleEndsAt, flashItems = [], cuciItems = [] } = useLoaderData();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-10">
        {/* Header — compact: logo only, trust line moved to footer */}
        <div className="text-center mb-5">
          <img src={LOGO} alt="Galaxy Camera" className="h-10 mx-auto object-contain" />
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

        {/* FLASH SALE — merged card: header + product rail, only while a sale is live */}
        {flashCount > 0 && (
          <div
            className="relative w-full overflow-hidden rounded-2xl -mt-4 mb-7"
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

            {/* Header — links to /flash-sale */}
            <Link
              to="/flash-sale"
              onClick={() => trackEvent('bio_link_clicked', '', 'Flash Sale')}
              className="relative flex items-center gap-2.5 px-4 pt-3 pb-2 no-underline active:opacity-90"
            >
              <span className="text-xl animate-pulse flex-shrink-0">⚡</span>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-black italic text-[16px] tracking-wider leading-tight drop-shadow-sm whitespace-nowrap">FLASH SALE</p>
                  <span className="text-white text-[11px] font-bold whitespace-nowrap">Lihat Semua →</span>
                </div>
                {saleEndsAt && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-white/85 font-bold uppercase tracking-wider" style={{ fontSize: 9 }}>Berakhir</span>
                    <BioCountdown endsAt={saleEndsAt} />
                  </div>
                )}
              </div>
            </Link>

            {/* Product rail — ranked by discount depth, main devices first */}
            {flashItems.length > 0 && (
              <div
                className="relative flex gap-2 overflow-x-auto px-3 pb-3 pt-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {flashItems.map(it => (
                  <Link
                    key={it.handle}
                    to={`/products/${it.handle}`}
                    onClick={() => trackEvent('bio_link_clicked', '', 'Flash Sale Produk')}
                    className="flex-shrink-0 w-28 bg-white rounded-lg overflow-hidden no-underline"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
                  >
                    <div className="relative bg-gray-50" style={{ aspectRatio: '1/1' }}>
                      {it.pct > 0 && (
                        <div className="absolute top-1 left-1 z-10 bg-yellow-400 text-red-900 font-black text-[9px] px-1 py-0.5 rounded-sm leading-none">
                          -{it.pct}%
                        </div>
                      )}
                      {it.image ? (
                        <img src={it.image} alt={it.title} loading="lazy" className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200 text-2xl">📷</div>
                      )}
                    </div>
                    <div className="px-1.5 pt-1 pb-1.5">
                      <p className="text-gray-700 leading-tight line-clamp-1" style={{ fontSize: 9 }}>{it.title}</p>
                      <p className="font-black text-[11px] leading-tight mt-0.5" style={{ color: '#e53935' }}>
                        Rp{Math.round(it.price).toLocaleString('id-ID')}
                      </p>
                      {it.strikeAt > it.price && (
                        <p className="text-gray-400 line-through leading-tight" style={{ fontSize: 8 }}>
                          Rp{Math.round(it.strikeAt).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CUCI GUDANG — merged card (purple/fuchsia), matches flash sale layout */}
        {cuciItems.length > 0 && (
          <div
            className={`relative w-full overflow-hidden rounded-2xl mb-7 ${flashCount > 0 ? '-mt-5' : '-mt-4'}`}
            style={{ background: 'linear-gradient(110deg, #6d28d9 0%, #a21caf 48%, #db2777 100%)', boxShadow: '0 8px 24px rgba(162,28,175,0.35)' }}
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
                animation: 'bioCuciShine 2.4s ease-in-out infinite',
              }}
            />
            <style>{`@keyframes bioCuciShine { 0% { left: -25%; } 60% { left: 110%; } 100% { left: 110%; } }`}</style>

            {/* Header — links to /collections/cuci-gudang */}
            <Link
              to="/collections/cuci-gudang"
              onClick={() => trackEvent('bio_link_clicked', '', 'Cuci Gudang')}
              className="relative flex items-center gap-2.5 px-4 pt-3 pb-2 no-underline active:opacity-90"
            >
              <span className="text-xl animate-pulse flex-shrink-0">🔥</span>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-black italic text-[16px] tracking-wider leading-tight drop-shadow-sm whitespace-nowrap">CUCI GUDANG</p>
                  <span className="text-white text-[11px] font-bold whitespace-nowrap">Lihat Semua →</span>
                </div>
                <p className="text-white/85 font-bold uppercase tracking-wider mt-1" style={{ fontSize: 9 }}>Harga Miring · Stok Terbatas</p>
              </div>
            </Link>

            {/* Product rail — ranked, main devices first */}
            <div
              className="relative flex gap-2 overflow-x-auto px-3 pb-3 pt-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {cuciItems.map(it => (
                <Link
                  key={it.handle}
                  to={`/products/${it.handle}`}
                  onClick={() => trackEvent('bio_link_clicked', '', 'Cuci Gudang Produk')}
                  className="flex-shrink-0 w-28 bg-white rounded-lg overflow-hidden no-underline"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
                >
                  <div className="relative bg-gray-50" style={{ aspectRatio: '1/1' }}>
                    {it.pct > 0 && (
                      <div className="absolute top-1 left-1 z-10 bg-yellow-300 text-fuchsia-900 font-black text-[9px] px-1 py-0.5 rounded-sm leading-none">
                        -{it.pct}%
                      </div>
                    )}
                    {it.image ? (
                      <img src={it.image} alt={it.title} loading="lazy" className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200 text-2xl">📷</div>
                    )}
                  </div>
                  <div className="px-1.5 pt-1 pb-1.5">
                    <p className="text-gray-700 leading-tight line-clamp-1" style={{ fontSize: 9 }}>{it.title}</p>
                    <p className="font-black text-[11px] leading-tight mt-0.5" style={{ color: '#a21caf' }}>
                      Rp{Math.round(it.price).toLocaleString('id-ID')}
                    </p>
                    {it.strikeAt > it.price && (
                      <p className="text-gray-400 line-through leading-tight" style={{ fontSize: 8 }}>
                        Rp{Math.round(it.strikeAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
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
          <br />Terpercaya Sejak 2014 · Tangerang · Depok · Garansi Resmi
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
