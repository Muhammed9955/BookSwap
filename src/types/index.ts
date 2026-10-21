// Core TypeScript types for BookSwap Egypt

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'
export type ListingType = 'SELL' | 'SWAP' | 'SELL_OR_SWAP' | 'GIVEAWAY'
export type BookCondition = 'NEW' | 'LIKE_NEW' | 'VERY_GOOD' | 'GOOD' | 'ACCEPTABLE'
export type TransactionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'CANCELLED'
export type SwapStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
export type ReportType = 'LISTING' | 'USER' | 'MESSAGE'
export type ReportReason = 'FAKE_LISTING' | 'WRONG_CONDITION' | 'SCAM' | 'OFFENSIVE_CONTENT' | 'DUPLICATE' | 'PROHIBITED_CONTENT' | 'OTHER'
export type NotificationType =
  | 'WISHLIST_MATCH' | 'SWAP_REQUEST' | 'SWAP_ACCEPTED' | 'SWAP_REJECTED'
  | 'NEW_OFFER' | 'OFFER_ACCEPTED' | 'NEW_MESSAGE' | 'NEW_REVIEW'
  | 'BOOK_SOLD' | 'BOOK_RESERVED' | 'RECOMMENDED_BOOK' | 'NEW_BOOK_NEARBY'
  | 'TRANSACTION_COMPLETED' | 'FOLLOW'
  | 'COMMUNITY_INTAKE_REQUEST' | 'COMMUNITY_HANDOVER_REQUEST'
  | 'COMMUNITY_BOOK_APPROVED' | 'COMMUNITY_BOOK_REJECTED'
export type DeliveryMethod = 'IN_PERSON' | 'COURIER'
export type PaymentMethod = 'CASH' | 'ONLINE' | 'WALLET'
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'
export type BoostPackage = 'BASIC' | 'PREMIUM'
export type BadgeType = 'BOOK_COLLECTOR' | 'SWAP_MASTER' | 'TRUSTED_READER' | 'ACTIVE_READER' | 'GENEROUS_READER' | 'COMMUNITY_BUILDER'
export type BookLanguage = 'ARABIC' | 'ENGLISH' | 'FRENCH' | 'GERMAN' | 'OTHER'
export type ListingStatus = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'HIDDEN' | 'DELETED'
export type TransactionType = 'BUY' | 'SWAP' | 'GIVEAWAY'
export type AppLanguage = 'ar' | 'en'

// ============================================================
// LOCATION
// ============================================================

export interface City {
  id: string
  name_ar: string
  name_en: string
  slug: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Area {
  id: string
  city_id: string
  name_ar: string
  name_en: string
  slug: string
  latitude?: number
  longitude?: number
  is_active: boolean
  sort_order: number
  created_at: string
  city?: City
}

// ============================================================
// CATEGORY
// ============================================================

export interface Category {
  id: string
  name_ar: string
  name_en: string
  slug: string
  icon?: string
  color?: string
  description_ar?: string
  description_en?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

// ============================================================
// PROFILE
// ============================================================

export interface Profile {
  id: string
  username?: string
  full_name?: string
  full_name_ar?: string
  avatar_url?: string
  bio?: string
  bio_ar?: string
  role: UserRole

  // Location
  city_id?: string
  area_id?: string
  city?: City
  area?: Area

  // Preferences
  preferred_language: AppLanguage

  // Trust
  email_verified: boolean
  phone_verified: boolean
  is_verified: boolean

  // Stats
  total_listings: number
  total_swaps: number
  total_sales: number
  total_donations: number
  total_transactions: number
  rating_average: number
  rating_count: number
  response_rate: number

  // Contact
  whatsapp_number?: string
  show_whatsapp: boolean

  // Account
  is_active: boolean
  is_suspended: boolean
  suspended_until?: string
  suspension_reason?: string

  // Onboarding
  onboarding_completed: boolean
  onboarding_step: number

  // Referral
  referral_code?: string
  referred_by?: string

  // Relations
  genres?: Category[]
  badges?: UserBadge[]

  created_at: string
  updated_at: string
}

export interface UserBadge {
  id: string
  profile_id: string
  badge_type: BadgeType
  earned_at: string
}

// ============================================================
// BOOK
// ============================================================

export interface Book {
  id: string
  title: string
  title_ar?: string
  author: string
  author_ar?: string
  isbn?: string
  isbn_13?: string
  publisher?: string
  publisher_ar?: string
  published_year?: number
  edition?: string
  category_id?: string
  language: BookLanguage
  description?: string
  description_ar?: string
  cover_image_url?: string
  page_count?: number

  // Stats
  listing_count: number
  wishlist_count: number
  view_count: number

  // Goodreads & Ratings
  rating_average?: number
  rating_count?: number
  goodreads_url?: string
  goodreads_rating?: number
  goodreads_ratings_count?: number

