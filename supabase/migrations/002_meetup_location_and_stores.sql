-- ============================================================
-- Migration 002: Meetup Location in Requests + Store Events & Offers
-- BookSwap Egypt
-- ============================================================

-- ============================================================
-- FEATURE 1: Location details embedded in the request itself
-- Instead of just chatting, buyer/swapper proposes WHERE + WHEN
-- upfront in the offer/swap request form.
-- ============================================================

-- Add meetup proposal fields to OFFERS (Buy requests)
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS proposed_meetup_location  TEXT,          -- free text e.g. "Cilantro, Maadi"
  ADD COLUMN IF NOT EXISTS proposed_meetup_area_id   UUID REFERENCES areas(id),
  ADD COLUMN IF NOT EXISTS proposed_meetup_lat       DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS proposed_meetup_lng       DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS proposed_times            JSONB DEFAULT '[]', -- [{label:"Friday 3pm", iso:"2026-10-10T15:00"}]
  ADD COLUMN IF NOT EXISTS preferred_delivery        TEXT DEFAULT 'MEETUP'
    CHECK (preferred_delivery IN ('MEETUP', 'COMMUNITY_HUB', 'COURIER')),
  ADD COLUMN IF NOT EXISTS proposed_hub_id           UUID REFERENCES communities(id); -- if COMMUNITY_HUB chosen

-- Seller can accept or counter the location too
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS agreed_meetup_location    TEXT,
  ADD COLUMN IF NOT EXISTS agreed_meetup_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreed_hub_id             UUID REFERENCES communities(id);

-- Add meetup proposal fields to SWAP REQUESTS
ALTER TABLE swap_requests
  ADD COLUMN IF NOT EXISTS proposed_meetup_location  TEXT,
  ADD COLUMN IF NOT EXISTS proposed_meetup_area_id   UUID REFERENCES areas(id),
  ADD COLUMN IF NOT EXISTS proposed_meetup_lat       DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS proposed_meetup_lng       DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS proposed_times            JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS preferred_delivery        TEXT DEFAULT 'MEETUP'
    CHECK (preferred_delivery IN ('MEETUP', 'COMMUNITY_HUB', 'COURIER')),
  ADD COLUMN IF NOT EXISTS proposed_hub_id           UUID REFERENCES communities(id),
  -- Agreed-upon meetup (set when swap is accepted)
  ADD COLUMN IF NOT EXISTS agreed_meetup_location    TEXT,
  ADD COLUMN IF NOT EXISTS agreed_meetup_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreed_hub_id             UUID REFERENCES communities(id);

-- Add confirmed meetup details to TRANSACTIONS (the source of truth once deal is active)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS meetup_location           TEXT,          -- agreed final location
  ADD COLUMN IF NOT EXISTS meetup_area_id            UUID REFERENCES areas(id),
  ADD COLUMN IF NOT EXISTS meetup_lat                DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS meetup_lng                DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS meetup_at                 TIMESTAMPTZ,   -- agreed time
  ADD COLUMN IF NOT EXISTS hub_id                    UUID REFERENCES communities(id),
  -- OTP-based handover verification
  ADD COLUMN IF NOT EXISTS handover_otp_hash         TEXT,
  ADD COLUMN IF NOT EXISTS handover_confirmed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_otp_hash           TEXT,          -- for BORROW only
  ADD COLUMN IF NOT EXISTS return_confirmed_at       TIMESTAMPTZ,
  -- Borrow-specific
  ADD COLUMN IF NOT EXISTS borrow_due_date           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS borrow_returned_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deposit_amount            DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS deposit_status            TEXT DEFAULT 'N/A'
    CHECK (deposit_status IN ('N/A', 'HELD', 'REFUNDED', 'FORFEITED'));

-- ============================================================
-- FEATURE 2: Bookstores — Events & Offers
-- ============================================================

