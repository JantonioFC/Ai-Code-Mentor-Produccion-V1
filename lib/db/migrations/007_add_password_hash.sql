-- ==========================================
-- 007: Add password_hash to user_profiles
-- Enables local auth with bcrypt password verification
-- ==========================================

ALTER TABLE user_profiles ADD COLUMN password_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'authenticated';
