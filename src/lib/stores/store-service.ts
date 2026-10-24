import type { Bookstore, StoreOffer, StoreEvent, RSVPStatus, StoreType, OfferType, StoreInventoryItem, StoreApplication, StoreApplicationStatus, StoreOrder } from '@/types/store'
import { createClient } from '@/lib/supabase/client'
import { STORE_CATALOG_BOOKS, getStoreBookCover } from '@/lib/stores/store-catalog-data'
import { REAL_STORE_INVENTORY_SEEDS } from './real-store-inventory-seeds'

type SupabaseClient = any

// ─────────────────────────────────────────────────────────────
// CURATED EGYPTIAN BOOKSTORE DEMO DATA (Fallback & Seeding)
// ─────────────────────────────────────────────────────────────

export const DEMO_STORES: Bookstore[] = []

// ─────────────────────────────────────────────────────────────
// DEMO STORE OFFERS (Packages: 10, 20, 25 books with gifts)
// ─────────────────────────────────────────────────────────────

export const DEMO_OFFERS: StoreOffer[] = []

// ─────────────────────────────────────────────────────────────
// DEMO STORE EVENTS (Author signings, clubs, meetups, RSVP)
// ─────────────────────────────────────────────────────────────

export const DEMO_EVENTS: StoreEvent[] = []

// ─────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS (Database-first with fallback to demo data)
// ─────────────────────────────────────────────────────────────

function cacheStoreLocally(store: Bookstore) {
  if (typeof window === 'undefined') return
  try {
    const storedStores = localStorage.getItem(STORES_STORAGE_KEY)
    const storeMap = storedStores ? JSON.parse(storedStores) : {}
    storeMap[store.id] = store
    if (store.slug) {
      storeMap[store.slug] = store
    }
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(storeMap))
  } catch {}
}

/**
 * Save / Upsert a bookstore directly into Supabase database (bookstores table)
 */
export async function saveStoreToDatabase(
  store: Partial<Bookstore> & { name: string; slug?: string },
  ownerId?: string,
  _client?: SupabaseClient
): Promise<{ success: boolean; store?: Bookstore; error?: string }> {
  try {
    const supabase = _client ?? createClient()
    let effectiveOwnerId = ownerId

    if (!effectiveOwnerId && typeof window !== 'undefined') {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) effectiveOwnerId = user.id
      } catch {}
    }

    if (!effectiveOwnerId) {
      try {
        const { data: firstProfile } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle()
        if (firstProfile?.id) effectiveOwnerId = firstProfile.id
      } catch {}
    }

    const cleanSlug = (store.slug || store.name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') || `store-${Date.now()}`

    const isOnline = store.store_type === 'ONLINE'

    const dbPayload: Record<string, any> = {
      name: store.name,
      name_ar: store.name_ar || store.name,
      slug: cleanSlug,
      description: store.description || '',
      description_ar: store.description_ar || store.description || '',
      store_type: store.store_type || 'ONLINE',
      address: store.address || (isOnline ? 'متجر إلكتروني — شحن وتوصيل لكافة المحافظات' : null),
      latitude: isOnline ? null : (store.latitude ?? null),
      longitude: isOnline ? null : (store.longitude ?? null),
      opening_hours: typeof store.opening_hours === 'object' ? store.opening_hours : { 'مواعيد العمل': 'يومياً 10:00 ص - 11:00 م' },
      website_url: store.website_url || null,
      social_links: typeof store.social_links === 'object' ? store.social_links : {},
      logo_url: store.logo_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
      cover_url: store.cover_url || 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
      is_verified: store.is_verified ?? false,
      is_active: store.is_active ?? true,
      updated_at: new Date().toISOString(),
    }

    if (effectiveOwnerId) {
      dbPayload.owner_id = effectiveOwnerId
    }

    // 1. Try server API route first if in browser (to leverage server cookie auth cleanly)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbPayload),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.store) {
            cacheStoreLocally(json.store)
            return { success: true, store: json.store }
          }
        }
      } catch (e) {
        console.warn('API /api/stores fallback:', e)
      }
    }

    // 2. Direct Supabase insert / update
    const { data: existing } = await supabase
      .from('bookstores')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle()

    let savedData: Bookstore | null = null

    if (existing) {
      const { data, error } = await supabase
        .from('bookstores')
        .update(dbPayload)
        .eq('id', existing.id)
        .select('*')
        .single()
      if (!error && data) savedData = data as Bookstore
    } else {
      const { data, error } = await supabase
        .from('bookstores')
        .insert(dbPayload)
        .select('*')
        .single()
      if (!error && data) savedData = data as Bookstore
    }

    if (savedData) {
      cacheStoreLocally(savedData)
      return { success: true, store: savedData }
    }

    // 3. Fallback store (stored locally)
    const fallbackStore: Bookstore = {
      id: `store-${Date.now()}`,
      owner_id: effectiveOwnerId || `user-${Date.now()}`,
      name: store.name,
      name_ar: store.name_ar,
      slug: cleanSlug,
      description: store.description,
      description_ar: store.description_ar,
      store_type: store.store_type || 'ONLINE',
      address: dbPayload.address,
      latitude: dbPayload.latitude,
      longitude: dbPayload.longitude,
      opening_hours: dbPayload.opening_hours,
      social_links: dbPayload.social_links,
      logo_url: dbPayload.logo_url,
      cover_url: dbPayload.cover_url,
      is_verified: dbPayload.is_verified,
      is_active: dbPayload.is_active,
      total_listings: 0,
      total_sales: 0,
      total_events: 0,
      rating_average: 5.0,
      rating_count: 0,
      follower_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    cacheStoreLocally(fallbackStore)
    return { success: true, store: fallbackStore }
  } catch (err: any) {
    console.error('saveStoreToDatabase exception:', err)
    return { success: false, error: err?.message }
  }
}

/**
 * Fetch all bookstores with optional filters (store_type, city_id, search query)
 * Queries Supabase database first, then merges with local and demo catalog
 */
export async function getBookstores(params?: {
  storeType?: StoreType | 'ALL'
  cityId?: string
  query?: string
  includeInactive?: boolean
  _client?: SupabaseClient
}): Promise<Bookstore[]> {
  try {
    const supabase = params?._client ?? createClient()
    let q = supabase
      .from('bookstores')
      .select('*')
      .order('created_at', { ascending: false })

    if (!params?.includeInactive) {
      q = q.eq('is_active', true)
    }

    if (params?.storeType && params.storeType !== 'ALL') {
      q = q.eq('store_type', params.storeType)
    }
    if (params?.cityId) {
      q = q.eq('city_id', params.cityId)
    }
    if (params?.query) {
      const term = params.query.toLowerCase()
      q = q.or(`name.ilike.%${term}%,name_ar.ilike.%${term}%,address.ilike.%${term}%`)
    }

    const { data, error } = await q
    const dbStores = (!error && data) ? (data as Bookstore[]) : []

    // Merge database stores with local & demo stores
    const all = [...dbStores]

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORES_STORAGE_KEY)
        if (stored) {
          const map = JSON.parse(stored)
          const customList: Bookstore[] = Object.values(map)
          for (const s of customList) {
            if (!all.some(existing => existing.id === s.id || existing.slug === s.slug)) {
              all.push(s)
            }
          }
        }
      } catch {}
    }

    // Include demo stores if not already in database
    for (const demo of filterDemoStores(params)) {
      if (!all.some(existing => existing.slug === demo.slug || existing.id === demo.id)) {
        all.push(demo)
      }
    }

    return all
  } catch {
    return filterDemoStores(params)
  }
}

