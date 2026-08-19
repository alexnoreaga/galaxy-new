import {useState} from 'react';
import {Link} from '@remix-run/react';

// Homepage local-SEO text block. Collapsed to ~3 lines with a toggle (Focus Nusantara-style
// space saving) — the FULL text stays in the DOM, so Google indexes all of it. Internal links
// to collections are deliberate: they're half the SEO value of a block like this.

const linkCls = 'text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-red-600 transition-colors';

export const AboutSeo = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className='border-t mt-5 md:p-0 md:pt-4 mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl'>
      <h3 className='font-bold text-center mb-2 text-gray-600 text-sm sm:text-base'>
        Toko Kamera Tangerang Depok | Galaxy Camera Store
      </h3>

      <div className={`relative ${expanded ? '' : 'max-h-[4.75rem] overflow-hidden'}`}>
        <div className='text-sm text-gray-400 leading-relaxed space-y-2'>
          <p>
            <strong className='text-gray-500'>Galaxy Camera Store</strong> adalah toko kamera terpercaya sejak 2014,
            melayani Tangerang, Depok, Jabodetabek, hingga seluruh Indonesia. Toko fisik kami ada di Ruko Mall
            Metropolis Town Square Blok GM3 No. 6, Kelapa Indah (toko kamera Tangerang) dan Mall Depok Town Square
            Lantai 2 Blok SS2 No. 8, Beji (toko kamera Depok) — bisa COD dan cek barang langsung sebelum membeli.
          </p>
          <p>
            Kami menjual <Link to='/collections/kamera-mirrorless' className={linkCls}>kamera mirrorless</Link>, kamera
            DSLR, <Link to='/collections/kamera-pocket' className={linkCls}>kamera pocket</Link>,{' '}
            <Link to='/collections/kamera-action' className={linkCls}>action camera</Link>,{' '}
            <Link to='/collections/kamera-drone' className={linkCls}>drone</Link>,{' '}
            <Link to='/collections/kamera-instant' className={linkCls}>kamera instant / Instax</Link>,{' '}
            <Link to='/collections/kamera-gimbal' className={linkCls}>gimbal &amp; stabilizer</Link>,{' '}
            <Link to='/collections/kamera-webcam' className={linkCls}>webcam</Link>, hingga{' '}
            <Link to='/collections/kamera-cinema' className={linkCls}>kamera cinema</Link>, lensa, dan aksesoris
            fotografi–videografi lainnya — semuanya produk original bergaransi resmi Indonesia dengan harga murah.
            Brand yang tersedia antara lain Canon, Nikon, Sony, Fujifilm, DJI, Insta360, GoPro, Panasonic, dan Brica.
          </p>
          <p>
            Belanja di website resmi Galaxy lebih hemat: ada <Link to='/flash-sale' className={linkCls}>flash sale kamera</Link>{' '}
            rutin, voucher eksklusif, cicilan 0% dan kredit kamera tanpa kartu kredit (cukup KTP, proses ±30 menit),
            serta gratis ongkir ke seluruh Indonesia. Kami juga melayani{' '}
            <Link to='/pengadaan' className={linkCls}>pengadaan kamera untuk perusahaan &amp; instansi</Link>. Galaxy
            Camera juga hadir di Tokopedia, Shopee, Blibli, Lazada, TikTok Shop, Bukalapak, dan Akulaku — namun harga
            terbaik selalu ada di galaxy.co.id. Galaxy Camera, toko kamera terdekat dan tempat beli kamera termurah
            untuk fotografer dan konten kreator.
          </p>
        </div>
        {!expanded && (
          <div aria-hidden='true' className='absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none' />
        )}
      </div>

      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        className='mx-auto mt-1.5 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors'
      >
        {expanded ? 'Tutup' : 'Baca Selengkapnya'}
        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2.2} stroke='currentColor'
          className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
        </svg>
      </button>
    </div>
  );
};