-- Bookstores table (the B2C layer)
CREATE TABLE IF NOT EXISTS bookstores (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name             TEXT NOT NULL,
  name_ar          TEXT,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  description_ar   TEXT,

  -- Type
  store_type       TEXT NOT NULL DEFAULT 'OFFLINE'
    CHECK (store_type IN ('OFFLINE', 'ONLINE', 'BOTH')),

  -- Physical info
  address          TEXT,
  city_id          UUID REFERENCES cities(id),
  area_id          UUID REFERENCES areas(id),
  latitude         DECIMAL(10,8),
  longitude        DECIMAL(11,8),
  opening_hours    JSONB,   -- { mon:"9am-9pm", fri:"closed", ... }

  -- Online info
  website_url      TEXT,
  social_links     JSONB,   -- { instagram:"...", facebook:"...", whatsapp:"..." }

  -- Branding
  logo_url         TEXT,
  cover_url        TEXT,

  -- Verification & Trust
  is_verified      BOOLEAN DEFAULT FALSE,
  verified_at      TIMESTAMPTZ,
  commission_rate  DECIMAL(5,2) DEFAULT 5.00,

  -- Stats (denormalized)
  total_listings   INT DEFAULT 0,
  total_sales      INT DEFAULT 0,
  total_events     INT DEFAULT 0,
  rating_average   DECIMAL(3,2) DEFAULT 0,
  rating_count     INT DEFAULT 0,
  follower_count   INT DEFAULT 0,

  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stores_city_idx  ON bookstores(city_id);
CREATE INDEX IF NOT EXISTS stores_owner_idx ON bookstores(owner_id);
CREATE INDEX IF NOT EXISTS stores_slug_idx  ON bookstores(slug);

-- Store followers
CREATE TABLE IF NOT EXISTS store_follows (
  store_id   UUID NOT NULL REFERENCES bookstores(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (store_id, user_id)
);

-- ============================================================
-- Store Offers / Promotions
-- Time-limited deals, flash sales, seasonal promos
-- Think: "Eid Sale 20% off all children's books"
-- ============================================================
CREATE TABLE IF NOT EXISTS store_offers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID NOT NULL REFERENCES bookstores(id) ON DELETE CASCADE,

  title            TEXT NOT NULL,
  title_ar         TEXT,
  description      TEXT,
  description_ar   TEXT,

  -- Offer mechanics
  offer_type       TEXT NOT NULL DEFAULT 'DISCOUNT'
    CHECK (offer_type IN (
      'DISCOUNT',        -- % or flat off
      'BUNDLE',          -- buy N get M
      'FLASH_SALE',      -- limited time deep discount
      'GIFT_WITH_BUY',   -- buy book X get item Y free
      'SEASONAL',        -- Eid, summer, back-to-school
      'CLEARANCE'        -- bulk sale
    )),

  -- Discount details
  discount_pct     DECIMAL(5,2),    -- e.g. 20 = 20% off
  discount_flat    DECIMAL(10,2),   -- e.g. 50 EGP off
  min_order_amount DECIMAL(10,2),   -- minimum spend to qualify

  -- Bundle details (e.g. buy 10 get 2 free)
  bundle_buy_qty   INT,
  bundle_free_qty  INT,
  bundle_price     DECIMAL(10,2),   -- fixed bundle price

  -- Gift with purchase
  gift_description TEXT,            -- "Free bookmark + reading journal"

  -- Validity
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  stock_limit      INT,             -- null = unlimited redemptions
  redemption_count INT DEFAULT 0,

  -- Promo code (optional)
  promo_code       TEXT UNIQUE,

  -- Display
  cover_image_url  TEXT,
  is_featured      BOOLEAN DEFAULT FALSE,

  status           TEXT DEFAULT 'ACTIVE'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'SOLD_OUT')),

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS store_offers_store_idx  ON store_offers(store_id);
CREATE INDEX IF NOT EXISTS store_offers_status_idx ON store_offers(status);
CREATE INDEX IF NOT EXISTS store_offers_end_idx    ON store_offers(ends_at);

-- Books attached to a specific store offer (which books are discounted)
CREATE TABLE IF NOT EXISTS store_offer_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id     UUID NOT NULL REFERENCES store_offers(id) ON DELETE CASCADE,
  listing_id   UUID REFERENCES book_listings(id),  -- specific listing
  book_id      UUID REFERENCES books(id),           -- or whole book (all conditions)
  custom_title TEXT,                                -- or custom item not in catalog
  custom_author TEXT,
  condition    book_condition,
  sort_order   INT DEFAULT 0
);

