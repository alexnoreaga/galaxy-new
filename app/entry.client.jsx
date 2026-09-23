import {RemixBrowser} from '@remix-run/react';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported, onMessage, getToken, deleteToken } from 'firebase/messaging';

// ── 1. Hydrate first. Nothing below may block or break the storefront. ──
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>,
  );
});

// ── 2. Web push (Firebase Cloud Messaging) ──
// Firebase config (public web key; Firestore rules are the gate)
const firebaseConfig = {
  apiKey: "AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU",
  authDomain: "galaxypwa.firebaseapp.com",
  projectId: "galaxypwa",
  storageBucket: "galaxypwa.firebasestorage.app",
  messagingSenderId: "1035942613391",
  appId: "1:1035942613391:web:468294eff27a18ac00bbfa",
  measurementId: "G-LLV6GBCF98"
};

const FCM_TOKEN_KEY = 'fcm_token';
const FCM_TOKEN_TS_KEY = 'fcm_token_ts';
const FCM_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // refresh every 7 days
const FCM_TOKEN_SAVED_KEY = 'fcm_token_saved_v2'; // set once /api/save-token confirmed the Firestore write
const PUSH_SNOOZE_KEY = 'gx_push_snooze_until';
const IOS_HINT_SNOOZE_KEY = 'gx_ios_hint_snooze_until';
const PAGEVIEW_KEY = 'gx_pv';
const VAPID_KEY = 'BJVWFBO9hv4b9x6gxwSalMHFom3f17pAVxUTptFQBfUtDHKiNcDlHt9xPQ3F7FHdHC8rXhfJGCnv3a3unkedr0Y';

let messaging = null; // created lazily, only on browsers that pass isSupported()
let swRegistration = null;

const ua = () => navigator.userAgent || '';
const isIphone = () => /iPhone|iPod/.test(ua()) && !window.MSStream;
const isStandalone = () => window.navigator.standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
// In-app browsers (Instagram, Facebook, TikTok, Line, WhatsApp, Shopee…) cannot add to Home Screen and mostly lack push.
const isInAppBrowser = () => /FBAN|FBAV|FB_IAB|Instagram|TikTok|Line\/|WhatsApp|Shopee|Snapchat|Twitter|wv\)/i.test(ua());

// Count pages in this visit (used by both prompts: never ask on the very first page).
function bumpPageviews() {
  try {
    const pv = Number(sessionStorage.getItem(PAGEVIEW_KEY) || 0) + 1;
    sessionStorage.setItem(PAGEVIEW_KEY, String(pv));
    return pv;
  } catch (_) {
    return 1;
  }
}
const snoozed = (key) => {
  try { return Number(localStorage.getItem(key) || 0) > Date.now(); } catch (_) { return true; }
};
const snooze = (key, days) => {
  try { localStorage.setItem(key, String(Date.now() + days * 864e5)); } catch (_) {}
};

// Remix navigates client-side (history.pushState), so the visitor's "second page" is usually NOT a
// reload and this module does not run again. Watch the first client navigation instead.
function onNextNavigation(cb) {
  let done = false;
  const orig = history.pushState;
  const fire = () => {
    if (done) return;
    done = true;
    history.pushState = orig;
    window.removeEventListener('popstate', fire);
    cb();
  };
  history.pushState = function (...args) {
    const r = orig.apply(this, args);
    fire();
    return r;
  };
  window.addEventListener('popstate', fire);
}

// Run `ask` once the visitor is on their 2nd page of this visit (now, or after the next navigation).
function onSecondPage(pv, ask) {
  if (pv >= 2) ask();
  else onNextNavigation(() => { bumpPageviews(); ask(); });
}

async function getMessagingSafe() {
  if (messaging) return messaging;
  if (!(await isSupported())) return null;
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  return messaging;
}

