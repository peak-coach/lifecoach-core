-- ============================================
-- PEAK COACH - Milestones Migration
-- ============================================
-- Run this migration in Supabase SQL Editor

-- ============================================
-- MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Progress
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Order
  order_index INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_milestones_goal ON milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id);

-- Enable RLS
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own milestones" ON milestones;
CREATE POLICY "Users can manage own milestones" ON milestones
  FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE telegram_id IS NOT NULL)
  );

-- Update trigger
CREATE TRIGGER update_milestones_updated_at 
  BEFORE UPDATE ON milestones 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Update Goal Progress from Milestones
-- ============================================
CREATE OR REPLACE FUNCTION update_goal_progress_from_milestones()
RETURNS TRIGGER AS $$
DECLARE
  v_total_milestones INT;
  v_completed_milestones INT;
  v_progress DECIMAL;
BEGIN
  -- Count milestones
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO v_total_milestones, v_completed_milestones
  FROM milestones
  WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  -- Calculate progress
  IF v_total_milestones > 0 THEN
    v_progress := (v_completed_milestones::DECIMAL / v_total_milestones::DECIMAL) * 100;
  ELSE
    v_progress := 0;
  END IF;
  
  -- Update goal
  UPDATE goals
  SET 
    current_value = v_completed_milestones,
    target_value = v_total_milestones,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update goal progress when milestone changes
DROP TRIGGER IF EXISTS update_goal_on_milestone_change ON milestones;
CREATE TRIGGER update_goal_on_milestone_change
  AFTER INSERT OR UPDATE OR DELETE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress_from_milestones();

-- ============================================
-- ADD emoji field to goals (if not exists)
-- ============================================
ALTER TABLE goals ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎯';

-- ============================================
-- DONE!
-- ============================================

