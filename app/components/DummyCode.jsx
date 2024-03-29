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


export const meta = ({data}) => {
  // const currentDomain = "https://galaxy"

  // useEffect(() => {
  //   // Access window.location and perform client-side operations here
  //   const currentDomain = window.location;
  //   console.log('current domain ',currentDomain);
  // }, []);


  const collectionTitle = data?.collection?.seo.title
    ?data?.collection?.seo.title
    :data?.collection?.title;

    const today = new Date();
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const indonesianMonth = monthNames[today.getMonth()];
    const year = today.getFullYear();
    const title = `${collectionTitle} - ${indonesianMonth} ${year}`;
  

  return [
    {title},
    {
      name: "description",
      content: data?.collection?.seo.description
      ? data.collection.seo.description.substr(0, 155)
      : data?.collection?.description.substr(0, 155),
    },
    // {tagName:'link',rel:'canonical',href:{currentDomain}}
  ];
};

export async function loader({request, params, context}) {
  
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  return json({collection});
}

export default function Collection() {
  const {collection} = useLoaderData();



  console.log(' Collection Products ',collection)

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>
      <Pagination connection={collection.products}>
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
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        description
        title
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
        
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
