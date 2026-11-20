const CACHE_NAME = 'simulado-inss-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './questions.js',
    './script.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Instalação do Service Worker e cache dos arquivos essenciais
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptação de requisições para funcionar offline (Cache First, fallback Network)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});