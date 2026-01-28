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





  
  return defer({admgalaxy,balasCepat,custEmail,customerAccessToken,canonicalUrl,bannerKecil,blogs,kumpulanBrand,featuredCollection, recommendedProducts,mirrorlessProducts,hasilCollection,banner});
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
      
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">

      <div className='hidden md:block'>
      <RenderCollection collections={data.hasilCollection.collections}/>
      </div>

      <div className='block md:hidden'>
      <KategoriHalDepan related={data.hasilCollection.collections}/>
      </div>

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
        left: -200,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 200,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Suspense fallback={<div>Loading banners...</div>}>
      <Await resolve={images}>
        {(resolvedImages) => (
          <div className='relative flex items-center'>
            <div className="flex overflow-x-auto hide-scroll-bar snap-x items-center" ref={scrollRef}>
              {resolvedImages?.map((image, index) => (
                <div key={image.fields[0].reference.image.url} ref={scrollRef} className="relative flex-none mr-4 snap-center">
                  <a href={image.fields[1].value} target="_blank" rel="noopener noreferrer">
                    <img
                      src={image.fields[0].reference.image.url}
                      alt={`Banner ${index}`}
                      width={'320'}
                      height={'120'}
                      className='rounded-md'
                    />
                  </a>
                </div>
              ))}
            </div>

            <button
              className='absolute left-2 rounded-full p-1 bg-neutral-700/50'
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              className='absolute right-2 rounded-full p-1 bg-neutral-700/50'
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
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
          <section className="w-full mb-8">
            <div className='flex flex-row items-center justify-between mb-4 gap-2'>
              <h2 className="text-gray-900 text-sm sm:text-xl font-medium sm:font-semibold tracking-tight">Kategori Populer</h2>
              <Link to={`/collections/`}>
                <div className='text-blue-600 hover:text-blue-800 text-xs sm:text-sm lg:text-base font-medium leading-tight whitespace-nowrap'>Lihat Semua →</div>
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-3 lg:gap-4">
              {nodes.map((collection) => (
                <Link to={`/collections/${collection.handle}`} key={collection.id}>
                  <div className="group flex flex-col items-center justify-center p-2 sm:p-3 bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 hover:border-blue-300 transition-all duration-300 hover:bg-blue-50 h-32 sm:h-40 lg:h-48">
                    {collection?.image && (
                      <div className='w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300 flex-shrink-0'>
                        <Image
                          alt={`Image of ${collection.title}`}
                          data={collection.image}
                          sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
                          crop="center"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-gray-800 text-center text-xs sm:text-sm font-medium line-clamp-2 leading-tight">
                      {collection.title}
                    </p>
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
      "description": "Galaxy Camera merupakan Toko Kamera Online Offline menjual berbagai peralatan forografi dan videografi terlengkap dan termurah.",
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