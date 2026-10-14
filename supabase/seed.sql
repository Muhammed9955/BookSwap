-- ============================================================
-- BookSwap Egypt — Seed Data
-- Run after applying the main schema migration
-- ============================================================

-- NOTE: This seed data uses pre-defined UUIDs for easy reference.
-- In production, create actual auth.users via Supabase Auth API.
-- For development, you can use the Supabase dashboard to create test users.

-- ============================================================
-- DEMO BOOK DATA (without users — run this part in prod)
-- ============================================================

-- Additional categories are already seeded in schema.sql

-- Popular books that would realistically be listed in Alexandria
INSERT INTO books (id, title, title_ar, author, author_ar, isbn, language, description, description_ar, published_year) VALUES
  -- Fiction / روايات
  ('b0000000-0000-0000-0000-000000000001', 'The Alchemist', 'الخيميائي', 'Paulo Coelho', 'باولو كويلو', '9780061122415', 'ENGLISH', 'A young shepherd goes on a journey of self-discovery.', 'رواية عالمية عن رحلة الاكتشاف الذاتي', 1988),
  ('b0000000-0000-0000-0000-000000000002', 'Atomic Habits', 'العادات الذرية', 'James Clear', 'جيمس كلير', '9780735211292', 'ENGLISH', 'Tiny changes, remarkable results.', 'التغييرات الصغيرة، نتائج مذهلة', 2018),
  ('b0000000-0000-0000-0000-000000000003', 'The Psychology of Money', 'علم نفس المال', 'Morgan Housel', 'مورجان هاوسل', '9780857197689', 'ENGLISH', 'Timeless lessons on wealth, greed, and happiness.', 'دروس خالدة عن الثروة', 2020),
  ('b0000000-0000-0000-0000-000000000004', 'Rich Dad Poor Dad', 'أبي الغني أبي الفقير', 'Robert Kiyosaki', 'روبرت كيوساكي', '9781612680019', 'ENGLISH', 'What the rich teach their kids about money.', 'ما يعلمه الأغنياء لأبنائهم عن المال', 1997),
  ('b0000000-0000-0000-0000-000000000005', 'Sapiens', 'سابيينس', 'Yuval Noah Harari', 'يوفال نوح هراري', '9780062316097', 'ENGLISH', 'A brief history of humankind.', 'تاريخ موجز للبشرية', 2011),
  ('b0000000-0000-0000-0000-000000000006', 'Clean Code', 'الكود النظيف', 'Robert C. Martin', 'روبرت مارتن', '9780132350884', 'ENGLISH', 'A handbook of agile software craftsmanship.', 'دليل برمجة رشيق', 2008),
  ('b0000000-0000-0000-0000-000000000007', 'Think and Grow Rich', 'فكر وازدد ثراءً', 'Napoleon Hill', 'نابليون هيل', '9781585424337', 'ENGLISH', 'The landmark bestseller on achieving success.', 'الكتاب الأشهر عن النجاح', 1937),
  ('b0000000-0000-0000-0000-000000000008', 'The 7 Habits of Highly Effective People', '7 عادات للناس الأكثر فاعلية', 'Stephen Covey', 'ستيفن كوفي', '9781982137274', 'ENGLISH', 'Powerful lessons in personal change.', 'دروس في التغيير الشخصي', 1989),
  -- Arabic fiction
  ('b0000000-0000-0000-0000-000000000009', 'عمارة يعقوبيان', 'Yacoubian Building', 'علاء الأسواني', 'Alaa Al Aswany', NULL, 'ARABIC', 'رواية مصرية شهيرة', 'Famous Egyptian novel', 2002),
  ('b0000000-0000-0000-0000-000000000010', 'ذهب مع الريح', 'Gone with the Wind', 'مارجريت ميتشل', 'Margaret Mitchell', NULL, 'ARABIC', 'ملحمة خالدة', 'Timeless epic', 1936),
  ('b0000000-0000-0000-0000-000000000011', 'أولاد حارتنا', 'Children of the Alley', 'نجيب محفوظ', 'Naguib Mahfouz', NULL, 'ARABIC', 'رواية نجيب محفوظ', 'Naguib Mahfouz novel', 1959),
  ('b0000000-0000-0000-0000-000000000012', 'The Subtle Art of Not Giving a F*ck', 'فن إتقان اللامبالاة', 'Mark Manson', 'مارك مانسون', '9780062457714', 'ENGLISH', 'A counterintuitive approach to living a good life.', 'مقاربة مغايرة للحياة الجيدة', 2016),
  ('b0000000-0000-0000-0000-000000000013', 'Ikigai', 'إيكيغاي', 'Héctor García', 'هيكتور غارسيا', '9780143130727', 'ENGLISH', 'The Japanese secret to a long and happy life.', 'السر الياباني لحياة طويلة سعيدة', 2017),
  ('b0000000-0000-0000-0000-000000000014', 'Man Search for Meaning', 'الإنسان بحثاً عن المعنى', 'Viktor Frankl', 'فيكتور فرانكل', '9780807014271', 'ENGLISH', 'A Holocaust survivor on finding meaning.', 'ناجٍ من الهولوكوست يبحث عن المعنى', 1946),
  ('b0000000-0000-0000-0000-000000000015', 'Deep Work', 'العمل العميق', 'Cal Newport', 'كال نيوبورت', '9781455586691', 'ENGLISH', 'Rules for focused success in a distracted world.', 'قواعد النجاح في عالم مشتت', 2016);

