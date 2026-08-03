import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {Image, Pagination, getPaginationVariables} from '@shopify/hydrogen';

export const meta = ({data}) => {
  const blog = data?.blog;
  const title = `${blog?.seo?.title || blog?.title || 'Blog'} | Galaxy Camera`;
  const description =
    blog?.seo?.description ||
    'Tips, review, dan berita seputar kamera, lensa, drone & fotografi dari Galaxy Camera.';
  return [
    {title},
    {name: 'description', content: description},
    {name: 'robots', content: 'index, follow'},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: 'Galaxy Camera'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
  ];
};

export const loader = async ({request, params, context: {storefront}}) => {
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  if (!params.blogHandle) {
    throw new Response('blog not found', {status: 404});
  }

  const {blog} = await storefront.query(BLOG_QUERY, {
    variables: {blogHandle: params.blogHandle, ...paginationVariables},
  });

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  return json({blog});
};

export default function Blog() {
  const {blog} = useLoaderData();
  const {articles} = blog;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
        <Link to="/" prefetch="intent" className="hover:text-gray-600 no-underline">Home</Link>
        <span>/</span>
        <span className="text-gray-600 font-medium">Blog</span>
      </nav>

      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{blog.title}</h1>
        <p className="text-sm text-gray-500 mt-1">Tips, review &amp; berita seputar kamera dari Galaxy Camera.</p>
      </header>

      <Pagination connection={articles}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            <PreviousLink>
              <div className="flex justify-center mb-6">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-all shadow-sm">
                  {isLoading ? 'Memuat…' : '↑ Artikel sebelumnya'}
                </span>
              </div>
            </PreviousLink>

            {nodes.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-16">Belum ada artikel di blog ini.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {nodes.map((article, index) => (
                  <ArticleCard article={article} key={article.id} loading={index < 3 ? 'eager' : 'lazy'} />
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

function ArticleCard({article, loading}) {
  const date = new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      prefetch="intent"
      className="group block rounded-2xl border border-gray-100 overflow-hidden bg-white hover:shadow-md hover:border-gray-200 transition-all no-underline"
    >
      {article.image ? (
        <div className="aspect-[3/2] overflow-hidden bg-gray-50">
          <Image
            alt={article.image.altText || article.title}
            aspectRatio="3/2"
            data={article.image}
            loading={loading}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[3/2] bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-300 text-4xl">📷</div>
      )}
      <div className="p-4">
        <h2 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
          {article.title}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          {article.author?.name && (
            <>
              <span>{article.author.name}</span>
              <span>·</span>
            </>
          )}
          <time dateTime={article.publishedAt}>{date}</time>
        </div>
      </div>
    </Link>
  );
}

const BLOG_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
  fragment ArticleItem on Article {
    id
    title
    handle
    publishedAt
    author: authorV2 {
      name
    }
    image {
      id
      altText
      url
      width
      height
    }
    blog {
      handle
    }
  }
`;
