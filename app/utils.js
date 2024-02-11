import {useLocation} from '@remix-run/react';
import {useMemo} from 'react';
import {useMatches} from '@remix-run/react';


export function useVariantUrl(handle, selectedOptions) {
  const {pathname} = useLocation();

  return useMemo(() => {
    return getVariantUrl({
      handle,
      pathname,
      searchParams: new URLSearchParams(),
      selectedOptions,
    });
  }, [handle, selectedOptions, pathname]);
}

export function getVariantUrl({
  handle,
  pathname,
  searchParams,
  selectedOptions,
}) {
  const match = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const isLocalePathname = match && match.length > 0;

  const path = isLocalePathname
    ? `${match[0]}products/${handle}`
    : `/products/${handle}`;

  selectedOptions.forEach((option) => {
    searchParams.set(option.name, option.value);
  });

  const searchString = searchParams.toString();

  return path + (searchString ? '?' + searchParams.toString() : '');
}



const DEFAULT_LOCALE = {/* Empty for demonstration purposes.*/}
/**
 * Custom hook to aggregate `analytics` data returned by Remix loaders
 * @param hasUserConsent {Boolean}
 * @returns Object with aggregated analytics data
 */
export function usePageAnalytics({hasUserConsent}) {
  // useMatches returns an array of nested routes
  const matches = useMatches();

  // useMemo improves performance by only running when `matches` changes.
  const analyticsFromMatches = useMemo(() => {
    const data = {};

    // For each nested route, get the `analytics` object returned
    // by its loader function and assign to `data`
    matches.forEach((event) => {
      const eventData = event?.data;
      if (eventData) {
        eventData['analytics'] && Object.assign(data, eventData['analytics']);

        // This hook also allows you to optionally collect data such as
        // currency and language preferences.
        const selectedLocale = eventData['selectedLocale'] || DEFAULT_LOCALE;
        Object.assign(data, {
          currency: selectedLocale.currency,
          acceptedLanguage: selectedLocale.language,
        });
      }
    });

    return { ...data, hasUserConsent };
  }, [matches]);

  return analyticsFromMatches;
}
