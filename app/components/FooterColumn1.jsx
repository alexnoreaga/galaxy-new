import {FaWhatsapp, FaEnvelope, FaLocationDot} from 'react-icons/fa6';

export const FooterColumn1 = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* Current logo, white-filtered — same treatment as the masthead (old logo-final-bw retired) */}
      <img
        height={40}
        width={140}
        src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png?v=1731132105"
        alt="Logo Galaxy Camera"
        loading="lazy"
        className="object-contain h-9 w-auto self-start brightness-0 invert"
      />

      <div className="max-w-xs">
        <p className="text-white text-sm font-bold mb-1">PT. Galaxy Digital Niaga</p>
        <p className="text-gray-400 text-sm leading-relaxed">
          Toko kamera online terlengkap dan bergaransi resmi. Cicilan 0%, gratis ongkir ke seluruh Indonesia.
        </p>
      </div>

      {/* Stores — frosted icon tiles with a gold accent (echoes the ornament) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-3 text-gray-400 text-sm">
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
            <FaLocationDot className="w-3 h-3 text-amber-400/80" />
          </span>
          <span className="pt-0.5"><span className="text-gray-200 font-semibold">Tangerang:</span> Ruko Mall Metropolis Town Square, Blok GM3 No.6, Kelapa Indah</span>
        </div>
        <div className="flex gap-3 text-gray-400 text-sm">
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
            <FaLocationDot className="w-3 h-3 text-amber-400/80" />
          </span>
          <span className="pt-0.5"><span className="text-gray-200 font-semibold">Depok:</span> Mall Depok Town Square, Lantai 2 Blok SS2 No.8, Beji</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <a
          href="https://api.whatsapp.com/send?phone=6282111311131&text=Hi%20admin%20Galaxy.co.id%20saya%20berminat%20produk"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors no-underline group"
        >
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <FaWhatsapp className="w-3.5 h-3.5 text-emerald-500" />
          </span>
          <span className="text-sm font-medium">0821-1131-1131</span>
        </a>
        <a
          href="mailto:sales@galaxy.co.id"
          className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors no-underline group"
        >
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <FaEnvelope className="w-3.5 h-3.5 text-gray-400" />
          </span>
          <span className="text-sm">sales@galaxy.co.id</span>
        </a>
      </div>
    </div>
  );
};
