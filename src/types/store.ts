// Store, Offers, and Events Types for BookSwap Egypt
import type { City, Area, BookCondition, Book } from './index'
export type { BookCondition }

export type StoreType = 'OFFLINE' | 'ONLINE' | 'BOTH'

export type OfferType =
  | 'DISCOUNT'        // % or flat off
  | 'BUNDLE'          // package like 10, 20, 25 books with fixed price & gift
  | 'CURATED_PACK'    // 2 or 3 books package with picture, description & special price
  | 'FLASH_SALE'      // limited time flash deal
  | 'GIFT_WITH_BUY'   // buy book get gift free
  | 'SEASONAL'        // Ramadan, Eid, Back to School, Cairo Book Fair
  | 'CLEARANCE'       // bulk blowout sale
  | 'BUNDLE_TIER'     // mix & match tier: pick N books + gift books + bookmarks for fixed price
  | 'SERIES'          // complete book series (e.g. 6 parts) for a fixed price

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
  district?: string
  city_id?: string
  area_id?: string
  latitude?: number
  longitude?: number
  google_maps_url?: string
  slogan?: string
  shipping_scope?: string
  opening_hours?: Record<string, string>
  website_url?: string
  email?: string
  phone?: string
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
  // Fields for Curated Packs of 2, 3, 4, 5 Books
  book_count?: number
  genre?: string
  genre_ar?: string
  original_price?: number
  offer_price?: number
  included_books?: string[]
  badge_text?: string
  gift_description?: string
  // Mix & match tier extras (BUNDLE_TIER)
  bundle_bookmarks?: number
  // Series offers (SERIES)
  series_name?: string
  series_parts?: number
  template_id?: string
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

  // Host & Organizer Details
  host_name?: string
  host_phone?: string
  host_role?: string

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
  description?: string
  description_ar?: string
  publisher?: string
  published_year?: number
  pages_count?: number
  rating?: number
  rating_count?: number
  review_count?: number
  goodreads_url?: string
  has_discount?: boolean
  first_published?: string
  genres?: string[]
  author_details?: {
    name?: string
    bio?: string
    image_url?: string
  }
  reviews?: Array<{
    name: string
    text: string
    rating?: number
    date?: string
    verified?: boolean
  }>
  is_active: boolean
  created_at: string
}

export type StoreApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface StoreVerificationSignals {
  social_verified?: boolean
  whatsapp_business?: boolean
  sample_video_verified?: boolean
  national_id_or_cr?: boolean
}

export interface StoreApplication {
  id: string
  applicant_id?: string
  applicant_name: string
  owner_name?: string
  business_name: string
  store_name?: string
  store_name_ar?: string
  phone: string
  email?: string
  city: string
  address?: string
  store_type?: StoreType // 'OFFLINE' | 'ONLINE' | 'BOTH'
  is_online_only?: boolean
  website_url?: string
  social_links?: {
    facebook?: string
    instagram?: string
    whatsapp?: string
    tiktok?: string
  }
  district?: string
  latitude?: number
  longitude?: number
  working_hours?: string
  google_maps_url?: string
  logo_url?: string
  cover_url?: string
  slogan?: string
  shipping_scope?: string
  commercial_reg?: string
  monthly_book_estimate?: string
  bio?: string
  bio_ar?: string
  partner_type: 'BOOKSTORE' | 'EVENT_ORGANIZER' | 'BOTH'
  details?: string
  verification_signals?: StoreVerificationSignals
  contract_accepted?: boolean
  status: StoreApplicationStatus
  rejection_reason?: string
  created_at: string
  reviewed_at?: string
  approved_store_id?: string
}

export type BookGenreCategory =
  | 'NOVELS'
  | 'SELF_HELP'
  | 'RELIGIOUS'
  | 'PHILOSOPHY'
  | 'PSYCHOLOGY'
  | 'THRILLER'

export interface StoreCatalogBook {
  id: string
  title: string
  title_ar?: string
  author: string
  author_ar?: string
  category: BookGenreCategory
  category_name_ar: string
  price: number
  original_price?: number
  in_stock: boolean
  cover_url?: string
  cover_color?: string
  rating?: number
  rating_count?: number
  publisher?: string
  published_year?: number
  pages_count?: number
  goodreads_url?: string
  badge?: string
  condition?: BookCondition | string
  isbn?: string
  stock_quantity?: number
  description?: string
  description_ar?: string
  is_bundle?: boolean
  bundle_book_count?: number
  included_books?: string[]
  gift_description?: string
}

export interface StoreBundleTier {
  id: string
  name_ar: string
  required_books: number
  free_gift_books: number
  free_bookmarks: number
  price: number
  original_value: number
  popular?: boolean
}

export interface StoreOrderItem {
  book_id: string
  title: string
  book_title?: string
  title_ar?: string
  author?: string
  price: number
  quantity: number
  cover_url?: string
}

export interface StoreOrder {
  id: string
  order_number?: string
  store_id: string
  order_type: 'SINGLE_BOOK' | 'BUNDLE_PACKAGE' | 'CURATED_PACK' | 'SERIES'
  bundle_title?: string
  bundle_size?: number
  pack_title?: string
  pack_image_url?: string
  total_price: number
  customer_name: string
  customer_phone: string
  customer_city: string
  customer_address: string
  customer_notes?: string
  items: StoreOrderItem[]
  status: 'NEW' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'
  tracking_number?: string
  tracking_carrier?: string
  admin_notes?: string
  updated_at?: string
  created_at: string
}


