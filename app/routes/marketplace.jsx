import React, { useState } from 'react';
import { Accordion } from '~/components/Accordion';


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

    return (
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <h1>Marketplace Fee Checker</h1>

        <input
            className="w-full mb-4 rounded-lg"
            placeholder="Masukkan Harga Jual"
            name="price"
            value={formatValue(modal.price)}
            onChange={handleChange}
        />

        <input
            className="w-full mb-4 rounded-lg border"
            placeholder="Masukkan Harga Modal"
            name="basePrice"
            value={formatValue(modal.basePrice)}
            onChange={handleChange}
        />

        <h2>Margin Offline : {calculateDifference() !== 0 && 'Rp '}{calculateDifference().toLocaleString()}</h2>
      
        {/* <Accordion 
        title="14 Hari Tukar Baru" 
        content="Jaminan penukaran kembali jika barang yang diterima tidak sesuai / cacat produksi atau salah ukuran." 
        icon={(
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
        </svg>

        )}/> */}

        <div className='border rounded-md p-2'>

          <div className='text-center'>
          <div className="font-bold text-green-800">Tokopedia Official Store</div>

          <div className='text-xs text-gray-500'>Biaya Jasa Transaksi 1.8% (Maksimal 50rb)</div>
          <div className='text-xs text-gray-500'>Biaya Free Ongkir 4% (Maksimal 10rb)</div>
          </div>

          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-800'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-800 text-white'>{feeA}%</div>
            <div className='text-xs font-bold underline'>Kategori : Audio, Kamera & Elektronik Lainnya</div>
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
              <div className='text-xs font-bold mr-1'>Kamera Digital</div>
              <div className='text-xs'>Action Camera, Kamera 360, Kamera DSLR, Kamera Mirrorless, Kamera Pocket</div>
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

            <div className='bg-green-800 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(feeA)?.toLocaleString()}</div>

          </div>






          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-800'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-800 text-white'>{feeB}%</div>
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



            <div className='bg-green-800 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(feeB)?.toLocaleString()}</div>
          </div>




          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-800'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-800 text-white'>{feeC}%</div>
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



            <div className='bg-green-800 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(feeC)?.toLocaleString()}</div>
          </div>





          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-800'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-800 text-white'>{fee2c5}%</div>
            <div className='text-xs font-bold underline'>Kategori : Komputer & Laptop</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Memory Card</div>
              <div className='text-xs'>Case Memory Card, Compact Flash, Memory Card Adapter, Memory Stick Micro M2, Memory Stick Pro Duo, Memory Stick Pro-HG Duo</div>
            </div>

            <div className='bg-green-800 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(fee2c5)?.toLocaleString()}</div>
          </div>



          <div className='p-2 bg-slate-100 mt-4 rounded-md shadow-md'>
            
            <div className='flex items-center gap-2 text-green-800'>
            <div className='text-lg font-bold p-1 rounded-lg bg-green-800 text-white'>{fee4}%</div>
            <div className='text-xs font-bold underline'>Kategori : Komputer & Laptop</div>
            </div>

            <div className='flex flex-wrap items-center mt-2 lg:gap-2'>
              <div className='text-xs font-bold mr-1'>Memory Card</div>
              <div className='text-xs'>MicroSD Card, MiniSD Card, MMC, SD Card</div>
            </div>

            <div className='bg-green-800 text-white text-center font-bold rounded-md mt-2'>Margin : Rp {hitungTokopedia(fee4)?.toLocaleString()}</div>
          </div>

         





        </div>

      
      
      
      </div>
    );
}
