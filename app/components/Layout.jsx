import {Await,Link,useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/Cart';
import {
  PredictiveSearchForm,
  PredictiveSearchResults,
} from '~/components/Search';
import { BottomNavbar } from './BottomNavbar';
import { useHistory ,useLocation } from 'react-router-dom';
import { TombolWa } from './TombolWa';
import React, { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { emailGo } from '../routes/account.profile';
import {defer} from '@shopify/remix-oxygen';
import { useRouteError } from '@remix-run/react';




export function Layout({cart, children = null, footer, header, isLoggedIn,footerSatu,contex}) {
    const lokasi = useLocation()
    const urlSekarang = lokasi.pathname

    // const [muncul, setMuncul] = useState(null);
    // const [counter, setCounter] = useState(0);
    
    // const error = useRouteError();
    
    // useEffect(() => {
    //     if (error === undefined && counter == 0) {
    //         setMuncul(true);
    //     } else {
    //         setMuncul(false);
    //     }
    // }, [error]);
    
    // // Increment counter after the initial render
    // useEffect(() => {
    //     setCounter((prevCounter) => prevCounter + 1);
    // }, []);

    // console.log({<Breadcrumbs />}.$$typeof)




  return (
    <>
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside menu={header.menu} />
      
      <Header header={header} cart={cart} isLoggedIn={isLoggedIn} />


      {/* {error == undefined && <Breadcrumbs />} */}

      <Breadcrumbs />
   
      {/* {!error?.message && <Breadcrumbs /> } */}

      <main>{children}</main>



      <div className="relative h-72 mt-5 bg-gray-900 flex items-center overflow-hidden bg-fixed md:bg-[url('https://cdn.shopify.com/s/files/1/0672/3806/8470/files/Foto-toko-tangerang-2.webp?v=1706799592')] bg-[url('https://cdn.shopify.com/s/files/1/0672/3806/8470/files/Foto-toko-tangerang-portrait.png?v=1706799750')]">
        
        <div className='relative z-10 p-6 sm:p-8 mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl w-full'>
          <div className="max-w-2xl">
            {/* Decorative element */}
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4"></div>
            
            <h1 className='mb-3 text-left text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight'>
              Kunjungi Toko Kami
            </h1>
            <p className="text-white/90 text-sm sm:text-base mb-6 leading-relaxed max-w-xl">
              Dapatkan Penawaran Harga Terbaik Khusus Pembelian di Store Langsung
            </p>
            
            <Link
              to={`/pages/contact`}
              className='no-underline inline-block group'
            >
              <div className="flex flex-row items-center gap-3 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 hover:border-white/50 px-6 py-3 rounded-full transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <p className='text-white font-semibold text-sm sm:text-base m-0 group-hover:translate-x-0.5 transition-transform duration-300'>
                  Lihat Maps
                </p>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
      <Suspense>
        <Await resolve={footer}>
          {(footer) => <Footer menu={footer.menu} footerSatu = {footerSatu}/>}
        </Await>
      </Suspense>
      
      {/* <BottomNavbar/> */}
      <TombolWa/>
      {urlSekarang.includes('cart') ? (
        <BottomNavbar/>
      ) : urlSekarang.includes('collections') ? (
          <BottomNavbar/>
      ) :  <BottomNavbar/>} 
    </>
  );
}



function CartAside({cart}) {
  return (
    <Aside id="cart-aside" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

// function HelloWorld() {
//   return (
//     <div style={activeLinkStyle}>
//       Loading Bar .......
//     </div>
//   );
// }

function SearchAside() {

  return (
    <Aside id="search-aside" heading="SEARCH">
      <div className="predictive-search m-2">
        <br />
        <PredictiveSearchForm>
          {({fetchResults, inputRef}) => (
            <div >
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Cari Produk"
                ref={inputRef}
                type="search"
                className='w-full'

              />
              <button type="submit">Cari</button>
            </div>
          )}
        </PredictiveSearchForm>
        <PredictiveSearchResults />
      </div>
    </Aside>
  );
}

function MobileMenuAside({menu}) {
  return (
    <Aside id="mobile-menu-aside" heading="MENU">
      <HeaderMenu menu={menu} viewport="mobile" />
    </Aside>
  );
}


