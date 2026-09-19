import {RemixBrowser} from '@remix-run/react';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage, getToken, deleteToken } from 'firebase/messaging';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU",
  authDomain: "galaxypwa.firebaseapp.com",
  projectId: "galaxypwa",
  storageBucket: "galaxypwa.firebasestorage.app",
  messagingSenderId: "1035942613391",
  appId: "1:1035942613391:web:468294eff27a18ac00bbfa",
  measurementId: "G-LLV6GBCF98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Register service worker first, then setup notifications
async function initializeNotifications() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return;
  }

  try {
    // Register both service workers
    await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
    // Request notification permission
    // Never call requestPermission() on load: Firefox/Safari block gesture-less prompts and Chrome
    // demotes them to a quiet bell icon. Show our own small ask first; the browser prompt fires
    // only when the shopper taps "Aktifkan" (a real user gesture).
    if ('Notification' in window && Notification.permission === 'default') {
      showSoftPrompt();
    } else if (Notification.permission === 'granted') {
      await registerForNotifications();
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

const FCM_TOKEN_SAVED_KEY = 'fcm_token_saved_v2'; // set once /api/save-token confirmed the Firestore write
const PUSH_SNOOZE_KEY = 'gx_push_snooze_until';
const PAGEVIEW_KEY = 'gx_pv';

async function saveTokenToServer(token) {
  try {
    const r = await fetch('/api/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (r.ok) localStorage.setItem(FCM_TOKEN_SAVED_KEY, String(Date.now()));
  } catch (fetchError) {
    console.warn('Could not save token to server:', fetchError);
  }
}

// Small charcoal card, bottom of the viewport, on the 2nd+ page of a visit after 15 s.
// "Aktifkan" → browser permission prompt → register token. "Nanti" snoozes 14 days.
function showSoftPrompt() {
  try {
    const now = Date.now();
    if (Number(localStorage.getItem(PUSH_SNOOZE_KEY) || 0) > now) return;
    const pv = Number(sessionStorage.getItem(PAGEVIEW_KEY) || 0) + 1;
    sessionStorage.setItem(PAGEVIEW_KEY, String(pv));
    if (pv < 2) return;
    if (document.getElementById('gx-push-ask')) return;
    setTimeout(() => {
      if (Notification.permission !== 'default' || document.getElementById('gx-push-ask')) return;
      const el = document.createElement('div');
      el.id = 'gx-push-ask';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Aktifkan notifikasi');
      el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:60;max-width:420px;margin:0 auto;background:#111827;color:#fff;border-radius:14px;padding:12px 12px 12px 14px;box-shadow:0 12px 32px rgba(0,0,0,.35);font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;gap:10px;align-items:center';
      el.innerHTML =
        '<span style="flex-shrink:0;width:34px;height:34px;border-radius:10px;background:#1f2937;display:flex;align-items:center;justify-content:center;font-size:18px">🔔</span>' +
        '<span style="flex:1;min-width:0"><b style="display:block;font-size:13.5px">Mau dikabari kalau ada flash sale?</b><span style="color:#9ca3af">Notifikasi singkat, maksimal 2x seminggu.</span></span>' +
        '<button type="button" data-act="later" style="background:none;border:0;color:#9ca3af;font-size:12px;padding:6px 4px;cursor:pointer">Nanti</button>' +
        '<button type="button" data-act="on" style="background:#dc2626;border:0;color:#fff;font-weight:600;font-size:12.5px;padding:8px 12px;border-radius:999px;cursor:pointer">Aktifkan</button>';
      const close = (snoozeDays) => {
        el.remove();
        if (snoozeDays) localStorage.setItem(PUSH_SNOOZE_KEY, String(Date.now() + snoozeDays * 864e5));
      };
      el.querySelector('[data-act="later"]').onclick = () => close(14);
      el.querySelector('[data-act="on"]').onclick = async () => {
        close(0);
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') await registerForNotifications();
          else localStorage.setItem(PUSH_SNOOZE_KEY, String(Date.now() + 90 * 864e5));
        } catch (e) {
          console.warn('permission request failed', e);
        }
      };
      document.body.appendChild(el);
      setTimeout(() => { if (document.getElementById('gx-push-ask')) close(3); }, 30000); // ignored → ask again in 3 days
    }, 15000);
  } catch (e) {
    console.warn('soft prompt skipped', e);
  }
}

const FCM_TOKEN_KEY = 'fcm_token';
const FCM_TOKEN_TS_KEY = 'fcm_token_ts';
const FCM_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // refresh every 7 days

// Register device token, with automatic refresh every 7 days
async function registerForNotifications() {
  try {
    // Check if IndexedDB is available (required for Firebase)
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available - notifications disabled');
      return;
    }

    const vapidKey = window.FCM_VAPID_KEY || 'BJVWFBO9hv4b9x6gxwSalMHFom3f17pAVxUTptFQBfUtDHKiNcDlHt9xPQ3F7FHdHC8rXhfJGCnv3a3unkedr0Y';

    // Get the Firebase messaging service worker registration
    await navigator.serviceWorker.ready;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const firebaseRegistration = registrations.find(reg =>
      reg.active?.scriptURL.includes('firebase-messaging-sw.js')
    ) || registrations[0];

    // Check if the stored token is still fresh
    const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
    const storedTs = parseInt(localStorage.getItem(FCM_TOKEN_TS_KEY) || '0', 10);
    const isTokenFresh = storedToken && (Date.now() - storedTs) < FCM_TOKEN_MAX_AGE_MS;

    if (isTokenFresh) {
      // Token is still valid — but if this device's token never reached the server (the old
      // endpoint dropped tokens for a long time), send it now instead of waiting for the 7-day refresh.
      if (!localStorage.getItem(FCM_TOKEN_SAVED_KEY)) await saveTokenToServer(storedToken);
      return;
    }

    // Token is stale or missing — delete the old one and get a fresh one
    if (storedToken) {
      try {
        await deleteToken(messaging);
      } catch (_) {
        // Ignore errors from deleting a stale/invalid token
      }
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: firebaseRegistration,
    });

    if (token) {
      // Persist token + timestamp so we know when to refresh next
      localStorage.setItem(FCM_TOKEN_KEY, token);
      localStorage.setItem(FCM_TOKEN_TS_KEY, Date.now().toString());

      // Save token to backend
      await saveTokenToServer(token);
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    if (error.message?.includes('indexedDB')) {
      console.warn('IndexedDB error - try disabling private/incognito mode');
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
  initializeNotifications();
}

// Listen for messages when app is open
onMessage(messaging, (payload) => {
  
  // Show notification if app is in foreground
  if (Notification.permission === 'granted') {
    try {
      new Notification(payload.notification?.title || 'Galaxy Camera', {
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/icon-512x512.png',
        badge: '/apple-icon-72x72.png',
      });
    } catch (error) {
      console.error('❌ Failed to show notification:', error);
    }
  } else {
    console.warn('⚠️ Notification permission not granted');
  }
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>,
  );
});
