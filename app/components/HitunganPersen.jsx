import React from 'react'

export const HitunganPersen = ({hargaSebelum,hargaSesudah}) => {

    const hargaFinal = (hargaSebelum - hargaSesudah ) / hargaSebelum * 100
  
    return(
      <div>{Math.round(hargaFinal)}%</div>
    )
}
