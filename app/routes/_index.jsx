import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link,useOutletContext} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {HitunganPersen} from '~/components/HitunganPersen';
import {KategoriHalDepan} from '~/components/KategoriHalDepan';
import {ProductFeatureHalDepan} from '~/components/ProductFeatureHalDepan';

import { BrandPopular } from '../components/BrandPopular';
import {useRef} from "react";
import { useLayoutEffect, useState } from 'react';
import { FaCalendarDays, FaYoutube } from "react-icons/fa6";
import {YoutubeLink} from '~/components/YoutubeLink';


import { Carousel } from '~/components/Carousel';
import { Modal } from '~/components/Modal';
import { AboutSeo } from '~/components/AboutSeo';
import { TombolWa } from '~/components/TombolWa';
import { TombolBalasCepat } from '~/components/TombolBalasCepat';
import { ModalBalasCepat } from '~/components/ModalBalasCepat';




export async function loader({context,request}) {
  const customerAccessToken = await context.session.get('customerAccessToken');
  
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const collections2 = await storefront.query(COLLECTIONS_QUERY);

  const featuredCollection = collections.nodes[0];
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
  const mirrorlessProducts = storefront.query(MIRRORLESS_PRODUCTS_QUERY);
  const hasilCollection =  collections2;

  const banner = await storefront.query(BANNER_QUERY);
  const bannerKecil = await storefront.query(BANNER_KECIL_QUERY);




  const custEmail = await storefront.query(CUSTOMER_EMAIL_QUERY, {
    variables: {
      customertoken: customerAccessToken?.accessToken? customerAccessToken?.accessToken:'', // Value for the 'first' variable
    }, 
  });

  const admgalaxy = await context.storefront.query(METAOBJECT_ADMIN_GALAXY, {
    variables: {
      type: "admin_galaxy", // Value for the 'type' variable
      first: 20, // Value for the 'first' variable
    },
  });



  const blogs = await storefront.query(GET_ARTIKEL,{
    variables:{
      first:3,
      reverse:true,
    },
  });

  const balasCepat = await storefront.query(BALAS_CEPAT,{
    variables:{
      first:100,
    },
  });

  const vouchers = await storefront.query(GET_VOUCHERS,{
    variables:{
      first:10,
    },
  });

  const brands = await storefront.query(GET_BRANDS)
  const hasilLoop =  brands?.metaobjects?.nodes[0]?.fields[0]?.value
  const dataArray = JSON.parse(hasilLoop);
  const canonicalUrl = request.url

  const hasilCekPromises = dataArray.map((item) => {
    return storefront.query(GET_BRAND_IMAGE, {
      variables: {
        id: item,
      },
    });
  });
  
  const kumpulanBrand = await Promise.all(hasilCekPromises);





  
  return defer({admgalaxy,balasCepat,vouchers,custEmail,customerAccessToken,canonicalUrl,bannerKecil,blogs,kumpulanBrand,featuredCollection, recommendedProducts,mirrorlessProducts,hasilCollection,banner});
}






