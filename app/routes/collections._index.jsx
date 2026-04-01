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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-10">

      {/* Page header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Kategori Produk</h1>
        <p className="text-sm text-gray-500 mt-1">Temukan produk berdasarkan kategori pilihan</p>
      </div>

      <Pagination connection={collections}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            <PreviousLink>
              <div className="flex justify-center mb-6">
                <button className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 hover:shadow-md transition-all duration-200 ${isLoading ? 'opacity-60 cursor-wait' : ''}`}>
                  {isLoading ? (
                    <svg className="animate-spin w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    </svg>
                  )}
                  {isLoading ? 'Memuat...' : 'Kategori sebelumnya'}
                </button>
              </div>
            </PreviousLink>

            <CollectionsGrid collections={nodes} />

            <NextLink>
              <div className="flex justify-center mt-8">
                <button className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold shadow hover:bg-gray-700 hover:shadow-md transition-all duration-200 ${isLoading ? 'opacity-60 cursor-wait' : ''}`}>
                  {isLoading ? (
                    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                    </svg>
                  )}
                  {isLoading ? 'Memuat...' : 'Muat lebih banyak'}
                </button>
              </div>
            </NextLink>
          </div>
        )}
      </Pagination>
    </div>
  );
}

function CollectionsGrid({collections}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
      {collections.map((collection, index) => (
        <CollectionItem key={collection.id} collection={collection} index={index} />
      ))}
    </div>
  );
}

function CollectionItem({collection, index}) {
  return (
    <Link
      className="group block focus:outline-none"
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-white hover:bg-gray-50 border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {collection?.image ? (
            <img
              src={collection.image.url}
              alt={collection.image.altText || collection.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              width={80}
              height={80}
              loading="lazy"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 6.75h.008v.008H6.75V6.75z" />
            </svg>
          )}
        </div>
        <span className="text-xs md:text-sm font-medium text-gray-700 text-center group-hover:text-gray-900 transition-colors duration-200 line-clamp-2 leading-tight">
          {collection.title}
        </span>
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



export const meta = ({data}) => {
  const title = 'Kategori Produk Kamera & Aksesoris | Galaxy Camera';
  const description =
    'Jelajahi semua kategori produk Galaxy Camera: kamera, lensa, drone, action cam, dan aksesoris. Harga terbaik, garansi resmi, cicilan 0%, gratis ongkir seluruh Indonesia.';
  const keywords =
    'kategori produk kamera, koleksi kamera, toko kamera online, kamera mirrorless, kamera dslr, drone, lensa kamera, galaxy camera';
  const canonicalUrl = 'https://galaxy.co.id/collections';

  const collectionCount = data?.collections?.nodes?.length || 0;

  return [
    {title},
    {
      name: 'title',
      content: title,
    },
    {
      name: 'description',
      content: description.substring(0, 160),
    },
    {
      name: 'keywords',
      content: keywords,
    },
    {
      name: 'author',
      content: 'Galaxy Camera',
    },
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large, max-snippet:-1',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: canonicalUrl,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:description',
      content: description.substring(0, 160),
    },
    {
      property: 'og:url',
      content: canonicalUrl,
    },
    {
      property: 'og:site_name',
      content: 'Galaxy Camera',
    },
    {
      property: 'og:image',
      content:
        'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
    },
    {
      property: 'og:image:width',
      content: '1200',
    },
    {
      property: 'og:image:height',
      content: '630',
    },
    {
      property: 'og:locale',
      content: 'id_ID',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:site',
      content: '@galaxycamera99',
    },
    {
      name: 'twitter:title',
      content: title,
    },
    {
      name: 'twitter:description',
      content: description.substring(0, 160),
    },
    {
      name: 'twitter:image',
      content:
        'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Kategori Produk Galaxy Camera',
        description,
        url: canonicalUrl,
        image:
          'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
        numberOfItems: collectionCount,
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://galaxy.co.id',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Galaxy Camera',
          logo: {
            '@type': 'ImageObject',
            url:
              'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
          },
        },
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://galaxy.co.id',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Collections',
            item: canonicalUrl,
          },
        ],
      },
    },
  ];
};

// OLD CODE - Commented for future reference
// export const meta = ({data}) =>{gi
//   return[
//     {title: "Kategori Produk Galaxy Camera Store"},
//     {
//       name: "title",
//       content: "Kategori Produk Galaxy Camera Store",
//     },
//     {
//       name: "description",
//       content: "Kategori Produk Pilihan Galaxy Camera",
//     },
//       
//   ]
// }