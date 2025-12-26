-- ============================================
-- PEAK COACH - Unified Actions System
-- Migration 016
-- ============================================
-- 
-- Ein einheitliches System für alle Actions:
-- - Aus Akademie-Modulen (Implementation Intentions)
-- - Aus Büchern (Buch-Actions)
-- - Manuell erstellt
--
-- User-ID: auth.users(id) - konsistent mit Learning-System
-- ============================================

-- ============================================
-- 1. ACTIONS TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Referenz
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Source Tracking (woher kommt die Action?)
    source_type TEXT NOT NULL CHECK (source_type IN ('module', 'book', 'manual', 'video')),
    source_id TEXT,  -- module_id, book_id, etc.
    source_title TEXT,  -- "Modul: Die Macht der Pause" oder "Buch: Das Harvard-Konzept"
    source_page TEXT,  -- Für Bücher: Seitenzahl
    
    -- Optionale Verknüpfungen
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES goal_skills(id) ON DELETE SET NULL,
    
    -- Implementation Intention
    action_title TEXT NOT NULL,  -- Kurzer Titel
    action_description TEXT,  -- Ausführliche Beschreibung
    trigger_situation TEXT,  -- "WENN..." (die Situation)
    intended_behavior TEXT,  -- "DANN..." (das Verhalten)
    success_metric TEXT,  -- Wie messe ich Erfolg?
    
    -- Timing
    timing_type TEXT DEFAULT 'opportunity' CHECK (timing_type IN (
        'specific',    -- Konkretes Datum
        'daily',       -- Täglich
        'weekly',      -- Wöchentlich
        'opportunity'  -- Bei Gelegenheit
    )),
    due_date DATE,
    due_time TIME,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    
    -- Für "opportunity" timing
    max_days_until_check INT DEFAULT 7,  -- Nach X Tagen nachfragen
    check_in_days INT[] DEFAULT ARRAY[2, 5],  -- Tage für Check-ins
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',     -- Offen
        'completed',   -- Erledigt
        'skipped',     -- Übersprungen
        'archived'     -- Archiviert (nach 7 Tagen ohne Aktion)
    )),
    
    -- Completion Data
    completed_at TIMESTAMP WITH TIME ZONE,
    skipped_at TIMESTAMP WITH TIME ZONE,
    skip_reason TEXT,
    
    -- Feedback (nach Completion)
    effectiveness_rating INT CHECK (effectiveness_rating BETWEEN 1 AND 5),
    reflection_note TEXT,
    would_repeat BOOLEAN,  -- Würdest du das wiederholen?
    
    -- Tracking
    reminder_count INT DEFAULT 0,
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE actions IS 'Unified Actions System für Module, Bücher und manuelle Actions';
COMMENT ON COLUMN actions.trigger_situation IS 'WENN-Teil der Implementation Intention';
COMMENT ON COLUMN actions.intended_behavior IS 'DANN-Teil der Implementation Intention';

-- ============================================
-- 2. ACTION REMINDERS LOG
-- ============================================
-- Trackt wann welche Reminder gesendet wurden

CREATE TABLE IF NOT EXISTS action_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    reminder_type TEXT NOT NULL CHECK (reminder_type IN (
        'due_today',       -- Heute fällig
        'gentle_followup', -- Sanfter Check nach 2 Tagen
        'adjust_prompt',   -- Nach 5 Tagen: Anpassen?
        'archive_warning'  -- Vor Auto-Archivierung
    )),
    
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    response TEXT  -- User-Antwort falls vorhanden
);

COMMENT ON TABLE action_reminders IS 'Log aller gesendeten Action-Reminders';

-- ============================================
-- 3. ACTION STATISTICS VIEW
-- ============================================
-- Aggregierte Statistiken pro User

CREATE OR REPLACE VIEW action_statistics AS
SELECT 
    user_id,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE status = 'skipped') AS skipped_count,
    COUNT(*) FILTER (WHERE status = 'archived') AS archived_count,
    COUNT(*) AS total_count,
    
    -- Completion Rate
    CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('completed', 'skipped')) > 0
        THEN ROUND(
            100.0 * COUNT(*) FILTER (WHERE status = 'completed') / 
            COUNT(*) FILTER (WHERE status IN ('completed', 'skipped')),
            1
        )
        ELSE 0
    END AS completion_rate,
    
    -- Durchschnittliche Effektivität
    ROUND(AVG(effectiveness_rating) FILTER (WHERE effectiveness_rating IS NOT NULL), 1) AS avg_effectiveness,
    
    -- Diese Woche
    COUNT(*) FILTER (
        WHERE status = 'completed' 
        AND completed_at >= date_trunc('week', CURRENT_DATE)
    ) AS completed_this_week,
    
    -- Überfällig
    COUNT(*) FILTER (
        WHERE status = 'pending' 
        AND due_date < CURRENT_DATE
    ) AS overdue_count

FROM actions
GROUP BY user_id;

COMMENT ON VIEW action_statistics IS 'Aggregierte Action-Statistiken pro User';