-- Set categories for books
UPDATE books SET category_id = (SELECT id FROM categories WHERE slug = 'fiction') 
  WHERE id IN ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000011');

UPDATE books SET category_id = (SELECT id FROM categories WHERE slug = 'self-development')
  WHERE id IN ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000015');

UPDATE books SET category_id = (SELECT id FROM categories WHERE slug = 'business')
  WHERE id IN ('b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000007');

UPDATE books SET category_id = (SELECT id FROM categories WHERE slug = 'psychology')
  WHERE id IN ('b0000000-0000-0000-0000-000000000014');

UPDATE books SET category_id = (SELECT id FROM categories WHERE slug = 'programming')
  WHERE id IN ('b0000000-0000-0000-0000-000000000006');

UPDATE books SET category_id = (SELECT id FROM categories WHERE slug = 'history')
  WHERE id IN ('b0000000-0000-0000-0000-000000000005');

-- ============================================================
-- HOW TO CREATE SEED USERS:
-- ============================================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" for each test user
-- 3. Use passwords like "Test1234!" for dev
-- 4. After creation, run this SQL to set up profiles:
--
-- UPDATE profiles SET 
--   full_name = 'Ahmed Mohamed',
--   full_name_ar = 'أحمد محمد',
--   city_id = '10000000-0000-0000-0000-000000000001',
--   area_id = (SELECT id FROM areas WHERE slug = 'smouha'),
--   onboarding_completed = true,
--   total_listings = 5
-- WHERE id = 'YOUR-USER-UUID-HERE';
--
-- Then create listings:
-- INSERT INTO book_listings (book_id, seller_id, listing_type, condition, price, city_id, area_id)
-- SELECT 
--   'b0000000-0000-0000-0000-000000000001',
--   'YOUR-USER-UUID-HERE',
--   'SELL',
--   'VERY_GOOD',
--   150,
--   '10000000-0000-0000-0000-000000000001',
--   (SELECT id FROM areas WHERE slug = 'smouha');

-- ============================================================
-- ADMIN USER SETUP
-- ============================================================
-- After creating your admin user via Supabase Auth, run:
-- UPDATE profiles SET role = 'ADMIN' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@bookswap.eg'
-- );

-- ============================================================
-- USEFUL QUERIES FOR TESTING
-- ============================================================

-- Get all active listings with book info:
-- SELECT bl.*, b.title, b.author, p.full_name as seller
-- FROM book_listings bl
-- JOIN books b ON bl.book_id = b.id
-- JOIN profiles p ON bl.seller_id = p.id
-- WHERE bl.status = 'ACTIVE'
-- ORDER BY bl.created_at DESC;

-- Get wishlist matches:
-- SELECT wi.user_id, b.title, COUNT(bl.id) as available_listings
-- FROM wishlist_items wi
-- JOIN books b ON wi.book_id = b.id
-- LEFT JOIN book_listings bl ON bl.book_id = b.id AND bl.status = 'ACTIVE'
-- GROUP BY wi.user_id, b.title
-- HAVING COUNT(bl.id) > 0;
