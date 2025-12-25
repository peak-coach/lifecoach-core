-- ============================================
-- PEAK COACH - Work Mode Migration
-- ============================================
-- Adds work_mode to distinguish between:
-- - focus: Time for personal goals (generate full tasks)
-- - working: At job/construction site (only mini-tasks)
-- - recovery: Recovery day (very light tasks)
-- ============================================

-- Create separate work_status table for better tracking
CREATE TABLE IF NOT EXISTS work_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_mode TEXT DEFAULT 'not_started' 
    CHECK (work_mode IN ('not_started', 'focus', 'working', 'recovery', 'off_work')),
  day_type TEXT DEFAULT 'normal'
    CHECK (day_type IN ('normal', 'montage', 'recovery', 'urlaub', 'krank')),
  work_start TIMESTAMPTZ,
  work_end TIMESTAMPTZ,
  focus_start TIMESTAMPTZ,
  total_focus_minutes INT DEFAULT 0,
  total_work_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE work_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own work_status"
  ON work_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work_status"
  ON work_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work_status"
  ON work_status FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role full access"
  ON work_status FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_work_status_user_date 
  ON work_status(user_id, date);

-- ============================================
-- DONE!
-- ============================================

