import {json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link, Form, useParams, useFetcher, useActionData, useNavigate, useSubmit} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/utils';
import {useLocation} from 'react-router-dom';
import React, {useEffect, useState} from 'react';
import {HitunganPersen} from '~/components/HitunganPersen';
import {CollectionSEOContent} from '~/components/CollectionSEOContent';

export const handle = {
  breadcrumbType: 'collection',
};

export const meta = ({data}) => {
  const collectionTitle = data?.collection?.seo?.title
    ? data?.collection?.seo.title
    : data?.collection?.title;

  const collectionDescription = data?.collection?.seo?.description
    ? data?.collection?.seo.description
    : data?.collection?.description;

  const today = new Date();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const indonesianMonth = monthNames[today.getMonth()];
  const year = today.getFullYear();

  const title = `${collectionTitle} - Harga Terbaik ${indonesianMonth} ${year} | Galaxy Camera`;
  const description = `Jelajahi koleksi ${collectionTitle} terlengkap dengan harga terbaik. Garansi resmi, cicilan 0%, gratis ongkir. Belanja aman di Galaxy Camera toko kamera terpercaya.`;
  const keywords = `${collectionTitle}, ${collectionTitle} murah, ${collectionTitle} original, jual ${collectionTitle}, harga ${collectionTitle}, ${collectionTitle} terbaik, ${collectionTitle} garansi resmi`;
  const canonicalUrl = data?.canonicalUrl || `https://galaxy.co.id/collections/${data?.collection?.handle}`;
  const productCount = data?.collection?.products?.nodes?.length || 0;

  return [
    {title},
    {name: 'title', content: title},
    {name: 'description', content: description.substring(0, 160)},
    {name: 'keywords', content: keywords},
    {name: 'author', content: 'Galaxy Camera'},
    {name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1'},
    {tagName: 'link', rel: 'canonical', href: canonicalUrl},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description.substring(0, 160)},
    {property: 'og:url', content: canonicalUrl},
    {property: 'og:site_name', content: 'Galaxy Camera'},
    {property: 'og:image', content: data?.collection?.image?.url || 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png'},
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {property: 'og:locale', content: 'id_ID'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:site', content: '@galaxycamera99'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description.substring(0, 160)},
    {name: 'twitter:image', content: data?.collection?.image?.url || 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png'},
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: collectionTitle,
        description,
        url: canonicalUrl,
        image: data?.collection?.image?.url || 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png',
        numberOfItems: productCount,
        publisher: {
          '@type': 'Organization',
          name: 'Galaxy Camera',
          logo: {'@type': 'ImageObject', url: 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png'},
        },
        isPartOf: {'@type': 'WebSite', '@id': 'https://galaxy.co.id'},
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {'@type': 'ListItem', position: 1, name: 'Home', item: 'https://galaxy.co.id'},
          {'@type': 'ListItem', position: 2, name: 'Collections', item: 'https://galaxy.co.id/collections'},
          {'@type': 'ListItem', position: 3, name: collectionTitle, item: canonicalUrl},
        ],
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'ItemCollection',
        name: `Koleksi ${collectionTitle}`,
        description,
        url: canonicalUrl,
        numberOfItems: productCount,
        isPartOf: {'@type': 'Organization', name: 'Galaxy Camera', url: 'https://galaxy.co.id'},
      },
    },
  ];
};

export async function loader({request, params, context}) {
  const {handle} = params;
  const url = new URL(request.url);
  const reverse = url.searchParams.get('reverse') === 'true' ? true : false;
  const sortKey = url.searchParams.get('sortkey')?.toUpperCase();
  const {storefront} = context;

  const paginationVariables = getPaginationVariables(request, {pageBy: 8});

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, reverse, sortkey: sortKey, ...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  return json({collection, request, params, context});
}

export default function Collection() {
  const {collection} = useLoaderData();
  const location = useLocation();
  const [formData, setFormData] = useState('');
  const submit = useSubmit();

  const formDatax = new FormData();

  const handleInputChange = (event) => {
    setFormData(event.target.selectedOptions[0].textContent.trim());
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('sortkey', event.target.selectedOptions[0].getAttribute('sortKey'));
    searchParams.set('reverse', event.target.selectedOptions[0].getAttribute('data-reverse'));
    window.history.replaceState(null, '', `${location.pathname}?${searchParams}`);
    searchParams.forEach((value, key) => {
      formDatax.append(key, value);
    });
    submit(formDatax, {method: 'get'});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Collection header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{collection.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {collection.products.nodes.length > 0
                  ? `${collection.products.nodes.length}+ produk tersedia`
                  : 'Tidak ada produk'}
              </p>
            </div>

            {/* Sort */}
            <Form method="get">
              <div className="flex items-center gap-2">
                <label htmlFor="reverse" className="text-sm text-gray-600 font-medium whitespace-nowrap">
                  Urutkan:
                </label>
                <select
                  name="reverse"
                  id="reverse"
                  value={formData}
                  onChange={handleInputChange}
                  className="text-sm border border-gray-200 rounded-xl bg-white text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer"
                >
                  <option value="" disabled defaultValue>Pilih...</option>
                  <option sortkey="RELEVANCE" data-reverse="false">Relevansi</option>
                  <option sortkey="TITLE" data-reverse="false">A-Z</option>
                  <option sortkey="TITLE" data-reverse="true">Z-A</option>
                  <option sortkey="PRICE" data-reverse="false">Harga Terendah</option>
                  <option sortkey="PRICE" data-reverse="true">Harga Tertinggi</option>
                </select>
              </div>
            </Form>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Pagination connection={collection.products}>
          {({nodes, isLoading, PreviousLink, NextLink}) => (
            <>
              <PreviousLink>
                <div className="flex justify-center mb-6">
                  <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Memuat...
                      </>
                    ) : '↑ Produk sebelumnya'}
                  </span>
                </div>
              </PreviousLink>

              <ProductsGrid products={nodes} />

              <NextLink>
                <div className="flex justify-center mt-8">
                  <span className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm">
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Memuat...
                      </>
                    ) : 'Muat lebih banyak ↓'}
                  </span>
                </div>
              </NextLink>
            </>
          )}
        </Pagination>

        <CollectionSEOContent
          collectionTitle={collection.title}
          products={collection.products.nodes}
        />

        {collection.descriptionHtml && (
          <div
            dangerouslySetInnerHTML={{__html: collection.descriptionHtml}}
            className="mt-8 prose prose-sm max-w-none text-gray-600"
          />
        )}
      </div>
    </div>
  );
}

