/**
 * Sedona Adventure Countdown — sw.js
 * Service Worker: cache-first strategy for offline support.
 *
 * Cache version: bump CACHE_NAME whenever you deploy new assets
 * so users automatically get fresh files.
 */

'use strict';

const CACHE_NAME = 'sedona-v2';

/**
 * Assets to pre-cache on install.
 * All paths are relative to the SW's scope (same directory as index.html).
 * background.avif is cached separately so a missing file doesn't block install.
 */
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg',
  './robots.txt',
];

const OPTIONAL_ASSETS = [
  './background.avif',
];

// ── Install ───────────────────────────────────────────────
// Pre-cache all core assets; background photo is best-effort.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Core assets — fail hard if any of these are missing
      await cache.addAll(CORE_ASSETS);

      // Optional assets — swallow errors (photo might not exist yet)
      await Promise.allSettled(
        OPTIONAL_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`SW: optional asset not cached: ${url}`, err);
          })
        )
      );
    })
  );

  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────
// Remove caches from previous versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log(`SW: deleting old cache "${key}"`);
            return caches.delete(key);
          })
      )
    )
  );

  // Take control of all open pages immediately
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────
// Cache-first for same-origin assets; network-only for everything else
// (e.g. Google Fonts CDN — we try to cache those too on the fly).
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Google Fonts: network-first, fallback to cache
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Same-origin assets: cache-first, fallback to network
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstWithNetwork(request));
    return;
  }

  // All other origins: just pass through
});

// ── Strategy helpers ──────────────────────────────────────

async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    // Offline and not in cache — return a minimal offline shell
    // for HTML requests; for others just fail gracefully.
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('./index.html');
    }
    throw _;
  }
}

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw _;
  }
}
