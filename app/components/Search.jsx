import {Link, Form, useParams, useFetcher, useFetchers} from '@remix-run/react';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import React, {useRef, useEffect} from 'react';

export const NO_PREDICTIVE_SEARCH_RESULTS = [
  {type: 'queries', items: []},
  {type: 'products', items: []},
  {type: 'collections', items: []},
  {type: 'pages', items: []},
  {type: 'articles', items: []},
];

export function SearchForm({searchTerm}) {
  const inputRef = useRef(null);

  // focus the input when cmd+k is pressed
  useEffect(() => {
    // inputRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'k' && event.metaKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === 'Escape') {
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Form method="get">
      <input
        defaultValue={searchTerm}
        name="q"
        placeholder="Search…"
        ref={inputRef}
        type="search"
        autoFocus
      />
      &nbsp;
      <button type="submit">Search</button>
    </Form>
  );
}

export function SearchResults({results}) {
  if (!results) {
    return null;
  }
  const keys = Object.keys(results);
  return (
    <div>
      {results &&
        keys.map((type) => {
          const resourceResults = results[type];

          if (resourceResults.nodes[0]?.__typename === 'Page') {
            const pageResults = resourceResults;
            return resourceResults.nodes.length ? (
              <SearchResultPageGrid key="pages" pages={pageResults} />
            ) : null;
          }

          if (resourceResults.nodes[0]?.__typename === 'Product') {
            const productResults = resourceResults;
            return resourceResults.nodes.length ? (
              <SearchResultsProductsGrid
                key="products"
                products={productResults}
              />
            ) : null;
          }

          if (resourceResults.nodes[0]?.__typename === 'Article') {
            const articleResults = resourceResults;
            return resourceResults.nodes.length ? (
              <SearchResultArticleGrid
                key="articles"
                articles={articleResults}
              />
            ) : null;
          }

          return null;
        })}
    </div>
  );
}

function SearchResultsProductsGrid({products}) {
  // console.log('Hasil Gambar ini',products)
  return (
    <div className="search-result py-8">
      <h2 className='text-2xl font-bold mb-6'>Produk</h2>
      <Pagination connection={products} >
        {({nodes, isLoading, NextLink, PreviousLink}) => {
          const itemsMarkup = nodes.map((product) => (
            <div className="search-results-item" key={product.id}>
              <Link prefetch="intent" to={`/products/${product.handle}`}>
                <div className='flex flex-col gap-3 border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-blue-300 transition-all duration-200 bg-white h-full'>
                  <div className='w-full h-40 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden'>
                    {product?.variants?.nodes[0]?.image?.url &&(
                        <Image
                          alt={product.title ?? ''}
                          src={product?.variants?.nodes[0]?.image?.url}
                          width={150}
                          height={150}
                          className='object-contain h-full w-full'
                        />
                    )}
                  </div>
                  <div className='flex flex-col gap-2 flex-grow'>
                    <span className='text-xs font-medium text-gray-700 line-clamp-2 h-8'>{product.title}</span>
                    <span className='text-base font-bold text-blue-600 mt-auto'>Rp {parseFloat(product?.variants?.nodes[0]?.price?.amount).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </Link>
            </div>
          ));
          return (
            <div>
              <div className='flex justify-center mb-6'>
                <PreviousLink>
                  {isLoading ? 'Loading...' : <span className='text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer'>↑ Produk Sebelumnya</span>}
                </PreviousLink>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4'>
                {itemsMarkup}
              </div>
              <div className='flex justify-center mt-8'>
                <NextLink>
                  {isLoading ? 'Loading...' : <span className='font-bold text-center bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer text-sm'>Muat Lebih Banyak ↓</span>}
                </NextLink>
              </div>
            </div>
          );
        }}
      </Pagination>
    </div>
  );
}

function SearchResultPageGrid({pages}) {
  return (
    <div className="search-result">
      <h2>Pages</h2>
      <div>
        {pages?.nodes?.map((page) => (
          <div className="search-results-item" key={page.id}>
            <Link prefetch="intent" to={`/pages/${page.handle}`}>
              {page.title}
            </Link>
          </div>
        ))}
      </div>
      <br />
    </div>
  );
}

function SearchResultArticleGrid({articles}) {
  console.log('Artikel adalah ',articles)
  return (
    <div className="search-result">
      <h2>Articles</h2>
      <div>
        {articles?.nodes?.map((article) => (
          <div className="search-results-item" key={article.id}>
            <Link prefetch="intent" to={`/blogs/${article.handle}`}>
              {article.title}
            </Link>
          </div>
        ))}
      </div>
      <br />
    </div>
  );
}

export function NoSearchResults() {
  return <p></p>;
}

/**
 *  Search form component that posts search requests to the `/search` route
 **/
export function PredictiveSearchForm({
  action,
  children,
  className = 'predictive-search-form',
  method = 'POST',
  ...props
}) {
  const params = useParams();
  const fetcher = useFetcher();
  const inputRef = useRef(null);

  function fetchResults(event) {
    const searchAction = action ?? '/api/predictive-search';
    const localizedAction = params.locale
      ? `/${params.locale}${searchAction}`
      : searchAction;
    const newSearchTerm = event.target.value || '';
    fetcher.submit(
      {q: newSearchTerm, limit: '6'},
      {method, action: localizedAction},
    );
  }

  // ensure the passed input has a type of search, because SearchResults
  // will select the element based on the input
  useEffect(() => {
    inputRef?.current?.setAttribute('type', 'search');
  }, []);

  return (
    <fetcher.Form
      {...props}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!inputRef?.current || inputRef.current.value === '') {
          return;
        }
        inputRef.current.blur();
      }}
    >
      {children({fetchResults, inputRef, fetcher})}
    </fetcher.Form>
  );
}

