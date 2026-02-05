import {json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link, Form, useParams, useNavigate, useLocation} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/utils';
import { useEffect, useState } from 'react';
import {defer} from '@shopify/remix-oxygen';
import { HitunganPersen } from '~/components/HitunganPersen';
import { BrandSEOContent } from '~/components/BrandSEOContent';

export const meta = ({data, location}) => {
  const rawHandle = data?.handle || '';
  const brandName = rawHandle
    ? rawHandle.charAt(0).toUpperCase() + rawHandle.slice(1)
    : 'Brand';
  
  // Get category from data (passed from loader)
  const selectedCategory = data?.selectedCategory || '';

  // ENHANCED - Better title with keywords and dynamic month/year
  const today = new Date();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const indonesianMonth = monthNames[today.getMonth()];
  const year = today.getFullYear();

  // ENHANCED - Category-specific title for SEO
  const title = selectedCategory 
    ? `${brandName} ${selectedCategory} - Harga Terbaik ${indonesianMonth} ${year} | Galaxy Camera`
    : `${brandName} - Produk Resmi Harga Terbaik ${indonesianMonth} ${year} | Galaxy Camera`;

  // ENHANCED - Category-specific description for better SEO
  const description = selectedCategory
    ? `Koleksi lengkap ${brandName} ${selectedCategory} original garansi resmi. Harga terbaik, cicilan 0%, gratis ongkir. Belanja ${selectedCategory} ${brandName} aman di Galaxy Camera.`
    : `Jelajahi koleksi lengkap produk ${brandName} original dengan harga terbaik. Garansi resmi, cicilan 0%, gratis ongkir. Belanja aman di Galaxy Camera toko kamera terpercaya.`;

  // ENHANCED - Category-specific keywords
  const keywords = selectedCategory
    ? `${brandName} ${selectedCategory}, ${selectedCategory} ${brandName}, jual ${brandName} ${selectedCategory}, harga ${brandName} ${selectedCategory}, ${selectedCategory} murah, ${selectedCategory} original, ${brandName} terbaik`
    : `${brandName}, produk ${brandName}, ${brandName} murah, ${brandName} original, ${brandName} garansi resmi, jual ${brandName}, harga ${brandName}, kamera ${brandName}`;

  // ENHANCED - Include category in canonical URL for SEO crawling
  let canonicalUrl = location?.pathname
    ? `https://galaxy.co.id${location.pathname}`
    : `https://galaxy.co.id/brands/${rawHandle}`;
  
  // Add category to canonical URL so Google can index filtered pages
  if (selectedCategory && location?.search) {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      canonicalUrl = `${canonicalUrl}?category=${encodeURIComponent(categoryParam)}`;
    }
  }

  // ENHANCED - Product count info
  const productCount = data?.data?.products?.nodes?.length || 0;

  return [
    // Basic Meta Tags
    { title },
    { 
      name: 'description', 
      content: description.substring(0, 160)
    },
    {
      name: 'keywords',
      content: keywords,
    },
    {
      name: 'author',
      content: 'Galaxy Camera',
    },

    // Robots & Indexing
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large, max-snippet:-1',
    },

    // Canonical URL
    {
      tagName: 'link',
      rel: 'canonical',
      href: canonicalUrl,
    },

    // Open Graph Tags (Facebook, WhatsApp)
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
      content: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
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

    // Twitter Card Tags
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
      content: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
    },

    // Collection/Brand Schema (JSON-LD)
    {
      'script:ld+json:collection': {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': `${brandName} - Galaxy Camera`,
        'description': description,
        'url': canonicalUrl,
        'image': 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
        'publisher': {
          '@type': 'Organization',
          'name': 'Galaxy Camera',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
          },
        },
        'isPartOf': {
          '@type': 'WebSite',
          '@id': 'https://galaxy.co.id',
        },
      },
    },

    // BreadcrumbList Schema - Enhanced with category
    {
      'script:ld+json:breadcrumb': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': selectedCategory ? [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://galaxy.co.id',
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Brands',
            'item': 'https://galaxy.co.id/brands',
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': brandName,
            'item': `https://galaxy.co.id/brands/${rawHandle}`,
          },
          {
            '@type': 'ListItem',
            'position': 4,
            'name': selectedCategory,
            'item': canonicalUrl,
          },
        ] : [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://galaxy.co.id',
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Brands',
            'item': 'https://galaxy.co.id/brands',
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': brandName,
            'item': canonicalUrl,
          },
        ],
      },
    },

    // Product Collection Schema - Enhanced with category
    {
      'script:ld+json:items': {
        '@context': 'https://schema.org',
        '@type': 'ItemCollection',
        'name': selectedCategory ? `Koleksi ${brandName} ${selectedCategory}` : `Koleksi ${brandName}`,
        'description': description,
        'url': canonicalUrl,
        'numberOfItems': productCount,
        'isPartOf': {
          '@type': 'Organization',
          'name': 'Galaxy Camera',
          'url': 'https://galaxy.co.id',
        },
      },
    },
  ].filter(Boolean);
};

