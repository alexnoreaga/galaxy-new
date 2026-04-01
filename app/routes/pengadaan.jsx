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

  const bannerField = banner?.fields?.find(field => field.key === 'banner');
  const bannerImageUrl = bannerField?.reference?.image?.url;
  const bannerImageAlt = bannerField?.reference?.image?.altText || 'Banner Pengadaan';

  return (
    <div className="w-full bg-white">

      {/* ── BANNER ── */}
      {bannerImageUrl && (
        <div className="w-full">
          <img src={bannerImageUrl} alt={bannerImageAlt} className="w-full h-auto object-cover" />
        </div>
      )}

      {/* ── HERO INTRO ── */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-14 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">Layanan Pengadaan Resmi</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5">
              Solusi Pengadaan Kamera & Drone untuk Instansi Pemerintah & Perusahaan Swasta
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8">
              <strong className="text-white">PT. Galaxy Digital Niaga (Galaxy Camera)</strong> adalah mitra terpercaya untuk pengadaan kamera, drone, dan perlengkapan imaging profesional. Transparan, sesuai regulasi, produk 100% original bergaransi resmi.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {['E-Katalog INAPROC (LKPP)', 'SIPLah', 'Garansi Resmi', 'Berpengalaman Sejak 2012'].map(badge => (
                <span key={badge} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  <svg className="w-3 h-3 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2012', label: 'Tahun Berdiri' },
              { value: '1.000+', label: 'Klien Terlayani' },
              { value: '100%', label: 'Produk Original' },
              { value: 'Nasional', label: 'Jangkauan Pengiriman' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COLLECTIONS ── */}
      <div className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">Katalog Produk</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Produk Tersedia untuk Pengadaan</h2>
            </div>
            <a href="/collections" className="hidden sm:block text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap">
              Lihat Semua →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {collections.map((collection) => (
              <a
                key={collection.id}
                href={`/collections/${collection.handle}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                {collection.image && (
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <Image
                      data={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="px-3 py-3 text-center">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {collection.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <a href="/collections" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Lihat Semua Kategori →</a>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-16 lg:py-20 space-y-20">

        {/* Services */}
        <section>
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Layanan</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Layanan Pengadaan yang Kami Sediakan</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Kamera Mirrorless',
                desc: 'Untuk dokumentasi, humas, media, dan kebutuhan kreatif instansi',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />,
              },
              {
                title: 'Kamera DSLR',
                desc: 'Untuk dokumentasi profesional dan arsip visual berkualitas tinggi',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />,
              },
              {
                title: 'Drone Profesional',
                desc: 'Untuk pemetaan, monitoring, dokumentasi udara, dan kebutuhan teknis',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />,
              },
              {
                title: 'Videografi & Content Production',
                desc: 'Solusi lengkap peralatan produksi konten untuk kebutuhan instansi',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />,
              },
              {
                title: 'Lensa & Aksesoris Pendukung',
                desc: 'Aksesori premium untuk melengkapi peralatan pengadaan instansi',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.654-4.654m5.896-5.896l-3.03 2.496c-.14.468-.382.89-.766 1.208M13.5 4.5L15 6m-1.5-1.5L12 3m1.5 1.5L9 9M6 6l1.5 1.5M6 6L4.5 4.5M6 6l3 3" />,
              },
              {
                title: 'Paket Custom Sesuai Spesifikasi',
                desc: 'Disesuaikan dengan TOR, RUP, dan kebutuhan teknis instansi Anda',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />,
              },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                    {icon}
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Platform Credentials */}
        <section className="bg-slate-900 rounded-3xl p-8 lg:p-12 text-white">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Kredensial Resmi</p>
            <h2 className="text-2xl md:text-3xl font-bold">Terdaftar di Platform Pengadaan Resmi Pemerintah</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'E-Katalog INAPROC (LKPP)',
                desc: 'Pengadaan langsung dengan proses cepat dan transparan melalui platform resmi LKPP',
              },
              {
                title: 'SIPLah',
                desc: 'Sistem Pengadaan Sekolah — mitra resmi untuk kebutuhan pengadaan lembaga pendidikan',
              },
              {
                title: 'Pengadaan Non-E-Katalog',
                desc: 'Melayani pengadaan di luar e-katalog sesuai mekanisme dan regulasi yang berlaku',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-2xl p-5">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quality Commitment */}
        <section>
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Komitmen Kami</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Produk Original & Bergaransi Resmi</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                value: '100%',
                title: 'Produk Original',
                desc: 'Terverifikasi langsung dari distributor resmi Indonesia',
              },
              {
                value: 'Garansi Resmi',
                title: 'Garansi Distributor',
                desc: 'Garansi resmi dari distributor Indonesia, bukan paralel',
              },
              {
                value: 'Global Brands',
                title: 'Merek Ternama Dunia',
                desc: 'Sony, Canon, Nikon, DJI, Fujifilm, dan merek terpercaya lainnya',
              },
            ].map(({ value, title, desc }) => (
              <div key={title} className="border border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-2xl font-extrabold text-blue-600 mb-1">{value}</p>
                <p className="font-semibold text-gray-900 mb-2">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Professional Team */}
        <section>
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Tim Kami</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tim Profesional & Pendampingan Pengadaan</h2>
          </div>
          <div className="bg-gray-50 rounded-3xl p-8 lg:p-10">
            <p className="text-gray-600 mb-8 leading-relaxed max-w-2xl">
              Galaxy Camera didukung oleh tim berpengalaman yang siap memberikan layanan terbaik di setiap tahap pengadaan Anda.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Konsultasi Spesifikasi Teknis', desc: 'Panduan pemilihan produk yang tepat sesuai kebutuhan dan anggaran' },
                { title: 'Penyesuaian Anggaran', desc: 'Solusi harga yang kompetitif, fleksibel, dan sesuai pagu yang tersedia' },
                { title: 'Pendampingan Proses', desc: 'Dukungan penuh dalam setiap tahap mulai dari penawaran hingga serah terima' },
                { title: 'After Sales Support', desc: 'Layanan purna jual yang responsif, garansi klaim, dan dukungan teknis' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">{title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 italic mt-6 border-t border-gray-200 pt-6">
              "Kami percaya pengadaan yang baik bukan hanya soal harga, tetapi ketepatan spesifikasi, kejelasan dokumen, dan layanan purna jual yang bertanggung jawab."
            </p>
          </div>
        </section>

        {/* Partners & Clients */}
        <section>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Klien & Mitra</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Partner & Klien Kami</h2>
            <p className="text-gray-600 leading-relaxed max-w-3xl">
              PT. Galaxy Digital Niaga telah dipercaya oleh ribuan klien dari berbagai sektor di seluruh Indonesia — mulai dari institusi pendidikan, korporasi nasional, hingga instansi pemerintah pusat dan daerah.
            </p>
          </div>

          <div className="space-y-4">
            {/* Pendidikan */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900">Institusi Pendidikan & Yayasan</h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-500 mb-4">Kami menjalin kerja sama dengan berbagai institusi pendidikan dan yayasan terkemuka di Indonesia, di antaranya:</p>
                <ul className="grid md:grid-cols-2 gap-2">
                  {['Yayasan Universitas Pelita Harapan', 'Universitas Trisakti', 'Yayasan Citra Berkat', 'Ratusan institusi pendidikan lainnya'].map(name => (
                    <li key={name} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Swasta */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-emerald-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900">Perusahaan Swasta & Korporasi</h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-500 mb-4">Kepercayaan datang dari perusahaan-perusahaan nasional dari berbagai sektor industri, seperti:</p>
                <ul className="grid md:grid-cols-2 gap-2">
                  {['PT. Maybank Sekuritas Indonesia', 'Indofood Fortuna Makmur', 'PT. JHL Collections Indonesia', 'PT. Surya Internusa Hotels', 'PT. Bos Tobos Indonesia', 'Ribuan perusahaan mitra lainnya'].map(name => (
                    <li key={name} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pemerintah */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900">Instansi Pemerintah & Layanan Publik</h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-500 mb-4">Berpengalaman mendukung kebutuhan pengadaan dan teknologi untuk instansi pemerintah pusat dan daerah, antara lain:</p>
                <ul className="space-y-3">
                  {[
                    { name: 'Pusat Investasi Pemerintah', sub: 'Direktorat Jenderal Perbendaharaan – Kementerian Keuangan' },
                    { name: 'Kantor Pelayanan Pajak Pratama Payakumbuh', sub: 'Direktorat Jenderal Pajak – Kementerian Keuangan' },
                    { name: 'Rumah Sakit Umum Dr. Hasan Sadikin Bandung', sub: 'Direktorat Jenderal Pelayanan Kesehatan – Kementerian Kesehatan' },
                    { name: 'Balai Pengembangan SDM dan Penelitian', sub: 'Komunikasi dan Informatika Bandung' },
                  ].map(({ name, sub }) => (
                    <li key={name} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0 mt-2" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </div>
                    </li>
                  ))}
                  <li className="flex items-center gap-3 text-sm text-gray-500 italic">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                    Dan berbagai instansi pemerintah pusat dan daerah lainnya di seluruh Indonesia
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 rounded-3xl p-8 lg:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Siap Melayani Kebutuhan Pengadaan Anda?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto leading-relaxed">
            Hubungi tim Galaxy Camera untuk konsultasi gratis mengenai pengadaan kamera, drone, dan peralatan imaging profesional untuk instansi Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <a
              href="https://wa.me/6282111311131"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
              </svg>
              Hubungi via WhatsApp
            </a>
            <a
              href="mailto:Sales@galaxy.co.id"
              className="inline-flex items-center justify-center gap-2 bg-blue-700 border border-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
              Kirim Email
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-blue-100 border-t border-blue-500 pt-6">
            <a href="https://wa.me/6282111311131" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              0821-1131-1131
            </a>
            <span className="hidden sm:block w-px h-4 bg-blue-400" />
            <a href="mailto:Sales@galaxy.co.id" className="hover:text-white transition-colors">
              Sales@galaxy.co.id
            </a>
          </div>
        </section>

        {/* Footer tagline */}
        <div className="text-center pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">PT. Galaxy Digital Niaga</p>
          <p className="text-lg font-semibold text-gray-700">Mitra Pengadaan Kamera & Imaging Terpercaya untuk Instansi Indonesia</p>
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