export function PredictiveSearchResults() {
  const {results, totalResults, searchInputRef, searchTerm} =
    usePredictiveSearch();

  function goToSearchResult(event) {
    if (!searchInputRef.current) return;
    searchInputRef.current.blur();
    searchInputRef.current.value = '';
    // close the aside
    window.location.href = event.currentTarget.href;
  }

  if (!totalResults) {
    return <NoPredictiveSearchResults searchTerm={searchTerm} />;
  }

  // console.log('Prediktif',results)
  
  return (
    <div className="predictive-search-results p-4">
      <div>
        {results.map(({type, items}) => (
          <PredictiveSearchResult
            goToSearchResult={goToSearchResult}
            items={items}
            key={type}
            searchTerm={searchTerm}
            type={type}
          />
        ))}
      </div>
      {/* view all results /search?q=term */}
      {searchTerm.current && (
        <Link onClick={goToSearchResult} to={`/search?q=${searchTerm.current}`}>
          <p className="mt-4 font-bold text-center bg-blue-600 text-white text-sm rounded-lg py-2 px-4 hover:bg-blue-700 transition-colors duration-200">
            Lihat Semua Hasil "<span className='font-semibold'>{searchTerm.current}</span>" →
          </p>
        </Link>
      )}
    </div>
  );
}

function NoPredictiveSearchResults({searchTerm}) {
  if (!searchTerm.current) {
    return null;
  }
  return (
    <p>
      Tidak ada hasil pencarian untuk <q className='font-medium text-rose-700'>{searchTerm.current}</q>
    </p>
  );
}

// function PredictiveSearchResult2({goToSearchResult, items, searchTerm, type}) {
//   const isSuggestions = type === 'queries';
//   const categoryUrl = `/search?q=${
//     searchTerm.current
//   }&type=${pluralToSingularSearchType(type)}`;

//   return (
//     <div className="predictive-search-result" key={type}>
//       <Link prefetch="intent" to={categoryUrl} onClick={goToSearchResult}>
//         <h5>{isSuggestions ? 'Suggestions' : type}</h5>
//       </Link>
//       <ul>
//         {items.map((item) => (
//           <SearchResultItem
//             goToSearchResult={goToSearchResult}
//             item={item}
//             key={item.id}
//           />
//         ))}
//       </ul>
//     </div>
//   );
// }

