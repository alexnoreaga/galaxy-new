import {useState, useEffect} from 'react';
import {Link, useOutletContext} from '@remix-run/react';

export default function AccountWishlist() {
  const {customer} = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = customer?.email;
    if (!email) {
      // guest fallback — read localStorage
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setItems(saved);
      setLoading(false);
      return;
    }

    // merge any localStorage items first, then fetch
    const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const doFetch = () =>
      fetch(`/api/wishlist?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((d) => {
          setItems(d.items || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));

    if (saved.length > 0) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'merge', email, items: saved}),
      })
        .catch(() => {})
        .finally(doFetch);
    } else {
      doFetch();
    }
  }, [customer?.email]);

  async function remove(handle) {
    // remove from localStorage
    const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
    localStorage.setItem(
      'wishlist',
      JSON.stringify(saved.filter((i) => i.handle !== handle)),
    );
    setItems((prev) => prev.filter((i) => i.handle !== handle));

    if (customer?.email) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'remove',
          email: customer.email,
          item: {handle},
        }),
      }).catch(() => {});
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-500">
            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.184C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Wishlist Saya</h2>
          {!loading && (
            <p className="text-xs text-gray-400">{items.length} produk tersimpan</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                <div className="h-3 bg-gray-100 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-12 h-12 text-gray-200 mx-auto mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <p className="text-sm text-gray-400 font-medium">Belum ada produk di wishlist</p>
          <p className="text-xs text-gray-300 mt-1">Klik ikon hati pada produk untuk menyimpannya</p>
          <Link
            to="/collections"
            className="inline-block mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors"
          >
            Lihat Produk
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.handle} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
              {/* Image */}
              <Link to={`/products/${item.handle}`} className="flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain rounded-lg bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-6 h-6 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.handle}`} className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-rose-600 transition-colors leading-snug">
                  {item.title}
                </Link>
                {item.price && (
                  <p className="text-xs text-rose-600 font-bold mt-1">
                    Rp{Number(parseFloat(item.price)).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <Link
                  to={`/products/${item.handle}`}
                  className="px-3 py-1.5 bg-gray-900 text-white text-[11px] font-semibold rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
                >
                  Lihat
                </Link>
                <button
                  onClick={() => remove(item.handle)}
                  className="text-[10px] text-gray-400 hover:text-rose-500 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
