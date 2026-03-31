// ================================================================
// METAR GO ??Service Worker
// Offline-first for static assets, network-first for API calls
// ================================================================

const CACHE_VERSION = 'metar-go-v4.3.7';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;

// Static assets to pre-cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/init.js',
    '/core.js',
    '/app.js',
    '/airport-db.js',
    '/airportfrequencies.js',
    '/metar-db.js',
    '/tools-extension.js',
    '/appicon.png',
    '/plane.png',
    '/airspace-chart.jpg',
    '/METAR_TAF Abbreviations.pdf',
    // Leaflet from CDN
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
    // App icon from GitHub (also used as launch screen image)
    'https://raw.githubusercontent.com/vincent6786/Notion_metar_advanced/main/app-icon.png',
    'https://raw.githubusercontent.com/vincent6786/Notion_metar_advanced/main/plane.png',
];

// API routes ??network-first, cache fallback
const API_ROUTES = [
    '/api/weather',
    '/api/awos',
    '/api/settings',
    '/api/status',
];

// ?€?€ Install: pre-cache all static assets ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            // Cache each asset individually so one failure doesn't break all
            return Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(err =>
                        console.warn('[SW] Failed to cache:', url, err)
                    )
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// ?€?€ Activate: remove old caches ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ?€?€ Fetch: route requests ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and chrome-extension / devtools
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // ?€?€ API calls: network-first, stale fallback ?€?€
    const isApiCall = API_ROUTES.some(r => url.pathname.startsWith(r));
    if (isApiCall) {
        event.respondWith(networkFirstApi(request));
        return;
    }

    // ?€?€ Static assets: cache-first ?€?€
    event.respondWith(cacheFirstStatic(request));
});

// ?€?€ Strategy: Network-first for API ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
async function networkFirstApi(request) {
    const cache = await caches.open(API_CACHE);
    try {
        const response = await fetchWithTimeout(request.clone(), 8000);
        if (response.ok) {
            // Store a timestamped copy for offline use
            const toCache = response.clone();
            const body    = await toCache.json().catch(() => null);
            if (body) {
                const stamped = new Response(
                    JSON.stringify({ ...body, _cached_at: Date.now(), _offline: false }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
                cache.put(request.url, stamped);
            }
        }
        return response;
    } catch (err) {
        // Network failed ??serve stale cache with offline flag
        const cached = await cache.match(request.url);
        if (cached) {
            const body    = await cached.json().catch(() => ({}));
            const stale   = { ...body, _offline: true, _stale: true };
            return new Response(JSON.stringify(stale), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-SW-Offline': 'true',
                }
            });
        }
        // No cached data at all
        return new Response(
            JSON.stringify({ error: 'offline', _offline: true }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// ?€?€ Strategy: Cache-first for static assets ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
async function cacheFirstStatic(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // For navigation requests, return the cached index.html
        if (request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
        }
        return new Response('Offline', { status: 503 });
    }
}

// ?€?€ Helper: fetch with timeout ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function fetchWithTimeout(request, ms) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), ms);
        fetch(request).then(
            res  => { clearTimeout(timer); resolve(res); },
            err  => { clearTimeout(timer); reject(err); }
        );
    });
}

