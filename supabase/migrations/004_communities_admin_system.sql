-- ============================================================
-- BookSwap — Migration 004: Communities Admin System
-- Adds: admin role tracking, member approval flow, community books,
--       partner_requests table, and RLS policies
-- ============================================================

-- 1. Add admin_id column to communities table (the creator becomes admin)
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS admin_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS member_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS rules_ar        TEXT,
  ADD COLUMN IF NOT EXISTS rules_en        TEXT;

-- 2. Community members table with role + approval status
-- schema.sql already creates this table WITHOUT status/id/created_at.
-- CREATE TABLE IF NOT EXISTS is a no-op on existing DBs, so evolve columns below.
CREATE TABLE IF NOT EXISTS community_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MODERATOR', 'MEMBER')),
  status        TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'BANNED')),
  joined_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (community_id, user_id)
);

ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS id         UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS status     TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS role       TEXT DEFAULT 'MEMBER',
  ADD COLUMN IF NOT EXISTS joined_at  TIMESTAMPTZ DEFAULT NOW();

-- Existing members from schema.sql were already in the community
UPDATE community_members
SET status = 'APPROVED'
WHERE status IS NULL;

ALTER TABLE community_members
  ALTER COLUMN status SET DEFAULT 'PENDING';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'community_members'
      AND column_name  = 'status'
  ) THEN
    ALTER TABLE community_members ALTER COLUMN status SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.community_members'::regclass
      AND conname  = 'community_members_status_check'
  ) THEN
    ALTER TABLE community_members
      ADD CONSTRAINT community_members_status_check
      CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'BANNED'));
  END IF;
END$$;

-- 3. Community books (books members share within a community)
CREATE TABLE IF NOT EXISTS community_books (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  listing_id    UUID NOT NULL REFERENCES book_listings(id) ON DELETE CASCADE,
  added_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (community_id, listing_id)
);

-- 4. Partner requests table (bookstore owners / event organizers)
CREATE TABLE IF NOT EXISTS partner_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone         TEXT NOT NULL,
  city          TEXT,
  partner_type  TEXT NOT NULL DEFAULT 'BOOKSTORE' CHECK (partner_type IN ('BOOKSTORE', 'EVENT_ORGANIZER', 'BOTH')),
  details       TEXT,
  status        TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  submitted_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable RLS on new tables
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_books   ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_requests  ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — community_members
-- Anyone can read members of public communities
DROP POLICY IF EXISTS "community_members_select" ON community_members;
CREATE POLICY "community_members_select" ON community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id AND (c.is_public = true OR c.admin_id = auth.uid())
    )
    OR user_id = auth.uid()
  );

-- Authenticated users can request to join (INSERT their own row)
DROP POLICY IF EXISTS "community_members_insert_own" ON community_members;
CREATE POLICY "community_members_insert_own" ON community_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Community admin can update member status (approve / reject / ban)
DROP POLICY IF EXISTS "community_members_update_admin" ON community_members;
CREATE POLICY "community_members_update_admin" ON community_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id AND c.admin_id = auth.uid()
    )
    OR is_admin()
  );

-- Members can remove themselves; admins can remove anyone
DROP POLICY IF EXISTS "community_members_delete" ON community_members;
CREATE POLICY "community_members_delete" ON community_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id AND c.admin_id = auth.uid()
    )
    OR is_admin()
  );

-- 7. RLS Policies — community_books
-- Anyone can see books in public communities
DROP POLICY IF EXISTS "community_books_select" ON community_books;
CREATE POLICY "community_books_select" ON community_books
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id AND c.is_public = true
    )
    OR EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_books.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'APPROVED'
    )
  );

-- Only approved members can add books
DROP POLICY IF EXISTS "community_books_insert" ON community_books;
CREATE POLICY "community_books_insert" ON community_books
  FOR INSERT TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_books.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'APPROVED'
    )
  );

-- Book adder or community admin can remove books
DROP POLICY IF EXISTS "community_books_delete" ON community_books;
CREATE POLICY "community_books_delete" ON community_books
  FOR DELETE TO authenticated
  USING (
    added_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id AND c.admin_id = auth.uid()
    )
    OR is_admin()
  );

-- 8. RLS Policies — partner_requests
-- Only admins can see all requests
DROP POLICY IF EXISTS "partner_requests_admin_select" ON partner_requests;
CREATE POLICY "partner_requests_admin_select" ON partner_requests
  FOR SELECT TO authenticated USING (is_admin() OR submitted_by = auth.uid());

-- Authenticated users can submit requests
DROP POLICY IF EXISTS "partner_requests_insert" ON partner_requests;
CREATE POLICY "partner_requests_insert" ON partner_requests
  FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins can update status
DROP POLICY IF EXISTS "partner_requests_admin_update" ON partner_requests;
CREATE POLICY "partner_requests_admin_update" ON partner_requests
  FOR UPDATE TO authenticated USING (is_admin());

-- 9. Enable Realtime for new tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'community_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_members;
  END IF;
END$$;

-- 10. Function: auto-set community creator as admin member
CREATE OR REPLACE FUNCTION set_community_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert creator as ADMIN member with APPROVED status
  INSERT INTO community_members (community_id, user_id, role, status, joined_at)
  VALUES (NEW.id, NEW.admin_id, 'ADMIN', 'APPROVED', NOW())
  ON CONFLICT (community_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires after a community is created
DROP TRIGGER IF EXISTS trg_set_community_admin ON communities;
CREATE TRIGGER trg_set_community_admin
  AFTER INSERT ON communities
  FOR EACH ROW
  WHEN (NEW.admin_id IS NOT NULL)
  EXECUTE FUNCTION set_community_admin();

-- 11. Function: update member_count on community_members changes
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET member_count = (
    SELECT COUNT(*) FROM community_members
    WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
      AND status = 'APPROVED'
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_member_count ON community_members;
CREATE TRIGGER trg_community_member_count
  AFTER INSERT OR UPDATE OR DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count();

-- 12. Update communities RLS to allow creator to manage
DROP POLICY IF EXISTS "communities_update_admin" ON communities;
CREATE POLICY "communities_update_admin" ON communities
  FOR UPDATE TO authenticated
  USING (admin_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "communities_delete_admin" ON communities;
CREATE POLICY "communities_delete_admin" ON communities
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid() OR is_admin());