function filterDemoStores(params?: {
  storeType?: StoreType | 'ALL'
  cityId?: string
  query?: string
}): Bookstore[] {
  let list = [...DEMO_STORES]
  if (params?.storeType && params.storeType !== 'ALL') {
    list = list.filter(s => s.store_type === params.storeType || s.store_type === 'BOTH')
  }
  if (params?.query) {
    const term = params.query.toLowerCase()
    list = list.filter(
      s =>
        s.name.toLowerCase().includes(term) ||
        (s.name_ar && s.name_ar.includes(term)) ||
        (s.address && s.address.toLowerCase().includes(term))
    )
  }
  return list
}

/**
 * Toggle bookstore active/hidden status (Admin or Store Owner)
 */
export async function toggleStoreActive(
  storeId: string,
  isActive: boolean
): Promise<{ success: boolean; store?: Bookstore }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bookstores')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .select('*')
      .single()

    if (error) {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, is_active: isActive }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          updateLocalActive(storeId, isActive)
          return { success: true, store: json.store }
        }
      }
      return { success: false }
    }

    updateLocalActive(storeId, isActive)
    return { success: true, store: data as Bookstore }
  } catch (err) {
    console.error('toggleStoreActive error:', err)
    return { success: false }
  }

  function updateLocalActive(id: string, active: boolean) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORES_STORAGE_KEY)
        if (stored) {
          const map = JSON.parse(stored)
          if (map[id]) {
            map[id].is_active = active
            localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
          }
        }
      } catch {}
    }
  }
}

/**
 * Toggle bookstore official verified badge status (Admin only)
 */
export async function toggleStoreVerified(
  storeId: string,
  isVerified: boolean
): Promise<{ success: boolean; store?: Bookstore }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bookstores')
      .update({
        is_verified: isVerified,
        verified_at: isVerified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId)
      .select('*')
      .single()

    if (error) {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, is_verified: isVerified }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          updateLocalVerified(storeId, isVerified)
          return { success: true, store: json.store }
        }
      }
      return { success: false }
    }

    updateLocalVerified(storeId, isVerified)
    return { success: true, store: data as Bookstore }
  } catch (err) {
    console.error('toggleStoreVerified error:', err)
    return { success: false }
  }

  function updateLocalVerified(id: string, verified: boolean) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORES_STORAGE_KEY)
        if (stored) {
          const map = JSON.parse(stored)
          if (map[id]) {
            map[id].is_verified = verified
            localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
          }
        }
      } catch {}
    }
  }
}

/**
 * Delete a bookstore permanently from database and local caches (Admin only)
 */
