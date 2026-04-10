import {FaWhatsapp, FaEnvelope, FaLocationDot} from 'react-icons/fa6';

export const FooterColumn1 = () => {
  return (
    <div className="flex flex-col gap-4">
      <img
        height={40}
        width={120}
        src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-final-bw.webp?v=1707024717"
        alt="Logo Galaxy Camera"
        loading="lazy"
        className="object-contain"
      />

      <div className="max-w-xs">
        <p className="text-white text-sm font-bold mb-1">PT. Galaxy Digital Niaga</p>
        <p className="text-gray-400 text-sm leading-relaxed">
          Toko kamera online terlengkap dan bergaransi resmi. Cicilan 0%, gratis ongkir ke seluruh Indonesia.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex gap-2.5 text-gray-400 text-sm">
          <FaLocationDot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
          <span><span className="text-gray-300 font-medium">Tangerang:</span> Ruko Mall Metropolis Town Square, Blok GM3 No.6, Kelapa Indah</span>
        </div>
        <div className="flex gap-2.5 text-gray-400 text-sm">
          <FaLocationDot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
          <span><span className="text-gray-300 font-medium">Depok:</span> Mall Depok Town Square, Lantai 2 Blok SS2 No.8, Beji</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <a
          href="https://api.whatsapp.com/send?phone=6282111311131&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors no-underline group"
        >
          <FaWhatsapp className="w-4 h-4 text-green-500" />
          <span className="text-sm group-hover:text-white">0821-1131-1131</span>
        </a>
        <div className="flex items-center gap-2 text-gray-400">
          <FaEnvelope className="w-4 h-4 text-gray-500" />
          <span className="text-sm">sales@galaxy.co.id</span>
        </div>
      </div>
    </div>
  );
};
