import {useLoaderData, Link} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {Pagination, getPaginationVariables, Image} from '@shopify/hydrogen';



export const handle = {
  breadcrumbType: 'collections',
};

export async function loader({context, request}) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 15,
  });

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });
  return json({collections});
}

export default function Collections() {
  const {collections} = useLoaderData();

  // console.log('ini adalah collection',collections)

  return (
    <div className="collections container mx-auto">
      <h1>Kategori Produk</h1>
      <Pagination connection={collections}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div className='text-center'>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span className='m-4'>↑ Load previous</span>}
            </PreviousLink>
            <CollectionsGrid collections={nodes} />
            <NextLink>
              {isLoading ? 'Loading...' : <span className='m-4'>Load more ↓</span>}
            </NextLink>
          </div>
        )}
      </Pagination>
    </div>
  );
}

function CollectionsGrid({collections}) {
  return (
    <div className="grid-flow-row grid lg:grid-cols-8 gap-2 gap-y-2 md:gap-2 lg:gap-4 sm:grid-cols-8">
      {collections.map((collection, index) => (
        <CollectionItem
          key={collection.id}
          collection={collection}
          index={index}
        />
      ))}
    </div>
  );
}

function CollectionItem({collection, index}) {
  // console.log(collection.image)
  return (
    <Link
      className="collection-item"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div className='flex flex-row border-b md:border-b-0 items-center'>
        <div className='cursor-pointer ml-2 gap-5 flex sm:flex-row md:flex-col items-center md:gap-2'>
          {collection?.image && (
            <img src={collection.image.url} alt={collection.image.altText || collection.title} className="w-1/6 md:w-full lg:w-full h-auto p-1 rounded-lg" />

          )}
          <p className='text-sm'>{collection.title}</p>
          </div>
        <div className='block md:hidden mr-2 md:mr-0'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>

        </div>
        </div>
    </Link>

  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    description
    seo{
      description
      title
    }
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {

      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;


// const seo = ({data}) => ({
//   title: "Kategori Produk Galaxy Camera",
//   description: "Kategori Produk Pilihan Galaxy Camera",
// });

// export const handle = {
//   seo,
// };



export const meta = ({data}) =>{
  return[
    {title: "Kategori Produk Galaxy Camera Store"},
    {
      name: "title",
      content: "Kategori Produk Galaxy Camera Store",
    },
    {
      name: "description",
      content: "Kategori Produk Pilihan Galaxy Camera",
    },
      
  ]
}