import {useEffect, useRef} from 'react';
import {useNavigate} from '@remix-run/react';

/**
 * Make a state-driven modal / drawer / full-screen panel behave like a native app screen:
 * opening it adds a history entry (`#key`), so the Android back button / swipe-back closes the
 * modal instead of leaving the page; closing it from its own UI pops that entry again.
 *
 * The entry is pushed through Remix's router (hash-only change → no loaders re-run) with
 * `preventScrollReset`, so the page underneath does not jump. Closing is detected on the raw
 * `popstate` event, independent of router re-renders. The cart / search / menu asides already work
 * this way via `#…-aside` + `:target`; this hook gives the same behaviour to modals that are a
 * plain `useState(false)`.
 *
 *   const [open, setOpen] = useState(false);
 *   useBackToClose(open, () => setOpen(false), 'zoom');
 */
export function useBackToClose(open, onClose, key) {
  const navigate = useNavigate();
  const hash = `#${key}`;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    if (window.location.hash !== hash) {
      navigate(
        {pathname: window.location.pathname, search: window.location.search, hash},
        {preventScrollReset: true},
      );
    }
    let closedByBack = false;
    const onPop = () => {
      if (window.location.hash === hash) return; // still on our entry (e.g. forward)
      closedByBack = true;
      onCloseRef.current?.();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed from the UI (or unmounted) while our entry is still on top → pop it so the next
      // back press does not re-open the modal. After a real navigation the hash is already gone.
      if (!closedByBack && window.location.hash === hash) navigate(-1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
