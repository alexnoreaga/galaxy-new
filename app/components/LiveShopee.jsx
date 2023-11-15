import React from 'react';

export const LiveShopee = () => {
    return(
        <>
        
        <a href="#" target="_blank" className='drop-shadow-sm text-white '>     
            <div className=' items-center bg-slate-100 rounded p-2 h-20 cursor-pointer font-semibold text-white text-center  flex flex-row gap-2'>
                <div className='absolute flex items-center ml-7'>
                <div className='animate-ping absolute left-2.5 w-9 h-9 inline-flex rounded-full  bg-gradient-to-r from-fuchsia-600 to-pink-600  opacity-75'></div>
                {/* <div className='absolute w-14 h-full animate-ping inline-flex rounded-full  bg-gradient-to-r from-fuchsia-600 to-pink-600  opacity-75'> */}
                    {/* </div> */}
                    <div className='relative bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-full m-auto  w-14 p-0.5'>
                        <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo_galaxy_profil.jpg?v=1699977908" alt="" className='relative rounded-full w-full h-auto'/>
                        <div className='absolute left-2 bottom-0 bg-gradient-to-r rounded from-fuchsia-600 to-pink-600 w-10 text-xs'>live</div>
                    </div>
                    </div> 

                    <div className='text-slate-900 m-auto'>Yuk tanya di LIVE Shopee</div>
                </div> 
          </a>
         
    
        </>
      )
}
