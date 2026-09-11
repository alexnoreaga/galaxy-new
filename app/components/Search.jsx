import {Link, Form, useParams, useFetcher, useFetchers, useNavigate} from '@remix-run/react';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import React, {useRef, useEffect, useState} from 'react';
import {gaEvent} from '~/lib/analytics';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  DEFAULT_POPULAR_SEARCHES,
} from '~/lib/recentSearches';

// Infinite scroll for search — observes a sentinel and auto-loads the next page (mirrors collections)
function SearchInfiniteLoader({hasNextPage, nextPageUrl, isLoading, state}) {
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
    return <p className="text-center text-xs text-gray-400 mt-10 mb-2">— Semua hasil sudah ditampilkan —</p>;
  }
  return (
    <div ref={ref} className="flex justify-center py-10">
      <span className="inline-flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Memuat produk…
      </span>
    </div>
  );
}

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

export function SearchResults({results, soldCounts = {}, reviewSummaries = {}, flashMap = {}}) {
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
                soldCounts={soldCounts}
                reviewSummaries={reviewSummaries}
                flashMap={flashMap}
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

function SearchResultsProductsGrid({products, soldCounts = {}, reviewSummaries = {}, flashMap = {}}) {
  return (
    <div className="search-result py-3">
      <Pagination connection={products} >
        {({nodes, isLoading, PreviousLink, hasNextPage, nextPageUrl, state}) => {
          const itemsMarkup = nodes.map((product) => {
            const sold = soldCounts[product.handle] || 0;
            const review = reviewSummaries[product.handle] || null;
            const flash = flashMap[product.handle] || null;
            const baseAmount = product?.variants?.nodes[0]?.price?.amount;
            return (
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
                    {flash ? (
                      <div className='mt-auto flex flex-col leading-tight'>
                        <div className='flex items-center gap-1'>
                          <span className='text-[9px] font-black text-white bg-red-600 px-1 py-0.5 rounded leading-none'>⚡FLASH</span>
                          <span className='text-base font-bold text-red-600'>Rp {flash.flashAmount.toLocaleString("id-ID")}</span>
                        </div>
                        <span className='text-xs text-gray-400 line-through'>Rp {parseFloat(baseAmount).toLocaleString("id-ID")}</span>
                      </div>
                    ) : (
                      <span className='text-base font-bold text-blue-600 mt-auto'>Rp {parseFloat(baseAmount).toLocaleString("id-ID")}</span>
                    )}
                    {(review || sold > 0) && (
                      <div className="mt-1 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1 flex-wrap">
                        {review ? (
                          <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-bold text-gray-800">{review.avg}</span>
                            <span className="text-xs text-gray-400">({review.count})</span>
                          </div>
                        ) : <span />}
                        {sold > 0 && (
                          <span className="text-xs text-gray-400">
                            <span className="font-semibold text-gray-600">{sold.toLocaleString('id-ID')}</span> terjual
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
            );
          });
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
              <SearchInfiniteLoader
                hasNextPage={hasNextPage}
                nextPageUrl={nextPageUrl}
                isLoading={isLoading}
                state={state}
              />
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

export function NoSearchResults({searchTerm, popularSearches = []}) {
  const brands = ['Canon', 'Sony', 'Nikon', 'Fujifilm', 'DJI', 'GoPro', 'Insta360'];
  // Recent searches live in localStorage → read after mount so SSR and first client paint match.
  const [recent, setRecent] = useState([]);
  useEffect(() => { setRecent(getRecentSearches()); }, [searchTerm]);
  const popular = (popularSearches?.length ? popularSearches : DEFAULT_POPULAR_SEARCHES).slice(0, 10);

  // ── "Tidak ditemukan" ──────────────────────────────────────────────────────
  if (searchTerm) {
    return (
      <div className="py-10 sm:py-14">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-4">Produk tidak ditemukan</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Tidak ada hasil untuk &quot;<span className="font-medium text-gray-700">{searchTerm}</span>&quot;. Coba kata kunci lain atau periksa ejaannya.
          </p>
          {/* Opens the general Grisela chat (listener lives in BottomNavbar, rendered on every non-product page) */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('grisela:open-general', {detail: {source: 'search-empty', query: searchTerm}}))}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            Tanya Grisela
          </button>
          <p className="text-xs text-gray-400 mt-2">Grisela bisa bantu cari produk yang kamu maksud.</p>
        </div>
        <div className="max-w-md mx-auto mt-10">
          <SearchTermList title="Pencarian populer" items={popular} />
        </div>
        <BrandChips brands={brands} center />
      </div>
    );
  }

  // ── Kotak masih kosong ─────────────────────────────────────────────────────
  return (
    <div className="py-4 sm:py-8">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12 max-w-3xl">
        {recent.length > 0 && (
          <SearchTermList
            title="Pencarian terakhir"
            items={recent}
            icon="clock"
            onRemove={(t) => setRecent(removeRecentSearch(t))}
            action={
              <button type="button" onClick={() => setRecent(clearRecentSearches())} className="text-xs text-gray-400 hover:text-gray-700">
                Hapus semua
              </button>
            }
          />
        )}
        <SearchTermList title="Pencarian populer" items={popular} />
      </div>
      <BrandChips brands={brands} />
      <div className="mt-6">
        <Link to="/collections" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 no-underline">
          Lihat semua kategori →
        </Link>
      </div>
    </div>
  );
}

// Plain list rows — magnifier (or clock) + term, like Zalora/Tokopedia's search sheet.
function SearchTermList({title, items, icon = 'search', onRemove, action}) {
  if (!items?.length) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <ul className="-mx-2">
        {items.map((t) => (
          <li key={t} className="flex items-center">
            <Link
              to={`/search?q=${encodeURIComponent(t)}`}
              className="flex-1 min-w-0 flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 no-underline"
            >
              {icon === 'clock' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              )}
              <span className="truncate">{t}</span>
            </Link>
            {onRemove && (
              <button
                type="button"
                aria-label={`Hapus ${t}`}
                onClick={() => onRemove(t)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BrandChips({brands, center = false}) {
  return (
    <div className={`mt-8 ${center ? 'text-center' : ''}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Brand populer</p>
      <div className={`flex flex-wrap items-center gap-2 ${center ? 'justify-center px-4' : ''}`}>
        {brands.map((b) => (
          <Link
            key={b}
            to={`/search?q=${encodeURIComponent(b)}`}
            className="px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors no-underline"
          >
            {b}
          </Link>
        ))}
      </div>
    </div>
  );
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
  const gaTimer = useRef(null);
  const gaLastTerm = useRef('');

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
    // GA4 `search`: most shoppers never reach /search?q= (they click a predictive result),
    // so GA4's automatic site-search never sees them. Fire once the shopper pauses typing.
    clearTimeout(gaTimer.current);
    const term = newSearchTerm.trim().toLowerCase();
    if (term.length >= 2 && term !== gaLastTerm.current) {
      gaTimer.current = setTimeout(() => {
        gaLastTerm.current = term;
        gaEvent('search', {search_term: term});
      }, 800);
    }
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

  if (!totalResults) {
    return <NoPredictiveSearchResults searchTerm={searchTerm} />;
  }

  // console.log('Prediktif',results)
  
  return (
    <div className="predictive-search-results p-4">
      <div>
        {results.map(({type, items}) => (
          <PredictiveSearchResult
            items={items}
            key={type}
            searchTerm={searchTerm}
            type={type}
          />
        ))}
      </div>
      {/* view all results /search?q=term */}
      {searchTerm.current && (
        <Link to={`/search?q=${searchTerm.current}`}>
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

function PredictiveSearchResult({items, searchTerm, type}) {
  const isSuggestions = type === 'queries';
  const categoryUrl = `/search?q=${
    searchTerm.current
  }&type=${pluralToSingularSearchType(type)}`;



  return (
    <div className="predictive-search-result" key={type}>
      {/* <Link prefetch="intent" to={categoryUrl}>
        <h5>{isSuggestions ? 'Suggestions' : type}</h5>
      </Link> */}
      
      {!isSuggestions&&(
      <ul className='predictive-search-result-items grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3'>
        {items.map((item) => (
          <SearchResultItem
            item={item}
            term={searchTerm.current}
            key={item.id}
          />
        ))}
      </ul>
    )}
    </div>
  );
}

function SearchResultItem({item, term}) {


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

  return (
    <li className="predictive-search-result-item" key={path}>
      <Link 
        to={path} 
        onClick={() => addRecentSearch(term)}
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
              {item.flashPrice ? (
                <div className='flex flex-col leading-tight'>
                  {/* Flash price on its own line so it never overflows the narrow card */}
                  <Money data={item.flashPrice} className='text-xs sm:text-sm font-bold text-red-600' />
                  <div className='flex items-center gap-1 flex-wrap'>
                    <span className='text-[7px] sm:text-[8px] font-black text-white bg-red-600 px-1 rounded leading-tight flex-shrink-0'>⚡FLASH</span>
                    <Money data={item.price} className='text-[10px] text-gray-400 line-through' />
                  </div>
                </div>
              ) : (
                <Money data={item.price} className='text-xs sm:text-sm font-bold text-blue-600' />
              )}
            </div>
          )}
          {(item.review || item.sold > 0) && (
            <div className="mt-1 pt-1 border-t border-gray-100 flex items-center justify-between gap-0.5 flex-wrap">
              {item.review ? (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-800">{item.review.avg}</span>
                  <span className="text-[10px] sm:text-xs text-gray-400">({item.review.count})</span>
                </div>
              ) : <span />}
              {item.sold > 0 && (
                <span className="text-[10px] sm:text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">{item.sold.toLocaleString('id-ID')}</span> terjual
                </span>
              )}
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
