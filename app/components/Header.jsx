import {Await, NavLink, useMatches, Link} from '@remix-run/react';
import {Suspense, useState, useEffect} from 'react';
import {FaInstagram, FaTiktok, FaYoutube, FaXTwitter, FaWhatsapp, FaFacebookF} from 'react-icons/fa6';
import {PredictiveSearchForm, PredictiveSearchResults} from '~/components/Search';
import {useLocation} from '@remix-run/react';
import {FaRegCircleUser} from 'react-icons/fa6';

export function Header({header, isLoggedIn, cart}) {
  const routes = [
    {path: '/collections', label: 'Collections'},
    {path: '/products', label: 'Product'},
    {path: '/pages', label: 'Pages'},
    {path: '/policies', label: 'Policies'},
    {path: '/brands', label: 'Brands'},
  ];

  const {shop, menu} = header;

  return (
    <>
      {/* Page-transition loading overlay */}
      <>
        {routes.map((route, index) => (
          <NavLink key={index} prefetch="intent" to={route.path} style={activeLinkStyle2}>
            <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50">
              <div role="status">
                <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </NavLink>
        ))}
      </>

      {/* Top bar — desktop only */}
      <div className="hidden sm:block bg-gray-900 text-white">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 h-9 text-xs">
          <div className="flex items-center">
            <span className="bg-red-600 px-2.5 py-1 font-medium tracking-wide text-[11px]">Part of Galaxycamera.id</span>
            <Link
              to="/pengadaan"
              className="bg-gradient-to-r from-blue-600 to-blue-500 px-2.5 py-1 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 text-white no-underline text-[11px] font-medium"
            >
              Info Pengadaan
            </Link>
            <span className="ml-3 text-gray-400 hidden md:inline text-[11px]">Toko Kamera Online Terlengkap dan Bergaransi Resmi</span>
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

      {/* Main header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 w-full px-4 py-2.5 max-w-7xl mx-auto">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <HeaderMenuMobileToggle />
            <NavLink prefetch="intent" to="/" style={activeLinkStyle} end className="flex-shrink-0 hover:opacity-80 transition-opacity">
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

          {/* Center: desktop nav + search */}
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="hidden lg:flex items-center flex-shrink-0">
              <HeaderMenu menu={menu} viewport="desktop" />
            </div>
            <div className="hidden sm:block flex-1 max-w-xl">
              <SearchToggle />
            </div>
          </div>

          {/* Right: account + cart */}
          <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
        </div>
      </header>

      {/* Mobile search bar — below header */}
      <div className="sm:hidden w-full bg-white border-b">
        <div className="px-4 py-2">
          <SearchToggleMobile />
        </div>
      </div>
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

function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0" role="navigation">

      {/* Account */}
      <NavLink
        prefetch="intent"
        to="/account"
        style={activeLinkStyle}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
      >
        <FaRegCircleUser className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">
          {isLoggedIn ? 'Akun' : 'Masuk'}
        </span>
      </NavLink>

      {/* Cart */}
      <CartToggle cart={cart} />
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

function HeaderMenuMobileToggle() {
  return (
    <a className="header-menu-mobile-toggle flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 lg:hidden" href="#mobile-menu-aside">
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

function CartBadge({count}) {
  return (
    <a
      href="#cart-aside"
      className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
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

function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        {(cart) => <CartBadge count={cart?.totalQuantity || 0} />}
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
