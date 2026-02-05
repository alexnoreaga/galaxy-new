import {flattenConnection} from '@shopify/hydrogen';

/**
 * the google limit is 50K, however, the storefront API
 * allows querying only 250 resources per pagination page
 */
const MAX_URLS = 250;

export async function loader({request, context: {storefront}}) {
  const data = await storefront.query(SITEMAP_QUERY, {
    variables: {
      urlLimits: MAX_URLS,
      language: storefront.i18n.language,
    },
  });

  if (!data) {
    throw new Response('No data found', {status: 404});
  }

  // Fetch brand category data for sitemap
  const brandCategoryData = await storefront.query(BRAND_CATEGORIES_QUERY, {
    variables: {
      first: 250,
    },
  });

  const sitemap = generateSitemap({
    data, 
    brandCategoryData,
    baseUrl: new URL(request.url).origin
  });

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',

      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

function xmlEncode(string) {
  return string.replace(/[&<>'"]/g, (char) => `&#${char.charCodeAt(0)};`);
}

function generateSitemap({data, brandCategoryData, baseUrl}) {
  // Add homepage - MOST IMPORTANT!
  const homepage = {
    url: baseUrl,
    lastMod: new Date().toISOString(),
    changeFreq: 'daily',
    priority: 1.0,
  };

  const products = flattenConnection(data.products)
    .filter((product) => product.onlineStoreUrl)
    .map((product) => {
      const url = `${baseUrl}/products/${xmlEncode(product.handle)}`;

      const productEntry = {
        url,
        lastMod: product.updatedAt,
        changeFreq: 'daily',
        priority: 0.8,
      };

      if (product.featuredImage?.url) {
        productEntry.image = {
          url: xmlEncode(product.featuredImage.url),
        };

        if (product.title) {
          productEntry.image.title = xmlEncode(product.title);
        }

        if (product.featuredImage.altText) {
          productEntry.image.caption = xmlEncode(product.featuredImage.altText);
        }
      }

      return productEntry;
    });

  const collections = flattenConnection(data.collections)
    .filter((collection) => collection.onlineStoreUrl)
    .map((collection) => {
      const url = `${baseUrl}/collections/${collection.handle}`;

      return {
        url,
        lastMod: collection.updatedAt,
        changeFreq: 'daily',
        priority: 0.7,
      };
    });

  const pages = flattenConnection(data.pages)
    .filter((page) => page.onlineStoreUrl)
    .map((page) => {
      const url = `${baseUrl}/pages/${page.handle}`;

      return {
        url,
        lastMod: page.updatedAt,
        changeFreq: 'weekly',
        priority: 0.6,
      };
    });

  // Generate brand category URLs for SEO (with clean URLs)
  const brandCategories = [];
  if (brandCategoryData?.products?.nodes) {
    // Group products by vendor (brand) and productType (category)
    const brandCategoryMap = new Map();
    
    brandCategoryData.products.nodes.forEach((product) => {
      if (product.vendor && product.productType) {
        const vendorHandle = product.vendor.toLowerCase().replace(/\s+/g, '-');
        
        if (!brandCategoryMap.has(vendorHandle)) {
          brandCategoryMap.set(vendorHandle, new Set());
        }
        brandCategoryMap.get(vendorHandle).add(product.productType);
      }
    });

    // Create sitemap entries for each brand-category combination with CLEAN URLs
    brandCategoryMap.forEach((categories, vendorHandle) => {
      categories.forEach((category) => {
        const categoryHandle = category.toLowerCase().replace(/\s+/g, '-');
        const url = `${baseUrl}/brands/${vendorHandle}/${categoryHandle}`;
        brandCategories.push({
          url,
          lastMod: new Date().toISOString(),
          changeFreq: 'weekly',
          priority: 0.7, // Same as collections for SEO importance
        });
      });
    });
  }

  const urls = [homepage, ...products, ...collections, ...pages, ...brandCategories];

  return `
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    >
      ${urls.map(renderUrlTag).join('')}
    </urlset>`;
}

function renderUrlTag({url, lastMod, changeFreq, priority, image}) {
  const imageTag = image
    ? `<image:image>
        <image:loc>${image.url}</image:loc>
        <image:title>${image.title ?? ''}</image:title>
        <image:caption>${image.caption ?? ''}</image:caption>
      </image:image>`.trim()
    : '';

  return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>${changeFreq}</changefreq>
      <priority>${priority}</priority>
      ${imageTag}
    </url>
  `.trim();
}

const SITEMAP_QUERY = `#graphql
  query Sitemap($urlLimits: Int, $language: LanguageCode)
  @inContext(language: $language) {
    products(
      first: $urlLimits
      query: "published_status:'online_store:visible'"
    ) {
      nodes {
        updatedAt
        handle
        onlineStoreUrl
        title
        featuredImage {
          url
          altText
        }
      }
    }
    collections(
      first: $urlLimits
      query: "published_status:'online_store:visible'"
    ) {
      nodes {
        updatedAt
        handle
        onlineStoreUrl
      }
    }
    pages(first: $urlLimits, query: "published_status:'published'") {
      nodes {
        updatedAt
        handle
        onlineStoreUrl
      }
    }
  }
`;

const BRAND_CATEGORIES_QUERY = `#graphql
  query BrandCategories($first: Int!) {
    products(first: $first) {
      nodes {
        vendor
        productType
      }
    }
  }
`;
