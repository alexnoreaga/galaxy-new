import { useState } from 'react';

export const CollectionSEOContent = ({ collectionTitle, products = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const today = new Date();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonth = monthNames[today.getMonth()];
  const currentYear = today.getFullYear();

  // Generate product list (first 5 products, comma-separated)
  const productList = products
    .slice(0, 5)
    .map(p => p.title)
    .join(', ');

  const introText = `Galaxy Camera jual ${collectionTitle} dengan banyak pilihan jenisnya. ${collectionTitle} ${productList} kami jual dengan harga terbaik di sini. Anda bisa cek harga ${collectionTitle} disini karena harga kamera yang ada di website kami selalu update.`;

  const previewText = `Galaxy Camera adalah toko kamera dan perlengkapan fotografi terpercaya di Indonesia yang menyediakan berbagai jenis, tipe, dan merek ${collectionTitle} untuk kebutuhan profesional, content creator, instansi, hingga UMKM. Kami menghadirkan produk ${collectionTitle} dengan spesifikasi terbaik, kondisi terjamin, dan harga kompetitif.`;

  const buildExpandedContent = () => {
    return `
    <p class="text-gray-700 mb-4 leading-relaxed">
      Setiap produk yang dikirim telah melalui proses pengecekan ketat untuk memastikan keamanan selama pengiriman serta kualitas produk tetap terjaga hingga sampai ke tangan pelanggan.
    </p>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Bergabunglah sebagai member Galaxy Camera untuk mendapatkan berbagai promo menarik setiap hari, penawaran eksklusif, serta kemudahan transaksi. Nikmati pilihan pembayaran lengkap, termasuk cicilan 0% dari bank rekanan, cicilan tanpa kartu kredit, hingga metode pembayaran fleksibel lainnya.
    </p>
    
    <h3 class="text-xl font-bold text-gray-900 mb-3 mt-6">Harga ${collectionTitle} Terbaru &amp; Kompetitif ${currentMonth} ${currentYear}</h3>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Di Galaxy Camera, Anda bisa mendapatkan produk ${collectionTitle} dengan harga resmi yang berlaku di Indonesia. Kami juga menyediakan beberapa produk dengan harga spesial, harga reseller, dan penawaran bundle yang lebih hemat dibandingkan toko online maupun offline lainnya.
    </p>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Manfaatkan promo musiman, diskon khusus member, serta voucher untuk mendapatkan harga terbaik. Galaxy Camera juga menyediakan layanan pengiriman cepat dan aman ke seluruh Indonesia.
    </p>
    
    <h3 class="text-xl font-bold text-gray-900 mb-3 mt-6">Melayani Pengadaan ${collectionTitle} untuk Instansi &amp; Perusahaan</h3>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Galaxy Camera berpengalaman melayani pembelian ${collectionTitle} dalam jumlah besar untuk kebutuhan pengadaan instansi pemerintah maupun swasta. Kami siap membantu proses pengadaan untuk:
    </p>
    
    <ul class="list-disc list-inside text-gray-700 mb-4 space-y-2">
      <li>Instansi Pemerintah</li>
      <li>Sekolah &amp; Universitas</li>
      <li>Perusahaan &amp; Korporasi</li>
      <li>Organisasi &amp; Komunitas</li>
      <li>UMKM</li>
    </ul>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Tim sales kami siap memberikan solusi pengadaan yang cepat, transparan, dan sesuai kebutuhan, termasuk penyesuaian spesifikasi produk dan dukungan administrasi.
    </p>
    
    <h3 class="text-xl font-bold text-gray-900 mb-3 mt-6">Produk Original, Garansi Resmi &amp; Layanan Purna Jual</h3>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Semua produk ${collectionTitle} di Galaxy Camera merupakan 100% produk asli yang didapat langsung dari distributor dan supplier resmi. Setiap pembelian dilengkapi dengan garansi resmi, sehingga kualitas dan keamanannya lebih terjamin.
    </p>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Kami juga menyediakan layanan purna jual untuk membantu klaim garansi dan konsultasi produk sesuai ketentuan masing-masing merek.
    </p>
    
    <h3 class="text-xl font-bold text-gray-900 mb-3 mt-6">Cara Beli ${collectionTitle} di Galaxy Camera</h3>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Produk ${collectionTitle} dapat dibeli langsung secara online dengan mudah:
    </p>
    
    <ol class="list-decimal list-inside text-gray-700 mb-4 space-y-2">
      <li>Pilih produk ${collectionTitle} sesuai kebutuhan</li>
      <li>Pastikan spesifikasi sudah sesuai</li>
      <li>Tentukan jumlah pembelian</li>
      <li>Pilih metode pembayaran</li>
      <li>Selesaikan transaksi</li>
    </ol>
    
    <p class="text-gray-700 mb-4 leading-relaxed">
      Pesanan Anda akan segera kami proses dan kirim dengan aman ke alamat tujuan.
    </p>
    
    <p class="text-gray-700 leading-relaxed">
      Jika produk ${collectionTitle} yang Anda cari belum tersedia atau membutuhkan konsultasi sebelum membeli, silakan hubungi tim Galaxy Camera melalui Customer Service atau Sales kami.
    </p>
    `;
  };

  return (
    <div className="mt-12 mb-8">
      {/* Schema.org Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `Jual ${collectionTitle} Terbaik ${currentMonth} ${currentYear}`,
          "description": previewText,
          "dateModified": new Date().toISOString().split('T')[0],
          "datePublished": new Date().toISOString().split('T')[0],
          "author": {
            "@type": "Organization",
            "name": "Galaxy Camera"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Galaxy Camera",
            "logo": {
              "@type": "ImageObject",
              "url": "https://galaxy.co.id/logo.png"
            }
          }
        })}
      </script>

      {/* Heading - Always visible */}
      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3">
        Jual {collectionTitle} Terbaik {currentMonth} {currentYear}
      </h2>

      {/* Intro Text with Product List - Always visible */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {introText}
        </p>
      </div>

      {/* Preview Text with Fade Effect - Always visible */}
      <div className="relative mb-3 overflow-hidden">
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
          {previewText}
        </p>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* Expandable Content */}
      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-none' : 'max-h-0'}`}>
        <div 
          className="text-sm text-gray-600 opacity-75 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: buildExpandedContent() }}
        />
      </div>

      {/* Read More Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Sembunyikan konten SEO' : 'Baca konten SEO selengkapnya'}
      >
        <span>{isExpanded ? 'Sembunyikan' : 'Baca Selengkapnya'}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2} 
          stroke="currentColor" 
          className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Hidden content for SEO - all text visible in DOM for search engines */}
      <div className="hidden" role="doc-noteref">
        <h3>Informasi Lengkap tentang {collectionTitle}</h3>
        <p>{previewText}</p>
        <div dangerouslySetInnerHTML={{ __html: buildExpandedContent() }} />
      </div>
    </div>
  );
};
