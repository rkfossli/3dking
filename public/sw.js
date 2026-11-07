/* 3DKing service worker: et lite program telefonen kjører i bakgrunnen.
   Den tar imot push-varsler og viser dem, også når appen er lukket.
   Forenklet fra Spotter (public/sw.js). */

// Ny versjon tar over med en gang.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Chrome vil gjerne se en fetch-handler før appen kan installeres. Vi sender alt rett videre til nettet.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "3DKing", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "3DKing", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag || undefined,
      data: { url: data.url || "/" },
    }),
  );
});

// Trykk på varselet: åpne appen på riktig side (eller bytt til den hvis den allerede er åpen).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
