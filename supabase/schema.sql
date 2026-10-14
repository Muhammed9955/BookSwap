-- ============================================================
-- BookSwap Egypt — Complete Database Schema
-- Supabase PostgreSQL
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "vector"; -- for future AI matching

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE listing_type AS ENUM ('SELL', 'SWAP', 'SELL_OR_SWAP', 'GIVEAWAY');
CREATE TYPE book_condition AS ENUM ('NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');
CREATE TYPE offer_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'CANCELLED');
CREATE TYPE swap_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');
CREATE TYPE report_status AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
CREATE TYPE report_type AS ENUM ('LISTING', 'USER', 'MESSAGE');
CREATE TYPE report_reason AS ENUM ('FAKE_LISTING', 'WRONG_CONDITION', 'SCAM', 'OFFENSIVE_CONTENT', 'DUPLICATE', 'PROHIBITED_CONTENT', 'OTHER');
CREATE TYPE notification_type AS ENUM (
  'WISHLIST_MATCH', 'SWAP_REQUEST', 'SWAP_ACCEPTED', 'SWAP_REJECTED',
  'NEW_OFFER', 'OFFER_ACCEPTED', 'NEW_MESSAGE', 'NEW_REVIEW',
  'BOOK_SOLD', 'BOOK_RESERVED', 'RECOMMENDED_BOOK', 'NEW_BOOK_NEARBY',
  'TRANSACTION_COMPLETED', 'FOLLOW'
);
CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE delivery_method AS ENUM ('IN_PERSON', 'COURIER');
CREATE TYPE payment_method AS ENUM ('CASH', 'ONLINE', 'WALLET');
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PENDING', 'PAID', 'REFUNDED', 'FAILED');
CREATE TYPE boost_package AS ENUM ('BASIC', 'PREMIUM');
CREATE TYPE badge_type AS ENUM (
  'BOOK_COLLECTOR', 'SWAP_MASTER', 'TRUSTED_READER',
  'ACTIVE_READER', 'GENEROUS_READER', 'COMMUNITY_BUILDER'
);
CREATE TYPE book_language AS ENUM ('ARABIC', 'ENGLISH', 'FRENCH', 'GERMAN', 'OTHER');
CREATE TYPE listing_status AS ENUM ('ACTIVE', 'RESERVED', 'SOLD', 'HIDDEN', 'DELETED');
CREATE TYPE transaction_type AS ENUM ('BUY', 'SWAP', 'GIVEAWAY');

-- ============================================================
-- LOCATIONS
-- ============================================================

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_id, slug)
);

-- ============================================================
-- CATEGORIES & GENRES
-- ============================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  description_ar TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS & PROFILES
-- ============================================================

-- Extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  full_name_ar TEXT,
  avatar_url TEXT,
  bio TEXT,
  bio_ar TEXT,
  role user_role DEFAULT 'USER',
  
  -- Location
  city_id UUID REFERENCES cities(id),
  area_id UUID REFERENCES areas(id),
  
  -- Preferences
  preferred_language TEXT DEFAULT 'ar' CHECK (preferred_language IN ('ar', 'en')),
  
  -- Trust indicators
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Stats (denormalized for performance)
  total_listings INT DEFAULT 0,
  total_swaps INT DEFAULT 0,
  total_sales INT DEFAULT 0,
  total_donations INT DEFAULT 0,
  total_transactions INT DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Contact
  whatsapp_number TEXT,
  show_whatsapp BOOLEAN DEFAULT FALSE,
  
  -- Account
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspended_until TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INT DEFAULT 0,
  
  -- Referral
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profile_genres (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, category_id)
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, badge_type)
);

