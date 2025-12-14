-- ============================================
-- PEAK COACH - Pomodoro Timer
-- ============================================
-- Run this migration in Supabase SQL Editor

-- ============================================
-- POMODORO SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session info
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  task_title TEXT, -- Store title in case task is deleted
  
  -- Timing
  duration_minutes INT DEFAULT 25,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  
  -- Stats
  interruptions INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_user ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_date ON pomodoro_sessions(started_at);

-- ============================================
-- POMODORO SETTINGS IN USER PROFILE
-- ============================================
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS pomodoro_work_minutes INT DEFAULT 25;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS pomodoro_short_break_minutes INT DEFAULT 5;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS pomodoro_long_break_minutes INT DEFAULT 15;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS pomodoro_sessions_before_long_break INT DEFAULT 4;

-- ============================================
-- DAILY POMODORO STATS IN DAILY_LOGS
-- ============================================
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS pomodoros_completed INT DEFAULT 0;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS focus_minutes INT DEFAULT 0;

-- ============================================
-- FUNCTION: Start Pomodoro
-- ============================================
CREATE OR REPLACE FUNCTION start_pomodoro(
  p_user_id UUID,
  p_task_id UUID DEFAULT NULL,
  p_duration_minutes INT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_duration INT;
  v_task_title TEXT;
  v_session_id UUID;
BEGIN
  -- Get duration from settings or use provided
  IF p_duration_minutes IS NULL THEN
    SELECT COALESCE(pomodoro_work_minutes, 25) INTO v_duration
    FROM user_profile WHERE user_id = p_user_id;
    
    IF v_duration IS NULL THEN v_duration := 25; END IF;
  ELSE
    v_duration := p_duration_minutes;
  END IF;

  -- Get task title if provided
  IF p_task_id IS NOT NULL THEN
    SELECT title INTO v_task_title FROM tasks WHERE id = p_task_id;
  END IF;

  -- Cancel any active sessions
  UPDATE pomodoro_sessions 
  SET status = 'cancelled', ended_at = NOW()
  WHERE user_id = p_user_id AND status = 'active';

  -- Create new session
  INSERT INTO pomodoro_sessions (user_id, task_id, task_title, duration_minutes, started_at)
  VALUES (p_user_id, p_task_id, v_task_title, v_duration, NOW())
  RETURNING id INTO v_session_id;

  RETURN json_build_object(
    'session_id', v_session_id,
    'duration_minutes', v_duration,
    'task_title', v_task_title,
    'ends_at', NOW() + (v_duration || ' minutes')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Complete Pomodoro
-- ============================================
CREATE OR REPLACE FUNCTION complete_pomodoro(
  p_user_id UUID,
  p_session_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_session RECORD;
  v_today DATE := CURRENT_DATE;
  v_total_today INT;
BEGIN
  -- Get the session (either by ID or the active one)
  IF p_session_id IS NOT NULL THEN
    SELECT * INTO v_session FROM pomodoro_sessions 
    WHERE id = p_session_id AND user_id = p_user_id;
  ELSE
    SELECT * INTO v_session FROM pomodoro_sessions 
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY started_at DESC LIMIT 1;
  END IF;

  IF v_session IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Keine aktive Session');
  END IF;

  -- Complete the session
  UPDATE pomodoro_sessions
  SET status = 'completed', ended_at = NOW()
  WHERE id = v_session.id;

  -- Update daily stats
  INSERT INTO daily_logs (user_id, date, pomodoros_completed, focus_minutes)
  VALUES (p_user_id, v_today, 1, v_session.duration_minutes)
  ON CONFLICT (user_id, date) DO UPDATE SET
    pomodoros_completed = daily_logs.pomodoros_completed + 1,
    focus_minutes = daily_logs.focus_minutes + v_session.duration_minutes;

  -- Get total for today
  SELECT pomodoros_completed INTO v_total_today
  FROM daily_logs WHERE user_id = p_user_id AND date = v_today;

  RETURN json_build_object(
    'success', true,
    'session_id', v_session.id,
    'duration_minutes', v_session.duration_minutes,
    'task_title', v_session.task_title,
    'total_today', v_total_today
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Active Pomodoro
-- ============================================
CREATE OR REPLACE FUNCTION get_active_pomodoro(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_session RECORD;
  v_remaining_seconds INT;
BEGIN
  SELECT * INTO v_session FROM pomodoro_sessions 
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY started_at DESC LIMIT 1;

  IF v_session IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate remaining time
  v_remaining_seconds := EXTRACT(EPOCH FROM (
    v_session.started_at + (v_session.duration_minutes || ' minutes')::INTERVAL - NOW()
  ))::INT;

  -- If time is up, return as expired
  IF v_remaining_seconds <= 0 THEN
    RETURN json_build_object(
      'session_id', v_session.id,
      'status', 'expired',
      'task_title', v_session.task_title,
      'duration_minutes', v_session.duration_minutes
    );
  END IF;

  RETURN json_build_object(
    'session_id', v_session.id,
    'status', 'active',
    'task_title', v_session.task_title,
    'duration_minutes', v_session.duration_minutes,
    'remaining_seconds', v_remaining_seconds,
    'started_at', v_session.started_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Pomodoro Stats
-- ============================================
CREATE OR REPLACE FUNCTION get_pomodoro_stats(
  p_user_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSON AS $$
DECLARE
  v_total_sessions INT;
  v_total_minutes INT;
  v_avg_per_day DECIMAL;
  v_today_sessions INT;
BEGIN
  -- Total in period
  SELECT 
    COUNT(*),
    COALESCE(SUM(duration_minutes), 0)
  INTO v_total_sessions, v_total_minutes
  FROM pomodoro_sessions
  WHERE user_id = p_user_id 
    AND status = 'completed'
    AND started_at > NOW() - (p_days || ' days')::INTERVAL;

  -- Average per day
  v_avg_per_day := v_total_sessions::DECIMAL / GREATEST(p_days, 1);

  -- Today
  SELECT COUNT(*) INTO v_today_sessions
  FROM pomodoro_sessions
  WHERE user_id = p_user_id 
    AND status = 'completed'
    AND DATE(started_at) = CURRENT_DATE;

  RETURN json_build_object(
    'period_days', p_days,
    'total_sessions', v_total_sessions,
    'total_minutes', v_total_minutes,
    'total_hours', ROUND(v_total_minutes / 60.0, 1),
    'avg_per_day', ROUND(v_avg_per_day, 1),
    'today_sessions', v_today_sessions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

