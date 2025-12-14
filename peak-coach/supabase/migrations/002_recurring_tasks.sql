-- ============================================
-- PEAK COACH - Recurring Tasks & AI Generation
-- Migration 002
-- ============================================

-- Recurring Task Templates
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Task Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  energy_required VARCHAR(20) DEFAULT 'medium' CHECK (energy_required IN ('high', 'medium', 'low')),
  estimated_minutes INTEGER DEFAULT 30,
  category VARCHAR(50),
  
  -- Schedule
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'weekly', 'monthly', 'custom')),
  days_of_week INTEGER[] DEFAULT '{}', -- 0=Sunday, 1=Monday, etc.
  preferred_time TIME,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add recurring_task_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL;

-- Add source column to tasks (manual, ai_generated, recurring)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Add estimated_minutes to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_user ON recurring_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks(recurring_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_recurring_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_recurring_tasks_timestamp ON recurring_tasks;
CREATE TRIGGER update_recurring_tasks_timestamp
  BEFORE UPDATE ON recurring_tasks
  FOR EACH ROW EXECUTE FUNCTION update_recurring_tasks_timestamp();

-- ============================================
-- Example recurring tasks (for testing)
-- ============================================

-- Note: Run these manually for your user after getting the user_id
-- INSERT INTO recurring_tasks (user_id, title, priority, frequency, preferred_time) VALUES
--   ('YOUR_USER_ID', 'Morning Meditation', 'high', 'daily', '07:00'),
--   ('YOUR_USER_ID', 'Inbox Zero', 'medium', 'weekdays', '09:00'),
--   ('YOUR_USER_ID', 'Weekly Review', 'high', 'weekly', '18:00');

