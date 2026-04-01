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

// Handle background messages (app closed or in background)
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload?.notification?.title || 'Galaxy Camera';

  // Firebase Console puts the link in fcmOptions.link or notification.click_action
  // NOT in payload.data.url — so we extract it from the right place
  const clickUrl =
    payload?.fcmOptions?.link ||
    payload?.notification?.click_action ||
    payload?.data?.url ||
    'https://galaxy.co.id/';

  const notificationOptions = {
    body: payload?.notification?.body || 'New notification',
    icon: payload?.notification?.icon || '/icon-512x512.png',
    badge: '/apple-icon-72x72.png',
    tag: 'galaxy-notification',
    requireInteraction: false,
    data: {
      ...payload?.data,
      url: clickUrl, // ensure notificationclick handler always has the correct URL
    },
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open/focus the site at the right URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || 'https://galaxy.co.id/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the site is already open, focus it and navigate to the URL
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Site is not open — open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
