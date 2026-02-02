import {RemixBrowser} from '@remix-run/react';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';

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

// Request notification permission
if ('Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        registerForNotifications();
      }
    });
  } else if (Notification.permission === 'granted') {
    registerForNotifications();
  }
}

// Register device token
async function registerForNotifications() {
  try {
    console.log('Notification permission:', Notification.permission);
    console.log('ServiceWorker supported:', 'serviceWorker' in navigator);
    // Get VAPID key - replace with your actual key from Firebase Console
    const vapidKey = window.FCM_VAPID_KEY || 'BJVWFBO9hv4b9x6gxwSalMHFom3f17pAVxUTptFQBfUtDHKiNcDlHt9xPQ3F7FHdHC8rXhfJGCnv3a3unkedr0Y';
    const hasServiceWorker = 'serviceWorker' in navigator;
    const serviceWorkerRegistration = hasServiceWorker
      ? await navigator.serviceWorker.ready
      : undefined;

    if (serviceWorkerRegistration) {
      console.log('ServiceWorker scope:', serviceWorkerRegistration.scope);
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration,
    });
    
    if (token) {
      console.log('FCM Token:', token);
      // Save token to your backend/database
      try {
        await fetch('/api/save-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      } catch (fetchError) {
        console.warn('Could not save token to server:', fetchError);
      }
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
}

// Listen for messages when app is open
onMessage(messaging, (payload) => {
  console.log('Message received:', payload);
  
  // Show notification if app is in foreground
  if (Notification.permission === 'granted') {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: payload.notification.icon,
      badge: '/badge-72x72.png',
    });
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
