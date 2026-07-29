import {useLoaderData, Link, useNavigate} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {Pagination, getPaginationVariables, Image} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';

// Infinite scroll — auto-loads the next page as the sentinel nears the viewport (same as collections handle)
function InfiniteLoader({hasNextPage, nextPageUrl, isLoading, state}) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const triggered = useRef(null);
  useEffect(() => {
    if (!hasNextPage || !nextPageUrl) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && triggered.current !== nextPageUrl) {
        triggered.current = nextPageUrl;
        navigate(nextPageUrl, {replace: true, preventScrollReset: true, state});
      }
    }, {rootMargin: '600px 0px'});
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, nextPageUrl, isLoading, state, navigate]);

  if (!hasNextPage) {
    return <p className="text-center text-xs text-gray-400 mt-10">— Semua kategori sudah ditampilkan —</p>;
  }
  return (
    <div ref={ref} className="flex justify-center py-10">
      <span className="inline-flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Memuat kategori…
      </span>
    </div>
  );
}



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

  const HIDDEN_HANDLES = ['flash-sale'];
  collections.nodes = collections.nodes.filter(c => !HIDDEN_HANDLES.includes(c.handle));

  return json({collections});
}

export default function Collections() {
  const {collections} = useLoaderData();

  return (
    <div className="container mx-auto sm:px-6 lg:px-12 py-6 md:py-10">

      {/* Page header */}
      <div className="mb-6 md:mb-8">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <Link to="/" prefetch="intent" className="hover:text-gray-600 no-underline">Home</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">Kategori</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Kategori Produk</h1>
        <p className="text-sm text-gray-500 mt-1">Jelajahi semua kategori — kamera, lensa, drone, hingga aksesoris.</p>
      </div>

      <Pagination connection={collections}>
        {({nodes, isLoading, PreviousLink, hasNextPage, nextPageUrl, state}) => (
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

            {/* Infinite scroll — replaces the old "Muat lebih banyak" button */}
            <InfiniteLoader
              hasNextPage={hasNextPage}
              nextPageUrl={nextPageUrl}
              isLoading={isLoading}
              state={state}
            />
          </div>
        )}
      </Pagination>
    </div>
  );
}

function CollectionsGrid({collections}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 md:gap-4">
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
      <div className="flex flex-col items-center gap-2.5 p-2.5 md:p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
        <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-gray-100">
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
        <span className="text-[11px] md:text-sm font-semibold text-gray-800 text-center group-hover:text-gray-900 transition-colors duration-200 line-clamp-2 leading-tight">
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