import { useState, useEffect } from 'react';

const STORAGE_KEY = 'galaxy_voucher_shown';
const DELAY_MS = 45000; // 45 seconds

export function VoucherSlideIn({ voucherData }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(null);

  // Extract first available voucher
  const vouchers = voucherData?.metaobjects?.edges ?? [];
  const firstVoucher = vouchers[0]?.node?.fields
    ? Object.fromEntries(vouchers[0].node.fields.map(f => [f.key, f.value]))
    : null;

  // Use stable string as dependency — object reference changes every render and would reset the timer
  const voucherCode = firstVoucher
    ? (firstVoucher.kode_voucher ?? firstVoucher.code ?? '')
    : null;

  useEffect(() => {
    // Show once per session
    const alreadyShown = sessionStorage.getItem(STORAGE_KEY);
    if (alreadyShown || !voucherCode) return;

    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(STORAGE_KEY, '1');
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [voucherCode]);

  function handleDismiss() {
    setDismissed(true);
    setTimeout(() => setVisible(false), 300);
  }

  function handleCopy(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!visible || !firstVoucher || !voucherCode) return null;

  const code = firstVoucher.kode_voucher ?? firstVoucher.code ?? '';
  const label = firstVoucher.label ?? firstVoucher.nama ?? 'Voucher Diskon';
  const discount = firstVoucher.diskon ?? firstVoucher.discount ?? '';

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ${
        dismissed ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
      style={{ maxWidth: '280px' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Top stripe */}
        <div className="bg-rose-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
              <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 0 0 3 5.5v2.879a2.5 2.5 0 0 0 .732 1.767l6.5 6.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-6.5-6.5A2.5 2.5 0 0 0 8.38 3H5.5ZM6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-xs font-semibold">Punya Kode Voucher?</span>
          </div>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">{label}{discount ? ` — hemat ${discount}` : ''}</p>

          {/* Code copy button */}
          {code && (
            <button
              onClick={() => handleCopy(code)}
              className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl px-3 py-2.5 transition-colors group"
            >
              <span className="font-mono text-sm font-bold text-rose-700 tracking-widest">{code}</span>
              <span className="text-[10px] text-gray-400 group-hover:text-rose-600 font-medium transition-colors">
                {copied === code ? '✓ Disalin!' : 'Salin'}
              </span>
            </button>
          )}

          <p className="text-[10px] text-gray-400 mt-2 text-center">Masukkan kode saat checkout</p>
        </div>
      </div>
    </div>
  );
}
