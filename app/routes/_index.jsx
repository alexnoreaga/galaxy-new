import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';

export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context}) {
  
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const collections2 = await storefront.query(COLLECTIONS_QUERY);

  const featuredCollection = collections.nodes[0];
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
  const hasilCollection =  collections2;

  // console.log(hasilCollection)

 

  return defer({featuredCollection, recommendedProducts,hasilCollection});
}

export default function Homepage() {
  const data = useLoaderData();

  // console.log('test adalah',data.hasilCollection.collections.nodes)

  return (
    <div className="home container mx-auto">
      <FeaturedCollection collection={data.featuredCollection} />
     
      <RenderCollection collections={data.hasilCollection.collections}/>
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

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
      {/* <h1>{collection.title}</h1> */}
    </Link>
  );
}


//HASIL SENDIRI
function RenderCollection({collections}) {
  if (!collections) return null;
  return (
    <section className="w-full gap-4">
      <h2 className="whitespace-pre-wrap max-w-prose font-bold text-lead text-center w-full mx-auto">
        Kategori Populer
      </h2>
      <div className="grid-flow-row grid grid-cols-4 gap-4 gap-y-2 md:gap-2 lg:gap-4  sm:grid-cols-8 ">
        {collections.nodes.map((collection) => {
          return (
            <Link to={`/collections/${collection.handle}`} key={collection.id}>
              <div className="grid gap-2">
                {collection?.image && (
                  <Image
                    alt={`Image of ${collection.title}`}
                    data={collection.image}
                    key={collection.id}
                    sizes="(max-width: 32em) 100vw, 33vw"
                    crop="center"
                  />
                )}
                <p className="whitespace-normal max-w-prose text-copy text-center text-sm">
                  {collection.title}
                </p>
              </div>
            </Link>
          );
        })}
        
      </div>
      <Link to={`/collections/`}>
          <p className="text-sm mx-auto mt-6 w-64 p-1.5 text-center rounded-md border border-slate-300 hover:border-slate-800 hover:no-underline ">Kategori Selengkapnya</p>
        </Link>
    </section>
  );
}


function RecommendedProducts({products}) {
  return (
    <div className="recommended-products">
      <h2 className='text-center'>Produk Best Seller</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="recommended-products-grid ">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="recommended-product hover:no-underline border shadow rounded-xl p-2"
                  to={`/products/${product.handle}`}
                >
                
                  <Image
                    data={product.images.nodes[0]}
                    aspectRatio="1/1"
                    sizes="(min-width: 45em) 20vw, 50vw"
                    className="hover:opacity-80"
                  />
           
                  <h4 className='font-small'>{product.title}</h4>
                  <h4 className='font-bold'>
                    <Money data={product.priceRange.minVariantPrice} />
                  </h4>
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