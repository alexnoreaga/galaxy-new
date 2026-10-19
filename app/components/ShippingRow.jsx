import {useState} from 'react';
import {Link} from '@remix-run/react';

// Shipping row on the product page (Tokopedia-style "Pengiriman" line). Replaces the red
// FREE ONGKIR sticker that used to sit on the hero photo. One accent (red truck), type does the
// work, no tints. `free` = product qualifies for free shipping (price ≥ Rp3 jt, seluruh Indonesia).
// The chevron opens the rules; they mirror the lines in Grisela's prompt so site and AI agree.
export function ShippingRow({free, compact = false, className = ''}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${compact ? '' : 'border-t border-b border-gray-100'} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full flex items-start gap-2.5 text-left ${compact ? 'py-1' : 'py-2.5'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
        <span className="flex-1 min-w-0">
          <span className={`block ${compact ? 'text-xs' : 'text-[13px] md:text-sm'} font-semibold text-gray-900 leading-snug`}>
            {free ? 'Gratis Ongkir' : 'Ongkir dihitung di checkout'}
            <span className="font-normal text-gray-500"> · Pengiriman reguler</span>
          </span>
          <span className={`block ${compact ? 'text-[11px]' : 'text-[11px] md:text-xs'} text-gray-500 mt-0.5 leading-snug`}>
            Dikirim dari Tangerang · Jabodetabek tiba hari ini–besok, luar kota 1–3 hari
          </span>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true">
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <ul className={`${compact ? 'text-[11px]' : 'text-[12px] md:text-[13px]'} text-gray-600 space-y-1 pb-3 pl-[1.9rem] pr-1 leading-snug list-disc marker:text-gray-300`}>
          <li>
            {free
              ? 'Gratis ongkir reguler ke seluruh Indonesia untuk produk Rp3 juta ke atas — termasuk produk ini.'
              : 'Gratis ongkir reguler ke seluruh Indonesia berlaku untuk produk Rp3 juta ke atas. Untuk produk ini ongkir tampil di checkout sesuai alamat.'}
          </li>
          <li>Order sebelum 17.00 WIB dikirim hari yang sama. Jabodetabek bisa pakai kurir instan, tiba hari ini.</li>
          <li>Luar kota 1–3 hari kerja tergantung ekspedisi. Nomor resi dikirim otomatis lewat email.</li>
          <li>
            Bisa ambil langsung di toko{' '}
            <Link to="/stores" prefetch="intent" className="font-semibold text-gray-900 underline underline-offset-2">Tangerang atau Depok</Link>.
          </li>
        </ul>
      )}
    </div>
  );
}
