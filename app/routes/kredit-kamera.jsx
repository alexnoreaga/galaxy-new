import {defer} from '@shopify/remix-oxygen';
import {useLoaderData, Await, Link} from '@remix-run/react';
import {Suspense, useState} from 'react';
import {Image, Money} from '@shopify/hydrogen';

const monthsInIndonesian = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function getCurrentMonthYear() {
  const now = new Date();
  const month = monthsInIndonesian[now.getMonth()];
  const year = now.getFullYear();
  return `${month} ${year}`;
}

export const meta = () => {
  const monthYear = getCurrentMonthYear();
  return [
    {
      title: `Daftar Cicilan Kamera Tanpa Kartu Kredit ${monthYear} | Galaxy Camera`,
    },
    {
      name: 'description',
      content:
        'Beli kamera dengan cicilan mulai dari 3 hingga 12 bulan. Bunga rendah dan proses cepat.',
    },
  ];
};

export async function loader({request, context}) {
  const productsPromise = context.storefront.query(GET_PRODUCTS_QUERY).then(data => {
    // Combine all products from all collections
    let allProducts = [];
    
    const collections = ['kameraMirrorless', 'kameraCompact', 'kameraAction', 'kameraDrone', 'kameraPocket'];
    
    collections.forEach(collectionKey => {
      if (data[collectionKey]?.products?.nodes) {
        allProducts = allProducts.concat(data[collectionKey].products.nodes);
      }
    });
    
    // Remove duplicates by handle
    const uniqueProducts = Array.from(
      new Map(allProducts.map(item => [item.handle, item])).values()
    );
    
    // Sort by price (lowest first)
    uniqueProducts.sort((a, b) => {
      const priceA = parseFloat(a.variants?.nodes[0]?.price?.amount || 0);
      const priceB = parseFloat(b.variants?.nodes[0]?.price?.amount || 0);
      return priceA - priceB;
    });
    
    return {
      products: {
        nodes: uniqueProducts
      }
    };
  });
  
  return defer({productsPromise});
}

function calculateInstallment(price, months, rate = 0.026) {
  let totalCost;
  
  if (months === 3) {
    // 0% bunga + 1% admin fee
    totalCost = price * 1.01;
  } else {
    // 2.6% per bulan flat
    const bunga = price * rate * months;
    totalCost = price + bunga;
  }
  
  return totalCost / months;
}

