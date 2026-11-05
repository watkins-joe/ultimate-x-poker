const CACHE_NAME = "ultimate-x-poker-app-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);

      const cachedPage = await cache.match("/index.html");
      if (!cachedPage) {
        throw new Error("No cached app shell is available to precache.");
      }

      const pageHtml = await cachedPage.text();
      const appBundles = Array.from(
        pageHtml.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css))"/g),
        ([, assetPath]) => assetPath,
      );
      if (appBundles.length === 0) {
        throw new Error("No production app bundles were found to precache.");
      }
      await cache.addAll(appBundles);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("ultimate-x-poker-app-") &&
                cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            try {
              const cache = await caches.open(CACHE_NAME);
              await cache.put("/index.html", response.clone());
            } catch (error) {
              console.error("Failed to cache the app page:", error);
            }
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match("/index.html");
          if (!cachedPage) {
            throw new Error("No cached app shell is available offline.");
          }
          return cachedPage;
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(
      (cachedResponse) =>
        cachedResponse ??
        fetch(request).then(async (response) => {
          if (response.ok) {
            try {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(request, response.clone());
            } catch (error) {
              console.error("Failed to cache app resource:", error);
            }
          }
          return response;
        }),
    ),
  );
});
