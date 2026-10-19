// Store, Offers, and Events Types for BookSwap Egypt
import type { City, Area, BookCondition, Book } from './index'
export type { BookCondition }

export type StoreType = 'OFFLINE' | 'ONLINE' | 'BOTH'

export type OfferType =
  | 'DISCOUNT'        // % or flat off
  | 'BUNDLE'          // package like 10, 20, 25 books with fixed price & gift
  | 'FLASH_SALE'      // limited time flash deal
  | 'GIFT_WITH_BUY'   // buy book get gift free
  | 'SEASONAL'        // Ramadan, Eid, Back to School, Cairo Book Fair
  | 'CLEARANCE'       // bulk blowout sale

export type OfferStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'SOLD_OUT'

export type StoreEventType =
  | 'MEETUP'          // casual reader meetup
  | 'DISCUSSION'      // book club discussion
  | 'CHALLENGE'       // reading challenge
  | 'EXCHANGE'        // book swap / exchange gathering
  | 'SIGNING'         // author signing event (store)
  | 'SALE'            // in-store sale / fair (store)
  | 'WORKSHOP'        // writing or reading workshop (store)
  | 'LAUNCH'          // new book release launch (store)

export type RSVPStatus = 'GOING' | 'MAYBE' | 'NOT_GOING'

export interface Bookstore {
  id: string
  owner_id: string
  name: string
  name_ar?: string
  slug: string
  description?: string
  description_ar?: string
  store_type: StoreType
  address?: string
  city_id?: string
  area_id?: string
  latitude?: number
  longitude?: number
  opening_hours?: Record<string, string>
  website_url?: string
  social_links?: {
    facebook?: string
    instagram?: string
    whatsapp?: string
    tiktok?: string
  }
  logo_url?: string
  cover_url?: string
  is_verified: boolean
  verified_at?: string
  commission_rate?: number
  total_listings: number
  total_sales: number
  total_events: number
  rating_average: number
  rating_count: number
  follower_count: number
  is_active: boolean
  created_at: string
  updated_at?: string

  // Joined relations
  city?: City
  area?: Area
  is_following?: boolean
  offers_count?: number
}

export interface StoreOfferItem {
  id: string
  offer_id: string
  listing_id?: string
  book_id?: string
  custom_title?: string
  custom_author?: string
  condition?: BookCondition
  sort_order?: number
  book?: Book
}

export interface StoreOffer {
  id: string
  store_id: string
  title: string
  title_ar?: string
  description?: string
  description_ar?: string
  offer_type: OfferType
  discount_pct?: number
  discount_flat?: number
  min_order_amount?: number
  bundle_buy_qty?: number
  bundle_free_qty?: number
  bundle_price?: number
  gift_description?: string
  starts_at?: string
  ends_at?: string
  stock_limit?: number
  redemption_count?: number
  promo_code?: string
  cover_image_url?: string
  is_featured: boolean
  status: OfferStatus
  created_at: string
  updated_at?: string

  // Relations
  store?: Bookstore
  items?: StoreOfferItem[]
}

export interface StoreEvent {
  id: string
  store_id?: string
  community_id?: string
  title: string
  title_ar?: string
  description?: string
  description_ar?: string
  event_type: StoreEventType
  starts_at: string
  ends_at?: string
  location?: string
  address?: string
  latitude?: number
  longitude?: number
  is_free: boolean
  price?: number
  cover_image_url?: string
  registration_url?: string
  max_attendees?: number
  current_attendees: number
  is_active: boolean
  created_at: string

  // Relations
  store?: Bookstore
  user_rsvp?: RSVPStatus
}

export interface EventRSVP {
  event_id: string
  user_id: string
  status: RSVPStatus
  created_at: string
  profile?: {
    id: string
    full_name?: string
    full_name_ar?: string
    avatar_url?: string
  }
}

export interface StoreInventoryItem {
  id: string
  store_id: string
  title: string
  title_ar?: string
  author: string
  isbn?: string
  category_name?: string
  condition: BookCondition
  price: number
  original_price?: number
  stock_quantity: number
  cover_url?: string
  is_active: boolean
  created_at: string
}
