-- BookSwap Egypt / WaraqConnect — Migration 004: Store Orders & Notification Types
-- Persists bookstore orders (single book, mix & match bundle, curated pack, series)
-- Enables store owner notifications and emails

-- 1. Ensure notification_type includes STORE_NEW_ORDER
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'STORE_NEW_ORDER' 
    AND enumtypid = 'notification_type'::regtype
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'STORE_NEW_ORDER';
  END IF;
END $$;

-- 2. Create store_orders table
CREATE TABLE IF NOT EXISTS store_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT NOT NULL,
  store_id        UUID NOT NULL REFERENCES bookstores(id) ON DELETE CASCADE,
  
  -- Customer Details
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_city   TEXT NOT NULL,
  customer_address TEXT,
  customer_notes  TEXT,
  
  -- Order Classification
  order_type      TEXT NOT NULL DEFAULT 'SINGLE_BOOK'
    CHECK (order_type IN ('SINGLE_BOOK', 'BUNDLE_PACKAGE', 'CURATED_PACK', 'SERIES')),
  bundle_title    TEXT,
  bundle_size     INT,
  pack_title      TEXT,
  pack_image_url  TEXT,
  
  -- Pricing & Items
  total_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Fulfillment Status
  status          TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED')),
    
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_store_orders_store_id ON store_orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_order_number ON store_orders(order_number);

-- 3. Row Level Security
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;

-- Anyone (customers / guests / authenticated users) can place an order
DROP POLICY IF EXISTS "store_orders_insert_public" ON store_orders;
CREATE POLICY "store_orders_insert_public" ON store_orders
  FOR INSERT WITH CHECK (true);

-- Store owner can view their store's orders
DROP POLICY IF EXISTS "store_orders_owner_select" ON store_orders;
CREATE POLICY "store_orders_owner_select" ON store_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookstores b
      WHERE b.id = store_orders.store_id
      AND b.owner_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'ADMIN'
      )
    )
  );

-- Store owner can update order status (CONFIRMED, DISPATCHED, etc.)
DROP POLICY IF EXISTS "store_orders_owner_update" ON store_orders;
CREATE POLICY "store_orders_owner_update" ON store_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookstores b
      WHERE b.id = store_orders.store_id
      AND b.owner_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'ADMIN'
      )
    )
  );

-- Enable Supabase Realtime for store_orders if publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'store_orders'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE store_orders;
    END IF;
  END IF;
END $$;
