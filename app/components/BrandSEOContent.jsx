import React, { useState } from 'react';

export const BrandSEOContent = ({ brandName = 'Brand', category = 'Produk' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get current month and year
  const today = new Date();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonth = monthNames[today.getMonth()];
  const currentYear = today.getFullYear();

  return (
    <div className='mt-8 mb-6'>
      {/* Preview Section */}
      <div className='mb-3'>
        <h3 className='font-bold text-lg text-gray-900 mb-2'>Jual {category} {brandName} Terbaik {currentMonth} {currentYear} – 100% Original</h3>
        <p className='text-gray-700 leading-relaxed text-sm sm:text-base mb-3'>
          Di Galaxy Camera, semua {category} {brandName} yang Anda beli dijamin 100% original dan didapat langsung dari distributor resmi di Indonesia. Setiap produk telah melalui proses pengecekan kualitas untuk memastikan performa dan keamanan, sehingga Anda bisa berbelanja dengan tenang. Galaxy Camera menghadirkan pilihan {category} {brandName} yang lengkap dengan kualitas terjamin dan harga kompetitif untuk berbagai kebutuhan, mulai dari pemula hingga profesional.
        </p>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className='text-blue-600 hover:text-blue-800 font-semibold text-sm mb-3 flex items-center gap-1'
      >
        {isExpanded ? '▼' : '▶'} {isExpanded ? 'Sembunyikan' : 'Tampilkan'} Informasi Lengkap
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className='space-y-3 mb-3'>
          <div>
            <h3 className='font-bold text-lg text-gray-900 mb-2'>Harga {category} {brandName} Terbaru {currentMonth} {currentYear}</h3>
            <p className='text-gray-700 leading-relaxed text-sm sm:text-base'>
              Galaxy Camera menyediakan beragam jenis dan model {category} {brandName} terbaru {currentMonth} {currentYear} yang dapat disesuaikan dengan kebutuhan dan anggaran Anda. Produk dapat diurutkan berdasarkan harga maupun nama untuk memudahkan pencarian. Tersedia juga fitur penyaringan harga agar Anda bisa menemukan {category} {brandName} dengan harga terbaik dan bersaing di pasaran Indonesia.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-lg text-gray-900 mb-2'>Beli {category} {brandName} Online di Galaxy Camera</h3>
            <p className='text-gray-700 leading-relaxed text-sm sm:text-base'>
              Tanpa perlu keluar rumah, Anda dapat memesan dan membeli {category} {brandName} terbaru {currentMonth} {currentYear} secara online di Galaxy Camera. Pesanan akan diproses dengan cepat dan dikirim secara aman ke seluruh Indonesia. Nikmati berbagai promo menarik, potongan harga khusus, serta kemudahan metode pembayaran, termasuk cicilan 0% untuk tenor tertentu. Dapatkan {category} {brandName} original dan berkualitas hanya di Galaxy Camera.
            </p>
          </div>

          <div>
            <h3 className='font-bold text-lg text-gray-900 mb-2'>Jaminan Garansi Resmi, Purna Jual, dan Service Center</h3>
            <p className='text-gray-700 leading-relaxed text-sm sm:text-base'>
              Semua {category} {brandName} yang dijual di Galaxy Camera adalah bergaransi resmi dan dari distributor resmi Indonesia. Selain menjamin harga terbaik produk sesuai dengan harga di pasaran, kualitasnya juga terjamin. Untuk klaim garansi produk bisa mengikuti petunjuk yang tersedia pada box produk atau bisa juga dititip ke store kami Galaxy Camera.
            </p>
          </div>
        </div>
      )}

      {/* Schema.org Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": `Jual ${category} ${brandName} Terbaik ${currentMonth} ${currentYear} – 100% Original`,
        "description": `Di Galaxy Camera, semua ${category} ${brandName} yang Anda beli dijamin 100% original dan didapat langsung dari distributor resmi di Indonesia.`,
        "image": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png",
        "datePublished": today.toISOString().split('T')[0],
        "dateModified": today.toISOString().split('T')[0],
        "author": {
          "@type": "Organization",
          "name": "Galaxy Camera"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Galaxy Camera",
          "logo": {
            "@type": "ImageObject",
            "url": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png"
          }
        }
      })}} />
    </div>
  );
};
