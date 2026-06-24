import {useLoaderData,Link,useNavigate,useSearchParams} from '@remix-run/react';
import {defer} from '@shopify/remix-oxygen';
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
import {PertanyaanUmum} from '~/components/PertanyaanUmum';
import {ParseSpesifikasi} from '~/components/ParseSpesifikasi';
import {LiveShopee} from '~/components/LiveShopee';
import { Modal } from '~/components/Modal';
import { WishlistButton } from '~/components/WishlistButton';
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

// Skip full loader re-run when only variant search params change (same product)
export function shouldRevalidate({currentUrl, nextUrl, defaultShouldRevalidate}) {
  if (currentUrl.pathname === nextUrl.pathname) return false;
  return defaultShouldRevalidate;
}

export async function loader({params, context, request}) {

  const {session} = context;
  const customerAccessToken = await session.get('customerAccessToken');

  const {handle} = params;
  const searchParams = new URL(request.url).searchParams;
  const selectedOptions = [];
  searchParams.forEach((value, name) => {
    selectedOptions.push({name, value});
  });

  const canonicalUrl = request.url;
  const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

  let productReviews = [];
  let soldCount = 0;

  // Start non-critical queries immediately — do NOT block on them
  const liveshopeePromise = context.storefront.query(METAOBJECT_LIVE_SHOPEE, {
    variables: { type: 'live_shopee', first: 4 },
  });
  const discountVouchersPromise = context.storefront.query(METAOBJECT_DISCOUNT_VOUCHERS, {
    variables: { type: 'discount_voucher', first: 10 },
  });

  // ROUND 1 — critical data only (blocks first byte)
  const [
    {shop, product},
    custEmail,
    admgalaxy,
    balasCepat,
    marketplace,
  ] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: { handle, selectedOptions },
    }),
    context.storefront.query(CUSTOMER_EMAIL_QUERY, {
      variables: { customertoken: customerAccessToken?.accessToken || '' },
    }),
    context.storefront.query(METAOBJECT_ADMIN_GALAXY, {
      variables: { type: "admin_galaxy", first: 20 },
    }),
    context.storefront.query(BALAS_CEPAT, {
      variables: { first: 20 },
    }),
    context.storefront.query(METAOBJECT_MARKETPLACE, {
      variables: { type: "marketplace", first: 10 },
    }),
    fetch(
      `${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'reviews' }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  { fieldFilter: { field: { fieldPath: 'productHandle' }, op: 'EQUAL', value: { stringValue: handle } } },
                  { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } },
                ],
              },
            },
            limit: 50,
          },
        }),
      }
    ).then(async res => {
      if (!res.ok) return;
      const reviewData = await res.json();
      productReviews = (reviewData || [])
        .filter(r => r.document)
        .map(r => {
          const f = r.document.fields || {};
          return {
            id: r.document.name.split('/').pop(),
            customerName: f.customerName?.stringValue || '',
            rating: parseInt(f.rating?.integerValue || 5),
            reviewText: f.reviewText?.stringValue || '',
            verifiedPurchase: f.verifiedPurchase?.booleanValue || false,
            source: f.source?.stringValue || 'online',
            photoUrl: f.photoUrl?.stringValue || '',
            photoUrls: (f.photoUrls?.arrayValue?.values || []).map(v => v.stringValue).filter(Boolean),
            createdAt: f.createdAt?.stringValue || '',
          };
        })
        .filter(r => r.customerName && r.reviewText)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }).catch(() => {}),
    fetch(`${FIRESTORE_BASE}/sold_counts/${handle}?key=${FIRESTORE_KEY}`)
      .then(async res => {
        if (!res.ok) return;
        const doc = await res.json();
        soldCount = parseInt(doc.fields?.count?.integerValue || 0);
      }).catch(() => {}),
  ]);

  const productNumId = product?.id?.split('/').pop();
  const brandValue = product.metafields[6]?.key == 'brand' && product.metafields[6].value;
  const tebusMurahRaw = product?.metafields[14]?.value;

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

  // ROUND 2 — deferred promises, depend on product.id but do NOT block the response
  const relatedPromise = context.storefront.query(PRODUK_RELATED, { variables: { productId: product?.id } });

  const metaobjectPromise = brandValue
    ? context.storefront.query(METAOBJECT_QUERY, { variables: { id: brandValue } })
    : Promise.resolve(null);

  const cachedFaqsPromise = fetch(`${FIRESTORE_BASE}/product_faqs/faq_${productNumId}?key=${FIRESTORE_KEY}`)
    .then(async res => {
      if (!res.ok) return null;
      const faqDoc = await res.json();
      const faqValues = faqDoc.fields?.faqs?.arrayValue?.values || [];
      const parsed = faqValues.map(item => ({
        question: item.mapValue?.fields?.question?.stringValue || '',
        answer: item.mapValue?.fields?.answer?.stringValue || '',
      })).filter(f => f.question && f.answer);
      return parsed.length ? parsed : null;
    }).catch(() => null);

  // tebusMurah is the slowest (sequential Shopify calls) — always deferred
  const tebusMurahPromise = (async () => {
    if (!tebusMurahRaw) return [];
    const dataArray = JSON.parse(tebusMurahRaw);
    const kumpulanTebusMurah = await Promise.all(
      dataArray.map(item => context.storefront.query(TEBUS_MURAH, { variables: { id: item } }))
    );
    const hasilTebusMurah = await Promise.all(
      kumpulanTebusMurah.map(item =>
        context.storefront.query(TEBUS_MURAH_2, { variables: { id: item.metaobject?.fields[1]?.value } })
      )
    );
    return [kumpulanTebusMurah, hasilTebusMurah];
  })();

  return defer({
    // Critical — resolved before first byte
    balasCepat,
    custEmail,
    admgalaxy,
    shop,
    product,
    selectedVariant,
    marketplace,
    customerAccessToken,
    canonicalUrl,
    productReviews,
    soldCount,
    analytics: {
      pageType: AnalyticsPageType.product,
      products: [product],
    },
    // Deferred — stream in after page renders
    related: relatedPromise,
    metaobject: metaobjectPromise,
    liveshopee: liveshopeePromise,
    discountVouchers: discountVouchersPromise,
    cachedFaqs: cachedFaqsPromise,
    finalTebusMurah: tebusMurahPromise,
  });

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
  
  




  const ImageGallery = ({ productData, selectedVariant, wishlistHandle, wishlistTitle, wishlistImage, wishlistPrice, wishlistEmail }) => {
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

          {/* Wishlist button — top right */}
          <div className="absolute top-3 right-3 z-10 shadow-md rounded-full">
            <WishlistButton
              handle={wishlistHandle}
              title={wishlistTitle}
              image={wishlistImage}
              price={wishlistPrice}
              customerEmail={wishlistEmail}
            />
          </div>

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


  const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
  const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

  function StarRating({ value, onChange, size = 'md' }) {
    const s = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map(star => (
          <button key={star} type="button" onClick={() => onChange?.(star)} className={`${s} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}>
            <svg viewBox="0 0 20 20" fill={star <= value ? '#f59e0b' : '#e5e7eb'} xmlns="http://www.w3.org/2000/svg">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        ))}
      </div>
    );
  }

  const STORAGE_BUCKET = 'galaxypwa.firebasestorage.app';
  const STORAGE_API_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';

  async function compressImage(file, maxWidth = 800, quality = 0.82) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(file);
      reader.onload = (e) => {
        const img = new window.Image();
        img.onerror = () => resolve(file);
        img.onload = () => {
          try {
            const ratio = Math.min(maxWidth / img.width, 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(file); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
          } catch (_) {
            resolve(file);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadPhoto(file) {
    const compressed = await compressImage(file);
    const filename = `reviews/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const encoded = encodeURIComponent(filename);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let res;
    try {
      res = await fetch(
        `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?name=${encoded}&key=${STORAGE_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: compressed, signal: controller.signal }
      );
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error('Upload gagal');
    return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encoded}?alt=media`;
  }

  function ReviewSection({ product, initialReviews }) {
    const [reviews, setReviews] = useState(initialReviews || []);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [name, setName] = useState('');
    const [text, setText] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [expandedPhoto, setExpandedPhoto] = useState(null);

    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
    const source = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('source');

    async function handlePhotoChange(e) {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length) return;
      const remaining = 3 - photoFiles.length;
      const toAdd = files.slice(0, remaining);
      for (const file of toAdd) {
        if (file.size > 10 * 1024 * 1024) { setError('Foto maksimal 10MB per gambar.'); return; }
      }
      const previews = await Promise.all(toAdd.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      })));
      const valid = toAdd.map((f, i) => ({ file: f, preview: previews[i] })).filter(x => x.preview);
      setPhotoFiles(prev => [...prev, ...valid.map(x => x.file)]);
      setPhotoPreviews(prev => [...prev, ...valid.map(x => x.preview)]);
      setError('');
    }

    function removePhoto(idx) {
      setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
      setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
    }

    async function handleVerifyOrder() {
      if (!orderNumber.trim()) return;
      setVerifying(true);
      try {
        const fd = new FormData();
        fd.append('orderNumber', orderNumber);
        const res = await fetch('/api/verify-order', { method: 'POST', body: fd });
        const data = await res.json();
        setVerified(data.verified);
        if (!data.verified) setError('Nomor order tidak ditemukan. Review tetap bisa dikirim tanpa badge terverifikasi.');
        else setError('');
      } catch (_) {}
      setVerifying(false);
    }

    async function handleSubmit(e) {
      e.preventDefault();
      if (!name.trim() || !text.trim()) { setError('Nama dan review wajib diisi.'); return; }
      if (text.trim().length < 10) { setError('Review terlalu singkat.'); return; }
      setSubmitting(true);
      setError('');
      try {
        let photoUrls = [];
        if (photoFiles.length > 0) {
          setUploading(true);
          try {
            photoUrls = await Promise.all(photoFiles.map(f => uploadPhoto(f)));
          } catch (_) {
            setError('Gagal upload foto. Coba lagi atau kirim tanpa foto.');
            setSubmitting(false);
            setUploading(false);
            return;
          }
          setUploading(false);
        }
        const fd = new FormData();
        fd.append('productHandle', product.handle);
        fd.append('productTitle', product.title);
        fd.append('customerName', name.trim());
        fd.append('rating', String(rating));
        fd.append('reviewText', text.trim());
        fd.append('orderNumber', orderNumber.trim());
        fd.append('verifiedPurchase', String(verified));
        fd.append('source', source === 'toko' ? 'toko' : 'online');
        fd.append('photoUrls', JSON.stringify(photoUrls));
        const res = await fetch('/api/submit-review', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || data.error) { setError(data.error || 'Gagal mengirim review.'); setSubmitting(false); return; }
        setSubmitted(true);
        setShowForm(false);
      } catch (_) {
        setError('Terjadi kesalahan. Coba lagi.');
      }
      setSubmitting(false);
    }

    return (
      <>
      <div className="mt-8 border-t pt-6" id="review">
        {/* JSON-LD Review schema for Google */}
        {reviews.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: avg,
              reviewCount: reviews.length,
              bestRating: '5',
              worstRating: '1',
            },
            review: reviews.slice(0, 5).map(r => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.customerName },
              reviewRating: { '@type': 'Rating', ratingValue: String(r.rating) },
              reviewBody: r.reviewText,
              datePublished: r.createdAt?.split('T')[0] || '',
            })),
          })}} />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900">Ulasan Pelanggan</h2>
            {avg && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <StarRating value={Math.round(parseFloat(avg))} />
                <span className="text-sm font-semibold text-gray-700">{avg}</span>
                <span className="text-xs text-gray-400">({reviews.length})</span>
              </div>
            )}
          </div>
          {!submitted && (
            <button onClick={() => setShowForm(f => !f)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: showForm ? '#f3f4f6' : '#111827', color: showForm ? '#374151' : '#ffffff' }}>
              {showForm ? 'Batal' : '+ Ulasan'}
            </button>
          )}
        </div>

        {/* Success message */}
        {submitted && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-medium">
            Terima kasih! Ulasan Anda sedang ditinjau dan akan tampil setelah disetujui.
          </div>
        )}

        {/* Review Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800 mb-3">Tulis Ulasan untuk {product.title}</p>

            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Rating</p>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Nama Anda</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
            </div>

            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Ulasan</label>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Ceritakan pengalaman Anda dengan produk ini..." required rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none" />
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Nomor Order (opsional — untuk badge Pembelian Terverifikasi)</label>
              <div className="flex gap-2">
                <input value={orderNumber} onChange={e => { setOrderNumber(e.target.value); setVerified(false); }} placeholder="#12345"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                <button type="button" onClick={handleVerifyOrder} disabled={verifying || !orderNumber.trim()}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  {verifying ? '...' : verified ? '✓ Terverifikasi' : 'Verifikasi'}
                </button>
              </div>
              {verified && <p className="text-xs text-green-600 mt-1">✓ Pembelian terverifikasi</p>}
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Foto Produk (opsional, maks 3 foto, 10MB per foto)</label>
              <div className="flex items-center gap-2 flex-wrap">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} alt={`preview ${idx + 1}`} className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
                    <button type="button" onClick={() => removePhoto(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors">
                      ×
                    </button>
                  </div>
                ))}
                {photoFiles.length < 3 && (
                  <label className="flex flex-col items-center justify-center gap-1 cursor-pointer h-20 w-20 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-[10px]">{photoPreviews.length === 0 ? 'Tambah Foto' : 'Tambah Lagi'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} multiple />
                  </label>
                )}
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button type="submit" disabled={submitting || uploading}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {uploading ? `Mengupload foto (${photoFiles.length})...` : submitting ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
          </form>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Belum ada ulasan. Jadilah yang pertama!</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {reviews.map(r => (
              <div key={r.id} className="py-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{r.customerName}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating value={r.rating} />
                      {r.verifiedPurchase && (
                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">✓ Terverifikasi</span>
                      )}
                      {!r.verifiedPurchase && r.source === 'toko' && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">🏪 Pembeli Toko</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">{r.reviewText}</p>
                {(r.photoUrls?.length > 0 || r.photoUrl) && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(r.photoUrls?.length > 0 ? r.photoUrls : [r.photoUrl]).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`foto review ${i + 1}`}
                        className="h-24 w-24 rounded-lg object-cover cursor-pointer active:opacity-75 transition-opacity"
                        loading="lazy"
                        decoding="async"
                        onClick={() => setExpandedPhoto(url)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setExpandedPhoto(null)}
        >
          <img src={expandedPhoto} alt="foto ulasan" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
      </>
    );
  }

  function BandingkanModal({ productA, onClose }) {
    const navigate = useNavigate();
    const [allowedCollections, setAllowedCollections] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(null);
    const [comparing, setComparing] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
      async function fetchConfig() {
        try {
          const res = await fetch(`${FIRESTORE_BASE}/perbandingan_config/settings?key=${FIRESTORE_KEY}`);
          if (res.ok) {
            const data = await res.json();
            const raw = data?.fields?.allowedCollections?.stringValue;
            if (raw) setAllowedCollections(JSON.parse(raw));
          }
        } catch (_) {}
        setLoadingConfig(false);
      }
      fetchConfig();
    }, []);

    async function search(val) {
      if (!val.trim()) { setResults([]); return; }
      setSearching(true);
      try {
        let products = [];
        if (allowedCollections && allowedCollections.length > 0) {
          const fetches = allowedCollections.map(col => {
            const fd = new FormData();
            fd.append('q', val);
            fd.append('collection', col.handle);
            return fetch('/api/collection-search', { method: 'POST', body: fd })
              .then(r => r.json()).then(d => d.products || []).catch(() => []);
          });
          const arrays = await Promise.all(fetches);
          const seen = new Set();
          products = arrays.flat().filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }).slice(0, 8);
        } else {
          const fd = new FormData();
          fd.append('q', val);
          fd.append('limit', '8');
          fd.append('type', 'PRODUCT');
          const res = await fetch('/api/predictive-search', { method: 'POST', body: fd });
          const data = await res.json();
          products = data.searchResults?.results?.find(r => r.type === 'products')?.items || [];
        }
        setResults(products.filter(p => p.handle !== productA.handle));
      } catch (_) {}
      setSearching(false);
    }

    function handleInput(e) {
      const val = e.target.value;
      setQuery(val);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(val), 300);
    }

    async function handleCompare() {
      if (!selected) return;
      setComparing(true);
      const slug = [productA.handle, selected.handle].sort().join('-vs-');
      try {
        const res = await fetch(`${FIRESTORE_BASE}/comparisons/${slug}?key=${FIRESTORE_KEY}`);
        if (res.ok) {
          const doc = await res.json();
          if (doc.fields?.article?.stringValue) {
            navigate(`/perbandingan/${slug}`);
            return;
          }
        }
      } catch (_) {}
      navigate('/perbandingan', {
        state: {
          autoProductA: productA,
          autoProductB: selected,
          autoCompare: true,
        },
      });
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Bandingkan dengan</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-1">{productA.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={handleInput}
              placeholder={loadingConfig ? 'Memuat...' : 'Cari produk untuk dibandingkan...'}
              disabled={loadingConfig}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 pr-10"
            />
            {searching && (
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>

          {selected ? (
            <div className="flex items-center gap-3 border border-blue-200 bg-blue-50 rounded-xl p-3 mb-4">
              {selected.image?.url && <img src={selected.image.url} alt={selected.title} className="w-12 h-12 object-contain rounded-lg bg-white flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{selected.title}</p>
                {selected.productType && <p className="text-xs text-gray-400 mt-0.5">{selected.productType}</p>}
              </div>
              <button onClick={() => { setSelected(null); setQuery(''); setResults([]); }} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          ) : results.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-4 shadow-sm">
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setResults([]); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  {p.image?.url && <img src={p.image.url} alt={p.title} className="w-10 h-10 object-contain rounded-lg bg-gray-50 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.title}</p>
                    {p.productType && <p className="text-xs text-gray-400 mt-0.5">{p.productType}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={!selected || comparing}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {comparing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Mengecek...
              </>
            ) : (
              'Bandingkan Sekarang'
            )}
          </button>
        </div>
      </div>
    );
  }

  export default function ProductHandle() {
    const {finalTebusMurah,balasCepat,custEmail,related,admgalaxy,canonicalUrl,customerAccessToken,shop, product, selectedVariant: loaderVariant,metaobject,liveshopee,marketplace,discountVouchers,cachedFaqs,productReviews,soldCount} = useLoaderData();

    // Compute selected variant from URL params — all 50 variants are already in product.variants.nodes
    // so this is instant, no server call needed on variant switch
    const [searchParams] = useSearchParams();
    const selectedVariant = (() => {
      const opts = [];
      searchParams.forEach((value, name) => opts.push({name, value}));
      if (!opts.length) return loaderVariant;
      return product.variants.nodes.find(v =>
        opts.every(opt => v.selectedOptions.some(so => so.name === opt.name && so.value === opt.value))
      ) ?? loaderVariant;
    })();

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
    const [bukaModalBandingkan, setBukaModalBandingkan] = useState(false)

    // Affiliate — read from localStorage (set by account.affiliate.jsx after approval)
    const [affiliateRef, setAffiliateRef] = useState(null);
    const [affiliateIsApproved, setAffiliateIsApproved] = useState(false);
    const [affiliateLinkCopied, setAffiliateLinkCopied] = useState(false);
    useEffect(() => {
      if (!custEmail?.customer?.email) return;
      const ref = localStorage.getItem('galaxy_ref') || localStorage.getItem('galaxy_aff_code');
      const status = localStorage.getItem('galaxy_aff_status');
      if (ref) setAffiliateRef(ref);
      if (status === 'approved') setAffiliateIsApproved(true);
    }, [custEmail]);

    const [visitorCount, setVisitorCount] = useState(() => Math.floor(Math.random() * 18) + 8);
    useEffect(() => {
      const interval = setInterval(() => {
        setVisitorCount(prev => {
          const change = Math.random() < 0.5 ? 1 : -1;
          const next = prev + change;
          return Math.min(Math.max(next, 6), 35);
        });
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      try {
        const item = {
          handle: product.handle,
          title: product.title,
          image: product.featuredImage?.url || selectedVariant?.image?.url || '',
          price: parseFloat(selectedVariant.price.amount),
          compareAtPrice: parseFloat(selectedVariant?.compareAtPrice?.amount || 0),
          savedAt: Date.now(),
        };
        const existing = JSON.parse(localStorage.getItem('galaxy_recently_viewed') || '[]')
          .filter(p => p.handle !== item.handle);
        localStorage.setItem('galaxy_recently_viewed', JSON.stringify([item, ...existing].slice(0, 10)));
      } catch (_) {}
    }, [product.handle]);

    const foundAdmin = admgalaxy?.metaobjects?.edges.find(admin => admin?.node?.fields[0]?.value === custEmail?.customer?.email);
  // console.log('Admin ketemu ?', foundAdmin)



    // console.log(liveshopee.metaobjects?.edges[0]?.node)

    // console.log('Garansisssssssssssssssssssssssssss ',related)
    // console.log('Selected Variant ',selectedVariant?.image?.url)



    const [bukaModal, setBukaModal] = useState(false)
    const [isiDalamBoxOpen, setIsiDalamBoxOpen] = useState(false)

    const checkoutCardRef = useRef(null);
    const [showStickyBar, setShowStickyBar] = useState(false);
    useEffect(() => {
      const el = checkoutCardRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (window.innerWidth >= 1024) {
            setShowStickyBar(!entry.isIntersecting);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

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
      {bukaModalBandingkan && (
        <BandingkanModal
          productA={{
            id: product.id,
            title: product.title,
            handle: product.handle,
            image: { url: product.featuredImage?.url || selectedVariant?.image?.url || '' },
            price: selectedVariant.price,
            productType: product.productType || '',
          }}
          onClose={() => setBukaModalBandingkan(false)}
        />
      )}

      <section className="lg:container mx-auto w-full gap-2 md:gap-2 grid px-0 md:px-8 lg:px-12 overflow-x-hidden">
        <div className="grid grid-cols-1 items-start gap-2 lg:gap-4 md:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr] min-w-0">
          <div className="grid md:grid-flow-row md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full min-w-0">
            <div className="md:col-span-2 md:w-full lg:w-full min-w-0">
              
              <ImageGallery
                productData={product}
                selectedVariant={selectedVariant?.image?.url}
                wishlistHandle={product.handle}
                wishlistTitle={product.title}
                wishlistImage={selectedVariant?.image?.url || product.featuredImage?.url || ''}
                wishlistPrice={String(selectedVariant?.price?.amount || '')}
                wishlistEmail={custEmail?.customer?.email || null}
              />
            </div>
          </div>
          <div className="min-w-0">
          <div className="rounded-lg w-full flex flex-col gap-2 py-2 md:px-4 md:py-4 min-w-0 overflow-x-hidden">


            <div className="flex flex-col gap-2 w-full">

              {/* OPTIONS — mobile only (position 1); desktop version rendered below outside this div */}
              <div className='text-sm order-1 md:hidden'>
                {product.options[0].values.length > 1 && (
                  <ProductOptions options={product.options} selectedVariant={selectedVariant} product={product} />
                )}
              </div>

              {/* PRICE + DISCOUNT — row on mobile (price first), stacked on desktop (discount top) */}
              <div className="flex flex-row items-center gap-3 md:flex-col md:items-start md:gap-1 md:mt-4 order-2 md:order-4">
                <div onClick={()=>copyToClipboard(listAngsuran(product,selectedVariant,canonicalUrl))} className="text-xl font-bold text-rose-700 order-1 md:order-2">Rp{parseFloat(selectedVariant.price.amount).toLocaleString("id-ID")}</div>
                {parseFloat(selectedVariant?.compareAtPrice?.amount) > parseFloat(selectedVariant.price.amount) && (
                  <div className='flex flex-row items-center gap-2 order-2 md:order-1'>
                    <div className='bg-rose-700 px-1.5 py-0.5 font-bold text-white text-xs rounded'><HitunganPersen hargaSebelum={selectedVariant.compareAtPrice.amount} hargaSesudah={selectedVariant.price.amount}/></div>
                    <div className="text-sm line-through text-slate-400">Rp{parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString("id-ID")}</div>
                  </div>
                )}
              </div>

              {/* CICILAN — position 3 mobile, 5 desktop */}
              <div className='text-xs md:text-sm text-gray-700 md:text-gray-500 order-3 md:order-5'>Cicilan Mulai dari <span onClick={()=>copyToClipboard(cicilanKartuKredit(selectedVariant,product,canonicalUrl))} className='font-bold md:font-medium text-rose-700'>Rp{mulaiDari(selectedVariant).toLocaleString("id-ID")}</span> /bln. <span onClick={()=>setBukaModal(true)} className='font-bold md:font-medium cursor-pointer text-rose-700'>Lihat</span></div>

              {/* TITLE — position 4 mobile, 1 desktop */}
              <h1 className="text-xl mt-2 md:mt-0 mb-0 md:text-2xl font-bold md:leading-snug whitespace-normal order-4 md:order-1" onClick={()=>copyToClipboard(hargaCashCopy)}>
                {product.title}
              </h1>

              {/* SOCIAL PROOF — position 5 mobile, 2 desktop */}
              <div className="flex items-center gap-2 flex-wrap order-5 md:order-2">
                {productReviews?.length > 0 && (() => {
                  const avg = (productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1);
                  return (
                    <button onClick={() => { window.location.hash = '#review'; }}
                      className="flex items-center gap-1.5">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} viewBox="0 0 20 20" className="w-3.5 h-3.5" fill={s <= Math.round(parseFloat(avg)) ? '#f59e0b' : '#e5e7eb'}>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs md:text-sm text-gray-500 underline underline-offset-2">{avg} ({productReviews.length} ulasan)</span>
                    </button>
                  );
                })()}
                {soldCount > 0 && (
                  <>
                    {productReviews?.length > 0 && <span className="text-gray-300 text-xs">·</span>}
                    <span className="text-xs md:text-sm text-gray-500">
                      Terjual <span className="font-semibold text-gray-700">{soldCount.toLocaleString('id-ID')}</span>
                    </span>
                  </>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-xs md:text-sm text-gray-500"><span className="font-semibold text-gray-700">{visitorCount} orang</span> sedang melihat produk ini</span>
                </span>
              </div>

              {/* STOCK + GARANSI — position 6 mobile, 3 desktop */}
              <div className='flex flex-row gap-2 order-6 md:order-3'>
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



 

          {product.metafields[1] && (
            <div className="border border-gray-200 rounded-xl mt-2 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 bg-gray-50">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                    <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75a1.875 1.875 0 011.875-1.875h.375A3.75 3.75 0 019.375 3zM11.25 3.75v4.5h1.5v-4.5a3.75 3.75 0 016.375 2.625h.375a1.875 1.875 0 011.875 1.875v.75a1.875 1.875 0 01-1.875 1.875H12.75v-4.5H11.25zM2.625 12.75h8.625v8.625a2.625 2.625 0 01-2.625 2.625H5.25a2.625 2.625 0 01-2.625-2.625V12.75zM12.75 12.75v8.625a2.625 2.625 0 002.625 2.625h3.375a2.625 2.625 0 002.625-2.625V12.75H12.75z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">Bonus Gratis</span>
              </div>
              <div className="px-3 py-2.5 flex flex-col gap-2">
                {product.metafields[1]?.value.split('\n').map((str, i) => str.trim() && (
                  <div key={i} className="flex items-start gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700 leading-snug">{str}</span>
                  </div>
                ))}
              </div>
            </div>
          )}


           

            

                <div className='text-sm hidden md:block'>
                  {product.options[0].values.length > 1 && (
                  <ProductOptions
                    options={product.options}
                    selectedVariant={selectedVariant}
                    product={product}
                  />
                  )}
                  </div>
              
     
              {/* DISCOUNT VOUCHER SECTION */}
              <Suspense fallback={null}>
                <Await resolve={discountVouchers}>
                  {(vd) => <DiscountVoucherSection voucherData={vd} product={product} selectedVariant={selectedVariant} canonicalUrl={canonicalUrl} copyToClipboard={copyToClipboard} />}
                </Await>
              </Suspense>




  {product?.metafields[12]?.value == "true" && <TombolWaDiscontinue product={product} />}


    <Suspense fallback={null}>
      <Await resolve={liveshopee}>
        {(ls) => ls?.metaobjects?.edges[0]?.node?.fields[1]?.value === 'true'
          ? <LiveShopee url={ls.metaobjects.edges[0].node.fields[0].value} />
          : null}
      </Await>
    </Suspense>

  
    
  

    <div className='flex flex-col gap-2 mt-2'>

        {/* Marketplace */}
        <Accordion
          title="Belanja Lewat Marketplace ?"
          color="blue"
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
          color="green"
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
          color="orange"
          content="Untuk kebutuhan pengadaan barang silahkan langsung kontak Sales Marketing kami di 0821-1131-1131"
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 000 1.5v16.5h-.75a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5h-.75V3.75a.75.75 0 000-1.5h-15zM9 6a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9zm-.75 3.75A.75.75 0 019 9h1.5a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM9 12a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9zm3.75-5.25A.75.75 0 0113.5 6H15a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM13.5 9a.75.75 0 000 1.5H15A.75.75 0 0015 9h-1.5zm-.75 3.75a.75.75 0 01.75-.75H15a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM9 19.5v-2.25a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-4.5A.75.75 0 019 19.5z" clipRule="evenodd" />
            </svg>
          )}
        />

    </div>


          {product.metafields[2]?.value &&
          <div className='hidden lg:block w-full mt-2 border border-gray-200 rounded-xl shadow-sm overflow-hidden bg-white'>
            <button
              onClick={() => setIsiDalamBoxOpen(o => !o)}
              className={`w-full flex items-center justify-between px-3 py-3 transition-all duration-200 hover:bg-gray-50 ${isiDalamBoxOpen ? 'border-b border-gray-100' : ''}`}
            >
              <div className='flex items-center gap-3'>
                <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <span className='font-semibold text-gray-800 text-sm'>Isi Dalam Box</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${isiDalamBoxOpen ? 'rotate-180 text-gray-600' : 'text-gray-400'}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {isiDalamBoxOpen && (
              <ul
                onClick={() => copyToClipboard(product.metafields[2]?.value)}
                title="Klik untuk menyalin semua"
                className='px-4 py-3 flex flex-col gap-2 cursor-pointer group bg-white'
              >
                {product.metafields[2]?.value.split('\n').filter(Boolean).map((str) => (
                  <li key={str} className='flex items-start gap-2.5 text-sm text-gray-700 leading-snug'>
                    <span className='mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0' />
                    <span>{str}</span>
                  </li>
                ))}
                <div className='mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-600 transition-colors'>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='w-3 h-3'>
                    <path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/>
                  </svg>
                  Klik untuk salin semua
                </div>
              </ul>
            )}
          </div>}
          



          </div>




          



          </div>

          {/* 3RD COLUMN — desktop checkout card, hidden on mobile/tablet */}
          <div className="hidden lg:block">
            <div
              ref={checkoutCardRef}
              className="sticky top-4 border border-gray-200 rounded-2xl shadow-lg bg-white p-4 flex flex-col gap-4"
            >
              {/* Subtotal */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-lg font-bold text-rose-700">
                  Rp{parseFloat(selectedVariant.price.amount).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5">
                <a
                  href={selectedVariant?.availableForSale
                    ? `https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20%22${encodeURIComponent(product.title)}%22%20.%20Link%20Produk%3A%20%22${encodeURIComponent(canonicalUrl)}`
                    : `https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy%2C%20saya%20ingin%20menanyakan%20ketersediaan%20stok%20untuk%20produk%20%22${encodeURIComponent(product.title)}%22.%20Apakah%20masih%20tersedia%20atau%20kapan%20akan%20restock%3F%20Terima%20kasih%20%F0%9F%99%8F%20Link%20Produk%3A%20${encodeURIComponent(canonicalUrl)}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                >
                  <FaWhatsapp className="text-base" />
                  {selectedVariant?.availableForSale ? 'Order via WhatsApp' : 'Tanya Ketersediaan'}
                </a>

                {selectedVariant?.availableForSale && (
                  <CartForm
                    route="/cart"
                    inputs={{ lines: [{ merchandiseId: selectedVariant.id }] }}
                    action={CartForm.ACTIONS.LinesAdd}
                  >
                    {(fetcher) => (
                      <>
                        {affiliateRef && <input type="hidden" name="affiliate_ref" value={affiliateRef} />}
                        <button
                          type="submit"
                          onClick={() => { window.location.href = window.location.href + '#cart-aside'; }}
                          disabled={fetcher.state !== 'idle'}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors shadow-sm"
                        >
                          <FaBagShopping className="text-base" />
                          Beli Sekarang
                        </button>
                      </>
                    )}
                  </CartForm>
                )}

                <button
                  onClick={() => setBukaModalBandingkan(true)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
                  </svg>
                  Bandingkan Produk
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-1 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  Toko Sejak 2014
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  100% Original
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  Pembayaran Aman
                </span>
              </div>

              {/* Brand authorized dealer row */}
              <Suspense fallback={null}>
                <Await resolve={metaobject}>
                  {(mo) => mo?.metaobject?.logo?.reference?.image?.url ? (
                    <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                      <img
                        src={mo.metaobject.logo.reference.image.url}
                        alt={mo?.metaobject?.field?.value || 'Brand'}
                        className="w-20 h-12 object-contain flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-600">Authorized Dealer</span>
                      </div>
                    </div>
                  ) : null}
                </Await>
              </Suspense>
            </div>
          </div>


          <Suspense fallback={null}>
            <Await resolve={finalTebusMurah}>
              {(tm) => tm?.length > 0 ? (
                <div className='w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 pt-3 lg:col-span-3 rounded-md shadow-md mb-5'>
                  <ProdukTebusMurah related={tm}/>
                </div>
              ) : null}
            </Await>
          </Suspense>
          
          


          

          
        </div>



        


            <div className='px-4 py-1 md:px-0 flex items-center gap-1.5'>
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

              {/* Affiliate copy link — only shown for approved affiliates */}
              {affiliateIsApproved && affiliateRef && (
                <button
                  onClick={() => {
                    const link = `${canonicalUrl}?ref=${affiliateRef}`;
                    navigator.clipboard.writeText(link);
                    setAffiliateLinkCopied(true);
                    setTimeout(() => setAffiliateLinkCopied(false), 2000);
                  }}
                  title="Salin link affiliate"
                  className='flex items-center gap-1.5 px-2.5 h-8 rounded-full text-[11px] font-bold transition-all active:scale-95'
                  style={{ background: affiliateLinkCopied ? '#059669' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}
                >
                  {affiliateLinkCopied ? '✓ Disalin' : '🔗 Affiliate'}
                </button>
              )}
            </div>




      
    <div className='px-4 py-1 md:px-0 text-sm flex flex-col md:flex-row sm:gap-8'>

        {/* Brand authorized dealer — mobile/tablet only (lg has it in 3rd column) */}
        <Suspense fallback={null}>
          <Await resolve={metaobject}>
            {(mo) => mo?.metaobject?.logo?.reference?.image?.url ? (
              <div className="lg:hidden flex items-center gap-2 mb-1 pl-1">
                <img
                  src={mo.metaobject.logo.reference.image.url}
                  alt={mo?.metaobject?.field?.value || 'Brand'}
                  className="w-16 h-10 object-contain flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-600">Authorized Dealer</span>
                </div>
              </div>
            ) : null}
          </Await>
        </Suspense>

        <Suspense fallback={null}>
          <Await resolve={metaobject}>
            {(mo) => mo?.metaobject?.field?.value ? (
              <div className='flex flex-row gap-1 mb-1 pl-1'>
                <div className=' mr-3 '>Brand</div>
                <Link to={`/brands/${mo.metaobject.field?.value}`}>
                  <div className='font-bold text-slate-600'>{mo.metaobject.field?.value}</div>
                </Link>
              </div>
            ) : null}
          </Await>
        </Suspense>


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
        <div className='px-4 md:px-0 min-w-0'>

        <div className='w-full'>

        
        <InfoProduk
        deskripsi={(<div className="w-full"><div className="w-full max-w-none prose prose-sm prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-4 prose-headings:mb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2 prose-li:text-gray-700 prose-li:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:my-4 prose-img:max-w-full prose-ul:my-2 prose-ol:my-2 pt-2 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-4 [&_iframe]:max-w-full"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/></div>)}
        isibox={product.metafields[2]?.value}
        specs={(<div className="overflow-x-auto w-full"><div className="w-full max-w-none prose prose-sm prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-strong:font-semibold prose-table:text-sm pt-2"
              dangerouslySetInnerHTML={{ __html:product.metafields[5]?.value }}/></div>)}
        ulasan={<ReviewSection product={product} initialReviews={productReviews} />}
        reviewCount={productReviews?.length || 0}
        />

          </div>



          
        </div>

        {/* FAQ Schema + Pertanyaan Umum — deferred, streams in after critical content */}
        <Suspense fallback={null}>
          <Await resolve={cachedFaqs}>
            {(faqs) => {
              const EXCLUDED_COLLECTIONS = ['aksesoris', 'accessories', 'used', 'bekas', 'spare-part'];
              const MIN_PRICE = 500000;
              const productCollections = product.collections?.nodes?.map(c => c.handle) || [];
              const isExcludedCollection = productCollections.some(h => EXCLUDED_COLLECTIONS.includes(h));
              const price = parseFloat(selectedVariant?.price?.amount || 0);
              if (isExcludedCollection || price < MIN_PRICE) return null;
              return (
                <>
                  {faqs?.length > 0 && (
                    <script
                      type="application/ld+json"
                      dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                          '@context': 'https://schema.org',
                          '@type': 'FAQPage',
                          mainEntity: faqs.map(faq => ({
                            '@type': 'Question',
                            name: faq.question,
                            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                          })),
                        }),
                      }}
                    />
                  )}
                  <PertanyaanUmum key={product.id} product={product} isAdmin={!!foundAdmin} initialFaqs={faqs} />
                </>
              );
            }}
          </Await>
        </Suspense>

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
      
      <div className={`hidden md:flex ${showStickyBar ? '' : 'lg:hidden'} fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]`}>
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

            <button
              onClick={() => setBukaModalBandingkan(true)}
              className='inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors whitespace-nowrap'
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
              </svg>
              <span className='hidden lg:inline'>Bandingkan</span>
            </button>

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
                <>
                  {affiliateRef && <input type="hidden" name="affiliate_ref" value={affiliateRef} />}
                  <button
                    type="submit"
                    onClick={() => { window.location.href = window.location.href + '#cart-aside'; }}
                    disabled={!selectedVariant.availableForSale ?? fetcher.state !== 'idle'}
                    className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shadow-sm'
                  >
                    <FaBagShopping className='text-base' />
                    {selectedVariant?.availableForSale ? 'Beli Sekarang' : 'Sold Out'}
                  </button>
                </>
              )}
            </CartForm>
          </div>

        </div>
      </div>
    )}

        {/* DESKTOP STICKY CHECKOUT END HERE */}

      {/* DESKTOP — slim Bandingkan bar for out-of-stock / discontinued */}
      {(!selectedVariant?.availableForSale || product?.metafields[12]?.value == "true") && (
        <div className={`hidden md:flex ${showStickyBar ? '' : 'lg:hidden'} fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-sm shadow-[0_-2px_12px_rgba(0,0,0,0.06)]`}>
          <div className='max-w-5xl mx-auto w-full px-4 md:px-8 py-2.5 flex items-center justify-between gap-4'>
            <p className='text-sm text-gray-500 truncate min-w-0'>{product.title}</p>
            <button
              onClick={() => setBukaModalBandingkan(true)}
              className='flex-shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold transition-colors'
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
              </svg>
              Bandingkan dengan Produk Lain
            </button>
          </div>
        </div>
      )}

      </section>

     

        <div className="mt-2 mb-5 relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">

        <Suspense fallback={null}>
          <Await resolve={related}>
            {(rel) => <ProdukRelated related={rel} />}
          </Await>
        </Suspense>
        </div>

 
        {foundAdmin && <TombolBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} />}

        {/* BOTTOM CHECKOUT START HERE */}

        {selectedVariant?.availableForSale 
          && product?.metafields[12]?.value != "true" 
           && (
        
        <div className='md:hidden fixed left-0 bottom-16 w-full z-50 bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2'>

          {/* Bandingkan — icon only */}
          <button
            onClick={() => setBukaModalBandingkan(true)}
            className='flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700'
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Call — icon only */}
          <a href="tel:082111311131" target="_blank" className='flex-shrink-0'>
            <div className='w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700'>
              <FaPhone className='text-base' />
            </div>
          </a>

          {/* Nego */}
          <a
            href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20minta%20harga%20best%20price%20untuk%20produk%20"${product.title}"%20.%20Link%20Produk:%20" ${canonicalUrl}`}
            target="_blank"
            className='flex-1'
          >
            <div className='w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold'>
              <FaWhatsapp className='text-base' />
              Nego
            </div>
          </a>

          {/* Beli */}
          <div className='flex-1'>
            <CartForm
              route="/cart"
              inputs={{ lines: [{ merchandiseId: selectedVariant.id }] }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <>
                  {affiliateRef && <input type="hidden" name="affiliate_ref" value={affiliateRef} />}
                  <button
                    type="submit"
                    onClick={() => { window.location.href = window.location.href + '#cart-aside'; }}
                    disabled={!selectedVariant.availableForSale ?? fetcher.state !== 'idle'}
                    className='w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 text-white text-sm font-semibold'
                  >
                    <FaBagShopping className='text-base' />
                    {selectedVariant?.availableForSale ? 'Beli' : 'Sold Out'}
                  </button>
                </>
              )}
            </CartForm>
          </div>

        </div>
      )}

      {/* MOBILE — slim Bandingkan bar for out-of-stock / discontinued */}
      {(!selectedVariant?.availableForSale || product?.metafields[12]?.value == "true") && (
        <div className='md:hidden fixed left-0 bottom-16 w-full z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-3 py-2'>
          <button
            onClick={() => setBukaModalBandingkan(true)}
            className='w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-semibold active:bg-gray-50 transition-colors'
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
              <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.918Z" clipRule="evenodd" />
            </svg>
            Bandingkan dengan Produk Lain
          </button>
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
      <div className='flex items-center gap-1.5 mb-2.5'>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-rose-500">
          <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path d="M6 6h.008v.008H6V6z" />
        </svg>
        <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Voucher Diskon</span>
      </div>

      <div className='flex overflow-x-auto md:flex-col md:overflow-visible gap-2.5 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
        {voucherArray.map((voucher, index) => (
          <div key={index} className='flex items-stretch rounded-2xl border border-rose-100 shadow-sm shrink-0 w-[260px] md:w-full md:shrink-0'
            style={{ background: 'linear-gradient(115deg, #fff1f2 0%, #ffffff 55%)' }}>

            {/* Left: discount badge */}
            <div className='flex-shrink-0 flex flex-col items-center justify-center rounded-l-2xl px-4 py-4 text-white'
              style={{ background: 'linear-gradient(155deg, #fb7185, #e11d48)', minWidth: '72px' }}>
              <span className='font-black leading-none text-center'
                style={{ fontSize: voucher.discountType === 'percentage' ? '1.45rem' : '0.8rem', lineHeight: 1 }}>
                {voucher.discountType === 'percentage'
                  ? `${voucher.discount}%`
                  : `Rp${parseFloat(voucher.discount).toLocaleString('id-ID')}`}
              </span>
              <span className='text-[8px] font-bold uppercase tracking-widest mt-1.5' style={{ color: 'rgba(255,255,255,0.65)' }}>OFF</span>
            </div>

            {/* Middle: code + details */}
            <div className='flex-1 flex flex-col justify-center px-3.5 py-3 min-w-0'
              style={{ borderLeft: '1.5px dashed #fecdd3' }}>
              <span className='font-mono font-black text-gray-900 text-sm tracking-widest leading-none'>
                {voucher.code}
              </span>
              {voucher.description && (
                <p className='text-[11px] text-gray-500 leading-tight truncate mt-1'>{voucher.description}</p>
              )}
              {(voucher.minPurchase || voucher.expiryDate) && (
                <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5'>
                  {voucher.minPurchase && (
                    <span className='text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full'>
                      {voucher.minPurchase}
                    </span>
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
              className='flex-shrink-0 self-stretch flex flex-col items-center justify-center w-[58px] text-[10px] font-bold rounded-r-2xl transition-all duration-200 active:scale-95'
              style={copiedCode === voucher.code
                ? { borderLeft: '1.5px dashed #fecdd3', background: 'rgba(16,185,129,0.08)', color: '#059669' }
                : { borderLeft: '1.5px dashed #fecdd3', background: 'rgba(244,63,94,0.05)', color: '#e11d48' }}
            >
              {copiedCode === voucher.code ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-0.5">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                  Disalin
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mb-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
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
      logo: field(key: "logo") {
        reference {
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
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





