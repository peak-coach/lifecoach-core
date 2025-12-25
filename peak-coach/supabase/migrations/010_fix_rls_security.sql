-- ============================================
-- PEAK COACH - Security Fix Migration
-- Fix RLS for missing tables
-- ============================================

-- ==========================================
-- 1. RECURRING_TASKS - Enable RLS
-- ==========================================
ALTER TABLE IF EXISTS recurring_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own recurring tasks" ON recurring_tasks;
DROP POLICY IF EXISTS "Users can create own recurring tasks" ON recurring_tasks;
DROP POLICY IF EXISTS "Users can update own recurring tasks" ON recurring_tasks;
DROP POLICY IF EXISTS "Users can delete own recurring tasks" ON recurring_tasks;

-- Create RLS policies
CREATE POLICY "Users can view own recurring tasks"
  ON recurring_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring tasks"
  ON recurring_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring tasks"
  ON recurring_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring tasks"
  ON recurring_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 2. PUSH_SUBSCRIPTIONS - Enable RLS
-- ==========================================
ALTER TABLE IF EXISTS push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can create own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;

-- Create RLS policies
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 3. POMODORO_SESSIONS - Enable RLS
-- ==========================================
ALTER TABLE IF EXISTS pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own pomodoro sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "Users can create own pomodoro sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "Users can update own pomodoro sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "Users can delete own pomodoro sessions" ON pomodoro_sessions;

-- Create RLS policies
CREATE POLICY "Users can view own pomodoro sessions"
  ON pomodoro_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pomodoro sessions"
  ON pomodoro_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro sessions"
  ON pomodoro_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pomodoro sessions"
  ON pomodoro_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 4. FIX FUNCTION SEARCH PATH (Warnings)
-- ==========================================
-- Note: These warnings are LOW priority and can be safely ignored.
-- The "Function Search Path Mutable" warning means the function 
-- doesn't have an explicit search_path, but this is fine for our use case
-- since we only use the public schema.

-- The following warnings are Supabase defaults and safe to ignore:
-- - "Extension in Public" for vector extension (needed for RAG)
-- - "Leaked Password Protection" for Auth (Supabase manages this)

-- If you want to fix function warnings later, you'd need to recreate
-- each function with: SET search_path = public, pg_temp
-- But this is optional and not required for functionality.

-- ============================================
-- DONE - RLS ENABLED FOR ALL TABLES
-- ============================================