-- ============================================================
-- BOOKS (Global Book Records)
-- ============================================================

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Core
  title TEXT NOT NULL,
  title_ar TEXT,
  author TEXT NOT NULL,
  author_ar TEXT,
  isbn TEXT,
  isbn_13 TEXT,
  publisher TEXT,
  publisher_ar TEXT,
  published_year INT,
  edition TEXT,
  
  -- Classification
  category_id UUID REFERENCES categories(id),
  language book_language DEFAULT 'ARABIC',
  
  -- Metadata
  description TEXT,
  description_ar TEXT,
  cover_image_url TEXT,
  page_count INT,
  
  -- Aggregated stats
  listing_count INT DEFAULT 0,
  wishlist_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  
  -- Full-text search
  search_vector TSVECTOR,
  
  -- Admin
  is_verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX books_isbn_idx ON books(isbn);
CREATE INDEX books_isbn_13_idx ON books(isbn_13);
CREATE INDEX books_search_idx ON books USING GIN(search_vector);
CREATE INDEX books_category_idx ON books(category_id);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_books_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    to_tsvector('simple', unaccent(COALESCE(NEW.title, ''))) ||
    to_tsvector('simple', unaccent(COALESCE(NEW.title_ar, ''))) ||
    to_tsvector('simple', unaccent(COALESCE(NEW.author, ''))) ||
    to_tsvector('simple', unaccent(COALESCE(NEW.author_ar, ''))) ||
    to_tsvector('simple', unaccent(COALESCE(NEW.isbn, ''))) ||
    to_tsvector('simple', unaccent(COALESCE(NEW.description, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER books_search_vector_trigger
  BEFORE INSERT OR UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_books_search_vector();

-- ============================================================
-- BOOK LISTINGS
-- ============================================================

CREATE TABLE book_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Listing details
  listing_type listing_type NOT NULL,
  condition book_condition NOT NULL,
  price DECIMAL(10,2),
  is_negotiable BOOLEAN DEFAULT FALSE,
  
  -- Location
  city_id UUID REFERENCES cities(id),
  area_id UUID REFERENCES areas(id),
  
  -- Description
  description TEXT,
  
  -- Status
  status listing_status DEFAULT 'ACTIVE',
  
  -- Stats
  view_count INT DEFAULT 0,
  wishlist_count INT DEFAULT 0,
  
  -- Featured
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMPTZ,
  
  -- Admin
  is_verified BOOLEAN DEFAULT FALSE,
  admin_note TEXT,
  
  -- Full-text search
  search_vector TSVECTOR,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX listings_seller_idx ON book_listings(seller_id);
CREATE INDEX listings_book_idx ON book_listings(book_id);
CREATE INDEX listings_status_idx ON book_listings(status);
CREATE INDEX listings_type_idx ON book_listings(listing_type);
CREATE INDEX listings_city_idx ON book_listings(city_id);
CREATE INDEX listings_area_idx ON book_listings(area_id);
CREATE INDEX listings_featured_idx ON book_listings(is_featured, featured_until);
CREATE INDEX listings_created_idx ON book_listings(created_at DESC);

CREATE TABLE book_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES book_listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX images_listing_idx ON book_images(listing_id);

-- ============================================================
-- WISHLIST
-- ============================================================

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  
  -- If book not in DB yet
  custom_title TEXT,
  custom_author TEXT,
  
  -- Preferences
  max_price DECIMAL(10,2),
  preferred_condition book_condition,
  prefer_swap BOOLEAN DEFAULT FALSE,
  prefer_buy BOOLEAN DEFAULT TRUE,
  
  -- Notifications
  notify_on_match BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX wishlist_user_idx ON wishlist_items(user_id);
CREATE INDEX wishlist_book_idx ON wishlist_items(book_id);

-- ============================================================
-- SWAP REQUESTS
-- ============================================================

CREATE TABLE swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES book_listings(id) ON DELETE CASCADE,
  offered_listing_id UUID REFERENCES book_listings(id),
  responder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status swap_status DEFAULT 'PENDING',
  message TEXT,
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX swap_requester_idx ON swap_requests(requester_id);
CREATE INDEX swap_listing_idx ON swap_requests(listing_id);
CREATE INDEX swap_status_idx ON swap_requests(status);

-- ============================================================
-- OFFERS (Price Negotiation)
-- ============================================================

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES book_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  status offer_status DEFAULT 'PENDING',
  counter_amount DECIMAL(10,2),
  counter_message TEXT,
  transaction_id UUID,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX offers_listing_idx ON offers(listing_id);
CREATE INDEX offers_buyer_idx ON offers(buyer_id);
CREATE INDEX offers_status_idx ON offers(status);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  transaction_type transaction_type NOT NULL,
  status transaction_status DEFAULT 'PENDING',
  
  -- Parties
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Books
  listing_id UUID REFERENCES book_listings(id),
  swap_listing_id UUID REFERENCES book_listings(id),
  
  -- Financials
  price DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  
  -- Delivery
  delivery_method delivery_method,
  
  -- Payment
  payment_method payment_method DEFAULT 'CASH',
  payment_status payment_status DEFAULT 'UNPAID',
  
  -- Notes
  buyer_note TEXT,
  seller_note TEXT,
  admin_note TEXT,
  
  -- Rating reminders
  buyer_rated BOOLEAN DEFAULT FALSE,
  seller_rated BOOLEAN DEFAULT FALSE,
  
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX transactions_buyer_idx ON transactions(buyer_id);
CREATE INDEX transactions_seller_idx ON transactions(seller_id);
CREATE INDEX transactions_status_idx ON transactions(status);
CREATE INDEX transactions_created_idx ON transactions(created_at DESC);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Related context
  listing_id UUID REFERENCES book_listings(id),
  transaction_id UUID REFERENCES transactions(id),
  
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  
  -- Unread counts
  unread_1 INT DEFAULT 0,
  unread_2 INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(participant_1, participant_2),
  CHECK(participant_1 < participant_2)
);

CREATE INDEX conversations_p1_idx ON conversations(participant_1);
CREATE INDEX conversations_p2_idx ON conversations(participant_2);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  -- Rich message types
  message_type TEXT DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'BOOK_CARD', 'OFFER_CARD', 'SWAP_CARD', 'TRANSACTION_CARD')),
  metadata JSONB,
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Moderation
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_conversation_idx ON messages(conversation_id, created_at DESC);
CREATE INDEX messages_sender_idx ON messages(sender_id);
CREATE INDEX messages_unread_idx ON messages(conversation_id, is_read) WHERE NOT is_read;

