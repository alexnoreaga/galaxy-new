import {json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link, Form, useParams, useNavigate, useSubmit} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/utils';
import { useLocation} from 'react-router-dom';
import { useEffect, useState } from 'react';
import {defer} from '@shopify/remix-oxygen';
import { HitunganPersen } from '~/components/HitunganPersen';


// export const meta = ({data}) => {

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


  // const collectionTitle = data?.collection?.seo.title
  //   ?data?.collection?.seo.title
  //   :data?.collection?.title;
  
  // const collectionTitle = data?.collection?.seo.title
  //   ?data?.collection?.seo.title
  //   :data?.collection?.title;

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

export async function loader({params, context, request}) {
  
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const reverse = url.searchParams.get("reverse") === 'true' ? true : false;
  const sortKey = url.searchParams.get("sortkey")?.toUpperCase();
  
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    return redirect('/brands');
  }

  const data = await context.storefront.query(BRAND_QUERY, {
    variables: {
      first: 10,
      query: "vendor:" + handle,
      reverse,
      sortkey: sortKey,
      ...paginationVariables
    },
  });

  if (!data) {
    throw new Response(`Brands ${handle} tidak ditemukan`, {
      status: 404,
    });
  }

  return json({data, handle});
}

export default function BrandHandle() {
  const {data, handle} = useLoaderData();
  const [formData, setFormData] = useState('');
  const location = useLocation();
  const submit = useSubmit();
  const formDatax = new FormData();

  const handleInputChange = (event) => {
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
        <h1>{handle.charAt(0).toUpperCase() + handle.slice(1)}</h1>

        <Form method="get">
          <div className='w-full flex flex-col md:flex-row lg:flex-row gap-2 md:items-center mb-5'>
            <label htmlFor="reverse" className='text-gray-900 text-sm font-bold hidden md:block'>Urutkan</label>
            <select
              name="reverse"
              id="reverse"
              value={formData}
              onChange={handleInputChange}
              className="ml-0 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="" disabled defaultValue>Pilih...</option>
              <option sortkey="RELEVANCE" data-reverse="false">Relevansi</option>
              <option sortkey="TITLE" data-reverse="false">A-Z</option>
              <option sortkey="TITLE" data-reverse="true">Z-A</option>
              <option sortkey="PRICE" data-reverse="false">Harga Terendah</option>
              <option sortkey="PRICE" data-reverse="true">Harga Tertinggi</option>
            </select>
          </div>
        </Form>
      </div>

      <Pagination connection={data.products}>
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
            className={`hover:opacity-80 ${product.availableForSale == "false" && 'opacity-50'} ${!product.availableForSale && 'opacity-50'}`}
          />
        )}
        {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && (
          <div className="absolute p-1 rounded bg-gradient-to-r from-rose-800 to-rose-700 font-bold text-xs text-white top-1 right-0">Promo</div>
        )}
        {!product.availableForSale && (
          <div className="text-center absolute p-1 rounded bg-amber-400 font-bold text-xs text-black top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            Stock Kosong
          </div>
        )}
      </div>
      
      <div className='text-sm my-1 text-gray-800'>{product.title}</div>
      
      {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && (
        <div className='text-sm line-through text-gray-600'>
          <div>Rp{parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount).toLocaleString("id-ID")}</div>
        </div>
      )}

      <div className='text-xs font-bold text-gray-800 flex flex-row items-center gap-1 mb-2 mt-2'>
        {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && (
          <div className='bg-rose-700 p-0.5 ml-0 text-white text-xs rounded'>
            <HitunganPersen hargaSebelum={product.compareAtPriceRange.minVariantPrice.amount} hargaSesudah={product.priceRange.minVariantPrice.amount}/>
          </div>
        )}
        <div className={`text-sm font-semibold ${parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && 'text-rose-800'}`}>
          Rp{parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString("id-ID")}
        </div>
      </div>
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
    compareAtPriceRange {
      minVariantPrice {
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

const BRAND_QUERY = `#graphql
${PRODUCT_ITEM_FRAGMENT}
query Brand(
  $first: Int!
  $query: String!
  $startCursor: String
  $endCursor: String
  $reverse: Boolean = false
  $sortkey: ProductSortKeys
) {
  products(
    first: $first
    query: $query
    before: $startCursor
    after: $endCursor
    reverse: $reverse
    sortKey: $sortkey
  ) {
    pageInfo {
      hasNextPage
      hasPreviousPage
      endCursor
      startCursor
    }
    nodes {
      ...ProductItem
    }
  }
}
`;

// const today = new Date();
// const month = today.getMonth() + 1;

// const indonesianMonths = [
//   'Januari',
//   'Februari',
//   'Maret',
//   'April',
//   'Mei',
//   'Juni',
//   'Juli',
//   'Agustus',
//   'September',
//   'Oktober',
//   'November',
//   'Desember',
// ];

// const indonesianMonth = indonesianMonths[month - 1];
// const year = today.getFullYear();


// const seo = ({data}) => ({
//   title: data?.collection?.seo.title
//   ?data?.collection?.seo.title
//   :data?.collection?.title,
//   titleTemplate: '%s - ' + indonesianMonth + ' ' + year,
//   description: data?.collection?.seo.description
//   ? data.collection.seo.description.substr(0, 155)
//   : data?.collection?.description.substr(0, 155),
// });

// export const handle = {
//   seo,
// };
