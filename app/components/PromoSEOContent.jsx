// Editorial SEO block for the two promo pages (flash sale, cuci gudang). The product list on those
// pages changes daily, so the copy is built from the LIVE data on each render (count, brands,
// price range, biggest discounts, end date) plus evergreen "cara kerja" + FAQ with FAQPage JSON-LD.
// Nothing here is generated offline, so it can never go stale or contradict the grid above it.
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const rp = (n) => `Rp${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;
const rpShort = (n) => { const v = Number(n) || 0; return v >= 1e6 ? `Rp${(v / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} juta` : `Rp${Math.round(v / 1e3)} ribu`; };
const dateLong = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

// Normalise both product shapes (flash-sale route nodes / collection ProductItem fragment)
function describe(p, flashMap) {
  const v = p?.variants?.nodes?.[0];
  const base = parseFloat(v?.price?.amount ?? p?.priceRange?.minVariantPrice?.amount ?? 0) || 0;
  const cap = parseFloat(v?.compareAtPrice?.amount ?? p?.compareAtPriceRange?.minVariantPrice?.amount ?? 0) || 0;
  const d = flashMap?.[p?.id];
  const flashPrice = p?.flashSale?.price ?? (d ? Math.max(0, d.type === 'amount' ? base - d.amount : Math.round(base * (1 - d.percentage / 100))) : null);
  const price = flashPrice != null && flashPrice < base ? flashPrice : base;
  const strike = Math.max(cap, flashPrice != null && flashPrice < base ? base : 0);
  const pct = strike > price && strike > 0 ? Math.round((1 - price / strike) * 100) : 0;
  const vendor = String(p?.vendor || '').trim() || String(p?.title || '').split(/\s+/)[0];
  return {title: p?.title || '', handle: p?.handle || '', vendor, price, strike, pct};
}

export function PromoSEOContent({kind = 'flash', products = [], flashMap = null, endsAt = null, more = false}) {
  const items = products.map((p) => describe(p, flashMap)).filter((x) => x.title && x.price > 0);
  if (items.length === 0) return null;
  const today = new Date();
  const month = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const count = `${items.length}${more ? '+' : ''}`; // paginated collection → first page only
  const brandCount = {};
  for (const it of items) if (it.vendor) brandCount[it.vendor] = (brandCount[it.vendor] || 0) + 1;
  const brands = Object.entries(brandCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([b]) => b);
  const prices = items.map((x) => x.price);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const maxPct = Math.max(0, ...items.map((x) => x.pct));
  const deals = [...items].filter((x) => x.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 3);
  const end = endsAt ? new Date(endsAt) : null;
  const isFlash = kind === 'flash';
  const label = isFlash ? 'Flash Sale' : 'Cuci Gudang';
  const heading = isFlash ? `Flash Sale Kamera ${month}: cara kerja, produk & pertanyaan umum` : `Cuci Gudang Kamera ${month}: apa artinya, produk & pertanyaan umum`;
  const brandText = brands.length ? ` dari ${brands.slice(0, -1).join(', ')}${brands.length > 1 ? ' dan ' : ''}${brands[brands.length - 1]}` : '';
  const dealText = deals.length ? ` Potongan terbesar saat ini: ${deals.map((d) => `${d.title} (${rp(d.price)}, hemat ${d.pct}%)`).join('; ')}.` : '';
  const p1 = isFlash
    ? `${label} Galaxy Camera ${month} berisi ${count} produk${brandText} dengan diskon hingga ${maxPct}% dan harga mulai ${rpShort(minP)} sampai ${rpShort(maxP)}.${dealText}`
    : `Halaman cuci gudang Galaxy Camera ${month} memuat ${count} produk${brandText} dengan harga mulai ${rpShort(minP)} sampai ${rpShort(maxP)}${maxPct ? `, hemat hingga ${maxPct}% dari harga normal` : ''}.${dealText} Ini stok akhir dan model yang kami habiskan, bukan barang bekas: semuanya unit baru, original, dengan garansi resmi distributor.`;
  const p2 = isFlash
    ? `Diskon flash sale dipotong otomatis di checkout tanpa kode kupon, jadi harga yang tertulis di kartu produk sudah harga akhirnya. Stok dan periode mengikuti data toko secara langsung${end ? `; batch ini dijadwalkan berakhir ${dateLong(end)} atau lebih cepat jika stok habis` : ' dan bisa berakhir sewaktu-waktu saat stok habis'}. Produk flash sale tetap unit baru dengan garansi resmi, bisa dicicil 0%, dan dikirim ke seluruh Indonesia atau diambil di cabang.`
    : `Harga cuci gudang adalah harga terbaik yang bisa kami berikan untuk produk tersebut, sehingga tidak ada lagi kode nego atau diskon tambahan di atasnya. Stoknya terbatas pada unit yang tersisa dan tidak akan diisi ulang; begitu habis, produk hilang dari halaman ini. Semua unit bisa dicicil 0%, dikirim ke seluruh Indonesia, atau diambil langsung di cabang Galaxy Camera.`;
  const faq = isFlash ? [
    {q: 'Apakah perlu kode kupon untuk harga flash sale?', a: 'Tidak. Diskon flash sale dipotong otomatis saat checkout di galaxy.co.id. Harga yang tampil di kartu produk sudah harga setelah diskon.'},
    {q: 'Sampai kapan flash sale ini berlangsung?', a: end ? `Batch yang sedang berjalan dijadwalkan berakhir ${dateLong(end)}, tetapi bisa berakhir lebih cepat jika stok produk habis. Halaman ini selalu menampilkan batch yang aktif.` : 'Setiap batch flash sale punya periode dan stok sendiri dan bisa berakhir sewaktu-waktu saat stok habis. Halaman ini selalu menampilkan batch yang sedang aktif.'},
    {q: 'Apakah produk flash sale bergaransi resmi?', a: 'Ya. Semua produk flash sale adalah unit baru dari distributor resmi dengan garansi resmi yang sama seperti harga normal.'},
    {q: 'Bisakah produk flash sale dicicil 0%?', a: 'Bisa. Cicilan 0% dengan kartu kredit bank partner maupun tanpa kartu kredit tetap berlaku untuk harga flash sale.'},
    {q: 'Bagaimana supaya tidak ketinggalan flash sale berikutnya?', a: 'Aktifkan notifikasi di galaxy.co.id atau pasang situs ke layar utama HP. Setiap batch flash sale baru diumumkan lewat notifikasi, dan tombol "Kabari kalau ada promo" di halaman produk memberi tahu Anda saat produk itu masuk promo.'},
  ] : [
    {q: 'Apa yang dimaksud produk cuci gudang di Galaxy Camera?', a: 'Produk cuci gudang adalah stok akhir dan model yang kami habiskan dengan harga di bawah harga normal. Semuanya unit baru dan original dengan garansi resmi distributor, bukan barang bekas atau rekondisi.'},
    {q: 'Apakah harga cuci gudang masih bisa dinego?', a: 'Tidak. Harga cuci gudang sudah harga terbaik untuk produk tersebut, jadi tidak ada kode nego atau diskon tambahan di atasnya.'},
    {q: 'Apakah produk cuci gudang bergaransi dan bisa diretur?', a: 'Ya, garansi resmi distributor tetap berlaku. Kebijakan 14 hari tukar baru untuk unit bermasalah juga berlaku sesuai ketentuan garansi.'},
    {q: 'Kenapa produk yang kemarin ada sekarang hilang dari halaman ini?', a: 'Stok cuci gudang terbatas pada unit yang tersisa dan tidak diisi ulang. Begitu terjual habis, produk otomatis hilang dari halaman ini.'},
    {q: 'Bisakah dicicil atau diambil di toko?', a: 'Bisa. Produk cuci gudang bisa dicicil 0%, dikirim ke seluruh Indonesia, atau diambil langsung di cabang Galaxy Camera.'},
  ];
  const faqLd = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({'@type': 'Question', name: f.q, acceptedAnswer: {'@type': 'Answer', text: f.a}}))};
  return (
    <section className="mt-10 mb-6 max-w-3xl">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{heading}</h2>
      <p className="text-xs text-gray-400 mb-3">Diperbarui {dateLong(today)} · angka di bawah mengikuti data toko saat ini</p>
      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3">{p1}</p>
      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-5">{p2}</p>
      {deals.length > 0 && (
        <ul className="mb-6 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {deals.map((d) => (
            <li key={d.handle} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <a href={`/products/${d.handle}`} className="min-w-0 truncate font-medium text-gray-900 no-underline hover:underline">{d.title}</a>
              <span className="shrink-0 text-right"><span className="font-bold text-red-600">{rp(d.price)}</span> <span className="text-xs text-gray-400 line-through">{rp(d.strike)}</span> <span className="ml-1 rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold text-white">-{d.pct}%</span></span>
            </li>
          ))}
        </ul>
      )}
      <h3 className="text-base font-bold text-gray-900 mb-2">Pertanyaan umum {label.toLowerCase()}</h3>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {faq.map((f) => (
          <details key={f.q} className="group px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 flex items-center justify-between gap-3">
              {f.q}
              <span className="text-gray-400 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(faqLd)}} />
    </section>
  );
}
