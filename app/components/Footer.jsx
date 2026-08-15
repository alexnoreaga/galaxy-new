import {useMatches, NavLink, useLocation} from '@remix-run/react';
import {FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaXTwitter, FaWhatsapp} from 'react-icons/fa6';
import {FooterColumn1} from '~/components/FooterColumn1';
import {FooterColumn2} from '~/components/FooterColumn2';
import {MastheadOrnament, resolveMastheadTheme} from '~/components/MastheadOrnament';

const socials = [
  {href: 'https://www.instagram.com/galaxycamera99', icon: <FaInstagram />, label: 'Instagram'},
  {href: 'https://www.facebook.com/galaxycamera99', icon: <FaFacebookF />, label: 'Facebook'},
  {href: 'https://www.tiktok.com/@galaxycameraid', icon: <FaTiktok />, label: 'TikTok'},
  {href: 'https://www.youtube.com/galaxycamera', icon: <FaYoutube />, label: 'YouTube'},
  {href: 'https://www.x.com/galaxycamera99', icon: <FaXTwitter />, label: 'X'},
];

// Column heading — tiny tracked caps + the site's red accent bar
function FooterHeading({children}) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-200 m-0">{children}</h3>
      <span className="block w-6 h-0.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 mt-1.5" />
    </div>
  );
}

export function Footer({menu}) {
  const location = useLocation();
  // The footer bookends the masthead: same near-black, same seasonal gold ornament
  const mastheadTheme = resolveMastheadTheme(location.search);

  return (
    <footer className="relative overflow-hidden text-white bg-gray-950 border-t border-white/10">
      {/* Subtle dot texture — same language as the dark bands */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{opacity: 0.04, backgroundImage: 'radial-gradient(circle at center, #fff 0.6px, transparent 0.6px)', backgroundSize: '22px 22px'}}
      />
      {/* Seasonal gold ornament — fixed height so the artwork renders at its natural scale */}
      <div
        aria-hidden="true"
        className="hidden sm:block absolute right-0 bottom-16 h-16 w-64 pointer-events-none opacity-40 -scale-x-100 [mask-image:linear-gradient(to_right,black_35%,transparent)]"
      >
        <MastheadOrnament theme={mastheadTheme} id="gxOrnFooter" />
      </div>

      {/* Main footer content */}
      <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-9 lg:gap-10">

          {/* Col 1: Logo + contact */}
          <div className="sm:col-span-2 lg:col-span-1">
            <FooterColumn1 />
          </div>

          {/* Col 2: Galaxy links */}
          <FooterColumn2 />

          {/* Col 3: Information (Shopify menu) */}
          <FooterMenu menu={menu} />

          {/* Col 4: Jam operasional + social */}
          <div className="flex flex-col gap-5">
            <div>
              <FooterHeading>Jam Operasional</FooterHeading>
              <p className="text-gray-400 text-sm mt-3 mb-0.5">Buka setiap hari</p>
              <p className="text-white text-xl font-bold tracking-tight m-0">10.00 – 19.00</p>
            </div>

            <a
              href="https://wa.me/6282111311131"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors no-underline w-fit shadow-lg shadow-emerald-950/40"
            >
              <FaWhatsapp className="w-4 h-4" />
              Chat via WhatsApp
            </a>

            <div>
              <FooterHeading>Ikuti Kami</FooterHeading>
              <div className="flex items-center gap-2.5 mt-3">
                {socials.map(({href, icon, label}) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 bg-white/5 ring-1 ring-white/10 hover:text-white hover:bg-white/15 hover:-translate-y-0.5 transition-all duration-200 no-underline"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — mirrors the masthead's charcoal utility strip */}
      <div className="relative bg-gray-900 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-gray-500">
          <p className="m-0">© {new Date().getFullYear()} Galaxy Camera — PT Galaxy Digital Niaga. All rights reserved.</p>
          <p className="m-0">
            Part of <span className="text-gray-300 font-semibold">Galaxycamera.id</span> · Toko Kamera Terpercaya Sejak 2014
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterMenu({menu}) {
  const [root] = useMatches();
  const publicStoreDomain = root?.data?.publicStoreDomain;

  return (
    <div className="flex flex-col gap-4">
      <FooterHeading>Informasi</FooterHeading>
      <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
        {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
          if (!item.url) return null;
          const url =
            item.url.includes('myshopify.com') || item.url.includes(publicStoreDomain)
              ? new URL(item.url).pathname
              : item.url;
          const isExternal = !url.startsWith('/');
          const cls = 'inline-block text-gray-400 hover:text-white hover:translate-x-0.5 text-sm transition-all duration-200 no-underline';
          return (
            <li key={item.id} className="m-0">
              {isExternal ? (
                <a href={url} rel="noopener noreferrer" target="_blank" className={cls}>
                  {item.title}
                </a>
              ) : (
                <NavLink end prefetch="intent" to={url} className={cls}>
                  {item.title}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {id: 'gid://shopify/MenuItem/461633060920', resourceId: 'gid://shopify/ShopPolicy/23358046264', tags: [], title: 'Privacy Policy', type: 'SHOP_POLICY', url: '/policies/privacy-policy', items: []},
    {id: 'gid://shopify/MenuItem/461633093688', resourceId: 'gid://shopify/ShopPolicy/23358013496', tags: [], title: 'Refund Policy', type: 'SHOP_POLICY', url: '/policies/refund-policy', items: []},
    {id: 'gid://shopify/MenuItem/461633126456', resourceId: 'gid://shopify/ShopPolicy/23358111800', tags: [], title: 'Shipping Policy', type: 'SHOP_POLICY', url: '/policies/shipping-policy', items: []},
    {id: 'gid://shopify/MenuItem/461633159224', resourceId: 'gid://shopify/ShopPolicy/23358079032', tags: [], title: 'Terms of Service', type: 'SHOP_POLICY', url: '/policies/terms-of-service', items: []},
  ],
};
