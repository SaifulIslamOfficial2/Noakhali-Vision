/* eslint-disable no-restricted-globals */
// Noakhali Vision – Push Notification Service Worker

self.addEventListener("push", event => {
  const data = event.data?.json() || {};
  const title = data.title || "Noakhali Vision";
  const options = {
    body: data.body || "নতুন সংবাদ এসেছে",
    icon: "/logo.svg",
    badge: "/logo.svg",
    tag: data.tag || "nv-news",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(list => {
      for (const c of list) {
        if (c.url === url && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Static asset caching (stale-while-revalidate) — দ্বিতীয়বার ভিজিটে ছবি/JS/CSS তাৎক্ষণিক ──
const STATIC_CACHE = "nv-static-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("nv-static-") && k !== STATIC_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  const isStatic = url.pathname.startsWith("/assets/") || /\.(?:png|jpe?g|webp|svg|woff2?)$/.test(url.pathname);
  if (!isStatic) return;
  event.respondWith(
    caches.open(STATIC_CACHE).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
