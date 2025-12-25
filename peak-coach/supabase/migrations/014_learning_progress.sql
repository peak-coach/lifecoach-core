-- ============================================
-- LEARNING PROGRESS & SPACED REPETITION
-- ============================================

-- Goal Learning Progress: Track which module was completed for each goal
CREATE TABLE IF NOT EXISTS goal_learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    current_module INT DEFAULT 1 NOT NULL,
    last_module_completed INT DEFAULT 0 NOT NULL,
    last_quiz_score INT DEFAULT 0,
    total_modules_completed INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, goal_id)
);

ALTER TABLE goal_learning_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own goal progress." ON goal_learning_progress;
CREATE POLICY "Users can manage their own goal progress." ON goal_learning_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goal_learning_progress_user ON goal_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_learning_progress_goal ON goal_learning_progress(goal_id);

-- Learning Actions: Track action commitments for transfer follow-up
CREATE TABLE IF NOT EXISTS learning_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    module_id TEXT,
    action_task TEXT NOT NULL,
    follow_up_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'skipped'
    completed_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    rating INT, -- 1-5 stars
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE learning_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own actions." ON learning_actions;
CREATE POLICY "Users can manage their own actions." ON learning_actions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_actions_user ON learning_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_actions_status ON learning_actions(status);
CREATE INDEX IF NOT EXISTS idx_learning_actions_follow_up ON learning_actions(follow_up_date);

-- Learning Activity: Track all learning events
CREATE TABLE IF NOT EXISTS learning_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL, -- 'module_started', 'module_completed', 'review_completed', 'action_completed'
    module_id TEXT,
    path_id UUID,
    duration_minutes INT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE learning_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own activity." ON learning_activity;
CREATE POLICY "Users can manage their own activity." ON learning_activity
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_activity_user ON learning_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activity_created ON learning_activity(created_at);

-- Update spaced_repetition table to include goal_id and review questions
ALTER TABLE spaced_repetition ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE spaced_repetition ADD COLUMN IF NOT EXISTS review_questions JSONB;
ALTER TABLE spaced_repetition ADD COLUMN IF NOT EXISTS module_title TEXT;
ALTER TABLE spaced_repetition ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE spaced_repetition ADD COLUMN IF NOT EXISTS concept TEXT;
ALTER TABLE spaced_repetition ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Fix: Change module_id from UUID to TEXT (we generate dynamic modules without DB storage)
-- First drop the foreign key constraint if exists
ALTER TABLE spaced_repetition DROP CONSTRAINT IF EXISTS spaced_repetition_module_id_fkey;
-- Then change the column type
ALTER TABLE spaced_repetition ALTER COLUMN module_id TYPE TEXT USING module_id::TEXT;

-- Update learning_settings with new fields
ALTER TABLE learning_settings ADD COLUMN IF NOT EXISTS total_reviews_completed INT DEFAULT 0;
ALTER TABLE learning_settings ADD COLUMN IF NOT EXISTS total_actions_completed INT DEFAULT 0;
ALTER TABLE learning_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add transfer verification columns to learning_activity
ALTER TABLE learning_activity ADD COLUMN IF NOT EXISTS transfer_verified BOOLEAN DEFAULT NULL;
ALTER TABLE learning_activity ADD COLUMN IF NOT EXISTS transfer_applied BOOLEAN DEFAULT NULL;
ALTER TABLE learning_activity ADD COLUMN IF NOT EXISTS transfer_notes TEXT;
ALTER TABLE learning_activity ADD COLUMN IF NOT EXISTS transfer_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE learning_activity ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix: Change module_id in learning_activity from UUID to TEXT (dynamic modules have no DB entry)
ALTER TABLE learning_activity DROP CONSTRAINT IF EXISTS learning_activity_module_id_fkey;
ALTER TABLE learning_activity ALTER COLUMN module_id TYPE TEXT USING module_id::TEXT;

-- Fix: Change path_id constraint (optional, paths might not exist)
ALTER TABLE learning_activity DROP CONSTRAINT IF EXISTS learning_activity_path_id_fkey;

-- ============================================
-- HELPFUL FUNCTIONS
-- ============================================

-- Function to get next module number for a goal
CREATE OR REPLACE FUNCTION get_next_module_for_goal(p_user_id UUID, p_goal_id UUID)
RETURNS INT AS $$
DECLARE
    next_module INT;
BEGIN
    SELECT COALESCE(current_module, 1) INTO next_module
    FROM goal_learning_progress
    WHERE user_id = p_user_id AND goal_id = p_goal_id;
    
    IF next_module IS NULL THEN
        RETURN 1;
    END IF;
    
    RETURN next_module;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending reviews count
CREATE OR REPLACE FUNCTION get_pending_reviews_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    count INT;
BEGIN
    SELECT COUNT(*) INTO count
    FROM spaced_repetition
    WHERE user_id = p_user_id
    AND next_review_date <= CURRENT_DATE;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Function to update review after completion (Spaced Repetition algorithm)
CREATE OR REPLACE FUNCTION complete_review(
    p_user_id UUID, 
    p_module_id TEXT, 
    p_score INT -- 1-5, where 5 is perfect recall
)
RETURNS VOID AS $$
DECLARE
    current_interval INT;
    current_ease NUMERIC;
    new_interval INT;
    new_ease NUMERIC;
BEGIN
    -- Get current values
    SELECT interval_days, ease_factor INTO current_interval, current_ease
    FROM spaced_repetition
    WHERE user_id = p_user_id AND module_id = p_module_id;
    
    -- SM-2 Algorithm (simplified)
    IF p_score < 3 THEN
        -- Failed recall, reset interval
        new_interval := 1;
        new_ease := GREATEST(1.3, current_ease - 0.2);
    ELSE
        -- Successful recall
        IF current_interval = 1 THEN
            new_interval := 3;
        ELSIF current_interval = 3 THEN
            new_interval := 7;
        ELSE
            new_interval := ROUND(current_interval * current_ease);
        END IF;
        
        new_ease := current_ease + (0.1 - (5 - p_score) * (0.08 + (5 - p_score) * 0.02));
        new_ease := GREATEST(1.3, new_ease);
    END IF;
    
    -- Update the record
    UPDATE spaced_repetition
    SET 
        interval_days = new_interval,
        ease_factor = new_ease,
        repetitions = repetitions + 1,
        next_review_date = CURRENT_DATE + new_interval,
        last_reviewed_at = NOW()
    WHERE user_id = p_user_id AND module_id = p_module_id;
    
    -- Update learning settings
    UPDATE learning_settings
    SET total_reviews_completed = total_reviews_completed + 1
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