// OLD CODE - Commented for future reference
// export const meta = ({data, location}) => {
//   const rawHandle = data?.handle || '';
//   const brandName = rawHandle
//     ? rawHandle.charAt(0).toUpperCase() + rawHandle.slice(1)
//     : 'Brand';

//   const title = `Produk ${brandName} | Brand Resmi`;
//   const description = `Jelajahi koleksi produk ${brandName} terbaru, harga terbaik, dan promo menarik. Belanja aman di toko kami.`;

//   const canonicalUrl = location?.pathname
//     ? `${location.pathname}`
//     : undefined;

//   return [
//     {title},
//     {name: 'description', content: description},
//     canonicalUrl
//       ? {tagName: 'link', rel: 'canonical', href: canonicalUrl}
//       : null,
//   ].filter(Boolean);
// };


// ADDITIONAL OLD CODE - Commented for future reference
// export const meta = ({data}) => {

//   const collectionTitle = data?.collection?.seo.title
//     ?data?.collection?.seo.title
//     :data?.collection?.title;

//     const today = new Date();
//     const monthNames = [
//       "Januari", "Februari", "Maret", "April", "Mei", "Juni",
//       "Juli", "Agustus", "September", "Oktober", "November", "Desember"
//     ];
//     const indonesianMonth = monthNames[today.getMonth()];
//     const year = today.getFullYear();
//     const title = `${collectionTitle} - ${indonesianMonth} ${year}`;

//   return [
//     {title},
//     {
//       name: "description",
//       content: data?.collection?.seo.description
//       ? data.collection.seo.description.substr(0, 155)
//       : data?.collection?.description.substr(0, 155),
//     },
//   ];
// };

export async function loader({params, context, request}) {
  
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Support both:
  // 1. Clean URL: /brands/fujifilm/kamera-compact
  // 2. Query param: /brands/fujifilm?category=Kamera+Compact
  
  // Extract category from path if it exists
  const pathSegments = pathname.split('/').filter(Boolean);
  let categoryFromPath = '';
  let categoryNameFromPath = '';
  
  if (pathSegments.length > 2 && pathSegments[0] === 'brands') {
    // /brands/:handle/:category format
    categoryFromPath = pathSegments[2]; // e.g., "kamera-compact"
    // Decode and convert to display name: "kamera-compact" -> "Kamera Compact"
    categoryNameFromPath = decodeURIComponent(categoryFromPath)
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  const reverse = url.searchParams.get("reverse") === 'true' ? true : false;
  const sortKey = url.searchParams.get("sortkey")?.toUpperCase();
  const categoryParam = url.searchParams.get("category") || '';
  const minPrice = url.searchParams.get("minPrice") || '';
  const maxPrice = url.searchParams.get("maxPrice") || '';
  const categoryPage = parseInt(url.searchParams.get("categoryPage") || '1');
  
  // Use category from path if available, otherwise from query param
  const category = categoryNameFromPath || categoryParam;
  
  const pageBy = 8;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: pageBy,
  });

  if (!handle) {
    return redirect('/brands');
  }

  // Build query string with filters
  let query = `vendor:${handle}`;
  if (minPrice || maxPrice) {
    const min = minPrice || '0';
    const max = maxPrice || '999999999';
    query += ` price:[${min} TO ${max}]`;
  }

  // When no filters, use normal pagination. When filtering by category, fetch max allowed (250)
  const fetchCount = category ? 250 : pageBy;

  const data = await context.storefront.query(BRAND_QUERY, {
    variables: {
      first: fetchCount,
      query: query,
      reverse,
      sortkey: sortKey,
      ...(category ? {} : paginationVariables),
    },
  });

  if (!data) {
    throw new Response(`Brands ${handle} tidak ditemukan`, {
      status: 404,
    });
  }

  // Client-side filtering by category
  let filteredProducts = data.products.nodes;
  let pageInfo = data.products.pageInfo;
  
  if (category) {
    filteredProducts = data.products.nodes.filter(
      product => product.productType === category
    );
    
    // Calculate pagination for filtered results
    const totalFilteredProducts = filteredProducts.length;
    const startIndex = (categoryPage - 1) * pageBy;
    const endIndex = startIndex + pageBy;
    const displayedProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Update pageInfo for pagination
    pageInfo = {
      ...data.products.pageInfo,
      hasNextPage: endIndex < totalFilteredProducts,
      hasPreviousPage: categoryPage > 1,
      startCursor: `cat-${categoryPage}`,
      endCursor: `cat-${categoryPage}`,
    };
    
    filteredProducts = displayedProducts;
  }

  // Get all product types for category filter
  const allProductsData = await context.storefront.query(ALL_PRODUCTS_FOR_CATEGORIES, {
    variables: {
      query: `vendor:${handle}`,
    },
  });

  const categories = [...new Set(allProductsData.products.nodes.map(p => p.productType).filter(Boolean))].sort();

  return json({
    data: {...data, products: {...data.products, nodes: filteredProducts, pageInfo: pageInfo}}, 
    handle, 
    categories, 
    selectedCategory: category,
    categoryPage: categoryPage
  });
}

