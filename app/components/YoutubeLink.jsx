import React from 'react';
import { ExternalVideo } from '@shopify/hydrogen';
import {Link} from '@remix-run/react';


export const YoutubeLink = () => {


  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 content-center items-center mb-6'>
      <iframe className="aspect-video w-full rounded-lg" width="560" height="auto" src="https://www.youtube.com/embed/6rnSZ_h9BvE?si=GEmiD6gPw03Nql9z" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      <div>
        <h2 className='md:text-4xl my-2 md:my-5'>Toko Kamera Terlengkap di Tangerang dan Depok</h2>
        <div className='text-sm md:text-base my-2 text-gray-500'>Harga termurah, Pelayanan terbaik dan Pengiriman ke seluruh Indonesia.</div>
        <Link to='/pages/tentang-kami'>
        <div className='bg-black m-auto md:m-0 w-32 text-sm md:text-base cursor-pointer text-white text-center p-2 rounded-md'>Tentang Kami</div>
        </Link>
      </div>
    </div>
  );
};