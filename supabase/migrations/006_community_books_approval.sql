-- ============================================================
-- BookSwap — Migration 006: Community Books Approval Workflow
-- Adds: status ('PENDING', 'APPROVED', 'REJECTED'), approved_by,
--       approved_at, admin_note, and updated RLS policies.
-- ============================================================

-- 1. Add status and approval tracking columns to community_books
ALTER TABLE community_books
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- 2. Backfill existing books to APPROVED so current entries remain visible
UPDATE community_books
SET status = 'APPROVED', approved_at = NOW()
WHERE status IS NULL OR status = 'PENDING';

-- 3. Update SELECT RLS policy
-- Approved books visible to anyone in public communities or approved members
-- Pending books visible to the submitter (added_by) and community admins
DROP POLICY IF EXISTS "community_books_select" ON community_books;
CREATE POLICY "community_books_select" ON community_books
  FOR SELECT USING (
    -- Approved books on public communities or approved member communities
    (
      status = 'APPROVED'
      AND (
        EXISTS (
          SELECT 1 FROM communities c
          WHERE c.id = community_books.community_id AND c.is_public = true
        )
        OR EXISTS (
          SELECT 1 FROM community_members cm
          WHERE cm.community_id = community_books.community_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'APPROVED'
        )
      )
    )
    -- Book adder can always see their own submission (even if PENDING)
    OR added_by = auth.uid()
    -- Community admin or super-admin can see all books (PENDING, APPROVED, REJECTED)
    OR EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_books.community_id AND c.admin_id = auth.uid()
    )
    OR is_admin()
  );

-- 4. Admin UPDATE policy (for approving / rejecting books)
DROP POLICY IF EXISTS "community_books_admin_update" ON community_books;
CREATE POLICY "community_books_admin_update" ON community_books
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_books.community_id AND c.admin_id = auth.uid()
    )
    OR is_admin()
  );
