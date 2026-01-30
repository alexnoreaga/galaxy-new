import {json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link, Form,useParams,useFetcher,useActionData ,useNavigate,useSubmit } from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/utils';
import { useLocation} from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { HitunganPersen } from '~/components/HitunganPersen';

export const handle = {
  breadcrumbType: 'collection',
};


export const meta = ({data}) => {
  // ENHANCED - Get collection info
  const collectionTitle = data?.collection?.seo?.title
    ? data?.collection?.seo.title
    : data?.collection?.title;

  const collectionDescription = data?.collection?.seo?.description
    ? data?.collection?.seo.description
    : data?.collection?.description;

  // ENHANCED - Dynamic date for urgency
  const today = new Date();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const indonesianMonth = monthNames[today.getMonth()];
  const year = today.getFullYear();

  // ENHANCED - Better title with keywords
  const title = `${collectionTitle} - Harga Terbaik ${indonesianMonth} ${year} | Galaxy Camera`;

  // ENHANCED - Better description with keywords and CTAs
  const description = `Jelajahi koleksi ${collectionTitle} terlengkap dengan harga terbaik. Garansi resmi, cicilan 0%, gratis ongkir. Belanja aman di Galaxy Camera toko kamera terpercaya.`;

  // ENHANCED - Keywords from collection
  const keywords = `${collectionTitle}, ${collectionTitle} murah, ${collectionTitle} original, jual ${collectionTitle}, harga ${collectionTitle}, ${collectionTitle} terbaik, ${collectionTitle} garansi resmi`;

  // ENHANCED - Canonical URL
  const canonicalUrl = data?.canonicalUrl || `https://galaxy.co.id/collections/${data?.collection?.handle}`;

  // ENHANCED - Product count
  const productCount = data?.collection?.products?.nodes?.length || 0;

  return [
    // Basic Meta Tags
    { title },
    {
      name: "title",
      content: title,
    },
    {
      name: "description",
      content: description.substring(0, 160),
    },
    {
      name: "keywords",
      content: keywords,
    },
    {
      name: "author",
      content: "Galaxy Camera",
    },

    // Robots & Indexing
    {
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1",
    },

    // Canonical URL
    {
      tagName: 'link',
      rel: 'canonical',
      href: canonicalUrl,
    },

    // Open Graph Tags
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:title",
      content: title,
    },
    {
      property: "og:description",
      content: description.substring(0, 160),
    },
    {
      property: "og:url",
      content: canonicalUrl,
    },
    {
      property: "og:site_name",
      content: "Galaxy Camera",
    },
    {
      property: "og:image",
      content: data?.collection?.image?.url || "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png",
    },
    {
      property: "og:image:width",
      content: "1200",
    },
    {
      property: "og:image:height",
      content: "630",
    },
    {
      property: "og:locale",
      content: "id_ID",
    },

    // Twitter Card Tags
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:site",
      content: "@galaxycamera99",
    },
    {
      name: "twitter:title",
      content: title,
    },
    {
      name: "twitter:description",
      content: description.substring(0, 160),
    },
    {
      name: "twitter:image",
      content: data?.collection?.image?.url || "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png",
    },

    // Collection Schema (JSON-LD)
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": collectionTitle,
        "description": description,
        "url": canonicalUrl,
        "image": data?.collection?.image?.url || "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png",
        "numberOfItems": productCount,
        "publisher": {
          "@type": "Organization",
          "name": "Galaxy Camera",
          "logo": {
            "@type": "ImageObject",
            "url": "https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png",
          },
        },
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://galaxy.co.id",
        },
      },
    },

    // BreadcrumbList Schema
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://galaxy.co.id",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Collections",
            "item": "https://galaxy.co.id/collections",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": collectionTitle,
            "item": canonicalUrl,
          },
        ],
      },
    },

    // Product Collection Schema
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "ItemCollection",
        "name": `Koleksi ${collectionTitle}`,
        "description": description,
        "url": canonicalUrl,
        "numberOfItems": productCount,
        "isPartOf": {
          "@type": "Organization",
          "name": "Galaxy Camera",
          "url": "https://galaxy.co.id",
        },
      },
    },
  ];
};

// OLD CODE - Commented for future reference
// export const meta = ({data}) => {
//   // const currentDomain = "https://galaxy"

//   // useEffect(() => {
//   //   // Access window.location and perform client-side operations here
//   //   const currentDomain = window.location;
//   //   console.log('current domain ',currentDomain);
//   // }, []);

//   const collectionTitle = data?.collection?.seo.title
//     ?data?.collection?.seo.title
//     :data?.collection?.title;

//     const today = new Date();
//     const monthNames = [
//       "Januari", "Februari", "Maret", "April", "Mei", "Juni",
//       "Juli", "Agustus", "September", "Oktober", "November", "Desember"
//     ];
//     const indonesianMonth = monthNames[today.getMonth()];
//     const year = today.getFullYear();
//     const title = `${collectionTitle} - ${indonesianMonth} ${year}`;

//   return [
//     {title},
//     {
//       name: "description",
//       content: data?.collection?.seo.description
//       ? data.collection.seo.description.substr(0, 155)
//       : data?.collection?.description.substr(0, 155),
//     },
//     // {tagName:'link',rel:'canonical',href:{currentDomain}}
//   ];
// };

// var reverse = true

export async function loader({request, params, context}) {


  
  const {handle} = params;

  const url = new URL(request.url);
  // const order = url.searchParams.get("reverse");
  const reverse = url.searchParams.get("reverse") === 'true' ? true:false;
  const sortKey = url.searchParams.get("sortkey")?.toUpperCase()
  // reverse  = contacts  // const { sort } = request.query; // Access sorting parameter from URL search params


  const {storefront} = context;

  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle,reverse,sortkey:sortKey,...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  return json({collection,request,params,context});
}

