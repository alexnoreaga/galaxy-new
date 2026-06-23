import { useState } from 'react';

const FAQS = [
  {
    q: 'Apakah semua produk bergaransi resmi?',
    a: 'Ya, semua produk yang kami jual bergaransi resmi dari distributor atau importir resmi di Indonesia. Garansi mencakup kerusakan pabrik sesuai ketentuan masing-masing merek.',
  },
  {
    q: 'Bisa cicilan berapa lama dan tanpa kartu kredit?',
    a: 'Tersedia cicilan 3, 6, dan 12 bulan tanpa kartu kredit melalui Kredivo, Homecredit, Akulaku, dan Indodana. Proses persetujuan sekitar 15 menit. Juga tersedia cicilan 0% via kartu kredit semua bank.',
  },
  {
    q: 'Apakah bisa kirim ke luar kota / luar Jawa?',
    a: 'Bisa. Kami melayani pengiriman ke seluruh Indonesia melalui JNE, J&T, SiCepat, dan Anteraja. Barang dikemas dengan aman menggunakan bubble wrap dan kardus double layer.',
  },
  {
    q: 'Bagaimana cara order dan pembayaran?',
    a: 'Bisa order langsung melalui website ini (Add to Cart), atau chat ke WhatsApp kami untuk konsultasi terlebih dahulu. Tersedia pembayaran transfer bank, QRIS, kartu kredit, dan cicilan.',
  },
  {
    q: 'Berapa lama proses pengiriman?',
    a: 'Pesanan yang masuk sebelum jam 15.00 WIB akan diproses di hari yang sama. Estimasi pengiriman 1–3 hari kerja untuk Jawa, 3–7 hari untuk luar Jawa tergantung jasa pengiriman.',
  },
];

export function MiniFaq() {
  const [open, setOpen] = useState(null);

  return (
    <section className="px-2 sm:px-0 py-6 sm:py-8">
      {/* Schema.org FAQ markup for Google rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {'@type': 'Answer', text: f.a},
            })),
          }),
        }}
      />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-3a1 1 0 0 0-.867.5 1 1 0 1 1-1.731-1A3 3 0 0 1 13 8a3.001 3.001 0 0 1-2 2.83V11a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1 1 1 0 1 0 0-2Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900">Pertanyaan Umum</h2>
      </div>

      <div className="flex flex-col gap-2">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`bg-white border rounded-xl overflow-hidden transition-shadow duration-200 ${isOpen ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className={`text-sm font-semibold leading-snug ${isOpen ? 'text-blue-700' : 'text-gray-800'}`}>
                  {faq.q}
                </span>
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-500'}`}
                  >
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
