// service-worker.js

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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Message received (background):', payload);
  
  const notificationTitle = payload?.notification?.title || 'Galaxy Camera';
  const notificationBody = payload?.notification?.body || 'You have a new message';
  
  console.log('Title:', notificationTitle);
  console.log('Body:', notificationBody);
  
  const notificationOptions = {
    body: notificationBody,
    icon: payload?.notification?.icon || '/icon-512x512.png',
    badge: '/apple-icon-72x72.png',
    tag: 'galaxy-notification',
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => console.log('✅ Notification shown (background)'))
    .catch(err => console.error('❌ Failed to show notification:', err));
});

const CACHE_NAME = 'galaxy-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
            return null;
          })
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