export default function BrandHandle() {
  const {data, handle, categories, selectedCategory, categoryPage} = useLoaderData();
  const location = useLocation();
  const [formData, setFormData] = useState('');
  const [selectedCat, setSelectedCat] = useState(selectedCategory || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(categoryPage || 1);

  // Update currentPage when loader data changes
  useEffect(() => {
    setCurrentPage(categoryPage || 1);
  }, [categoryPage]);
  
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    setFormData(event.target.selectedOptions[0].textContent.trim());
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('sortkey', event.target.selectedOptions[0].getAttribute('sortKey'));
    searchParams.set('reverse', event.target.selectedOptions[0].getAttribute('data-reverse'));
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const handleCategoryChange = (event) => {
    const category = event.target.value;
    setSelectedCat(category);
    const searchParams = new URLSearchParams(location.search);
    if (category) {
      searchParams.set('category', category);
    } else {
      searchParams.delete('category');
    }
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const handlePriceFilter = () => {
    const searchParams = new URLSearchParams(location.search);
    if (minPrice) searchParams.set('minPrice', minPrice);
    if (maxPrice) searchParams.set('maxPrice', maxPrice);
    // Reset to page 1 when applying filters
    searchParams.delete('categoryPage');
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const handleCategoryPageChange = (newPage) => {
    if (newPage < 1) return;
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('categoryPage', newPage.toString());
    window.location.href = `${location.pathname}?${searchParams.toString()}`;
  };

  return (
    <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <h1 className="mb-6">
        {selectedCategory 
          ? `${handle.charAt(0).toUpperCase() + handle.slice(1)} ${selectedCategory}` 
          : handle.charAt(0).toUpperCase() + handle.slice(1)
        }
      </h1>
      
      {/* SEO-Friendly Category Navigation Links (for Google crawling) */}
      {categories && categories.length > 0 && (
        <nav className="mb-6 p-4 bg-white border border-gray-200 rounded-lg" aria-label="Category navigation">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Kategori {handle.charAt(0).toUpperCase() + handle.slice(1)}:</h2>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/brands/${handle}`}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-semibold ${
                !selectedCategory 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua Produk
            </a>
            {categories.map((cat) => {
              const catHandle = encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'));
              const isActive = selectedCategory === cat;
              return (
                <a
                  key={cat}
                  href={`/brands/${handle}/${catHandle}`}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-semibold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </a>
              );
            })}
          </div>
        </nav>
      )}
      
      {/* Filters Section - Price & Sort Only */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {/* Min Price Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="minPrice" className='text-gray-900 text-sm font-bold'>Harga Min</label>
          <input
            type="number"
            id="minPrice"
            placeholder="Rp 0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
          />
        </div>

        {/* Max Price Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="maxPrice" className='text-gray-900 text-sm font-bold'>Harga Max</label>
          <input
            type="number"
            id="maxPrice"
            placeholder="Rp 999999999"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex flex-col gap-2">
          <label htmlFor="sort" className='text-gray-900 text-sm font-bold'>Urutkan</label>
          <select
            id="sort"
            value={formData}
            onChange={handleInputChange}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
          >
            <option value="" disabled>Pilih...</option>
            <option sortkey="RELEVANCE" data-reverse="false">Relevansi</option>
            <option sortkey="TITLE" data-reverse="false">A-Z</option>
            <option sortkey="TITLE" data-reverse="true">Z-A</option>
            <option sortkey="PRICE" data-reverse="false">Harga Terendah</option>
            <option sortkey="PRICE" data-reverse="true">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={handlePriceFilter}
        className="mb-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        Terapkan Filter
      </button>

      {/* Pagination */}
      {selectedCategory ? (
        // Custom pagination for category-filtered pages
        <div className="mt-8 space-y-4">
          <ProductsGrid products={data.products.nodes} />
          <div className="flex justify-between items-center gap-4 mt-6">
            <button
              onClick={() => handleCategoryPageChange(currentPage - 1)}
              disabled={!data.products.pageInfo.hasPreviousPage}
              className="px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ↑ Previous
            </button>
            <span className="text-sm font-semibold text-gray-600">
              Page {currentPage}
            </span>
            <button
              onClick={() => handleCategoryPageChange(currentPage + 1)}
              disabled={!data.products.pageInfo.hasNextPage}
              className="px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next ↓
            </button>
          </div>
        </div>
      ) : (
        // Standard Shopify pagination for non-filtered brand pages
        <Pagination connection={data.products}>
          {({nodes, isLoading, PreviousLink, NextLink}) => (
            <>
              <PreviousLink>
                {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
              </PreviousLink>
              <ProductsGrid products={nodes} />
              <br />
              <NextLink>
                {isLoading ? 'Loading...' : <span className="mb-12 font-bold text-center bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block p-2.5">Load more ↓</span>}
              </NextLink>
            </>
          )}
        </Pagination>
      )}
      
      {/* SEO Content Section */}
      <BrandSEOContent 
        brandName={handle.charAt(0).toUpperCase() + handle.slice(1)} 
        category={selectedCategory || 'Produk'}
        products={data.products.nodes}
      />
    </div>
  );
}

function ProductsGrid({products}) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}

function ProductItem({product, loading}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  
  return (
    <Link
      className="hover:no-underline border shadow rounded-lg p-2"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className='relative'>
        {product.featuredImage && (
          <Image
            alt={product.featuredImage.altText || product.title}
            aspectRatio="1/1"
            data={product.featuredImage}
            loading={loading}
            sizes="(min-width: 45em) 20vw, 50vw"
            className={`hover:opacity-80 ${product.availableForSale == "false" && 'opacity-50'} ${!product.availableForSale && 'opacity-50'}`}
          />
        )}
        {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && (
          <div className="absolute p-1 rounded bg-gradient-to-r from-rose-800 to-rose-700 font-bold text-xs text-white top-1 right-0">Promo</div>
        )}
        {!product.availableForSale && (
          <div className="text-center absolute p-1 rounded bg-amber-400 font-bold text-xs text-black top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            Stock Kosong
          </div>
        )}
      </div>
      
      <div className='text-sm my-1 text-gray-800'>{product.title}</div>
      
      {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && (
        <div className='text-sm line-through text-gray-600'>
          <div>Rp{parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount).toLocaleString("id-ID")}</div>
        </div>
      )}

      <div className='text-xs font-bold text-gray-800 flex flex-row items-center gap-1 mb-2 mt-2'>
        {parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && (
          <div className='bg-rose-700 p-0.5 ml-0 text-white text-xs rounded'>
            <HitunganPersen hargaSebelum={product.compareAtPriceRange.minVariantPrice.amount} hargaSesudah={product.priceRange.minVariantPrice.amount}/>
          </div>
        )}
        <div className={`text-sm font-semibold ${parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) > parseFloat(product.priceRange.minVariantPrice.amount) && 'text-rose-800'}`}>
          Rp{parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString("id-ID")}
        </div>
      </div>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    availableForSale
    title
    productType
    featuredImage {
      id
      altText
      url
      width
      height
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

const BRAND_QUERY = `#graphql
${PRODUCT_ITEM_FRAGMENT}
query Brand(
  $first: Int!
  $query: String!
  $startCursor: String
  $endCursor: String
  $reverse: Boolean = false
  $sortkey: ProductSortKeys
) {
  products(
    first: $first
    query: $query
    before: $startCursor
    after: $endCursor
    reverse: $reverse
    sortKey: $sortkey
  ) {
    pageInfo {
      hasNextPage
      hasPreviousPage
      endCursor
      startCursor
    }
    nodes {
      ...ProductItem
    }
  }
}
`;

const ALL_PRODUCTS_FOR_CATEGORIES = `#graphql
query AllProducts(
  $query: String!
) {
  products(
    first: 250
    query: $query
  ) {
    nodes {
      id
      productType
    }
  }
}
`;

// const today = new Date();
// const month = today.getMonth() + 1;

// const indonesianMonths = [
//   'Januari',
//   'Februari',
//   'Maret',
//   'April',
//   'Mei',
//   'Juni',
//   'Juli',
//   'Agustus',
//   'September',
//   'Oktober',
//   'November',
//   'Desember',
// ];

// const indonesianMonth = indonesianMonths[month - 1];
// const year = today.getFullYear();


// const seo = ({data}) => ({
//   title: data?.collection?.seo.title
//   ?data?.collection?.seo.title
//   :data?.collection?.title,
//   titleTemplate: '%s - ' + indonesianMonth + ' ' + year,
//   description: data?.collection?.seo.description
//   ? data.collection.seo.description.substr(0, 155)
//   : data?.collection?.description.substr(0, 155),
// });

// export const handle = {
//   seo,
// };
