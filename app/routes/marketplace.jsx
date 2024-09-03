import React, { useState } from 'react';
import { Accordion } from '~/components/Accordion';
import { Link } from "@remix-run/react";


export default function Marketplace() {

    const [modal, setModal] = useState({ price: '', basePrice: '' });

    // BIAYA ADMIN KATEGORI TOKOPEDIA
    const feeA = 4.00
    const feeB = 6.00
    const feeC = 8.50
    const fee2c5 = 2.50
    const fee4 = 4.00

    // Tokopedia - BIAYA JASA TRANSAKSI 1.8% Maksimal 50RB
    const jasaTokopedia = 1.8

    // Tokopedia - BIAYA FREE ONGKIR 4% Maksimal 10rb
    const jasaOngkir = 1.8


    // BIAYA ADMIN KATEGORI SHOPEE
    const shopeeA = 8.00
    const shopeeB  = 7.50
    const shopeeC = 5.75
    const shopeeD = 4.25

    const ongkirXtra = 4.0


    // BIAYA ADMIN KATEGORI BLIBLI OFFICIAL STORE
    const feeBlibli2c5 = 2.50
    const feeBlibli4 = 4
    const feeBlibli2c75 = 2.75
    const jasaBlibli = 1.8
    const jasaOngkirBlibli = 2


    // BIAYA ADMIN AKULAKU
    const feeAkulaku = 1.50

    // BIAYA ADMIN BUKALAPAK
    const feeBukalapak = 2.00


    // BIAYA ADMIN TIKTOK MARKETPALCE
    const feeTiktok5c75 = 5.75
    const feeTiktok10 = 10.00
    const feeTiktok7c5 = 7.50


    
    // BIAYA ADMIN TIKTOK MALL
    const feeTiktok4 = 4.00
    const feeTiktok8c5 = 8.5



    const handleChange = (e) => {
        const { name, value } = e.target;

        // Remove commas from the input value to parse it as a number
        const rawValue = value.replace(/,/g, '');

        // Only update the state if the input value is a valid number or empty
        if (!isNaN(rawValue) || rawValue === '') {
            setModal((prev) => ({
                ...prev,
                [name]: rawValue
            }));
        }
    }

    const formatValue = (value) => {
        // Convert the raw number to a localized string with commas
        return value ? Number(value).toLocaleString() : '';
    }

    const calculateDifference = () => {
        const price = parseFloat(modal.price) || 0;
        const basePrice = parseFloat(modal.basePrice) || 0;
        return price - basePrice;
    }

    const hitungTokopedia = (biayaAdm) => {

      const price = parseFloat(modal.price) || 0;
      const basePrice = parseFloat(modal.basePrice) || 0;
      const biayaAdmTokopedia = (price * biayaAdm) / 100
      const jasaToped = Math.min((price * jasaTokopedia) / 100, 50000);
      // Apply the condition for jasaTopedOngkir
      const jasaTopedOngkir = Math.min((price * jasaOngkir) / 100, 10000);


      return ((price - biayaAdmTokopedia) - (jasaToped+jasaTopedOngkir) - basePrice);
  }

  const hitungShopee = (biayaAdm) => {

    const price = parseFloat(modal.price) || 0;
    const basePrice = parseFloat(modal.basePrice) || 0;
    const biayaAdmShopee = (price * biayaAdm) / 100
    // Apply the condition for jasaTopedOngkir
    const ongkirXtraShopee = Math.min((price * ongkirXtra) / 100, 10000);


    return ((price - biayaAdmShopee) - (ongkirXtraShopee) - basePrice);
}

const hitungBlibli = (biayaAdm) => {

  const price = parseFloat(modal.price) || 0;
  const basePrice = parseFloat(modal.basePrice) || 0;
  const biayaAdmBlibli = (price * biayaAdm) / 100
  const jasaBlibli2 = Math.min((price * jasaBlibli) / 100, 50000);
  // Apply the condition for jasaTopedOngkir
  const jasaOngkirBlibli2 = Math.min((price * jasaOngkirBlibli) / 100, 10000);


  return ((price - biayaAdmBlibli) - (jasaBlibli2+jasaOngkirBlibli2) - basePrice);
}


const hitungAkulaku = (biayaAdm) => {

  const price = parseFloat(modal.price) || 0;
  const basePrice = parseFloat(modal.basePrice) || 0;
  const biayaAdmAkulaku = (price * biayaAdm) / 100

  return ((price - biayaAdmAkulaku) - basePrice);
}

const hitungBukalapak = (biayaAdm) => {

  const price = parseFloat(modal.price) || 0;
  const basePrice = parseFloat(modal.basePrice) || 0;
  const biayaAdmBukalapak = (price * biayaAdm) / 100

  return ((price - biayaAdmBukalapak) - basePrice);
}


const hitungTiktokMerchant = (biayaAdm) => {

  const price = parseFloat(modal.price) || 0;
  const basePrice = parseFloat(modal.basePrice) || 0;
  const biayaAdminTiktok1 = (price * biayaAdm) / 100

  return ((price - biayaAdminTiktok1) - basePrice);
}

const hitungTiktokMall = (biayaAdm) => {

  const price = parseFloat(modal.price) || 0;
  const basePrice = parseFloat(modal.basePrice) || 0;
  const biayaAdminTiktok1 = (price * biayaAdm) / 100

  return ((price - biayaAdminTiktok1) - basePrice);
}




  const handleClear = () =>{

    setModal((prev)=>(
      { ...prev,
        price : '',
        basePrice : '',
      }
    )
      
    )
  }




    return (
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <h1 className='mb-1 text-center'>Marketplace Fee Checker</h1>
        <div className='text-xs text-gray-500 mb-3 text-center'>Last update : 1 September 2024</div>

        <input
            className="w-full mb-2 rounded-lg"
            placeholder="Masukkan Harga Jual"
            name="price"
            value={formatValue(modal.price)}
            onChange={handleChange}
        />

        <input
            className="w-full mb-2 rounded-lg border"
            placeholder="Masukkan Harga Modal"
            name="basePrice"
            value={formatValue(modal.basePrice)}
            onChange={handleChange}
        />

        <div className='flex flex-wrap gap-2 justify-between items-center mb-4'>

          <div className='flex flex-wrap gap-1 items-center'>
            <div className='font-bold text-lg'>Margin Offline :</div>
            <div className='font-bold text-lg text-red-700'> {calculateDifference() !== 0 && 'Rp '}{calculateDifference().toLocaleString()}</div>
          </div>
          <div className='bg-red-700 text-white p-2 rounded-md w-28 lg:w-48 text-center font-bold cursor-pointer' onClick={handleClear}>Reset</div>
        </div>

        <div className='mb-4 flex flex-wrap gap-2'>
        <Link className='border border-green-600 text-green-600 p-1 rounded-md w-20 font-bold text-center text-sm' to='#tokopedia'>Tokopedia</Link>
        <Link className='border border-orange-600 text-orange-600 p-1 rounded-md w-20 font-bold text-center text-sm' to='#shopee'>Shopee</Link>
        <Link className='border border-blue-600 text-blue-600 p-1 rounded-md w-20 font-bold text-center text-sm' to='#blibli'>Blibli</Link>
        <Link className='border border-red-600 text-red-600 p-1 rounded-md w-20 font-bold text-center text-sm' to='#akulaku'>Akulaku</Link>
        <Link className='border border-pink-600 text-pink-600 p-1 rounded-md w-20 font-bold text-center text-sm' to='#bukalapak'>Bukalapak</Link>
        <Link className='border border-gray-800 text-gray-800 p-1 rounded-md w-20 font-bold text-center text-sm' to='#tiktok'>Tiktok</Link>
        <Link className='border border-slate-500 text-slate-500 p-1 rounded-md w-28 font-bold text-center text-sm' to='#tiktokmall'>Tiktok Mall</Link>

        </div>
      
        {/* <Accordion 
        title="14 Hari Tukar Baru" 
        content="Jaminan penukaran kembali jika barang yang diterima tidak sesuai / cacat produksi atau salah ukuran." 
        icon={(
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
        </svg>

        )}/> */}

        <div className='border rounded-lg p-2 border-green-600 shadow-lg'>

          <div className='text-center'>
          <div className="font-bold text-green-600 text-xl" id="tokopedia">Tokopedia Official Store</div>

          <div className='text-xs text-gray-500'>Biaya Jasa Transaksi 1.8% (Maksimal 50rb)</div>
          <div className='text-xs text-gray-500'>Biaya Free Ongkir 4% (Maksimal 10rb)</div>
          </div>

          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-600 text-white'>{feeA}%</div>
            <div className='text-xs font-bold underline'>Kategori : Audio, Kamera & Elektronik Lainnya </div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Aksesoris Kamera</div>
              <div className='text-xs'>Cleaning Tools Kamera, Silica Gel Kamera, Lainnya</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Cleaning Tools Kamera</div>
              <div className='text-xs'>Dry Box Kamera</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Drone & aksesoris</div>
              <div className='text-xs'>Drone Kamera, Drone Remote Control</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Kamera Analog</div>
              <div className='text-xs'>Disposable Camera, Kamera Film, Perangkat Kamera Instan</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Kamera Digital</div>
              <div className='text-xs'>Action Camera, Kamera 360, Kamera DSLR, Kamera Mirrorless, Kamera Pocket</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Kamera Pengintai</div>
              <div className='text-xs'>DVR, Fake Camera, IP Camera, Kabel CCTV, Kamera CCTV, Spy Camera</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Lensa & Aksesoris</div>
              <div className='text-xs'>Lensa Kamera</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Perangkat Elektronik Lainnya</div>
              <div className='text-xs'>Lainnya</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Video</div>
              <div className='text-xs'>Camcorder</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTokopedia(feeA))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-green-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(feeA)?.toLocaleString()}</div>

          </div>






          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-600 text-white'>{feeB}%</div>
            <div className='text-xs font-bold underline'>Kategori : Audio, Kamera & Elektronik Lainnya</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Aksesoris Kamera</div>
              <div className='text-xs'>Microphone Kamera</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Audio</div>
              <div className='text-xs'>Amplifier, Earphone, Headphone, Sound System, Speaker, TWS, Voice Recorder</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Drone & Aksesoris</div>
              <div className='text-xs'>Aksesoris Drone</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTokopedia(feeB))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-green-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(feeB)?.toLocaleString()}</div>
          </div>




          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-600 text-white'>{feeC}%</div>
            <div className='text-xs font-bold underline'>Kategori : Audio, Kamera & Elektronik Lainnya</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Aksesoris Kamera</div>
              <div className='text-xs'>Baterai & Charger Kamera, Kabel Konektor Kamera, Monopod Kamera, Remote Wireless Kamera, Stabilizer Kamera, Tas Kamera, Tripod Kamera</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Audio</div>
              <div className='text-xs'>Kabel & Konektor Audio</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Frame, Album & Roll Film</div>
              <div className='text-xs'>Refill Kamera Instan, Roll Film</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Lighting & Studio</div>
              <div className='text-xs'>Backdrop, Flash Diffuser, Flash Kamera, Flash Trigger, Hot Shoe Kamera, Reflektor, Ring Light, Softbox, Studio Lighting</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Tas & Case Kamera</div>
              <div className='text-xs'>Case Kamera, Strap Kamera</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTokopedia(feeC))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-green-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(feeC)?.toLocaleString()}</div>
          </div>





          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-600 text-white'>{fee2c5}%</div>
            <div className='text-xs font-bold underline'>Kategori : Komputer & Laptop</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Memory Card</div>
              <div className='text-xs'>Case Memory Card, Compact Flash, Memory Card Adapter, Memory Stick Micro M2, Memory Stick Pro Duo, Memory Stick Pro-HG Duo</div>
            </div>

            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTokopedia(fee2c5))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-green-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(fee2c5)?.toLocaleString()}</div>
          </div>



          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-600 text-white'>{fee4}%</div>
            <div className='text-xs font-bold underline'>Kategori : Komputer & Laptop</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Memory Card</div>
              <div className='text-xs'>MicroSD Card, MiniSD Card, MMC, SD Card</div>
            </div>

            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTokopedia(fee4))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-green-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(fee4)?.toLocaleString()}</div>
          </div>

        </div>





        <div className='border border-orange-600 rounded-lg p-2 mt-4'>

          <div className='text-center'>
          <div className="font-bold text-orange-600 text-xl" id="shopee">Shopee Star/Star+</div>
          <div className='text-xs text-gray-500'>Biaya Gratis Ongkir XTRA 4,0% (Maksimal 10rb)</div>
          </div>

          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-orange-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-orange-600 text-white'>{shopeeA}%</div>
            <div className='text-xs font-bold underline'>Kategori A</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Jam Tangan </div>
              <div className='text-xs'>Jam Tangan Wanita, Jam Tangan Pria, Jam Tangan Couple, Aksesoris Jam Tangan, Jam Tangan lainnya.</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Audio </div>
              <div className='text-xs'>Kabel & Konverter Audio & Video.</div>
            </div>

            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungShopee(shopeeA))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-orange-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungShopee(shopeeA)?.toLocaleString()}</div>

          </div>



          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-orange-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-orange-600 text-white'>{shopeeB}%</div>
            <div className='text-xs font-bold underline'>Kategori B</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Audio</div>
              <div className='text-xs'>MP3 & MP4 Player, CD, DVD, & Blu-ray Player, Radio & Pemutar Kaset, Amplifier & Mixer, Home Theater & Karaoke, Voice Recorder, Media Player lainnya, Mikrofon & Aksesoris, Speaker, AV Receiver, Perangkat Audio & Speaker lainnya, Audio lainnya.</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Kamera & Drone</div>
              <div className='text-xs'>Kamera Keamanan, Perawatan Kamera, Kamera & Drone Lainnya, Gimbal & Stabilizer, Lighting & Perlengkapan Studio Foto, Roll Film & Kertas Foto, Printer Foto, Charger Baterai, Baterai & Battery Grip, Tripod, Monopod & Aksesoris, Aksesoris Kamera lainnya.</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungShopee(shopeeB))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-orange-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungShopee(shopeeB)?.toLocaleString()}</div>

          </div>


          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-orange-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-orange-600 text-white'>{shopeeC}%</div>
            <div className='text-xs font-bold underline'>Kategori C</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Audio</div>
              <div className='text-xs'>Earphone, Headphone & Headset.</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Kamera & Drone</div>
              <div className='text-xs'>Kamera, Lensa, Aksesoris Lensa, Drone, Aksesoris Drone, Flash, Aksesoris Flash, Tas & Casing Kamera.</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Komputer & Aksesoris</div>
              <div className='text-xs'>Komponen Network, Software, Aksesoris Desktop & Laptop, Keyboard & Mouse, Komputer & Aksesoris Lainnya, Sound Card.</div>
            </div>



            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungShopee(shopeeC))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-orange-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungShopee(shopeeC)?.toLocaleString()}</div>

          </div>



          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-orange-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-orange-600 text-white'>{shopeeD}%</div>
            <div className='text-xs font-bold underline'>Kategori D</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Komputer & Aksesoris</div>
              <div className='text-xs'>Desktop, Monitor, Penyimpanan Data, Peralatan Kantor, Printer & Scanner, Laptop, Fan & Heatsink, Processor, Motherboard, VGA Card, Thermal Paste, Power Supply, Memory RAM, UPS & Stabilizer, Casing Komputer, Optical Drive, Komponen Desktop & Laptop Lainnya.</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Elektronik</div>
              <div className='text-xs'>Pointer, Proyektor & Layar Proyektor, Proyektor & Aksesoris Lainnya.</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungShopee(shopeeD))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-orange-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungShopee(shopeeD)?.toLocaleString()}</div>

          </div>


        </div>









        <div className='border border-blue-600 rounded-lg p-2 mt-4'>

          <div className='text-center'>
          <div className="font-bold text-blue-600 text-xl" id="blibli">Blibli Official Store</div>
          <div className='text-xs text-gray-500'>Biaya Layanan Official Store 1.8% (Maksimal 50rb)</div>
          <div className='text-xs text-gray-500'>Biaya Layanan Pengiriman Official Store 2% (Maksimal 10rb)</div>

          </div>

          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-blue-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-blue-600 text-white'>{feeBlibli2c5}%</div>
            <div className='text-xs font-bold underline'></div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Handphone, Tablet & Wearable Gadget</div>
              <div className='text-xs'>Activity Trackers & Pedemeters, Aksesoris Wearable, Smart Watch, Smartglasses, Wearable Apple, Wearable Lainnya</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Kamera </div>
              <div className='text-xs'>Kamera, Kamera Video, Lensa Kamera</div>
            </div>

            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungBlibli(feeBlibli2c5))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-blue-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungBlibli(feeBlibli2c5)?.toLocaleString()}</div>

          </div>



          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-blue-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-blue-600 text-white'>{feeBlibli4}%</div>
            <div className='text-xs font-bold underline'></div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Kamera</div>
              <div className='text-xs'>Aksesoris Kamera, Baterai Kamera, Flash Kamera, Tas & Case</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Wearable Gadget</div>
              <div className='text-xs'>True Wireless</div>
            </div>

            
            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Peralatan Elektronik &gt; Audio</div>
              <div className='text-xs'>Semua kategori turunannya</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungBlibli(feeBlibli4))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-blue-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungBlibli(feeBlibli4)?.toLocaleString()}</div>

          </div>


          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-blue-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-blue-600 text-white'>{feeBlibli2c75}%</div>
            <div className='text-xs font-bold underline'></div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Komputer & Gaming  &gt; Media Penyimpanan</div>
              <div className='text-xs'>Semua kategori turunannya</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungBlibli(feeBlibli2c75))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-blue-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungBlibli(feeBlibli2c75)?.toLocaleString()}</div>

          </div>

        </div>




        <div className='border border-red-600 rounded-lg p-2 mt-4'>

          <div className='text-center'>
          <div className="font-bold text-red-600 text-xl" id="akulaku">Akulaku Merchant / Mall</div>
          {/* <div className='text-xs text-gray-500'>Biaya Layanan Official Store 1.8% (Maksimal 50rb)</div>
          <div className='text-xs text-gray-500'>Biaya Layanan Pengiriman Official Store 2% (Maksimal 10rb)</div> */}

          </div>

          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-red-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-red-600 text-white'>{feeAkulaku}%</div>
            <div className='text-xs font-bold underline'></div>
            </div>

            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungAkulaku(feeAkulaku))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-red-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungAkulaku(feeAkulaku)?.toLocaleString()}</div>

          </div>

        </div>


        <div className='border border-pink-700 rounded-lg p-2 mt-4'>

        <div className='text-center'>
        <div className="font-bold text-pink-700 text-xl" id="bukalapak">Bukalapak</div>
        {/* <div className='text-xs text-gray-500'>Biaya Layanan Official Store 1.8% (Maksimal 50rb)</div>
        <div className='text-xs text-gray-500'>Biaya Layanan Pengiriman Official Store 2% (Maksimal 10rb)</div> */}

        </div>

        <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
          
          <div className='flex items-center gap-2 text-pink-700'>
          <div className='text-lg font-bold p-1 rounded-lg bg-pink-700 text-white'>{feeBukalapak}%</div>
          <div className='text-xs font-bold underline'></div>
          </div>

          <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungBukalapak(feeBukalapak))- modal.basePrice)?.toLocaleString()}</div>
          <div className='bg-pink-700 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungBukalapak(feeBukalapak)?.toLocaleString()}</div>

        </div>



        </div>








        <div className='border border-gray-800 rounded-lg p-2 mt-4'>

          <div className='text-center'>
          <div className="font-bold text-gray-800 text-xl" id="tiktok">Tiktok Shop Regular Marketplace</div>
          {/* <div className='text-xs text-gray-500'>Biaya Layanan Official Store 1.8% (Maksimal 50rb)</div>
          <div className='text-xs text-gray-500'>Biaya Layanan Pengiriman Official Store 2% (Maksimal 10rb)</div> */}

          </div>

          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-gray-800'>
            <div className='text-lg font-bold p-1 rounded-lg bg-gray-800 text-white'>{feeTiktok5c75}%</div>
            <div className='text-xs font-bold underline'>Phone & Electronics</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Cameras & Photography</div>
              <div className='text-xs'>Action Cameras, Drones & Accessories, DSLRs, Instant Cameras, Mirrorless Cameras, Point & Shoot Cameras, Security Cameras & SYstems, Video Camcorders</div>
            </div>

            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTiktokMerchant(feeTiktok5c75))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-gray-800 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTiktokMerchant(feeTiktok5c75)?.toLocaleString()}</div>

          </div>



          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-gray-800'>
            <div className='text-lg font-bold p-1 rounded-lg bg-gray-800 text-white'>{feeTiktok7c5}%</div>
            <div className='text-xs font-bold underline'>Phone & Electronics</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Cameras & Photography</div>
              <div className='text-xs'>Camera Lenses</div>
            </div>

            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTiktokMerchant(feeTiktok7c5))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-gray-800 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTiktokMerchant(feeTiktok7c5)?.toLocaleString()}</div>

          </div>


          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-gray-800'>
            <div className='text-lg font-bold p-1 rounded-lg bg-gray-800 text-white'>{feeTiktok10}%</div>
            <div className='text-xs font-bold underline'></div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Phone & Electronics</div>
              <div className='text-xs'>Camera Accessories, Camera Care, Film Cameras</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTiktokMerchant(feeTiktok10))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-gray-800 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTiktokMerchant(feeTiktok10)?.toLocaleString()}</div>

          </div>

        </div>





        <div className='border border-slate-600 rounded-lg p-2 mt-4'>

          <div className='text-center'>
          <div className="font-bold text-slate-600 text-xl" id="tiktokmall">Tiktok Mall</div>
          {/* <div className='text-xs text-gray-500'>Biaya Layanan Official Store 1.8% (Maksimal 50rb)</div>
          <div className='text-xs text-gray-500'>Biaya Layanan Pengiriman Official Store 2% (Maksimal 10rb)</div> */}

          </div>

          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-slate-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-slate-600 text-white'>{feeTiktok4}%</div>
            <div className='text-xs font-bold underline'>Phone & Electronics</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Cameras & Photography</div>
              <div className='text-xs'>Action Cameras, Drones & Accessories, DSLRs, Instant Cameras, Mirrorless Cameras, Point & Shoot Cameras, Security Cameras & SYstems, Video Camcorders</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Cameras & Photography</div>
              <div className='text-xs'>Camera Lenses</div>
            </div>

            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTiktokMall(feeTiktok4))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-slate-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTiktokMall(feeTiktok4)?.toLocaleString()}</div>

          </div>


          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-slate-600'>
            <div className='text-lg font-bold p-1 rounded-lg bg-slate-600 text-white'>{feeTiktok8c5}%</div>
            <div className='text-xs font-bold underline'>Phone & Electronics</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Phone & Electronics</div>
              <div className='text-xs'>Camera Accessories, Camera Care, Film Cameras</div>
            </div>


            <div className='bg-gray-200 text-gray-500 text-center font-bold rounded-md mt-2'>Potongan : Rp {((modal.price - hitungTiktokMall(feeTiktok8c5))- modal.basePrice)?.toLocaleString()}</div>
            <div className='bg-slate-600 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTiktokMall(feeTiktok8c5)?.toLocaleString()}</div>

          </div>

        </div>




      
      
      
      </div>
    );
}
