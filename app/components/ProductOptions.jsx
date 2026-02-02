import {
    Link,
    useLocation,
    useSearchParams,
    useNavigation,
  } from '@remix-run/react';
  
  export default function ProductOptions({options, selectedVariant, product}) {
    const {pathname, search} = useLocation();
    const [currentSearchParams] = useSearchParams();
    const navigation = useNavigation();
  
    const paramsWithDefaults = (() => {
      const defaultParams = new URLSearchParams(currentSearchParams);
  
      if (!selectedVariant) {
        return defaultParams;
      }
  
      for (const {name, value} of selectedVariant.selectedOptions) {
        if (!currentSearchParams.has(name)) {
          defaultParams.set(name, value);
        }
      }
  
      return defaultParams;
    })();
  
    // Update the in-flight request data from the 'navigation' (if available)
    // to create an optimistic UI that selects a link before the request is completed
    const searchParams = navigation.location
      ? new URLSearchParams(navigation.location.search)
      : paramsWithDefaults;
  
    return (
      <div className="grid gap-4 mb-6">
        {options.map((option) => {
          if (!option.values.length) {
            return null;
          }
  
          // Get the currently selected option value
          const currentOptionVal = searchParams.get(option.name);
          
          return (
            <div key={option.name} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-medium text-gray-600 uppercase tracking-widest">
                  {option.name}
                </h5>
                {currentOptionVal && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                    {currentOptionVal}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const linkParams = new URLSearchParams(searchParams);
                  linkParams.set(option.name, value);

                  // Check if this option value has an associated image from all product variants
                  const optionImage = product?.variants?.nodes?.find(
                    variant => variant.selectedOptions.some(
                      opt => opt.name === option.name && opt.value === value
                    )
                  )?.image?.url;

                  const isActive = currentOptionVal === value;

                  return (
                    <Link
                      key={value}
                      to={`${pathname}?${linkParams.toString()}`}
                      preventScrollReset
                      replace
                      className={`
                        group relative overflow-hidden rounded-lg border transition-all duration-200
                        ${isActive 
                          ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 shadow-sm ring-2 ring-rose-200' 
                          : 'border-gray-200 bg-white hover:border-rose-300 hover:shadow-sm'
                        }
                      `}
                    >
                      {optionImage ? (
                        // Image + Text variant (compact)
                        <div className="flex items-center gap-2 p-1.5">
                          <div className={`
                            w-10 h-10 rounded-md overflow-hidden border flex-shrink-0
                            ${isActive ? 'border-rose-300 ring-1 ring-rose-200' : 'border-gray-200'}
                          `}>
                            <img 
                              src={optionImage} 
                              alt={value}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className={`
                            text-xs font-medium pr-2
                            ${isActive ? 'text-rose-700' : 'text-gray-700'}
                          `}>
                            {value}
                          </span>
                        </div>
                      ) : (
                        // Text-only variant (compact)
                        <div className="px-3 py-2">
                          <span className={`
                            text-xs font-medium whitespace-nowrap
                            ${isActive ? 'text-rose-700' : 'text-gray-700'}
                          `}>
                            {value}
                          </span>
                        </div>
                      )}

                      {/* Active indicator (smaller) */}
                      {isActive && (
                        <div className="absolute top-0.5 right-0.5">
                          <div className="bg-rose-600 rounded-full p-0.5">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  