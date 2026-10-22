/**
 * Production and Site URL Utilities
 * Ensures order tracking links and public store URLs reliably resolve to live production domains,
 * even when created during local development or testing.
 */

export function getProductionSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '')
  }

  if (
    typeof window !== 'undefined' &&
    window.location.origin &&
    !window.location.origin.includes('localhost') &&
    !window.location.origin.includes('127.0.0.1')
  ) {
    return window.location.origin.replace(/\/$/, '')
  }

  // Canonical production fallback for external readers & WhatsApp mobile links
  return 'https://waraqconnect.com'
}

/**
 * Returns canonical production order tracking URL for WhatsApp messages and notifications
 */
export function getOrderTrackingUrl(orderNumberOrId: string): string {
  const clean = (orderNumberOrId || '').trim()
  return `${getProductionSiteUrl()}/orders/${clean}`
}

/**
 * Returns public store catalog URL
 */
export function getStorePublicUrl(slug: string): string {
  const clean = (slug || '').trim()
  return `${getProductionSiteUrl()}/stores/${clean}`
}
