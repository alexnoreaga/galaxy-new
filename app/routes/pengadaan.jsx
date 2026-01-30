import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {ProductGrid} from '~/components/ProductGrid';

export async function loader({context}) {
  const data = await context.storefront.query(PENGADAAN_QUERY);
  return json(data);
}

export const meta = () => {
  // ENHANCED - Better title and description
  const title = 'Pengadaan Kamera & Drone untuk Instansi Pemerintah | Galaxy Camera';
  const description = 'Layanan pengadaan kamera mirrorless, DSLR, drone profesional untuk instansi pemerintah, BUMN, BUMD, pendidikan. Terdaftar E-Katalog INAPROC & SIPLah. Garansi resmi, proses transparan, pengiriman cepat ke seluruh Indonesia.';
  
  // ENHANCED - Better keywords
  const keywords = 'pengadaan kamera, pengadaan drone, pengadaan pemerintah, e-katalog inaproc, siplah, kamera instansi, drone profesional, pengadaan kamera mirrorless, pengadaan kamera dslr, penyedia kamera pemerintah, galaxy camera';

  // Canonical URL
  const canonicalUrl = 'https://galaxy.co.id/pengadaan';

  return [
    // Basic Meta Tags
    {
      title: title,
    },
    {
      name: 'title',
      content: title,
    },
    {
      name: 'description',
      content: description.substring(0, 160),
    },
    {
      name: 'keywords',
      content: keywords,
    },
    {
      name: 'author',
      content: 'PT Galaxy Digital Niaga',
    },

    // Robots & Indexing
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large, max-snippet:-1',
    },

    // Canonical URL
    {
      tagName: 'link',
      rel: 'canonical',
      href: canonicalUrl,
    },

    // Open Graph Tags
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:description',
      content: description.substring(0, 160),
    },
    {
      property: 'og:url',
      content: canonicalUrl,
    },
    {
      property: 'og:site_name',
      content: 'Galaxy Camera',
    },
    {
      property: 'og:image',
      content: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
    },
    {
      property: 'og:image:width',
      content: '1200',
    },
    {
      property: 'og:image:height',
      content: '630',
    },
    {
      property: 'og:locale',
      content: 'id_ID',
    },

    // Twitter Card Tags
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:site',
      content: '@galaxycamera99',
    },
    {
      name: 'twitter:title',
      content: title,
    },
    {
      name: 'twitter:description',
      content: description.substring(0, 160),
    },
    {
      name: 'twitter:image',
      content: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
    },

    // Service Schema (JSON-LD)
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Pengadaan Kamera & Drone untuk Instansi Pemerintah',
        'description': description,
        'provider': {
          '@type': 'Organization',
          'name': 'PT Galaxy Digital Niaga - Galaxy Camera',
          'url': 'https://galaxy.co.id',
          'logo': 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
          'sameAs': [
            'https://www.instagram.com/galaxycamera99',
            'https://www.facebook.com/galaxycamera99',
            'https://www.tiktok.com/@galaxycameraid',
            'https://www.youtube.com/galaxycamera',
            'https://www.x.com/galaxycamera99',
          ],
        },
        'areaServed': 'ID',
        'availableLanguage': ['id', 'en'],
        'serviceType': [
          'Pengadaan Kamera',
          'Pengadaan Drone',
          'Pengadaan Perlengkapan Fotografi',
          'E-Katalog INAPROC',
          'SIPLah',
        ],
        'hasOfferCatalog': {
          '@type': 'OfferCatalog',
          'name': 'Produk Pengadaan',
          'itemListElement': [
            {
              '@type': 'Offer',
              'name': 'Kamera Mirrorless',
              'priceCurrency': 'IDR',
              'description': 'Pengadaan kamera mirrorless profesional untuk instansi pemerintah',
            },
            {
              '@type': 'Offer',
              'name': 'Kamera DSLR',
              'priceCurrency': 'IDR',
              'description': 'Pengadaan kamera DSLR berkualitas tinggi dengan garansi resmi',
            },
            {
              '@type': 'Offer',
              'name': 'Drone Profesional',
              'priceCurrency': 'IDR',
              'description': 'Pengadaan drone untuk survey, pemetaan, dan dokumentasi',
            },
          ],
        },
      },
    },

    // Organization Schema
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'PT Galaxy Digital Niaga',
        'alternateName': 'Galaxy Camera',
        'url': 'https://galaxy.co.id',
        'logo': 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
        'description': description,
        'foundingDate': '2012',
        'areaServed': 'ID',
        'sameAs': [
          'https://www.instagram.com/galaxycamera99',
          'https://www.facebook.com/galaxycamera99',
          'https://www.tiktok.com/@galaxycameraid',
          'https://www.youtube.com/galaxycamera',
          'https://www.x.com/galaxycamera99',
        ],
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'Customer Service',
          'telephone': '+62-821-1131-1131',
          'email': 'sales@galaxy.co.id',
          'availableLanguage': ['Indonesian', 'English'],
        },
      },
    },

    // BreadcrumbList Schema
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://galaxy.co.id',
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Info Pengadaan',
            'item': canonicalUrl,
          },
        ],
      },
    },
  ];
};

