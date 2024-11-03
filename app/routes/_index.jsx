import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link,useOutletContext} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {HitunganPersen} from '~/components/HitunganPersen';
import {KategoriHalDepan} from '~/components/KategoriHalDepan';

import { BrandPopular } from '../components/BrandPopular';
import {useRef} from "react";
import { useLayoutEffect, useState } from 'react';
import { FaCalendarDays, FaYoutube } from "react-icons/fa6";
import {YoutubeLink} from '~/components/YoutubeLink';

// export const meta = () => {
//   return [{title: 'Hydrogen | Home'},
//   {"og:title": "Syntapse Software"},];
// };

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





  
  return defer({admgalaxy,balasCepat,custEmail,customerAccessToken,canonicalUrl,bannerKecil,blogs,kumpulanBrand,featuredCollection, recommendedProducts,hasilCollection,banner});
}






export default function Homepage() {
  const data = useLoaderData();

  // const account = useActionData()
  const [bukaModalBalasCepat, setBukaModalBalasCepat] = useState(false)

  // console.log('Akses Email',data)

  const foundAdmin = data?.admgalaxy?.metaobjects?.edges.find(admin => admin?.node?.fields[0]?.value === data?.custEmail?.customer?.email);

  // console.log('Admin ketemu ?', foundAdmin)

  return (
    <div>
      {/* <FeaturedCollection collection={data.featuredCollection} /> */}
      {/* <Modal/> */}
      {bukaModalBalasCepat&&<ModalBalasCepat setBukaModalBalasCepat={setBukaModalBalasCepat} data={data?.balasCepat?.metaobjects?.nodes}/>}
      
      {/* <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <input className='w-full border-gray-200 rounded-md' placeholder="Cari Produk" ></input>
      </div> */}
      
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <Carousel images={data.banner.metaobjects} />
        </div>
      
      {/* <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl"> */}
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">

      <div className='hidden md:block'>
      <RenderCollection collections={data.hasilCollection.collections}/>
      </div>

      <div className='block md:hidden'>
      <KategoriHalDepan related={data.hasilCollection.collections}/>
      </div>

      </div>

      {/* <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <YoutubeLink/>
      </div> */}

      {/* <div className="bg-white md:bg-gray-100 md:mb-5 md:-ml-5 md:-mr-5 md:my-4 md:py-5"> */}
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <RecommendedProducts products={data.recommendedProducts} />
      </div>
      {/* </div> */}


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

      {/* { data.admgalaxy.metaobjects.edges.find(admin => admin.node.fields[0].value == data.custEmail.customer)} */}
    
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

function BannerKecil({images}) {
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

      {images?.map((image,index)=>{
        return(
         
          <div key={image.fields[0].reference.image.url} ref={scrollRef} className="relative flex-none mr-4 snap-center">
            <a href={image.fields[1].value} target="_blank">
            <img src={image.fields[0].reference.image.url} alt={`Banner ${index}`} width={'320'} height={'120'} className='rounded-md'/>
            </a>
          </div>
          
        )
      })}

    </div>

    <button className='absolute left-2 rounded-full p-1 bg-neutral-700/50' onClick={scrollLeft} aria-label="kiri">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
    </svg>
    </button>

    <button className='absolute right-2 rounded-full p-1 bg-neutral-700/50' onClick={scrollRight} aria-label="kanan"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-10 sm:h-10 text-white hover:text-gray-300">
  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
</svg>
</button>
   
    </div>
  );
}




function RenderCollection({collections}) {
  if (!collections) return null;
  return (
    <section className="w-full gap-4 ">
    <div className='flex flex-row items-center justify-between m-1 mb-2'>
        <div className="text-gray-800 text-sm sm:text-lg sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead">
          Kategori Populer
        </div>
        <Link to={`/collections/`}>
        <div className='text-gray-500 block mx-1 text-sm sm:text-md'>Lihat Semua</div>
        </Link>
      </div>
      <div className="grid-flow-row grid grid-cols-3 gap-0 bg-white lg:rounded-xl lg:shadow-md  lg:p-2 md:gap-2 lg:gap-4 sm:grid-cols-4 md:grid-cols-9 ">
        {collections.nodes.map((collection) => {
          return (
            <Link to={`/collections/${collection.handle}`} key={collection.id}>
              <div className="flex items-center flex-col md:grid gap-2  box-border md:border-none p-1 hover:bg-gray-100 hover:rounded-lg">
                {collection?.image && (
                  <div className='w-3/5 md:w-full rounded-full  bg-gray-200 md:bg-transparent'>
                  <Image
                    alt={`Image of ${collection.title}`}
                    data={collection.image}
                    key={collection.id}
                    sizes="(max-width: 32em) 100vw, 33vw"
                    crop="center"
                    className="p-1"

                  />
                  </div>
                )}
                <p className="text-gray-800 whitespace-normal max-w-prose text-copy font-medium text-center text-sm">
                  {collection.title}
                </p>
              </div>
            </Link>
          );
        })}
        
      </div>
      {/* <Link to={`/collections/`}>
          <div className="block sm:hidden text-gray-800 text-sm mx-auto mt-2 w-48 p-1 text-center rounded-md bg-gray-100 hover:no-underline ">Kategori Selengkapnya</div>
        </Link> */}
    </section>
  );
}






function RecommendedProducts({products}) {

  // console.log('Produk rekomendasi',products)


  
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
                    sizes="(min-width: 45em) 20vw, 50vw"
                    className="hover:opacity-80"
                  />

                  {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
                  <div class="absolute p-1 rounded bg-gradient-to-r from-rose-500 to-rose-700 font-bold text-xs text-white top-1 right-0">Promo</div>
                  ) }
                  </div>  
           
                  <div className='text-sm my-1 text-gray-800'>{product.title}</div>

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
  );
}


