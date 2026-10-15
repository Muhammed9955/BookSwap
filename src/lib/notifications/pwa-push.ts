/**
 * PWA & Native Browser Push Notification Helper for WARAQ
 * Handles permissions, local PWA notification triggers, and Web Push subscriptions.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

/**
 * Check if the browser / PWA supports native notifications and service worker
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isPushNotificationSupported()) {
    return 'unsupported'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (err) {
    console.warn('[PWA Notification] Permission request error:', err)
    return 'denied'
  }
}

export interface PwaNotificationOptions {
  body?: string
  icon?: string
  badge?: string
  image?: string
  url?: string
  tag?: string
  vibrate?: number[]
  data?: Record<string, unknown>
}

/**
 * Display a native PWA / OS notification
 * Uses the ServiceWorkerRegistration showNotification when available (best for PWA & mobile),
 * and falls back to standard Notification constructor.
 */
export async function showLocalPwaNotification(
  title: string,
  options: PwaNotificationOptions = {}
): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  const notificationOptions: NotificationOptions & Record<string, any> = {
    body: options.body || '',
    icon: options.icon || '/icons/icon-192x192.png',
    badge: options.badge || '/icons/icon-96x96.png',
    image: options.image,
    tag: options.tag || `waraq-${Date.now()}`,
    data: {
      url: options.url || '/',
      timestamp: Date.now(),
      ...options.data,
    },
    vibrate: options.vibrate || [150, 60, 150],
    renotify: true,
  }

  try {
    // 1. Try displaying via ServiceWorkerRegistration (Best for PWA, works on mobile Android & iOS PWA)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notificationOptions)
        return true
      }
    }

    // 2. Fallback to standard window Notification constructor
    const notif = new Notification(title, notificationOptions)
    if (options.url) {
      notif.onclick = () => {
        window.focus()
        window.location.href = options.url || '/'
        notif.close()
      }
    }
    return true
  } catch (err) {
    console.warn('[PWA Notification] Failed to show notification:', err)
    return false
  }
}

/**
 * Helper to convert a URL-safe base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Subscribe to Web Push notifications if a VAPID public key is configured
 */
export async function subscribeToWebPush(
  vapidPublicKey?: string
): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null

  const publicKey = vapidPublicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    if (existing) return existing

    const applicationServerKey = urlBase64ToUint8Array(publicKey)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    })
    return subscription
  } catch (err) {
    console.warn('[PWA Push] Web push subscription failed:', err)
    return null
  }
}