export default function Homepage() {
  const data = useLoaderData();
  const [bukaModalBalasCepat, setBukaModalBalasCepat] = useState(false)


  const foundAdmin = data?.admgalaxy?.metaobjects?.edges.find(admin => admin?.node?.fields[0]?.value === data?.custEmail?.customer?.email);


  return (
    <div>

      {bukaModalBalasCepat&&<ModalBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} data={data?.balasCepat?.metaobjects?.nodes}/>}
      

      
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <Carousel images={data.banner.metaobjects} />
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-2 sm:px-0 mt-2 sm:mt-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-md hover:shadow-lg transition-shadow duration-300">
          {/* Modern gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10"></div>
          
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-pink-400/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-56 sm:h-56 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-3xl"></div>

          {/* Content */}
          <div className="relative px-3 py-2 sm:px-6 sm:py-3 md:py-3.5 flex flex-row items-center justify-between gap-2 sm:gap-4 z-10">
            <div className="flex-1 min-w-0">
              <div className="hidden sm:inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-2 py-0.5 mb-1 sm:mb-1.5 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-300">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                <span className="text-white">Promo Cicilan</span>
              </div>
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white tracking-tight leading-tight mb-0.5 sm:mb-1">
                Cicil Kamera Tanpa Kartu Kredit
              </h2>
              <p className="text-[10px] sm:text-xs text-blue-50 hidden sm:flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-200">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                Proses cepat sekitar 15 menit
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/kredit-kamera"
                className="group inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg bg-white text-indigo-600 font-bold px-3 py-1.5 sm:px-5 sm:py-2 text-[10px] sm:text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Lihat Caranya</span>
                <span className="sm:hidden">Lihat</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">

      <div className='hidden md:block'>
      <RenderCollection collections={data.hasilCollection.collections}/>
      </div>

      <div className='block md:hidden'>
      <KategoriHalDepan related={data.hasilCollection.collections}/>
      </div>

      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <VouchersSection vouchers={data.vouchers} />
      </div>

      


      
{/* <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <div className='hidden md:block'>
        <RecommendedProducts products={data.recommendedProducts} />
        </div>


        <div className='block md:hidden'>
       <ProductFeatureHalDepan products={data.recommendedProducts} />
      </div>

        </div> */}

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <MirrorlessProducts products={data.mirrorlessProducts} />
      </div>

      


      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <BannerKecil images={data.bannerKecil.metaobjects.nodes} />
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <BrandPopular brands={data.kumpulanBrand}/>
      </div>

      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <FeaturedBlogs blogs={data.blogs}/>
      </div>

      <AboutSeo/>

      {foundAdmin && <TombolBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} />}

    
    </div>
  );
}

// Banner Besar
function FeaturedCollection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
    </Link>
  );
}





function BannerKecil({ images }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -300,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Suspense fallback={<div>Loading banners...</div>}>
      <Await resolve={images}>
        {(resolvedImages) => (
          <div className='relative flex items-center my-8 group/banner'>
            {/* Left Navigation Button */}
            <button
              className='hidden md:flex absolute left-0 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 opacity-0 group-hover/banner:opacity-100 active:scale-95'
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Scrollable Container */}
            <div className="flex overflow-x-auto hide-scroll-bar snap-x snap-mandatory scroll-smooth items-center gap-3 sm:gap-4 pb-2" ref={scrollRef}>
              {resolvedImages?.map((image, index) => (
                <div key={image.fields[0].reference.image.url} className="relative flex-none snap-center group">
                  <a href={image.fields[1].value} target="_blank" rel="noopener noreferrer">
                    <div className='overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200'>
                      <img
                        src={image.fields[0].reference.image.url}
                        alt={`Banner ${index}`}
                        width={'320'}
                        height={'120'}
                        className='w-80 h-auto object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                    </div>
                  </a>
                </div>
              ))}
            </div>

            {/* Right Navigation Button */}
            <button
              className='hidden md:flex absolute right-0 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 opacity-0 group-hover/banner:opacity-100 active:scale-95'
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </Await>
    </Suspense>
  );
}





