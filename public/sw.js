// Minimal service worker whose only job is receiving Web Push events and
// showing a notification — no offline caching/asset strategy, since this
// site doesn't need one yet. Kept deliberately small and dependency-free.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Stucci Media", body: event.data.text(), url: "/" };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Stucci Media", {
      body: payload.body || "",
      icon: "/og-default.png",
      badge: "/og-default.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
