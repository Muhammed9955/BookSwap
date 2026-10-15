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
 * Subtle pleasant audio chime using Web Audio API (no external asset needed)
 */
export function playNotificationChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // AudioContext blocked or not supported
  }
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

  // Play subtle audio cue alongside visual push
  try {
    playNotificationChime()
  } catch {}

  try {
    // 1. Try displaying via ServiceWorkerRegistration with a quick timeout (Best for PWA, works on mobile Android & iOS PWA)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ])
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, notificationOptions)
          return true
        }
      } catch {
        // Fall through to fallback
      }
    }

    // 2. Fallback to standard window Notification constructor
    if (typeof Notification !== 'undefined') {
      const notif = new Notification(title, notificationOptions)
      if (options.url) {
        notif.onclick = () => {
          window.focus()
          window.location.href = options.url || '/'
          notif.close()
        }
      }
      return true
    }

    return false
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
