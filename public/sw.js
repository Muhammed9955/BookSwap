// WARAQ — Lightweight Service Worker for PWA
const CACHE_NAME = 'waraq-cache-v2'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/images/logo.png',
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

// ============================================================
// PWA PUSH & OS NOTIFICATIONS
// ============================================================

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (err) {
    data = {
      title: 'WARAQ — وَرَق 🌱',
      body: event.data ? event.data.text() : 'لديك إشعار جديد في تطبيق ورق',
    }
  }

  const title = data.title || 'WARAQ — وَرَق 🌱'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    image: data.image || undefined,
    vibrate: [150, 60, 150],
    tag: data.tag || `waraq-notif-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || data.action_url || '/',
      id: data.id,
      timestamp: Date.now(),
      ...data,
    },
    actions: data.actions || [
      { action: 'open', title: 'فتح / Open' },
      { action: 'dismiss', title: 'إغلاق / Dismiss' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const rawUrl = event.notification.data?.url || '/'
  const targetUrl = new URL(rawUrl, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Check if a tab with this exact URL is already open and focus it
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      // 2. Otherwise navigate the first available open client
      for (const client of windowClients) {
        if ('navigate' in client && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // 3. If no window is open, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload || {}
    if (title && self.registration && self.registration.showNotification) {
      self.registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [150, 60, 150],
        ...options,
      })
    }
  }
})

