import {json} from '@shopify/remix-oxygen';
import {useLoaderData, useLocation} from '@remix-run/react';
import {MastheadOrnament, resolveMastheadTheme} from '~/components/MastheadOrnament';

export const meta = () => [
  {title: 'Lokasi Toko | Galaxy Camera'},
  {name: 'description', content: 'Temukan toko Galaxy Camera terdekat dari lokasi Anda. Kunjungi kami untuk melihat koleksi kamera, drone, dan aksesoris fotografi terlengkap.'},
];

export async function loader({context}) {
  const data = await context.storefront.query(STORE_LOCATIONS_QUERY, {
    cache: context.storefront.CacheLong(),
  });

  const stores = data?.metaobjects?.edges?.map(({node}) => {
    const f = {};
    node.fields.forEach(({key, value}) => { f[key] = value; });
    return {
      id: node.id,
      handle: node.handle,
      name: f.name || '',
      address: f.address || '',
      latitude: f.latitude || '',
      longitude: f.longitude || '',
      mapsUrl: f.maps_url || '',
      phone: f.phone || '',
      hours: f.hours || '',
    };
  }) || [];

  return json({stores});
}

// "Galaxy Camera - Tangerang" → "Tangerang" (hero jump chips)
const shortName = (n) => String(n || '').replace(/^galaxy camera\s*[-–]\s*/i, '').trim() || n;

function InfoRow({d, children}) {
  return (
    <div className="flex items-start gap-2.5">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5">
        <path fillRule="evenodd" d={d} clipRule="evenodd" />
      </svg>
      <div className="text-sm text-gray-700 leading-relaxed min-w-0">{children}</div>
    </div>
  );
}

export default function StoresPage() {
  const {stores} = useLoaderData();
  const location = useLocation();
  const mastheadTheme = resolveMastheadTheme(location.search);

  return (
    // -mx-4 cancels the global `body > main` side margins so the page (and the hero) run edge to edge.
    <div className="-mx-4 min-h-screen bg-gray-50 pb-12">
      {/* Hero — full-bleed charcoal on mobile, contained rounded card on desktop (same pattern +
          seasonal ornament as the collection headers, so /stores reads as part of the same site). */}
      <div className="sm:max-w-5xl sm:mx-auto sm:px-4 sm:pt-5">
        <div className="relative overflow-hidden bg-gray-900 sm:rounded-2xl">
          <div aria-hidden="true" className="absolute inset-y-0 right-0 w-64 pointer-events-none opacity-60 -scale-x-100 [mask-image:linear-gradient(to_right,black_35%,transparent)]">
            <MastheadOrnament theme={mastheadTheme} id="gxOrnStores" />
          </div>
          <div className="relative px-5 sm:px-8 pt-8 pb-9 sm:py-10">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-300 mb-3">
              <span className="h-3 w-1 rounded-full bg-red-600" />
              Toko Kami
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">Lokasi Galaxy Camera</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-lg">
              Datang langsung, coba unitnya, dan bawa pulang hari itu juga. Garansi resmi dan harga yang sama dengan website.
            </p>
            {stores.length > 1 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {stores.map((store) => (
                  <a
                    key={store.id}
                    href={`#${store.handle}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-white/15 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-red-400">
                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.48-.966 2.342-1.76C15.29 15.13 17 12.556 17 9A7 7 0 103 9c0 3.556 1.71 6.132 3.287 7.582.860.793 1.72 1.375 2.342 1.76.311.193.571.337.757.433a5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                    </svg>
                    {shortName(store.name)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store cards */}
      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8">
        {stores.length === 0 ? (
          <p className="text-gray-500 text-center py-20">Tidak ada toko ditemukan.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
            {stores.map((store) => (
              <article
                id={store.handle}
                key={store.id}
                className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {store.latitude && store.longitude && (
                  <div className="w-full h-44 sm:h-52 bg-gray-100 border-b border-gray-100">
                    <iframe
                      title={store.name}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{border: 0}}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(store.longitude) - 0.005},${parseFloat(store.latitude) - 0.005},${parseFloat(store.longitude) + 0.005},${parseFloat(store.latitude) + 0.005}&layer=mapnik&marker=${store.latitude},${store.longitude}`}
                    />
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{store.name}</h2>

                  <div className="mt-3 space-y-2.5">
                    <InfoRow d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.48-.966 2.342-1.76C15.29 15.13 17 12.556 17 9A7 7 0 103 9c0 3.556 1.71 6.132 3.287 7.582.860.793 1.72 1.375 2.342 1.76.311.193.571.337.757.433a5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z">{store.address}</InfoRow>
                    {store.hours && <InfoRow d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z">{store.hours}</InfoRow>}
                    {store.phone && (
                      <InfoRow d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z">
                        <a href={`tel:${store.phone}`} className="font-medium text-gray-900 no-underline hover:underline">{store.phone}</a>
                      </InfoRow>
                    )}
                  </div>

                  <div className="mt-5 flex gap-2.5">
                    {store.mapsUrl && (
                      <a
                        href={store.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.48-.966 2.342-1.76C15.29 15.13 17 12.556 17 9A7 7 0 103 9c0 3.556 1.71 6.132 3.287 7.582.860.793 1.72 1.375 2.342 1.76.311.193.571.337.757.433a5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                        </svg>
                        Buka di Maps
                      </a>
                    )}
                    {store.phone && (
                      <a
                        href={`https://wa.me/${store.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 no-underline transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600">
                          <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                        </svg>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STORE_LOCATIONS_QUERY = `#graphql
  query StoreLocations {
    metaobjects(type: "store_location", first: 20) {
      edges {
        node {
          id
          handle
          fields {
            key
            value
          }
        }
      }
    }
  }
`;
