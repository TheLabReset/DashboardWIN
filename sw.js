// ============================================
// Service Worker · Dashboard Wrapper
// Estrategia: cache-first para el shell (HTML/CSS/JS/icons),
// network-only para el iframe de Power BI (no se cachea, siempre datos frescos).
// Sube el CACHE_NAME cuando hagas cambios al index.html.
// ============================================

const CACHE_NAME = "dashboard-wrapper-v3";
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

// Fetch: cache-first para shell, network-only para todo lo demás (Power BI, etc.)
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Solo manejamos requests del mismo origen para el shell.
  // Power BI y cualquier API externa van directo a la red.
  if (url.origin !== self.location.origin) {
    return; // deja que el browser maneje el request normal
  }

  // GET only
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Opcional: cachear respuestas exitosas del propio origen
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        // Fallback: solo para navegación HTML, no para imágenes ni JSON.
        // Evita servir el HTML como respuesta a un .png que falló.
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return new Response("", { status: 504, statusText: "Offline" });
      });
    })
  );
});
