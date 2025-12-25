-- ============================================
-- PEAK COACH - Gamification & XP System
-- Psychologische Optimierung für Motivation
-- ============================================

-- XP Events Table (tracks all XP gains)
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'task_completed', 'habit_completed', 'streak_day', 'milestone_reached', 'goal_completed'
  xp_amount INTEGER NOT NULL,
  description TEXT,
  related_id UUID, -- ID of task/habit/goal that triggered XP
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Gamification Stats
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 100,
  
  -- Badges (JSON array of badge IDs)
  badges JSONB DEFAULT '[]'::jsonb,
  
  -- Stats
  tasks_completed_total INTEGER DEFAULT 0,
  habits_completed_total INTEGER DEFAULT 0,
  goals_completed_total INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  perfect_days INTEGER DEFAULT 0, -- Days where all habits completed
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for xp_events
CREATE POLICY "Users can view own xp_events" ON xp_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp_events" ON xp_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_gamification
CREATE POLICY "Users can view own gamification" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created ON xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user ON user_gamification(user_id);

-- ============================================
-- XP CONSTANTS (in code, for reference)
-- ============================================
-- Task completed: +10 XP
-- Habit completed: +15 XP
-- Streak day: +20 XP (bonus)
-- Milestone reached: +50 XP
-- Goal completed: +100 XP
-- Perfect day (all habits): +30 XP bonus

-- ============================================
-- LEVEL THRESHOLDS
-- ============================================
-- Level 1: 0 XP (Start)
-- Level 2: 100 XP
-- Level 3: 250 XP
-- Level 4: 500 XP
-- Level 5: 1000 XP
-- Level 6: 2000 XP
-- Level 7: 3500 XP
-- Level 8: 5500 XP
-- Level 9: 8000 XP
-- Level 10: 12000 XP (Max / "Peak Performer")

-- ============================================
-- BADGE DEFINITIONS (in code)
-- ============================================
-- first_task: "Erster Schritt" - Complete first task
-- streak_7: "Woche des Fokus" - 7-day streak
-- streak_30: "Monat der Konsistenz" - 30-day streak
-- streak_100: "Unaufhaltsam" - 100-day streak
-- level_5: "Fokus Master" - Reach level 5
-- level_10: "Peak Performer" - Reach level 10
-- perfect_week: "Perfekte Woche" - 7 perfect days
-- goal_crusher: "Ziel-Crusher" - Complete 5 goals
-- early_bird: "Frühaufsteher" - Complete task before 7am
-- night_owl: "Nachteule" - Complete task after 10pm

-- Function to initialize gamification for new users
CREATE OR REPLACE FUNCTION initialize_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create gamification record for new users
DROP TRIGGER IF EXISTS on_auth_user_created_gamification ON auth.users;
CREATE TRIGGER on_auth_user_created_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_gamification();

