import {Await,Link} from '@remix-run/react';
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
import React, { useEffect, useRef } from 'react';


export function Layout({cart, children = null, footer, header, isLoggedIn,footerSatu}) {

    const lokasi = useLocation()
    const urlSekarang = lokasi.pathname
    // console.log(lokasi, 'lokasi sekarang')
    // console.log(window.location.href)
    // console.log('link sekarang',urlSekarang)
    

  return (
    <>
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside menu={header.menu} />
      
      <Header header={header} cart={cart} isLoggedIn={isLoggedIn} />

      <main>{children}</main>
      <div className="h-80 mt-5 bg-red-500 flex items-center bg-fixed bg-[url('https://cdn.shopify.com/s/files/1/0672/3806/8470/files/Foto-toko.webp?v=1706796490')]">
  <div className='mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl'>
    <h1 className='mb-2 text-left sm:text-md md:text-xl lg:text-4xl text-white'>Kunjungi Toko Kami</h1>
    <div className="text-white text-lg">Dapatkan Penawaran Harga Terbaik Khusus Pembelian di Store Langsung</div>
    <Link
      to={`/pages/contact`}
    >
      <div className='text-white text-lg underline'>Liat Maps</div>
    </Link>
    {/* <h1 className='text-center'>Kunjungi Toko Kami</h1> */}

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
              &nbsp;
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

