-- ============================================================
-- BookSwap — Migration 005: Community Full Profile
-- Adds: logo, cover, precise location (area + lat/lng + address),
--       org_type, hub details, social links, tags, contact info,
--       books_count, rules, website, storage bucket + RLS policies,
--       and community_follows table.
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS guards).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTEND communities TABLE — all profile fields
-- ─────────────────────────────────────────────────────────────

-- Branding
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS logo_url          TEXT,
  ADD COLUMN IF NOT EXISTS banner_url        TEXT;

-- Location (precise)
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS area_id           UUID REFERENCES areas(id),
  ADD COLUMN IF NOT EXISTS location_text     TEXT,
  ADD COLUMN IF NOT EXISTS latitude          DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude         DECIMAL(11,8);

-- Organization type
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS org_type          TEXT DEFAULT 'CLUB'
    CHECK (org_type IN ('NEIGHBORHOOD', 'UNIVERSITY', 'CLUB', 'COMPANY', 'SCHOOL', 'MOSQUE', 'CHURCH', 'OTHER'));

-- Safe Meetup Hub / Designated Pickup Spot
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS hub_name          TEXT,
  ADD COLUMN IF NOT EXISTS hub_address       TEXT,
  ADD COLUMN IF NOT EXISTS hub_lat           DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS hub_lng           DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS hub_instructions  TEXT,
  ADD COLUMN IF NOT EXISTS hub_photo_url     TEXT;

-- Online / Contact info
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS website_url       TEXT,
  ADD COLUMN IF NOT EXISTS contact_email     TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone     TEXT,
  ADD COLUMN IF NOT EXISTS social_links      JSONB DEFAULT '{}';

-- Membership & governance
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS age_restriction   TEXT,
  ADD COLUMN IF NOT EXISTS languages         TEXT[] DEFAULT ARRAY['ar'],
  ADD COLUMN IF NOT EXISTS tags              TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS rules_ar          TEXT,
  ADD COLUMN IF NOT EXISTS rules_en          TEXT;

-- Stats (denormalized)
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS books_count       INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follower_count    INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS events_count      INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts_count       INT NOT NULL DEFAULT 0;

-- Visibility & moderation
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_until    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Ensure updated_at exists
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────────────────────
-- 2. Resolve is_public vs is_private conflict from migration 004
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'communities'
      AND column_name  = 'is_public'
  ) THEN
    UPDATE communities SET is_private = NOT COALESCE(is_public, TRUE)
    WHERE is_private IS DISTINCT FROM NOT COALESCE(is_public, TRUE);
    ALTER TABLE communities DROP COLUMN IF EXISTS is_public;
  END IF;
END$$;

