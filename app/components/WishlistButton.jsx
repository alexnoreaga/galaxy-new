import {useState, useEffect} from 'react';
import {Link} from '@remix-run/react';

export const WISHLIST_EVENT = 'gx:wishlist'; // detail = item count; header badges listen to it
export function readWishlistCount() {
  try { return JSON.parse(localStorage.getItem('wishlist') || '[]').length; } catch { return 0; }
}
// Anonymous per-product tally for the dashboard ("Paling banyak di wishlist"). Same session id the
// chat uses, so one visitor adding/removing repeatedly nets out to one.
function trackWishlist(type, handle, title) {
  try {
    let sid = localStorage.getItem('galaxy_session_id');
    if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('galaxy_session_id', sid); }
    fetch('/api/chat-event', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type, handle, sessionId: sid, meta: String(title || '').slice(0, 120)}),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function WishlistButton({handle, title, image, price, customerEmail, variant = 'pill'}) {
  const [isWished, setIsWished] = useState(false);
  const [toast, setToast] = useState(false); // "Disimpan · Lihat wishlist" after adding

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsWished(list.some((i) => i.handle === handle));
  }, [handle]);

  async function toggle() {
    const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const exists = list.some((i) => i.handle === handle);
    const item = {handle, title, image, price, addedAt: new Date().toISOString()};
    const next = exists ? list.filter((i) => i.handle !== handle) : [...list, item];
    localStorage.setItem('wishlist', JSON.stringify(next));
    setIsWished(!exists);
    try { window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, {detail: next.length})); } catch {}
    trackWishlist(exists ? 'wishlist_removed' : 'wishlist_added', handle, title);
    if (!exists) { setToast(true); setTimeout(() => setToast(false), 3000); }

    if (customerEmail) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: exists ? 'remove' : 'add',
          email: customerEmail,
          item,
        }),
      }).catch(() => {});
    }
  }

  return (
    <>
    <button
      onClick={toggle}
      title={isWished ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
      aria-label={isWished ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
      className={variant === 'plain'
        ? `w-8 h-8 -mr-1.5 flex items-center justify-center rounded-full transition-all active:scale-95 ${isWished ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`
        : `w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95 ${
        isWished
          ? 'bg-rose-100 text-rose-500'
          : 'bg-gray-100 text-gray-400 hover:text-rose-400 hover:bg-rose-50'
      }`}
    >
      {isWished ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={variant === 'plain' ? 'w-5 h-5' : 'w-4 h-4'}>
          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.184C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={variant === 'plain' ? 'w-5 h-5' : 'w-4 h-4'}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      )}
    </button>
    {toast && (
      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-8 z-[70] flex items-center gap-3 rounded-full bg-gray-900 text-white text-xs pl-4 pr-2 py-2 shadow-xl">
        <span>Disimpan ke wishlist</span>
        <Link to="/account/wishlist" className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 font-semibold">Lihat</Link>
      </div>
    )}
    </>
  );
}
