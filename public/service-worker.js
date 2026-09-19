// service-worker.js — retired.
// This caching worker used to share scope "/" with firebase-messaging-sw.js, so the two kept
// replacing each other, and it served a stale cached homepage. It is no longer registered by the
// site; this stub only cleans up on devices that still have the old version and then unregisters.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});
