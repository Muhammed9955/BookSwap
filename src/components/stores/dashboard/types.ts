import type { Bookstore, StoreOffer, StoreEvent, StoreInventoryItem, StoreOrder } from '@/types/store'

export type DashboardTab = 'profile' | 'inventory' | 'offers' | 'orders' | 'events'

export interface StoreDashboardClientProps {
  initialStore?: Bookstore | null
  allStores: Bookstore[]

  initialOffers: StoreOffer[]
  initialEvents: StoreEvent[]
  currentUserId?: string | null
  initialActiveTab?: DashboardTab
}

export function formatRealDateTime(dateStr: string, lang: 'ar' | 'en' = 'ar'): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const timeStr = date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isToday) {
    return lang === 'ar' ? `اليوم، ${timeStr}` : `Today, ${timeStr}`
  }
  if (isYesterday) {
    return lang === 'ar' ? `أمس، ${timeStr}` : `Yesterday, ${timeStr}`
  }

  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
