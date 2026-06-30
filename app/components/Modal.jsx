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
      tenures: [
        {label: '3x', value: cicilanKredivo3Bulan},
        {label: '6x', value: cicilanKredivo6Bulan},
        {label: '12x', value: cicilanKredivo12Bulan},
      ],
    },
    {
      name: 'Homecredit',
      tenures: [
        {label: '6x', value: cicilanHci6Bulan},
        {label: '9x', value: cicilanHci9Bulan},
        {label: '12x', value: cicilanHci12Bulan},
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

        {/* Trust highlights */}
        <div className="flex items-stretch divide-x divide-gray-100 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-3 px-2 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-rose-500">
              <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.268a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
            </svg>
            <span className="text-[11px] font-semibold text-gray-700">Proses ±30 menit</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-3 px-2 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-rose-500">
              <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
            </svg>
            <span className="text-[11px] font-semibold text-gray-700">KTP Saja</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-3 px-2 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-rose-500">
              <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
              <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
            </svg>
            <span className="text-[11px] font-semibold text-gray-700">Kunjungi Toko</span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
          {options.map((opt) => (
            <div key={opt.name} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <span className="text-xs font-semibold text-gray-700">{opt.name}</span>
                <span className="text-[11px] text-gray-400">DP 0%</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                {opt.tenures.map((t) => (
                  <div key={t.label} className="flex flex-col items-center justify-center py-3 px-2 text-center">
                    <div className="text-[11px] text-gray-400 mb-0.5">{t.label}</div>
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