-- ============================================================
-- RATINGS
-- ============================================================

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Overall
  overall INT NOT NULL CHECK (overall BETWEEN 1 AND 5),
  
  -- Sub-ratings
  communication INT CHECK (communication BETWEEN 1 AND 5),
  book_condition INT CHECK (book_condition BETWEEN 1 AND 5),
  meeting_delivery INT CHECK (meeting_delivery BETWEEN 1 AND 5),
  reliability INT CHECK (reliability BETWEEN 1 AND 5),
  
  review TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(transaction_id, rater_id)
);

CREATE INDEX ratings_rated_idx ON ratings(rated_id);
CREATE INDEX ratings_rater_idx ON ratings(rater_id);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,
  report_reason report_reason NOT NULL,
  
  -- What is being reported
  listing_id UUID REFERENCES book_listings(id),
  reported_user_id UUID REFERENCES profiles(id),
  message_id UUID REFERENCES messages(id),
  
  description TEXT,
  status report_status DEFAULT 'PENDING',
  
  -- Admin resolution
  resolved_by UUID REFERENCES profiles(id),
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_reporter_idx ON reports(reporter_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  
  title TEXT NOT NULL,
  title_ar TEXT,
  body TEXT,
  body_ar TEXT,
  
  -- Context data
  data JSONB,
  
  -- Links
  action_url TEXT,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications(user_id, is_read) WHERE NOT is_read;

-- ============================================================
-- FOLLOWS
-- ============================================================

CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE INDEX follows_follower_idx ON follows(follower_id);
CREATE INDEX follows_following_idx ON follows(following_id);

-- ============================================================
-- BLOCKS
-- ============================================================

CREATE TABLE blocks (
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ============================================================
-- COMMUNITIES
-- ============================================================

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  
  cover_image_url TEXT,
  avatar_url TEXT,
  
  city_id UUID REFERENCES cities(id),
  
  admin_id UUID NOT NULL REFERENCES profiles(id),
  
  member_count INT DEFAULT 0,
  is_private BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MODERATOR', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS (Book Clubs)
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id),
  
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  
  event_type TEXT DEFAULT 'MEETUP' CHECK (event_type IN ('MEETUP', 'DISCUSSION', 'CHALLENGE', 'EXCHANGE')),
  
  location_text TEXT,
  city_id UUID REFERENCES cities(id),
  area_id UUID REFERENCES areas(id),
  
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  capacity INT,
  
  attendee_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FEATURED LISTINGS
-- ============================================================

CREATE TABLE featured_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES book_listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  package boost_package NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  payment_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOST PACKAGES CONFIG (Admin-configurable pricing)
-- ============================================================

CREATE TABLE boost_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_hours INT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFERRALS
-- ============================================================

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'REWARDED')),
  
  -- Reward tracking
  reward_type TEXT,
  reward_value DECIMAL(10,2),
  reward_granted_at TIMESTAMPTZ,
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(referred_id)
);

