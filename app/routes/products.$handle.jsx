import {useLoaderData,Link} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
// import {Image} from '@shopify/hydrogen-react';
import ProductOptions from '~/components/ProductOptions';
import {Image, Money, ShopPayButton} from '@shopify/hydrogen-react';
import {CartForm} from '@shopify/hydrogen';
import { ProductGallery } from '~/components/ProductGallery';
import React, { useEffect, useState, useRef } from 'react';
import ProductCard from '~/components/ProductCard';
import { Accordion } from '~/components/Accordion';
import { HitunganPersen } from '~/components/HitunganPersen';
import {InfoProduk} from '~/components/InfoProduk';
import {ParseSpesifikasi} from '~/components/ParseSpesifikasi';
import {LiveShopee} from '~/components/LiveShopee';
import { Modal } from '~/components/Modal';
import {AnalyticsPageType} from '@shopify/hydrogen';
import { ProdukRelated } from '~/components/ProdukRelated';
import { ProdukTebusMurah } from '~/components/ProdukTebusMurah';
import { ModalBalasCepat } from '~/components/ModalBalasCepat';
import { TombolBalasCepat } from '~/components/TombolBalasCepat';
import { FaSquareWhatsapp, FaWhatsapp } from "react-icons/fa6";
import { FaPhone } from "react-icons/fa6";
import { FaComment } from "react-icons/fa6";
import { FaBagShopping } from "react-icons/fa6";
import { FaShareFromSquare } from "react-icons/fa6";
import { FaLink } from "react-icons/fa6";
import {Await, useMatches} from '@remix-run/react';
import {Suspense} from 'react';




export const handle = {
  breadcrumbType: 'product',
};