// OLD CODE - Commented for future reference
// export const meta = () => {
//   return [
//     {title: 'Pengadaan Kamera & Drone untuk Instansi Pemerintah | Galaxy Camera'},
//     {
//       name: 'description',
//       content:
//         'Layanan pengadaan kamera mirrorless, DSLR, drone, dan peralatan imaging profesional untuk instansi pemerintah, BUMN, BUMD, dan lembaga pendidikan Indonesia. Terdaftar E-Katalog INAPROC & SIPLah.',
//     },
//     {
//       name: 'keywords',
//       content:
//         'pengadaan kamera, pengadaan drone, pengadaan pemerintah, kamera instansi, drone pemerintah, e-katalog inaproc, siplah, galaxy camera',
//     },
//     {
//       property: 'og:title',
//       content: 'Pengadaan Kamera & Drone untuk Instansi Pemerintah | Galaxy Camera',
//     },
//     {
//       property: 'og:description',
//       content:
//         'Mitra pengadaan terpercaya untuk kamera, drone, dan peralatan imaging. Bergaransi resmi, proses transparan, melayani seluruh Indonesia.',
//     },
//     {
//       property: 'og:type',
//       content: 'website',
//     },
//   ];
// };

export default function PengadaanPage() {
  const data = useLoaderData();
  const banner = data?.metaobject;
  const collections = data?.collections?.edges?.map(edge => edge.node) || [];

  // Get banner image field (field key is "banner")
  const bannerField = banner?.fields?.find(field => field.key === 'banner');
  const bannerImageUrl = bannerField?.reference?.image?.url;
  const bannerImageAlt = bannerField?.reference?.image?.altText || 'Banner Pengadaan';

  return (
    <div className="w-full">
      {/* Banner */}
      {bannerImageUrl && (
        <div className="w-full flex justify-center mb-12">
          <div className="container mx-auto px-4 sm:max-w-screen-md md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
            <img
              src={bannerImageUrl}
              alt={bannerImageAlt}
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Collections Section */}
      <div className="mb-12 sm:mb-16">
        <div className="container mx-auto px-4 sm:max-w-screen-md md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-8 text-center">Produk Tersedia</h2>
        </div>
        
        {/* Collections Grid - Horizontal scroll on mobile, grid on desktop */}
        <div className="overflow-x-auto scrollbar-hide px-4 sm:px-0">
          <div className="container mx-auto sm:max-w-screen-md md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
            <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {collections.map((collection) => (
                <a
                  key={collection.id}
                  href={`/collections/${collection.handle}`}
                  className="group flex-shrink-0 w-32 sm:w-auto"
                >
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {collection.image && (
                      <div className="relative overflow-hidden bg-gray-100 h-32 sm:h-40">
                        <Image
                          data={collection.image}
                          alt={collection.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-2 sm:p-4 text-center">
                      <h3 className="text-xs sm:text-base font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {collection.title}
                      </h3>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* See More Button */}
        <div className="text-center mb-8 sm:mb-16">
          <a
            href="/collections"
            className="inline-block bg-black text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors"
          >
            Lihat Semua Kategori Produk
          </a>
        </div>
      </div>

      {/* Description Section */}
      <div className="w-full bg-gradient-to-b from-white to-gray-50">
        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'PT. Galaxy Digital Niaga - Galaxy Camera',
            alternateName: 'Galaxy Camera',
            url: 'https://galaxycamera.id',
            logo: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
            description:
              'Mitra pengadaan kamera dan drone terpercaya untuk instansi pemerintah, BUMN, BUMD, dan lembaga pendidikan di Indonesia',
            areaServed: 'ID',
            serviceType: ['Pengadaan Kamera', 'Pengadaan Drone', 'E-Katalog', 'SIPLah'],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              availableLanguage: ['Indonesian', 'English'],
            },
          })}
        </script>

        <div className="container mx-auto px-4 sm:max-w-screen-md md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl py-12 sm:py-20">
          {/* Intro Section */}
          <div className="mb-12 sm:mb-20">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Solusi Pengadaan Kamera & Drone untuk Instansi Pemerintah
            </h1>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-3 sm:mb-4">
                  <strong>PT. Galaxy Digital Niaga (Galaxy Camera)</strong> adalah mitra terpercaya untuk pengadaan kamera, perlengkapan fotografi, videografi, dan solusi imaging profesional bagi instansi pemerintah, BUMN, BUMD, dan lembaga pendidikan di Indonesia.
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg leading-relaxed text-gray-700">
                  Kami menyediakan layanan pengadaan yang <span className="font-semibold text-blue-600">transparan, efisien, dan sesuai regulasi</span> dengan produk 100% original dan bergaransi resmi.
                </p>
              </div>
            </div>
          </div>

          {/* Solutions Grid */}
          <div className="mb-12 sm:mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-12 pb-3 sm:pb-4 border-b-2 border-blue-600">
              Layanan Pengadaan yang Kami Sediakan
            </h2>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100">
                      <span className="text-blue-600 text-lg sm:text-xl">📷</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900">Pengadaan Kamera Mirrorless</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Untuk dokumentasi, humas, media, dan kebutuhan kreatif instansi</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100">
                      <span className="text-blue-600 text-lg sm:text-xl">📸</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900">Pengadaan Kamera DSLR</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Untuk dokumentasi profesional dan arsip visual berkualitas tinggi</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100">
                      <span className="text-blue-600 text-lg sm:text-xl">🚁</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900">Pengadaan Drone</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Untuk pemetaan, monitoring, dokumentasi udara, dan kebutuhan teknis</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100">
                      <span className="text-blue-600 text-lg sm:text-xl">🎬</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900">Peralatan Videografi & Content Production</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Solusi lengkap untuk produksi konten profesional</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100">
                      <span className="text-blue-600 text-lg sm:text-xl">🔧</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900">Lensa & Aksesoris Pendukung</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Aksesori premium untuk melengkapi peralatan pengadaan</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100">
                      <span className="text-blue-600 text-lg sm:text-xl">📋</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900">Paket Custom Sesuai Spesifikasi</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Disesuaikan dengan TOR, RUP, dan kebutuhan teknis instansi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Pengadaan */}
          <div className="mb-12 sm:mb-20 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-10 rounded-lg border border-blue-200">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
              Terdaftar di Platform Pengadaan Resmi Pemerintah
            </h2>
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex items-start">
                <span className="text-xl sm:text-2xl mr-3 sm:mr-4">✅</span>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">E-Katalog INAPROC (LKPP)</h3>
                  <p className="text-sm sm:text-base text-gray-700">Pengadaan langsung dengan proses cepat dan transparan</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-xl sm:text-2xl mr-3 sm:mr-4">✅</span>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">SIPLah (Sistem Pengadaan Sekolah)</h3>
                  <p className="text-sm sm:text-base text-gray-700">Untuk kebutuhan pengadaan lembaga pendidikan</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-xl sm:text-2xl mr-3 sm:mr-4">✅</span>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Pengadaan Non-E-Catalog</h3>
                  <p className="text-sm sm:text-base text-gray-700">Sesuai mekanisme dan regulasi yang berlaku</p>
                </div>
              </div>
            </div>
          </div>

          {/* Komitmen Kualitas */}
          <div className="mb-12 sm:mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-12 pb-3 sm:pb-4 border-b-2 border-blue-600">
              Komitmen Kami: Produk Original & Bergaransi Resmi
            </h2>
            <div className="bg-white rounded-lg p-6 sm:p-8 border-l-4 border-blue-600">
              <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">100%</div>
                  <p className="text-sm sm:text-base text-gray-700 font-semibold">Produk Original</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">Terverifikasi langsung dari distributor resmi</p>
                </div>
                <div className="text-center border-t md:border-t-0 md:border-l md:border-r border-gray-200 pt-6 md:pt-0">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">✓</div>
                  <p className="text-sm sm:text-base text-gray-700 font-semibold">Garansi Resmi</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">Garansi distributor resmi Indonesia</p>
                </div>
                <div className="text-center border-t md:border-t-0 border-gray-200 pt-6 md:pt-0">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">🌍</div>
                  <p className="text-sm sm:text-base text-gray-700 font-semibold">Merek Ternama Dunia</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">Produk dari merek kamera terpercaya global</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tim & Dukungan */}
          <div className="mb-12 sm:mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-12 pb-3 sm:pb-4 border-b-2 border-blue-600">
              Tim Profesional & Pendampingan Pengadaan
            </h2>
            <div className="bg-white rounded-lg p-6 sm:p-8 border border-gray-200">
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                Galaxy Camera didukung oleh tim berpengalaman yang siap memberikan layanan terbaik:
              </p>
              <ul className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-100 text-blue-600 mr-2 sm:mr-3 flex-shrink-0 text-sm">
                    ✓
                  </span>
                  <span className="text-sm sm:text-base text-gray-700"><strong>Konsultasi Spesifikasi Teknis</strong> - Panduan pemilihan produk yang tepat sesuai kebutuhan</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-100 text-blue-600 mr-2 sm:mr-3 flex-shrink-0 text-sm">
                    ✓
                  </span>
                  <span className="text-sm sm:text-base text-gray-700"><strong>Penyesuaian Anggaran</strong> - Solusi harga yang kompetitif dan fleksibel</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-100 text-blue-600 mr-2 sm:mr-3 flex-shrink-0 text-sm">
                    ✓
                  </span>
                  <span className="text-sm sm:text-base text-gray-700"><strong>Pendampingan Proses</strong> - Dukungan penuh dalam setiap tahap pengadaan</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-100 text-blue-600 mr-2 sm:mr-3 flex-shrink-0 text-sm">
                    ✓
                  </span>
                  <span className="text-sm sm:text-base text-gray-700"><strong>After Sales Support</strong> - Layanan purna jual yang responsif dan terpercaya</span>
                </li>
              </ul>
              <p className="text-sm sm:text-base text-gray-700 mt-4 sm:mt-6 italic">
                Kami percaya pengadaan yang baik bukan hanya soal harga, tetapi ketepatan spesifikasi, kejelasan dokumen, dan layanan purna jual yang bertanggung jawab.
              </p>
            </div>
          </div>

          {/* Jangkauan Layanan */}
          <div className="mb-12 sm:mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-12 pb-3 sm:pb-4 border-b-2 border-blue-600">
              Jangkauan Layanan Nasional
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 sm:p-8 border border-green-200">
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                Dengan cakupan layanan di seluruh Indonesia, kami siap melayani pengadaan dan pengiriman ke:
              </p>
              <ul className="grid md:grid-cols-2 gap-3 sm:gap-4">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 sm:mr-3 text-base sm:text-lg">🚚</span>
                  <span className="text-sm sm:text-base text-gray-700">Pengiriman aman ke seluruh nusantara</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 sm:mr-3 text-base sm:text-lg">📋</span>
                  <span className="text-sm sm:text-base text-gray-700">Dokumentasi sesuai standar pengadaan</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 sm:mr-3 text-base sm:text-lg">🏢</span>
                  <span className="text-sm sm:text-base text-gray-700">Instansi pemerintah pusat & daerah</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 sm:mr-3 text-base sm:text-lg">📞</span>
                  <span className="text-sm sm:text-base text-gray-700">Customer support responsif 24/7</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Siap Melayani Kebutuhan Pengadaan Anda?</h2>
            <p className="text-sm sm:text-base text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Hubungi tim Galaxy Camera untuk konsultasi gratis mengenai pengadaan kamera, drone, dan peralatan imaging profesional.
            </p>
            
            {/* Contact Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <span className="text-green-600 text-xl sm:text-2xl mr-2 sm:mr-3">📱</span>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">WhatsApp / Telepon</p>
                    <a href="https://wa.me/6282111311131" target="_blank" rel="noopener noreferrer" className="text-base sm:text-lg font-semibold text-blue-600 hover:text-blue-800">
                      0821-1131-1131
                    </a>
                  </div>
                </div>
                <div className="h-px bg-gray-300"></div>
                <div className="flex items-center justify-center">
                  <span className="text-blue-600 text-xl sm:text-2xl mr-2 sm:mr-3">📧</span>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Email Sales</p>
                    <a href="mailto:Sales@galaxy.co.id" className="text-base sm:text-lg font-semibold text-blue-600 hover:text-blue-800">
                      Sales@galaxy.co.id
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a href="https://wa.me/6282111311131" target="_blank" rel="noopener noreferrer" 
                className="inline-flex items-center justify-center bg-green-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 transition-colors">
                💬 Hubungi via WhatsApp
              </a>
              <a href="mailto:Sales@galaxy.co.id" 
                className="inline-flex items-center justify-center bg-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors">
                📧 Kirim Email
              </a>
            </div>
          </div>

          {/* Footer Company Info */}
          <div className="text-center py-8 sm:py-12 border-t border-gray-200">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">PT. Galaxy Digital Niaga</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Galaxy Camera</p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 font-semibold">
              Mitra Pengadaan Kamera & Imaging Terpercaya untuk Instansi dan Pemerintah Indonesia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const PENGADAAN_QUERY = `
  query PengadaanPage {
    metaobject(handle: {handle: "banner-pengadaan-2shqyanu", type: "banner_pengadaan"}) {
      id
      handle
      type
      fields {
        key
        value
        reference {
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
      }
    }
    collections(first: 5) {
      edges {
        node {
          id
          title
          handle
          image {
            url
            altText
          }
        }
      }
    }
  }
`;