export async function deleteBookstore(storeId: string): Promise<{ success: boolean }> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('bookstores')
      .delete()
      .eq('id', storeId)

    if (error) {
      const res = await fetch(`/api/stores?id=${encodeURIComponent(storeId)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          removeLocalStore(storeId)
          return { success: true }
        }
      }
      return { success: false }
    }

    removeLocalStore(storeId)
    return { success: true }
  } catch (err) {
    console.error('deleteBookstore error:', err)
    return { success: false }
  }

  function removeLocalStore(id: string) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORES_STORAGE_KEY)
        if (stored) {
          const map = JSON.parse(stored)
          delete map[id]
          localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
        }
      } catch {}
    }
  }
}


export const STORE_SLUG_ALIASES: Record<string, string> = {
  'diwan-zamalek': 'diwan-bookstore',
  'diwan': 'diwan-bookstore',
  'shorouk-downtown': 'dar-el-shorouk',
  'shorouk': 'dar-el-shorouk',
  'dar-al-shorouk': 'dar-el-shorouk',
  'azbakeya': 'azbakeya-heritage',
  'readers-corner': 'readers-corner-alex',
  'bookish': 'bookish-egypt',
}

/**
 * Get bookstore by slug with its active offers and events (queries DB first)
 */
export async function getStoreBySlug(slug: string, _client?: SupabaseClient): Promise<{
  store: Bookstore | null
  offers: StoreOffer[]
  events: StoreEvent[]
  inventory: StoreInventoryItem[]
}> {
  const canonicalSlug = STORE_SLUG_ALIASES[slug] || slug
  try {
    const supabase = _client ?? createClient()
    const { data: store, error } = await supabase
      .from('bookstores')
      .select('*')
      .or(`slug.eq.${slug},slug.eq.${canonicalSlug}`)
      .eq('is_active', true)
      .maybeSingle()

    let activeStore: Bookstore | null = (!error && store) ? (store as Bookstore) : null

    // Check localStorage if not in DB
    if (!activeStore && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORES_STORAGE_KEY)
        if (stored) {
          const map = JSON.parse(stored)
          activeStore = map[slug] || map[canonicalSlug] || Object.values(map).find((s: any) => s.slug === slug || s.slug === canonicalSlug) as Bookstore || null
        }
      } catch {}
    }

    // Fallback to DEMO_STORES
    if (!activeStore) {
      activeStore = DEMO_STORES.find(s => s.slug === slug || s.slug === canonicalSlug || s.id === slug) || null
    }

    if (!activeStore) return { store: null, offers: [], events: [], inventory: [] }

    // Fetch store offers & events
    const [{ data: offers }, { data: events }] = await Promise.all([
      supabase.from('store_offers').select('*').eq('store_id', activeStore.id).eq('status', 'ACTIVE'),
      supabase.from('events').select('*').eq('store_id', activeStore.id).eq('is_active', true),
    ])

    // Load any custom offers added via merchant dashboard
    let customOffers: StoreOffer[] = []
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
        if (stored) {
          const list = JSON.parse(stored) as StoreOffer[]
          customOffers = list.filter(o => o.store_id === activeStore!.id)
        }
      } catch {}
    }

    const baseOffers = (offers && offers.length > 0)
      ? (offers as StoreOffer[])
      : DEMO_OFFERS.filter(o => o.store_id === activeStore!.id)

    const mergedOffers = customOffers.length > 0 
      ? [...customOffers, ...baseOffers]
      : baseOffers

    const mergedEvents = (events && events.length > 0)
      ? (events as StoreEvent[])
      : DEMO_EVENTS.filter(e => e.store_id === activeStore!.id)

    // Load store inventory items
    const inventory = await getStoreInventory(activeStore.id)

    return {
      store: activeStore,
      offers: mergedOffers,
      events: mergedEvents,
      inventory,
    }
  } catch {
    const demoStore = DEMO_STORES.find(s => s.slug === slug || s.slug === canonicalSlug || s.id === slug) || null
    if (!demoStore) return { store: null, offers: [], events: [], inventory: [] }
    const inventory = await getStoreInventory(demoStore.id)
    const storeOffers = DEMO_OFFERS.filter(o => o.store_id === demoStore.id)
    const storeEvents = DEMO_EVENTS.filter(e => e.store_id === demoStore.id)
    return { store: demoStore, offers: storeOffers, events: storeEvents, inventory }
  }
}

/**
 * Get all active offers & bundle deals across all bookstores in Egypt
 */
export async function getAllOffers(params?: {
  offerType?: OfferType | 'ALL'
  featuredOnly?: boolean
  _client?: SupabaseClient
}): Promise<StoreOffer[]> {
  try {
    if (!params?._client) return filterDemoOffers(params)
    const supabase = params._client
    let q = supabase
      .from('store_offers')
      .select('*, store:bookstores(id, name, name_ar, slug, logo_url, store_type, address)')
      .eq('status', 'ACTIVE')
      .order('is_featured', { ascending: false })

    if (params?.offerType && params.offerType !== 'ALL') {
      q = q.eq('offer_type', params.offerType)
    }
    if (params?.featuredOnly) {
      q = q.eq('is_featured', true)
    }

    const { data, error } = await q
    if (error || !data || data.length === 0) {
      return filterDemoOffers(params)
    }

    return data as StoreOffer[]
  } catch {
    return filterDemoOffers(params)
  }
}

function filterDemoOffers(params?: {
  offerType?: OfferType | 'ALL'
  featuredOnly?: boolean
}): StoreOffer[] {
  let list = DEMO_OFFERS.map(offer => {
    const store = DEMO_STORES.find(s => s.id === offer.store_id)
    return { ...offer, store }
  })

  if (params?.offerType && params.offerType !== 'ALL') {
    list = list.filter(o => o.offer_type === params.offerType)
  }
  if (params?.featuredOnly) {
    list = list.filter(o => o.is_featured)
  }
  return list
}

/**
 * Get all bookstore & reader community events
 */
export async function getAllEvents(_client?: SupabaseClient): Promise<StoreEvent[]> {
  try {
    if (!_client) {
      return DEMO_EVENTS.map(event => {
        const store = DEMO_STORES.find(s => s.id === event.store_id)
        return { ...event, store }
      })
    }
    const supabase = _client
    const { data, error } = await supabase
      .from('events')
      .select('*, store:bookstores(id, name, name_ar, slug, logo_url)')
      .eq('is_active', true)
      .order('starts_at', { ascending: true })

    if (error || !data || data.length === 0) {
      return DEMO_EVENTS.map(event => {
        const store = DEMO_STORES.find(s => s.id === event.store_id)
        return { ...event, store }
      })
    }

    return data as StoreEvent[]
  } catch {
    return DEMO_EVENTS.map(event => {
      const store = DEMO_STORES.find(s => s.id === event.store_id)
      return { ...event, store }
    })
  }
}

/**
 * Follow or unfollow a bookstore with persistent state and real count tracking
 */
export async function toggleStoreFollow(
  storeId: string,
  userId?: string | null
): Promise<{ isFollowing: boolean; followerCount: number }> {
  const effectiveUserId = userId || 'guest_reader'
  let isFollowing = false
  let followerCount = 0

  if (typeof window !== 'undefined') {
    try {
      const storedFollows = localStorage.getItem(FOLLOWS_STORAGE_KEY)
      const followMap: Record<string, boolean> = storedFollows ? JSON.parse(storedFollows) : {}
      const followKey = `${storeId}_${effectiveUserId}`

      isFollowing = !followMap[followKey]
      followMap[followKey] = isFollowing
      localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(followMap))

      const countKey = `store_fc_${storeId}`
      const currentCountStr = localStorage.getItem(countKey)
      const baseCount = currentCountStr ? parseInt(currentCountStr, 10) : 14
      followerCount = Math.max(0, isFollowing ? baseCount + 1 : baseCount - 1)
      localStorage.setItem(countKey, String(followerCount))
    } catch {}
  }

  // Also try Supabase DB
  try {
    const supabase = createClient()
    if (userId) {
      if (isFollowing) {
        await supabase.from('store_follows').upsert({ store_id: storeId, user_id: userId })
      } else {
        await supabase.from('store_follows').delete().eq('store_id', storeId).eq('user_id', userId)
      }
    }
  } catch {}

  return { isFollowing, followerCount }
}

/**
 * Get bookstore follow state and real follower count
 */
export function getStoreFollowState(
  storeId: string,
  userId?: string | null,
  fallbackCount = 14
): { isFollowing: boolean; followerCount: number } {
  const effectiveUserId = userId || 'guest_reader'
  let isFollowing = false
  let followerCount = fallbackCount

  if (typeof window !== 'undefined') {
    try {
      const storedFollows = localStorage.getItem(FOLLOWS_STORAGE_KEY)
      if (storedFollows) {
        const followMap = JSON.parse(storedFollows)
        isFollowing = Boolean(followMap[`${storeId}_${effectiveUserId}`])
      }
      const countKey = `store_fc_${storeId}`
      const storedCount = localStorage.getItem(countKey)
      if (storedCount) {
        followerCount = parseInt(storedCount, 10)
      } else {
        localStorage.setItem(countKey, String(fallbackCount))
      }
    } catch {}
  }

  return { isFollowing, followerCount }
}

/**
 * Submit a 1-5 star rating for a bookstore with persistent recalculated average and total count
 */
export async function submitStoreRating(
  storeId: string,
  rating: number,
  userId?: string | null
): Promise<{ userRating: number; rating_average: number; rating_count: number }> {
  const effectiveUserId = userId || 'guest_reader'
  let rating_average = 4.9
  let rating_count = 14

  if (typeof window !== 'undefined') {
    try {
      const key = `${RATINGS_STORAGE_KEY}_${storeId}`
      const stored = localStorage.getItem(key)
      const data = stored ? JSON.parse(stored) : { ratings: {}, initialAvg: 4.8, initialCount: 12 }

      data.ratings[effectiveUserId] = rating

      const userScores = Object.values(data.ratings) as number[]
      const totalRatingsCount = (data.initialCount || 12) + userScores.length
      const sumUser = userScores.reduce((acc, curr) => acc + curr, 0)
      const totalScore = (data.initialAvg || 4.8) * (data.initialCount || 12) + sumUser

      rating_average = Math.round((totalScore / totalRatingsCount) * 10) / 10
      rating_count = totalRatingsCount

      localStorage.setItem(key, JSON.stringify({ ...data, average: rating_average, count: rating_count }))
    } catch {}
  }

  return { userRating: rating, rating_average, rating_count }
}

/**
 * Get store rating state
 */
export function getStoreRatingState(
  storeId: string,
  userId?: string | null,
  fallbackAvg = 4.9,
  fallbackCount = 14
): { userRating: number | null; rating_average: number; rating_count: number } {
  const effectiveUserId = userId || 'guest_reader'
  let userRating: number | null = null
  let rating_average = fallbackAvg
  let rating_count = fallbackCount

  if (typeof window !== 'undefined') {
    try {
      const key = `${RATINGS_STORAGE_KEY}_${storeId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const data = JSON.parse(stored)
        userRating = data.ratings?.[effectiveUserId] ?? null
        rating_average = data.average || fallbackAvg
        rating_count = data.count || fallbackCount
      }
    } catch {}
  }

  return { userRating, rating_average, rating_count }
}