function ProductsGrid({products}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {products.map((product, index) => (
        <ProductItem
          key={product.id}
          product={product}
          loading={index < 8 ? 'eager' : undefined}
        />
      ))}
    </div>
  );
}

function ProductItem({product, loading}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  const hasDiscount =
    parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount) >
    parseFloat(product.priceRange.minVariantPrice.amount);
  const isDiscontinued = product?.metafields[12]?.value === 'true';
  const isOutOfStock = !product.availableForSale && !isDiscontinued;
  const hasFreeItem = product.metafields[1]?.value?.length > 0;

  return (
    <Link
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden flex flex-col no-underline"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        {product.featuredImage && (
          <Image
            alt={product.featuredImage.altText || product.title}
            aspectRatio="1/1"
            data={product.featuredImage}
            loading={loading}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              isDiscontinued || isOutOfStock ? 'opacity-50' : ''
            }`}
          />
        )}

        {/* Badges */}
        {hasDiscount && !isDiscontinued && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-rose-600 to-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            Promo
          </div>
        )}
        {isDiscontinued && (
          <div className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            Discontinue
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-amber-400 text-black text-xs font-bold px-2 py-1 rounded-lg shadow">
              Stock Kosong
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-2.5 sm:p-3 flex-1">
        <p className="text-xs sm:text-sm text-gray-800 leading-snug line-clamp-2 flex-1">
          {product.title}
        </p>

        {/* Price */}
        <div className="mt-1">
          {hasDiscount && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                <HitunganPersen
                  hargaSebelum={product.compareAtPriceRange.minVariantPrice.amount}
                  hargaSesudah={product.priceRange.minVariantPrice.amount}
                />
              </span>
              <span className="text-[11px] text-gray-400 line-through">
                Rp{parseFloat(product.compareAtPriceRange.minVariantPrice.amount).toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <p className={`text-sm font-bold ${hasDiscount ? 'text-rose-700' : 'text-gray-900'}`}>
            Rp{parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString('id-ID')}
          </p>
        </div>

        {/* Free item badge */}
        {hasFreeItem && (
          <span className="self-start bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5">
            Free Item
          </span>
        )}
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
    featuredImage {
      id
      altText
      url
      width
      height
    }
    metafields(identifiers:[
      {namespace:"custom" key:"garansi"}
      {namespace:"custom" key:"free"}
      {namespace:"custom" key:"isi_dalam_box"}
      {namespace:"custom" key:"periode_promo"}
      {namespace:"custom" key:"periode_promo_akhir"}
      {namespace:"custom" key:"spesifikasi"}
      {namespace:"custom" key:"brand"}
      {namespace:"custom" key:"tokopedia"}
      {namespace:"custom" key:"shopee"}
      {namespace:"custom" key:"blibli"}
      {namespace:"custom" key:"bukalapak"}
      {namespace:"custom" key:"lazada"}
      {namespace:"custom" key:"produk_discontinue"}
      {namespace:"custom" key:"produk_serupa"}
    ]){
      key
      value
    }
    compareAtPriceRange{
      minVariantPrice{
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

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $reverse:Boolean=false
    $sortkey:ProductCollectionSortKeys
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      seo {
        description
        title
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        reverse:$reverse,
        sortKey:$sortkey
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;