function PredictiveSearchResult({goToSearchResult, items, searchTerm, type}) {
  const isSuggestions = type === 'queries';
  const categoryUrl = `/search?q=${
    searchTerm.current
  }&type=${pluralToSingularSearchType(type)}`;


  console.log('searchTerm',searchTerm,type)

  return (
    <div className="predictive-search-result" key={type}>
      {/* <Link prefetch="intent" to={categoryUrl} onClick={goToSearchResult}>
        <h5>{isSuggestions ? 'Suggestions' : type}</h5>
      </Link> */}
      
      {!isSuggestions&&(
      <ul className='predictive-search-result-items grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3'>
        {items.map((item) => (
          <SearchResultItem
            goToSearchResult={goToSearchResult}
            item={item}
            key={item.id}
          />
        ))}
      </ul>
    )}
    </div>
  );
}

function SearchResultItem({goToSearchResult, item}) {


  let url = item.url;
  let path; // Declare path here

  if (url.includes("products")) {
    path = url.split('?')[0];

    // console.log('Yes ketemu')
  } else {
    // console.log("URL does not contain 'product'.");
    path = item.url;
  }

  // console.log('Path',item)
  
  const handleClick = (e) => {
    goToSearchResult(e);
  };

  const handleTouchEnd = (e) => {
    goToSearchResult(e);
  };

  return (
    <li className="predictive-search-result-item" key={path}>
      <Link 
        onClick={handleClick} 
        onTouchEnd={handleTouchEnd}
        to={path} 
        className='flex flex-col hover:no-underline border border-gray-200 rounded-lg p-2 sm:p-3 cursor-pointer active:opacity-75 hover:shadow-md hover:border-blue-300 transition-all duration-200 bg-white h-full'
      >
      {/* <Link onClick={goToSearchResult} to={item.url}> */}
        {item.image?.url && (
          <div className='w-full h-32 sm:h-40 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden mb-2'>
            <Image
              alt={item.image.altText ?? ''}
              src={item.image.url}
              width={140}
              height={140}
              className="hover:opacity-80 pointer-events-none object-contain h-full w-full"
            />
          </div>
        )}
        <div className="pointer-events-none flex flex-col gap-1 sm:gap-2 flex-grow">
          {item.styledTitle ? (
            <div
              dangerouslySetInnerHTML={{
                __html: item.styledTitle,
              }}
              className='text-xs sm:text-sm font-medium text-gray-700 line-clamp-2'
            />
          ) : (
            <span className='text-xs sm:text-sm font-medium text-gray-700 line-clamp-2'>{item.title}</span>
          )}
          {item?.price && (
            <div className='mt-auto'>
              <Money data={item.price} className='text-xs sm:text-sm font-bold text-blue-600' />
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

function usePredictiveSearch() {
  const fetchers = useFetchers();
  const searchTerm = useRef('');
  const searchInputRef = useRef(null);
  const searchFetcher = fetchers.find((fetcher) => fetcher.data?.searchResults);

  if (searchFetcher?.state === 'loading') {
    searchTerm.current = searchFetcher.formData?.get('q') || '';
  }

  const search = searchFetcher?.data?.searchResults || {
    results: NO_PREDICTIVE_SEARCH_RESULTS,
    totalResults: 0,
  };

  // capture the search input element as a ref
  useEffect(() => {
    if (searchInputRef.current) return;
    searchInputRef.current = document.querySelector('input[type="search"]');
  }, []);

  return {...search, searchInputRef, searchTerm};
}

/**
 * Converts a plural search type to a singular search type
 *
 * @example
 * ```js
 * pluralToSingularSearchType('articles'); // => 'ARTICLE'
 * pluralToSingularSearchType(['articles', 'products']); // => 'ARTICLE,PRODUCT'
 * ```
 */
function pluralToSingularSearchType(type) {
  const plural = {
    articles: 'ARTICLE',
    collections: 'COLLECTION',
    pages: 'PAGE',
    products: 'PRODUCT',
    queries: 'QUERY',
  };

  if (typeof type === 'string') {
    return plural[type];
  }

  return type.map((t) => plural[t]).join(',');
}
