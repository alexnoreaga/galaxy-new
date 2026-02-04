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
import { useEffect, useState } from 'react'; 


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

  return defer(
    {
      cart: cartPromise,
      footer: footerPromise,
      header: await headerPromise,
      isLoggedIn,
      publicStoreDomain,
      footerSatu
    },
    {headers},
    {analyticsData},
  );
}

export default function App() {
  const nonce = useNonce();
  const data = useLoaderData();
  const matches = useMatches();
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);






  return (
    <html lang="en">
      <head>



<script nonce={nonce}
dangerouslySetInnerHTML={{__html:`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-CY1F8L58R5');
`}}></script>

        {/* Primary Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="description" content="Galaxy Camera - Toko Kamera Online Terlengkap dan Bergaransi Resmi. Jual Kamera Mirrorless, DSLR, Drone, Lensa dengan Harga Terbaik. Cicilan 0% tanpa kartu kredit. Gratis ongkir ke seluruh Indonesia." />
        <meta name="keywords" content="toko kamera online, jual kamera, kamera mirrorless, kamera dslr, drone, lensa kamera, kamera murah, galaxy camera" />
        <meta name="author" content="PT Galaxy Digital Niaga" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://galaxy.co.id" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content="https://galaxy.co.id" />
        <meta property="og:title" content="Galaxy Camera - Toko Kamera Online Terpercaya | Harga Terbaik" />
        <meta property="og:description" content="Belanja kamera, drone, lensa dengan garansi resmi. Cicilan 0%, gratis ongkir, terpercaya sejak 2012." />
        <meta property="og:image" content="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Galaxy Camera" />
        <meta property="og:locale" content="id_ID" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@galaxycamera99" />
        <meta name="twitter:title" content="Galaxy Camera - Toko Kamera Online Terpercaya" />
        <meta name="twitter:description" content="Belanja kamera, drone, lensa dengan harga terbaik dan garansi resmi." />
        <meta name="twitter:image" content="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png" />

        {/* Theme & Browser */}
        <meta name="theme-color" content="#1f2937" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Apple Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Galaxy Camera" />

        {/* Icons - Apple Touch */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />

        {/* Icons - Favicon */}
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://cdn.shopify.com" />
        <link rel="preconnect" href="https://shop.app" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* Security & Standards */}
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <meta name="format-detection" content="telephone=no" />

        {/* LocalBusiness Schema JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Galaxy Camera",
          "legalName": "PT Galaxy Digital Niaga",
          "url": "https://galaxy.co.id",
          "logo": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png",
          "description": "Toko Kamera Online Terlengkap dan Bergaransi Resmi",
          "telephone": "+62-821-1131-1131",
          "email": "sales@galaxy.co.id",
          "priceRange": "$$",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Ruko Mall Metropolis Town Square, Blok GM3 No.6",
            "addressLocality": "Kelapa Indah",
            "addressRegion": "Tangerang",
            "postalCode": "15810",
            "addressCountry": "ID"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": -6.197789476683706,
            "longitude": 106.63769239999999
          },
          "sameAs": [
            "https://www.instagram.com/galaxycamera99",
            "https://www.facebook.com/galaxycamera99",
            "https://www.tiktok.com/@galaxycameraid",
            "https://www.youtube.com/galaxycamera",
            "https://www.x.com/galaxycamera99"
          ],
          "areaServed": "ID",
          "paymentAccepted": "Cash, Credit Card, Bank Transfer, Kredivo, ShopeePay",
          "currenciesAccepted": "IDR"
        })}} />

        {/* Organization Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Galaxy Camera",
          "url": "https://galaxy.co.id",
          "logo": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png",
          "foundingDate": "2014",
          "description": "Toko Kamera Online Terlengkap dengan Garansi Resmi",
          "contact": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "telephone": "+62-821-1131-1131",
            "email": "sales@galaxy.co.id"
          }
        })}} />

        {/* WebSite Schema for Sitelinks Search Box */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://galaxy.co.id",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://galaxy.co.id/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })}} />

        {/* WebPage Schema for Homepage */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Galaxy Camera - Toko Kamera Online Terpercaya",
          "url": "https://galaxy.co.id",
          "description": "Galaxy Camera - Toko Kamera Online Terlengkap dan Bergaransi Resmi. Jual Kamera Mirrorless, DSLR, Drone, Lensa dengan Harga Terbaik. Cicilan 0% tanpa kartu kredit. Gratis ongkir ke seluruh Indonesia.",
          "image": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png",
          "isPartOf": {
            "@type": "WebSite",
            "url": "https://galaxy.co.id",
            "name": "Galaxy Camera"
          },
          "mainEntity": {
            "@id": "https://galaxy.co.id/#organization"
          },
          "publisher": {
            "@id": "https://galaxy.co.id/#organization"
          },
          "datePublished": "2014-01-01",
          "dateModified": new Date().toISOString().split('T')[0],
          "inLanguage": "id-ID"
        })}} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://galaxy.co.id"
            }
          ]
        })}} />

        {/* FAQ Schema for Featured Snippets */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Apa itu Galaxy Camera?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Galaxy Camera adalah toko kamera online terlengkap dan terpercaya yang berdiri sejak 2014. Kami menjual berbagai produk fotografi dan videografi termasuk kamera mirrorless, DSLR, drone, lensa, dan aksesoris dengan garansi resmi dan harga terbaik."
              }
            },
            {
              "@type": "Question",
              "name": "Bagaimana cara cicilan di Galaxy Camera?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Galaxy Camera menawarkan cicilan 0% tanpa kartu kredit melalui berbagai metode pembayaran seperti Kredivo, ShopeePay, dan bank transfer. Proses cicilan sangat cepat, hanya sekitar 15 menit."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah semua produk di Galaxy Camera original dan bergaransi?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ya, semua produk yang kami jual adalah original dengan garansi resmi dari distributor resmi. Galaxy Camera hanya menjual produk original dari brand terpercaya seperti Canon, Nikon, Sony, Fujifilm, DJI, dan GoPro."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah Galaxy Camera gratis ongkir?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ya, Galaxy Camera menawarkan gratis ongkir ke seluruh Indonesia untuk pembelian tertentu. Lebih banyak informasi dapat dilihat di halaman promo atau hubungi tim customer service kami."
              }
            },
            {
              "@type": "Question",
              "name": "Di mana lokasi toko fisik Galaxy Camera?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Galaxy Camera memiliki dua lokasi toko fisik: Tangerang di Ruko Mall Metropolis Townsquare Blok GM3 No 6 Kelapa Indah Tangerang, dan Depok di Mall Depok Town Square Lantai 2 Blok SS2 No 8 Beji Depok."
              }
            }
          ]
        })}} />

        {/* AggregateOffer Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AggregateOffer",
          "priceCurrency": "IDR",
          "lowPrice": "500000",
          "highPrice": "200000000",
          "offerCount": 1000,
          "offers": [
            {
              "@type": "Offer",
              "url": "https://galaxy.co.id/collections/kamera-mirrorless",
              "priceCurrency": "IDR",
              "price": "5000000",
              "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "Galaxy Camera"
              }
            },
            {
              "@type": "Offer",
              "url": "https://galaxy.co.id/collections/kamera-dslr",
              "priceCurrency": "IDR",
              "price": "4000000",
              "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "Galaxy Camera"
              }
            },
            {
              "@type": "Offer",
              "url": "https://galaxy.co.id/collections/drone",
              "priceCurrency": "IDR",
              "price": "3000000",
              "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "Galaxy Camera"
              }
            }
          ]
        })}} />

        <Seo />
        <Meta />
        <Links />
      </head>
      <body>


      <ol>
            {matches
              .filter(
                (match) =>
                  match.handle && match.handle.breadcrumb
              )
              .map((match, index) => (
                <li key={index}>
                  {match.handle.breadcrumb(match)}
                </li>
              ))}
          </ol>

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
  const [showDetails, setShowDetails] = useState(false);
  let errorMessage = 'Terjadi kesalahan yang tidak terduga';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data ?? errorMessage;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <html lang="id">
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.1.1/flowbite.min.css"  rel="stylesheet" />

        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>

        <Layout {...root.data}>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
                {/* Animated Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xl">😔</span>
                    </div>
                  </div>
                </div>

                {/* Error Status */}
                <div className="mb-4 text-center">
                  <span className="inline-block px-6 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                    Error {errorStatus}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center">
                  Ada gangguan di rumah Galaxy 😢
                </h1>

                {/* Description */}
                <p className="text-gray-600 text-lg mb-6 leading-relaxed text-center">
                  Mohon tunggu, Galaxy Camera sedang melakukan penyesuaian exposure. Kami akan segera kembali online.
                </p>

                {/* Toggle Button for Error Details */}
                {errorMessage && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    >
                      <span className="text-sm font-semibold text-gray-700 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Detail Error
                      </span>
                      <svg 
                        className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Error Message Box - Expandable */}
                    {showDetails && (
                      <div className="mt-3 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-fadeIn">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-800 mb-2">Pesan Error:</h3>
                            <p className="text-sm text-red-700 font-mono break-words bg-white p-3 rounded border border-red-200">
                              {errorMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <a
                    href="/"
                    className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Kembali ke Beranda
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Muat Ulang Halaman
                  </button>
                </div>

                {/* Help Text */}
                <div className="pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">
                    Jika masalah terus berlanjut, silakan hubungi{' '}
                    <a href="/pages/contact" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                      tim dukungan kami
                    </a>
                  </p>
                </div>
              </div>
            </div>
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