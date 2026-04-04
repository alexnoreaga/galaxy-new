import { useState, useEffect, useRef } from 'react';
import { useMatches } from '@remix-run/react';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseStore(node) {
  const f = {};
  node.fields.forEach(({ key, value }) => { f[key] = value; });
  return {
    id: node.id,
    handle: node.handle,
    name: f.name || '',
    address: f.address || '',
    latitude: parseFloat(f.latitude) || 0,
    longitude: parseFloat(f.longitude) || 0,
    mapsUrl: f.maps_url || '',
    phone: f.phone || '',
    hours: f.hours || '',
  };
}

export function NearestStoreBar() {
  const [root] = useMatches();
  const rawStores = root?.data?.storeLocations?.metaobjects?.edges?.map(e => parseStore(e.node)) || [];

  const [status, setStatus] = useState('idle'); // idle | loading | found | denied | error
  const [nearestStore, setNearestStore] = useState(null);
  const [sortedStores, setSortedStores] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!rawStores.length) return null;

  function handleActivate() {
    if (status === 'found') {
      setOpen(o => !o);
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const withDistance = rawStores.map(store => ({
          ...store,
          distance: haversine(latitude, longitude, store.latitude, store.longitude),
        })).sort((a, b) => a.distance - b.distance);

        setSortedStores(withDistance);
        setNearestStore(withDistance[0]);
        setStatus('found');
        setOpen(true);
      },
      () => {
        setStatus('denied');
      },
      { timeout: 10000 }
    );
  }

  function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  }

  return (
    <div className="relative w-full bg-white border-b border-gray-200" ref={dropdownRef}>
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={handleActivate}
          className="w-full flex items-center justify-center gap-2.5 py-2 group hover:bg-gray-50 transition-colors"
        >
          {/* Store / loading icon */}
          {status === 'loading' ? (
            <svg className="w-5 h-5 animate-spin text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <div className="flex-shrink-0 p-1 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"
                className="w-4 h-4 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016 2.993 2.993 0 002.25-1.016 3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
            </div>
          )}

          {/* Text */}
          <span className="text-sm font-semibold text-gray-800">
            {status === 'idle' && 'Aktifkan lokasimu untuk melihat toko terdekat'}
            {status === 'loading' && 'Mendeteksi lokasi...'}
            {status === 'found' && nearestStore && (
              <>
                Toko terdekat: <span className="text-gray-900 font-bold">{nearestStore.name}</span>
                <span className="text-gray-300 mx-1.5">·</span>
                <span className="font-normal text-gray-500">{formatDistance(nearestStore.distance)}</span>
              </>
            )}
            {status === 'denied' && (
              <>Izin lokasi ditolak — <a href="/stores" className="text-blue-600 underline hover:opacity-80">lihat semua toko</a></>
            )}
            {status === 'error' && 'Gagal mendeteksi lokasi'}
          </span>

          {/* Chevron when found */}
          {status === 'found' && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown */}
      {open && status === 'found' && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Toko Terdekat</p>
              <a href="/stores" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {sortedStores.map((store) => (
                <div key={store.id} className="flex items-center justify-between py-2.5 gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Distance bubble */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-sm font-bold text-blue-600 leading-none">{formatDistance(store.distance)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">dari sini</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{store.name}</p>
                      <p className="text-xs text-gray-500 truncate">{store.address}</p>
                      {store.hours && <p className="text-xs text-gray-400">{store.hours}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {store.phone && (
                      <a
                        href={`tel:${store.phone}`}
                        className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                        </svg>
                        {store.phone}
                      </a>
                    )}
                    {store.mapsUrl && (
                      <a
                        href={store.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.48-.966 2.342-1.76C15.29 15.13 17 12.556 17 9A7 7 0 103 9c0 3.556 1.71 6.132 3.287 7.582.860.793 1.72 1.375 2.342 1.76.311.193.571.337.757.433a5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                        </svg>
                        Lihat di Maps
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