-- ============================================================
-- Store Events
-- Extend existing events table to support store organizers
-- ============================================================
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS store_id      UUID REFERENCES bookstores(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_type_v2 TEXT DEFAULT 'MEETUP'
    CHECK (event_type_v2 IN (
      'MEETUP',          -- casual reader meetup
      'DISCUSSION',      -- book club discussion
      'CHALLENGE',       -- reading challenge
      'EXCHANGE',        -- book exchange event
      'SIGNING',         -- author signing event (store)
      'SALE',            -- in-store sale event (store)
      'WORKSHOP',        -- writing/reading workshop (store)
      'LAUNCH'           -- new book launch (store)
    )),
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS price           DECIMAL(10,2),  -- 0 = free
  ADD COLUMN IF NOT EXISTS is_free         BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS registration_url TEXT,          -- external link or internal RSVP
  ADD COLUMN IF NOT EXISTS latitude        DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude       DECIMAL(11,8);

-- Event RSVPs (who's attending)
CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'GOING' CHECK (status IN ('GOING', 'MAYBE', 'NOT_GOING')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- ============================================================
-- Extend notification types for new features
-- ============================================================
-- Add new notification types (only if they don't exist)
DO $$
BEGIN
  -- Check if type exists and add new values
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'notification_type'::regtype 
    AND enumlabel = 'STORE_NEW_OFFER'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'STORE_NEW_OFFER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'notification_type'::regtype 
    AND enumlabel = 'STORE_NEW_EVENT'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'STORE_NEW_EVENT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'notification_type'::regtype 
    AND enumlabel = 'MEETUP_REMINDER'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'MEETUP_REMINDER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'notification_type'::regtype 
    AND enumlabel = 'OFFER_LOCATION_UPDATED'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'OFFER_LOCATION_UPDATED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'notification_type'::regtype 
    AND enumlabel = 'EVENT_REMINDER'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'EVENT_REMINDER';
  END IF;
END$$;

-- ============================================================
-- Trigger: Auto-notify store followers when a new offer is posted
-- ============================================================
CREATE OR REPLACE FUNCTION notify_store_followers_on_offer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, title_ar, body, data, action_url)
  SELECT
    sf.user_id,
    'STORE_NEW_OFFER',
    (SELECT name FROM bookstores WHERE id = NEW.store_id) || ' has a new offer: ' || NEW.title,
    (SELECT name_ar FROM bookstores WHERE id = NEW.store_id) || ' لديه عرض جديد: ' || COALESCE(NEW.title_ar, NEW.title),
    NEW.description,
    jsonb_build_object(
      'store_id', NEW.store_id,
      'offer_id', NEW.id,
      'offer_type', NEW.offer_type
    ),
    '/stores/' || (SELECT slug FROM bookstores WHERE id = NEW.store_id) || '/offers/' || NEW.id
  FROM store_follows sf
  WHERE sf.store_id = NEW.store_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_store_offer_created ON store_offers;
CREATE TRIGGER on_store_offer_created
  AFTER INSERT ON store_offers
  FOR EACH ROW
  WHEN (NEW.status = 'ACTIVE')
  EXECUTE FUNCTION notify_store_followers_on_offer();

-- ============================================================
-- Trigger: Auto-notify store followers when a new event is posted
-- ============================================================
CREATE OR REPLACE FUNCTION notify_store_followers_on_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.store_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, title_ar, body, data, action_url)
    SELECT
      sf.user_id,
      'STORE_NEW_EVENT',
      (SELECT name FROM bookstores WHERE id = NEW.store_id) || ' is hosting: ' || NEW.title,
      (SELECT name_ar FROM bookstores WHERE id = NEW.store_id) || ' ينظم: ' || COALESCE(NEW.title_ar, NEW.title),
      NEW.description,
      jsonb_build_object(
        'store_id', NEW.store_id,
        'event_id', NEW.id,
        'event_type', NEW.event_type_v2,
        'starts_at', NEW.starts_at
      ),
      '/events/' || NEW.id
    FROM store_follows sf
    WHERE sf.store_id = NEW.store_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_store_event_created ON events;
CREATE TRIGGER on_store_event_created
  AFTER INSERT ON events
  FOR EACH ROW
  WHEN (NEW.store_id IS NOT NULL AND NEW.is_active = TRUE)
  EXECUTE FUNCTION notify_store_followers_on_event();

-- ============================================================
-- Trigger: Notify buyer/seller when meetup location is agreed
-- ============================================================
CREATE OR REPLACE FUNCTION notify_meetup_agreed()
RETURNS TRIGGER AS $$
BEGIN
  -- When agreed_meetup_at is set for the first time on a transaction
  IF OLD.meetup_at IS NULL AND NEW.meetup_at IS NOT NULL THEN
    -- Notify buyer
    INSERT INTO notifications (user_id, type, title, title_ar, body, data, action_url)
    VALUES (
      NEW.buyer_id,
      'MEETUP_REMINDER',
      'Meetup confirmed!',
      'تم تأكيد موعد الاستلام!',
      'Location: ' || COALESCE(NEW.meetup_location, 'See transaction details'),
      jsonb_build_object('transaction_id', NEW.id, 'meetup_at', NEW.meetup_at, 'location', NEW.meetup_location),
      '/transactions/' || NEW.id
    );
    -- Notify seller
    INSERT INTO notifications (user_id, type, title, title_ar, body, data, action_url)
    VALUES (
      NEW.seller_id,
      'MEETUP_REMINDER',
      'Meetup confirmed!',
      'تم تأكيد موعد التسليم!',
      'Location: ' || COALESCE(NEW.meetup_location, 'See transaction details'),
      jsonb_build_object('transaction_id', NEW.id, 'meetup_at', NEW.meetup_at, 'location', NEW.meetup_location),
      '/transactions/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_meetup_agreed ON transactions;
CREATE TRIGGER on_meetup_agreed
  AFTER UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION notify_meetup_agreed();

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS offers_area_idx          ON offers(proposed_meetup_area_id);
CREATE INDEX IF NOT EXISTS swap_req_area_idx         ON swap_requests(proposed_meetup_area_id);
CREATE INDEX IF NOT EXISTS transactions_meetup_idx   ON transactions(meetup_at);
CREATE INDEX IF NOT EXISTS transactions_hub_idx      ON transactions(hub_id);
CREATE INDEX IF NOT EXISTS events_store_idx          ON events(store_id);
CREATE INDEX IF NOT EXISTS event_rsvps_event_idx     ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS store_offer_items_offer   ON store_offer_items(offer_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — New Tables from Migration 002
-- ============================================================

-- ─────────────────────────────
-- bookstores
-- ─────────────────────────────
ALTER TABLE bookstores ENABLE ROW LEVEL SECURITY;

-- Anyone can view active bookstores (discovery/browse)
CREATE POLICY "bookstores_public_read"
  ON bookstores FOR SELECT
  USING (is_active = TRUE);

-- Admins & the store owner can see all (including inactive)
CREATE POLICY "bookstores_owner_read_all"
  ON bookstores FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Only authenticated users can create a store
CREATE POLICY "bookstores_authenticated_insert"
  ON bookstores FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Only the owner can update their store
CREATE POLICY "bookstores_owner_update"
  ON bookstores FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Only the owner can delete their store
CREATE POLICY "bookstores_owner_delete"
  ON bookstores FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ─────────────────────────────
-- store_follows
-- ─────────────────────────────
ALTER TABLE store_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see follower counts (join with bookstores)
CREATE POLICY "store_follows_public_read"
  ON store_follows FOR SELECT
  USING (TRUE);

-- Authenticated users can follow a store
CREATE POLICY "store_follows_authenticated_insert"
  ON store_follows FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can only unfollow themselves
CREATE POLICY "store_follows_own_delete"
  ON store_follows FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────
-- store_offers
-- ─────────────────────────────
ALTER TABLE store_offers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active/non-draft offers (public browse)
CREATE POLICY "store_offers_public_read"
  ON store_offers FOR SELECT
  USING (status IN ('ACTIVE', 'PAUSED', 'EXPIRED', 'SOLD_OUT'));

-- Store owners can see all their own offers (including DRAFT)
CREATE POLICY "store_offers_owner_read_all"
  ON store_offers FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM bookstores WHERE owner_id = auth.uid()
    )
  );

-- Only store owners can create offers for their own store
CREATE POLICY "store_offers_owner_insert"
  ON store_offers FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT id FROM bookstores WHERE owner_id = auth.uid()
    )
  );