// Runs after window load + a short idle so it never competes with hydration / LCP.
async function initializeNotifications() {
  const pv = bumpPageviews();
  try {
    // iPhone in a normal Safari/Chrome tab: web push only works once the site is on the Home Screen
    // (iOS 16.4+). No Notification API here, so show a one-time "Tambahkan ke Layar Utama" hint instead.
    if (isIphone() && !isStandalone() && !('Notification' in window)) {
      if (!isInAppBrowser()) onSecondPage(pv, showIosHint);
      return;
    }
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) return;

    // One service worker at scope "/" (firebase-messaging-sw.js). The old caching worker
    // (/service-worker.js) shared the same scope, so the two kept replacing each other and pushes
    // could land on a worker with no push handler.
    swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    if (Notification.permission === 'granted') {
      await registerForNotifications();
      await listenForeground();
    } else if (Notification.permission === 'default') {
      // Never call requestPermission() on load: Firefox/Safari block gesture-less prompts and Chrome
      // demotes them to a quiet bell icon. Show our own small ask first; the browser prompt fires
      // only when the shopper taps "Aktifkan" (a real user gesture).
      onSecondPage(pv, () => {
        if (Notification.permission === 'default' && !snoozed(PUSH_SNOOZE_KEY)) showSoftPrompt();
      });
    }
  } catch (error) {
    console.warn('Notifications unavailable:', error?.message || error);
  }
}

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

// Shared card shell (charcoal, bottom of the viewport, above the mobile nav bar).
function makeCard(id, icon, title, sub, buttons) {
  const el = document.createElement('div');
  el.id = id;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', title);
  el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:60;max-width:420px;margin:0 auto;background:#111827;color:#fff;border-radius:14px;padding:12px 12px 12px 14px;box-shadow:0 12px 32px rgba(0,0,0,.35);font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;gap:10px;align-items:center';
  el.innerHTML =
    '<span style="flex-shrink:0;width:34px;height:34px;border-radius:10px;background:#1f2937;display:flex;align-items:center;justify-content:center;font-size:18px">' + icon + '</span>' +
    '<span style="flex:1;min-width:0"><b style="display:block;font-size:13.5px">' + title + '</b><span style="color:#9ca3af">' + sub + '</span></span>' +
    buttons;
  return el;
}

// "Aktifkan" → browser permission prompt → register token. "Nanti" snoozes 14 days.
function showSoftPrompt() {
  try {
    if (document.getElementById('gx-push-ask')) return;
    setTimeout(() => {
      if (Notification.permission !== 'default' || document.getElementById('gx-push-ask')) return;
      const el = makeCard('gx-push-ask', '🔔', 'Mau dikabari kalau ada flash sale?', 'Notifikasi singkat, maksimal 2x seminggu.',
        '<button type="button" data-act="later" style="background:none;border:0;color:#9ca3af;font-size:12px;padding:6px 4px;cursor:pointer">Nanti</button>' +
        '<button type="button" data-act="on" style="background:#dc2626;border:0;color:#fff;font-weight:600;font-size:12.5px;padding:8px 12px;border-radius:999px;cursor:pointer">Aktifkan</button>');
      const close = (snoozeDays) => {
        el.remove();
        if (snoozeDays) snooze(PUSH_SNOOZE_KEY, snoozeDays);
      };
      el.querySelector('[data-act="later"]').onclick = () => close(14);
      el.querySelector('[data-act="on"]').onclick = () => {
        close(0);
        // Must stay synchronous inside the tap handler: Safari (iOS PWA) only honours
        // requestPermission() while the user gesture is still active.
        let req;
        try {
          req = Notification.requestPermission();
        } catch (e) {
          console.warn('permission request failed', e);
          return;
        }
        Promise.resolve(req).then(async (permission) => {
          if (permission === 'granted') {
            await registerForNotifications();
            await listenForeground();
          } else {
            snooze(PUSH_SNOOZE_KEY, 90);
          }
        }).catch((e) => console.warn('permission request failed', e));
      };
      document.body.appendChild(el);
      setTimeout(() => { if (document.getElementById('gx-push-ask')) close(3); }, 30000); // ignored → ask again in 3 days
    }, 15000);
  } catch (e) {
    console.warn('soft prompt skipped', e);
  }
}

