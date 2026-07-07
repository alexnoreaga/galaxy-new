import { useState } from 'react';

export function VoucherInline({ voucherData }) {
  const [copied, setCopied] = useState(null);

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

  if (vouchers.length === 0) return null;

  function handleCopy(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDiscount(v) {
    if (v.discountType === 'percentage') return `${v.discount}%`;
    const num = parseFloat(v.discount);
    if (isNaN(num)) return v.discount;
    if (num >= 1000000) return `${num / 1000000}jt`;
    if (num >= 1000) return `${num / 1000}rb`;
    return num.toLocaleString('id-ID');
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-rose-600">
          <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
        </svg>
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Voucher Untukmu</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {vouchers.map((v, i) => (
          <div
            key={i}
            className="relative flex items-stretch rounded-2xl border border-rose-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Left stub — discount badge */}
            <div className="relative flex flex-col items-center justify-center min-w-[76px] px-2 py-3 bg-gradient-to-b from-rose-600 to-rose-500 text-white">
              <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">Diskon</span>
              <span className="text-xl font-black leading-tight">
                {v.discountType === 'percentage' ? formatDiscount(v) : `Rp${formatDiscount(v)}`}
              </span>
            </div>

            {/* Perforation notches */}
            <div className="absolute left-[76px] top-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-rose-200" style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
            <div className="absolute left-[76px] bottom-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-white border border-rose-200" style={{ borderBottomColor: 'transparent', borderRightColor: 'transparent' }} />
            {/* Dashed divider */}
            <div className="border-l border-dashed border-rose-200 my-2" />

            {/* Right — details */}
            <div className="flex-1 flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 min-w-0">
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold text-gray-900 tracking-widest leading-tight">{v.code}</span>
                {v.description && (
                  <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{v.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                  {v.minPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3a65.25 65.25 0 0 1 13.36 1.412.75.75 0 0 1 .58.875 48.645 48.645 0 0 1-1.618 6.2.75.75 0 0 1-.712.513H6l-.312 1.25h9.812a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.727-.932l.7-2.8-1.437-10.06a.25.25 0 0 0-.248-.208H1.75A.75.75 0 0 1 1 1.75ZM6 17.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm9.25 1.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
                      </svg>
                      Min. {v.minPurchase}
                    </span>
                  )}
                  {v.expiryDate && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                      </svg>
                      s/d {new Date(v.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Copy button */}
              <button
                onClick={() => handleCopy(v.code)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 active:scale-95 ${
                  copied === v.code
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {copied === v.code ? '✓ Tersalin' : 'Salin'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
