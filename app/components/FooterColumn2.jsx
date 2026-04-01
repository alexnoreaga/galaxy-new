import {Link} from '@remix-run/react';

const links = [
  {to: '/pages/tentang-kami', label: 'Tentang Kami'},
  {to: '/pages/contact', label: 'Store Location'},
  {to: '/blogs', label: 'Blog & Artikel'},
  {to: '/pengadaan', label: 'Pengadaan Instansi'},
];

export const FooterColumn2 = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-white text-sm font-semibold uppercase tracking-wider">Galaxy.co.id</h3>
      <ul className="flex flex-col gap-2">
        {links.map(({to, label}) => (
          <li key={to}>
            <Link
              to={to}
              className="text-gray-400 hover:text-white text-sm transition-colors no-underline"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
