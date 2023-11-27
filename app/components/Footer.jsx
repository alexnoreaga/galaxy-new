import {useMatches, NavLink} from '@remix-run/react';
import { FaLocationDot } from "react-icons/fa6";


export function Footer({menu}) {
  return (
    <footer className="footer ">
      <FooterMenu menu={menu} />
      {/* <FooterBaru/> */}
    </footer>
  );
}

function FooterMenu({menu}) {
  const [root] = useMatches();
  const publicStoreDomain = root?.data?.publicStoreDomain;
  console.log('Ini merupakan publicStore ',menu)
  return (
    <nav className="footer-menu" role="navigation">
      <div className='container flex flex-col mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl'>
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain)
            ? new URL(item.url).pathname
            : item.url;
        const isExternal = !url.startsWith('/');
        return isExternal ? (
          <a href={url} key={item.id} rel="noopener noreferrer" target="_blank">
            {item.title}
          </a>
        ) : (
          <NavLink
            end
            key={item.id}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
      </div>
    </nav>
  );
}


function FooterBaru({menu}){
  return(
    <div className='relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl'>
      <div className='py-4'>
        <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-final-bw.png?v=1701072365" alt="Logo Galaxy Camera Store" className='w-28'/>
        <div className="text-white flex flex-row items-center gap-2 text-sm">
          <FaLocationDot />
          <div>Ruko Mall Metropolis Townsquare, Blok Gm3 No.6, Kelapa Indah, Tangerang</div>
        </div>
        <div className="text-white flex flex-row items-center gap-2 text-sm">
          <FaLocationDot />
          <div>Mall Depok Townsquare, Lantai 2 Blok SS2 No.8, Beji, Depok</div>
        </div>
      </div>
    </div>
  )
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'white',
  };
}
