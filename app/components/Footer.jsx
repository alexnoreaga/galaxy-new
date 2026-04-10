import {useMatches, NavLink} from '@remix-run/react';
import {FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaXTwitter, FaWhatsapp} from 'react-icons/fa6';
import {FooterColumn1} from '~/components/FooterColumn1';
import {FooterColumn2} from '~/components/FooterColumn2';

const socials = [
  {href: 'https://www.instagram.com/galaxycamera99', icon: <FaInstagram />, label: 'Instagram'},
  {href: 'https://www.facebook.com/galaxycamera99', icon: <FaFacebookF />, label: 'Facebook'},
  {href: 'https://www.tiktok.com/@galaxycameraid', icon: <FaTiktok />, label: 'TikTok'},
  {href: 'https://www.youtube.com/galaxycamera', icon: <FaYoutube />, label: 'YouTube'},
  {href: 'https://www.x.com/galaxycamera99', icon: <FaXTwitter />, label: 'X'},
];

export function Footer({menu}) {
  return (
    <footer className="text-white" style={{ background: 'linear-gradient(180deg, #0d1526 0%, #080d1a 100%)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Col 1: Logo + contact */}
          <div className="sm:col-span-2 lg:col-span-1">
            <FooterColumn1 />
          </div>

          {/* Col 2: Galaxy links */}
          <FooterColumn2 />

          {/* Col 3: Information (Shopify menu) */}
          <FooterMenu menu={menu} />

          {/* Col 4: Jam operasional + social */}
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-2">Jam Operasional</h3>
              <p className="text-gray-400 text-sm">Buka setiap hari</p>
              <p className="text-gray-300 text-sm font-medium">10.00 – 19.00</p>
            </div>

            <a
              href="https://wa.me/6282111311131"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors no-underline w-fit"
            >
              <FaWhatsapp className="w-4 h-4" />
              Chat via WhatsApp
            </a>

            <div className="mt-1">
              <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">Ikuti Kami</h3>
              <div className="flex items-center gap-2.5">
                {socials.map(({href, icon, label}) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors no-underline" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 py-2 text-center" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)' }}>
          <p>© {new Date().getFullYear()} Galaxy Camera — PT Galaxy Digital Niaga. All rights reserved. · Toko Kamera Online Terpercaya Sejak 2014</p>
        </div>
      </div>
    </footer>
  );
}

function FooterMenu({menu}) {
  const [root] = useMatches();
  const publicStoreDomain = root?.data?.publicStoreDomain;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-white text-sm font-semibold uppercase tracking-wider">Informasi</h3>
      <ul className="flex flex-col gap-2">
        {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
          if (!item.url) return null;
          const url =
            item.url.includes('myshopify.com') || item.url.includes(publicStoreDomain)
              ? new URL(item.url).pathname
              : item.url;
          const isExternal = !url.startsWith('/');
          return (
            <li key={item.id}>
              {isExternal ? (
                <a
                  href={url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-gray-400 hover:text-white text-sm transition-colors no-underline"
                >
                  {item.title}
                </a>
              ) : (
                <NavLink
                  end
                  prefetch="intent"
                  to={url}
                  className="text-gray-400 hover:text-white text-sm transition-colors no-underline"
                >
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
