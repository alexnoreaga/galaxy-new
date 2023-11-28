import {Await} from '@remix-run/react';
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

export function Layout({cart, children = null, footer, header, isLoggedIn}) {

    const lokasi = useLocation()
    const urlSekarang = lokasi.pathname
    console.log(lokasi)
    // console.log('link sekarang',urlSekarang)
    

  return (
    <>
    
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside menu={header.menu} />
      
      <Header header={header} cart={cart} isLoggedIn={isLoggedIn} />

      <main>{children}</main>
      <Suspense>
        <Await resolve={footer}>
          {(footer) => <Footer menu={footer.menu} />}
        </Await>
      </Suspense>
      
      <BottomNavbar/>
      {/* <TombolWa/> */}
      {/* {urlSekarang.includes('product') ? (
      console.log('ping')
      ) : urlSekarang.includes('collections') ? (
          <BottomNavbar/>
      ) :  <BottomNavbar/>}  */}
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
      <div className="predictive-search">
        <br />
        <PredictiveSearchForm>
          {({fetchResults, inputRef}) => (
            <div>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Cari Produk"
                ref={inputRef}
                type="search"
                autoFocus 
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

