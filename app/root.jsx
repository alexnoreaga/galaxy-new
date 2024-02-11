import {useNonce} from '@shopify/hydrogen';
import {Seo} from '@shopify/hydrogen';
import {defer} from '@shopify/remix-oxygen';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  LiveReload,
  useMatches,
  useRouteError,
  useLoaderData,
  ScrollRestoration,
  isRouteErrorResponse,
} from '@remix-run/react';
import favicon from '../public/favicon.svg';
import resetStyles from './styles/reset.css';
import appStyles from './styles/app.css';
import {Layout} from '~/components/Layout';
import tailwindCss from './styles/tailwind.css';
import { useEffect } from 'react'; 
import { json } from '@remix-run/data';
import {
  AnalyticsEventName,
  getClientBrowserParameters,
  sendShopifyAnalytics,
  useShopifyCookies,
} from '@shopify/hydrogen';


// This is important to avoid re-fetching root queries on sub-navigations
export const shouldRevalidate = ({formMethod, currentUrl, nextUrl}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

export function links() {
  return [
    {rel: 'stylesheet', href: tailwindCss},
    {rel: 'stylesheet', href: resetStyles},
    {rel: 'stylesheet', href: appStyles},
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader({context}) {
  const {storefront, session, cart} = context;
  const customerAccessToken = await session.get('customerAccessToken');
  const publicStoreDomain = context.env.PUBLIC_STORE_DOMAIN;

  // validate the customer access token is valid
  const {isLoggedIn, headers} = await validateCustomerAccessToken(
    session,
    customerAccessToken,
  );

  // defer the cart query by not awaiting it
  const cartPromise = cart.get();

  // defer the footer query (below the fold)
  const footerPromise = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      footerMenuHandle: 'footer', // Adjust to your footer menu handle
    },
  });

  // await the header query (above the fold)
  const headerPromise = storefront.query(HEADER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      headerMenuHandle: 'main-menu', // Adjust to your header menu handle
    },
  });

  const footerSatu = await storefront.query(GET_FOOTER_SATU, {
    variables: {
      handle: "contact",
    },
  });

  const analyticsData = {
    analytics: {
      // Hard-coded for demonstration purposes.
      // In production, retrieve this value from the Storefront API.
      shopId: "gid://shopify/Shop/67238068470",
    },
  };

  return {
    ...defer(
      {
        cart: cartPromise,
        footer: footerPromise,
        header: await headerPromise,
        isLoggedIn,
        publicStoreDomain,
        footerSatu
      },
      { headers },
    ),
    // Merge the analytics data with existing loader data
    ...json(analyticsData),
  };
}


export default function App() {
  const nonce = useNonce();
  const data = useLoaderData();

  const hasUserConsent = false;
  useShopifyCookies({hasUserConsent});

  // The user's current location
  const location = useLocation();
  // The user's last location. Blank to start.
  const lastLocationKey = useRef('');
  // Analytics data returned by the custom hook
  const pageAnalytics = usePageAnalytics({hasUserConsent});

  useEffect(() => {
    // Only continue if the user's location changed.
    if (lastLocationKey.current === location.key) return;
    lastLocationKey.current = location.key;

    // Analytics data, including browser information
    const payload = {
      ...getClientBrowserParameters(),
      ...pageAnalytics,
    };

    // Send analytics payload to Shopify
    sendShopifyAnalytics({
      eventName: AnalyticsEventName.PAGE_VIEW,
      payload,
    });

  }, [location]);
  

  return (
    <html lang="en">
      <head>
      {/* <script defer>
          {`
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-KR7LGXFF');
          `}
        </script>

      <script async src="https://www.googletagmanager.com/gtag/js?id=G-L77JNHKH0K"></script>
  <script>
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-L77JNHKH0K');
    `}
  </script> */}
        

        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#000000"></meta>
        <meta name="robots" content="index,follow" />
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png"/>
<link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png"/>
<link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png"/>
<link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png"/>
<link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png"/>
<link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png"/>
<link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png"/>
<link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png"/>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png"/>
<link rel="icon" type="image/png" sizes="192x192"  href="/android-icon-192x192.png"/>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png"/>
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
<link rel="manifest" href="/manifest.json"/>
<meta name="msapplication-TileColor" content="#ffffff"/>
<meta name="msapplication-TileImage" content="/ms-icon-144x144.png"/>
<meta name="theme-color" content="#ffffff"></meta>
<link rel="manifest" href="/manifest.json" />
{/* <meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; script-src 'self' https: shopify.com myshopify.com cloudflare.com google.com googletagmanager.com google-analytics.com; object-src 'self' https: shopify.com myshopify.com cloudflare.com google.com;"></meta> */}
{/* <meta http-equiv="Content-Security-Policy" content={`default-src 'self' https://cdn.shopify.com https://shopify.com 'nonce-${nonce}'; script-src 'self' https://www.googletagmanager.com;`} /> */}

        <Seo />
        <Meta />
        <Links />
      </head>
      <body>
        {/* <noscript>
        <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KR7LGXFF" height="0" width="0" style={{display: 'none', visibility: 'hidden'}}></iframe>
        </noscript> */}

        <Layout {...data}>
          <Outlet />
        </Layout>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const [root] = useMatches();
  const nonce = useNonce();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <html lang="en">
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.1.1/flowbite.min.css"  rel="stylesheet" />

        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>



        <Layout {...root.data}>
          <div className="route-error">
            <h1>Oops</h1>
            <h2>{errorStatus}</h2>
            {errorMessage && (
              <fieldset>
                <pre>{errorMessage}</pre>
              </fieldset>
            )}
          </div>
        </Layout>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />

      </body>
    </html>
  );
}

/**
 * Validates the customer access token and returns a boolean and headers
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CustomerAccessToken
 *
 * @example
 * ```js
 * const {isLoggedIn, headers} = await validateCustomerAccessToken(
 *  customerAccessToken,
 *  session,
 * );
 * ```
 */
async function validateCustomerAccessToken(session, customerAccessToken) {
  let isLoggedIn = false;
  const headers = new Headers();
  if (!customerAccessToken?.accessToken || !customerAccessToken?.expiresAt) {
    return {isLoggedIn, headers};
  }

  const expiresAt = new Date(customerAccessToken.expiresAt).getTime();
  const dateNow = Date.now();
  const customerAccessTokenExpired = expiresAt < dateNow;

  if (customerAccessTokenExpired) {
    session.unset('customerAccessToken');
    headers.append('Set-Cookie', await session.commit());
  } else {
    isLoggedIn = true;
  }

  return {isLoggedIn, headers};
}

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
`;

const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
  }
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
`;

const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
`;


const GET_FOOTER_SATU = `#graphql
  query GetFooter($handle: String!) {
    page(handle: $handle) {
      title
      body
      seo {
        description
        title
      }
    }
  }
`;