export async function loader({params, context, request}) {

  const {session} = context;
  const customerAccessToken = await session.get('customerAccessToken');

  


    const {handle} = params;
    const searchParams = new URL(request.url).searchParams;
    const selectedOptions = [];

    
  
    // set selected options from the query string
    searchParams.forEach((value, name) => {
      selectedOptions.push({name, value});
    });
  
    const {shop, product} = await context.storefront.query(PRODUCT_QUERY, {
        variables: {
          handle,
          selectedOptions,
        },
      });

      // Run all non-critical queries in parallel using Promise.all()
      const [liveshopee, custEmail, admgalaxy, balasCepat, marketplace, discountVouchers, related] = await Promise.all([
        context.storefront.query(METAOBJECT_LIVE_SHOPEE, {
          variables: {
            type: "live_shopee",
            first: 4,
          },
        }),
        context.storefront.query(CUSTOMER_EMAIL_QUERY, {
          variables: {
            customertoken: customerAccessToken?.accessToken ? customerAccessToken.accessToken : '',
          },
        }),
        context.storefront.query(METAOBJECT_ADMIN_GALAXY, {
          variables: {
            type: "admin_galaxy",
            first: 20,
          },
        }),
        context.storefront.query(BALAS_CEPAT, {
          variables: {
            first: 20,
          },
        }),
        context.storefront.query(METAOBJECT_MARKETPLACE, {
          variables: {
            type: "marketplace",
            first: 10,
          },
        }),
        context.storefront.query(METAOBJECT_DISCOUNT_VOUCHERS, {
          variables: {
            type: "discount_voucher",
            first: 10,
          },
        }),
        context.storefront.query(PRODUK_RELATED, {
          variables: {
            productId: product?.id,
          },
        }),
      ]);

      // const tebusMurah = await context.storefront.query(TEBUS_MURAH, {
      //   variables: {
      //     productId: product?.id, // Value for the 'type' variable
      //   },
      // });

      const tebusMurah = product?.metafields[14]?.value
      let finalTebusMurah;

      if (tebusMurah){

        const dataArray = JSON.parse(tebusMurah);
        const hasilCekPromises = dataArray.map((item) => {
          return context.storefront.query(TEBUS_MURAH, {
            variables: {
              id: item,
            },
          });
        });
        
        const kumpulanTebusMurah = await Promise.all(hasilCekPromises);
        const tebusMurah2 =  kumpulanTebusMurah.map((item)=>{
          return context.storefront.query(TEBUS_MURAH_2,{
            variables:{
              id:item.metaobject?.fields[1]?.value
            }
          })



          
        })

        const hasilTebusMurah = await Promise.all(tebusMurah2);

        finalTebusMurah = [kumpulanTebusMurah,hasilTebusMurah]

      }else{
        finalTebusMurah = []
      }

      







        



    
    

      


      const canonicalUrl = request.url
    

      // Set a default variant so you always have an "orderable" product selected
      // variantBySelectedOptions returns null for out-of-stock variants in some API versions,
      // so fall back to manually matching from variants.nodes before defaulting to nodes[0]
      const selectedVariant =
        product.selectedVariant ??
        (selectedOptions.length > 0
          ? product?.variants?.nodes?.find((v) =>
              selectedOptions.every((opt) =>
                v.selectedOptions?.some(
                  (so) => so.name === opt.name && so.value === opt.value,
                ),
              ),
            )
          : null) ??
        product?.variants?.nodes[0];
      
      const brandValue = product.metafields[6]?.key == 'brand' && product.metafields[6].value

      if (brandValue) {
        
        const metaobject = await context.storefront.query(METAOBJECT_QUERY, {
          variables: {
            id: brandValue,
          },
        });

        return json({
          finalTebusMurah,
          balasCepat,
          custEmail,
          related,
          admgalaxy,
          shop,
          product,
          selectedVariant,
          metaobject,
          liveshopee,
          marketplace,
          discountVouchers,
          customerAccessToken,
          canonicalUrl,
          analytics: {
            pageType: AnalyticsPageType.product,
            products: [product],
          }
        });

      }else{
        console.error('Brand value not found.');

        return json({
          finalTebusMurah,
          balasCepat,
          custEmail,
          related,
          admgalaxy,
          shop,
          product,
          selectedVariant,
          liveshopee,
          marketplace,
          discountVouchers,
          customerAccessToken,
          canonicalUrl,
          analytics: {
            pageType: AnalyticsPageType.product,
            products: [product],
          }

        });


      }


  }

  const bungaHCI = 3.2
  const admKredivo = 2.6
  const adminFee3BulanKredivo = 3
  const adminKartuKredit6Bulan = 1.5
  const adminKartuKredit12Bulan = 3.5

  function mulaiDari(selectedVariant){
    let newHargaFinal = Number(parseFloat(selectedVariant.price.amount))
     // HITUNGAN KARTU KREDIT START HERE
     let biayaAdmKartuKredit12Bln = (adminKartuKredit12Bulan * newHargaFinal) / 100
     let cicilanKartuKredit12Bulan = (Math.ceil(((newHargaFinal + biayaAdmKartuKredit12Bln) / 12)/10)*10)
     return cicilanKartuKredit12Bulan
  }

  function cicilanKartuKredit(selectedVariant,product,canonicalUrl){
    let newHargaFinal = Number(parseFloat(selectedVariant.price.amount))
    // HITUNGAN KARTU KREDIT START HERE
    let biayaAdmKartuKredit6Bln = (adminKartuKredit6Bulan * newHargaFinal) / 100
    let biayaAdmKartuKredit12Bln = (adminKartuKredit12Bulan * newHargaFinal) / 100

    let cicilanKartuKredit3Bulan = (Math.ceil(newHargaFinal / 3))
    let cicilanKartuKredit6Bulan = (Math.ceil(((newHargaFinal + biayaAdmKartuKredit6Bln) / 6)/10)*10)
    let cicilanKartuKredit12Bulan = (Math.ceil(((newHargaFinal + biayaAdmKartuKredit12Bln) / 12)/10)*10)

    const hargaCash = `${product.title}${product?.selectedVariant?.title !== "Default Title" && product?.selectedVariant?.title !== undefined ? ' - ' + product?.selectedVariant?.title : ''}\n` +
    `${Number(parseFloat(selectedVariant?.price?.amount)) < Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) ? 'Harga Normal : Rp ' + parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")  + '\n' + 'Promo Diskon : Rp ' + (Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) - Number(parseFloat(selectedVariant?.price?.amount))).toLocaleString("id-ID") + '\n' + 'Harga Spesial : Rp ' + Number(parseFloat(selectedVariant?.price?.amount)).toLocaleString("id-ID") + '\n' : 'Harga : Rp ' + parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")+ '\n'}` +
    `${product?.metafields[1]?.value ? 'FREE : ' + product?.metafields[1].value + '\n' : ''}`+
    `${product?.metafields[0]?.value ? 'Garansi : ' + product?.metafields[0]?.value + ' ' + (product.vendor !== 'galaxy' && product.vendor) + '\n':''}`+
    `${product?.metafields[3]?.value ? 'Periode : ' + perubahTanggal(product.metafields[3]?.value) + ' - ' + perubahTanggal(product.metafields[4]?.value) + '\n':''}`+
    `Info Produk : ${canonicalUrl}`;


    if(parseFloat(selectedVariant.price.amount)>=500000){
      let listCicilan = `${hargaCash}

Cicilan Kartu Kredit (Via Blibli)
3x : ${cicilanKartuKredit3Bulan.toLocaleString("id-ID")}
6x : ${cicilanKartuKredit6Bulan.toLocaleString("id-ID")}
12x : ${cicilanKartuKredit12Bulan.toLocaleString("id-ID")}
  `
    return listCicilan
    
    }
    return 'Produk tidak dapat dicicil'
}


 


  function listAngsuran(product,selectedVariant,canonicalUrl){
    let newHargaFinal = Number(parseFloat(selectedVariant.price.amount))
    let bungaKredivo = (admKredivo * newHargaFinal) / 100 
    let adminFee3Bulan = (adminFee3BulanKredivo * newHargaFinal) / 100
    let cicilanKredivo3Bulan = Math.ceil(((newHargaFinal + adminFee3Bulan) / 3) / 10) * 10;
    let cicilanKredivo6Bulan = Math.ceil(((newHargaFinal / 6) + bungaKredivo) / 10) * 10;
    let cicilanKredivo12Bulan = Math.ceil(((newHargaFinal / 12) + bungaKredivo) / 10) * 10;

    let bungaHci = (bungaHCI * newHargaFinal) / 100;
    let cicilanHci6Bulan = Math.ceil(((newHargaFinal / 6) + bungaHci) / 10) * 10;
    let cicilanHci9Bulan = Math.ceil(((newHargaFinal / 9) + bungaHci) / 10) * 10;
    let cicilanHci12Bulan = Math.ceil(((newHargaFinal / 12) + bungaHci) / 10) * 10;
    let cicilanHci15Bulan = Math.ceil(((newHargaFinal / 15) + bungaHci) / 10) * 10;
    let cicilanHci18Bulan = Math.ceil(((newHargaFinal / 18) + bungaHci) / 10) * 10;

    // PROMO BUNGA RENDAH HOMECREDIT START HERE
    let biayaSubsidi5Bulan = ((5 * newHargaFinal) / 100) + 199000;
    let hargaProdukSetelahSubsidi = newHargaFinal + biayaSubsidi5Bulan
    let cicilanPromoHci5Bulan = (Math.ceil(((hargaProdukSetelahSubsidi / 5))  / 10) * 10)+8000;

    let biayaSubsidi8Bulan = ((6 * newHargaFinal) / 100) + 199000;
    let hargaProduk8BulanSetelahSubsidi = newHargaFinal + biayaSubsidi8Bulan
    let cicilanPromoHci8Bulan = (Math.ceil(((hargaProduk8BulanSetelahSubsidi / 8))  / 10) * 10)+8000;
    // PROMO BUNGA RENDAH HOMECREDIT END HERE

    
      
    const hargaCash = `${product.title}${product?.selectedVariant?.title !== "Default Title" && product?.selectedVariant?.title !== undefined ? ' - ' + product?.selectedVariant?.title : ''}\n` +
    `${Number(parseFloat(selectedVariant?.price?.amount)) < Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) ? 'Harga Normal : Rp ' + parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")  + '\n' + 'Promo Diskon : Rp ' + (Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) - Number(parseFloat(selectedVariant?.price?.amount))).toLocaleString("id-ID") + '\n' + 'Harga Spesial : Rp ' + Number(parseFloat(selectedVariant?.price?.amount)).toLocaleString("id-ID") + '\n' : 'Harga : Rp ' + parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")+ '\n'}` +
    `${product?.metafields[1]?.value ? 'FREE : ' + product?.metafields[1].value + '\n' : ''}`+
    `${product?.metafields[0]?.value ? 'Garansi : ' + product?.metafields[0]?.value + ' ' + (product.vendor !== 'galaxy' && product.vendor) + '\n':''}`+
    `${product?.metafields[3]?.value ? 'Periode : ' + perubahTanggal(product.metafields[3]?.value) + ' - ' + perubahTanggal(product.metafields[4]?.value) + '\n':''}`+
    `Info Produk : ${canonicalUrl}`;


      if(parseFloat(selectedVariant.price.amount)>=500000 && parseFloat(selectedVariant.price.amount)<1000000){
        let listCicilan = `${hargaCash}
Cicilan Tanpa Kartu Kredit
Estimasi Cicilan Kredivo
DP : 0
3X : ${cicilanKredivo3Bulan.toLocaleString("id-ID")}
6X : ${cicilanKredivo6Bulan.toLocaleString("id-ID")}
12X : ${cicilanKredivo12Bulan.toLocaleString("id-ID")}
`
      return listCicilan
      
      }else if (parseFloat(selectedVariant.price.amount)>=1000000){
      
          let listCicilan = `${hargaCash}

Cicilan Tanpa Kartu Kredit
Estimasi Cicilan Kredivo
DP : 0
3x : ${cicilanKredivo3Bulan.toLocaleString("id-ID")}
6x : ${cicilanKredivo6Bulan.toLocaleString("id-ID")}
12x : ${cicilanKredivo12Bulan.toLocaleString("id-ID")}
      
Estimasi Cicilan Homecredit
DP : 0
6x : ${cicilanHci6Bulan.toLocaleString("id-ID")}
9x : ${cicilanHci9Bulan.toLocaleString("id-ID")}
12x : ${cicilanHci12Bulan.toLocaleString("id-ID")}
15x : ${cicilanHci15Bulan.toLocaleString("id-ID")}
18x : ${cicilanHci18Bulan.toLocaleString("id-ID")}
    
Promo Bunga Rendah Homecredit (Gratis 1 Kali Cicilan)
DP : 0
6x : ${cicilanPromoHci5Bulan.toLocaleString("id-ID")} (Cukup Bayar 5x)
9x : ${cicilanPromoHci8Bulan.toLocaleString("id-ID")} (Cukup Bayar 8x)
`
    return listCicilan
      
      }
      return 'Produk tidak dapat dicicil'
  }
  
  




  const ImageGallery = ({ productData, selectedVariant }) => {
    const images = productData.images.edges.map((e) => e.node);

    // displayUrl is the source of truth for the main image
    // It is set directly from selectedVariant or from manual navigation
    const [displayUrl, setDisplayUrl] = useState(selectedVariant || images[0]?.src);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const touchStartXRef = useRef(null);
    const touchEndXRef = useRef(null);
    const thumbRef = useRef(null);

    // When variant changes from parent, show its image directly — no matching needed
    useEffect(() => {
      if (selectedVariant) {
        setIsTransitioning(true);
        setDisplayUrl(selectedVariant);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    }, [selectedVariant]);

    const goTo = (idx) => {
      setIsTransitioning(true);
      setDisplayUrl(images[idx]?.src);
      setTimeout(() => setIsTransitioning(false), 300);
      if (thumbRef.current) {
        const thumbEl = thumbRef.current.children[idx];
        if (thumbEl) thumbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    };

    const baseUrl = (url) => url?.split('?')[0];
    const currentIndex = images.findIndex((img) => baseUrl(img.src) === baseUrl(displayUrl));

    const goNext = () => {
      const nextIdx = currentIndex >= 0 ? (currentIndex + 1) % images.length : 0;
      goTo(nextIdx);
    };
    const goPrev = () => {
      const prevIdx = currentIndex >= 0 ? (currentIndex - 1 + images.length) % images.length : 0;
      goTo(prevIdx);
    };

    const handleTouchStart = (e) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchEndXRef.current = null;
    };
    const handleTouchMove = (e) => {
      touchEndXRef.current = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
      if (touchStartXRef.current === null || touchEndXRef.current === null) return;
      const dist = touchStartXRef.current - touchEndXRef.current;
      if (dist > 50) goNext();
      else if (dist < -50) goPrev();
      touchStartXRef.current = null;
      touchEndXRef.current = null;
    };

    const currentImg = { src: displayUrl, altText: productData?.title };

    const THUMBS_PER_PAGE = 4;
    const totalThumbPages = Math.ceil(images.length / THUMBS_PER_PAGE);
    const thumbPage = currentIndex >= 0 ? Math.floor(currentIndex / THUMBS_PER_PAGE) : 0;
    const visibleThumbs = images.slice(thumbPage * THUMBS_PER_PAGE, thumbPage * THUMBS_PER_PAGE + THUMBS_PER_PAGE);

    return (
      <div className="flex flex-col gap-2 select-none w-full md:max-w-xl md:mx-auto lg:max-w-2xl">

        {/* Main image */}
        <div
          className="relative w-full bg-white rounded-xl overflow-hidden"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="aspect-square w-full">
            <img
              src={currentImg?.src}
              alt={currentImg?.altText || productData?.title}
              loading="eager"
              decoding="async"
              width={600}
              height={600}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                isTransitioning ? 'opacity-40' : 'opacity-100'
              }`}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            />
          </div>

          {/* Prev / Next buttons — desktop only */}
          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Previous image"
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={goNext}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Next image"
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Counter badge — mobile only */}
          {images.length > 1 && currentIndex >= 0 && (
            <div className="md:hidden absolute bottom-2 right-2 bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full pointer-events-none">
              {currentIndex + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Thumbnail row — desktop only */}
        {images.length > 1 && (
          <div className="hidden md:flex items-center gap-2">
            {/* Prev thumb page */}
            <button
              onClick={() => goTo(Math.max(0, thumbPage * THUMBS_PER_PAGE - 1))}
              disabled={thumbPage === 0}
              aria-label="Previous thumbnails"
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* 4 thumbnails */}
            <div ref={thumbRef} className="flex gap-2 flex-1 py-1">
              {visibleThumbs.map((img, i) => {
                const realIdx = thumbPage * THUMBS_PER_PAGE + i;
                const isActive = realIdx === currentIndex;
                return (
                  <button
                    key={img.src}
                    onClick={() => goTo(realIdx)}
                    aria-label={`View image ${realIdx + 1}`}
                    className={`flex-1 aspect-square rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'ring-2 ring-rose-500 opacity-100'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={img.src}
                        alt={img.altText || productData?.title}
                        loading="lazy"
                        width={72}
                        height={72}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  </button>
                );
              })}
              {Array.from({ length: THUMBS_PER_PAGE - visibleThumbs.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1 aspect-square" />
              ))}
            </div>

            {/* Next thumb page */}
            <button
              onClick={() => goTo(Math.min(images.length - 1, (thumbPage + 1) * THUMBS_PER_PAGE))}
              disabled={thumbPage >= totalThumbPages - 1}
              aria-label="Next thumbnails"
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 bg-white disabled:opacity-30 hover:border-rose-400 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };


  export default function ProductHandle() {
    const {finalTebusMurah,balasCepat,custEmail,related,admgalaxy,canonicalUrl,customerAccessToken,shop, product, selectedVariant,metaobject,liveshopee,marketplace,discountVouchers} = useLoaderData();

    const [root] = useMatches();
    const cart = root.data?.cart;
  
    // const { cart, applyDiscount } = useCart();

    // console.log('cartttt',cart)

    // console.log(customerAccessToken)
    // console.log('produk ',finalTebusMurah)

    // if (finalTebusMurah.length > 0){
    //   console.log('Yes ada')
    // }else{
    //   console.log('Maaf tidak ada')
    // }
    
    // console.log('liveshopee',liveshopee)
    // console.log('marketplace',marketplace)

    const [bukaModalBalasCepat, setBukaModalBalasCepat] = useState(false)

    const foundAdmin = admgalaxy?.metaobjects?.edges.find(admin => admin?.node?.fields[0]?.value === custEmail?.customer?.email);
  // console.log('Admin ketemu ?', foundAdmin)



    // console.log(liveshopee.metaobjects?.edges[0]?.node)

    // console.log('Garansisssssssssssssssssssssssssss ',related)
    // console.log('Selected Variant ',selectedVariant?.image?.url)



    const [bukaModal, setBukaModal] = useState(false)

    const hargaCashCopy = `${product.title}${product?.selectedVariant?.title !== "Default Title" && product?.selectedVariant?.title !== undefined ? ' - ' + product?.selectedVariant?.title : ''}\n` +
      `${Number(parseFloat(selectedVariant?.price?.amount)) < Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) ? 'Harga Normal : Rp ' + parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")  + '\n' + 'Promo Diskon : Rp ' + (Number(parseFloat(selectedVariant?.compareAtPrice?.amount)) - Number(parseFloat(selectedVariant?.price?.amount))).toLocaleString("id-ID") + '\n' + 'Harga Spesial : Rp ' + Number(parseFloat(selectedVariant?.price?.amount)).toLocaleString("id-ID") + '\n' : 'Harga : Rp ' + parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")+ '\n'}` +
      `${product?.metafields[1]?.value ? 'FREE : ' + product?.metafields[1].value + '\n' : ''}`+
      `${product?.metafields[0]?.value ? 'Garansi : ' + product?.metafields[0]?.value + ' ' + (product.vendor !== 'galaxy' && product.vendor) + '\n':''}`+
      `${product?.metafields[3]?.value ? 'Periode : ' + perubahTanggal(product.metafields[3]?.value) + ' - ' + perubahTanggal(product.metafields[4]?.value) + '\n':''}`+
      `Info Produk : ${canonicalUrl}`;

      
    const copyToClipboard = (objekCopy) => {
      


      const textToCopy = objekCopy

      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      
      // Select and copy the text
      textArea.select();
      document.execCommand('copy');
      
      // Remove the temporary textarea
      document.body.removeChild(textArea);
    };
  




    return (
      <>
      {bukaModalBalasCepat&&<ModalBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} data={balasCepat?.metaobjects?.nodes}/>}

      <section className="lg:container mx-auto w-full gap-2 md:gap-2 grid px-0 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-2 lg:gap-2 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid md:grid-flow-row  md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full lg:col-span-2">
            <div className="md:col-span-2 md:w-full lg:w-full">
              
              <ImageGallery productData={product} selectedVariant={selectedVariant?.image?.url}/>
            </div>
          </div>
          <div>
          <div className="md:border md:shadow-xl rounded-lg md:mx-auto max-w-xl md:max-w-[26rem] grid gap-2 p-2 md:p-2 lg:p-4 md:px-2 ">


            <div className="grid gap-2 w-full">

              <h1 className="text-2xl md:text-4xl font-bold md:leading-10 mb-1 whitespace-normal mt-1 md:mt-5" onClick={()=>copyToClipboard(hargaCashCopy)}>
                {product.title} 
              </h1>

          {/* <Suspense fallback={<p>Loading cart ...</p>}>
                  <Await errorElement={<div>An error occurred</div>} resolve={cart}>
                    {(cart) => {
                      console.log("Resolved cart:", cart);
                      return <>Hello World</>;
                    }}
                  </Await>
                </Suspense> */}


              </div>

              {product?.metafields[12]?.value == "true" && (
                <div className='relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/60 shadow-xl'>
                  <div className='absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10'></div>
                  <div className='relative flex items-center gap-4 px-6 py-5'>
                    <div className='flex-shrink-0'>
                      <div className='w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-7 h-7">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4M12 8h.01"></path>
                        </svg>
                      </div>
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-sm font-bold text-white uppercase tracking-widest'>Produk Discontinued</h3>
                      <p className='text-xs text-slate-400 mt-1.5'>Produk ini tidak lagi tersedia untuk pembelian</p>
                    </div>
                  </div>
                </div>
              )}

<div className='flex flex-row gap-2 sm:mb-2 md:4'>
  {!product?.metafields[12]?.value && selectedVariant?.availableForSale && (
    <div className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-sm gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Stock Ready
    </div>
  )}
  {product.metafields[0]?.value && (
    <div className="inline-flex items-center px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold shadow-sm gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2 2 4-4" />
      </svg>
      Garansi Resmi
    </div>
  )}
</div>


 

          {product.metafields[1] && (
            <div className="rounded-lg text-sm mb-2 bg-gradient-to-br from-pink-100 via-indigo-50 to-white p-3 border border-pink-200 flex flex-col items-start shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500 via-indigo-500 to-sky-500 text-white shadow">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  FREE
                </span>
              </div>
              <div className="pl-1 text-[13px] text-gray-700">
                {product.metafields[1]?.value.split('\n').map(str => (
                  <div key={str}>{str}</div>
                ))}
              </div>
            </div>
          )}


           

            

                <div className='text-sm'>
                  {product.options[0].values.length > 1 && (
                  <ProductOptions
                    options={product.options}
                    selectedVariant={selectedVariant}
                    product={product}
                  />
                  )}
                  </div>
              
              
              {parseFloat(selectedVariant?.compareAtPrice?.amount) > parseFloat(selectedVariant.price.amount) && (
                <div className='flex flex-row items-center gap-2 mb-0'>
                <div className='bg-rose-700 p-1 ml-0 font-bold text-white text-xs rounded '><HitunganPersen hargaSebelum={selectedVariant.compareAtPrice.amount} hargaSesudah={selectedVariant.price.amount}/></div>
                  <div className="text-base line-through text-slate-600">Rp{parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")}</div>
                </div>
              )}

           

              <div onClick={()=>copyToClipboard(listAngsuran(product,selectedVariant,canonicalUrl))} className={` text-xl font-bold ${selectedVariant?.compareAtPrice?.amount ? 'text-rose-700' : 'text-rose-700'}`}>Rp{parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")} </div>


              {/* DISCOUNT VOUCHER SECTION */}
              <DiscountVoucherSection voucherData={discountVouchers} product={product} selectedVariant={selectedVariant} canonicalUrl={canonicalUrl} copyToClipboard={copyToClipboard} />

              {/* CICILAN MULAI DARI START */}

              <div className='hidden md:block'>

          <div className='text-sm text-gray-700 mt-3 mb-2'>Cicilan Mulai dari <span onClick={()=>copyToClipboard(cicilanKartuKredit(selectedVariant,product,canonicalUrl))} className='font-bold text-rose-700'>Rp{mulaiDari(selectedVariant).toLocaleString("id-ID")}</span> /bln. <span onClick={()=>setBukaModal(true)} className='font-bold cursor-pointer text-rose-700'>Lihat</span></div>

      </div>

  {/* CICILAN MULAI DARI END */}




  {product?.metafields[12]?.value == "true" && <TombolWaDiscontinue product={product} />}


    {liveshopee.metaobjects?.edges[0]?.node?.fields[1].value == 'true' && <LiveShopee url={liveshopee.metaobjects?.edges[0]?.node?.fields[0].value}/>}

  
    
  

    <div className='flex flex-col gap-2 mt-2'>

        {/* Marketplace */}
        <Accordion
          title="Belanja Lewat Marketplace ?"
          content={(<MarketPlace link={product.metafields}/>)}
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
            </svg>
          )}
        />

        {/* 14 Hari Tukar Baru — shield check icon */}
        <Accordion
          title="14 Hari Tukar Baru"
          content="Jaminan penukaran kembali jika barang yang diterima tidak sesuai / cacat produksi atau salah ukuran."
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          )}
        />

        {/* Pengadaan — building/office icon */}
        <Accordion
          title="Pengadaan Barang ?"
          content="Untuk kebutuhan pengadaan barang silahkan langsung kontak Sales Marketing kami di 0821-1131-1131"
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 000 1.5v16.5h-.75a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5h-.75V3.75a.75.75 0 000-1.5h-15zM9 6a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9zm-.75 3.75A.75.75 0 019 9h1.5a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM9 12a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9zm3.75-5.25A.75.75 0 0113.5 6H15a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM13.5 9a.75.75 0 000 1.5H15A.75.75 0 0015 9h-1.5zm-.75 3.75a.75.75 0 01.75-.75H15a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM9 19.5v-2.25a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-4.5A.75.75 0 019 19.5z" clipRule="evenodd" />
            </svg>
          )}
        />

    </div>





          </div>




          {product.metafields[2]?.value &&
          <div className='hidden border lg:block mx-auto w-full mt-2 lg:mr-7 sticky shadow-xl max-w-xl md:max-w-[26rem] rounded-lg md:sticky p-1 md:p-2 lg:p-4 md:px-2'>
            <div className='bg-gray-900 flex gap-1.5 justify-center text-white py-2.5 items-center font-semibold rounded-lg text-sm'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
              <span>Isi Dalam Box</span>
            </div>
            <ul
              onClick={() => copyToClipboard(product.metafields[2]?.value)}
              title="Klik untuk menyalin semua"
              className='mt-3 flex flex-col gap-1 cursor-pointer group'
            >
              {product.metafields[2]?.value.split('\n').filter(Boolean).map((str) => (
                <li key={str} className='flex items-start gap-2 text-sm text-gray-700 leading-tight px-1 py-0'>
                  <span className='mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0' />
                  <span>{str}</span>
                </li>
              ))}
              <div className='mt-2 flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-600 transition-colors px-1'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='w-3 h-3'>
                  <path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/>
                </svg>
                Klik untuk salin semua
              </div>
            </ul>
          </div>}
          




          </div>

          
          {finalTebusMurah.length>0 &&
            <div className='w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 pt-3 lg:col-span-2 rounded-md shadow-md mb-5'>
          <ProdukTebusMurah related={finalTebusMurah}/>
          </div>}
          
          


          

          
        </div>



        


            <div className='p-1 flex items-center gap-1.5'>
              <span className='text-xs text-gray-400 font-medium mr-1'>Share</span>

              {/* Copy link */}
              <button
                onClick={() => copyToClipboard(canonicalUrl)}
                title="Copy link"
                className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all active:scale-95'
              >
                <FaLink size={13} />
              </button>

              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${canonicalUrl}`}
                data-action="share/whatsapp/share"
                target="_blank"
                rel="noopener noreferrer"
                title="Share via WhatsApp"
                className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-[#25d366]/20 transition-all active:scale-95'
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='w-4 h-4'><path fill="#25d366" d="M92.1 254.6c0 24.9 7 49.2 20.2 70.1l3.1 5-13.3 48.6L152 365.2l4.8 2.9c20.2 12 43.4 18.4 67.1 18.4h.1c72.6 0 133.3-59.1 133.3-131.8c0-35.2-15.2-68.3-40.1-93.2c-25-25-58-38.7-93.2-38.7c-72.7 0-131.8 59.1-131.9 131.8zM274.8 330c-12.6 1.9-22.4 .9-47.5-9.9c-36.8-15.9-61.8-51.5-66.9-58.7c-.4-.6-.7-.9-.8-1.1c-2-2.6-16.2-21.5-16.2-41c0-18.4 9-27.9 13.2-32.3c.3-.3 .5-.5 .7-.8c3.6-4 7.9-5 10.6-5c2.6 0 5.3 0 7.6 .1c.3 0 .5 0 .8 0c2.3 0 5.2 0 8.1 6.8c1.2 2.9 3 7.3 4.9 11.8c3.3 8 6.7 16.3 7.3 17.6c1 2 1.7 4.3 .3 6.9c-3.4 6.8-6.9 10.4-9.3 13c-3.1 3.2-4.5 4.7-2.3 8.6c15.3 26.3 30.6 35.4 53.9 47.1c4 2 6.3 1.7 8.6-1c2.3-2.6 9.9-11.6 12.5-15.5c2.6-4 5.3-3.3 8.9-2s23.1 10.9 27.1 12.9c.8 .4 1.5 .7 2.1 1c2.8 1.4 4.7 2.3 5.5 3.6c.9 1.9 .9 9.9-2.4 19.1c-3.3 9.3-19.1 17.7-26.7 18.8zM448 96c0-35.3-28.7-64-64-64H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96zM148.1 393.9L64 416l22.5-82.2c-13.9-24-21.2-51.3-21.2-79.3C65.4 167.1 136.5 96 223.9 96c42.4 0 82.2 16.5 112.2 46.5c29.9 30 47.9 69.8 47.9 112.2c0 87.4-72.7 158.5-160.1 158.5c-26.6 0-52.7-6.7-75.8-19.3z"/></svg>
              </a>

              {/* Copy title */}
              <button
                onClick={() => copyToClipboard(product.title)}
                title="Copy product name"
                className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all active:scale-95'
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='w-3.5 h-3.5'><path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/></svg>
              </button>
            </div>




      
    <div className='p-1 text-sm flex flex-col md:flex-row sm:gap-8'>


        {metaobject?.metaobject?.field?.value &&
        <div className='flex flex-row gap-1 mb-1 pl-1'>
          <div className=' mr-3 '>Brand</div>
          <Link 
          to={`/brands/${metaobject.metaobject.field?.value}`}>
          <div className='font-bold text-slate-600'>{metaobject.metaobject.field?.value}</div>
          </Link>
        </div>
        }


        {product.metafields[0]?.value &&
        <div className='flex flex-row gap-1 mb-1 pl-1'>
          <div className=' mr-3 '>Garansi</div>
          <div className='font-bold text-slate-600'>Resmi {product.metafields[0]?.value} {product.vendor !== 'galaxy' && product.vendor}</div>
        </div>
      }

        {product.metafields[3]?.value &&
        <div className='flex flex-row gap-1 mb-1 pl-1'>
          <div className=' mr-3 '>Periode</div>
          <div className='font-bold text-slate-600'>{perubahTanggal(product.metafields[3]?.value)} - {perubahTanggal(product.metafields[4]?.value)}</div>
        </div>
        }



    </div>


 



{/* 
            <div className="w-full prose md:border-t md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/> */}


            {/* <div className="w-full prose md:border-t md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html:product.metafields[5]?.value }}/> */}
        <div>
        
        <div className='sm:grid sm:grid-cols-2 md:grid md:grid-cols-2'>

        
        <InfoProduk
        deskripsi={(<div className="w-full max-w-none prose prose-sm prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-4 prose-headings:mb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2 prose-li:text-gray-700 prose-li:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:my-4 prose-ul:my-2 prose-ol:my-2 pt-2"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/>)}

        isibox={product.metafields[2]?.value}
        specs={(<div className="w-full max-w-none prose prose-sm prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-strong:font-semibold prose-table:text-sm pt-2"
              dangerouslySetInnerHTML={{ __html:product.metafields[5]?.value }}/>)}
        />

          </div>



          
        </div>

        {/* <ParseSpesifikasi jsonString={product.metafields[5]?.value}/> */}
        


           




      {bukaModal&&<Modal 
      canonicalUrl={canonicalUrl} 
      perubahTanggal={perubahTanggal} 
      product={product} 
      selectedVariant={selectedVariant} 
      statusOpen={bukaModal} 
      setBukaModal={setBukaModal}
      bungaHCI={bungaHCI}
      admKredivo={admKredivo}
      adminFee3BulanKredivo={adminFee3BulanKredivo}
      adminKartuKredit6Bulan={adminKartuKredit6Bulan}
      adminKartuKredit12Bulan={adminKartuKredit12Bulan}
      />}
      
      <div className='mt-5 pt-5 font-bold border-t'>PRODUK SERUPA</div>

      {/* DESKTOP STICKY CHECKOUT START HERE */}

      {selectedVariant?.availableForSale 
        && product?.metafields[12]?.value != "true" 
         && (
      
      <div className='hidden md:flex fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]'>
        <div className='max-w-5xl mx-auto w-full px-4 md:px-8 py-3 flex items-center gap-6'>

          {/* Product info */}
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            {(selectedVariant?.image?.url || product?.featuredImage?.url) && (
              <img
                src={selectedVariant?.image?.url || product.featuredImage.url}
                alt={product.title}
                className='w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100'
              />
            )}
            <div className='min-w-0'>
              <p className='text-xs text-gray-500 truncate max-w-xs lg:max-w-sm'>{product.title}</p>
              <div className='flex items-baseline gap-2'>
                <span className='text-xl font-bold text-gray-900'>
                  Rp{parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")}
                </span>
                {parseFloat(selectedVariant?.compareAtPrice?.amount) > parseFloat(selectedVariant.price.amount) && (
                  <span className='text-sm text-gray-400 line-through'>
                    Rp{parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")}
                  </span>
                )}
                {parseFloat(selectedVariant?.compareAtPrice?.amount) > parseFloat(selectedVariant.price.amount) && (
                  <span className='text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded'>
                    -{Math.round((1 - parseFloat(selectedVariant.price.amount) / parseFloat(selectedVariant.compareAtPrice.amount)) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2.5 flex-shrink-0 ml-auto'>
            <a
              href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20"${product.title}"%20.%20Link%20Produk:%20" ${canonicalUrl}`}
              target="_blank"
              rel="noreferrer"
            >
              <button className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors whitespace-nowrap'>
                <FaWhatsapp className='text-base' />
                <span className='hidden lg:inline'>Order via WhatsApp</span>
                <span className='lg:hidden'>WhatsApp</span>
              </button>
            </a>

            <CartForm
              route="/cart"
              inputs={{ lines: [{ merchandiseId: selectedVariant.id }] }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <button
                  type="submit"
                  onClick={() => { window.location.href = window.location.href + '#cart-aside'; }}
                  disabled={!selectedVariant.availableForSale ?? fetcher.state !== 'idle'}
                  className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shadow-sm'
                >
                  <FaBagShopping className='text-base' />
                  {selectedVariant?.availableForSale ? 'Beli Sekarang' : 'Sold Out'}
                </button>
              )}
            </CartForm>
          </div>

        </div>
      </div>
    )}

        {/* DESKTOP STICKY CHECKOUT END HERE */}

      </section>

     

        <div className="mt-2 mb-5 relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">

        <ProdukRelated related={related}/>
        </div>

 
        {foundAdmin && <TombolBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} />}

        {/* BOTTOM CHECKOUT START HERE */}

        {selectedVariant?.availableForSale 
          && product?.metafields[12]?.value != "true" 
           && (
        
        <div className='md:hidden border-t gap-2 px-2 backdrop-blur-sm bg-white w-full h-16 fixed left-0 bottom-16 grid grid-cols-6 items-center justify-between'>
        
          <a className='col-span-1' href="tel:082111311131" target="_blank" >
          <button className='w-full col-span-1 bg-gray-200 text-center text-gray-800 p-1 px-2 rounded-lg h-10 flex items-center justify-center'>
          <FaPhone/>
          </button>
          </a>
        

          <a className='col-span-2' href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20"${product.title}"%20.%20Link%20Produk:%20" ${canonicalUrl}`} target="_blank" >
          <button className='flex justify-center gap-2 flex-row items-center col-span-2 font-semibold bg-gray-200 text-center text-gray-800 p-1 px-2 rounded-lg h-10 w-full'>
            <FaComment />
            <>Nego</>
          </button>
          </a>

          <div className='col-span-3'>
          <CartForm
            route="/cart"
            inputs={{
              lines: [
                {
                  merchandiseId: selectedVariant.id,
                },
              ],
            }}
            action={CartForm.ACTIONS.LinesAdd}
          >
          {(fetcher) => (

          <button 
            type="submit"
              onClick={() => {
                window.location.href = window.location.href + '#cart-aside';
              }}
              disabled={
                !selectedVariant.availableForSale ??
                fetcher.state !== 'idle'
              }
            className='flex justify-center gap-2 flex-row items-center col-span-3 font-semibold bg-gray-900 text-center text-white p-1 px-2 rounded-lg h-10 w-full'>
            <FaBagShopping />
            <span>
            {selectedVariant?.availableForSale
              ? 'Beli Langsung'
              : 'Sold out'}
              </span>
          </button>
        )}
        </CartForm>
        </div>
        </div>
      )}



          {/* BOTTOM CHECKOUT END HERE */}

      </>

    );
  }



