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
    <div ref={stripRef} className="my-3 sm:my-5">
      <div className="grid grid-cols-4">
        {displays.map((item, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center py-2 sm:py-3 px-1 sm:px-3 text-center
              ${i > 0 ? 'border-l border-gray-200' : ''}
            `}
          >
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm sm:text-2xl font-black text-gray-900 tabular-nums leading-none tracking-tight">
                {item.num}
              </span>
              {item.suffix && (
                <span className="text-[9px] sm:text-sm font-bold text-gray-400 ml-0.5">{item.suffix}</span>
              )}
            </div>
            <span className="text-[9px] sm:text-xs text-gray-500 font-medium mt-1 leading-tight">
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