  // Relations
  category?: Category

  is_verified: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// ============================================================
// BOOK LISTING
// ============================================================

export interface BookListing {
  id: string
  book_id: string
  seller_id: string
  listing_type: ListingType
  condition: BookCondition
  price?: number
  is_negotiable: boolean
  city_id?: string
  area_id?: string
  description?: string
  status: ListingStatus
  view_count: number
  wishlist_count: number
  is_featured: boolean
  featured_until?: string
  is_verified: boolean
  admin_note?: string
  created_at: string
  updated_at: string

  // Relations
  book?: Book
  seller?: Profile
  city?: City
  area?: Area
  images?: BookImage[]
}

export interface BookImage {
  id: string
  listing_id: string
  url: string
  storage_path: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

// ============================================================
// WISHLIST
// ============================================================

export interface WishlistItem {
  id: string
  user_id: string
  book_id?: string
  custom_title?: string
  custom_author?: string
  max_price?: number
  preferred_condition?: BookCondition
  prefer_swap: boolean
  prefer_buy: boolean
  notify_on_match: boolean
  last_notified_at?: string
  created_at: string

  // Relations
  book?: Book
}

// ============================================================
// SWAP REQUEST
// ============================================================

export interface SwapRequest {
  id: string
  requester_id: string
  listing_id: string
  offered_listing_id?: string
  status: SwapStatus
  message?: string
  response_message?: string
  responded_at?: string
  transaction_id?: string
  created_at: string
  updated_at: string

  // Relations
  requester?: Profile
  listing?: BookListing
  offered_listing?: BookListing
}

// ============================================================
// OFFER
// ============================================================

export interface Offer {
  id: string
  listing_id: string
  buyer_id: string
  amount: number
  message?: string
  status: OfferStatus
  counter_amount?: number
  counter_message?: string
  transaction_id?: string
  responded_at?: string
  created_at: string
  updated_at: string

  // Relations
  listing?: BookListing
  buyer?: Profile
}

// ============================================================
// TRANSACTION
// ============================================================

export interface Transaction {
  id: string
  transaction_type: TransactionType
  status: TransactionStatus
  buyer_id?: string
  seller_id: string
  listing_id?: string
  swap_listing_id?: string
  price?: number
  platform_fee?: number
  delivery_method?: DeliveryMethod
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  buyer_note?: string
  seller_note?: string
  admin_note?: string
  buyer_rated: boolean
  seller_rated: boolean
  completed_at?: string
  cancelled_at?: string
  created_at: string
  updated_at: string

  // Relations
  buyer?: Profile
  seller?: Profile
  listing?: BookListing
  swap_listing?: BookListing
}

// ============================================================
// CONVERSATION & MESSAGES
// ============================================================

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  listing_id?: string
  transaction_id?: string
  last_message?: string
  last_message_at?: string
  unread_1: number
  unread_2: number
  created_at: string

  // Relations
  other_participant?: Profile
  listing?: BookListing
  unread_count?: number
}

export type MessageType = 'TEXT' | 'BOOK_CARD' | 'OFFER_CARD' | 'SWAP_CARD' | 'TRANSACTION_CARD'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: MessageType
  metadata?: Record<string, unknown>
  is_read: boolean
  read_at?: string
  is_deleted: boolean
  deleted_at?: string
  created_at: string

  // Relations
  sender?: Profile
}

// ============================================================
// RATING
// ============================================================

export interface Rating {
  id: string
  transaction_id: string
  rater_id: string
  rated_id: string
  overall: number
  communication?: number
  book_condition?: number
  meeting_delivery?: number
  reliability?: number
  review?: string
  created_at: string

  // Relations
  rater?: Profile
  rated?: Profile
}

// ============================================================
// REPORT
// ============================================================

export interface Report {
  id: string
  reporter_id: string
  report_type: ReportType
  report_reason: ReportReason
  listing_id?: string
  reported_user_id?: string
  message_id?: string
  description?: string
  status: ReportStatus
  resolved_by?: string
  resolution_note?: string
  resolved_at?: string
  created_at: string
}

// ============================================================
// NOTIFICATION
// ============================================================

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  title_ar?: string
  body?: string
  body_ar?: string
  data?: Record<string, unknown>
  action_url?: string
  is_read: boolean
  read_at?: string
  created_at: string
}

// ============================================================
// COMMUNITY & ORGANIZATIONS (SAFE HUBS & CLUBS)
// ============================================================

export type CommunityOrgType =
  | 'NEIGHBORHOOD'
  | 'UNIVERSITY'
  | 'CLUB'
  | 'COMPANY'
  | 'SCHOOL'
  | 'MOSQUE'
  | 'CHURCH'
  | 'OTHER'

export interface Community {
  id: string
  name: string
  name_ar?: string
  slug: string
  description?: string
  description_ar?: string