-- ============================================================
-- SUBSCRIPTIONS (Future Premium)
-- ============================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAUSED')),
  price DECIMAL(10,2),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  method payment_method DEFAULT 'CASH',
  status payment_status DEFAULT 'PENDING',
  
  -- Reference
  reference_type TEXT,
  reference_id UUID,
  
  -- Gateway
  gateway TEXT,
  gateway_ref TEXT,
  gateway_response JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  event_name TEXT NOT NULL,
  properties JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX analytics_event_name_idx ON analytics_events(event_name);
CREATE INDEX analytics_user_idx ON analytics_events(user_id);
CREATE INDEX analytics_created_idx ON analytics_events(created_at DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
  user_full_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Generate unique referral code
  new_referral_code := 'BOOK-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6));
  
  -- Extract name and avatar if present in raw_user_meta_data
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  user_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '');

  INSERT INTO profiles (id, full_name, avatar_url, email_verified, referral_code, preferred_language)
  VALUES (
    NEW.id,
    NULLIF(user_full_name, ''),
    NULLIF(user_avatar, ''),
    NEW.email_confirmed_at IS NOT NULL,
    new_referral_code,
    'ar'
  )
  ON CONFLICT (id) DO UPDATE SET
    email_verified = EXCLUDED.email_verified,
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update profile stats after rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    rating_average = (
      SELECT AVG(overall)::DECIMAL(3,2)
      FROM ratings
      WHERE rated_id = NEW.rated_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE rated_id = NEW.rated_id
    )
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_rating_created ON ratings;
CREATE TRIGGER on_rating_created
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- Update book listing count
CREATE OR REPLACE FUNCTION update_book_listing_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE books SET listing_count = listing_count + 1 WHERE id = NEW.book_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE books SET listing_count = GREATEST(listing_count - 1, 0) WHERE id = OLD.book_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_listing_change ON book_listings;
CREATE TRIGGER on_listing_change
  AFTER INSERT OR DELETE ON book_listings
  FOR EACH ROW EXECUTE FUNCTION update_book_listing_count();

-- Update wishlist count
CREATE OR REPLACE FUNCTION update_wishlist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.book_id IS NOT NULL THEN
    UPDATE books SET wishlist_count = wishlist_count + 1 WHERE id = NEW.book_id;
    UPDATE book_listings SET wishlist_count = wishlist_count + 1 
    WHERE book_id = NEW.book_id AND status = 'ACTIVE';
  ELSIF TG_OP = 'DELETE' AND OLD.book_id IS NOT NULL THEN
    UPDATE books SET wishlist_count = GREATEST(wishlist_count - 1, 0) WHERE id = OLD.book_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_wishlist_change ON wishlist_items;
CREATE TRIGGER on_wishlist_change
  AFTER INSERT OR DELETE ON wishlist_items
  FOR EACH ROW EXECUTE FUNCTION update_wishlist_count();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS listings_updated_at ON book_listings;
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON book_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS swap_requests_updated_at ON swap_requests;
CREATE TRIGGER swap_requests_updated_at BEFORE UPDATE ON swap_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS offers_updated_at ON offers;
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================

