import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';

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

export default function StoresPage() {
  const {stores} = useLoaderData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div
        className="text-white relative overflow-hidden"
        style={{
          backgroundColor: '#0f172a',
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.06)'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'auto, auto, 40px 40px',
        }}
      >
        {/* Decorative blurred blobs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-blue-600 opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-500 opacity-10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Toko Kami</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Lokasi Galaxy Camera</h1>
          <p className="text-slate-300 text-base max-w-lg">Kunjungi toko kami dan temukan kamera, drone, serta aksesoris terlengkap dengan garansi resmi.</p>
        </div>
      </div>

      {/* Store list */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {stores.length === 0 ? (
          <p className="text-gray-500 text-center py-20">Tidak ada toko ditemukan.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {stores.map((store) => (
              <div key={store.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Map embed */}
                {store.latitude && store.longitude && (
                  <div className="w-full h-44 bg-gray-100">
                    <iframe
                      title={store.name}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{border: 0}}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(store.longitude)-0.005},${parseFloat(store.latitude)-0.005},${parseFloat(store.longitude)+0.005},${parseFloat(store.latitude)+0.005}&layer=mapnik&marker=${store.latitude},${store.longitude}`}
                    />
                  </div>
                )}

                <div className="p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-3">{store.name}</h2>

                  <div className="space-y-2.5">
                    {/* Address */}
                    <div className="flex items-start gap-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5">
                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.48-.966 2.342-1.76C15.29 15.13 17 12.556 17 9A7 7 0 103 9c0 3.556 1.71 6.132 3.287 7.582.860.793 1.72 1.375 2.342 1.76.311.193.571.337.757.433a5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-gray-600 leading-relaxed">{store.address}</p>
                    </div>

                    {/* Hours */}
                    {store.hours && (
                      <div className="flex items-center gap-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-600">{store.hours}</p>
                      </div>
                    )}

                    {/* Phone */}
                    {store.phone && (
                      <div className="flex items-center gap-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                        </svg>
                        <a href={`tel:${store.phone}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          {store.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* CTA buttons */}
                  <div className="flex gap-2.5 mt-4">
                    {store.mapsUrl && (
                      <a
                        href={store.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
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
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                        </svg>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
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
