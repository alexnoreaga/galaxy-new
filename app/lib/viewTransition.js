// View Transitions for client-side route changes on Remix 1.19 (no built-in support there).
//
// Flow on a product-card tap:
//   1. tag the tapped card's image box with view-transition-name "product-hero"
//   2. document.startViewTransition(): the browser snapshots the page, we navigate(), and resolve
//      once the product page's hero box (data-vt-hero) is in the DOM → the card photo morphs
//      into the hero while the rest cross-fades.
// The page is frozen between snapshot and resolve, so we cap that at MAX_WAIT: if the product
// loader is slower (cold network), vt.skipTransition() unfreezes and the navigation just lands
// normally. prefetch="intent" on the cards usually has the data in flight before the tap.
export const HERO_NAME = 'product-hero';
const MAX_WAIT = 700;

export function viewTransitionsSupported() {
  if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') return false;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const c = navigator.connection;
    if (c && (c.saveData || /(^|[^4-9])[23]g/.test(String(c.effectiveType || '')))) return false;
  } catch { /* ignore */ }
  return true;
}

// Plain left-click without modifiers (anything else must keep the browser's default: new tab etc.)
export function isPlainClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
}

function waitForHero(timeoutMs) {
  return new Promise((resolve) => {
    const started = performance.now();
    const tick = () => {
      if (document.querySelector('[data-vt-hero]') || performance.now() - started > timeoutMs) return resolve();
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/**
 * @param {HTMLElement|null} heroEl  the tapped card's image box (gets the transition name)
 * @param {() => void} go            performs the navigation (e.g. () => navigate(to))
 * @returns {boolean} true when a transition was started (caller should preventDefault)
 */
export function transitionToProduct(heroEl, go) {
  if (!viewTransitionsSupported() || !heroEl) return false;
  // only ONE element per document may carry the name
  document.querySelectorAll('[data-vt-hero]').forEach((el) => { el.style.viewTransitionName = ''; el.removeAttribute('data-vt-hero'); });
  heroEl.style.viewTransitionName = HERO_NAME;
  let vt;
  try {
    vt = document.startViewTransition(async () => {
      go();
      await waitForHero(MAX_WAIT + 200);
    });
  } catch {
    heroEl.style.viewTransitionName = '';
    return false;
  }
  const guard = setTimeout(() => { try { vt.skipTransition(); } catch { /* ignore */ } }, MAX_WAIT);
  vt.finished.finally(() => { clearTimeout(guard); try { heroEl.style.viewTransitionName = ''; } catch { /* unmounted */ } });
  return true;
}
