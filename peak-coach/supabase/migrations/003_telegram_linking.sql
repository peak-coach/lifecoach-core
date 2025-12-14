-- ============================================
-- PEAK COACH - Telegram Linking Migration
-- ============================================
-- Run this migration in Supabase SQL Editor

-- Add linking_code field to users table for temporary codes
ALTER TABLE users ADD COLUMN IF NOT EXISTS linking_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linking_code_expires_at TIMESTAMPTZ;

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_linking_code ON users(linking_code) WHERE linking_code IS NOT NULL;

-- Update RLS policies to allow authenticated users to access their own data
-- based on auth.uid() matching users.id

-- Policy: Users can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (
    id = auth.uid() 
    OR telegram_id IS NOT NULL
  );

-- Policy: Users can update their own data  
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (
    id = auth.uid()
  );

-- Policy: Users can insert their own data
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (
    id = auth.uid() OR telegram_id IS NOT NULL
  );

-- Policy for service role (Telegram bot uses service key)
DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Same for all related tables
-- Tasks
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE telegram_id IS NOT NULL)
  );

-- Habits
DROP POLICY IF EXISTS "Users can manage own habits" ON habits;
CREATE POLICY "Users can manage own habits" ON habits
  FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE telegram_id IS NOT NULL)
  );

-- Goals
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE telegram_id IS NOT NULL)
  );

-- Daily Logs
DROP POLICY IF EXISTS "Users can manage own daily_logs" ON daily_logs;
CREATE POLICY "Users can manage own daily_logs" ON daily_logs
  FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE telegram_id IS NOT NULL)
  );

-- Habit Logs
DROP POLICY IF EXISTS "Users can manage own habit_logs" ON habit_logs;
CREATE POLICY "Users can manage own habit_logs" ON habit_logs
  FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE telegram_id IS NOT NULL)
  );

-- Coach Messages
DROP POLICY IF EXISTS "Users can manage own coach_messages" ON coach_messages;
CREATE POLICY "Users can manage own coach_messages" ON coach_messages
  FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE telegram_id IS NOT NULL)
  );

-- User Profile
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profile;
CREATE POLICY "Users can manage own profile" ON user_profile
  FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE telegram_id IS NOT NULL)
  );

-- ============================================
-- FUNCTION: Generate Linking Code
-- ============================================
CREATE OR REPLACE FUNCTION generate_linking_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate random 6-character alphanumeric code
  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  
  -- Store code with 15-minute expiry
  UPDATE users 
  SET 
    linking_code = v_code,
    linking_code_expires_at = NOW() + INTERVAL '15 minutes'
  WHERE id = p_user_id;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Link Telegram Account
-- ============================================
CREATE OR REPLACE FUNCTION link_telegram_account(p_code TEXT, p_telegram_id BIGINT, p_telegram_name TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_existing_telegram_user UUID;
BEGIN
  -- Check if telegram_id already linked to another user
  SELECT id INTO v_existing_telegram_user 
  FROM users 
  WHERE telegram_id = p_telegram_id;
  
  IF v_existing_telegram_user IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Dieser Telegram Account ist bereits verknüpft.'
    );
  END IF;
  
  -- Find user with valid code
  SELECT id INTO v_user_id 
  FROM users 
  WHERE linking_code = UPPER(p_code)
    AND linking_code_expires_at > NOW();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code ungültig oder abgelaufen. Bitte generiere einen neuen Code.'
    );
  END IF;
  
  -- Link accounts
  UPDATE users 
  SET 
    telegram_id = p_telegram_id,
    linking_code = NULL,
    linking_code_expires_at = NULL,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Delete the old telegram-only user if exists (merge data first if needed)
  -- For now, we just link - data merge can be done later
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Accounts erfolgreich verknüpft!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE!
-- ============================================

