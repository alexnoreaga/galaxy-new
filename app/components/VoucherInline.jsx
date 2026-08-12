import { useState, useEffect } from 'react';

// Blibli-style voucher UX: a compact teaser strip ("Pakai voucher biar hemat") that expands into a
// grouped modal ("Lihat semua") listing every voucher. Galaxy vouchers are copy-able discount codes,
// so the modal action is "Salin" (copy) rather than Blibli's auto-claim.

function TicketIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
    </svg>
  );
}

export function VoucherInline({ voucherData }) {
  const [copied, setCopied] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const vouchers = (voucherData?.metaobjects?.edges ?? [])
    .map(edge => {
      const fields = edge.node?.fields ?? [];
      const get = key => fields.find(f => f.key === key)?.value || '';
      return {
        code: get('code'),
        discount: get('discount_value'),
        discountType: get('discount_type') || 'fixed',
        description: get('description'),
        minPurchase: get('min_purchase'),
        expiryDate: get('expiry_date'),
      };
    })
    .filter(v => v.code);

  // Lock body scroll + close on Escape while the modal is open
  useEffect(() => {
    if (!showAll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setShowAll(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [showAll]);

  if (vouchers.length === 0) return null;

  function handleCopy(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function discountLabel(v) {
    if (v.discountType === 'percentage') return `Diskon ${v.discount}%`;
    const num = parseFloat(v.discount);
    const rp = isNaN(num) ? v.discount : `Rp${num.toLocaleString('id-ID')}`;
    return `Diskon ${rp}`;
  }

  function minLabel(v) {
    const m = (v.minPurchase || '').trim();
    if (!m) return '';
    return /^min/i.test(m) ? m : `Min. transaksi ${m}`;
  }

  function expiryInfo(v) {
    if (!v.expiryDate) return null;
    const d = new Date(v.expiryDate);
    if (isNaN(d.getTime())) return null;
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    if (days >= 0 && days <= 7) {
      return { text: days <= 0 ? 'Berakhir hari ini' : `Hangus ${days} hari lagi`, urgent: true };
    }
    return { text: `Berakhir ${dateStr}`, urgent: false };
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TicketIcon className="w-4 h-4 text-rose-600" />
          <span className="text-sm font-semibold text-gray-800">Pakai voucher biar hemat</span>
        </div>
        <button
          onClick={() => setShowAll(true)}
          className="text-[13px] font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-0.5"
        >
          Lihat semua
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Teaser strip — compact cards, horizontally scrollable; tapping opens the modal */}
      <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {vouchers.map((v, i) => {
          const exp = expiryInfo(v);
          return (
            <button
              key={i}
              onClick={() => setShowAll(true)}
              className="flex items-center gap-2.5 flex-shrink-0 w-[230px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-rose-300 hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <TicketIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">{discountLabel(v)}</p>
                {minLabel(v) && <p className="text-[11px] text-gray-500 truncate">{minLabel(v)}</p>}
                {exp?.urgent && <p className="text-[10px] font-semibold text-rose-600 truncate">{exp.text}</p>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal — all vouchers */}
      {showAll && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setShowAll(false)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-[voucherUp_.22s_ease-out]">
            <style>{`@keyframes voucherUp{from{transform:translateY(24px);opacity:.4}to{transform:translateY(0);opacity:1}}`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Voucher</h3>
              <button
                onClick={() => setShowAll(false)}
                aria-label="Tutup"
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-4 py-3 flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Voucher Diskon Galaxy</p>
                <p className="text-xs text-gray-500 mt-0.5">Salin kode & pakai saat checkout sesuai syarat &amp; ketentuan.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vouchers.map((v, i) => {
                  const exp = expiryInfo(v);
                  return (
                    <div key={i} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                          <TicketIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-tight">{discountLabel(v)}</p>
                          {minLabel(v) && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{minLabel(v)}</p>}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-gray-700 bg-gray-100 rounded px-1.5 py-0.5 tracking-wide">{v.code}</span>
                            {exp && (
                              <span className={`text-[11px] ${exp.urgent ? 'text-rose-600 font-semibold' : 'text-gray-400'}`}>{exp.text}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(v.code)}
                          className={`flex-shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            copied === v.code ? 'bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {copied === v.code ? '✓ Tersalin' : 'Salin'}
                        </button>
                      </div>
                      {v.description && (
                        <div className="flex items-start gap-1.5 bg-amber-50 border-t border-amber-100 px-3 py-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0">
                            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                          </svg>
                          <p className="text-[11px] text-amber-700 leading-snug">{v.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
