// BookSwap Egypt — Lightweight Service Worker for PWA
const CACHE_NAME = 'bookswap-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => console.warn('Cache addAll error:', err))
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip Supabase/API requests from aggressive caching
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.includes('supabase')) return

  // Network first with cache fallback strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static items
        if (
          response.status === 200 &&
          (url.pathname.startsWith('/_next/static/') ||
            url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2)$/))
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          // Fallback response for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
          return new Response('Network error occurred', { status: 408 })
        })
      })
  )
})