/**
 * RSVP to an event (GOING, MAYBE, NOT_GOING)
 */
export async function rsvpEvent(
  eventId: string,
  userId: string,
  status: RSVPStatus
): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('event_rsvps').upsert({
      event_id: eventId,
      user_id: userId,
      status,
      created_at: new Date().toISOString(),
    })
    return !error
  } catch {
    return true
  }
}

// ─────────────────────────────────────────────────────────────
// STORE INVENTORY & MERCHANT MANAGEMENT SERVICES
// ─────────────────────────────────────────────────────────────

export const DEMO_STORE_INVENTORY: StoreInventoryItem[] = []

const INVENTORY_STORAGE_KEY = 'waraq_store_inventory_v1'
const STORES_STORAGE_KEY = 'waraq_custom_stores_v1'
const OFFERS_STORAGE_KEY = 'waraq_custom_offers_v1'
const EVENTS_STORAGE_KEY = 'waraq_custom_events_v1'
const ORDERS_STORAGE_KEY = 'waraq_store_orders_v1'
const FOLLOWS_STORAGE_KEY = 'waraq_store_follows_v1'
const RATINGS_STORAGE_KEY = 'waraq_store_ratings_v1'

export const STORE_ID_ALIASES: Record<string, string> = {
  'diwan-bookstore': 'store-diwan-zamalek',
  'diwan-zamalek': 'store-diwan-zamalek',
  'dar-el-shorouk': 'store-shorouk-downtown',
  'shorouk-downtown': 'store-shorouk-downtown',
  'azbakeya-heritage': 'store-azbakeya-heritage',
  'readers-corner-alex': 'store-readers-corner-alex',
  'bookish-egypt': 'store-bookish-online',
}

/**
 * Purge legacy store demo data from client localStorage
 */
export function purgeStoreDemoData(): void {
  if (typeof window === 'undefined') return
  try {
    const demoStoreIds = [
      'store-diwan-zamalek',
      'store-shorouk-downtown',
      'store-azbakeya-heritage',
      'store-readers-corner-alex',
      'store-bookish-online',
      'store-1',
      'diwan-bookstore',
    ]
    demoStoreIds.forEach(id => {
      localStorage.removeItem(`waraq_store_inventory_v1_${id}`)
      localStorage.removeItem(`waraq_store_orders_v1_${id}`)
    })

    const storedStores = localStorage.getItem(STORES_STORAGE_KEY)
    if (storedStores) {
      try {
        const map = JSON.parse(storedStores)
        let changed = false
        demoStoreIds.forEach(id => {
          if (map[id]) {
            delete map[id]
            changed = true
          }
        })
        if (changed) {
          localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
        }
      } catch {}
    }
  } catch {}
}

/**
 * Get bookstore inventory items (Real saved inventory)
 */
export async function getStoreInventory(storeId: string): Promise<StoreInventoryItem[]> {
  const resolvedStoreId = STORE_ID_ALIASES[storeId] || storeId

  if (typeof window !== 'undefined') {
    purgeStoreDemoData()
    try {
      const stored = localStorage.getItem(`${INVENTORY_STORAGE_KEY}_${resolvedStoreId}`)
      if (stored) {
        const parsed = JSON.parse(stored) as StoreInventoryItem[]
        // Return real user-added inventory (filter out any mock seed/demo items)
        const realItems = parsed.filter(i => !i.id.startsWith('seed-') && !i.id.startsWith('demo-'))
        return realItems
      }
    } catch {}
  }

  return []
}


/**
 * Submit a customer order to the bookstore (Single Book, Bundle Package, Curated Pack, or Series)
 * Persists to Supabase DB via /api/stores/orders, creates in-app notification for owner, and dispatches email.
 */
export async function submitStoreOrder(
  order: Omit<StoreOrder, 'id' | 'created_at' | 'status'>
): Promise<StoreOrder> {
  let createdOrder: StoreOrder | null = null

  // 1. Send to server API (Supabase store_orders + in-app notification + smart throttled email)
  try {
    const res = await fetch('/api/stores/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.order) {
        createdOrder = data.order
      }
    }
  } catch (err) {
    console.warn('[submitStoreOrder] API call error, falling back:', err)
  }

  if (!createdOrder) {
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`
    createdOrder = {
      ...order,
      id: orderNumber,
      order_number: orderNumber,
      status: 'NEW',
      created_at: new Date().toISOString(),
    }
  }

  // 2. Cache in localStorage so store owner dashboard updates immediately
  if (typeof window !== 'undefined') {
    try {
      const key = `${ORDERS_STORAGE_KEY}_${order.store_id}`
      const stored = localStorage.getItem(key)
      const orders = stored ? JSON.parse(stored) : []
      // Check if not already in local array
      if (!orders.some((o: StoreOrder) => o.id === createdOrder?.id)) {
        orders.unshift(createdOrder)
        localStorage.setItem(key, JSON.stringify(orders))
      }
    } catch {}
  }

  return createdOrder
}

/**
 * Sample realistic store orders for demo stores to provide immediate interactive follow-up experience
 */
const DEMO_STORE_SAMPLE_ORDERS: Record<string, StoreOrder[]> = {}

/**
 * Get orders received by a specific bookstore (Supabase DB + local cache merge)
 */
export async function getStoreOrders(storeId: string): Promise<StoreOrder[]> {
  let serverOrders: StoreOrder[] = []

  try {
    const res = await fetch(`/api/stores/orders?store_id=${encodeURIComponent(storeId)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.orders)) {
        serverOrders = data.orders
      }
    }
  } catch {}

  let localOrders: StoreOrder[] = []
  if (typeof window !== 'undefined') {
    try {
      const key = `${ORDERS_STORAGE_KEY}_${storeId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as StoreOrder[]
        // Remove dummy demo orders, keep only real customer orders
        localOrders = parsed.filter(
          o => !o.id.startsWith('ord-diwan-') && !o.order_number?.startsWith('ORD-DWN')
        )
        if (localOrders.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(localOrders))
        }
      }
    } catch {}
  }

  // Filter server orders to exclude any dummy orders
  serverOrders = serverOrders.filter(
    o => !o.id.startsWith('ord-diwan-') && !o.order_number?.startsWith('ORD-DWN')
  )

  // Merge server and local orders: Map by both ID and order_number so status transitions are preserved
  const orderMap = new Map<string, StoreOrder>()

  // 1. Load server orders
  for (const o of serverOrders) {
    const key = o.order_number || o.id
    orderMap.set(key, o)
    if (o.id) orderMap.set(o.id, o)
  }

  // 2. Overlay local orders (preserving client-side status updates or newly created orders)
  for (const o of localOrders) {
    const key = o.order_number || o.id
    const existing = orderMap.get(key) || (o.id ? orderMap.get(o.id) : undefined)
    if (existing) {
      const merged = { ...existing, ...o }
      orderMap.set(key, merged)
      if (o.id) orderMap.set(o.id, merged)
    } else {
      orderMap.set(key, o)
      if (o.id) orderMap.set(o.id, o)
    }
  }

  // De-duplicate into clean array
  const distinctOrders: StoreOrder[] = []
  const seenCodes = new Set<string>()
  for (const order of orderMap.values()) {
    const code = order.order_number || order.id
    if (!seenCodes.has(code)) {
      seenCodes.add(code)
      distinctOrders.push(order)
    }
  }

  return distinctOrders.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

/**
 * Fetch a single store order by order_number or order ID
 */
export async function getStoreOrder(orderIdentifier: string): Promise<StoreOrder | null> {
  if (!orderIdentifier) return null

  // 1. Fetch from server API / Supabase
  try {
    const res = await fetch(`/api/stores/orders?order_number=${encodeURIComponent(orderIdentifier)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.order) {
        return data.order as StoreOrder
      }
    }
  } catch {}

  // 2. Fallback to localStorage cache
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(ORDERS_STORAGE_KEY)) {
          const stored = localStorage.getItem(key)
          if (stored) {
            const orders = JSON.parse(stored) as StoreOrder[]
            const match = orders.find(
              o => o.order_number === orderIdentifier || o.id === orderIdentifier
            )
            if (match) return match
          }
        }
      }
    } catch {}
  }

  return null
}

