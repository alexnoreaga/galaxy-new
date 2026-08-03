import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {Pagination, getPaginationVariables} from '@shopify/hydrogen';

export const meta = () => {
  const title = 'Blog & Artikel | Galaxy Camera';
  const description =
    'Tips, review, dan berita seputar kamera, lensa, drone & fotografi dari Galaxy Camera — toko kamera bergaransi resmi sejak 2014.';
  return [
    {title},
    {name: 'description', content: description},
    {name: 'robots', content: 'index, follow'},
    {tagName: 'link', rel: 'canonical', href: 'https://galaxy.co.id/blogs'},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: 'Galaxy Camera'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
  ];
};

export const loader = async ({request, context: {storefront}}) => {
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  const {blogs} = await storefront.query(BLOGS_QUERY, {
    variables: {...paginationVariables},
  });

  return json({blogs});
};

export default function Blogs() {
  const {blogs} = useLoaderData();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
        <Link to="/" prefetch="intent" className="hover:text-gray-600 no-underline">Home</Link>
        <span>/</span>
        <span className="text-gray-600 font-medium">Blog</span>
      </nav>

      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Blog &amp; Artikel</h1>
        <p className="text-sm text-gray-500 mt-1">Tips, review &amp; berita seputar kamera dari Galaxy Camera.</p>
      </header>

      <Pagination connection={blogs}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            <PreviousLink>
              <div className="flex justify-center mb-6">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-all shadow-sm">
                  {isLoading ? 'Memuat…' : '↑ Sebelumnya'}
                </span>
              </div>
            </PreviousLink>

            {nodes.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-16">Belum ada blog.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nodes.map((blog) => (
                  <Link
                    key={blog.handle}
                    to={`/blogs/${blog.handle}`}
                    prefetch="intent"
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md hover:border-gray-200 transition-all no-underline"
                  >
                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{blog.title}</h2>
                      {blog.seo?.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{blog.seo.description}</p>
                      )}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}

            <NextLink>
              <div className="flex justify-center mt-8">
                <span className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all shadow-sm">
                  {isLoading ? 'Memuat…' : 'Muat lebih banyak ↓'}
                </span>
              </div>
            </NextLink>
          </div>
        )}
      </Pagination>
    </div>
  );
}

const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
      }
    }
  }
`;
