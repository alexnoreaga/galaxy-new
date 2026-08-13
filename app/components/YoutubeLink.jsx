import {useState} from 'react';
import {Link} from '@remix-run/react';

// Homepage brand-video section — click-to-load YouTube facade (same pattern as the product
// gallery video). The heavy YouTube player loads ONLY when someone presses play; until then
// it's just one thumbnail image, so it no longer drags the homepage down.

const VIDEO_ID = 'mjsEIuFEy0I';

export const YoutubeLink = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 content-center items-center my-6 sm:my-8">
      {/* Video — facade first, real iframe only after click */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-sm">
        {playing ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
            title="Video Galaxy Camera"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Putar video"
            className="group relative w-full h-full block"
          >
            <img
              src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
              onError={(e) => {
                // Not every video has a maxres thumb — fall back once to the always-available hq
                if (!e.currentTarget.dataset.fb) {
                  e.currentTarget.dataset.fb = '1';
                  e.currentTarget.src = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`;
                }
              }}
              alt="Video profil Galaxy Camera"
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
              <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600/95 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Copy */}
      <div>
        <h2 className="text-xl md:text-3xl font-bold tracking-tight text-gray-900 my-2 md:my-4">
          Toko Kamera Terlengkap di Tangerang dan Depok
        </h2>
        <p className="text-sm md:text-base my-2 text-gray-500">
          Harga termurah, pelayanan terbaik dan pengiriman ke seluruh Indonesia.
        </p>
        <Link
          to="/pages/tentang-kami"
          className="inline-flex items-center gap-1.5 mt-2 bg-gray-900 hover:bg-gray-800 text-sm md:text-base text-white px-5 py-2.5 rounded-xl no-underline transition-colors"
        >
          Tentang Kami
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