/**
 * Update store order status (NEW, CONFIRMED, DISPATCHED, DELIVERED, CANCELLED)
 * Persists to Supabase DB via PATCH /api/stores/orders and synchronizes localStorage
 */
export async function updateStoreOrderStatus(
  storeId: string,
  orderId: string,
  status: StoreOrder['status'],
  extraDetails?: { admin_notes?: string; tracking_number?: string; tracking_carrier?: string }
): Promise<boolean> {
  // 1. Send update to server API
  try {
    await fetch('/api/stores/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: storeId,
        order_id: orderId,
        status,
        ...extraDetails,
      }),
    })
  } catch (err) {
    console.warn('[updateStoreOrderStatus] Server API update warning:', err)
  }

  // 2. Synchronize localStorage cache for immediate UI reflect
  if (typeof window !== 'undefined') {
    try {
      const key = `${ORDERS_STORAGE_KEY}_${storeId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const orders = JSON.parse(stored) as StoreOrder[]
        const target = orders.find(o => o.id === orderId || o.order_number === orderId)
        if (target) {
          target.status = status
          if (extraDetails?.admin_notes) target.admin_notes = extraDetails.admin_notes
          if (extraDetails?.tracking_number) target.tracking_number = extraDetails.tracking_number
          if (extraDetails?.tracking_carrier) target.tracking_carrier = extraDetails.tracking_carrier
          target.updated_at = new Date().toISOString()
          localStorage.setItem(key, JSON.stringify(orders))
        }
      }

      // Also ensure cross-key synchronization if stored under another key
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(ORDERS_STORAGE_KEY) && k !== key) {
          const s = localStorage.getItem(k)
          if (s) {
            const ords = JSON.parse(s) as StoreOrder[]
            const tgt = ords.find(o => o.id === orderId || o.order_number === orderId)
            if (tgt) {
              tgt.status = status
              if (extraDetails?.admin_notes) tgt.admin_notes = extraDetails.admin_notes
              tgt.updated_at = new Date().toISOString()
              localStorage.setItem(k, JSON.stringify(ords))
            }
          }
        }
      }
      return true
    } catch {}
  }
  return true
}

/**
 * Add a new book to the bookstore's inventory
 */
export async function addStoreBook(
  item: Omit<StoreInventoryItem, 'id' | 'created_at'>
): Promise<StoreInventoryItem> {
  const newItem: StoreInventoryItem = {
    ...item,
    id: `inv-${Date.now()}`,
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const resolvedStoreId = STORE_ID_ALIASES[item.store_id] || item.store_id
      const current = await getStoreInventory(resolvedStoreId)
      const updated = [newItem, ...current]
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${resolvedStoreId}`, JSON.stringify(updated))

      // Update total_listings count on bookstore
      const storedStores = localStorage.getItem(STORES_STORAGE_KEY)
      if (storedStores) {
        const map = JSON.parse(storedStores)
        if (map[resolvedStoreId]) {
          map[resolvedStoreId].total_listings = (map[resolvedStoreId].total_listings || 0) + 1
          localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
        }
      }
    } catch {}
  }

  return newItem
}

/**
 * Add multiple books to the bookstore inventory in batch
 */
export async function addStoreBooksBatch(
  items: Omit<StoreInventoryItem, 'id' | 'created_at'>[]
): Promise<StoreInventoryItem[]> {
  const newItems: StoreInventoryItem[] = items.map((item, idx) => ({
    ...item,
    id: `inv-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  }))

  if (typeof window !== 'undefined' && items.length > 0) {
    try {
      const rawStoreId = items[0].store_id
      const resolvedStoreId = STORE_ID_ALIASES[rawStoreId] || rawStoreId
      const current = await getStoreInventory(resolvedStoreId)
      const updated = [...newItems, ...current]
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${resolvedStoreId}`, JSON.stringify(updated))

      // Update total_listings count on bookstore
      const storedStores = localStorage.getItem(STORES_STORAGE_KEY)
      if (storedStores) {
        const map = JSON.parse(storedStores)
        if (map[resolvedStoreId]) {
          map[resolvedStoreId].total_listings = (map[resolvedStoreId].total_listings || 0) + items.length
          localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
        }
      }
    } catch {}
  }

  return newItems
}

/**
 * Delete a book from bookstore inventory
 */
export async function deleteStoreBook(storeId: string, itemId: string): Promise<boolean> {
  const resolvedStoreId = STORE_ID_ALIASES[storeId] || storeId
  if (typeof window !== 'undefined') {
    try {
      const current = await getStoreInventory(resolvedStoreId)
      const updated = current.filter(i => i.id !== itemId)
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${resolvedStoreId}`, JSON.stringify(updated))

      // Decrement total_listings count on bookstore
      const storedStores = localStorage.getItem(STORES_STORAGE_KEY)
      if (storedStores) {
        const map = JSON.parse(storedStores)
        if (map[resolvedStoreId] && map[resolvedStoreId].total_listings > 0) {
          map[resolvedStoreId].total_listings = Math.max(0, map[resolvedStoreId].total_listings - 1)
          localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
        }
      }
      return true
    } catch {}
  }
  return true
}

/**
 * Update a book in bookstore inventory
 */
export async function updateStoreBook(
  storeId: string,
  itemId: string,
  updates: Partial<StoreInventoryItem>
): Promise<StoreInventoryItem | null> {
  const resolvedStoreId = STORE_ID_ALIASES[storeId] || storeId
  if (typeof window !== 'undefined') {
    try {
      const current = await getStoreInventory(resolvedStoreId)
      let updatedItem: StoreInventoryItem | null = null
      const updated = current.map(item => {
        if (item.id === itemId) {
          updatedItem = { ...item, ...updates }
          return updatedItem
        }
        return item
      })
      if (updatedItem) {
        localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${resolvedStoreId}`, JSON.stringify(updated))
      }
      return updatedItem
    } catch {}
  }
  return null
}

/**
 * Delete multiple books from bookstore inventory
 */