function FeaturedBlogs2({blogs}){
  // console.log('Ini adalah artikel ', blogs)
  return(
    <div>
      <div className='flex flex-row items-center justify-between m-1 mb-2'>
        <div className="text-gray-800 text-sm sm:text-lg sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead">
          Artikel dan Review
        </div>
        <Link to={`/blogs/`}>
        <div className='text-gray-500 block mx-1 text-sm sm:text-md'>Lihat Semua</div>
        </Link>
      </div>
      <div className='flex flex-col sm:flex-row gap-4 '>
        {blogs.articles.edges.map((blog)=>{
          return(
            <div className='w-80 mx-auto'>
              <div className='h-60 w-80 rounded-xl overflow-hidden bg-neutral-50 shadow-lg'>
                <img className='h-60 p-1 w-auto m-auto' key={blog.node.title} src={blog.node.image.url} alt={blog.node.title}></img>
              </div>
              <div className='font-bold p-2'>{blog.node.title}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeaturedBlogs({ blogs }) {
  // console.log('Ini merupaakan featured Blog',blogs)

  const [articlesToShow, setArticlesToShow] = useState(1); // State to manage the number of articles to display

  useLayoutEffect(() => {
    // Function to check screen size and set articles to display accordingly
    const updateArticlesToShow = () => {
      const screenSize = window.innerWidth;
      if (screenSize <= 640) {
        // For small screens (you can adjust this breakpoint as needed)
        setArticlesToShow(1); // Show only one article
      } else {
        // For larger screens
        setArticlesToShow(blogs.articles.edges.length); // Show all articles
      }
    };

    // Initial check on component mount
    updateArticlesToShow();

    // Event listener for screen size changes
    window.addEventListener('resize', updateArticlesToShow);

    return () => {
      // Cleanup: Remove the event listener on component unmount
      window.removeEventListener('resize', updateArticlesToShow);
    };
  }, [blogs.articles.edges.length]);

  function formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = new Date(dateString).toLocaleDateString('id-ID', options);
    return formattedDate;
  }


  return (
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
        {blogs.articles.edges.slice(0, articlesToShow).map((blog) => {
          return (
            <Link 
            to={`/blogs/${blog.node.blog.handle}/${blog.node.handle}`}
            key={blog.node.title}>

            <div className='mx-auto' >
            <div className='h-60 w-80 mx-auto rounded-xl overflow-hidden bg-neutral-50 shadow-lg'>

            <img width={'320'} height={'240'} className='object-contain h-60 w-80 p-1 m-auto' key={blog.node.title} src={blog.node.image.url} alt={blog.node.title}></img>
            </div>
            
            <div className='flex flex-row items-center text-neutral-500 gap-2 pt-2'>
            <FaCalendarDays />
            <div className='text-sm py-2'>{formatDate(blog.node.publishedAt)}</div>
            </div>
            <div className='font-bold '>{blog.node.title}</div>

            </div>
            </Link>
          );
        })}
      </div>
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


// export const meta = ({data}) => (
  
//   return [{
//   title: 'Galaxy Camera Store : Toko Kamera Online Offline Terlengkap',
//   description: "Galaxy Camera menjual berbagai segala kebutuhan fotografi dan videografi dengan harga terbaik dan resmi",
// }]);

export const meta = ({data}) => {

  // console.log('Ini meta dari halaman depan ',data)
  

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