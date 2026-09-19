importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU",
  authDomain: "galaxypwa.firebaseapp.com",
  projectId: "galaxypwa",
  storageBucket: "galaxypwa.firebasestorage.app",
  messagingSenderId: "1035942613391",
  appId: "1:1035942613391:web:468294eff27a18ac00bbfa",
};

// Take over immediately. This worker replaces the old caching worker (/service-worker.js) that
// lived at the same scope, so activate fast and drop its stale caches (it served a cached "/").
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
      self.clients.claim(),
    ])
  );
});

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background messages: the Firebase SDK already shows a notification for every push that carries
// a `notification` block (title/body/icon from the server) and handles the click via
// `fcm_options.link`. A custom onBackgroundMessage() handler on top of that produced TWO
// notifications per push, so it is intentionally not used here.
// (`messaging` is kept: instantiating it is what registers the SDK's push/click listeners.)
void messaging;

// Fallback click handler for notifications that were not shown by the SDK
// (e.g. foreground notifications shown by the page via registration.showNotification()).
// The SDK stops propagation for its own notifications, so this only sees the others.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || 'https://www.galaxy.co.id/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then((c) => (c && 'navigate' in c ? c.navigate(urlToOpen) : c));
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
