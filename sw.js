// ============================================
// Service Worker · Dashboard Wrapper
// Estrategia:
//   - Network-first para HTML (./, ./index.html, navegaciones): siempre
//     intenta traer la versión fresca; cache solo como fallback offline.
//     Esto evita el problema de quedar pegado en una versión vieja sin
//     borrar cache ni reinstalar la PWA.
//   - Cache-first para assets estáticos del shell (iconos, manifest, logos):
//     se actualizan al bumpear CACHE_NAME.
//   - Network-only para todo lo de otros orígenes (Power BI, etc.).
// Sube el CACHE_NAME cuando cambien assets cacheados.
// ============================================

const CACHE_NAME = "dashboard-wrapper-v4";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./win-white.png",
  "./reset-blanco.png"
];

// Install: precachea el shell.
// Importante: NO llamamos skipWaiting() automáticamente. Esperamos a que el
// cliente avise (mediante postMessage SKIP_WAITING) que ya mostró el banner
// y el usuario aceptó actualizar. Así evitamos cortar la sesión activa.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
});

// El cliente envía este mensaje cuando el usuario aprueba la actualización.
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Activate: limpia caches viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first para HTML, cache-first para assets, network-only para externos.
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Cross-origin (Power BI, etc.) va directo a la red.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  const isHTML =
    event.request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html");

  if (isHTML) {
    // Network-first para HTML: siempre intenta red, fallback al cache.
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then(cached => cached || caches.match("./index.html"))
      )
    );
    return;
  }

  // Cache-first para assets estáticos.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => new Response("", { status: 504, statusText: "Offline" }));
    })
  );
});