-- ============================================================
-- ADDITIONAL RPC FUNCTIONS & PROFILE STATS
-- ============================================================

-- RPC function to increment profile listings
CREATE OR REPLACE FUNCTION increment_profile_listings(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_listings = COALESCE(total_listings, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to sync total_listings on profiles automatically
CREATE OR REPLACE FUNCTION update_profile_listing_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET total_listings = COALESCE(total_listings, 0) + 1 WHERE id = NEW.seller_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET total_listings = GREATEST(COALESCE(total_listings, 0) - 1, 0) WHERE id = OLD.seller_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_listing_change ON book_listings;
CREATE TRIGGER on_profile_listing_change
  AFTER INSERT OR DELETE ON book_listings
  FOR EACH ROW EXECUTE FUNCTION update_profile_listing_count();
-- ============================================================

-- ============================================================
-- ROW LEVEL SECURITY (RLS) ENABLEMENT ON ALL 30 TABLES
-- ============================================================
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (Admin Check with Security Definer)
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Clean, idempotent with DROP POLICY IF EXISTS before CREATE POLICY
-- ============================================================
DROP POLICY IF EXISTS "cities_select_public" ON cities;
CREATE POLICY "cities_select_public" ON cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "cities_admin_all" ON cities;
CREATE POLICY "cities_admin_all" ON cities FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "areas_select_public" ON areas;
CREATE POLICY "areas_select_public" ON areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "areas_admin_all" ON areas;
CREATE POLICY "areas_admin_all" ON areas FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_admin_all" ON categories;
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "profile_genres_select" ON profile_genres;
CREATE POLICY "profile_genres_select" ON profile_genres FOR SELECT USING (true);

DROP POLICY IF EXISTS "profile_genres_manage_own" ON profile_genres;
CREATE POLICY "profile_genres_manage_own" ON profile_genres FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "user_badges_select_public" ON user_badges;
CREATE POLICY "user_badges_select_public" ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_badges_admin_all" ON user_badges;
CREATE POLICY "user_badges_admin_all" ON user_badges FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "books_select_all" ON books;
CREATE POLICY "books_select_all" ON books FOR SELECT USING (true);

DROP POLICY IF EXISTS "books_insert_authenticated" ON books;
CREATE POLICY "books_insert_authenticated" ON books FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "books_update_admin" ON books;
CREATE POLICY "books_update_admin" ON books FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "listings_select_active" ON book_listings;
CREATE POLICY "listings_select_active" ON book_listings FOR SELECT USING (status = 'ACTIVE' OR seller_id = auth.uid());

DROP POLICY IF EXISTS "listings_insert_own" ON book_listings;
CREATE POLICY "listings_insert_own" ON book_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_update_own" ON book_listings;
CREATE POLICY "listings_update_own" ON book_listings FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_delete_own" ON book_listings;
CREATE POLICY "listings_delete_own" ON book_listings FOR DELETE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "admin_manage_listings" ON book_listings;
CREATE POLICY "admin_manage_listings" ON book_listings FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "images_select_all" ON book_images;
CREATE POLICY "images_select_all" ON book_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "images_insert_own" ON book_images;
CREATE POLICY "images_insert_own" ON book_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM book_listings WHERE id = listing_id AND seller_id = auth.uid()));

DROP POLICY IF EXISTS "images_delete_own" ON book_images;
CREATE POLICY "images_delete_own" ON book_images FOR DELETE USING (EXISTS (SELECT 1 FROM book_listings WHERE id = listing_id AND seller_id = auth.uid()));

DROP POLICY IF EXISTS "wishlist_own" ON wishlist_items;
CREATE POLICY "wishlist_own" ON wishlist_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "swap_requests_involved" ON swap_requests;
CREATE POLICY "swap_requests_involved" ON swap_requests FOR SELECT USING (auth.uid() = requester_id OR (responder_id IS NOT NULL AND auth.uid() = responder_id) OR EXISTS (SELECT 1 FROM book_listings WHERE id = listing_id AND seller_id = auth.uid()));