function RenderCollection({ collections }) {
  return (
    <Suspense fallback={<div>Loading collections...</div>}>
      <Await resolve={collections}>
        {({ nodes }) => (
          <section className="w-full py-6 sm:py-8">
            <div className='flex flex-row items-end justify-between mb-6 gap-4'>
              <div>
                <h2 className="text-gray-900 text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">Kategori Populer</h2>
                <div className='h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2'></div>
              </div>
              <Link to={`/collections/`}>
                <button className='px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs sm:text-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 whitespace-nowrap'>
                  Lihat Semua →
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-3 lg:gap-4">
              {nodes.map((collection) => (
                <Link to={`/collections/${collection.handle}`} key={collection.id}>
                  <div className="group relative flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-2xl shadow-sm hover:shadow-2xl border border-gray-100 hover:border-blue-300 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 h-32 sm:h-40 lg:h-48 overflow-hidden cursor-pointer">
                    {/* Background Glow Effect */}
                    <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-400/5 to-indigo-400/5'></div>
                    
                    {collection?.image && (
                      <div className='relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-2 sm:mb-3 flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300'>
                        <Image
                          alt={`Image of ${collection.title}`}
                          data={collection.image}
                          sizes="(max-width: 640px) 56px, (max-width: 1024px) 64px, 80px"
                          crop="center"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <p className="text-gray-800 text-center text-xs sm:text-sm font-semibold line-clamp-2 leading-tight relative z-10 group-hover:text-blue-700 transition-colors duration-300">
                      {collection.title}
                    </p>
                    
                    {/* Hover Bottom Border */}
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </Await>
    </Suspense>
  );
}




function RecommendedProducts({products}) {

 
  return (
    <div className="recommended-products text-gray-800">
    
      <h2 className='text-gray-800 text-sm sm:text-lg sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead'>Produk Terbaru</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="hover:no-underline border bg-white shadow rounded-lg p-2"
                  to={`/products/${product.handle}`}
                >

                  <div className='relative'>
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
           
                  <div className='text-sm my-1 text-gray-800'>{product.title}</div>
                  
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
  );
}



function MirrorlessProducts({products}) {
  return (
    <div className="mirrorless-products mb-8">
      <div className='flex flex-row items-center justify-between mb-4 gap-2'>
        <div className="text-gray-900 text-sm sm:text-xl font-medium sm:font-semibold tracking-tight">Mirrorless Terbaru</div>
        <Link to="/collections/kamera-mirrorless">
          <div className='text-blue-600 hover:text-blue-800 text-xs sm:text-sm lg:text-base font-medium leading-tight whitespace-nowrap'>Lihat Semua →</div>
        </Link>
      </div>
      
      <Suspense fallback={<div className="text-center py-8">Loading products...</div>}>
        <Await resolve={products}>
          {(response) => {
            const productsList = response?.collection?.products;
            if (!productsList?.nodes?.length) {
              return <div className="text-center py-8 text-gray-500">No products found</div>;
            }
            
            return (
              <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory scroll-smooth sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 hide-scroll-bar">
                {productsList.nodes.map((product) => (
                  <Link
                    key={product?.id}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-32 sm:w-auto snap-start"
                    to={`/products/${product?.handle}`}
                  >
                    <div className='relative overflow-hidden bg-gray-50'>
                      <Image
                        data={product?.images?.nodes?.[0]}
                        alt={product?.title || 'Product'}
                        aspectRatio="1/1"
                        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 128px"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                      {parseFloat(product?.compareAtPriceRange?.minVariantPrice?.amount || 0) > parseFloat(product?.priceRange?.minVariantPrice?.amount || 0) && (
                        <div className="absolute top-1 right-1 bg-red-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold shadow-md">
                          <HitunganPersen 
                            hargaSebelum={product?.compareAtPriceRange?.minVariantPrice?.amount || 0} 
                            hargaSesudah={product?.priceRange?.minVariantPrice?.amount || 0}
                          />
                        </div>
                      )}
                      {product?.metafields?.find(m => m?.key === 'free')?.value && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold shadow-md">
                          Free
                        </div>
                      )}
                    </div>
                    
                    <div className='p-2 sm:p-3'>
                      <h3 className='text-xs sm:text-sm font-medium text-gray-800 mb-1 sm:mb-2 line-clamp-2 min-h-[32px] sm:min-h-[40px]'>
                        {product?.title || 'Nama Produk'}
                      </h3>
                      
                      {parseFloat(product?.compareAtPriceRange?.minVariantPrice?.amount || 0) > parseFloat(product?.priceRange?.minVariantPrice?.amount || 0) && (
                        <div className='text-[10px] sm:text-xs text-gray-400 line-through mb-0.5 sm:mb-1'>
                          Rp{parseFloat(product?.compareAtPriceRange?.minVariantPrice?.amount || 0).toLocaleString("id-ID")}
                        </div>
                      )}
                      
                      <div className={`text-xs sm:text-base font-bold ${parseFloat(product?.compareAtPriceRange?.minVariantPrice?.amount || 0) > parseFloat(product?.priceRange?.minVariantPrice?.amount || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                        Rp{parseFloat(product?.priceRange?.minVariantPrice?.amount || 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}


function FeaturedBlogs({ blogs }) {
  const [articlesToShow, setArticlesToShow] = useState(1);

  useLayoutEffect(() => {
    const updateArticlesToShow = () => {
      const screenSize = window.innerWidth;
      if (screenSize <= 640) {
        setArticlesToShow(1);
      } else {
        setArticlesToShow(blogs.articles.edges.length);
      }
    };

    updateArticlesToShow();
    window.addEventListener('resize', updateArticlesToShow);

    return () => {
      window.removeEventListener('resize', updateArticlesToShow);
    };
  }, [blogs.articles.edges.length]);

  function formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  }

  return (
    <Suspense fallback={<div>Loading articles...</div>}>
      <Await resolve={blogs}>
        {(resolvedBlogs) => (
          <div>
            <div className='flex flex-row items-center justify-between m-1 mb-2'>
              <div className="text-gray-800 text-sm sm:text-lg sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead">
                Artikel dan Review
              </div>
              <Link to={`/blogs/`}>
                <div className='text-gray-500 block mx-1 text-sm sm:text-md'>Lihat Semua</div>
              </Link>
            </div>
            <div className='flex flex-col sm:flex-row gap-4 justify-between'>
              {resolvedBlogs.articles.edges.slice(0, articlesToShow).map((blog) => (
                <Link to={`/blogs/${blog.node.blog.handle}/${blog.node.handle}`} key={blog.node.title}>
                  <div className='mx-auto'>
                    <div className='h-60 w-80 mx-auto rounded-xl overflow-hidden bg-neutral-50 shadow-lg'>
                      <img
                        width={'320'}
                        height={'240'}
                        className='object-contain h-60 w-80 p-1 m-auto'
                        src={blog.node.image.url}
                        alt={blog.node.title}
                      />
                    </div>
                    <div className='flex flex-row items-center text-neutral-500 gap-2 pt-2'>
                      <FaCalendarDays />
                      <div className='text-sm py-2'>{formatDate(blog.node.publishedAt)}</div>
                    </div>
                    <div className='font-bold '>{blog.node.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Await>
    </Suspense>
  );
}


const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    featuredImage {
      id
      altText
      url
      width
      height
    }
    metafields(identifiers:[
      {namespace:"custom" key:"garansi"}
      {namespace:"custom" key:"free"}
      {namespace:"custom" key:"isi_dalam_box"}
      {namespace:"custom" key:"periode_promo"}
      {namespace:"custom" key:"periode_promo_akhir"}
      {namespace:"custom" key:"spesifikasi"}
      {namespace:"custom" key:"brand"}
    ]){
      key
      value
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange{
      minVariantPrice{
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 6, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;


const MIRRORLESS_PRODUCTS_QUERY = `#graphql
  fragment MirrorlessProduct on Product {
    id
    title
    handle
    featuredImage {
      id
      altText
      url
      width
      height
    }
    metafields(identifiers:[
      {namespace:"custom", key:"garansi"},
      {namespace:"custom", key:"free"},
      {namespace:"custom", key:"isi_dalam_box"},
      {namespace:"custom", key:"periode_promo"},
      {namespace:"custom", key:"periode_promo_akhir"},
      {namespace:"custom", key:"spesifikasi"},
      {namespace:"custom", key:"brand"}
    ]){
      key
      value
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange{
      minVariantPrice{
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query MirrorlessProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collection(handle: "kamera-mirrorless") {
      products(first: 6, sortKey: BEST_SELLING) {
        nodes {
          ...MirrorlessProduct
        }
      }
    }
  }
`;


const COLLECTIONS_QUERY = `#graphql
  query FeaturedCollections {
    collections(first: 9, query: "collection_type:smart") {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
  }
`;


const BANNER_QUERY = `#graphql
query BannerQuery{
  metaobjects(first:5 type:"banner"){
	
  nodes {
    id
    fields {
      value
      key
      reference{
      ... on MediaImage {
          image {
            url
          }
        }
      }
      
    }
  }
}}
`

const BANNER_KECIL_QUERY = `#graphql
query BannerQuery{
  metaobjects(first:5 type:"banner_kecil"){
	
  nodes {
    id
    fields {
      value
      key
      reference{
      ... on MediaImage {
          image {
            url
          }
        }
      }
      
    }
  }
}}
`

const GET_BRANDS = `#graphql
query BrandQuery{
    metaobjects(first:5 type:"brand_popular"){
      
    nodes {
      id
      fields {
        value
        key
           
        
      }
    }
  }}
`

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

const GET_BRAND_IMAGE = `#graphql
query BrandImage($id: ID!){
  metaobject(id:$id){
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
  
}}
`

const GET_BLOGS = `#graphql
  query BlogShow($first: Int!,$reverse:Boolean!){
    blogs( first:$first,reverse:$reverse) {
      edges {
        node {
          articles (first:10) {
            edges {
              node {
                blog {
                  handle
                }
                id
                handle
                publishedAt
                title
                content
                seo {
                  description
                  title
                }
                image {
                  url
                }
              }
            }
          }
        }
      }
  }}
`;

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


const GET_ARTIKEL = `#graphql
  query Artikel($first: Int!,$reverse:Boolean!){
    articles(first:$first,reverse:$reverse) {
    edges {
      node {
        blog {
          handle
        }
        id
        title
        handle
        publishedAt
        image {
          id
          url
        }
      }
    }
  }}
`;




export const meta = ({data}) => {

  return [
    {title: 'Galaxy Camera Store : Toko Kamera Tangerang Depok Terlengkap dan Terpercaya'},
    {
      name: "title",
    content: "Galaxy Camera Store : Toko Kamera Tangerang Depok Terlengkap dan Terpercaya"
  },
    {
      name: "description",
    content: "Toko Kamera Tangerang Depok Jakarta Online Terpercaya dan Terlengkap Garansi Harga Terbaik. Jual Kamera DSLR, Mirrorless, dan Aksesoris Kamera lainnya. Canon, Sony, DJI, Nikon dll"
  },

    { tagName:'link',
      rel:'canonical',
      href: data.canonicalUrl
    },

  {name: "keywords",
    content:"Galaxycamera99, Galaxycamera, Galaxy Camera Store, toko kamera, toko kamera online, toko kamera tangerang, toko kamera depok, toko kamera jakarta, kredit kamera, Galaxy Camera",
  },

  {
    property: "og:type",
    content: "website",
  },

  {
    property: "og:title",
    content: "Galaxy Camera Store : Toko Kamera Tangerang Depok Terlengkap dan Terpercaya",
  },

  {
    property: "og:description",
    content: "Toko Kamera Online Terpercaya dan Terlengkap Garansi Harga Terbaik. Jual Kamera DSLR, Mirrorless, dan Aksesoris Kamera lainnya. Canon, Sony, DJI, Nikon dll"
  },

  {
    property: "og:url",
    content: 'https://galaxy.co.id',
  },

  {
    property: "og:image",
    content: data?.banner?.metaobjects?.nodes[0]?.fields[0]?.reference?.image.url,
  },

  // banner.metaobjects.nodes[0].fields[0].reference.image.url


  {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "Organization",
      "image": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo_galaxy_web_new.png?v=1698859678",
      "url": "https://www.galaxy.co.id",
      "sameAs": ["https://galaxycamera.id",
      "https://twitter.com/galaxycamera99",
      "https://www.facebook.com/galaxycamera99",
      "https://www.instagram.com/galaxycamera99"],
      "logo": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo_galaxy_web_new.png?v=1698859678",
      "name": "Galaxy Camera Store",
      "description": "Galaxy Camera merupakan Toko Kamera Online Offline menjual berbagai peralatan fotografi dan videografi terlengkap dan termurah.",
      "email": "sales@galaxycamera.id",
      "telephone": "+6282111311131",
      "address": {
        "streetAddress": "Ruko Mall Metropolis Townsquare, Blok Gm3 No.6, Kelapa Indah, Tangerang",
        "postalCode": "15117",
        "addressLocality": "TANGERANG",
        "addressCountry": "ID"
      },
    }
  },
  {
    "script:ld+json": {
      "@context": "http://schema.org",
      "@type": "Website",
      "name": "Galaxy Camera Store",
      "url": "https://galaxy.co.id",
      "sameAs": [
        "https://galaxycamera.id",
        "https://twitter.com/galaxycamera99",
        "https://www.facebook.com/galaxycamera99",
        "https://www.instagram.com/galaxycamera99"
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Ruko Mall Metropolis Townsquare, Blok Gm3 No.6, Kelapa Indah, Tangerang",
        "addressRegion": "Tangerang Banten",
        "postalCode": "15117",
        "addressCountry": "INA"
      }
    }
  },
];
};


const CUSTOMER_EMAIL_QUERY = `#graphql
query CustomerEmailQuery($customertoken: String!) {
  customer(customerAccessToken: $customertoken) {
    email
  }
}`;

const GET_VOUCHERS = `#graphql
query GetVouchers($first: Int!) {
  metaobjects(first: $first, type: "discount_voucher") {
    nodes {
      id
      fields {
        key
        value
      }
    }
  }
}`;

// Compact Vouchers Section Component
function VouchersSection({ vouchers }) {
  return (
    <Suspense fallback={<div>Loading vouchers...</div>}>
      <Await resolve={vouchers}>
        {(resolvedVouchers) => {
          const voucherArray = resolvedVouchers?.metaobjects?.nodes?.map((node) => {
            const fields = node.fields;
            return {
              code: fields.find(f => f.key === 'kode')?.value || fields.find(f => f.key === 'code')?.value || 'PROMO',
              discount: fields.find(f => f.key === 'discount')?.value || fields.find(f => f.key === 'diskon')?.value || '0%',
              discountType: fields.find(f => f.key === 'discount_type')?.value || 'percentage',
              description: fields.find(f => f.key === 'description')?.value || fields.find(f => f.key === 'deskripsi')?.value || 'Berlaku untuk pembelian tertentu',
              minPurchase: fields.find(f => f.key === 'min_purchase')?.value || '',
              expiryDate: fields.find(f => f.key === 'expiry_date')?.value || '',
            };
          }) || [];

          const handleCopyCode = (code) => {
            navigator.clipboard.writeText(code);
            alert('Kode disalin!');
          };

          return (
            <div className='py-2 mb-4'>
              {/* Header */}
              <div className='flex items-center justify-between mb-3 gap-2'>
                <div>
                  <h2 className="text-gray-900 text-base sm:text-lg font-bold">🎁 Voucher Eksklusif</h2>
                  <p className='text-gray-500 text-xs mt-0.5 hidden sm:block'>Dapatkan diskon spesial untuk pembelian hari ini</p>
                </div>
                <Link to="/promo">
                  <button className='px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-orange-500 to-rose-600 text-white font-semibold text-xs rounded-full hover:shadow-lg hover:from-orange-600 hover:to-rose-700 transition-all duration-300 whitespace-nowrap'>
                    Lihat Semua →
                  </button>
                </Link>
              </div>

              {/* Vouchers Grid */}
              <div className='overflow-x-auto md:overflow-visible hide-scroll-bar'>
                <div className='flex md:grid md:grid-cols-4 gap-3 pb-2 md:pb-0 snap-x snap-mandatory md:snap-none'>
                  {voucherArray && voucherArray.length > 0 ? (
                    voucherArray.map((voucher, index) => (
                      <div key={index} className='flex-shrink-0 w-64 md:w-auto snap-start bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200'>
                        <div className='flex flex-col gap-2'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='font-bold text-orange-700 text-sm'>{voucher.code}</span>
                              <span className='bg-gradient-to-r from-orange-500 to-rose-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold'>
                                {voucher.discount}
                              </span>
                            </div>
                            <p className='text-xs text-gray-700 line-clamp-2'>{voucher.description}</p>
                            {(voucher.minPurchase || voucher.expiryDate) && (
                              <div className='flex flex-col gap-0.5 text-[10px] text-gray-600 mt-1'>
                                {voucher.minPurchase && <span>Min: {voucher.minPurchase}</span>}
                                {voucher.expiryDate && <span>Hingga {new Date(voucher.expiryDate).toLocaleDateString('id-ID')}</span>}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopyCode(voucher.code)}
                            className='bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5'
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                            </svg>
                            Salin Kode
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='w-full py-6 text-center text-gray-500'>
                      <p className='text-sm'>Tidak ada voucher tersedia saat ini</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}