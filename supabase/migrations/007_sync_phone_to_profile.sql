-- Migration: 007_sync_phone_to_profile.sql
-- Description: Ensure handle_new_user trigger captures phone / whatsapp_number from raw_user_meta_data and links it to profiles

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
  user_full_name TEXT;
  user_avatar TEXT;
  user_phone TEXT;
BEGIN
  -- Generate unique referral code
  new_referral_code := 'BOOK-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6));
  
  -- Extract name, avatar, and phone if present in raw_user_meta_data
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  user_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '');
  user_phone := COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', NEW.raw_user_meta_data->>'phone', '');

  INSERT INTO profiles (id, full_name, avatar_url, whatsapp_number, show_whatsapp, email_verified, referral_code, preferred_language)
  VALUES (
    NEW.id,
    NULLIF(user_full_name, ''),
    NULLIF(user_avatar, ''),
    NULLIF(user_phone, ''),
    (user_phone <> ''),
    NEW.email_confirmed_at IS NOT NULL,
    new_referral_code,
    'ar'
  )
  ON CONFLICT (id) DO UPDATE SET
    email_verified = EXCLUDED.email_verified,
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    whatsapp_number = COALESCE(profiles.whatsapp_number, EXCLUDED.whatsapp_number),
    show_whatsapp = CASE WHEN EXCLUDED.whatsapp_number IS NOT NULL THEN TRUE ELSE profiles.show_whatsapp END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