DROP POLICY IF EXISTS "swap_requests_create" ON swap_requests;
CREATE POLICY "swap_requests_create" ON swap_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "swap_requests_update" ON swap_requests;
CREATE POLICY "swap_requests_update" ON swap_requests FOR UPDATE USING (auth.uid() = requester_id OR (responder_id IS NOT NULL AND auth.uid() = responder_id) OR EXISTS (SELECT 1 FROM book_listings WHERE id = listing_id AND seller_id = auth.uid()));

DROP POLICY IF EXISTS "offers_involved" ON offers;
CREATE POLICY "offers_involved" ON offers FOR SELECT USING (auth.uid() = buyer_id OR (seller_id IS NOT NULL AND auth.uid() = seller_id) OR EXISTS (SELECT 1 FROM book_listings WHERE id = listing_id AND seller_id = auth.uid()));

DROP POLICY IF EXISTS "offers_create" ON offers;
CREATE POLICY "offers_create" ON offers FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "offers_update" ON offers;
CREATE POLICY "offers_update" ON offers FOR UPDATE USING (auth.uid() = buyer_id OR (seller_id IS NOT NULL AND auth.uid() = seller_id) OR EXISTS (SELECT 1 FROM book_listings WHERE id = listing_id AND seller_id = auth.uid()));

DROP POLICY IF EXISTS "transactions_involved" ON transactions;
CREATE POLICY "transactions_involved" ON transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "transactions_create" ON transactions;
CREATE POLICY "transactions_create" ON transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "admin_read_transactions" ON transactions;
CREATE POLICY "admin_read_transactions" ON transactions FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "conversations_involved" ON conversations;
CREATE POLICY "conversations_involved" ON conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "conversations_create" ON conversations;
CREATE POLICY "conversations_create" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "messages_involved" ON messages;
CREATE POLICY "messages_involved" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid())));

DROP POLICY IF EXISTS "messages_send" ON messages;
CREATE POLICY "messages_send" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_own" ON messages;
CREATE POLICY "messages_update_own" ON messages FOR UPDATE USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "ratings_select_public" ON ratings;
CREATE POLICY "ratings_select_public" ON ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "ratings_create" ON ratings;
CREATE POLICY "ratings_create" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

DROP POLICY IF EXISTS "reports_create" ON reports;
CREATE POLICY "reports_create" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_own" ON reports;
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "admin_manage_reports" ON reports;
CREATE POLICY "admin_manage_reports" ON reports FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_manage_notifications" ON notifications;
CREATE POLICY "admin_manage_notifications" ON notifications FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "follows_select" ON follows;
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "follows_manage" ON follows;
CREATE POLICY "follows_manage" ON follows FOR ALL USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "blocks_own" ON blocks;
CREATE POLICY "blocks_own" ON blocks FOR ALL USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "communities_select_public" ON communities;
CREATE POLICY "communities_select_public" ON communities FOR SELECT USING (true);

DROP POLICY IF EXISTS "communities_insert_auth" ON communities;
CREATE POLICY "communities_insert_auth" ON communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "communities_update_creator" ON communities;
CREATE POLICY "communities_update_creator" ON communities FOR UPDATE USING (auth.uid() = admin_id OR is_admin());

DROP POLICY IF EXISTS "communities_delete_creator" ON communities;
CREATE POLICY "communities_delete_creator" ON communities FOR DELETE USING (auth.uid() = admin_id OR is_admin());

DROP POLICY IF EXISTS "community_members_select" ON community_members;
CREATE POLICY "community_members_select" ON community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_members_manage" ON community_members;
CREATE POLICY "community_members_manage" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_members_delete" ON community_members;
CREATE POLICY "community_members_delete" ON community_members FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_posts_select" ON community_posts;
CREATE POLICY "community_posts_select" ON community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_posts_create" ON community_posts;
CREATE POLICY "community_posts_create" ON community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "community_posts_update" ON community_posts;
CREATE POLICY "community_posts_update" ON community_posts FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "events_select_public" ON events;
CREATE POLICY "events_select_public" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert_auth" ON events;
CREATE POLICY "events_insert_auth" ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "events_update_creator" ON events;
CREATE POLICY "events_update_creator" ON events FOR UPDATE USING (auth.uid() = organizer_id OR is_admin());