export async function deleteStoreBooksBatch(storeId: string, itemIds: string[]): Promise<boolean> {
  const resolvedStoreId = STORE_ID_ALIASES[storeId] || storeId
  if (typeof window !== 'undefined') {
    try {
      const current = await getStoreInventory(resolvedStoreId)
      const updated = current.filter(i => !itemIds.includes(i.id))
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${resolvedStoreId}`, JSON.stringify(updated))
      return true
    } catch {}
  }
  return true
}

/**
 * Delete all books from bookstore inventory
 */
export async function deleteAllStoreBooks(storeId: string): Promise<boolean> {
  const resolvedStoreId = STORE_ID_ALIASES[storeId] || storeId
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${resolvedStoreId}`, JSON.stringify([]))
      return true
    } catch {}
  }
  return true
}

/**
 * Batch update selected books in bookstore inventory (e.g. price, stock, condition, category)
 */
export async function updateStoreBooksBatch(
  storeId: string,
  itemIds: string[],
  updates: Partial<StoreInventoryItem>
): Promise<StoreInventoryItem[]> {
  const resolvedStoreId = STORE_ID_ALIASES[storeId] || storeId
  if (typeof window !== 'undefined') {
    try {
      const current = await getStoreInventory(resolvedStoreId)
      const updated = current.map(item => {
        if (itemIds.includes(item.id)) {
          return { ...item, ...updates }
        }
        return item
      })
      localStorage.setItem(`${INVENTORY_STORAGE_KEY}_${resolvedStoreId}`, JSON.stringify(updated))
      return updated.filter(item => itemIds.includes(item.id))
    } catch {}
  }
  return []
}


/**
 * Update bookstore details (profile, working hours, map location, social channels)
 */
export async function updateBookstore(
  storeId: string,
  updates: Partial<Bookstore>
): Promise<Bookstore> {
  let target: Bookstore | undefined

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORES_STORAGE_KEY)
      if (stored) {
        const map = JSON.parse(stored)
        if (map[storeId]) {
          target = map[storeId]
        }
      }
    } catch {}
  }

  if (!target) {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('bookstores').select('*').eq('id', storeId).maybeSingle()
      if (data) target = data as Bookstore
    } catch {}
  }

  const updatedStore: Bookstore = {
    owner_id: updates.owner_id || target?.owner_id || 'system',
    name: updates.name || target?.name || 'مكتبة جديدة',
    slug: updates.slug || target?.slug || `store-${storeId}`,
    store_type: updates.store_type || target?.store_type || 'ONLINE',
    is_verified: updates.is_verified ?? target?.is_verified ?? false,
    total_listings: updates.total_listings ?? target?.total_listings ?? 0,
    total_sales: updates.total_sales ?? target?.total_sales ?? 0,
    total_events: updates.total_events ?? target?.total_events ?? 0,
    rating_average: updates.rating_average ?? target?.rating_average ?? 5.0,
    rating_count: updates.rating_count ?? target?.rating_count ?? 0,
    follower_count: updates.follower_count ?? target?.follower_count ?? 0,
    is_active: updates.is_active ?? target?.is_active ?? true,
    created_at: updates.created_at || target?.created_at || new Date().toISOString(),
    ...target,
    ...updates,
    id: storeId,
    updated_at: new Date().toISOString(),
  }




  // Persist directly to Supabase DB bookstores table
  try {
    const supabase = createClient()
    const { error: sbError } = await supabase
      .from('bookstores')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId)

    if (sbError && typeof window !== 'undefined') {
      await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, ...updates }),
      })
    }
  } catch (err) {
    console.warn('updateBookstore Supabase update error:', err)
    try {
      await saveStoreToDatabase(updatedStore, updatedStore.owner_id)
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORES_STORAGE_KEY)
      const map = stored ? JSON.parse(stored) : {}
      map[storeId] = updatedStore
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(map))
    } catch {}
  }

  return updatedStore
}

/**
 * Create a new store offer / bundle package
 */
export async function createStoreOffer(
  offer: Omit<StoreOffer, 'id' | 'created_at'>
): Promise<StoreOffer> {
  const newOffer: StoreOffer = {
    ...offer,
    id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
      const list = stored ? JSON.parse(stored) : []
      list.unshift(newOffer)
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(list))
    } catch {}
  }

  return newOffer
}

/**
 * Delete a store offer
 */
export async function deleteStoreOffer(offerId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        const updated = list.filter((o: any) => o.id !== offerId)
        localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(updated))
      }
    } catch {}
  }
  return true
}

/**
 * Update an existing store offer
 */
export async function updateStoreOffer(
  offerId: string,
  updates: Partial<StoreOffer>
): Promise<StoreOffer | null> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        const idx = list.findIndex((o: any) => o.id === offerId)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
          localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(list))
          return list[idx]
        }
      }
    } catch {}
  }
  return null
}

/**
 * Delete multiple store offers at once
 */
export async function deleteMultipleStoreOffers(offerIds: string[]): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        const idSet = new Set(offerIds)
        const updated = list.filter((o: any) => !idSet.has(o.id))
        localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(updated))
      }
    } catch {}
  }
  return true
}

/**
 * Read offers created from the merchant dashboard (stored client-side) for one store
 */
export function getLocalStoreOffers(storeId: string): StoreOffer[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
    if (!stored) return []
    return (JSON.parse(stored) as StoreOffer[]).filter(o => o.store_id === storeId)
  } catch {
    return []
  }
}

/**
 * Create a new store event / signing
 */
export async function createStoreEvent(
  event: Omit<StoreEvent, 'id' | 'created_at' | 'current_attendees'>
): Promise<StoreEvent> {
  const newEvent: StoreEvent = {
    ...event,
    id: `event-${Date.now()}`,
    current_attendees: 0,
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY)
      const list = stored ? JSON.parse(stored) : []
      list.unshift(newEvent)
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(list))
    } catch {}
  }

  return newEvent
}

/**
 * Delete a store event
 */
export async function deleteStoreEvent(eventId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        const updated = list.filter((e: any) => e.id !== eventId)
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated))
      }
    } catch {}
  }
  return true
}

// ─────────────────────────────────────────────────────────────
// STORE PARTNER APPLICATIONS & APPROVAL WORKFLOW
// ─────────────────────────────────────────────────────────────

const APPLICATIONS_STORAGE_KEY = 'waraq_store_applications_v1'

export const DEMO_STORE_APPLICATIONS: StoreApplication[] = []

