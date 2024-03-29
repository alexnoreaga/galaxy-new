import {useMatches, NavLink} from '@remix-run/react';
import { FaLocationDot } from "react-icons/fa6";
import {useLoaderData} from '@remix-run/react';
import {FooterColumn1} from '~/components/FooterColumn1';
import {FooterColumn2} from '~/components/FooterColumn2';






export function Footer({menu}) {
  return (
    <footer className="footer py-5 pb-24">
      <div className='flex-none sm:flex flex-cols justify-between px-3 sm:px-0 container mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl'>
      {/* <FooterBaru/> */}
      <FooterColumn1/>
      <FooterColumn2/>

      <FooterMenu menu={menu} />
      {/* <FooterMenu menu={menu} /> */}
      
      </div>
    </footer>
  );
}

function FooterMenu({menu}) {
  const [root] = useMatches();
  const publicStoreDomain = root?.data?.publicStoreDomain;
  // console.log('Ini merupakan publicStore ',menu)
  return (
    <nav className="footer-menu mx-auto" role="navigation">
      <div className='text-sm flex flex-col'>
      <div className='text-white font-bold py-1'>INFORMATION</div>
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


function FooterBaru({footerSatu}){
  const [root] = useMatches();
// data.footerSatu.page.body
  return(
    <div>
      <div className='py-4 px-4 sm:px-0'>
      <div className="w-full prose  md:border-gray-200 pt-2 text-white text-md"
              dangerouslySetInnerHTML={{ __html: root?.data?.footerSatu?.page?.body }}/>
    
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


