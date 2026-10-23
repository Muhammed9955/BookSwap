-- ============================================================
-- BookSwap Egypt — Migration 008: Store Notifications & Realtime Extension
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STORE_APPROVED' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'STORE_APPROVED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STORE_NEW_ORDER' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'STORE_NEW_ORDER';
  END IF;
END$$;

-- Enable Supabase Realtime for partner_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'partner_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE partner_requests;
  END IF;
END$$;

ALTER TABLE partner_requests REPLICA IDENTITY FULL;
