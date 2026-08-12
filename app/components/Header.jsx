import {Await, NavLink, useMatches, Link} from '@remix-run/react';
import {Suspense, useState, useEffect} from 'react';
import {FaInstagram, FaTiktok, FaYoutube, FaXTwitter, FaWhatsapp, FaFacebookF} from 'react-icons/fa6';
import {PredictiveSearchForm, PredictiveSearchResults} from '~/components/Search';
import {useLocation, useNavigate, useNavigation} from '@remix-run/react';
import {FaRegCircleUser} from 'react-icons/fa6';
import {NearestStoreBar} from '~/components/NearestStoreBar';

export function Header({header, isLoggedIn, cart}) {
  const routes = [
    {path: '/collections', label: 'Collections'},
    {path: '/products', label: 'Product'},
    {path: '/pages', label: 'Pages'},
    {path: '/policies', label: 'Policies'},
    {path: '/brands', label: 'Brands'},
  ];

  const {shop, menu} = header;

  // On mobile PRODUCT pages we collapse the header to a single compact bar
  // (back · search · account · cart) — logo, mobile search row, and store bar are hidden.
  const location = useLocation();
  const navigate = useNavigate();
  const isProduct = location.pathname.includes('/products/');
  const isHome = location.pathname === '/';
  // Collection HANDLE pages (drill-downs) get the product-style treatment: back button + no store bar.
  // '/collections/xxx' has the trailing slash; the bare '/collections' index does NOT, so this is precise.
  const isCollectionHandle = location.pathname.includes('/collections/');
  // Collections INDEX is a top-level nav tab — keep the hamburger, just drop the store bar.
  const isCollectionsIndex = location.pathname === '/collections';
  // Pages that show a mobile back button + hide the hamburger/logo (compact drill-down bar)
  const isDrillDown = isProduct || isCollectionHandle;

  // Full-screen loader: only on a REAL page change to a shopping route — never during same-page
  // pagination (infinite scroll navigates within the same pathname + a cursor, which was blinking black).
  const navigation = useNavigation();
  const navTarget = navigation.state === 'loading' ? (navigation.location?.pathname ?? '') : '';
  const showNavOverlay = !!navTarget && navTarget !== location.pathname && routes.some((r) => navTarget.startsWith(r.path));

  function goBack() {
    // React Router stores a history index; >0 means there's in-app history to pop
    const idx = typeof window !== 'undefined' ? window.history.state?.idx ?? 0 : 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  }

  return (
    <>
      {/* Page-transition loading overlay — only on a real page change, not same-page pagination */}
      {showNavOverlay && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div role="status">
            <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {/* Top bar — desktop only */}
      <div className="hidden sm:block bg-gray-900 text-white">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 h-9 text-xs">
          <div className="flex items-center">
            <span className="text-[11px] text-gray-400">
              Part of <span className="ml-0.5 font-semibold text-gray-200">Galaxycamera.id</span>
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <a href="https://wa.me/6282111311131" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors no-underline">
              <FaWhatsapp size="0.9em" />
              <span className="text-[11px]">0821-1131-1131</span>
            </a>
            <div className="w-px h-3.5 bg-gray-700" />
            <div className="flex items-center gap-2.5">
              {[
                {href: 'https://instagram.com/galaxycamera99', icon: <FaInstagram size="0.9em" />},
                {href: 'https://facebook.com/galaxycamera99', icon: <FaFacebookF size="0.9em" />},
                {href: 'https://www.tiktok.com/@galaxycameraid', icon: <FaTiktok size="0.9em" />},
                {href: 'https://www.youtube.com/galaxycamera', icon: <FaYoutube size="0.9em" />},
                {href: 'https://www.x.com/galaxycamera99', icon: <FaXTwitter size="0.9em" />},
              ].map(({href, icon}) => (
                <a key={href} href={href} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors no-underline">
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main header + sub-bars all sticky together.
          On mobile HOMEPAGE the bar goes charcoal (curved-hero treatment); white everywhere else and on sm+. */}
      <header className={`sticky top-0 z-40 backdrop-blur-lg shadow-sm ${isHome ? 'bg-gray-900 sm:bg-white/95' : 'bg-white/95'}`}>
        <div className={`flex items-center gap-3 w-full px-4 py-2.5 max-w-7xl mx-auto ${isHome ? 'sm:border-b sm:border-gray-100' : 'border-b border-gray-100'}`}>

          {/* Back button — mobile drill-down pages (product + collection handle) */}
          {isDrillDown && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Kembali"
              className="sm:hidden -ml-1.5 flex items-center justify-center w-9 h-9 rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-all flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Left: hamburger + logo. On mobile homepage we keep the hamburger but
              drop the wordmark (search-first, eraspace-style); logo returns on sm+. */}
          <div className={`${isDrillDown ? 'hidden sm:flex' : 'flex'} items-center gap-3 flex-shrink-0`}>
            <HeaderMenuMobileToggle onDark={isHome} />
            <NavLink prefetch="intent" to="/" style={activeLinkStyle} end className="hidden sm:block flex-shrink-0 hover:opacity-80 transition-opacity">
              <img
                className="h-7 sm:h-8 lg:h-10 w-auto"
                src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png?v=1731132105"
                alt="Logo Galaxy Camera"
                width={160}
                height={40}
                loading="eager"
                fetchPriority="high"
              />
            </NavLink>
          </div>

          {/* Center: desktop nav + search (+ inline search on mobile product pages) */}
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="hidden lg:flex items-center flex-shrink-0">
              <HeaderMenu menu={menu} viewport="desktop" />
              <span className="mx-3 h-4 w-px bg-gray-200" />
              <Link
                to="/pengadaan"
                prefetch="intent"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline whitespace-nowrap"
              >
                Info Pengadaan
              </Link>
            </div>
            <div className="hidden sm:block flex-1 max-w-xl">
              <SearchToggle />
            </div>
            {/* Inline mobile search — now on every mobile page (homepage collapsed to one row) */}
            <div className="sm:hidden flex-1 min-w-0">
              <SearchToggleMobile />
            </div>
          </div>

          {/* Right: account + cart */}
          <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} onDark={isHome} />
        </div>

        {/* Nearest store bar — hidden on mobile for product, home (moves into curved hero), and all
            collection pages (handle + index). Still shows on sm+. */}
        <div className={isProduct || isHome || isCollectionHandle || isCollectionsIndex ? 'hidden sm:block' : ''}>
          <NearestStoreBar />
        </div>
      </header>

      {/* Charcoal curved hero — MOBILE HOMEPAGE ONLY. Carries the store-locator line in white
          (Blibli-style: location above the banner) then curves at the bottom; the homepage banner
          is pulled up to overlap this curve (eraspace-style layering). The extra pb keeps the navy
          long enough that the location line sits fully above the banner and the arc still hugs it. */}
      {isHome && (
        <div
          className="sm:hidden bg-gray-900 pt-0.5 pb-8"
          style={{borderBottomLeftRadius: '50% 26px', borderBottomRightRadius: '50% 26px'}}
        >
          <NearestStoreBar variant="hero" />
        </div>
      )}
    </>
  );
}

export function HeaderMenu({menu, viewport}) {
  const [root] = useMatches();
  const publicStoreDomain = root?.data?.publicStoreDomain;
  const className = `header-menu-${viewport}`;

  function closeAside(event) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink end onClick={closeAside} prefetch="intent" style={activeLinkStyle} to="/">
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;
        const url =
          item.url.includes('myshopify.com') || item.url.includes(publicStoreDomain)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={closeAside}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            <span className="text-sm font-medium">{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

// Rich, interactive mobile menu drawer content (replaces the old plain link list).
export function MobileMenuNav({menu, isLoggedIn}) {
  const [root] = useMatches();
  const publicStoreDomain = root?.data?.publicStoreDomain;
  const [openId, setOpenId] = useState(null);

  const items = (menu || FALLBACK_HEADER_MENU).items || [];
  const norm = (url) => {
    if (!url) return '/';
    return url.includes('myshopify.com') || (publicStoreDomain && url.includes(publicStoreDomain))
      ? new URL(url).pathname
      : url;
  };
  const closeMenu = () => { if (typeof window !== 'undefined') window.location.hash = ''; };

  const tiles = [
    {to: '/collections', label: 'Kategori', wrap: 'bg-blue-50', tint: 'text-blue-600',
      path: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'},
    {to: '/flash-sale', label: 'Flash Sale', wrap: 'bg-red-50', tint: 'text-red-600',
      path: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z'},
    {to: '/promo', label: 'Promo', wrap: 'bg-amber-50', tint: 'text-amber-600',
      path: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z'},
    {to: '/kredit-kamera', label: 'Cicilan', wrap: 'bg-indigo-50', tint: 'text-indigo-600',
      path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z'},
  ];

  const helpLinks = [
    {to: '/pengadaan', label: 'Info Pengadaan'},
    {to: '/stores', label: 'Lokasi Toko'},
    {to: '/blogs', label: 'Blog & Artikel'},
    {to: '/pages/about', label: 'Tentang Kami'},
    {to: '/policies', label: 'Kebijakan & Bantuan'},
  ];

  const socials = [
    {href: 'https://instagram.com/galaxycamera99', icon: <FaInstagram size="1.1em" />},
    {href: 'https://facebook.com/galaxycamera99', icon: <FaFacebookF size="1.1em" />},
    {href: 'https://www.tiktok.com/@galaxycameraid', icon: <FaTiktok size="1.1em" />},
    {href: 'https://www.youtube.com/galaxycamera', icon: <FaYoutube size="1.1em" />},
    {href: 'https://www.x.com/galaxycamera99', icon: <FaXTwitter size="1.1em" />},
  ];

  return (
    <nav className="h-full overflow-y-auto pb-8" role="navigation" aria-label="Menu utama">
      {/* Account card */}
      {isLoggedIn ? (
        <Link to="/account" onClick={closeMenu} prefetch="intent"
          className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 text-white px-4 py-3.5 no-underline active:scale-[0.99] transition-transform">
          <span className="flex items-center gap-3">
            <FaRegCircleUser className="w-7 h-7" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Akun Saya</span>
              <span className="text-[11px] text-white/70">Pesanan, alamat & pengaturan</span>
            </span>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </Link>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
          <p className="text-[13px] text-gray-600 leading-snug mb-3">Masuk untuk melihat pesanan & dapatkan promo khusus member.</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/account/login" onClick={closeMenu} prefetch="intent"
              className="flex items-center justify-center h-10 rounded-xl border border-gray-900 text-gray-900 text-sm font-semibold no-underline active:scale-95 transition-transform">Masuk</Link>
            <Link to="/account/register" onClick={closeMenu} prefetch="intent"
              className="flex items-center justify-center h-10 rounded-xl bg-gray-900 text-white text-sm font-semibold no-underline active:scale-95 transition-transform">Daftar</Link>
          </div>
        </div>
      )}

      {/* Quick tiles */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} onClick={closeMenu} prefetch="intent"
            className="flex flex-col items-center gap-1.5 no-underline group">
            <span className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.wrap} group-active:scale-95 transition-transform`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${t.tint}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={t.path} />
              </svg>
            </span>
            <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{t.label}</span>
          </Link>
        ))}
      </div>

      {/* Categories — accordion */}
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-6 mb-1.5 px-1">Jelajahi</p>
      <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {items.map((item) => {
          if (!item.url && !(item.items || []).length) return null;
          const kids = item.items || [];
          if (kids.length) {
            const open = openId === item.id;
            return (
              <div key={item.id}>
                <button type="button" onClick={() => setOpenId(open ? null : item.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-800">{item.title}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
                {open && (
                  <div className="bg-gray-50/60 pb-1">
                    {kids.map((k) => (
                      <Link key={k.id} to={norm(k.url)} onClick={closeMenu} prefetch="intent"
                        className="block pl-7 pr-4 py-2.5 text-[13px] text-gray-600 no-underline active:text-gray-900 active:bg-gray-100 transition-colors">
                        {k.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={item.id} to={norm(item.url)} onClick={closeMenu} prefetch="intent"
              className="flex items-center justify-between px-4 py-3 no-underline active:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-800">{item.title}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </Link>
          );
        })}
      </div>

      {/* Help & info */}
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-6 mb-1.5 px-1">Bantuan & Info</p>
      <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {helpLinks.map((l) => (
          <Link key={l.to} to={l.to} onClick={closeMenu} prefetch="intent"
            className="flex items-center justify-between px-4 py-3 no-underline active:bg-gray-50 transition-colors">
            <span className="text-[13px] text-gray-700">{l.label}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        ))}
      </div>

      {/* Contact */}
      <a href="https://wa.me/6282111311131" target="_blank" rel="noreferrer" onClick={closeMenu}
        className="mt-6 flex items-center justify-center gap-2 h-12 rounded-2xl bg-green-600 text-white text-sm font-semibold no-underline active:scale-[0.99] transition-transform">
        <FaWhatsapp className="w-5 h-5" />
        Chat Admin via WhatsApp
      </a>
      <div className="flex items-center justify-center gap-5 mt-5 text-gray-500">
        {socials.map((s) => (
          <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors no-underline">{s.icon}</a>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-4">
        Part of <span className="font-semibold text-red-400">Galaxycamera.id</span>
      </p>
    </nav>
  );
}

function HeaderCtas({isLoggedIn, cart, onDark}) {
  // onDark (mobile homepage charcoal bar): white icons on mobile, normal gray on sm+.
  const btnCls = onDark
    ? 'text-white sm:text-gray-700 hover:bg-white/10 sm:hover:bg-gray-100'
    : 'text-gray-700 hover:bg-gray-100';
  return (
    <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0" role="navigation">

      {/* Account — inline style skipped when onDark so the responsive Tailwind color can win */}
      <NavLink
        prefetch="intent"
        to="/account"
        style={onDark ? undefined : activeLinkStyle}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors ${btnCls}`}
      >
        <FaRegCircleUser className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">
          {isLoggedIn ? 'Akun' : 'Masuk'}
        </span>
      </NavLink>

      {/* Cart */}
      <CartToggle cart={cart} onDark={onDark} />
    </nav>
  );
}

function SearchToggleMobile() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsModalOpen(false);
  }, [location.pathname]);

  if (location.pathname === '/search') return null;

  return (
    <>
      <div onClick={() => setIsModalOpen(true)} className="w-full">
        <div className="flex items-center w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 gap-2 cursor-pointer hover:border-gray-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span className="text-sm text-gray-400 select-none">Cari Produk...</span>
        </div>
      </div>

      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Cari Produk</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <PredictiveSearchForm>
                  {({fetchResults, inputRef}) => (
                    <div className="w-full">
                      <div className="relative mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        <input
                          ref={inputRef}
                          name="q"
                          onChange={fetchResults}
                          onFocus={fetchResults}
                          placeholder="Ketik nama produk..."
                          type="search"
                          autoFocus
                          className="w-full h-10 border border-gray-200 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div className="modal-search-results">
                        <PredictiveSearchResults />
                      </div>
                    </div>
                  )}
                </PredictiveSearchForm>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function HeaderMenuMobileToggle({onDark}) {
  const cls = onDark
    ? 'text-white sm:text-gray-700 hover:bg-white/10 sm:hover:bg-gray-100'
    : 'text-gray-700 hover:bg-gray-100';
  return (
    <a className={`header-menu-mobile-toggle flex items-center justify-center w-9 h-9 rounded-lg transition-colors lg:hidden ${cls}`} href="#mobile-menu-aside">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    </a>
  );
}

function SearchToggle() {
  const location = useLocation();

  if (location.pathname === '/search') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <span>Pencarian</span>
      </div>
    );
  }

  return (
    <Link to="/search" className="block w-full">
      <div className="flex items-center w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 gap-2 hover:border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <span className="text-sm text-gray-400 select-none">Cari Produk...</span>
      </div>
    </Link>
  );
}

function CartBadge({count, onDark}) {
  const cls = onDark
    ? 'text-white sm:text-gray-700 hover:bg-white/10 sm:hover:bg-gray-100'
    : 'text-gray-700 hover:bg-gray-100';
  return (
    <a
      href="#cart-aside"
      className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${cls}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </a>
  );
}

function CartToggle({cart, onDark}) {
  return (
    <Suspense fallback={<CartBadge count={0} onDark={onDark} />}>
      <Await resolve={cart}>
        {(cart) => <CartBadge count={cart?.totalQuantity || 0} onDark={onDark} />}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {id: 'gid://shopify/MenuItem/461609500728', resourceId: null, tags: [], title: 'Collections', type: 'HTTP', url: '/collections', items: []},
    {id: 'gid://shopify/MenuItem/461609533496', resourceId: null, tags: [], title: 'Blog', type: 'HTTP', url: '/blogs/journal', items: []},
    {id: 'gid://shopify/MenuItem/461609566264', resourceId: null, tags: [], title: 'Policies', type: 'HTTP', url: '/policies', items: []},
    {id: 'gid://shopify/MenuItem/461609599032', resourceId: 'gid://shopify/Page/92591030328', tags: [], title: 'About', type: 'PAGE', url: '/pages/about', items: []},
  ],
};

function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}

function activeLinkStyle2({isActive, isPending}) {
  return {
    display: isPending ? 'block' : 'none',
  };
}
