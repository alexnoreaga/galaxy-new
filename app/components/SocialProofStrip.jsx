import { useState, useEffect, useRef } from 'react';

function useCountUp(target, duration, started) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return count;
}

export function SocialProofStrip() {
  const [started, setStarted] = useState(false);
  const stripRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (stripRef.current) observer.observe(stripRef.current);
    return () => observer.disconnect();
  }, []);

  const soldCount = useCountUp(60000, 2200, started);
  const yearsCount = useCountUp(10, 1600, started);

  const soldDisplay = soldCount >= 1000
    ? `${Math.floor(soldCount / 1000)}.${String(soldCount % 1000).padStart(3, '0')}`
    : String(soldCount);

  const displays = [
    { num: soldDisplay, suffix: '+', label: 'Produk Terjual', short: 'Terjual' },
    { num: '4.9', suffix: '/5 ⭐', label: 'Rating Pelanggan', short: 'Rating' },
    { num: yearsCount, suffix: '+', label: 'Tahun Berpengalaman', short: 'Tahun' },
    { num: 'Gratis', suffix: '', label: 'Ongkir se-Indonesia', short: 'Ongkir' },
  ];

  return (
    <div
      ref={stripRef}
      className="relative overflow-hidden rounded-xl my-3 sm:my-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
    >
      {/* Shimmer lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />

      {/* Glow orbs */}
      <div className="absolute -top-8 left-1/4 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 right-1/4 w-32 h-32 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-4">
        {displays.map((item, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center py-2 sm:py-3.5 px-1 sm:px-3 text-center
              ${i > 0 ? 'border-l border-white/10' : ''}
            `}
          >
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm sm:text-2xl font-black text-amber-400 tabular-nums leading-none tracking-tight">
                {item.num}
              </span>
              {item.suffix && (
                <span className="text-[9px] sm:text-sm font-bold text-amber-300/80 ml-0.5">{item.suffix}</span>
              )}
            </div>
            <span className="text-[9px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-tight">
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
