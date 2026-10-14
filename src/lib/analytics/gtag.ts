// Google Analytics 4 (GA4) & Google Tag Manager (GTM) Client Utilities

export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_GA_ID ||
  ''
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
