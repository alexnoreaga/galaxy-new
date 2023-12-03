import {json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/utils';
import { useHistory ,useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {defer} from '@shopify/remix-oxygen';


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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    return redirect('/brands');
  }

  const data = await context.storefront.query(BRAND_QUERY, {
    variables: {
      first:10,
      query:handle,
      ...paginationVariables
    },
  });

  if (!data) {
    throw new Response(`Brands ${handle} tidak ditemukan`, {
      status: 404,
    });
  }



  return json({data});

}

export default function BrandHandle() {
  const {data} = useLoaderData();

  console.log('Hi ini adalah brand terbaru ',data)

  return (
    <div className="collection">
      {/* <div>Hello World {data}</div> */}
      {/* <h1>{collection.title}</h1> */}
      <Pagination connection={data.products}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>
            <ProductsGrid products={nodes} />
            <br />
            <NextLink>
              {isLoading ? 'Loading...' : <span>Load more ↓</span>}
            </NextLink>
          </>
        )}
      </Pagination>
    </div>
  );
}

function ProductsGrid({products}) {
  return (
    <div className="products-grid">
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
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {product.featuredImage && (
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="1/1"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
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
    title
    featuredImage {
      id
      altText
      url
      width
      height
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
query Brand($first:Int!
  $query: String!
  $startCursor: String 
  $endCursor: String
  ) {
  products(first: $first, query: $query, before: $startCursor,after: $endCursor) {
    pageInfo{
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
