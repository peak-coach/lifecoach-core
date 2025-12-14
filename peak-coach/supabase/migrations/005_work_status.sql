-- ============================================
-- PEAK COACH - Work Status & Day Types Migration
-- ============================================
-- Run this migration in Supabase SQL Editor

-- ============================================
-- ADD work_status fields to daily_logs
-- ============================================

-- Day Type: What kind of day is it?
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS day_type TEXT 
  DEFAULT 'normal' 
  CHECK (day_type IN ('normal', 'montage', 'recovery', 'vacation', 'sick'));

-- Work Status: Is user currently working or off?
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS work_status TEXT 
  DEFAULT 'not_started' 
  CHECK (work_status IN ('not_started', 'working', 'break', 'off_work'));

-- Work timing
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMPTZ;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS work_ended_at TIMESTAMPTZ;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS total_work_minutes INT DEFAULT 0;

-- Break tracking
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS total_break_minutes INT DEFAULT 0;

-- Daily intention (from web app)
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS daily_intention TEXT;

-- ============================================
-- ADD default work hours to user_profile
-- ============================================

ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS default_day_type TEXT DEFAULT 'normal';
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS montage_days TEXT[] DEFAULT '{}'; -- e.g., ['monday', 'tuesday']
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS recovery_day TEXT DEFAULT 'sunday';

-- Intensity settings (1-10 scale)
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS intensity_level INT DEFAULT 7 
  CHECK (intensity_level BETWEEN 1 AND 10);

-- Grace days per month (days where missing goals is okay)
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS grace_days_per_month INT DEFAULT 2;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS grace_days_used INT DEFAULT 0;

-- Sleep goal
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS sleep_goal_hours DECIMAL DEFAULT 7.5;

-- ============================================
-- FUNCTION: Start Work Day
-- ============================================
CREATE OR REPLACE FUNCTION start_work_day(
  p_user_id UUID,
  p_day_type TEXT DEFAULT 'normal'
)
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_log_id UUID;
BEGIN
  -- Create or update daily log
  INSERT INTO daily_logs (user_id, date, day_type, work_status, work_started_at)
  VALUES (p_user_id, v_today, p_day_type, 'working', NOW())
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    day_type = p_day_type,
    work_status = 'working',
    work_started_at = COALESCE(daily_logs.work_started_at, NOW()),
    updated_at = NOW()
  RETURNING id INTO v_log_id;
  
  RETURN json_build_object(
    'success', true,
    'log_id', v_log_id,
    'day_type', p_day_type,
    'started_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: End Work Day (Feierabend)
-- ============================================
CREATE OR REPLACE FUNCTION end_work_day(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_log RECORD;
  v_work_minutes INT;
BEGIN
  -- Get today's log
  SELECT * INTO v_log
  FROM daily_logs
  WHERE user_id = p_user_id AND date = v_today;
  
  IF v_log IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kein Arbeitstag gestartet'
    );
  END IF;
  
  -- Calculate work duration
  IF v_log.work_started_at IS NOT NULL THEN
    v_work_minutes := EXTRACT(EPOCH FROM (NOW() - v_log.work_started_at)) / 60;
    v_work_minutes := v_work_minutes - COALESCE(v_log.total_break_minutes, 0);
  ELSE
    v_work_minutes := 0;
  END IF;
  
  -- Update log
  UPDATE daily_logs
  SET 
    work_status = 'off_work',
    work_ended_at = NOW(),
    total_work_minutes = v_work_minutes,
    updated_at = NOW()
  WHERE user_id = p_user_id AND date = v_today;
  
  RETURN json_build_object(
    'success', true,
    'work_minutes', v_work_minutes,
    'work_hours', ROUND(v_work_minutes / 60.0, 1),
    'ended_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Today's Status
-- ============================================
CREATE OR REPLACE FUNCTION get_today_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_log RECORD;
  v_tasks_total INT;
  v_tasks_completed INT;
  v_habits_total INT;
  v_habits_completed INT;
BEGIN
  -- Get today's log
  SELECT * INTO v_log
  FROM daily_logs
  WHERE user_id = p_user_id AND date = v_today;
  
  -- Count tasks
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_tasks_total, v_tasks_completed
  FROM tasks
  WHERE user_id = p_user_id AND scheduled_date = v_today;
  
  -- Count habits
  SELECT 
    COUNT(h.*),
    COUNT(hl.*) FILTER (WHERE hl.completed = true)
  INTO v_habits_total, v_habits_completed
  FROM habits h
  LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = v_today
  WHERE h.user_id = p_user_id AND h.is_active = true;
  
  RETURN json_build_object(
    'date', v_today,
    'day_type', COALESCE(v_log.day_type, 'normal'),
    'work_status', COALESCE(v_log.work_status, 'not_started'),
    'work_started_at', v_log.work_started_at,
    'work_ended_at', v_log.work_ended_at,
    'morning_mood', v_log.morning_mood,
    'morning_energy', v_log.morning_energy,
    'daily_intention', v_log.daily_intention,
    'tasks', json_build_object(
      'total', v_tasks_total,
      'completed', v_tasks_completed
    ),
    'habits', json_build_object(
      'total', v_habits_total,
      'completed', v_habits_completed
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE!
-- ============================================

