// Google Analytics 4 (GA4) & Google Tag Manager (GTM) Client Utilities

export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_GA_ID ||
  'G-8ZMN1F0SMM'
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ''

// Pageview tracking
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag && GA_TRACKING_ID) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// Custom event tracking
interface GTagEvent {
  action: string
  category?: string
  label?: string
  value?: number
  [key: string]: unknown
}

export const event = ({ action, category, label, value, ...rest }: GTagEvent) => {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...rest,
    })
  }
}

// Pre-defined marketplace tracking events
export const trackWaraqEvent = {
  // App Download / PWA Installation Tracking
  downloadApp: (params?: {
    method?: 'pwa_prompt' | 'pwa_button' | 'browser_install' | 'manual'
    platform?: string
  }) => {
    let platform = params?.platform
    if (!platform && typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const ua = navigator.userAgent || ''
      if (isStandalone) platform = 'standalone_pwa'
      else if (/android/i.test(ua)) platform = 'android'
      else if (/iphone|ipad|ipod/i.test(ua)) platform = 'ios'
      else if (/windows/i.test(ua)) platform = 'windows'
      else if (/mac/i.test(ua)) platform = 'mac'
      else platform = 'desktop_web'
    }

    const method = params?.method || 'pwa_prompt'

    // 1. GA4 Recommended Event: app_install
    event({
      action: 'app_install',
      category: 'App',
      label: 'WARAQ App Install',
      method,
      platform,
      value: 1,
    })

    // 2. Custom action: app_download
    event({
      action: 'app_download',
      category: 'App',
      label: 'WARAQ App Download',
      method,
      platform,
    })

    // 3. GTM dataLayer push
    if (typeof window !== 'undefined' && Array.isArray((window as unknown as { dataLayer: unknown[] }).dataLayer)) {
      ;(window as unknown as { dataLayer: unknown[] }).dataLayer.push({
        event: 'app_download',
        event_category: 'App',
        event_label: 'WARAQ App Download',
        install_method: method,
        platform,
      })
    }
  },

  viewBook: (bookId: string, title: string) =>
    event({ action: 'view_item', category: 'Book', label: title, book_id: bookId }),

  initiateOffer: (listingId: string, amount: number) =>
    event({ action: 'begin_checkout', category: 'Transaction', label: 'Buy Offer', value: amount, listing_id: listingId }),

  initiateSwap: (listingId: string, targetListingId: string) =>
    event({ action: 'request_swap', category: 'Transaction', label: 'Book Swap', listing_id: listingId, target_id: targetListingId }),

  initiateBorrow: (listingId: string, days: number, deposit: number) =>
    event({ action: 'request_borrow', category: 'Transaction', label: 'Book Borrow', value: deposit, loan_days: days }),

  followStore: (storeSlug: string, storeName: string) =>
    event({ action: 'follow_store', category: 'Bookstore', label: storeName, store_slug: storeSlug }),

  rsvpEvent: (eventId: string, eventTitle: string, status: string) =>
    event({ action: 'rsvp_event', category: 'Community Event', label: eventTitle, rsvp_status: status }),

  searchQuery: (query: string, resultsCount: number) =>
    event({ action: 'search', category: 'Search', label: query, results: resultsCount }),
}

// Backwards-compatible alias
export const trackBookSwapEvent = trackWaraqEvent

/**
 * Configure User-ID in GA4 & GTM for Active Users, Unique Users, and Retention Tracking.
 * Setting user_id in GA4 allows:
 * 1. Unique Users deduplication across sessions & devices.
 * 2. Active Users (DAU, WAU, MAU) reporting with Cross-Device stitching.
 * 3. User Retention & Cohort Exploration tracking over 1 to 30+ days.
 */
export const setAnalyticsUser = (
  userId: string | null,
  userProperties?: {
    role?: string
    city?: string
    is_verified?: boolean
    preferred_language?: string
    [key: string]: unknown
  }
) => {
  if (typeof window === 'undefined' || !GA_TRACKING_ID) return
  const w = window as unknown as { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] }
  if (!w.gtag) return

  if (userId) {
    w.gtag('set', 'user_properties', {
      user_id: userId,
      ...userProperties,
    })
    w.gtag('config', GA_TRACKING_ID, {
      user_id: userId,
    })
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({
        event: 'user_identified',
        user_id: userId,
        ...userProperties,
      })
    }
  } else {
    w.gtag('set', 'user_properties', { user_id: null })
  }
}