-- ─────────────────────────────────────────────────────────────
-- 3. community_follows table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_follows (
  community_id  UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_follows_user_idx ON community_follows(user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Enrich community_posts
-- ─────────────────────────────────────────────────────────────

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS post_type        TEXT DEFAULT 'DISCUSSION'
    CHECK (post_type IN ('DISCUSSION', 'ANNOUNCEMENT', 'BOOK_SHARE', 'EVENT', 'POLL')),
  ADD COLUMN IF NOT EXISTS image_urls       TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS book_listing_id  UUID REFERENCES book_listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS comment_count    INT NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 5. INDEXES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS communities_org_type_idx  ON communities(org_type);
CREATE INDEX IF NOT EXISTS communities_city_idx      ON communities(city_id);
CREATE INDEX IF NOT EXISTS communities_area_idx      ON communities(area_id);
CREATE INDEX IF NOT EXISTS communities_featured_idx  ON communities(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS communities_slug_idx      ON communities(slug);
CREATE INDEX IF NOT EXISTS communities_tags_gin_idx  ON communities USING GIN(tags);

-- ─────────────────────────────────────────────────────────────
-- 6. RLS — community_follows
-- ─────────────────────────────────────────────────────────────

ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_follows_public_read" ON community_follows;
CREATE POLICY "community_follows_public_read"
  ON community_follows FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "community_follows_insert" ON community_follows;
CREATE POLICY "community_follows_insert"
  ON community_follows FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "community_follows_delete" ON community_follows;
CREATE POLICY "community_follows_delete"
  ON community_follows FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 7. TRIGGER: update follower_count
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_community_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET follower_count = (
    SELECT COUNT(*) FROM community_follows
    WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_follower_count ON community_follows;
CREATE TRIGGER trg_community_follower_count
  AFTER INSERT OR DELETE ON community_follows
  FOR EACH ROW EXECUTE FUNCTION update_community_follower_count();

-- ─────────────────────────────────────────────────────────────
-- 8. TRIGGER: update books_count
-- community_books is created in 004. Recreate it here so 005 can
-- run even if 004 rolled back after CREATE TABLE IF NOT EXISTS
-- skipped the existing community_members table.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_books (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  listing_id    UUID NOT NULL REFERENCES book_listings(id) ON DELETE CASCADE,
  added_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (community_id, listing_id)
);

ALTER TABLE community_books ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_community_books_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET books_count = (
    SELECT COUNT(*) FROM community_books
    WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_books_count ON community_books;
CREATE TRIGGER trg_community_books_count
  AFTER INSERT OR DELETE ON community_books
  FOR EACH ROW EXECUTE FUNCTION update_community_books_count();

-- ─────────────────────────────────────────────────────────────
-- 9. TRIGGER: update posts_count
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_community_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET posts_count = (
    SELECT COUNT(*) FROM community_posts
    WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_posts_count ON community_posts;
CREATE TRIGGER trg_community_posts_count
  AFTER INSERT OR DELETE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_community_posts_count();

-- ─────────────────────────────────────────────────────────────
-- 10. TRIGGER: auto-set updated_at on communities
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_community_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_updated_at ON communities;
CREATE TRIGGER trg_community_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION touch_community_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 11. STORAGE BUCKET — community-images
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = TRUE,
  file_size_limit    = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "community_images_public_read" ON storage.objects;
CREATE POLICY "community_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-images');

DROP POLICY IF EXISTS "community_images_auth_upload" ON storage.objects;
CREATE POLICY "community_images_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "community_images_auth_update" ON storage.objects;
CREATE POLICY "community_images_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "community_images_auth_delete" ON storage.objects;
CREATE POLICY "community_images_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ─────────────────────────────────────────────────────────────
-- 12. New notification types
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'notification_type'::regtype
      AND enumlabel = 'COMMUNITY_MEMBER_APPROVED'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'COMMUNITY_MEMBER_APPROVED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'notification_type'::regtype
      AND enumlabel = 'COMMUNITY_NEW_POST'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'COMMUNITY_NEW_POST';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'notification_type'::regtype
      AND enumlabel = 'COMMUNITY_NEW_EVENT'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'COMMUNITY_NEW_EVENT';
  END IF;
END$$;

-- ─────────────────────────────────────────────────────────────
-- 13. Enable Realtime for community_follows
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'community_follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_follows;
  END IF;
END$$;

-- ─────────────────────────────────────────────────────────────
-- 14. HELPER VIEW: community_profile_view
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW community_profile_view AS
SELECT
  c.*,
  ci.name_ar   AS city_name_ar,
  ci.name_en   AS city_name_en,
  a.name_ar    AS area_name_ar,
  a.name_en    AS area_name_en,
  p.full_name  AS admin_full_name,
  p.avatar_url AS admin_avatar_url
FROM communities c
LEFT JOIN cities   ci ON ci.id = c.city_id
LEFT JOIN areas    a  ON a.id  = c.area_id
LEFT JOIN profiles p  ON p.id  = c.admin_id
WHERE c.is_active = TRUE
  AND c.suspended_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- END OF MIGRATION 005
-- ─────────────────────────────────────────────────────────────