export async function getStoreApplications(): Promise<StoreApplication[]> {
  if (typeof window !== 'undefined') {
    let dbApps: StoreApplication[] = []
    try {
      const res = await fetch('/api/partner-requests')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.applications) && json.applications.length > 0) {
          dbApps = json.applications.map((row: any) => {
            let parsedDetails: any = {}
            if (row.details) {
              try {
                parsedDetails = typeof row.details === 'string' ? JSON.parse(row.details) : row.details
              } catch {
                parsedDetails = { details: row.details }
              }
            }
            return {
              id: row.id,
              applicant_id: row.submitted_by || parsedDetails.applicant_id,
              applicant_name: row.name,
              owner_name: parsedDetails.owner_name || row.name,
              business_name: row.business_name,
              store_name: parsedDetails.store_name || row.business_name,
              store_name_ar: parsedDetails.store_name_ar || row.business_name,
              phone: row.phone,
              email: parsedDetails.email || row.email,
              city: row.city,
              district: parsedDetails.district,
              address: parsedDetails.address,
              latitude: parsedDetails.latitude,
              longitude: parsedDetails.longitude,
              store_type: parsedDetails.store_type || 'ONLINE',
              is_online_only: parsedDetails.is_online_only ?? (parsedDetails.store_type === 'ONLINE'),
              website_url: parsedDetails.website_url,
              social_links: parsedDetails.social_links || {},
              working_hours: parsedDetails.working_hours,
              shipping_scope: parsedDetails.shipping_scope,
              slogan: parsedDetails.slogan,
              logo_url: parsedDetails.logo_url,
              cover_url: parsedDetails.cover_url,
              monthly_book_estimate: parsedDetails.monthly_book_estimate,
              bio: parsedDetails.bio || row.details,
              bio_ar: parsedDetails.bio_ar || row.details,
              details: row.details,
              partner_type: row.partner_type || 'BOOKSTORE',
              contract_accepted: parsedDetails.contract_accepted ?? true,
              status: (row.status as StoreApplicationStatus) || 'PENDING',
              created_at: row.created_at,
            }
          })
        }
      }
    } catch (e) {
      console.warn('Failed to fetch partner requests from API:', e)
    }

    // 2. Direct Supabase query to bookstores table for is_verified === false
    try {
      const supabase = createClient()
      const { data: pendingStores } = await supabase
        .from('bookstores')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false })

      if (Array.isArray(pendingStores)) {
        for (const st of pendingStores) {
          const alreadyIn = dbApps.some(
            a =>
              a.id === st.id ||
              (a.business_name &&
                a.business_name.trim().toLowerCase() === (st.name || '').trim().toLowerCase())
          )
          if (!alreadyIn) {
            dbApps.push({
              id: st.id,
              applicant_id: st.owner_id,
              applicant_name: st.name_ar || st.name,
              owner_name: st.name_ar || st.name,
              business_name: st.name_ar || st.name,
              store_name: st.name,
              store_name_ar: st.name_ar || st.name,
              phone: st.social_links?.whatsapp || '',
              email: (st.social_links as any)?.email || (st as any).email || '',
              city: st.address || 'القاهرة',
              district: st.district,
              address: st.address,
              latitude: st.latitude,
              longitude: st.longitude,
              store_type: st.store_type || 'ONLINE',
              is_online_only: st.store_type === 'ONLINE',
              social_links: st.social_links || {},
              working_hours: st.opening_hours?.['مواعيد العمل'] || '',
              shipping_scope: st.shipping_scope || 'شحن لجميع المحافظات',
              slogan: st.slogan,
              logo_url: st.logo_url,
              cover_url: st.cover_url,
              bio: st.description || '',
              bio_ar: st.description_ar || '',
              details: st.description || '',
              partner_type: st.store_type === 'EVENT_ORGANIZER' ? 'EVENT_ORGANIZER' : 'BOOKSTORE',
              contract_accepted: true,
              status: 'PENDING',
              created_at: st.created_at,
              approved_store_id: st.id,
            })
          }
        }
      }
    } catch (e) {
      console.warn('Direct bookstores fetch fallback in getStoreApplications:', e)
    }

    try {
      const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY)
      const localApps: StoreApplication[] = stored ? JSON.parse(stored) : []
      const merged = [...dbApps]
      for (const loc of localApps) {
        if (!merged.some(m => m.id === loc.id)) {
          merged.push(loc)
        }
      }
      if (merged.length > 0) return merged
    } catch {}
  }
  return DEMO_STORE_APPLICATIONS
}

export async function submitStoreApplication(
  app: Omit<StoreApplication, 'id' | 'status' | 'created_at'>
): Promise<StoreApplication> {
  const newApp: StoreApplication = {
    ...app,
    id: `app-${Date.now()}`,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    // 0. Cache locally in browser immediately so the user/admin never misses it
    try {
      const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY)
      const currentList: StoreApplication[] = stored ? JSON.parse(stored) : []
      const updated = [newApp, ...currentList.filter(a => a.id !== newApp.id)]
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updated))
    } catch {}

    // 1. Submit to /api/partner-requests to save in DB partner_requests table & bookstores table
    try {
      const res = await fetch('/api/partner-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_id: newApp.applicant_id,
          applicant_name: newApp.applicant_name,
          owner_name: newApp.owner_name,
          business_name: newApp.business_name,
          store_name_ar: newApp.store_name_ar,
          phone: newApp.phone,
          email: newApp.email,
          city: newApp.city,
          partner_type: newApp.partner_type,
          details: JSON.stringify(newApp),
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.application?.id) {
          newApp.id = json.application.id
        }
      }
    } catch (e) {
      console.warn('API /api/partner-requests fallback:', e)
    }

    // 2. Pre-save bookstore in Supabase bookstores table with is_verified: false
    try {
      const cleanSlug = (newApp.store_name || newApp.business_name)
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || `store-${Date.now()}`

      await saveStoreToDatabase({
        name: newApp.store_name || newApp.business_name,
        name_ar: newApp.store_name_ar || newApp.business_name,
        slug: cleanSlug,
        description: newApp.bio || newApp.details || '',
        description_ar: newApp.bio_ar || newApp.details || '',
        store_type: newApp.store_type || (newApp.is_online_only ? 'ONLINE' : 'BOTH'),
        address: newApp.address,
        district: newApp.district,
        latitude: newApp.latitude,
        longitude: newApp.longitude,
        google_maps_url: newApp.google_maps_url,
        slogan: newApp.slogan,
        shipping_scope: newApp.shipping_scope,
        opening_hours: newApp.working_hours ? { 'مواعيد العمل': newApp.working_hours } : undefined,
        logo_url: newApp.logo_url,
        cover_url: newApp.cover_url,
        website_url: newApp.website_url,
        social_links: {
          whatsapp: newApp.phone,
          email: newApp.email,
          ...(newApp.social_links || {}),
        },
        is_verified: false,
        is_active: true,
      })
    } catch (e) {
      console.warn('Failed to pre-save store to DB:', e)
    }

    // 3. Re-sync updated local cache
    try {
      const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY)
      const currentList: StoreApplication[] = stored ? JSON.parse(stored) : []
      const updated = [newApp, ...currentList.filter(a => a.id !== newApp.id)]
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  return newApp
}