DROP POLICY IF EXISTS "events_delete_creator" ON events;
CREATE POLICY "events_delete_creator" ON events FOR DELETE USING (auth.uid() = organizer_id OR is_admin());

DROP POLICY IF EXISTS "featured_listings_select" ON featured_listings;
CREATE POLICY "featured_listings_select" ON featured_listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "featured_listings_own" ON featured_listings;
CREATE POLICY "featured_listings_own" ON featured_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "boost_packages_select_public" ON boost_packages;
CREATE POLICY "boost_packages_select_public" ON boost_packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "boost_packages_admin_all" ON boost_packages;
CREATE POLICY "boost_packages_admin_all" ON boost_packages FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "referrals_own" ON referrals;
CREATE POLICY "referrals_own" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "referrals_create" ON referrals;
CREATE POLICY "referrals_create" ON referrals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "subscriptions_own" ON subscriptions;
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_update_admin" ON payments;
CREATE POLICY "payments_update_admin" ON payments FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "analytics_insert" ON analytics_events;
CREATE POLICY "analytics_insert" ON analytics_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_select_own" ON analytics_events;
CREATE POLICY "analytics_select_own" ON analytics_events FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS & POLICIES
-- Supports book-images, book-covers, avatars, and chat-attachments
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('book-images', 'book-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('book-covers', 'book-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('chat-attachments', 'chat-attachments', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Public view book images
DROP POLICY IF EXISTS "Public can view book images" ON storage.objects;
CREATE POLICY "Public can view book images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('book-images', 'book-covers'));

-- Authenticated upload book images
DROP POLICY IF EXISTS "Authenticated can upload book images" ON storage.objects;
CREATE POLICY "Authenticated can upload book images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('book-images', 'book-covers') AND auth.role() = 'authenticated');

-- Owner update book images
DROP POLICY IF EXISTS "Users can update own book images" ON storage.objects;
CREATE POLICY "Users can update own book images" ON storage.objects
  FOR UPDATE USING (bucket_id IN ('book-images', 'book-covers') AND auth.uid()::text = (storage.foldername(name))[1]);

-- Owner delete book images
DROP POLICY IF EXISTS "Users can delete own book images" ON storage.objects;
CREATE POLICY "Users can delete own book images" ON storage.objects
  FOR DELETE USING (bucket_id IN ('book-images', 'book-covers') AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public view avatars
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated upload avatars
DROP POLICY IF EXISTS "Authenticated can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Owner update avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Owner delete avatar
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Chat attachments view
DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;
CREATE POLICY "Users can view chat attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

-- Chat attachments upload
DROP POLICY IF EXISTS "Authenticated can upload chat attachments" ON storage.objects;
CREATE POLICY "Authenticated can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

-- SEED DATA — LOCATIONS
-- ============================================================

INSERT INTO cities (id, name_ar, name_en, slug, is_active, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'الإسكندرية', 'Alexandria', 'alexandria', true, 1),
  ('10000000-0000-0000-0000-000000000002', 'القاهرة', 'Cairo', 'cairo', true, 2),
  ('10000000-0000-0000-0000-000000000003', 'الجيزة', 'Giza', 'giza', true, 3),
  ('10000000-0000-0000-0000-000000000004', 'المنصورة', 'Mansoura', 'mansoura', true, 4),
  ('10000000-0000-0000-0000-000000000005', 'طنطا', 'Tanta', 'tanta', true, 5);

INSERT INTO areas (city_id, name_ar, name_en, slug, latitude, longitude, sort_order) VALUES
  -- Alexandria
  ('10000000-0000-0000-0000-000000000001', 'سموحة', 'Smouha', 'smouha', 31.2060, 29.9580, 1),
  ('10000000-0000-0000-0000-000000000001', 'سيدي جابر', 'Sidi Gaber', 'sidi-gaber', 31.2190, 29.9470, 2),
  ('10000000-0000-0000-0000-000000000001', 'روشدي', 'Roushdy', 'roushdy', 31.2300, 29.9570, 3),
  ('10000000-0000-0000-0000-000000000001', 'سبورتنج', 'Sporting', 'sporting', 31.2220, 29.9390, 4),
  ('10000000-0000-0000-0000-000000000001', 'ستانلي', 'Stanley', 'stanley', 31.2380, 29.9670, 5),
  ('10000000-0000-0000-0000-000000000001', 'ميامي', 'Miami', 'miami', 31.2520, 29.9790, 6),
  ('10000000-0000-0000-0000-000000000001', 'المندرة', 'Mandara', 'mandara', 31.2820, 30.0090, 7),
  ('10000000-0000-0000-0000-000000000001', 'المعمورة', 'Maamoura', 'maamoura', 31.3100, 30.0340, 8),
  ('10000000-0000-0000-0000-000000000001', 'لوران', 'Laurent', 'laurent', 31.2280, 29.9540, 9),
  ('10000000-0000-0000-0000-000000000001', 'ساحل', 'Sahel', 'sahel', 31.2000, 29.9300, 10),
  ('10000000-0000-0000-0000-000000000001', 'الجمرك', 'Gomrok', 'gomrok', 31.1990, 29.8920, 11),
  ('10000000-0000-0000-0000-000000000001', 'الدخيلة', 'Dekhela', 'dekhela', 31.1490, 29.8100, 12),
  ('10000000-0000-0000-0000-000000000001', 'العجمي', 'Agami', 'agami', 31.0800, 29.7250, 13),
  ('10000000-0000-0000-0000-000000000001', 'المحطة', 'Mahattet El Raml', 'mahattet-el-raml', 31.2010, 29.9080, 14),
  ('10000000-0000-0000-0000-000000000001', 'كامب شيزار', 'Camp Caesar', 'camp-caesar', 31.2190, 29.9360, 15);

-- ============================================================
-- SEED DATA — CATEGORIES
-- ============================================================

INSERT INTO categories (name_ar, name_en, slug, icon, color, sort_order) VALUES
  ('روايات', 'Fiction', 'fiction', '📚', '#6366F1', 1),
  ('تطوير الذات', 'Self Development', 'self-development', '🌱', '#10B981', 2),
  ('أعمال وريادة', 'Business', 'business', '💼', '#F59E0B', 3),
  ('علم النفس', 'Psychology', 'psychology', '🧠', '#8B5CF6', 4),
  ('برمجة وتقنية', 'Programming', 'programming', '💻', '#3B82F6', 5),
  ('تاريخ', 'History', 'history', '🏛️', '#92400E', 6),
  ('علوم', 'Science', 'science', '🔬', '#06B6D4', 7),
  ('أطفال', 'Children', 'children', '🎨', '#EC4899', 8),
  ('أكاديمي', 'Academic', 'academic', '🎓', '#64748B', 9),
  ('لغات', 'Language', 'language', '🌍', '#0EA5E9', 10),
  ('كوميكس ومانجا', 'Comics & Manga', 'comics', '🎭', '#F97316', 11),
  ('فلسفة', 'Philosophy', 'philosophy', '💭', '#7C3AED', 12),
  ('دين وروحانيات', 'Religion', 'religion', '☪️', '#D97706', 13),
  ('صحة ولياقة', 'Health & Fitness', 'health', '🏃', '#22C55E', 14),
  ('أخرى', 'Other', 'other', '📖', '#94A3B8', 15);

-- ============================================================
-- SEED DATA — BOOST PACKAGES
-- ============================================================

INSERT INTO boost_packages (slug, name, name_ar, price, duration_hours, description, sort_order) VALUES
  ('basic', 'Basic Boost', 'بوست أساسي', 30.00, 48, '48 hours featured placement', 1),
  ('premium', 'Premium Boost', 'بوست مميز', 60.00, 168, '7 days featured placement', 2);