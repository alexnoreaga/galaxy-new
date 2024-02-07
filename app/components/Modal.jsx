import React from 'react'

export const Modal = ({product,selectedVariant,canonicalUrl,perubahTanggal,statusOpen,setBukaModal}) => {
  const handleCloseModal = () => {
    setBukaModal(false);
  };

  const textToCopy = `${product.title}${product?.selectedVariant?.title? ' - ' + product?.selectedVariant?.title :''}\n` +
      `Harga : Rp ${parseFloat(selectedVariant.price.amount).toLocaleString()}\n`+
      `${product?.metafields[0]?.value ? 'Garansi : ' + product?.metafields[0]?.value + ' ' + (product.vendor !== 'galaxy' && product.vendor) + '\n':''}`+
      `${product?.metafields[3]?.value ? 'Periode : ' + perubahTanggal(product.metafields[3]?.value) + ' - ' + perubahTanggal(product.metafields[4]?.value) + '\n':''}`+
      `Link : ${canonicalUrl}`;

    

  return (
    <div>
        <div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">

  <div class="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" onClick={handleCloseModal}></div>

  <div  class="fixed inset-0 z-10 w-screen overflow-y-auto ">
    <div class="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">

      <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-800">
  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
</svg>

            </div>
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">List Cicilan</h3>
              <div class="mt-2">
                {/* <p class="text-sm text-gray-500">Manfaatkan Cicilan Tanpa Kartu Kredit Promo DP Mulai dari 0%. Proses sekitar 15 menit ajukan segera hanya di Galaxy Camera Tangerang, Toko Buka setiap hari dari jam 10 sampai jam 9 malam</p> */}
                {/* <p>{textToCopy}</p> */}
                <div className='overflow-x-auto'>
  <table class=" border-collapse border border-slate-300 text-sm ">
    <thead>
    <tr>
      <th className='border border-slate-300 p-2'>Leasing</th>
      <th className='border border-slate-300 p-2'>Dp</th>
      <th className='border border-slate-300 p-2'>3x</th>
      <th className='border border-slate-300 p-2'>6x</th>
      <th className='border border-slate-300 p-2'>12x</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className='border border-slate-300 p-2'>Kredivo</td>
      <td className='border border-slate-300 p-2'>0</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
    </tr>
    <tr>
      <td className='border border-slate-300 p-2'>Homecredit</td>
      <td className='border border-slate-300 p-2'>0</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
    </tr>
    <tr>
      <td className='border border-slate-300 p-2'>Kartu Kredit</td>
      <td className='border border-slate-300 p-2'>0</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
      <td className='border border-slate-300 p-2'>1XXX.XXX</td>
    </tr>
  </tbody>
</table>
</div>
<div className='bg-gray-100 mt-2 p-2 text-sm text-gray-800 rounded-md'>
    <div>Tersedia juga leasing berikut :</div>
    <div className='font-bold'>- Akulaku</div>
    <div className='font-bold'>- Indodana</div>
    <div className='font-bold'>- Shopee Paylater</div>
    <div>Hubungi admin untuk info lebih lanjut.</div>
</div>
<div className='text-xs text-gray-500 p-2'>Cicilan diatas merupakan estimasi, dapat berubah sewaktu-waktu.</div>

              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          {/* <button type="button" class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">Deactivate</button> */}
          <button onClick={(prev)=>setBukaModal(!prev)} type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Close</button>
        </div>
      </div>
    </div>
  </div>
</div>

    </div>
  )
}
