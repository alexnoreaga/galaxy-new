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
            <div className="flex gap-2 sm:gap-3 overflow-x-auto snap-x scroll-smooth">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="hover:no-underline border mb-1 sm:mb-2 bg-white shadow rounded-lg p-1 sm:p-2 w-28 sm:w-36 flex-shrink-0"
                  to={`/products/${product.handle}`}
                >
                  <div className='relative w-20 h-20 sm:w-28 sm:h-28 mx-auto'>
                    <Image
                      data={product.images.nodes[0]}
                      alt={product.featuredImage.altText || product.title}
                      aspectRatio="1/1"
                      sizes="(min-width: 40em) 20vw, 50vw"
                      className="hover:opacity-80 rounded-md"
                    />
                    {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                      <div className="absolute p-0.5 rounded bg-gradient-to-r from-rose-500 to-rose-700 font-bold text-[10px] sm:text-xs text-white top-1 right-0">Promo</div>
                    )}
                  </div>
                  <div className='text-xs sm:text-sm my-0.5 text-gray-800 text-center'>{product?.title.length > 40 ? product?.title.substring(0, 40) + '...' : product.title}</div>
                  {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                    <div className='text-xs sm:text-sm line-through text-gray-600 text-center'>
                      <div>Rp{parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount).toLocaleString("id-ID")}</div>
                    </div>
                  )}
                  <div className='text-xs font-bold text-gray-800 flex flex-row items-center gap-1 mb-1 mt-1 justify-center'>
                    {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                      <div className='bg-rose-700 p-0.5 ml-0 text-white text-[10px] sm:text-xs rounded'><HitunganPersen hargaSebelum={product.compareAtPriceRange.minVariantPrice.amount} hargaSesudah={product.priceRange.minVariantPrice.amount}/></div>
                    )}
                    <div className={`text-xs sm:text-sm font-semibold ${parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) ? 'text-rose-800' : 'text-sky-900'}`}>Rp{parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString("id-ID")}</div>
                  </div>
                  <div className='flex flex-col md:flex-row gap-1 sm:gap-2'>
                    {product.metafields[1]?.value.length > 0 && <span className='rounded-md m-auto ml-0 bg-sky-100 text-[10px] sm:text-xs font-bold text-sky-800 p-0.5 px-1 sm:p-1 sm:px-2'>
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
