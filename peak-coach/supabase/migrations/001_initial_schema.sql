-- ============================================
-- PEAK COACH - Initial Database Schema
-- ============================================
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  timezone TEXT DEFAULT 'Europe/Berlin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PROFILE TABLE
-- ============================================
CREATE TABLE user_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Persönlichkeit
  chronotype TEXT DEFAULT 'neutral' CHECK (chronotype IN ('early_bird', 'night_owl', 'neutral')),
  personality_type TEXT,
  learning_style TEXT,
  
  -- Präferenzen
  work_hours_start TIME DEFAULT '09:00',
  work_hours_end TIME DEFAULT '18:00',
  deep_work_duration_min INT DEFAULT 90,
  
  -- Motivatoren
  motivators JSONB DEFAULT '[]',
  demotivators JSONB DEFAULT '[]',
  
  -- Coach Settings
  coach_style TEXT DEFAULT 'balanced' CHECK (coach_style IN ('tough', 'gentle', 'balanced')),
  notification_frequency TEXT DEFAULT 'normal' CHECK (notification_frequency IN ('low', 'normal', 'high')),
  
  -- Gamification
  current_level INT DEFAULT 1,
  total_xp INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GOALS TABLE
-- ============================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('career', 'health', 'learning', 'finance', 'relationships', 'personal')),
  
  -- Progress
  target_value DECIMAL,
  current_value DECIMAL DEFAULT 0,
  unit TEXT,
  
  -- Timing
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  estimated_minutes INT,
  
  -- Categorization
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  energy_required TEXT DEFAULT 'medium' CHECK (energy_required IN ('high', 'medium', 'low')),
  category TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'postponed')),
  completed_at TIMESTAMPTZ,
  
  -- Tracking
  times_postponed INT DEFAULT 0,
  skip_reason TEXT,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY LOGS TABLE
-- ============================================
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Morning Check-in
  morning_mood INT CHECK (morning_mood BETWEEN 1 AND 10),
  morning_energy INT CHECK (morning_energy BETWEEN 1 AND 10),
  sleep_hours DECIMAL,
  sleep_quality INT CHECK (sleep_quality BETWEEN 1 AND 10),
  morning_notes TEXT,
  
  -- Evening Review
  evening_mood INT CHECK (evening_mood BETWEEN 1 AND 10),
  evening_energy INT CHECK (evening_energy BETWEEN 1 AND 10),
  
  -- Reflection
  wins TEXT[],
  struggles TEXT[],
  grateful_for TEXT[],
  learnings TEXT,
  tomorrow_focus TEXT,
  
  -- Stats
  tasks_planned INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_skipped INT DEFAULT 0,
  productivity_score INT,
  
  -- Coach
  coach_morning_message TEXT,
  coach_evening_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- ============================================
-- HABITS TABLE
-- ============================================
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health', 'productivity', 'mindset', 'social')),
  
  -- Frequency
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'specific_days')),
  target_days TEXT[],
  
  -- Tracking
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  total_completions INT DEFAULT 0,
  
  -- Timing
  preferred_time TIME,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HABIT LOGS TABLE
-- ============================================
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(habit_id, date)
);

-- ============================================
-- LEARNINGS TABLE
-- ============================================
CREATE TABLE learnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  
  category TEXT,
  what_worked TEXT,
  what_didnt TEXT,
  key_insight TEXT NOT NULL,
  apply_to TEXT[],
  
  source TEXT CHECK (source IN ('daily_review', 'weekly_review', 'manual')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DECISIONS TABLE
-- ============================================
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  context TEXT,
  options JSONB,
  chosen_option TEXT,
  reasoning TEXT,
  gut_feeling INT CHECK (gut_feeling BETWEEN 1 AND 10),
  
  -- Review
  review_date DATE,
  review_completed BOOLEAN DEFAULT FALSE,
  review_rating INT CHECK (review_rating BETWEEN 1 AND 10),
  review_notes TEXT,
  would_do_again BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COACH MESSAGES TABLE
-- ============================================
CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  message_type TEXT CHECK (message_type IN ('morning', 'evening', 'intervention', 'motivation', 'warning', 'celebration')),
  content TEXT NOT NULL,
  
  -- Context
  trigger_reason TEXT,
  context_data JSONB,
  
  -- Delivery
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  platform TEXT CHECK (platform IN ('telegram', 'web')),
  
  -- Response
  user_response TEXT,
  response_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEEKLY REVIEWS TABLE
-- ============================================
CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- Aggregated Stats
  avg_mood DECIMAL,
  avg_energy DECIMAL,
  avg_sleep DECIMAL,
  total_tasks_planned INT,
  total_tasks_completed INT,
  completion_rate DECIMAL,
  
  -- Goal Progress
  goal_progress JSONB,
  
  -- Patterns
  best_day TEXT,
  worst_day TEXT,
  patterns_detected JSONB,
  
  -- Reflection
  key_wins TEXT[],
  key_struggles TEXT[],
  main_learning TEXT,
  next_week_focus TEXT,
  
  -- Coach Analysis
  coach_analysis TEXT,
  recommendations JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, week_start)
);

-- ============================================
-- ACCOUNTABILITY STAKES TABLE
-- ============================================
CREATE TABLE accountability_stakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  stake_type TEXT CHECK (stake_type IN ('financial', 'social', 'commitment')),
  description TEXT,
  
  -- For financial stakes
  amount_cents INT,
  currency TEXT DEFAULT 'EUR',
  recipient TEXT CHECK (recipient IN ('charity', 'anti_charity', 'friend')),
  recipient_details TEXT,
  
  -- Conditions
  goal_id UUID REFERENCES goals(id),
  habit_id UUID REFERENCES habits(id),
  condition_description TEXT,
  deadline DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
  triggered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_tasks_user_date ON tasks(user_id, scheduled_date);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date);
CREATE INDEX idx_habits_user_active ON habits(user_id, is_active);
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_coach_messages_user ON coach_messages(user_id, created_at DESC);
CREATE INDEX idx_users_telegram ON users(telegram_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_stakes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update habit streak
CREATE OR REPLACE FUNCTION update_habit_streak(p_habit_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_streak INT := 0;
  v_date DATE := CURRENT_DATE;
  v_has_completion BOOLEAN;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id FROM habits WHERE id = p_habit_id;
  
  -- Count consecutive days with completions
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM habit_logs 
      WHERE habit_id = p_habit_id 
      AND date = v_date 
      AND completed = true
    ) INTO v_has_completion;
    
    IF v_has_completion THEN
      v_streak := v_streak + 1;
      v_date := v_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  -- Update habit
  UPDATE habits 
  SET 
    current_streak = v_streak,
    best_streak = GREATEST(best_streak, v_streak),
    total_completions = total_completions + 1,
    updated_at = NOW()
  WHERE id = p_habit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON user_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE!
-- ============================================