function KreditKameraPage() {
  const {productsPromise} = useLoaderData();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const faqs = [
    {
      question: 'Leasing apa yang tersedia di Galaxy Camera?',
      answer:
        'Ada berbagai leasing cicilan tersedia mulai dari Homecredit, Kredivo, Indodana, Akulaku, AEON, ShopeePaylater dan Akulaku',
    },
    {
      question: 'Kamera atau produk apa saja yang bisa di cicil di Galaxy Camera?',
      answer:
        'Kamera, Drone, Lensa dan semua perlengkapan fotografi videografi bisa dicicil di Galaxy Camera',
    },
    {
      question: 'Apakah wajib ke toko?',
      answer:
        'Untuk cicilan beberapa leasing wajib ke toko seperti Homecredit, Indodana, AEON pengajuan wajib ke toko langsung. Sedangkan Kredivo, ShopeePaylater dan Akulaku jika sudah memiliki limit bisa langsung transaksi lewat Website.',
    },
    {
      question: 'Buat yang diluar Jabodetabek apakah bisa?',
      answer:
        'Bisa banget, kamu bisa coba pengajuan limit terlebih dahulu di salah satu Aplikasi cicilan seperti Kredivo, Akulaku atau Shopee ya, jika sudah ada limit bisa langsung transaksi di Website kami.',
    },
    {
      question: 'Prosesnya berapa lama?',
      answer:
        'Pengajuan cicilan tanpa kartu kredit biasanya hanya sekitar 15-30 menit saja.',
    },
    {
      question: 'Kalau mau split payment apakah bisa?',
      answer:
        'Bisa banget, jika kamu ingin sebagian cash dan sebagian di cicil menggunakan leasing bisa langsung di proses ditoko kami ya.',
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="kredit-kamera min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-10 md:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="container relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-4 tracking-tight">Kredit Kamera Tanpa Kartu Kredit</h1>
          <p className="text-sm sm:text-base md:text-lg text-blue-100 mb-5 md:mb-6">Miliki kamera impian Anda dengan cicilan mulai dari <span className="font-semibold">3 hingga 12 bulan</span></p>
          
          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-5 md:mt-8">
            <div className="bg-white/15 backdrop-blur-sm rounded-md sm:rounded-lg p-2.5 sm:p-3 md:p-4 border border-white/25">
              <div className="text-base sm:text-lg md:text-2xl font-bold mb-1">0%</div>
              <p className="text-[10px] sm:text-xs md:text-sm text-blue-100">Bunga cicilan 3 bulan</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-md sm:rounded-lg p-2.5 sm:p-3 md:p-4 border border-white/25">
              <div className="text-base sm:text-lg md:text-2xl font-bold mb-1">15 Menit</div>
              <p className="text-[10px] sm:text-xs md:text-sm text-blue-100">Proses Kilat</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-md sm:rounded-lg p-2.5 sm:p-3 md:p-4 border border-white/25">
              <div className="text-base sm:text-lg md:text-2xl font-bold mb-1">TANPA DP</div>
              <p className="text-[10px] sm:text-xs md:text-sm text-blue-100">Proses ± 15 menit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table Section */}
      <div className="container mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-4 py-16">
        <Suspense fallback={<LoadingState />}>
          <Await resolve={productsPromise}>
            {({products}) => (
              <div id="pdf-content">
                <div className="mb-12">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Pricelist Cicilan Kamera Tanpa Kartu Kredit</h2>
                    <p className="text-gray-600">Pilih kamera impian Anda dan cicil dengan harga yang terjangkau</p>
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
                  <table className="w-full text-sm">
                    {/* Table Header */}
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold">Produk</th>
                        <th className="px-4 py-3 text-center font-semibold">3 Bulan</th>
                        <th className="px-4 py-3 text-center font-semibold">6 Bulan</th>
                        <th className="px-4 py-3 text-center font-semibold">12 Bulan</th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-gray-200">
                      {products.nodes.map((product, index) => {
                        const price = parseFloat(product.variants.nodes[0]?.price?.amount || 0);
                        const image = product.variants.nodes[0]?.image;

                        return (
                          <tr
                            key={product.id}
                            className={`transition-colors hover:bg-blue-50 ${
                              index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                            }`}
                          >
                            {/* Product Column */}
                            <td className="px-4 py-3">
                              <Link 
                                to={`/products/${product.handle}`}
                                className="flex gap-3 items-center hover:no-underline group"
                              >
                                <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 group-hover:shadow-md transition-shadow">
                                  {image?.url && (
                                    <Image
                                      src={image.url}
                                      alt={product.title}
                                      width={64}
                                      height={64}
                                      crossOrigin="anonymous"
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 line-clamp-2 text-xs group-hover:text-blue-600 transition-colors">
                                    {product.title}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Rp {price.toLocaleString('id-ID', {maximumFractionDigits: 0})}
                                  </p>
                                </div>
                              </Link>
                            </td>

                            {/* 3 Months Column */}
                            <td className="px-4 py-3 text-center">
                              <div className="bg-green-50 rounded p-2 border border-green-200">
                                <p className="font-bold text-green-700 text-sm">
                                  Rp {calculateInstallment(price, 3).toLocaleString('id-ID', {
                                    maximumFractionDigits: 0,
                                  })}
                                </p>
                              </div>
                            </td>

                            {/* 6 Months Column */}
                            <td className="px-4 py-3 text-center">
                              <div className="bg-blue-50 rounded p-2 border border-blue-200">
                                <p className="font-bold text-blue-700 text-sm">
                                  Rp {calculateInstallment(price, 6).toLocaleString('id-ID', {
                                    maximumFractionDigits: 0,
                                  })}
                                </p>
                              </div>
                            </td>

                            {/* 12 Months Column */}
                            <td className="px-4 py-3 text-center">
                              <div className="bg-orange-50 rounded p-2 border border-orange-200">
                                <p className="font-bold text-orange-700 text-sm">
                                  Rp {calculateInstallment(price, 12).toLocaleString('id-ID', {
                                    maximumFractionDigits: 0,
                                  })}
                                </p>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Disclaimer */}
                <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center font-light">
                  * Harga dapat berubah sewaktu-waktu dan list cicilan merupakan estimasi
                </p>

                {/* Info Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-100 md:border-l-4 md:border-blue-600">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Bagaimana Cara Kerjanya?</h3>
                    <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                      <li className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1">1.</span>
                        <span>Pilih kamera dan tenor cicilan (3, 6, atau 12 bulan)</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1">2.</span>
                        <span>
                          Datang langsung ke toko Galaxy Camera terdekat, lihat{' '}
                          <Link to="/pages/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
                            alamat disini
                          </Link>
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1">3.</span>
                        <span>
                          Jika sudah ada limit Kredivo, bisa juga langsung transaksi lewat Website{' '}
                          <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold">
                            Galaxy.co.id
                          </Link>
                          , tinggal pilih metode pembayaran Kredivo
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-100 md:border-l-4 md:border-indigo-600">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Syarat & Ketentuan</h3>
                    <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                      <li className="flex gap-3">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span>Umur minimal 18 tahun dan maksimal 65 tahun (Bekerja / Wiraswasta)</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span>Cukup KTP saja, jika pilih leasing Kredivo dan Indodana perlu Npwp</span>
                      </li>

                    </ul>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl p-8 text-center text-white">
                  <h3 className="text-2xl font-bold mb-4">Tertarik untuk Mencicil?</h3>
                  <p className="mb-6 text-blue-100">Hubungi tim customer service kami untuk informasi lebih lanjut</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy,%20saya%20berminat%20cicilan%20tanpa%20kartu%20kredit,%20apakah%20bisa%20dibantu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                    >
                      Hubungi WhatsApp
                    </a>
                    <Link
                      to="/pages/contact"
                      className="inline-block bg-blue-700 text-white font-bold py-3 px-8 rounded-lg border border-blue-500 hover:bg-blue-800 transition-colors duration-200"
                    >
                      Alamat Toko
                    </Link>
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-16">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Pertanyaan yang Sering Diajukan</h2>
                    <p className="text-gray-600">Temukan jawaban untuk pertanyaan umum tentang cicilan kamera</p>
                  </div>

                  <div className="space-y-3">
                    {faqs.map((faq, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <button
                          onClick={() => toggleFaq(index)}
                          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-gray-50 transition-colors text-left"
                        >
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </h3>
                          <span
                            className={`text-2xl text-blue-600 flex-shrink-0 transition-transform duration-300 ${
                              openFaqIndex === index ? 'rotate-180' : ''
                            }`}
                          >
                            ▼
                          </span>
                        </button>

                        {openFaqIndex === index && (
                          <div className="px-5 sm:px-6 pb-5 sm:pb-6 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export default KreditKameraPage;

const GET_PRODUCTS_QUERY = `#graphql
  fragment ProductInfo on Product {
    id
    title
    handle
    variants(first: 1) {
      nodes {
        id
        price {
          amount
          currencyCode
        }
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
  
  query getProducts {
    kameraMirrorless: collection(handle: "kamera-mirrorless") {
      products(first: 10) {
        nodes {
          ...ProductInfo
        }
      }
    }
    kameraCompact: collection(handle: "kamera-compact") {
      products(first: 10) {
        nodes {
          ...ProductInfo
        }
      }
    }
    kameraAction: collection(handle: "kamera-action") {
      products(first: 10) {
        nodes {
          ...ProductInfo
        }
      }
    }
    kameraDrone: collection(handle: "kamera-drone") {
      products(first: 10) {
        nodes {
          ...ProductInfo
        }
      }
    }
    kameraPocket: collection(handle: "kamera-pocket") {
      products(first: 10) {
        nodes {
          ...ProductInfo
        }
      }
    }
  }
`;
