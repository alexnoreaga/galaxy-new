import {json} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';

const LOGO = 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png?v=1731132105';

export const meta = ({data}) => {
  const article = data?.article;
  if (!article) return [{title: 'Artikel tidak ditemukan | Galaxy Camera'}];

  const description = (article.seo?.description || article.content || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  const title = article.seo?.title || article.title;
  const url = data.canonicalUrl;
  const image = article.image?.url;

  return [
    {title: `${title} | Galaxy Camera`},
    {name: 'description', content: description},
    {name: 'author', content: article.author?.name || 'Galaxy Camera'},
    {name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1'},
    {tagName: 'link', rel: 'canonical', href: url},

    // Open Graph
    {property: 'og:type', content: 'article'},
    {property: 'og:site_name', content: 'Galaxy Camera'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: url},
    ...(image
      ? [
          {property: 'og:image', content: image},
          {property: 'og:image:width', content: String(article.image?.width || 1200)},
          {property: 'og:image:height', content: String(article.image?.height || 630)},
        ]
      : []),
    {property: 'article:published_time', content: article.publishedAt},
    ...(article.author?.name ? [{property: 'article:author', content: article.author.name}] : []),

    // Twitter
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    ...(image ? [{name: 'twitter:image', content: image}] : []),

    // Structured data — BlogPosting
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description,
        ...(image ? {image: [image]} : {}),
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        author: {
          '@type': article.author?.name ? 'Person' : 'Organization',
          name: article.author?.name || 'Galaxy Camera',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Galaxy Camera',
          logo: {'@type': 'ImageObject', url: LOGO},
        },
        mainEntityOfPage: {'@type': 'WebPage', '@id': url},
      },
    },
  ];
};

export async function loader({request, params, context}) {
  const {blogHandle, articleHandle} = params;
  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const {blog} = await context.storefront.query(ARTICLE_QUERY, {
    variables: {blogHandle, articleHandle},
  });

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  // Clean canonical — strip query/tracking params
  const u = new URL(request.url);
  const canonicalUrl = u.origin + u.pathname;

  return json({article: blog.articleByHandle, blogHandle, canonicalUrl});
}

export default function Article() {
  const {article, blogHandle} = useLoaderData();
  const {title, image, contentHtml, author, publishedAt} = article;

  const publishedDate = new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(publishedAt));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap" aria-label="Breadcrumb">
        <Link to="/" prefetch="intent" className="hover:text-gray-600 no-underline">Home</Link>
        <span>/</span>
        <Link to={`/blogs/${blogHandle}`} prefetch="intent" className="hover:text-gray-600 no-underline">Blog</Link>
        <span>/</span>
        <span className="text-gray-600 line-clamp-1">{title}</span>
      </nav>

      {/* Header */}
      <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">{title}</h1>
      <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 mt-3">
        {author?.name && (
          <>
            <span className="font-medium text-gray-700">{author.name}</span>
            <span className="text-gray-300">·</span>
          </>
        )}
        <time dateTime={publishedAt}>{publishedDate}</time>
      </div>

      {/* Hero image */}
      {image && (
        <div className="mt-6 rounded-2xl overflow-hidden bg-gray-50">
          <Image
            data={image}
            alt={image.altText || title}
            sizes="(min-width: 768px) 768px, 100vw"
            loading="eager"
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Content */}
      <article
        className="prose prose-gray max-w-none mt-8 prose-img:rounded-xl prose-headings:tracking-tight prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{__html: contentHtml}}
      />

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <Link
          to={`/blogs/${blogHandle}`}
          prefetch="intent"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 no-underline"
        >
          ← Semua Artikel
        </Link>
        <span className="text-xs text-gray-400">
          {publishedDate}
          {author?.name ? ` · ${author.name}` : ''}
        </span>
      </div>
    </div>
  );
}

const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        title
        contentHtml
        content
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
        seo {
          description
          title
        }
      }
    }
  }
`;
