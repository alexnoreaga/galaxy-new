import { useEffect, useState } from 'react';

// "Kabari kalau ready" (out of stock) / "Kabari kalau turun harga" (in stock) — one tap subscribes
// this browser's push token to the product (stock_alerts). Fully automatic afterwards: Shopify
// webhook → harga-produk /api/stock-notify → push → subscription removed.
const keyFor = (handle, kind) => `gx_alert_${kind}_${handle}`;

export function StockAlertButton({ handle, title, inStock, price }) {
  const kind = inStock ? 'price' : 'restock';
  const [state, setState] = useState('idle'); // idle | busy | done | unsupported | denied | error
  useEffect(() => {
    try {
      if (localStorage.getItem(keyFor(handle, kind))) setState('done');
      else if (!('Notification' in window) || !('PushManager' in window)) setState('unsupported');
      else if (Notification.permission === 'denied') setState('denied');
      else setState('idle');
    } catch (_) {}
  }, [handle, kind]);

  const subscribe = async (token) => {
    const r = await fetch('/api/stock-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, title, kind, price: Number(price) || 0, token }),
    });
    if (!r.ok) throw new Error('save failed');
    try { localStorage.setItem(keyFor(handle, kind), String(Date.now())); } catch (_) {}
    setState('done');
  };

  const onClick = () => {
    if (state !== 'idle') return;
    setState('busy');
    const existing = window.__gxPushToken?.() || '';
    if (existing) { subscribe(existing).catch(() => setState('error')); return; }
    let req;
    try { req = Notification.requestPermission(); } catch (_) { setState('error'); return; } // inside the tap (Safari)
    Promise.resolve(req).then(async (perm) => {
      if (perm !== 'granted') { setState('denied'); return; }
      const token = (await window.__gxRegisterPush?.()) || '';
      if (!token) { setState('error'); return; }
      await subscribe(token);
    }).catch(() => setState('error'));
  };

  const base = 'inline-flex items-center gap-1.5 rounded-full border pl-2 pr-2.5 py-1 text-xs font-semibold flex-shrink-0 transition-colors';
  if (state === 'unsupported') {
    return (
      <span className={`${base} bg-gray-50 border-gray-100 text-gray-500`} title="iPhone: pasang situs ke Layar Utama dulu (Bagikan → Tambahkan ke Layar Utama)">
        🔔 {inStock ? 'Kabari kalau turun harga' : 'Kabari kalau ready'} · perlu pasang ke Layar Utama
      </span>
    );
  }
  if (state === 'done') {
    return (
      <span className={`${base} bg-emerald-50 border-emerald-100 text-emerald-800`}>
        ✓ Kamu akan dikabari {inStock ? 'kalau harganya turun' : 'kalau ready lagi'}
      </span>
    );
  }
  if (state === 'denied') {
    return (
      <span className={`${base} bg-gray-50 border-gray-100 text-gray-500`} title="Notifikasi diblokir di pengaturan browser untuk galaxy.co.id">
        🔔 Notifikasi diblokir di browser
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'busy'}
      className={`${base} ${inStock ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700' : 'bg-red-50 hover:bg-red-100 border-red-100 text-red-700'} disabled:opacity-60`}
    >
      🔔 {state === 'busy' ? 'Sebentar…' : state === 'error' ? 'Gagal, coba lagi' : inStock ? 'Kabari kalau turun harga' : 'Kabari kalau ready'}
    </button>
  );
}
