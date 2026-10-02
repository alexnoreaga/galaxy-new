import {defer} from '@shopify/remix-oxygen';
import {Await, Link, useLoaderData, useLocation} from '@remix-run/react';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {MastheadOrnament, resolveMastheadTheme} from '~/components/MastheadOrnament';
import {getCatalogIndex} from '~/lib/catalogIndex';

// One page per branch (metaobject store_location) — the local-SEO landing page for
// "toko kamera <kota>": address, hours, map, WhatsApp, and the demo units you can try there
// (products whose custom.unit_demo lists this branch), with ElectronicsStore JSON-LD tied to the
// Organization on /pages/tentang-kami.
const SITE = 'https://www.galaxy.co.id';
const LOGO = 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png';
const shortName = (n) => String(n || '').replace(/^galaxy camera\s*[-–]?\s*/i, '').trim() || n;
// "Setiap hari 10.00 – 19.00 WIB" → "Mo-Su 10:00-19:00" (schema openingHours); default = store policy
function openingHours(text) {
  const m = /(\d{1,2})[.:](\d{2})\D{1,6}(\d{1,2})[.:](\d{2})/.exec(String(text || ''));
  const span = m ? `${m[1].padStart(2, '0')}:${m[2]}-${m[3].padStart(2, '0')}:${m[4]}` : '10:00-19:00';
  const days = /senin\s*[-–]\s*sabtu/i.test(text || '') ? 'Mo-Sa' : /senin\s*[-–]\s*jumat/i.test(text || '') ? 'Mo-Fr' : 'Mo-Su';
  return `${days} ${span}`;
}

export const meta = ({data}) => {
  const s = data?.store;
  if (!s) return [{title: 'Toko tidak ditemukan | Galaxy Camera'}];
  const city = shortName(s.name);
  const url = `${SITE}/stores/${s.handle}`;
  const title = `Toko Kamera ${city} - Galaxy Camera ${city} | Alamat, Jam Buka & Unit Demo`;
  const description = `Galaxy Camera cabang ${city}: ${String(s.address || '').slice(0, 90)}. ${s.hours ? `Buka ${s.hours}. ` : ''}Kamera, lensa, drone & aksesoris garansi resmi, harga sama dengan website, bisa coba unit demo langsung di toko.`.slice(0, 160);
  return [
    {title},
    {name: 'description', content: description},
    {name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1'},
    {tagName: 'link', rel: 'canonical', href: url},
    {property: 'og:type', content: 'business.business'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: url},
    {property: 'og:image', content: LOGO},
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'ElectronicsStore',
        '@id': `${url}#store`,
        name: s.name,
        url,
        image: LOGO,
        telephone: s.phone ? `+${s.phone.replace(/\D/g, '').replace(/^0/, '62')}` : '+62-821-1131-1131',
        priceRange: 'Rp',
        currenciesAccepted: 'IDR',
        address: {'@type': 'PostalAddress', streetAddress: s.address, addressLocality: city, addressCountry: 'ID'},
        ...(s.latitude && s.longitude ? {geo: {'@type': 'GeoCoordinates', latitude: Number(s.latitude), longitude: Number(s.longitude)}} : {}),
        ...(s.mapsUrl ? {hasMap: s.mapsUrl} : {}),
        openingHours: openingHours(s.hours),
        parentOrganization: {'@type': 'Organization', '@id': `${SITE}/pages/tentang-kami#organization`, name: 'PT Galaxy Digital Niaga', url: SITE},
        sameAs: ['https://www.instagram.com/galaxycamera.id', 'https://www.tokopedia.com/galaxycamera'],
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {'@type': 'ListItem', position: 1, name: 'Home', item: SITE},
          {'@type': 'ListItem', position: 2, name: 'Toko Kami', item: `${SITE}/stores`},
          {'@type': 'ListItem', position: 3, name: city, item: url},
        ],
      },
    },
  ];
};

export async function loader({params, context}) {
  const {handle} = params;
  const {storefront} = context;
  const data = await storefront.query(STORE_QUERY, {variables: {handle}, cache: storefront.CacheLong()});
  const node = data?.metaobject;
  if (!node) throw new Response('Toko tidak ditemukan', {status: 404});
  const f = {};
  node.fields.forEach(({key, value}) => { f[key] = value; });
  const store = {id: node.id, handle: node.handle, name: f.name || '', address: f.address || '', latitude: f.latitude || '', longitude: f.longitude || '', mapsUrl: f.maps_url || '', phone: f.phone || '', hours: f.hours || ''};
  const others = (data?.metaobjects?.nodes ?? []).filter((n) => n.handle !== node.handle).map((n) => { const g = {}; n.fields.forEach(({key, value}) => { g[key] = value; }); return {handle: n.handle, name: g.name || n.handle}; });
  const city = shortName(store.name).toLowerCase();
  // Demo units at this branch — from the cached catalog walk (deferred: below the fold, cold start ~5 s once per instance)
  const demoUnits = getCatalogIndex(storefront)
    .then((idx) => (idx.demoUnits ?? []).filter((p) => p.stores.some((st) => st === 'semua' || st.includes(city) || city.includes(st))).slice(0, 24))
    .catch(() => []);
  return defer({store, others, demoUnits});
}

