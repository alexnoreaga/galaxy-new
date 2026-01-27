import React from 'react'
import {useRef} from "react";
import {Await, useLoaderData, Link,useOutletContext} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';

import { HitunganPersen } from './HitunganPersen';


export const ProductFeatureHalDepan = ({products}) => {



  return (
    <div className="recommended-products text-gray-800">
      <h2 className='text-gray-900 text-sm sm:text-xl font-medium sm:font-semibold tracking-tight'>Produk Terbaru</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="flex gap-3 overflow-x-auto snap-x scroll-smooth">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="hover:no-underline border mb-2 bg-white shadow rounded-lg p-2"
                  to={`/products/${product.handle}`}
                >

                  <div className='relative w-32'>
                  <Image
                    data={product.images.nodes[0]}
                    alt={product.featuredImage.altText || product.title}
                    aspectRatio="1/1"
                    sizes="(min-width: 40em) 20vw, 50vw"
                    className="hover:opacity-80"
                  />

                  {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                  <div className="absolute p-1 rounded bg-gradient-to-r from-rose-500 to-rose-700 font-bold text-xs text-white top-1 right-0">Promo</div>
                  ) }
                  </div>  
           
                  <div className='text-sm my-1 text-gray-800'>{product?.title.length > 50 ? product?.title.substring(0, 50) + '...' : product.title}</div>

                  {/* <div>{parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount)}</div>
                  <div>{product.priceRange.minVariantPrice.amount}</div> */}
                  
                  {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                  <div className='text-sm  line-through text-gray-600'>
                    {/* <Money data={product.compareAtPriceRange?.minVariantPrice} /> */}
                    <div>Rp{parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount).toLocaleString("id-ID")}</div>                    
                  </div>
                  ) }
                  <div className='text-xs font-bold text-gray-800 flex flex-row items-center gap-1 mb-2 mt-2'>
                  {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                    <div className='bg-rose-700 p-0.5 ml-0 text-white text-xs rounded'><HitunganPersen hargaSebelum={product.compareAtPriceRange.minVariantPrice.amount} hargaSesudah={product.priceRange.minVariantPrice.amount}/></div> ) }

                    <div className={`text-sm font-semibold ${parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && 'text-rose-800'}`}>Rp{parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString("id-ID")}</div>

                  </div>
                  <div className='flex flex-col md:flex-row gap-2'>
                  {product.metafields[1]?.value.length > 0 && <span className='rounded-md m-auto ml-0 bg-sky-100 text-xs font-bold text-sky-800 p-1 px-2'>
                    Free Item
                  </span>}
                  </div>
                  
                 


                </Link>
              ))}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  )
}
