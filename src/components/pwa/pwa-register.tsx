'use client'

import { useEffect, useState, useMemo } from 'react'
import { Bell, BellRing, Check, Download, X } from 'lucide-react'
import { useLanguage } from '@/i18n/language-context'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalPwaNotification,
  NotificationPermissionState,
} from '@/lib/notifications/pwa-push'
import { trackWaraqEvent } from '@/lib/analytics/gtag'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaRegister() {
  const { lang } = useLanguage()
  const { user, refreshProfile } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  // Notification Permission State
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>('default')
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const [notifActivatedSuccess, setNotifActivatedSuccess] = useState(false)

  // 1. Register Service Worker & Install Prompt (Skip in development / localhost to prevent HMR reload loops)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Clean up any previously installed service worker during development
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister()
          }
        }).catch(() => {})
        return
      }

      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('WARAQ PWA ServiceWorker registered with scope:', reg.scope)
          })
          .catch((err) => {
            console.warn('WARAQ PWA ServiceWorker registration failed:', err)
          })
      })
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem('pwa_prompt_dismissed')
      if (!dismissed) {
        setShowInstallBanner(true)
      }
    }

    // Capture browser appinstalled event
    const handleAppInstalled = () => {
      console.log('WARAQ PWA was installed on the device')
      trackWaraqEvent.downloadApp({ method: 'browser_install' })
      setShowInstallBanner(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check notification permission state
    const currentPerm = getNotificationPermission()
    setNotifPermission(currentPerm)

    // If user is already logged in and notification permission is default, prompt after slight delay
    if (currentPerm === 'default' && isPushNotificationSupported()) {
      const dismissedNotif = localStorage.getItem('pwa_notif_prompt_dismissed')
      if (!dismissedNotif) {
        const timer = setTimeout(() => {
          setShowNotifBanner(true)
        }, 3500)
        return () => {
          clearTimeout(timer)
          window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
          window.removeEventListener('appinstalled', handleAppInstalled)
        }
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // 2. Realtime Notification Listener for Logged-In User
  useEffect(() => {
    if (!user?.id) return

    // Supabase Realtime channel for notifications inserted for this user
    const channel = supabase
      .channel(`pwa-realtime-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const newNotif = payload.new
          if (!newNotif) return

          const title =
            lang === 'ar'
              ? newNotif.title_ar || newNotif.title || 'إشعار جديد في WaraqConnect 🌱'
              : newNotif.title || newNotif.title_ar || 'New notification on WaraqConnect 🌱'

          const body =
            lang === 'ar'
              ? newNotif.body_ar || newNotif.body || ''
              : newNotif.body || newNotif.body_ar || ''

          const isStoreVerification =
            newNotif.type === 'STORE_APPROVED' ||
            Boolean(
              (newNotif.title && (newNotif.title.includes('توثيق') || newNotif.title.includes('اعتماد') || newNotif.title.includes('متجر'))) ||
              (newNotif.body && (newNotif.body.includes('لوحة التحكم') || newNotif.body.includes('تفعيل متجر') || newNotif.body.includes('توثيق')))
            )

          const url = isStoreVerification ? '/stores/dashboard' : (newNotif.action_url || '/notifications')

          // Trigger native PWA / OS Push notification
          showLocalPwaNotification(title, {
            body,
            url,
            tag: newNotif.id || `notif-${Date.now()}`,
          })

          // Refresh unread count in header
          if (typeof refreshProfile === 'function') {
            refreshProfile()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, lang, refreshProfile])

  // Install handlers
  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install')
      trackWaraqEvent.downloadApp({ method: 'pwa_prompt' })
    }
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  const handleDismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  // Notification handlers
  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission()
    setNotifPermission(result)

    if (result === 'granted') {
      setNotifActivatedSuccess(true)
      // Send pleasant confirmation welcome notification
      showLocalPwaNotification(
        lang === 'ar' ? 'تم تفعيل إشعارات WaraqConnect بنجاح! 🌱' : 'WaraqConnect Notifications Enabled! 🌱',
        {
          body:
            lang === 'ar'
              ? 'ستصلك هنا تنبيهات فورية عند اعتماد كتبك، استلام طلبات الشراء، والمجتمعات.'
              : 'You will receive instant alerts when books are approved, requests arrive, or transactions update.',
          url: '/notifications',
        }
      )

      setTimeout(() => {
        setShowNotifBanner(false)
      }, 2500)
    } else {
      setShowNotifBanner(false)
    }
    localStorage.setItem('pwa_notif_prompt_dismissed', 'true')
  }

  const handleDismissNotif = () => {
    setShowNotifBanner(false)
    localStorage.setItem('pwa_notif_prompt_dismissed', 'true')
  }

  // Render PWA Install Banner
  if (showInstallBanner) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-background/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 p-1 border border-border shadow-xs">
              <img
                src="/icons/icon-96x96.png"
                alt="WaraqConnect"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {lang === 'ar' ? 'ثبّت تطبيق WaraqConnect 🌱' : 'Install WaraqConnect App 🌱'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar'
                  ? 'تصفح أسرع، إشعارات فورية، وتصفح دون اتصال'
                  : 'Faster browsing, instant notifications & offline access'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'تثبيت' : 'Install'}
            </button>
            <button
              onClick={handleDismissInstall}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Push Notification Permission Prompt (if install banner isn't active)
  if (showNotifBanner && notifPermission === 'default') {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-background/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              {notifActivatedSuccess ? (
                <Check className="h-6 w-6 text-green-600 animate-in zoom-in-50 duration-200" />
              ) : (
                <BellRing className="h-6 w-6 animate-pulse" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {notifActivatedSuccess ? (
                  <span className="text-green-600 font-bold">
                    {lang === 'ar' ? 'تم التفعيل بنجاح! 🌱' : 'Notifications Enabled! 🌱'}
                  </span>
                ) : (
                  <>
                    <span>{lang === 'ar' ? 'تفعيل إشعارات الهاتف' : 'Enable Push Notifications'}</span>
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                      PWA
                    </span>
                  </>
                )}
              </h4>
              <p className="text-xs text-muted-foreground">
                {notifActivatedSuccess
                  ? lang === 'ar'
                    ? 'ستصلك التنبيهات الفورية حتى عند إغلاق التطبيق'
                    : 'You will receive instant alerts even when the app is in background'
                  : lang === 'ar'
                  ? 'لتصلك تنبيهات فورية عند قبول كتبك أو وصول طلبات مبادلة'
                  : 'Get instant alerts when books are approved or requests arrive'}
              </p>
            </div>
          </div>
          {!notifActivatedSuccess && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleEnableNotifications}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all flex items-center gap-1"
              >
                <Bell className="h-3.5 w-3.5" />
                {lang === 'ar' ? 'تفعيل' : 'Enable'}
              </button>
              <button
                onClick={handleDismissNotif}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
