-- ============================================
-- 011: Goal Hierarchy (Lang/Kurz/Sprint)
-- ============================================

-- Add goal_type column
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'long';

-- Add parent_goal_id for hierarchical goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- Add timeframe for automatic categorization
ALTER TABLE goals ADD COLUMN IF NOT EXISTS timeframe TEXT;

-- Add constraint for valid goal types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goals_type_check') THEN
        ALTER TABLE goals ADD CONSTRAINT goals_type_check 
        CHECK (goal_type IN ('long', 'short', 'sprint'));
    END IF;
END $$;

-- Add constraint for valid timeframes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goals_timeframe_check') THEN
        ALTER TABLE goals ADD CONSTRAINT goals_timeframe_check 
        CHECK (timeframe IS NULL OR timeframe IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));
    END IF;
END $$;

-- Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(goal_type);

-- Function to get goal hierarchy
CREATE OR REPLACE FUNCTION get_goal_hierarchy(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    goal_type TEXT,
    parent_goal_id UUID,
    depth INT,
    path TEXT[]
) 
LANGUAGE SQL
STABLE
AS $$
    WITH RECURSIVE goal_tree AS (
        -- Root goals (no parent)
        SELECT 
            g.id,
            g.title,
            g.goal_type,
            g.parent_goal_id,
            0 as depth,
            ARRAY[g.id::TEXT] as path
        FROM goals g
        WHERE g.user_id = p_user_id 
          AND g.parent_goal_id IS NULL
          AND g.status = 'active'
        
        UNION ALL
        
        -- Child goals
        SELECT 
            g.id,
            g.title,
            g.goal_type,
            g.parent_goal_id,
            gt.depth + 1,
            gt.path || g.id::TEXT
        FROM goals g
        JOIN goal_tree gt ON g.parent_goal_id = gt.id
        WHERE g.status = 'active'
    )
    SELECT * FROM goal_tree ORDER BY path;
$$;

COMMENT ON COLUMN goals.goal_type IS 'long = 3-12+ months, short = 1-4 weeks, sprint = 1-7 days';
COMMENT ON COLUMN goals.parent_goal_id IS 'Reference to parent goal for hierarchy';

