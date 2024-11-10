import {
    Link,
    useLocation,
    useSearchParams,
    useNavigation,
  } from '@remix-run/react';
  
  export default function ProductOptions({options, selectedVariant}) {
    const {pathname, search} = useLocation();
    const [currentSearchParams] = useSearchParams();
    const navigation = useNavigation();
  
    const paramsWithDefaults = (() => {
      const defaultParams = new URLSearchParams(currentSearchParams);

      console.log('Default Parahms adalah',navigation.location)
  
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
            return;
          }
  
          // get the currently selected option value
          const currentOptionVal = searchParams.get(option.name);
          return (
            <div
              key={option.name}
              className="flex flex-col flex-wrap mb-2 gap-y-1 last:mb-0"
            >
              <h3 className="whitespace-pre-wrap max-w-prose font-bold text-lead min-w-[4rem]">
                {option.name}
              </h3>
  
              <div className="flex flex-wrap items-baseline gap-4">
                {option.values.map((value) => {
                  const linkParams = new URLSearchParams(searchParams);
                  const isSelected = currentOptionVal === value;
                  linkParams.set(option.name, value);

                  {/* console.log('Ini adalah linkParams',linkParams.toString()) */}

                  return (
                    <Link
                      key={value}
                      to={`${pathname}?${linkParams.toString()}`}
                      preventScrollReset
                      replace
                      className={`leading-none py-1 border rounded-full px-2 cursor-pointer hover:no-underline transition-all duration-200 ${
                        isSelected ? 'border-green-700/50 bg-green-50 text-green-700 font-semibold' : 'border-neutral-50 bg-gray-100 px-2 rounded-full text-gray-800'
                      }`}
                    >
                      {value}
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
  