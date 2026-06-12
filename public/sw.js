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
