import React from 'react'

export const Modal = ({product, selectedVariant, canonicalUrl, perubahTanggal, statusOpen, setBukaModal, bungaHCI, admKredivo, adminFee3BulanKredivo, adminKartuKredit6Bulan, adminKartuKredit12Bulan}) => {
  const handleCloseModal = () => setBukaModal(false);

  const harga = Number(parseFloat(selectedVariant.price.amount));

  const bungaKredivo = (admKredivo * harga) / 100;
  const adminFee3Bulan = (adminFee3BulanKredivo * harga) / 100;
  const cicilanKredivo3Bulan = Math.ceil(((harga + adminFee3Bulan) / 3) / 10) * 10;
  const cicilanKredivo6Bulan = Math.ceil(((harga / 6) + bungaKredivo) / 10) * 10;
  const cicilanKredivo12Bulan = Math.ceil(((harga / 12) + bungaKredivo) / 10) * 10;

  const bungaHci = (bungaHCI * harga) / 100;
  const cicilanHci6Bulan = Math.ceil(((harga / 6) + bungaHci) / 10) * 10;
  const cicilanHci9Bulan = Math.ceil(((harga / 9) + bungaHci) / 10) * 10;
  const cicilanHci12Bulan = Math.ceil(((harga / 12) + bungaHci) / 10) * 10;

  const biayaAdm6 = (adminKartuKredit6Bulan * harga) / 100;
  const biayaAdm12 = (adminKartuKredit12Bulan * harga) / 100;
  const cicilanKK3 = Math.ceil(harga / 3);
  const cicilanKK6 = Math.ceil(((harga + biayaAdm6) / 6) / 10) * 10;
  const cicilanKK12 = Math.ceil(((harga + biayaAdm12) / 12) / 10) * 10;

  const options = [
    {
      name: 'Kredivo',
      accent: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50',
      badge: 'bg-emerald-100 text-emerald-700',
      tenures: [
        {label: '3x', value: cicilanKredivo3Bulan},
        {label: '6x', value: cicilanKredivo6Bulan},
        {label: '12x', value: cicilanKredivo12Bulan},
      ],
    },
    {
      name: 'Homecredit',
      accent: 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50',
      badge: 'bg-blue-100 text-blue-700',
      tenures: [
        {label: '6x', value: cicilanHci6Bulan},
        {label: '9x', value: cicilanHci9Bulan},
        {label: '12x', value: cicilanHci12Bulan},
      ],
    },
    {
      name: 'Kartu Kredit',
      accent: 'border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50',
      badge: 'bg-violet-100 text-violet-700',
      tenures: [
        {label: '3x', value: cicilanKK3},
        {label: '6x', value: cicilanKK6},
        {label: '12x', value: cicilanKK12},
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCloseModal}
      />

      {/* Sheet / Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 sm:pt-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-10">
              <div className="flex items-center gap-1.5 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-rose-500 flex-shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.187 2.187 0 0 0-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 0 1-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 0 1 1.359-.636c.08.173.245.376.54.569.313.205.706.353 1.137.432v-2.748a3.782 3.782 0 0 1-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.806.4-1.558 1.097-2.096a3.78 3.78 0 0 1 1.653-.713V4.75A.75.75 0 0 1 10 4Z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Opsi Cicilan</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.title}</p>
              <p className="text-lg font-bold text-rose-700 mt-0.5">
                Rp{harga.toLocaleString('id-ID')}
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
          {options.map((opt) => (
            <div key={opt.name} className={`rounded-xl border ${opt.accent} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${opt.badge}`}>
                  {opt.name}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">DP 0%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {opt.tenures.map((t) => (
                  <div key={t.label} className="bg-white/80 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-[11px] font-semibold text-gray-400 mb-0.5">{t.label}</div>
                    <div className="text-xs font-bold text-gray-900 leading-snug">
                      Rp{t.value.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-gray-400">/bln</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Other leasings */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">Tersedia juga melalui:</p>
            <div className="flex flex-wrap gap-1.5">
              {['Akulaku', 'Indodana', 'Shopee Paylater'].map((name) => (
                <span key={name} className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  {name}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Hubungi admin untuk info lebih lanjut.</p>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            * Angka cicilan merupakan estimasi dan dapat berubah sewaktu-waktu.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleCloseModal}
            className="w-full bg-gray-900 hover:bg-gray-700 active:scale-[0.98] text-white text-sm font-semibold py-3.5 rounded-xl transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
