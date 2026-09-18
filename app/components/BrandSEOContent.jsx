import React from 'react';

export const BrandSEOContent = ({ brandName = 'Brand', category = 'Produk', products = [], seo = null }) => {
  const today = new Date();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentMonth = monthNames[today.getMonth()];
  const currentYear = today.getFullYear();
  const productList = products.slice(0, 5).map((p) => p.title).join(', ');
  const intro = seo?.intro ? String(seo.intro).split('\n').map((s) => s.trim()).filter(Boolean) : [];
  const faq = Array.isArray(seo?.faq) ? seo.faq : [];
  const updated = seo?.updatedAt ? new Date(seo.updatedAt) : null;
  const fmtDate = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const headline = `${category} ${brandName}: pilihan, harga & rekomendasi ${currentMonth} ${currentYear}`;

  return (
    <div className="mt-8 mb-6">
      {/* Editorial intro — per-page copy when the enrichment batch has run, template otherwise */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{headline}</h2>
      {updated && <p className="text-xs text-gray-400 mb-3">Diperbarui {fmtDate(updated)} · harga &amp; stok mengikuti data toko saat ini</p>}
      {intro.length > 0 ? (
        intro.map((para, i) => <p key={i} className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3">{para}</p>)
      ) : (
        <>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3">
            Galaxy Camera menjual {category} {brandName} original dari distributor resmi Indonesia, di antaranya {productList}. Harga di halaman ini mengikuti data toko saat ini.
          </p>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3">
            Semua unit bergaransi resmi, bisa dicicil 0% dengan atau tanpa kartu kredit, dan dikirim ke seluruh Indonesia. Untuk konsultasi model yang cocok, tim kami siap membantu lewat WhatsApp atau langsung di toko Tangerang dan Depok.
          </p>
        </>
      )}

      {/* Price table — always server-rendered (used to be hidden behind a click, invisible to crawlers) */}
      {products.length > 0 && (
        <div className="mt-5">
          <h3 className="font-bold text-base text-gray-900 mb-2">Harga {category} {brandName} {currentMonth} {currentYear}</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="px-3 py-2 font-semibold">Produk</th>
                  <th className="px-3 py-2 font-semibold text-right">Harga</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 10).map((product) => (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-800">
                      <a href={`/products/${product.handle}`} className="no-underline text-gray-800 hover:text-black">{product.title}</a>
                      {product.availableForSale === false && <span className="ml-2 text-[11px] text-gray-400">stok habis</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
                      Rp{parseFloat(product.priceRange?.minVariantPrice?.amount || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ — page-specific, mirrored in FAQPage JSON-LD below */}
      {faq.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-base text-gray-900 mb-2">Pertanyaan yang sering diajukan</h3>
          <div className="divide-y divide-gray-100 border-y border-gray-100">
            {faq.map((x, i) => (
              <details key={i} className="group py-2.5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-gray-900">
                  {x.q}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </summary>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed m-0">{x.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-sm text-gray-600 leading-relaxed">
        Garansi resmi, layanan purna jual, dan service center tersedia untuk semua {category} {brandName} yang dibeli di Galaxy Camera. Hubungi admin di 0821-1131-1131 untuk stok fisik dan penawaran terbaik.
      </p>

      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline,
          description: (seo?.summary || `${category} ${brandName} original dari distributor resmi Indonesia dengan garansi resmi dan harga terbaru.`).slice(0, 160),
          image: products[0]?.featuredImage?.url || 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
          datePublished: seo?.updatedAt || today.toISOString().split('T')[0],
          dateModified: seo?.updatedAt || today.toISOString().split('T')[0],
          author: { '@type': 'Organization', name: 'Galaxy Camera' },
          publisher: { '@type': 'Organization', name: 'Galaxy Camera', logo: { '@type': 'ImageObject', url: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png' } },
        },
        ...(faq.length ? [{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
        }] : []),
      ]) }} />
    </div>
  );
};
