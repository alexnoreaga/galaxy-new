import { json } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import React, { useState } from 'react';

export async function loader({ context }) {
  const discountVouchers = await context.storefront.query(METAOBJECT_DISCOUNT_VOUCHERS, {
    variables: {
      type: 'discount_voucher',
      first: 50,
    },
  });

  return json({
    discountVouchers,
  });
}

export const meta = () => {
  return [
    { title: 'Promo & Diskon - Galaxy Camera' },
    {
      name: 'description',
      content: 'Dapatkan kode voucher diskon terbaru dari Galaxy Camera untuk pembelian produk favorit Anda',
    },
  ];
};

export default function PromoPage() {
  const { discountVouchers } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Transform data
  const voucherArray = discountVouchers?.metaobjects?.edges?.map((edge) => {
    const fields = edge.node.fields;
    return {
      id: edge.node.id,
      code: fields.find(f => f.key === 'code')?.value || '',
      discount: fields.find(f => f.key === 'discount_value')?.value || '',
      discountType: fields.find(f => f.key === 'discount_type')?.value || 'fixed',
      description: fields.find(f => f.key === 'description')?.value || '',
      minPurchase: fields.find(f => f.key === 'min_purchase')?.value || '',
      expiryDate: fields.find(f => f.key === 'expiry_date')?.value || '',
    };
  }) || [];

  // Filter vouchers based on search
  const filteredVouchers = voucherArray.filter(
    (voucher) =>
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Header */}
      <div className='bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-8 md:py-12'>
        <div className='lg:container mx-auto px-4 md:px-8 lg:px-12'>
          <h1 className='text-3xl md:text-5xl font-bold mb-2'>Promo & Voucher</h1>
          <p className='text-emerald-50 text-sm md:text-base'>Dapatkan diskon terbaik untuk pembelian produk favorit Anda</p>
        </div>
      </div>

      {/* Content */}
      <div className='lg:container mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12'>
        {/* Search Bar */}
        <div className='mb-8'>
          <div className='relative'>
            <svg
              className='absolute left-4 top-3.5 h-5 w-5 text-gray-400'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
            <input
              type='text'
              placeholder='Cari kode voucher...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
            />
          </div>
        </div>

        {/* Stats */}
        <div className='mb-8 grid grid-cols-2 md:grid-cols-3 gap-4'>
          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
            <div className='text-2xl md:text-3xl font-bold text-emerald-600'>{voucherArray.length}</div>
            <div className='text-xs md:text-sm text-gray-600'>Total Voucher</div>
          </div>
          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
            <div className='text-2xl md:text-3xl font-bold text-blue-600'>
              {voucherArray.filter(v => !isExpired(v.expiryDate)).length}
            </div>
            <div className='text-xs md:text-sm text-gray-600'>Aktif</div>
          </div>
          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200 col-span-2 md:col-span-1'>
            <div className='text-2xl md:text-3xl font-bold text-rose-600'>
              {voucherArray.filter(v => isExpired(v.expiryDate)).length}
            </div>
            <div className='text-xs md:text-sm text-gray-600'>Berakhir</div>
          </div>
        </div>

        {/* Vouchers Grid */}
        {filteredVouchers.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
            {filteredVouchers.map((voucher) => {
              const expired = isExpired(voucher.expiryDate);
              return (
                <div
                  key={voucher.id}
                  className={`rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${
                    expired ? 'opacity-60' : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className='bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 md:p-6 text-white'>
                    <div className='flex items-center justify-between gap-2 mb-3'>
                      <div>
                        <div className='text-xs md:text-sm text-emerald-100 mb-1'>Kode Voucher</div>
                        <div className='text-xl md:text-2xl font-bold font-mono'>{voucher.code}</div>
                      </div>
                      <div className='bg-white bg-opacity-20 rounded-lg px-2 md:px-3 py-1 text-center'>
                        <div className='text-xs md:text-sm font-semibold'>
                          {voucher.discountType === 'percentage' 
                            ? `${voucher.discount}%` 
                            : `Rp ${parseFloat(voucher.discount).toLocaleString('id-ID')}`}
                        </div>
                      </div>
                    </div>
                    {expired && (
                      <div className='inline-block bg-rose-500 text-white text-xs px-2 py-1 rounded-full'>
                        Berakhir
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className='bg-white p-4 md:p-6 space-y-3 md:space-y-4'>
                    {/* Description */}
                    <div>
                      <p className='text-xs md:text-sm text-gray-700'>{voucher.description}</p>
                    </div>

                    {/* Details */}
                    <div className='space-y-2'>
                      {voucher.minPurchase && (
                        <div className='flex items-center gap-2 text-xs md:text-sm text-gray-600'>
                          <svg
                            className='w-4 h-4 text-emerald-600'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                          </svg>
                          <span>{voucher.minPurchase}</span>
                        </div>
                      )}

                      {voucher.expiryDate && (
                        <div className='flex items-center gap-2 text-xs md:text-sm text-gray-600'>
                          <svg
                            className='w-4 h-4 text-emerald-600'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                          </svg>
                          <span>
                            Berlaku hingga {new Date(voucher.expiryDate).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyCode(voucher.code)}
                      disabled={expired}
                      className={`w-full py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                        expired
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : copiedCode === voucher.code
                          ? 'bg-green-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {copiedCode === voucher.code ? (
                        <>
                          <svg
                            className='w-4 h-4'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <svg
                            className='w-4 h-4'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.318 0-2.592.644-3.423 1.638m5.853 2.986V9m0 0V7.5m0 1.5h-6m12 0a2.25 2.25 0 01-2.25 2.25h-.08a2.25 2.25 0 01-2.25-2.25m0-12.75h.008v.008h-.008V2.25m0 11.178v3.565c0 .597-.48 1.083-1.07 1.083H7.07c-.597 0-1.083-.486-1.083-1.083v-3.565m6.986 0a2.25 2.25 0 01-2.25 2.25h-.076a2.25 2.25 0 01-2.25-2.25m0 0V5.25m0 0A2.25 2.25 0 015.25 3h3.5a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 018.75 21H5.25a2.25 2.25 0 01-2.25-2.25V5.25'
                            />
                          </svg>
                          Salin Kode
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400 mb-4'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M20 21l-4.35-4.35m0 0a7 7 0 10-9.9 0'
              />
            </svg>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Tidak ada voucher ditemukan</h3>
            <p className='text-gray-500'>Coba cari dengan kata kunci yang berbeda</p>
          </div>
        )}

        {/* Info Section */}
        <div className='mt-12 grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6'>
            <h3 className='text-lg font-semibold text-blue-900 mb-2'>📌 Cara Menggunakan Voucher</h3>
            <ol className='text-sm text-blue-800 space-y-2 list-decimal list-inside'>
              <li>Pilih voucher yang Anda inginkan</li>
              <li>Klik tombol "Salin Kode" untuk menyalin kode</li>
              <li>Buka produk yang Anda inginkan</li>
              <li>Masukkan kode voucher saat checkout</li>
              <li>Diskon akan otomatis diterapkan</li>
            </ol>
          </div>

          <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-4 md:p-6'>
            <h3 className='text-lg font-semibold text-emerald-900 mb-2'>⭐ Tips & Trik</h3>
            <ul className='text-sm text-emerald-800 space-y-2 list-disc list-inside'>
              <li>Perhatikan tanggal kadaluarsa voucher</li>
              <li>Beberapa voucher memiliki minimal pembelian</li>
              <li>Voucher hanya dapat digunakan untuk produk tertentu</li>
              <li>Dapatkan diskon maksimal dengan menggabungkan penawaran</li>
              <li>Subscribe untuk notifikasi voucher terbaru</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const METAOBJECT_DISCOUNT_VOUCHERS = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          key
          value
        }
      }
    }
  }
}`;
