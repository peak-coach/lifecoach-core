-- ============================================
-- PEAK COACH - Grace Days & Sleep Optimization
-- ============================================
-- Run this migration in Supabase SQL Editor

-- ============================================
-- ADD is_grace_day to daily_logs
-- ============================================
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS is_grace_day BOOLEAN DEFAULT false;

-- ============================================
-- ADD why_important to goals (Why Reinforcement)
-- ============================================
ALTER TABLE goals ADD COLUMN IF NOT EXISTS why_important TEXT;

-- ============================================
-- FUNCTION: Set Grace Day
-- ============================================
CREATE OR REPLACE FUNCTION set_grace_day(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_grace_used INT;
  v_grace_limit INT;
  v_log_id UUID;
BEGIN
  -- Check grace days limit
  SELECT grace_days_used, grace_days_per_month 
  INTO v_grace_used, v_grace_limit
  FROM user_profile 
  WHERE user_id = p_user_id;

  -- Reset grace days if new month
  IF v_grace_used IS NULL THEN
    v_grace_used := 0;
    v_grace_limit := 2;
  END IF;

  -- Check if limit reached
  IF v_grace_used >= v_grace_limit THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Grace Day Limit erreicht (' || v_grace_limit || '/Monat)'
    );
  END IF;

  -- Upsert today's log with grace day
  INSERT INTO daily_logs (user_id, date, is_grace_day)
  VALUES (p_user_id, v_today, true)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET is_grace_day = true
  RETURNING id INTO v_log_id;

  -- Increment grace days used
  UPDATE user_profile 
  SET grace_days_used = grace_days_used + 1
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Grace Day aktiviert! Heute ist Scheitern okay.',
    'grace_days_remaining', v_grace_limit - v_grace_used - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Sleep Recommendation
-- ============================================
CREATE OR REPLACE FUNCTION get_sleep_recommendation(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_sleep_goal DECIMAL;
  v_avg_sleep DECIMAL;
  v_sleep_debt DECIMAL;
  v_recommendation TEXT;
  v_bedtime TIME;
  v_wake_time TIME;
BEGIN
  -- Get user's sleep goal
  SELECT COALESCE(sleep_goal_hours, 7.5), work_hours_start
  INTO v_sleep_goal, v_wake_time
  FROM user_profile
  WHERE user_id = p_user_id;

  IF v_sleep_goal IS NULL THEN
    v_sleep_goal := 7.5;
  END IF;

  IF v_wake_time IS NULL THEN
    v_wake_time := '07:00'::TIME;
  END IF;

  -- Calculate average sleep from last 7 days
  SELECT AVG(sleep_hours)
  INTO v_avg_sleep
  FROM daily_logs
  WHERE user_id = p_user_id 
    AND date > CURRENT_DATE - INTERVAL '7 days'
    AND sleep_hours IS NOT NULL;

  IF v_avg_sleep IS NULL THEN
    v_avg_sleep := v_sleep_goal;
  END IF;

  -- Calculate sleep debt
  v_sleep_debt := (v_sleep_goal - v_avg_sleep) * 7;

  -- Calculate recommended bedtime (subtract sleep goal from wake time)
  v_bedtime := v_wake_time - (v_sleep_goal || ' hours')::INTERVAL;

  -- Generate recommendation
  IF v_sleep_debt > 3 THEN
    v_recommendation := 'Du hast ein Schlafdefizit! Versuche heute 30 Min früher ins Bett zu gehen.';
  ELSIF v_sleep_debt > 0 THEN
    v_recommendation := 'Leichtes Schlafdefizit. Halte dich an deine Schlafenszeit.';
  ELSE
    v_recommendation := 'Super! Dein Schlaf ist im grünen Bereich.';
  END IF;

  RETURN json_build_object(
    'sleep_goal', v_sleep_goal,
    'avg_sleep_7d', ROUND(v_avg_sleep::NUMERIC, 1),
    'sleep_debt_hours', ROUND(GREATEST(v_sleep_debt, 0)::NUMERIC, 1),
    'recommended_bedtime', v_bedtime::TEXT,
    'recommended_wake', v_wake_time::TEXT,
    'recommendation', v_recommendation,
    'cycles', FLOOR(v_sleep_goal / 1.5) -- 90-min sleep cycles
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE get_today_status to include grace day
-- ============================================
CREATE OR REPLACE FUNCTION get_today_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_log RECORD;
  v_tasks_completed INT;
  v_tasks_total INT;
  v_habits_completed INT;
  v_habits_total INT;
BEGIN
  -- Get today's log
  SELECT * INTO v_log
  FROM daily_logs
  WHERE user_id = p_user_id AND date = v_today;

  -- Count tasks
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*)
  INTO v_tasks_completed, v_tasks_total
  FROM tasks
  WHERE user_id = p_user_id AND scheduled_date = v_today;

  -- Count habits
  SELECT COUNT(*) INTO v_habits_total
  FROM habits
  WHERE user_id = p_user_id AND is_active = true;

  SELECT COUNT(*) INTO v_habits_completed
  FROM habit_logs
  WHERE user_id = p_user_id AND date = v_today AND completed = true;

  RETURN json_build_object(
    'date', v_today,
    'day_type', COALESCE(v_log.day_type, 'normal'),
    'work_status', COALESCE(v_log.work_status, 'not_started'),
    'is_grace_day', COALESCE(v_log.is_grace_day, false),
    'work_started_at', v_log.work_started_at,
    'work_ended_at', v_log.work_ended_at,
    'total_work_minutes', COALESCE(v_log.total_work_minutes, 0),
    'morning_energy', v_log.morning_energy,
    'morning_mood', v_log.morning_mood,
    'sleep_hours', v_log.sleep_hours,
    'tasks_completed', v_tasks_completed,
    'tasks_total', v_tasks_total,
    'habits_completed', v_habits_completed,
    'habits_total', v_habits_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS push_morning_reminder BOOLEAN DEFAULT true;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS push_evening_reminder BOOLEAN DEFAULT true;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS push_habit_reminder BOOLEAN DEFAULT true;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS push_coach_insights BOOLEAN DEFAULT true;

-- ============================================
-- CRON: Reset grace days monthly
-- ============================================
-- Run this manually at month start or set up pg_cron:
-- UPDATE user_profile SET grace_days_used = 0;

