import {json} from '@shopify/remix-oxygen';
import {useLoaderData,useMatches,Link} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {useLocation } from 'react-router-dom';


export const handle = {


  breadcrumb: () => <Link to="/blogs/artikel">Home</Link>,
};

export const meta = ({data}) => {
  
  // console.log('Ini adalah data Blog ',data)

  return [
    {title: `${data.article.title}`},
    {name: "title",
    content: `${data.article.title}`},

    {name: "description",
    content: data.article?.seo?.description.substr(0, 155)
    ?  data.article?.seo?.description.substr(0, 155)
    : data.article?.content},

    { tagName:'link',
      rel:'canonical',
      href: data.canonicalUrl
    },
    {
      property: "og:title",
      content: data?.article?.title,
    },
    {
      name: "og:image",
      content: data?.article?.image?.url,
    },

    {name: "og:description",
    content: data.article?.seo?.description.substr(0, 155)
    ?  data.article?.seo?.description.substr(0, 155)
    : data.article?.content},
    {
      property: "og:type",
      content: "article",
    },
    {
      property: "og:site_name",
      content: "galaxy.co.id",
    },
    {
      property: "og:url",
      content: data.canonicalUrl,
    },

];
};




export async function loader({request,params, context}) {
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

  const article = blog.articleByHandle;

  const canonicalUrl = request.url

  return json({article,canonicalUrl});
}

export default function Article() {
  const {article} = useLoaderData();
  const {title, image, contentHtml, author} = article;

  const matches = useMatches();

  

  console.log('Artikel adalah, ', matches)

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <h1>
        {title}
      </h1>
     

     

      <div className="mb-8 relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      {image && <Image data={image} sizes="90vw" loading="eager" />}
      </div>

      
  
      <div
        dangerouslySetInnerHTML={{__html: contentHtml}}
        className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl prose"
      />

<div className='text-sm text-gray-600 text-right mt-5 mb-10'>
<span >
          {publishedDate} &middot; {author?.name}
        </span>
        </div>
   
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
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