function MarketPlace({link}){
  
  const {marketplace} = useLoaderData();
  return(
    <div className='flex flex-wrap gap-2'>
      {marketplace.metaobjects?.edges.map((item)=>{
        const linkS = item.node?.fields[1]?.value.toLowerCase()
        const linkTokopediaObject = link.find(item => item && item.key === linkS);
        {/* console.log('Hello workds',linkTokopediaObject?.value) */}
        return(
          <div key={item.node?.id} >
            <a href={linkTokopediaObject?.value ? linkTokopediaObject.value : item.node?.fields[2]?.value} target="_blank">
            <div>
              <img src={item.node?.fields[0]?.reference?.image?.url} alt={item.node?.fields[1]?.value} className='border p-1 h-9 w-auto rounded-md'/>
              {/* {linkTokopediaObject?.value ? linkTokopediaObject.value : item.node?.fields[2]?.value} */}
            </div>
            </a>
          </div>
        )
      })}
    </div>
  )
}

function DiscountVoucherSection({ voucherData, product, selectedVariant, canonicalUrl, copyToClipboard }) {
  const [copiedCode, setCopiedCode] = useState(null);

  const voucherArray = voucherData?.metaobjects?.edges?.map((edge) => {
    const fields = edge.node.fields;
    return {
      code: fields.find(f => f.key === 'code')?.value || '',
      discount: fields.find(f => f.key === 'discount_value')?.value || '',
      discountType: fields.find(f => f.key === 'discount_type')?.value || 'fixed',
      description: fields.find(f => f.key === 'description')?.value || '',
      minPurchase: fields.find(f => f.key === 'min_purchase')?.value || '',
      expiryDate: fields.find(f => f.key === 'expiry_date')?.value || '',
    };
  }) || [];

  const handleCopyCode = (code) => {
    copyToClipboard(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!voucherArray.length) return null;

  return (
    <div className='mt-3 mb-1'>
      {/* Header */}
      <div className='flex items-center gap-1.5 mb-2'>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-rose-500">
          <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path d="M6 6h.008v.008H6V6z" />
        </svg>
        <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Voucher Diskon</span>
      </div>

      <div className='flex flex-col gap-2'>
        {voucherArray.map((voucher, index) => (
          <div
            key={index}
            className='flex items-stretch rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm'
          >
            {/* Left: colored discount pill */}
            <div className='flex flex-col items-center justify-center bg-rose-500 px-3 py-3 min-w-[60px] text-white'>
              <span className='text-lg font-black leading-none'>
                {voucher.discountType === 'percentage'
                  ? `${voucher.discount}%`
                  : `Rp${parseFloat(voucher.discount).toLocaleString('id-ID')}`}
              </span>
              <span className='text-[9px] font-semibold uppercase tracking-widest opacity-80 mt-0.5'>OFF</span>
            </div>

            {/* Middle: code + desc */}
            <div className='flex-1 flex flex-col justify-center px-3 py-2.5 border-l border-dashed border-gray-300 min-w-0'>
              <div className='flex items-center gap-1.5 mb-0.5'>
                <span className='font-mono font-bold text-gray-900 text-sm tracking-wider'>{voucher.code}</span>
              </div>
              {voucher.description && (
                <p className='text-[11px] text-gray-500 leading-tight truncate'>{voucher.description}</p>
              )}
              {(voucher.minPurchase || voucher.expiryDate) && (
                <div className='flex items-center gap-2 mt-1'>
                  {voucher.minPurchase && (
                    <span className='text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded'>{voucher.minPurchase}</span>
                  )}
                  {voucher.expiryDate && (
                    <span className='text-[10px] text-gray-400'>
                      s/d {new Date(voucher.expiryDate).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: copy button */}
            <button
              onClick={() => handleCopyCode(voucher.code)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 text-[10px] font-bold border-l transition-all duration-200 active:scale-95 ${
                copiedCode === voucher.code
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
              }`}
            >
              {copiedCode === voucher.code ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-0.5">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                  Tersalin!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 mb-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  Salin
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}



  function perubahTanggal(tanggalInput){
    const inputDateString = tanggalInput;
    const date = new Date(inputDateString);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate
  }

function TombolWa({product,canonicalUrl}){
  // const infoChat = `Hi admin Galaxy saya berminat tentang produk ${namaProduk}. Boleh dibantu untuk info lebih lanjut`
  const namaProduk = product.title
  const urlProduk = product.handle


  return(
    <>
        <div className='text-sm text-gray-500 mt-3 mb-2'>Ingin harga best price dari kami? Yuk Negoin aja</div>
        <div className='gap-2 items-center border border-emerald-500 rounded-md p-2 cursor-pointer font-semibold text-center hover:font-bold'>
            <a href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20"${namaProduk}"%20.%20Link%20Produk:%20" ${canonicalUrl}`} target="_blank" rel="noopener noreferrer" className='drop-shadow-sm text-emerald-700 '>ORDER VIA WHATSAPP</a>
      </div>

     
    </>
  )
}

function TombolWaDiscontinue({product}){
  // const infoChat = `Hi admin Galaxy saya berminat tentang produk ${namaProduk}. Boleh dibantu untuk info lebih lanjut`
  const namaProduk = product.title
  const urlProduk = product.handle


  return(
    <>
    
        <div className='gap-2 items-center bg-gradient-to-r from-green-200 to-emerald-800 rounded p-2 cursor-pointer font-semibold text-white text-center'>
            <a href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20bertanya%20tentang%20produk%20pengganti%20"${namaProduk}"%20.%20Link%20Produk:%20" ${urlProduk}`} target="_blank" className='drop-shadow-sm text-white'>Chat Admin</a>
      </div>

     
    </>
  )
}



  const PRODUCT_QUERY = `#graphql
  query product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
    shop {
      primaryDomain {
        url
      }
    }

    


    product(handle: $handle) {
      images(first:10){
        edges{
          node{
            src
          }
        }
      }
 
      id
      title
      handle
      vendor
      description
      metafields(identifiers:[
        {namespace:"custom" key:"garansi"}
        {namespace:"custom" key:"free"}
        {namespace:"custom" key:"isi_dalam_box"}
        {namespace:"custom" key:"periode_promo"}
        {namespace:"custom" key:"periode_promo_akhir"}
        {namespace:"custom" key:"spesifikasi"}
        {namespace:"custom" key:"brand"}
        {namespace:"custom" key:"tokopedia"}
        {namespace:"custom" key:"shopee"}
        {namespace:"custom" key:"blibli"}
        {namespace:"custom" key:"bukalapak"}
        {namespace:"custom" key:"lazada"}
        {namespace:"custom" key:"produk_discontinue"}
        {namespace:"custom" key:"produk_serupa"}
        {namespace:"custom" key:"tebus_murah"}
      ]){
        key
        value
      }
      descriptionHtml
      featuredImage {
        id
        url
        altText
        width
        height
      }
      options {
        name,
        values
      }

      collections(first:1){
        nodes{
          title
          handle
        }
      }


      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }

      variants(first: 50) {
        nodes {
          id
          title
          image{
          url
          }
          availableForSale
          sku
          price {
            currencyCode
            amount
          }
          compareAtPrice {
            currencyCode
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

const METAOBJECT_QUERY = `#graphql
  query metaobject($id: ID!) {
    metaobject(id: $id) {
      field(key: "brand") {
        value
      }
      field(key: "brand") {
        value
      }
    }
  }
`;

const TEBUS_MURAH = `#graphql
query metaobject($id:ID!){

metaobject(id:$id) {
  id
  fields {
    value
  }
}


}`

const TEBUS_MURAH_2 = `#graphql
query product($id:ID!){

product(id:$id) {
    title

    priceRange{
      minVariantPrice{
        amount
      }
    }

  	featuredImage{
      url
    }
    handle
  }


}`




const METAOBJECT_LIVE_SHOPEE = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          value
        }
      }
    }
  }
}`;

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

const METAOBJECT_MARKETPLACE = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          value
          reference{
            ... on MediaImage {
           image {
             url
           }
         }
           }
        }
      }
    }
  }
}`;


const PRODUK_RELATED = `#graphql
query productRecommendations($productId:ID!){
productRecommendations(productId: $productId,intent: RELATED) {
    id
  	handle
  	title
  	compareAtPriceRange{
      minVariantPrice{
        amount
      }
    }
  	priceRange{
      minVariantPrice{
        amount
      }
    }
  	featuredImage {
      url
  	}
  }
}`;

const METAOBJECT_ADMIN_GALAXY = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          value
        }
      }
    }
  }
}`;


const CUSTOMER_EMAIL_QUERY = `#graphql
query CustomerEmailQuery($customertoken: String!) {
  customer(customerAccessToken: $customertoken) {
    email
  }
}`;


const BALAS_CEPAT = `#graphql
query BrandQuery($first:Int!){
    metaobjects(first:$first type:"balas_cepat"){
    nodes {
      id
      fields {
        value
        key
      }
    }
  }}
`





export const meta = ({data}) => {

  


  const today = new Date();
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const indonesianMonth = monthNames[today.getMonth()];
    const year = today.getFullYear();

  // Get the end of the current month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Format the end date as "YYYY-MM-DD"
  const endDateFormatted = endOfMonth.toISOString().split('T')[0];

  // OLD TITLE - Commented for future reference
  // const title = data?.product?.title + ' Harga Murah ' + indonesianMonth + ' ' +year

  // ENHANCED TITLE - Better SEO with brand and urgency
  const title = data?.product?.title + ' - Harga Terbaik ' + indonesianMonth + ' ' + year + ' | Galaxy Camera'

  // OLD DESCRIPTION - Commented for future reference
  // const deskripsiBaru =  'Beli ' + data?.product?.title + ' Harga Murah ' + indonesianMonth + ' ' +year + ' Gratis Ongkir, Cicilan 0%.'

  // ENHANCED DESCRIPTION - More compelling with trust signals
  const deskripsiBaru = '✓ Beli ' + data?.product?.title + ' Harga Terbaik ' + indonesianMonth + ' ' + year + 
    ' ✓ Gratis Ongkir ✓ Cicilan 0% ✓ Garansi Resmi ✓ Bergaransi ✓ Terpercaya sejak 2012'

  // ENHANCED KEYWORDS - Long-tail and variations
  const productKeywords = data?.product?.title + ', ' +
    data?.product?.title + ' murah, ' +
    data?.product?.title + ' original, ' +
    data?.product?.title + ' terbaik, ' +
    'beli ' + data?.product?.title + ', ' +
    data?.product?.title + ' jakarta, ' +
    data?.product?.title + ' tangerang, ' +
    (data?.metaobject?.metaobject?.field?.value || '') + ' camera'




  return [
    { title: title },
    {
      name: "title",
      content: title,
    },
    {
      name: "description",
      content: deskripsiBaru.substring(0, 160), // Extended to 160 chars for better SEO
    },
    {
      name: "keywords",
      content: productKeywords, // Enhanced keywords
    },





    {
      property: "og:title",
      content: title,
    },

    {
      property: "og:description",
      content: deskripsiBaru.substring(0, 155),
    },
    {
      property: "og:type",
      content: "product",
    },
    // ENHANCED - Added product-specific OG tags
    {
      property: "product:price:amount",
      content: data?.selectedVariant?.price?.amount,
    },
    {
      property: "product:price:currency",
      content: "IDR",
    },
    {
      property: "product:availability",
      content: data?.selectedVariant?.availableForSale ? "in stock" : "out of stock",
    },
    {
      property: "product:brand",
      content: data?.metaobject?.metaobject?.field?.value || "Galaxy Camera",
    },
    {
      property: "product:condition",
      content: "new",
    },
    {
      property: "og:site_name",
      content: "galaxy.co.id",
    },
    {
      property: "og:image",
      content: data?.product?.featuredImage?.url,
    },
    {
      property: "og:url",
      content: data.canonicalUrl,
    },

    // ENHANCED - Changed to summary_large_image for better display
    {
      property: "twitter:card",
      content: 'summary_large_image', // Changed from 'summary' to 'summary_large_image'
    },

    {
      property: "twitter:site",
      content: '@galaxycamera99', // Added @ prefix for proper Twitter handle
    },

    {
      property: "twitter:title",
      content: title,
    },

    {
      property: "twitter:description",
      content: deskripsiBaru.substring(0, 160), // Extended to 160 chars
    },

    {
      property: "twitter:image",
      content: data?.product?.featuredImage?.url,
    },


    {
      name: "mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "apple-touch-fullscreen",
      content: "yes",
    },
    {
    name: "apple-mobile-web-app-title",
    content: "Galaxy Camera",
  },
  {
    name: "apple-mobile-web-app-capable",
    content: "yes",
  },
  {
    name: "apple-mobile-web-app-status-bar-style",
    content: "default",
  },

  { tagName:'link',
  rel:'canonical',
  href: data.canonicalUrl
},

// PRODUCT SCHEMA - Keep existing Product schema
{
  "script:ld+json": {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": data?.product?.title,
    "image": data?.product?.images.edges[0].node.src,
    "description": data?.product?.description,
    "sku": data?.selectedVariant?.sku,
    "mpn": data?.selectedVariant?.sku,
    "brand": {
      "@type": "Brand",
      "name": data?.metaobject?.metaobject?.field?.value || "Galaxy Camera"
    },
    "review": {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 5,
        "bestRating": 5
      },
      "author": {
        "@type": "Person",
        "name": "Sistiana"
      },
      // ENHANCED - Added review body
      "reviewBody": "Pelayanan cepat dan produk original. Sangat puas berbelanja di Galaxy Camera!"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 5,
      "reviewCount": 1
    },
    "offers": {
      "@type": "Offer",
      "price":data?.selectedVariant?.price?.amount && parseInt(data?.selectedVariant?.price?.amount,10).toString(),
      "url":data.canonicalUrl,
      "availability":data?.selectedVariant?.availableForSale? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceCurrency": "IDR",
      "priceValidUntil": endDateFormatted,
      // ENHANCED - Added seller info
      "seller": {
        "@type": "Organization",
        "name": "PT Galaxy Digital Niaga"
      },
      "itemCondition": "https://schema.org/NewCondition",
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnPolicyUrl": "https://galaxy.co.id/policies/refund-policy",
        "applicableCountry": "ID"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "IDR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          }
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "ID"
        }
      }
    }
  },
},

// NEW - LOCAL BUSINESS SCHEMA for Local SEO
{
  "script:ld+json": {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Galaxy Camera - PT Galaxy Digital Niaga",
    "image": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png?v=1731132105",
    "@id": "https://galaxy.co.id",
    "url": "https://galaxy.co.id",
    "telephone": "+62-821-1131-1131",
    "email": "sales@galaxy.co.id",
    "priceRange": "$$",
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": "Ruko Mall Metropolis Town Square, Blok GM3 No.6",
        "addressLocality": "Kelapa Indah",
        "addressRegion": "Tangerang",
        "postalCode": "15810",
        "addressCountry": "ID"
      },
      {
        "@type": "PostalAddress",
        "streetAddress": "Mall Depok Town Square, Lantai 2 Blok SS2 No.8",
        "addressLocality": "Beji",
        "addressRegion": "Depok",
        "postalCode": "16421",
        "addressCountry": "ID"
      }
    ],
    "geo": [
      {
        "@type": "GeoCoordinates",
        "latitude": -6.2088,
        "longitude": 106.6408
      },
      {
        "@type": "GeoCoordinates",
        "latitude": -6.3914,
        "longitude": 106.8317
      }
    ],
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "10:00",
      "closes": "19:00"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+62-821-1131-1131",
      "contactType": "customer service",
      "email": "sales@galaxy.co.id",
      "areaServed": "ID",
      "availableLanguage": ["Indonesian", "English"]
    },
    "sameAs": [
      "https://www.instagram.com/galaxycamera99",
      "https://www.facebook.com/galaxycamera99",
      "https://www.tiktok.com/@galaxycameraid",
      "https://www.youtube.com/@galaxycamera",
      "https://twitter.com/galaxycamera99"
    ],
    "paymentAccepted": "Cash, Credit Card, Debit Card, Bank Transfer, Kredivo, Home Credit, Gopay, OVO, Dana, ShopeePay",
    "currenciesAccepted": "IDR",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": -6.2088,
        "longitude": 106.8456
      },
      "geoRadius": "100000"
    }
  }
},


  ];
};





