import {Link} from '@remix-run/react';

const links = [
  {to: '/pages/tentang-kami', label: 'Tentang Kami'},
  {to: '/pages/contact', label: 'Store Location'},
  {to: '/blogs', label: 'Blog & Artikel'},
  {to: '/pengadaan', label: 'Pengadaan Instansi'},
  {to: '/perbandingan', label: 'Bandingkan Produk'},
  {to: '/rekomendasi', label: 'Rekomendasi Produk'},
];

export const FooterColumn2 = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* Heading — matches FooterHeading in Footer.jsx (tracked caps + red accent bar) */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-200 m-0">Galaxy.co.id</h3>
        <span className="block w-6 h-0.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 mt-1.5" />
      </div>
      <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
        {links.map(({to, label}) => (
          <li key={to} className="m-0">
            <Link
              to={to}
              className="inline-block text-gray-400 hover:text-white hover:translate-x-0.5 text-sm transition-all duration-200 no-underline"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
