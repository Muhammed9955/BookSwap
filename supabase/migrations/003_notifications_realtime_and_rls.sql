-- ============================================================
-- BookSwap Egypt — Migration 003: Realtime Notifications & RLS Fix
-- ============================================================

-- 1. Ensure enum has all required notification types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BORROW_REQUEST' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'BORROW_REQUEST';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BORROW_ACCEPTED' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'BORROW_ACCEPTED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BORROW_RETURNED' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'BORROW_RETURNED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BORROW_OVERDUE' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'BORROW_OVERDUE';
  END IF;
END$$;

-- 2. Ensure transactions table has all meetup and borrow columns
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS meetup_location           TEXT,
  ADD COLUMN IF NOT EXISTS meetup_lat                DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS meetup_lng                DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS meetup_area_id            UUID REFERENCES areas(id),
  ADD COLUMN IF NOT EXISTS meetup_at                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hub_id                    UUID REFERENCES communities(id),
  ADD COLUMN IF NOT EXISTS borrow_due_date           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS borrow_returned_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deposit_amount            DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS deposit_status            TEXT DEFAULT 'N/A';

-- 3. Fix Row-Level Security (RLS) on notifications table
-- Previously, "notifications_own" used USING (auth.uid() = user_id) FOR ALL,
-- which blocked borrower/buyer from inserting notifications intended for the lender/seller!
DROP POLICY IF EXISTS "notifications_own" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;
DROP POLICY IF EXISTS "admin_manage_notifications" ON notifications;

-- (a) Users can only SELECT their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- (b) Any authenticated user can INSERT notifications (e.g., to notify book owners, borrowers, buyers)
CREATE POLICY "notifications_insert_authenticated" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- (c) Users can UPDATE their own notifications (e.g., mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (d) Users can DELETE their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- (e) Admins can manage all notifications
CREATE POLICY "admin_manage_notifications" ON notifications
  FOR ALL TO authenticated
  USING (is_admin());

-- 4. Enable Supabase Realtime for Notifications and Transactions
-- This publishes row changes so the frontend channels receive live events!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'swap_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE swap_requests;
  END IF;
END$$;

-- 5. Set REPLICA IDENTITY FULL so payload includes old & new column values in Realtime
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE swap_requests REPLICA IDENTITY FULL;