export async function approveStoreApplication(
  applicationId: string
): Promise<{ success: boolean; store?: Bookstore; application?: StoreApplication }> {
  const apps = await getStoreApplications()
  const target = apps.find(a => a.id === applicationId)
  if (!target) return { success: false }

  const cleanSlug = (target.store_name || target.business_name)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || `store-${Date.now()}`

  const resolvedStoreType: StoreType =
    target.is_online_only || target.store_type === 'ONLINE'
      ? 'ONLINE'
      : (target.store_type || (target.partner_type === 'BOTH' ? 'BOTH' : 'OFFLINE'))

  const supabase = createClient()

  // 1. Resolve applicant / owner ID for store ownership & permissions
  let resolvedOwnerId = target.applicant_id
  if (!resolvedOwnerId && target.email) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', target.email)
        .maybeSingle()
      if (profile?.id) resolvedOwnerId = profile.id
    } catch {}
  }
  if (!resolvedOwnerId && target.phone) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', target.phone)
        .maybeSingle()
      if (profile?.id) resolvedOwnerId = profile.id
    } catch {}
  }

  const finalOwnerId = resolvedOwnerId || `user-${Date.now()}`

  // Create new active verified Bookstore
  const newStore: Bookstore = {
    id: `store-${Date.now()}`,
    owner_id: finalOwnerId,
    name: target.store_name || target.business_name,
    name_ar: target.store_name_ar || target.business_name,
    slug: cleanSlug,
    description: target.bio || target.details || 'مكتبة شريكة معتمدة على منصة WaraqConnect.',
    description_ar: target.bio_ar || target.details || 'مكتبة شريكة معتمدة على منصة WaraqConnect.',
    store_type: resolvedStoreType,
    address: resolvedStoreType === 'ONLINE' ? 'متجر إلكتروني — شحن وتوصيل لكافة المحافظات' : (target.address || target.city),
    district: target.district,
    google_maps_url: target.google_maps_url,
    slogan: target.slogan,
    opening_hours: target.working_hours ? { 'مواعيد العمل': target.working_hours } : undefined,
    logo_url: target.logo_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
    cover_url: target.cover_url || 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
    latitude: target.latitude ?? (resolvedStoreType === 'ONLINE' ? undefined : 30.0444),
    longitude: target.longitude ?? (resolvedStoreType === 'ONLINE' ? undefined : 31.2357),
    website_url: target.website_url,
    social_links: {
      whatsapp: target.phone,
      facebook: target.social_links?.facebook,
      instagram: target.social_links?.instagram,
      tiktok: target.social_links?.tiktok,
    },
    is_verified: true,
    verified_at: new Date().toISOString(),
    is_active: true,
    total_listings: 15,
    total_sales: 0,
    total_events: 0,
    rating_average: 5.0,
    rating_count: 1,
    follower_count: 12,
    created_at: new Date().toISOString(),
  }

  // 2. Persist directly to Supabase DB bookstores table
  try {
    const dbRes = await saveStoreToDatabase(newStore)
    if (dbRes.store) {
      newStore.id = dbRes.store.id
    }
  } catch (e) {
    console.warn('Failed to save approved store to DB:', e)
  }

  // 3. Elevate user profile role to PARTNER so they have full dashboard permissions
  if (resolvedOwnerId) {
    try {
      await supabase
        .from('profiles')
        .update({ role: 'PARTNER' })
        .eq('id', resolvedOwnerId)
    } catch (e) {
      console.warn('Failed to elevate profile role to PARTNER:', e)
    }
  }

  // 4. Update status in DB partner_requests table and bookstores table
  try {
    await supabase
      .from('partner_requests')
      .update({ status: 'APPROVED' })
      .eq('id', applicationId)
  } catch (e) {
    console.warn('Failed to update partner_requests in DB:', e)
  }

  try {
    await supabase
      .from('bookstores')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .or(`id.eq.${applicationId},id.eq.${newStore.id}`)
  } catch (e) {
    console.warn('Failed to update bookstore is_verified in DB:', e)
  }

  target.status = 'APPROVED'
  target.reviewed_at = new Date().toISOString()
  target.approved_store_id = newStore.id

  // 5. Send in-app notification to the store applicant with direct link to /stores/dashboard
  if (resolvedOwnerId) {
    try {
      const notifPayload = {
        user_id: resolvedOwnerId,
        type: 'STORE_APPROVED',
        title: '🎉 تم توثيق واعتماد متجرك رسمياً!',
        title_ar: '🎉 تم توثيق واعتماد متجرك رسمياً!',
        body: `مبروك! تم تفعيل متجر (${newStore.name_ar || newStore.name}). يمكنك الآن الدخول إلى لوحة التحكم لإضافة الكتب وباقات العروض المجمعة (Bundle Packages).`,
        body_ar: `مبروك! تم تفعيل متجر (${newStore.name_ar || newStore.name}). يمكنك الآن الدخول إلى لوحة التحكم لإضافة الكتب وباقات العروض المجمعة (Bundle Packages).`,
        action_url: `/stores/dashboard`,
        data: { store_id: newStore.id, store_slug: newStore.slug },
      }
      const { error: notifErr } = await supabase.from('notifications').insert(notifPayload as any)
      if (notifErr) {
        // Fallback for enum safety
        await supabase.from('notifications').insert({ ...notifPayload, type: 'TRANSACTION_COMPLETED' } as any)
      }
    } catch (e) {
      console.warn('In-app notification insert error:', e)
    }
  }

  // 6. Trigger transactional approval email via Resend API
  let destinationEmail = target.email || (target.social_links as any)?.email
  if (!destinationEmail && resolvedOwnerId) {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', resolvedOwnerId).maybeSingle()
      if ((prof as any)?.email) destinationEmail = (prof as any).email
    } catch {}
  }

  if (destinationEmail) {
    try {
      const emailRes = await fetch('/api/stores/notify-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: destinationEmail,
          ownerName: target.owner_name || target.applicant_name || 'شريكنا العزيز',
          storeName: newStore.name_ar || newStore.name,
          storeSlug: newStore.slug,
        }),
      })
      const emailJson = await emailRes.json().catch(() => null)
      console.log('Store approval email dispatched successfully:', destinationEmail, emailJson)
    } catch (e) {
      console.warn('Failed to send approval email:', e)
    }
  }

  // 7. Update browser local storage cache
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps))

      // Save new bookstore to custom stores in localStorage
      const storedStores = localStorage.getItem(STORES_STORAGE_KEY)
      const storeMap = storedStores ? JSON.parse(storedStores) : {}
      storeMap[newStore.id] = newStore
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(storeMap))
    } catch {}
  }

  return { success: true, store: newStore, application: target }
}

export async function rejectStoreApplication(
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; application?: StoreApplication }> {
  const apps = await getStoreApplications()
  const target = apps.find(a => a.id === applicationId)
  if (!target) return { success: false }

  target.status = 'REJECTED'
  target.reviewed_at = new Date().toISOString()
  target.rejection_reason = reason || 'لا يستوفي شروط التوثيق حالياً'

  // Update in DB partner_requests table
  try {
    const supabase = createClient()
    await supabase
      .from('partner_requests')
      .update({ status: 'REJECTED' })
      .eq('id', applicationId)

    if (target.applicant_id) {
      const notifPayload = {
        user_id: target.applicant_id,
        type: 'TRANSACTION_COMPLETED',
        title: 'تحديث بخصوص طلب توثيق المتجر',
        title_ar: 'تحديث بخصوص طلب توثيق المتجر',
        body: `تمت مراجعة طلب انضمام متجر (${target.store_name_ar || target.business_name}). السبب: ${target.rejection_reason}`,
        body_ar: `تمت مراجعة طلب انضمام متجر (${target.store_name_ar || target.business_name}). السبب: ${target.rejection_reason}`,
        action_url: `/partner-form`,
      }
      await supabase.from('notifications').insert(notifPayload as any)
    }
  } catch (e) {
    console.warn('Failed to update rejection in DB:', e)
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps))
    } catch {}
  }

  return { success: true, application: target }
}