// iPhone, not installed: explain the one extra step. Shown once, then snoozed 30 days.
function showIosHint() {
  try {
    if (snoozed(IOS_HINT_SNOOZE_KEY) || document.getElementById('gx-ios-hint')) return;
    setTimeout(() => {
      if (document.getElementById('gx-ios-hint')) return;
      const el = makeCard('gx-ios-hint', '📲', 'Mau dikabari flash sale di iPhone?',
        'Tekan tombol <b style="color:#fff">Bagikan</b> di Safari, pilih <b style="color:#fff">Tambahkan ke Layar Utama</b>, lalu buka Galaxy dari sana dan aktifkan notifikasi.',
        '<button type="button" data-act="ok" style="background:#374151;border:0;color:#fff;font-weight:600;font-size:12.5px;padding:8px 12px;border-radius:999px;cursor:pointer">Mengerti</button>');
      const close = (days) => { el.remove(); snooze(IOS_HINT_SNOOZE_KEY, days); };
      el.querySelector('[data-act="ok"]').onclick = () => close(30);
      document.body.appendChild(el);
      setTimeout(() => { if (document.getElementById('gx-ios-hint')) close(7); }, 30000);
    }, 15000);
  } catch (e) {
    console.warn('ios hint skipped', e);
  }
}

// Register device token, with automatic refresh every 7 days
async function registerForNotifications() {
  try {
    const m = await getMessagingSafe();
    if (!m) return;

    const registration = swRegistration || (await navigator.serviceWorker.ready);

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
        await deleteToken(m);
      } catch (_) {
        // Ignore errors from deleting a stale/invalid token
      }
    }

    const token = await getToken(m, {
      vapidKey: window.FCM_VAPID_KEY || VAPID_KEY,
      serviceWorkerRegistration: registration,
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

// Messages that arrive while the site is open in the foreground (the service worker stays silent then).
// `new Notification()` is not allowed on Android Chrome, so always go through the registration.
let foregroundBound = false;
async function listenForeground() {
  if (foregroundBound) return;
  const m = await getMessagingSafe();
  if (!m) return;
  foregroundBound = true;
  onMessage(m, async (payload) => {
    if (Notification.permission !== 'granted') return;
    const url = payload?.fcmOptions?.link || payload?.data?.url || '/';
    try {
      const reg = swRegistration || (await navigator.serviceWorker.ready);
      await reg.showNotification(payload.notification?.title || 'Galaxy Camera', {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/icon-512x512.png',
        badge: '/apple-icon-72x72.png',
        tag: 'galaxy-promo',
        renotify: true,
        data: { url, logId: payload?.data?.logId || '' },
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  });
}

function scheduleInit() {
  const run = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => initializeNotifications(), { timeout: 4000 });
    else setTimeout(initializeNotifications, 1500);
  };
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}
scheduleInit();

// Chat widgets use these when a staff member joins a conversation ("Mau dikabari di HP?").
// __gxPushToken: the token if this browser already granted notifications (flash-sale opt-in).
// __gxRegisterPush: after the widget's own requestPermission() tap was granted → register + return token.
window.__gxPushToken = () => {
  try { return ('Notification' in window && Notification.permission === 'granted') ? (localStorage.getItem(FCM_TOKEN_KEY) || '') : ''; } catch (_) { return ''; }
};
window.__gxRegisterPush = async () => {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return '';
    if (!swRegistration) { swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js'); await navigator.serviceWorker.ready; }
    await registerForNotifications();
    await listenForeground();
    return localStorage.getItem(FCM_TOKEN_KEY) || '';
  } catch (_) { return ''; }
};
