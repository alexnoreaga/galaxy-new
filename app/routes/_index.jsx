import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {HitunganPersen} from '~/components/HitunganPersen';
import {useRef} from "react";
// export const meta = () => {
//   return [{title: 'Hydrogen | Home'},
//   {"og:title": "Syntapse Software"},];
// };

import { Carousel } from '~/components/Carousel';


export async function loader({context}) {
  
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const collections2 = await storefront.query(COLLECTIONS_QUERY);

  const featuredCollection = collections.nodes[0];
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
  const hasilCollection =  collections2;

  const banner = await storefront.query(BANNER_QUERY);



  return defer({featuredCollection, recommendedProducts,hasilCollection,banner});
}

export default function Homepage() {
  const data = useLoaderData();

  // console.log(data.banner.metaobjects.nodes)
  // console.log('test adalah',data.hasilCollection.collections.nodes)


  return (
    <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      {/* <FeaturedCollection collection={data.featuredCollection} /> */}
      <Carousel images={data.banner.metaobjects} />
      <RenderCollection collections={data.hasilCollection.collections}/>
      <RecommendedProducts products={data.recommendedProducts} />
      <BannerKecil/>
    
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


// function BannerKecil(){
//   return(
//     <div class="flex flex-nowrap overflow-x-auto">
//   <div class="">
//     <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=1699871301" />
//   </div>
//   <div class="">
//     <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=1699871301" />
//   </div>
//   <div class="">
//     <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" />
//   </div>
//   <div class="">
//     <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=1699871301" />
//   </div>
//   <div class="">
//     <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=1699871301" />
//   </div>
//   <div class="">
//     <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=1699871301" />
//   </div>
// </div>
//   )
// }

// function BannerKecil() {
//   return (
//     <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
//     <div className="flex-none mr-4 snap-center">
//       <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=1699871301" alt="Banner 1" className='w-80'/>
//     </div>
//     <div className="flex-none mr-4 snap-center">
//       <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=1699871301" alt="Banner 2" className='w-80'/>
//     </div>
//     <div className="flex-none mr-4 snap-center">
//       <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
//     </div>
//     <div className="flex-none mr-4 snap-center">
//       <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
//     </div>
//     <div className="flex-none mr-4 snap-center">
//       <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
//     </div>
//     <div className="flex-none mr-4 snap-center">
//       <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
//     </div>
//     {/* Add more image divs if needed */}
//   </div>
//   );
// }

function BannerKecil() {
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
    <div className='relative flex items-center'>
    <div className="flex overflow-x-auto hide-scroll-bar snap-x items-center" ref={scrollRef}>
      <div ref={scrollRef} className="relative flex-none mr-4 snap-center">
      <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
      </div>
      <div ref={scrollRef} className="relative flex-none mr-4 snap-center">
      <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
      </div>
      <div ref={scrollRef} className="relative flex-none mr-4 snap-center">
      <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
      </div>
      <div ref={scrollRef} className="relative flex-none mr-4 snap-center">
      <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
      </div>
      <div ref={scrollRef} className="relative flex-none mr-4 snap-center">
      <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
      </div>
      <div ref={scrollRef} className="relative flex-none mr-4 snap-center">
      <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
      </div>
      <div ref={scrollRef} className="relative flex-none mr-4 snap-center">
      <img src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/banner_1.jpg?v=16998713010" alt="Banner 3" className='w-80'/>
      </div>
      {/* Add more image divs if needed */}
      
      

      {/* <button onClick={scrollLeft} className="absolute left-0  bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mr-4">
        Scroll Left
      </button> */}
      {/* <button onClick={scrollRight} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4">
        Scroll Right
      </button> */}
      
    </div>

    <button className='absolute left-2 rounded-full p-1 bg-gray-700/50' onClick={scrollLeft}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
    </svg>
    </button>

    <button className='absolute right-2 rounded-full p-1 bg-gray-700/50' onClick={scrollRight}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
</svg>
</button>
   
    </div>
  );
}




//HASIL SENDIRI
// function RenderCollection({collections}) {
//   if (!collections) return null;
//   return (
//     <section className="w-full gap-4">
//       <h2 className="text-slate-800 whitespace-pre-wrap max-w-prose font-bold text-lead text-center w-full mx-auto">
//         Kategori Populer
//       </h2>
//       <div className="grid-flow-row grid grid-cols-4 gap-4 gap-y-2 md:gap-2 lg:gap-4  sm:grid-cols-8 ">
//         {collections.nodes.map((collection) => {
//           return (
//             <Link to={`/collections/${collection.handle}`} key={collection.id}>
//               <div className="grid gap-2">
//                 {collection?.image && (
//                   <Image
//                     alt={`Image of ${collection.title}`}
//                     data={collection.image}
//                     key={collection.id}
//                     sizes="(max-width: 32em) 100vw, 33vw"
//                     crop="center"
//                   />
//                 )}
//                 <p className="text-slate-800 whitespace-normal max-w-prose text-copy text-center text-sm">
//                   {collection.title}
//                 </p>
//               </div>
//             </Link>
//           );
//         })}
        
//       </div>
//       <Link to={`/collections/`}>
//           <p className="text-slate-800 text-sm mx-auto mt-6 w-64 p-1.5 text-center rounded-md border border-slate-300 hover:border-slate-800 hover:no-underline ">Kategori Selengkapnya</p>
//         </Link>
//     </section>
//   );
// }

function RenderCollection({collections}) {
  if (!collections) return null;
  return (
    <section className="w-full gap-4 ">
    <div className='flex flex-row items-center justify-between m-1 mb-2'>
        <div className="text-slate-800 text-lg mx-auto sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead">
          Kategori Populer
        </div>
        <Link to={`/collections/`}>
        <div className='text-slate-500 hidden sm:block mx-1'>Lihat Selengkapnya</div>
        </Link>
      </div>
      <div className="grid-flow-row grid grid-cols-2 gap-0 lg:rounded-xl lg:shadow-md  lg:p-2 md:gap-2 lg:gap-4 sm:grid-cols-4 md:grid-cols-8 ">
        {collections.nodes.map((collection) => {
          return (
            <Link to={`/collections/${collection.handle}`} key={collection.id}>
              <div className="flex items-center flex-row md:grid gap-2 border box-border md:border-none p-2 ">
                {collection?.image && (
                  <div className='w-1/3 md:w-full '>
                  <Image
                    alt={`Image of ${collection.title}`}
                    data={collection.image}
                    key={collection.id}
                    sizes="(max-width: 32em) 100vw, 33vw"
                    crop="center"

                  />
                  </div>
                )}
                <p className="text-slate-800 whitespace-normal max-w-prose text-copy text-center text-sm">
                  {collection.title}
                </p>
              </div>
            </Link>
          );
        })}
        
      </div>
      <Link to={`/collections/`}>
          <div className="block sm:hidden text-slate-800 text-sm mx-auto mt-2 w-48 p-1 text-center rounded-md bg-slate-100 hover:no-underline ">Kategori Selengkapnya</div>
        </Link>
    </section>
  );
}




function RecommendedProducts({products}) {

  // console.log('Produk rekomendasi',products)


  
  return (
    <div className="recommended-products text-slate-800">
      <h2 className='text-center'>Produk Best Seller</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="hover:no-underline border shadow rounded-lg p-2"
                  to={`/products/${product.handle}`}
                >

                  <div className='relative'>
                  <Image
                    data={product.images.nodes[0]}
                    aspectRatio="1/1"
                    sizes="(min-width: 45em) 20vw, 50vw"
                    className="hover:opacity-80"
                  />
                  {/* <h3 class="absolute p-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-xs font-bold text-white top-1 right-1">5%</h3> */}
                  </div>
           
                  <div className='text-sm my-1 text-slate-800'>{product.title}</div>
                  
                  {product.compareAtPriceRange?.minVariantPrice?.amount != product.priceRange.minVariantPrice.amount &&(
                  <div className='text-sm  line-through text-slate-600'>
                    <Money data={product.compareAtPriceRange?.minVariantPrice} />
                    {/* <div>{(product.compareAtPriceRange.minVariantPrice.amount - product.priceRange.minVariantPrice.amount)/product.compareAtPriceRange.minVariantPrice.amount * 100}</div> */}
                    
                  </div>
                  ) }
                  <div className='text-xs font-bold text-slate-800 flex flex-row items-center gap-1 mb-2 mt-2'>
                  {product.compareAtPriceRange?.minVariantPrice?.amount != product.priceRange.minVariantPrice.amount &&(
                    <div className='bg-rose-700 p-0.5 ml-0 text-white text-xs rounded'><HitunganPersen hargaSebelum={product.compareAtPriceRange.minVariantPrice.amount} hargaSesudah={product.priceRange.minVariantPrice.amount}/></div> ) }
                    
                    <Money 
                    className={`text-sm font-semibold ${product.compareAtPriceRange?.minVariantPrice?.amount != product.priceRange.minVariantPrice.amount && 'text-rose-800'}`}
                    data={product.priceRange.minVariantPrice} />
                  </div>
                  <div className='flex flex-col md:flex-row gap-2'>
                  {/* <span className='rounded-md m-auto ml-0 bg-emerald-100 text-xs font-bold text-emerald-800 p-1 px-2'>
                    Cashback 5%  
                  </span> */}
                  {product.metafields[2]?.value && <span className='rounded-md m-auto ml-0 bg-sky-100 text-xs font-bold text-sky-800 p-1 px-2'>
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


const COLLECTIONS_QUERY = `#graphql
  query FeaturedCollections {
    collections(first: 8, query: "collection_type:smart") {
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


// const COLLECTIONS_QUERY = `#graphql
//   fragment FeaturedCollection on Collection {
//     id
//     title
//     image {
//       id
//       url
//       altText
//       width
//       height
//     }
//     handle
//   }
//   query FeaturedCollection($country: CountryCode, $language: LanguageCode)
//     @inContext(country: $country, language: $language) {
//     collections(first: 4, sortKey: UPDATED_AT, reverse: true) {
//       nodes {
//         ...FeaturedCollection
//       }
//     }
//   }
// `;

const seo = ({data}) => ({
  title: 'Galaxy Camera Store : Toko Kamera Online Offline Terlengkap',
  description: "Galaxy Camera menjual berbagai segala kebutuhan fotografi dan videografi dengan harga terbaik dan resmi",
});

export const handle = {
  seo,
};