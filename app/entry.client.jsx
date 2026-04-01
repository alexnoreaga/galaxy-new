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
    const firebaseRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Workers registered:', firebaseRegistration.scope);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await registerForNotifications();
      }
    } else if (Notification.permission === 'granted') {
      await registerForNotifications();
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
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
      // Token is still valid — no need to re-register
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
      try {
        await fetch('/api/save-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (fetchError) {
        console.warn('Could not save token to server:', fetchError);
      }
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
  console.log('📩 Message received (foreground):', payload);
  console.log('Title:', payload.notification?.title);
  console.log('Body:', payload.notification?.body);
  
  // Show notification if app is in foreground
  if (Notification.permission === 'granted') {
    try {
      new Notification(payload.notification?.title || 'Galaxy Camera', {
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/icon-512x512.png',
        badge: '/apple-icon-72x72.png',
      });
      console.log('✅ Notification shown (foreground)');
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
