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



      <div className="h-72  mt-5 bg-gray-900 flex items-center bg-fixed md:bg-[url('https://cdn.shopify.com/s/files/1/0672/3806/8470/files/Foto-toko-tangerang-2.webp?v=1706799592')] bg-[url('https://cdn.shopify.com/s/files/1/0672/3806/8470/files/Foto-toko-tangerang-portrait.png?v=1706799750')]">
  <div className='p-5 mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl'>
    <h1 className='md:mb-2 mb-1 text-left text-md md:text-xl lg:text-2xl text-white'>Kunjungi Toko Kami</h1>
    <p className="text-white text-sm">Dapatkan Penawaran Harga Terbaik Khusus Pembelian di Store Langsung</p>
    <Link
      to={`/pages/contact`}
      className='no-underlined'
    >
    <div className="flex flex-row items-center bg-white/30 backdrop-blur-sm  w-32 h-12 rounded-full mt-3">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="m-auto mr-2  w-5 h-5 text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>

      <p className='no-underline text-white ml-0 text-sm sm:text-sm md:text-sm lg:text-sm m-auto'>Lihat Maps</p>
      </div>
    </Link>
  </div>
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


