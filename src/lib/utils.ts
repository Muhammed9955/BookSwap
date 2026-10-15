import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BookCondition, ListingType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || price === 0) return 'مجاني'
  return `${price.toLocaleString('ar-EG')} ج.م`
}

export function formatPriceEn(price: number | null | undefined): string {
  if (price === null || price === undefined || price === 0) return 'Free'
  return `${price.toLocaleString('en-EG')} EGP`
}

export function getConditionLabel(condition: BookCondition, lang: 'ar' | 'en' = 'ar'): string {
  const labels: Record<BookCondition, { ar: string; en: string }> = {
    NEW: { ar: 'جديد', en: 'New' },
    LIKE_NEW: { ar: 'شبه جديد', en: 'Like New' },
    VERY_GOOD: { ar: 'ممتاز', en: 'Very Good' },
    GOOD: { ar: 'جيد', en: 'Good' },
    ACCEPTABLE: { ar: 'مقبول', en: 'Acceptable' },
  }
  return labels[condition]?.[lang] ?? condition
}

export function getListingTypeLabel(type: ListingType, lang: 'ar' | 'en' = 'ar'): string {
  const labels: Record<ListingType, { ar: string; en: string }> = {
    SELL: { ar: 'للبيع', en: 'For Sale' },
    SWAP: { ar: 'للمبادلة', en: 'For Swap' },
    SELL_OR_SWAP: { ar: 'بيع أو مبادلة', en: 'Sale or Swap' },
    GIVEAWAY: { ar: 'مجاني', en: 'Free' },
  }
  return labels[type]?.[lang] ?? type
}

export function getListingTypeBadgeColor(type: ListingType): string {
  switch (type) {
    case 'SELL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'SWAP': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'SELL_OR_SWAP': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    case 'GIVEAWAY': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getConditionBadgeColor(condition: BookCondition): string {
  switch (condition) {
    case 'NEW': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'LIKE_NEW': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
    case 'VERY_GOOD': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
    case 'GOOD': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'ACCEPTABLE': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function formatRelativeTime(date: string, lang: 'ar' | 'en' = 'ar'): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (lang === 'ar') {
    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`
    return past.toLocaleDateString('ar-EG')
  } else {
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString('en-EG')
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim()
}

export function generateReferralCode(userId: string): string {
  const hash = userId.substring(0, 6).toUpperCase()
  return `BOOK-${hash}`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path || path.trim() === '') return '/images/book-placeholder.svg'
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('/')) {
    return path
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (path.startsWith('book-images/')) {
    return `${supabaseUrl}/storage/v1/object/public/${path}`
  }
  return `${supabaseUrl}/storage/v1/object/public/book-images/${path}`
}

export function getAvatarUrl(url: string | null | undefined, name?: string): string {
  if (url && url.trim() !== '') {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
      return url
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (url.startsWith('avatars/')) {
      return `${supabaseUrl}/storage/v1/object/public/${url}`
    }
    return `${supabaseUrl}/storage/v1/object/public/avatars/${url}`
  }
  // Generate initials-based avatar with safe encoding
  const trimmed = name?.trim()
  const initial = trimmed ? encodeURIComponent(trimmed.charAt(0).toUpperCase()) : 'U'
  return `https://ui-avatars.com/api/?name=${initial}&background=4f46e5&color=fff&size=200`
}

export function isRTL(lang: 'ar' | 'en' = 'ar'): boolean {
  return lang === 'ar'
}

export function getDistanceText(km: number, lang: 'ar' | 'en' = 'ar'): string {
  if (lang === 'ar') {
    if (km < 1) return `${Math.round(km * 1000)} متر`
    return `${km.toFixed(1)} كم`
  }
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