// export async function action({request, params, context}) {
//   const {handle} = params;
//   const {storefront} = context;
//   const testing = 'testing'

//   const url = new URL(request.url);
//   // const order = url.searchParams.get("reverse");
//   const reverse = url.searchParams.get("reverse") === 'true' ? true:false;

//   params= testing

//   const paginationVariables = getPaginationVariables(request, {
//     pageBy: 8,
//   });

//   const {collection} = await storefront.query(COLLECTION_QUERY, {
//     variables: {handle,reverse, ...paginationVariables},
//   });
//   return json({collection,request,params,context});

// }




export default function Collection() {
  
  const fetcher = useFetcher();
  const { collection, request, params, context } = useLoaderData();

  const [collection2, setCollection2] = useState(collection)
  const location = useLocation();
  const [formData, setFormData] = useState('');
  const submit = useSubmit();
  const navigate = useNavigate();

  const formDatax = new FormData();


  // console.log('Parahms ada lah',formDatax)


    // useEffect(() => {
    //   setCollection2(collection)
    // }, [collection]);


  // console.log('Ini adalah submit ',submit)


  
  // useEffect(()=>{
  //   const { collection, request, params, context } = useLoaderData();
  //   console.log('ccc',collection)
  // },[formData])



  


  const handleInputChange = (event) => {
    // console.log('Ini adalah event ', event.target.selectedOptions[0].getAttribute('sortKey'))
    // console.log('Ini adalah even2 ',event.target.selectedOptions[0])
    // const { name, value } = event.target;
    setFormData(event.target.selectedOptions[0].textContent.trim());
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('sortkey', event.target.selectedOptions[0].getAttribute('sortKey'));
    searchParams.set('reverse', event.target.selectedOptions[0].getAttribute('data-reverse'));

    window.history.replaceState(null, '', `${location.pathname}?${searchParams}`);
    searchParams.forEach((value, key) => {
      formDatax.append(key, value);
  });

  submit(formDatax, { method: "get" });


  };
  


  return (
    <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <div className="flex flex-col md:flex-row lg:flex-row md:justify-between md:items-center">
      <h1>{collection.title} </h1>

      <Form method="get">
      <div className='w-full flex flex-col md:flex-row lg:flex-row gap-2 md:items-center mb-5'>
      <label htmlFor="reverse" className='text-gray-900 text-sm font-bold hidden md:block '>Urutkan </label>
      <select
        name="reverse"
        id="reverse"
        value={formData}
        onChange={handleInputChange}
        className="ml-0 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      >
        <option value=""  disabled defaultValue>Pilih...</option>
        <option sortkey="RELEVANCE" data-reverse="false">Relevansi</option>
        <option sortkey="TITLE" data-reverse="false">A-Z</option>
        <option sortkey="TITLE" data-reverse="true">Z-A</option>
        <option sortkey="PRICE" data-reverse="false">Harga Terendah</option>
        <option sortkey="PRICE" data-reverse="true">Harga Tertinggi</option>
        {/* Add more options as needed */}
      </select>
      </div>
      {/* <button type="submit">Submit</button> */}
    </Form>
    </div>

      
      <Pagination connection={collection.products}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>
            <ProductsGrid products={nodes} />
            <br />
            <NextLink>
              {isLoading ? 'Loading...' : <span className="mb-12 font-bold text-center bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">Load more ↓</span>}
            </NextLink>
          </>
        )}
      </Pagination>
      {/* <p className="collection-description">{collection.description}</p> */}
      
      <div
        dangerouslySetInnerHTML={{__html: collection.descriptionHtml}}
        className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl prose"
      />
    </div>
  );
}

function ProductsGrid({products}) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}

function ProductItem({product, loading}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  // console.log(product.title,'Discontinue ',product?.metafields[12]?.value, 'Available',product)


  return (
    <Link
      className="hover:no-underline border shadow rounded-lg p-2"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className='relative'>
      {product.featuredImage && (
        
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="1/1"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 20vw, 50vw"
          className={`hover:opacity-80 ${product.availableForSale == "false" || product?.metafields[12]?.value == "true" &&'opacity-50'} ${!product.availableForSale && product?.metafields[12]?.value !== "true" &&'opacity-50'}`}
        />
      )}
      {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) &&(
      <div className="absolute p-1 rounded bg-gradient-to-r from-rose-800 to-rose-700 font-bold text-xs text-white top-1 right-0">Promo</div>
        )}


        {!product.availableForSale && product?.metafields[12]?.value !== "true"&&(<div className="text-center absolute p-1 rounded bg-amber-400 font-bold text-xs text-black top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            Stock Kosong
        </div>)}

        {product?.metafields[12]?.value == "true" && <div className="text-center absolute p-1 rounded bg-gradient-to-r from-gray-800 to-gray-950 font-bold text-xs text-white top-1 left-0">
            Discontinue
        </div>}


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




      {/* <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small> */}
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    availableForSale
    title
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
      {namespace:"custom" key:"tokopedia"}
      {namespace:"custom" key:"shopee"}
      {namespace:"custom" key:"blibli"}
      {namespace:"custom" key:"bukalapak"}
      {namespace:"custom" key:"lazada"}
      {namespace:"custom" key:"produk_discontinue"}
      {namespace:"custom" key:"produk_serupa"}
    ]){
      key
      value
    }

    compareAtPriceRange{
      minVariantPrice{
        amount
        currencyCode
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $reverse:Boolean=false
    $sortkey:ProductCollectionSortKeys
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      
      seo {
        description
        title
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        reverse:$reverse,
        sortKey:$sortkey
        
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;