function Row({icon, children}) {
  return (
    <div className="flex items-start gap-2.5">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d={icon} clipRule="evenodd" /></svg>
      <div className="text-sm text-gray-700 leading-relaxed min-w-0">{children}</div>
    </div>
  );
}
const ICON_PIN = 'M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z';
const ICON_CLOCK = 'M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z';
const ICON_PHONE = 'M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z';

export default function StorePage() {
  const {store, others, demoUnits} = useLoaderData();
  const location = useLocation();
  const mastheadTheme = resolveMastheadTheme(location.search);
  const city = shortName(store.name);
  const wa = store.phone ? `https://wa.me/${store.phone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo Galaxy Camera ${city}, saya mau tanya ketersediaan unit di toko.`)}` : 'https://wa.me/6282111311131';
  return (
    <div className="-mx-4 min-h-screen bg-gray-50 pb-12">
      {/* Hero — same charcoal pattern as /stores and the collection headers */}
      <div className="sm:max-w-5xl sm:mx-auto sm:px-4 sm:pt-5">
        <div className="relative overflow-hidden bg-gray-900 sm:rounded-2xl">
          <div aria-hidden="true" className="absolute inset-y-0 right-0 w-64 pointer-events-none opacity-60 -scale-x-100 [mask-image:linear-gradient(to_right,black_35%,transparent)]">
            <MastheadOrnament theme={mastheadTheme} id="gxOrnStore" />
          </div>
          <div className="relative px-5 sm:px-8 pt-8 pb-9 sm:py-10">
            <nav aria-label="Breadcrumb" className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-300">
              <Link to="/stores" className="no-underline hover:text-white text-gray-300">Toko Kami</Link>
              <span className="mx-2 text-gray-500">/</span>
              <span className="text-white">{city}</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">Galaxy Camera {city}</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-lg">
              Toko kamera di {city}: lihat dan coba unitnya langsung, harga sama dengan website, garansi resmi, bawa pulang hari itu juga.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 grid md:grid-cols-[1fr_minmax(0,1.2fr)] gap-4 sm:gap-5">
        <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-5">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{store.name}</h2>
            <div className="mt-3 space-y-2.5">
              <Row icon={ICON_PIN}>{store.address}</Row>
              {store.hours && <Row icon={ICON_CLOCK}>{store.hours}</Row>}
              {store.phone && <Row icon={ICON_PHONE}><a href={`tel:${store.phone}`} className="font-medium text-gray-900 no-underline hover:underline">{store.phone}</a></Row>}
            </div>
            <div className="mt-5 flex gap-2.5">
              {store.mapsUrl && (
                <a href={store.mapsUrl} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white no-underline">Buka di Maps</a>
              )}
              <a href={wa} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 no-underline">WhatsApp</a>
            </div>
          </div>
        </article>

        {store.latitude && store.longitude ? (
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-100 min-h-[220px]">
            <iframe
              title={`Peta ${store.name}`}
              width="100%"
              height="100%"
              style={{border: 0, minHeight: 220}}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(store.longitude) - 0.005},${parseFloat(store.latitude) - 0.004},${parseFloat(store.longitude) + 0.005},${parseFloat(store.latitude) + 0.004}&layer=mapnik&marker=${store.latitude},${store.longitude}`}
            />
          </div>
        ) : null}
      </div>

      {/* Demo units at this branch — unique content per page, straight from custom.unit_demo */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <Suspense fallback={null}>
          <Await resolve={demoUnits}>
            {(units) => units.length > 0 ? (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Unit demo yang bisa dicoba di {city}</h2>
                <p className="mt-1 mb-4 text-sm text-gray-500">Produk ini ada unit display-nya di cabang {city}. Konfirmasi dulu via WhatsApp supaya unitnya dipastikan ada saat Anda datang.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {units.map((p) => (
                    <Link key={p.handle} to={`/products/${p.handle}`} prefetch="intent" className="bg-white rounded-xl border border-gray-200 hover:border-gray-900 transition-colors overflow-hidden no-underline">
                      <div className="aspect-square bg-gray-50">
                        {p.image ? <Image src={p.image} alt={p.title} width={300} height={300} sizes="(min-width: 1024px) 220px, 45vw" className="w-full h-full object-contain" loading="lazy" /> : null}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">{p.title}</p>
                        {p.price > 0 && <p className="mt-1 text-sm font-bold text-red-600">Rp{p.price.toLocaleString('id-ID')}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </Await>
        </Suspense>

        <section className="mt-10">
          <h2 className="text-base font-bold text-gray-900 mb-3">Cabang Galaxy Camera lainnya</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link key={o.handle} to={`/stores/${o.handle}`} prefetch="intent" className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:border-gray-900 no-underline">{shortName(o.name)}</Link>
            ))}
            <Link to="/stores" className="rounded-full bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white no-underline">Semua toko</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

const STORE_QUERY = `#graphql
  query StoreLocation($handle: String!) {
    metaobject(handle: {type: "store_location", handle: $handle}) {
      id
      handle
      fields { key value }
    }
    metaobjects(type: "store_location", first: 20) {
      nodes { handle fields { key value } }
    }
  }
`;
