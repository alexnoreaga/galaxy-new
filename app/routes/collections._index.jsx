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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 p-2 sm:p-4">
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
  return (
    <Link
      className="group block focus:outline-none"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div className="flex flex-col items-center justify-center bg-white/80 sm:bg-white/60 sm:backdrop-blur-md border border-gray-100 rounded-2xl shadow-md hover:shadow-xl hover:border-blue-400 transition-all duration-200 p-2 sm:p-4 h-full min-h-[120px] sm:min-h-[180px] cursor-pointer">
        {collection?.image && (
          <img
            src={collection.image.url}
            alt={collection.image.altText || collection.title}
            className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-xl mb-2 group-hover:scale-105 transition-transform duration-200 shadow-sm"
          />
        )}
        <div className="text-xs sm:text-base font-medium text-gray-800 text-center group-hover:text-blue-700 transition-colors duration-200 line-clamp-2">
          {collection.title}
        </div>
        <div className="block sm:hidden mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400">
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