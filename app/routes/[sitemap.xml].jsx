import {flattenConnection} from '@shopify/hydrogen';
import {buildCatalogIndex, MIN_PRODUCTS} from '~/lib/catalogIndex';

/**
 * the google limit is 50K, however, the storefront API
 * allows querying only 250 resources per pagination page
 */
const MAX_URLS = 250;

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

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

  // The first query only returns the first 250 products. Page through the rest so the
  // sitemap lists EVERY product (Luna Ultra & ~4,000 others were missing). Hard cap of
  // 25 pages (6,250 products) as a safety net; cached long so crawlers don't re-trigger it.
  try {
    let pageInfo = data?.products?.pageInfo;
    let pages = 0;
    while (pageInfo?.hasNextPage && pageInfo?.endCursor && pages < 25) {
      const more = await storefront.query(SITEMAP_PRODUCTS_PAGE_QUERY, {
        variables: { after: pageInfo.endCursor, language: storefront.i18n.language },
        cache: storefront.CacheLong(),
      });
      const nodes = more?.products?.nodes ?? [];
      if (!nodes.length) break;
      data.products.nodes.push(...nodes);
      pageInfo = more?.products?.pageInfo;
      pages++;
    }
  } catch {
    // best-effort: a paging hiccup still leaves a valid (partial) sitemap
  }

  // Fetch brand category data + Firestore comparisons in parallel
  const [brandCategoryData, comparisonRes, rekomendasiRes] = await Promise.all([
    // Brand × category index from the product walk above (every product, not the old first-250
    // sample whose slugs did not even match the route — "tripod/monopod").
    Promise.resolve(buildCatalogIndex(data.products.nodes)).catch((e) => { console.error('[sitemap] brand index', e?.message || e); return null; }),
    fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'comparisons' }],
          select: { fields: [{ fieldPath: 'generatedAt' }] },
          orderBy: [{ field: { fieldPath: 'generatedAt' }, direction: 'DESCENDING' }],
          limit: 500,
        },
      }),
    }).catch(() => null),
    fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'rekomendasi' }],
          select: { fields: [{ fieldPath: 'createdAt' }] },
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 500,
        },
      }),
    }).catch(() => null),
  ]);

  let comparisons = [];
  if (comparisonRes?.ok) {
    const compData = await comparisonRes.json().catch(() => []);
    comparisons = (compData || [])
      .filter(r => r.document)
      .map(r => ({
        slug: r.document.name.split('/').pop(),
        generatedAt: r.document.fields?.generatedAt?.stringValue || new Date().toISOString(),
      }));
  }

  let rekomendasiList = [];
  if (rekomendasiRes?.ok) {
    const rekData = await rekomendasiRes.json().catch(() => []);
    rekomendasiList = (rekData || [])
      .filter(r => r.document)
      .map(r => ({
        slug: r.document.name.split('/').pop(),
        createdAt: r.document.fields?.createdAt?.stringValue || new Date().toISOString(),
      }));
  }

  const sitemap = generateSitemap({
    data,
    brandCategoryData,
    comparisons,
    rekomendasiList,
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

function generateSitemap({data, brandCategoryData, comparisons, rekomendasiList, baseUrl}) {
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
  const brands = new Set(); // Track unique brands
  
  if (brandCategoryData?.brands?.length) {
    const today = new Date().toISOString().slice(0, 10);
    for (const b of brandCategoryData.brands) {
      if (b.count < MIN_PRODUCTS) continue; // thin brand pages are noindex on the route anyway
      brands.add(b.handle);
      brandCategories.push({ url: xmlEncode(`${baseUrl}/brands/${b.handle}`), lastMod: today, changeFreq: 'weekly', priority: 0.8 });
      // marketplace-style "find" pages: one per brand × category with enough products
      for (const c of b.categories) {
        if (c.count < MIN_PRODUCTS) continue;
        brandCategories.push({ url: xmlEncode(`${baseUrl}/brands/${b.handle}/${c.slug}`), lastMod: today, changeFreq: 'weekly', priority: 0.7 });
      }
    }
  }

  // Branch pages (/stores + one page per metaobject store_location) — local SEO landing pages
  const storePages = [{ url: `${baseUrl}/stores`, lastMod: new Date().toISOString().slice(0, 10), changeFreq: 'monthly', priority: 0.7 }];
  for (const st of data?.stores?.nodes ?? []) {
    if (!st?.handle) continue;
    storePages.push({ url: xmlEncode(`${baseUrl}/stores/${st.handle}`), lastMod: (st.updatedAt || new Date().toISOString()).slice(0, 10), changeFreq: 'monthly', priority: 0.7 });
  }
  brandCategories.push(...storePages);

  // Perbandingan index + individual pages from Firestore
  const perbandinganIndex = {
    url: `${baseUrl}/perbandingan`,
    lastMod: new Date().toISOString(),
    changeFreq: 'daily',
    priority: 0.8,
  };
  const perbandinganPages = (comparisons || []).map(c => ({
    url: `${baseUrl}/perbandingan/${c.slug}`,
    lastMod: c.generatedAt,
    changeFreq: 'weekly',
    priority: 0.7,
  }));

  const rekomendasiIndex = {
    url: `${baseUrl}/rekomendasi`,
    lastMod: new Date().toISOString(),
    changeFreq: 'daily',
    priority: 0.8,
  };
  const rekomendasiPages = (rekomendasiList || []).map(r => ({
    url: `${baseUrl}/rekomendasi/${r.slug}`,
    lastMod: r.createdAt,
    changeFreq: 'weekly',
    priority: 0.75,
  }));

  const urls = [homepage, ...products, ...collections, ...pages, ...brandCategories, perbandinganIndex, ...perbandinganPages, rekomendasiIndex, ...rekomendasiPages];

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
      pageInfo { hasNextPage endCursor }
      nodes {
        updatedAt
        handle
        onlineStoreUrl
        title
        vendor
        productType
        availableForSale
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
    stores: metaobjects(type: "store_location", first: 20) {
      nodes { handle updatedAt }
    }
  }
`;

// Follow-up pages for products (Storefront caps a page at 250; the store has ~4,400).
const SITEMAP_PRODUCTS_PAGE_QUERY = `#graphql
  query SitemapProductsPage($after: String, $language: LanguageCode)
  @inContext(language: $language) {
    products(
      first: 250
      after: $after
      query: "published_status:'online_store:visible'"
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        updatedAt
        handle
        onlineStoreUrl
        title
        vendor
        productType
        availableForSale
        featuredImage {
          url
          altText
        }
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
