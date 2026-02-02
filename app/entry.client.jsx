import {RemixBrowser} from '@remix-run/react';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>,
  );
});

// PWA Install Prompt Handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {
    // Service worker registration failed, but that's okay
  });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent the mini-infobar from appearing
  event.preventDefault();
  // Stash the event for later use
  deferredPrompt = event;
  
  // Show custom install UI after 10 seconds
  setTimeout(() => {
    if (deferredPrompt) {
      showInstallPrompt();
    }
  }, 10000);
  
  // Also show on scroll
  let scrollTimeout;
  const handleScroll = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (deferredPrompt && !document.querySelector('[data-pwa-shown="true"]')) {
        showInstallPrompt();
      }
    }, 500);
  };
  window.addEventListener('scroll', handleScroll, { once: true });
});

function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installed');
      }
      deferredPrompt = null;
    });
  }
}

window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  deferredPrompt = null;
});
