import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
// export const meta = () => {
//   return [{title: 'Hydrogen | Home'},
//   {"og:title": "Syntapse Software"},];
// };


export async function loader({context}) {
  
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const collections2 = await storefront.query(COLLECTIONS_QUERY);

  const featuredCollection = collections.nodes[0];
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
  const hasilCollection =  collections2;



  return defer({featuredCollection, recommendedProducts,hasilCollection});
}

export default function Homepage() {
  const data = useLoaderData();

  // console.log('test adalah',data.hasilCollection.collections.nodes)

  return (
    <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <FeaturedCollection collection={data.featuredCollection} />
      <RenderCollection collections={data.hasilCollection.collections}/>
      <RecommendedProducts products={data.recommendedProducts} />
    
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
    <section className="w-full gap-4">
      <h2 className="text-slate-800 whitespace-pre-wrap max-w-prose font-bold text-lead text-center w-full mx-auto">
        Kategori Populer
      </h2>
      <div className="grid-flow-row grid grid-cols-2 gap-0  md:gap-2 lg:gap-4 sm:grid-cols-4 md:grid-cols-8 ">
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
          <p className="text-slate-800 text-sm mx-auto mt-6 w-64 p-1.5 text-center rounded-md border border-slate-300 hover:border-slate-800 hover:no-underline ">Kategori Selengkapnya</p>
        </Link>
    </section>
  );
}


function RecommendedProducts({products}) {


  
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
                  <div className='text-sm  line-through text-slate-400'>
                    <Money data={product.compareAtPriceRange?.minVariantPrice} />
                  </div>
                  ) }
                  <div className='text-xs font-bold text-slate-800 flex flex-row items-center gap-1 mb-2 mt-2'>
                  {product.compareAtPriceRange?.minVariantPrice?.amount != product.priceRange.minVariantPrice.amount &&(
                    <div className='bg-rose-700 p-0.5 ml-0 text-white text-xs rounded-full '>5%</div> ) }
                    <Money 
                    className={`text-sm font-semibold ${product.compareAtPriceRange?.minVariantPrice?.amount != product.priceRange.minVariantPrice.amount && 'text-rose-800'}`}
                    data={product.priceRange.minVariantPrice} />
                  </div>
                  <div className='flex flex-col md:flex-row gap-2'>
                  <span className='rounded-md m-auto ml-0 bg-emerald-100 text-xs font-bold text-emerald-800 p-1 px-2'>
                    Cashback 5%  
                  </span>
                  <span className='rounded-md m-auto ml-0 bg-sky-100 text-xs font-bold text-sky-800 p-1 px-2'>
                    Free Item  
                  </span>
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