-- Only store owners can update their own offers
CREATE POLICY "store_offers_owner_update"
  ON store_offers FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM bookstores WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM bookstores WHERE owner_id = auth.uid()
    )
  );

-- Only store owners can delete their own offers
CREATE POLICY "store_offers_owner_delete"
  ON store_offers FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM bookstores WHERE owner_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- store_offer_items
-- ─────────────────────────────
ALTER TABLE store_offer_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read offer items (they're part of the public offer)
CREATE POLICY "store_offer_items_public_read"
  ON store_offer_items FOR SELECT
  USING (TRUE);

-- Only store owners can manage items within their offers
CREATE POLICY "store_offer_items_owner_insert"
  ON store_offer_items FOR INSERT
  TO authenticated
  WITH CHECK (
    offer_id IN (
      SELECT so.id FROM store_offers so
      JOIN bookstores bs ON bs.id = so.store_id
      WHERE bs.owner_id = auth.uid()
    )
  );

CREATE POLICY "store_offer_items_owner_update"
  ON store_offer_items FOR UPDATE
  TO authenticated
  USING (
    offer_id IN (
      SELECT so.id FROM store_offers so
      JOIN bookstores bs ON bs.id = so.store_id
      WHERE bs.owner_id = auth.uid()
    )
  );

CREATE POLICY "store_offer_items_owner_delete"
  ON store_offer_items FOR DELETE
  TO authenticated
  USING (
    offer_id IN (
      SELECT so.id FROM store_offers so
      JOIN bookstores bs ON bs.id = so.store_id
      WHERE bs.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- event_rsvps
-- ─────────────────────────────
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Anyone can see who's attending (public events)
CREATE POLICY "event_rsvps_public_read"
  ON event_rsvps FOR SELECT
  USING (TRUE);

-- Authenticated users can RSVP to events
CREATE POLICY "event_rsvps_authenticated_insert"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update only their own RSVP
CREATE POLICY "event_rsvps_own_update"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can cancel only their own RSVP
CREATE POLICY "event_rsvps_own_delete"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