  // Branding
  cover_image_url?: string     // wide cover photo for the community header
  avatar_url?: string          // square avatar/icon (legacy, same as logo_url)
  logo_url?: string            // official community logo
  banner_url?: string          // wide banner (alternate to cover_image_url)

  // Location
  city_id?: string
  area_id?: string
  location_text?: string       // human-readable address e.g. "Maadi, Cairo"
  latitude?: number
  longitude?: number

  // Organization
  org_type?: CommunityOrgType
  admin_id: string

  // Membership counts
  member_count: number
  books_count?: number
  follower_count?: number
  events_count?: number
  posts_count?: number

  // Visibility
  is_private: boolean
  is_active: boolean
  is_featured?: boolean
  featured_until?: string
  verified_at?: string

  // Moderation
  suspended_at?: string
  suspension_reason?: string

  // Safe Meetup Hub / Designated Pickup Spot
  hub_name?: string
  hub_address?: string
  hub_lat?: number
  hub_lng?: number
  hub_instructions?: string
  hub_photo_url?: string

  // Contact & Social
  website_url?: string
  contact_email?: string
  contact_phone?: string
  social_links?: {
    instagram?: string
    facebook?: string
    whatsapp?: string
    telegram?: string
    twitter?: string
    tiktok?: string
  }

  // Governance
  requires_approval?: boolean
  age_restriction?: string
  languages?: string[]         // e.g. ['ar', 'en']
  tags?: string[]              // e.g. ['fiction', 'women-only', 'family-friendly']
  rules_ar?: string
  rules_en?: string

  // Timestamps
  created_at: string
  updated_at: string

  // Joined relations (from community_profile_view or explicit selects)
  is_member?: boolean
  membership_status?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED'
  city?: City
  area?: Area
  admin?: Profile
  city_name_ar?: string
  city_name_en?: string
  area_name_ar?: string
  area_name_en?: string
  admin_full_name?: string
  admin_avatar_url?: string
}

export interface CommunityMember {
  id?: string
  community_id: string
  user_id: string
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER'
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED'
  joined_at?: string
  created_at?: string
  profile?: Profile
}

export interface CommunityBook {
  id: string
  community_id: string
  listing_id: string
  added_by: string
  note?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approved_by?: string
  approved_at?: string
  admin_note?: string
  created_at: string
  listing?: BookListing
  added_by_profile?: Profile
}

export interface CommunityShelfBook {
  id: string
  listing_id: string
  listing_type: ListingType
  title: string
  author?: string
  cover_image_url: string
  owner_name?: string
  owner_id?: string
  owner_rating?: number
  price?: number | null
  listing_slug?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  added_by?: string
  added_by_name?: string
  borrow_fee?: number
  deposit?: number
  condition?: string
  community_id?: string
  note?: string
}

export interface CommunityPost {
  id: string
  community_id: string
  author_id: string
  content: string
  is_pinned: boolean
  like_count: number
  created_at: string
  author?: Profile
}

// ============================================================
// SEARCH
// ============================================================

export interface SearchFilters {
  query?: string
  category_id?: string
  city_id?: string
  area_id?: string
  listing_type?: ListingType[]
  condition?: BookCondition[]
  min_price?: number
  max_price?: number
  language?: BookLanguage[]
  seller_rating_min?: number
  sort_by?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'most_wished' | 'most_viewed'
}

// ============================================================
// MATCHING
// ============================================================

export interface MatchResult {
  listing: BookListing
  match_score: number
  match_reasons: MatchReason[]
}

export interface MatchReason {
  signal: string
  weight: number
  description_ar: string
  description_en: string
}

// ============================================================
// ADMIN ANALYTICS
// ============================================================

export interface DashboardStats {
  total_users: number
  active_users: number
  new_users_today: number
  total_listings: number
  active_listings: number
  new_listings_today: number
  total_transactions: number
  completed_transactions: number
  pending_reports: number
  featured_listings: number
  total_messages: number
  gmv: number
  // Active Users & Retention Metrics
  dau?: number
  wau?: number
  mau?: number
  new_users_week?: number
  new_users_month?: number
  retention_rate?: number
  stickiness_ratio?: number
}

// ============================================================
// FEATURED LISTING
// ============================================================

export interface FeaturedListing {
  id: string
  listing_id: string
  seller_id: string
  package: BoostPackage
  price_paid: number
  starts_at: string
  ends_at: string
  is_active: boolean
  payment_id?: string
  created_at: string

  listing?: BookListing
}

// ============================================================
// BOOST PACKAGE CONFIG
// ============================================================

export interface BoostPackageConfig {
  id: string
  slug: string
  name: string
  name_ar?: string
  price: number
  duration_hours: number
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

// ============================================================
// API RESPONSE
// ============================================================

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// ============================================================
// STORE & MARKETPLACE TYPES
// ============================================================
export * from './store'
