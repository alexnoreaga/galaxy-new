import {Await, NavLink, useMatches,Link} from '@remix-run/react';
import {Suspense, useState, useEffect} from 'react';
import { IconName } from "react-icons/fa6";

import { FaInstagram } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa6";
import { FaYoutube } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { FaWhatsapp } from "react-icons/fa6";
import { FaFacebookF } from "react-icons/fa6";
import {
  PredictiveSearchForm,
  PredictiveSearchResults,
} from '~/components/Search';
import { useLocation } from "@remix-run/react";
import { FaRegCircleUser } from "react-icons/fa6";



export function Header({header, isLoggedIn, cart}) {

  const routes = [
  // { path: '/', label: 'Home' },
  { path: '/collections', label: 'Collections' },
  { path: '/products', label: 'Product' },
  { path: '/pages', label: 'Pages' },
  { path: '/policies', label: 'Policies' },
  { path: '/brands', label: 'Brands' },
  // Add more routes as needed
];



  const {shop, menu} = header;
  return (
    <>
          <>
        {routes.map((route, index) => (
          <NavLink
            key={index}
            prefetch="intent"
            to={route.path}
            style={activeLinkStyle2}
            
          >
    <div className='fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50'>
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
    <div className='bg-black text-white hidden sm:block'>
          <div className='flex items-center justify-between container relative mx-auto sm:max-w-screen-md md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl text-xs tracking-wide'>
            <div className='flex flex-row items-center gap-2'>
            <div className='bg-red-700 p-2'>Part of Galaxycamera.id</div>
            <div className=''>Your Online Offline Photography Shopping</div>
            </div>
            <div className='flex gap-3 items-center'>
              <a href="https://wa.me/6282111311131" target="_blank" className='flex items-center gap-1 text-white hover:no-underline'>
                <FaWhatsapp size="1.2em" />
                <div>0821-1131-1131</div>
              </a>
              
              <a href="https://instagram.com/galaxycamera99" target="_blank" className='flex items-center gap-1 text-white hover:no-underline'>
                <FaInstagram size="1.2em"/>
              </a>

              <a href="https://facebook.com/galaxycamera99" target="_blank" className='flex items-center gap-1 text-white hover:no-underline'>
              <FaFacebookF size="1.2em"/>
              </a>

              
              <a href="https://www.tiktok.com/@galaxycameraid" target="_blank" className='flex items-center gap-1 text-white hover:no-underline'>
              <FaTiktok size="1.2em"/>
              </a>

              <a href="https://www.youtube.com/galaxycamera" target="_blank" className='flex items-center gap-1 text-white hover:no-underline'>
              <FaYoutube size="1.2em" />
              </a>

              <a href="https://www.x.com/galaxycamera99" target="_blank" className='flex items-center gap-1 text-white hover:no-underline'>
              <FaXTwitter size="1.2em" />
              </a>

            </div>
          </div>
    </div>

    
    <header className="header backdrop-blur-md shadow-md !bg-white/90 border-b-1">
      <div className='container  flex items-center justify-between relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl'>
      <HeaderMenuMobileToggle />
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        {/* <strong>{shop.name}</strong> */}
        <img className='h-8 sm:h-8 md:h-10 lg:h-10' src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png?v=1731132105" alt="Logo Galaxy Camera" />
      </NavLink>
      <HeaderMenu menu={menu} viewport="desktop" />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
      
    </header>

    {/* Mobile Search Bar - Full Width Below Header */}
    <div className="sm:hidden w-full bg-white border-b relative">
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
  const className = `header-menu-${viewport} `;

  function closeAside(event) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={closeAside}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain)
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
            <div className="text-sm">{item.title}</div>
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({isLoggedIn, cart}) {


  return (
    
    <nav className="header-ctas gap-2" role="navigation">
      
      {/* <HeaderMenuMobileToggle /> */}
      
      <div className="hidden sm:block">
        <SearchToggle />
      </div>
      <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        {isLoggedIn ? 'Account' : (
          <div>
            <div className='block sm:hidden text-md'>
              <FaRegCircleUser />
            </div>

          <div className='text-sm hidden sm:block'>Masuk</div>
          </div>
          )}
      </NavLink>
      
      <CartToggle cart={cart} />
    </nav>
  );
}

function SearchToggleMobile() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  // Close modal when navigation occurs (user clicks a product)
  useEffect(() => {
    setIsModalOpen(false);
  }, [location.pathname]);

  // Hide the mobile search bar if on /search page
  if (location.pathname === '/search') {
    return null;
  }

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className='w-full'
      >
        <input 
          placeholder='Cari Produk' 
          readOnly
          className='w-full h-11 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 cursor-pointer'
        />
      </div>

      {/* Search Modal */}
      {isModalOpen && (
        <>
          {/* Dark overlay */}
          <div 
            className='fixed top-0 left-0 w-full h-full bg-black/50 z-40'
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal */}
          <div className='fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center p-4'>
            <div className='bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl'>
              {/* Header */}
              <div className='flex items-center justify-between p-4 border-b'>
                <h2 className='text-lg font-semibold'>Cari Produk</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className='text-gray-500 hover:text-gray-700'
                >
                  ✕
                </button>
              </div>

              {/* Search Content */}
              <div className='flex-1 overflow-y-auto p-4'>
                <PredictiveSearchForm>
                  {({fetchResults, inputRef}) => (
                    <div className='w-full'>
                      <input 
                        ref={inputRef}
                        name="q"
                        onChange={fetchResults}
                        onFocus={fetchResults}
                        placeholder='Ketik nama produk...' 
                        type="search"
                        autoFocus
                        className='w-full h-10 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4'
                      />
                      <div className='modal-search-results'>
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

  

  // console.log('Ini adalah lokasi saat ini',location)



  return (
    <a className="header-menu-mobile-toggle mr-2" href="#mobile-menu-aside">
      <h3 className='border rounded-md p-0.5'>☰</h3>
    </a>
  );
}

// function SearchToggle() {
//   return <a href="#search-aside">Search</a>;
// }
function SearchToggle() {
  const location = useLocation();
  // console.log('Lokasi adalah ', location.pathname)
  return (
    <>
       <Link 
          to={`/search`}>
            {location.pathname =='/search' ? (
                 <svg aria-label="Cari" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            ) :(
          <input placeholder='Cari Produk' className='w-40 sm:w-56 md:w-96 lg:w-[420px] h-10 border-gray-300 rounded-md transition-all duration-200'></input>
            ) }
          </Link>
    </>
  );
}

// function SearchToggle(){
//   return(
//     <div>
//       <PredictiveSearchForm>
//           {({fetchResults, inputRef}) => (
//             <>
//               <input
//                 name="q"
//                 onChange={fetchResults}
//                 onFocus={fetchResults}
//                 placeholder="Cari Produk"
//                 ref={inputRef}
//                 type="search"
//                 // className='w-full'
//                 className='w-full'

//               />
//               {/* <button type="submit">Cari</button> */}
//             </>
//           )}
//         </PredictiveSearchForm>
//         <PredictiveSearchResults />
//     </div>
//   )
// }

function CartBadge({count}) {
  return <a href="#cart-aside">
  <div className='flex flex-row items-center'>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>

  <div className='text-sm'>{count}</div>

</div>
 </a>;
}

function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} />;
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
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
  }
}




