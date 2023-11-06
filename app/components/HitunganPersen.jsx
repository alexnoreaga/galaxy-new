import React from 'react'

export const HitunganPersen = ({product}) => {
    console.log(product,'ini adalah produk')
  
    const hargaSebelum = product.compareAtPriceRange.minVariantPrice.amount
    const hargaSesudah = product.priceRange.minVariantPrice.amount
    const hargaFinal = (hargaSebelum - hargaSesudah ) / hargaSebelum * 100
  
    return(
      <div>{Math.round(hargaFinal)}%</div>
    )
}
