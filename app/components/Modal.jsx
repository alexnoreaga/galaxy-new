import React, {useEffect} from 'react';

const WA_NUMBER = '6282111311131';

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

  // Lightest monthly across every provider — surfaced in the header as the headline number
  const termurah = Math.min(...options.flatMap((o) => o.tenures.map((t) => t.value)));

  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Halo admin Galaxy, saya mau tanya cicilan untuk "${product.title}".\nHarga: Rp${harga.toLocaleString('id-ID')}\n${canonicalUrl || ''}`,
  )}`;

  // Lock background scroll + close on Escape while the sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setBukaModal(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [setBukaModal]);

  const trust = [
    {
      label: 'Proses ±30 menit',
      path: 'M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.268a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z',
    },
    {
      label: 'Cukup KTP',
      path: 'M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z',
    },
    {
      label: 'Bisa di toko',
      path: 'M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />

      {/* Sheet / Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-[cicilanUp_.22s_ease-out]">
        <style>{`@keyframes cicilanUp{from{transform:translateY(20px);opacity:.5}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Drag handle (mobile only) */}
        <div className="absolute top-0 inset-x-0 flex justify-center pt-2.5 sm:hidden z-10">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header — charcoal, matches the site's dark bands */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #263447 100%)'}}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{opacity: 0.05, backgroundImage: 'radial-gradient(circle at center, #fff 0.6px, transparent 0.6px)', backgroundSize: '22px 22px'}}
          />
          <div aria-hidden="true" className="absolute -top-16 -left-10 w-44 h-44 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

          <button
            onClick={handleCloseModal}
            aria-label="Tutup"
            className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>

          <div className="relative px-5 pt-5 pb-4 sm:pt-5">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-rose-400 m-0 mb-1.5">Opsi Cicilan</p>
            <p className="text-white text-[13px] font-medium leading-snug line-clamp-2 pr-8 m-0">{product.title}</p>

            <div className="flex items-end justify-between gap-3 mt-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 m-0">Harga</p>
                <p className="text-white text-lg font-bold m-0 leading-tight">Rp{harga.toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 m-0">Cicilan mulai</p>
                <p className="text-amber-300 text-lg font-bold m-0 leading-tight">
                  Rp{termurah.toLocaleString('id-ID')}
                  <span className="text-[11px] font-medium text-amber-200/70">/bln</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="flex items-stretch divide-x divide-gray-100 bg-gray-50/80 border-b border-gray-100 flex-shrink-0">
          {trust.map((t) => (
            <div key={t.label} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 px-1.5 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-rose-500 flex-shrink-0">
                <path fillRule="evenodd" d={t.path} clipRule="evenodd" />
              </svg>
              <span className="text-[10.5px] font-semibold text-gray-600 leading-none">{t.label}</span>
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
          {options.map((opt) => (
            <div key={opt.name} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-[13px] font-bold text-gray-900">{opt.name}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-2 py-0.5">
                  DP 0%
                </span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                {opt.tenures.map((t, i) => {
                  const lightest = i === opt.tenures.length - 1; // longest tenor = smallest monthly
                  return (
                    <div
                      key={t.label}
                      className={`flex flex-col items-center justify-center py-3 px-1.5 text-center ${lightest ? 'bg-rose-50/70' : ''}`}
                    >
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 mb-1.5 ${lightest ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {t.label}
                      </span>
                      <span className={`text-[13px] font-bold leading-none tabular-nums ${lightest ? 'text-rose-700' : 'text-gray-900'}`}>
                        Rp{t.value.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">/bln</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Other leasings */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5">
            <p className="text-[11px] font-semibold text-gray-600 m-0 mb-2">Tersedia juga melalui</p>
            <div className="flex flex-wrap gap-1.5">
              {['Akulaku', 'Indodana', 'Shopee Paylater'].map((name) => (
                <span key={name} className="px-2.5 py-1 bg-white ring-1 ring-gray-200 rounded-full text-[11px] font-medium text-gray-700">
                  {name}
                </span>
              ))}
            </div>
            <p className="text-[10.5px] text-gray-400 m-0 mt-2">Hubungi admin untuk info lebih lanjut.</p>
          </div>

          <p className="text-[10px] text-gray-400 text-center m-0">
            * Angka cicilan merupakan estimasi dan dapat berubah sewaktu-waktu.
          </p>
        </div>

        {/* Footer — primary action is asking admin; closing is secondary */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center gap-2.5 flex-shrink-0 bg-white">
          <button
            onClick={handleCloseModal}
            className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            Tutup
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="flex-[1.7] inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold py-3 rounded-xl transition-all no-underline"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
              <path d="M12.05 2a9.94 9.94 0 0 0-8.5 15.13L2 22l4.98-1.507A9.94 9.94 0 1 0 12.05 2Zm0 18.13a8.2 8.2 0 0 1-4.18-1.145l-.3-.178-3.1.938.94-3.02-.195-.31a8.19 8.19 0 1 1 6.835 3.715Z" />
            </svg>
            Tanya Admin
          </a>
        </div>
      </div>
    </div>
  );
}
