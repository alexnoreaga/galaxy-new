// Client-side GA4 helpers. Safe to import from SSR code — every function no-ops on the server.
//
// Loading strategy: root.jsx only inlines the tiny dataLayer stub, so `gtag()` calls queue
// from the first byte. The real gtag.js (~90 KB) is injected by scheduleGtagLoad() AFTER the
// window `load` event + an idle slot, so it can never compete with the LCP image or hydration.

export const GA_ID = 'G-CY1F8L58R5';

export function gaEvent(name, params = {}) {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('event', name, params);
  } catch {
    /* analytics must never break the page */
  }
}

export function loadGtag() {
  try {
    if (typeof window === 'undefined' || window.__gtagLoaded) return;
    window.__gtagLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  } catch {
    /* ignore */
  }
}

export function scheduleGtagLoad() {
  if (typeof window === 'undefined') return;
  const go = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadGtag, { timeout: 4000 });
    else setTimeout(loadGtag, 1500);
  };
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}

const gidTail = (gid) => String(gid ?? '').split('/').pop();

/** GA4 ecommerce item from a Storefront product + variant (product page). */
export function gaProductItem(product, variant, extra = {}) {
  const price = Number(variant?.price?.amount ?? 0);
  return {
    item_id: variant?.sku || gidTail(variant?.id) || gidTail(product?.id),
    item_name: product?.title ?? '',
    ...(product?.vendor ? { item_brand: product.vendor } : {}),
    ...(variant?.title && variant.title !== 'Default Title' ? { item_variant: variant.title } : {}),
    price,
    quantity: 1,
    ...extra,
  };
}

/** GA4 ecommerce item from a cart line (Cart.jsx → begin_checkout). */
export function gaCartLineItem(line) {
  const m = line?.merchandise ?? {};
  const unit = Number(line?.cost?.amountPerQuantity?.amount ?? m?.price?.amount ?? 0);
  return {
    item_id: m?.sku || gidTail(m?.id),
    item_name: m?.product?.title ?? '',
    ...(m?.product?.vendor ? { item_brand: m.product.vendor } : {}),
    ...(m?.title && m.title !== 'Default Title' ? { item_variant: m.title } : {}),
    price: unit,
    quantity: Number(line?.quantity ?? 1),
  };
}