-- ============================================
-- 4. INDIZES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_actions_user_status ON actions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_actions_user_pending ON actions(user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON actions(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_actions_source ON actions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_actions_goal ON actions(goal_id) WHERE goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_created ON actions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_reminders_action ON action_reminders(action_id);
CREATE INDEX IF NOT EXISTS idx_action_reminders_user ON action_reminders(user_id);

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_reminders ENABLE ROW LEVEL SECURITY;

-- Actions Policies
DROP POLICY IF EXISTS "Users can view their own actions" ON actions;
CREATE POLICY "Users can view their own actions" ON actions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own actions" ON actions;
CREATE POLICY "Users can insert their own actions" ON actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own actions" ON actions;
CREATE POLICY "Users can update their own actions" ON actions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own actions" ON actions;
CREATE POLICY "Users can delete their own actions" ON actions
    FOR DELETE USING (auth.uid() = user_id);

-- Action Reminders Policies
DROP POLICY IF EXISTS "Users can view their own reminders" ON action_reminders;
CREATE POLICY "Users can view their own reminders" ON action_reminders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. TRIGGER: UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_actions_updated_at ON actions;
CREATE TRIGGER update_actions_updated_at 
    BEFORE UPDATE ON actions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. FUNKTIONEN
-- ============================================

-- Funktion: Hole fällige Actions für einen User
CREATE OR REPLACE FUNCTION get_due_actions(p_user_id UUID)
RETURNS TABLE (
    action_id UUID,
    action_title TEXT,
    source_type TEXT,
    source_title TEXT,
    trigger_situation TEXT,
    due_date DATE,
    days_overdue INT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS action_id,
        a.action_title,
        a.source_type,
        a.source_title,
        a.trigger_situation,
        a.due_date,
        (CURRENT_DATE - a.due_date)::INT AS days_overdue,
        CASE
            WHEN a.due_date < CURRENT_DATE THEN 'overdue'
            WHEN a.due_date = CURRENT_DATE THEN 'today'
            WHEN a.due_date = CURRENT_DATE + 1 THEN 'tomorrow'
            ELSE 'upcoming'
        END AS priority
    FROM actions a
    WHERE a.user_id = p_user_id
    AND a.status = 'pending'
    AND (
        a.due_date <= CURRENT_DATE + 1  -- Heute, überfällig, morgen
        OR (
            a.timing_type = 'opportunity' 
            AND a.created_at < NOW() - INTERVAL '2 days'  -- Bei Gelegenheit, älter als 2 Tage
        )
    )
    ORDER BY 
        CASE 
            WHEN a.due_date < CURRENT_DATE THEN 1  -- Überfällig zuerst
            WHEN a.due_date = CURRENT_DATE THEN 2  -- Heute
            ELSE 3
        END,
        a.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Markiere Action als erledigt
CREATE OR REPLACE FUNCTION complete_action(
    p_action_id UUID,
    p_user_id UUID,
    p_effectiveness INT DEFAULT NULL,
    p_reflection TEXT DEFAULT NULL,
    p_would_repeat BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE actions
    SET 
        status = 'completed',
        completed_at = NOW(),
        effectiveness_rating = p_effectiveness,
        reflection_note = p_reflection,
        would_repeat = p_would_repeat,
        updated_at = NOW()
    WHERE id = p_action_id
    AND user_id = p_user_id
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Auto-Archive überfällige Actions
CREATE OR REPLACE FUNCTION auto_archive_overdue_actions()
RETURNS INT AS $$
DECLARE
    archived_count INT;
BEGIN
    WITH archived AS (
        UPDATE actions
        SET 
            status = 'archived',
            updated_at = NOW()
        WHERE status = 'pending'
        AND (
            -- Spezifisches Datum: 7 Tage überfällig
            (timing_type = 'specific' AND due_date < CURRENT_DATE - 7)
            OR
            -- Bei Gelegenheit: 14 Tage alt ohne Aktion
            (timing_type = 'opportunity' AND created_at < NOW() - INTERVAL '14 days')
        )
        RETURNING id
    )
    SELECT COUNT(*) INTO archived_count FROM archived;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Erstelle Action aus Modul
CREATE OR REPLACE FUNCTION create_action_from_module(
    p_user_id UUID,
    p_module_id TEXT,
    p_module_title TEXT,
    p_goal_id UUID,
    p_skill_id UUID,
    p_action_title TEXT,
    p_trigger_situation TEXT,
    p_intended_behavior TEXT,
    p_timing_type TEXT DEFAULT 'opportunity',
    p_due_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_action_id UUID;
BEGIN
    INSERT INTO actions (
        user_id,
        source_type,
        source_id,
        source_title,
        goal_id,
        skill_id,
        action_title,
        trigger_situation,
        intended_behavior,
        timing_type,
        due_date
    ) VALUES (
        p_user_id,
        'module',
        p_module_id,
        'Modul: ' || p_module_title,
        p_goal_id,
        p_skill_id,
        p_action_title,
        p_trigger_situation,
        p_intended_behavior,
        p_timing_type,
        p_due_date
    )
    RETURNING id INTO v_action_id;
    
    RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. CONSTRAINTS
-- ============================================

-- Stelle sicher dass bei "specific" timing ein due_date gesetzt ist
ALTER TABLE actions ADD CONSTRAINT check_specific_timing_has_date
    CHECK (timing_type != 'specific' OR due_date IS NOT NULL);

-- Action-Limits pro User (max 10 pending)
-- Hinweis: Wird in der API enforced, nicht als DB-Constraint

-- ============================================
-- DONE!
-- ============================================

