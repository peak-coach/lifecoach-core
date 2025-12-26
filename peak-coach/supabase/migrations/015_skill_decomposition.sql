-- ============================================
-- PEAK COACH AKADEMIE - Skill Decomposition
-- Migration 015
-- ============================================
-- 
-- Dieses System ermöglicht:
-- 1. Ziele in Sub-Skills aufzubrechen (KI-generiert)
-- 2. Fortschritt pro Skill zu tracken
-- 3. Schwächen zu identifizieren für Deliberate Practice
--
-- User-ID: auth.users(id) - konsistent mit Learning-System
-- ============================================

-- ============================================
-- 1. GOAL SKILLS TABELLE
-- ============================================
-- Speichert die Skill-Hierarchie pro Ziel

CREATE TABLE IF NOT EXISTS goal_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referenzen
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Skill-Hierarchie
    skill_name TEXT NOT NULL,
    skill_description TEXT,
    skill_category TEXT,  -- z.B. 'Content', 'Delivery', 'Mindset'
    parent_skill_id UUID REFERENCES goal_skills(id) ON DELETE CASCADE,
    skill_order INT DEFAULT 0,
    
    -- Schwierigkeit & Schätzung
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_modules INT DEFAULT 3,
    
    -- Fortschritt
    completed_modules INT DEFAULT 0,
    mastery_level INT DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
    
    -- Analyse
    is_weakness BOOLEAN DEFAULT FALSE,
    weakness_reason TEXT,  -- Warum ist das eine Schwäche?
    
    -- Timestamps
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kommentar für Dokumentation
COMMENT ON TABLE goal_skills IS 'Skill-Hierarchie pro Ziel für Deliberate Practice';
COMMENT ON COLUMN goal_skills.mastery_level IS '0-100 Prozent, basierend auf Quiz-Scores';
COMMENT ON COLUMN goal_skills.is_weakness IS 'TRUE wenn Mastery < 50% oder Quiz-Scores niedrig';

-- ============================================
-- 2. MODULE-SKILL MAPPING
-- ============================================
-- Verknüpft abgeschlossene Module mit Skills

CREATE TABLE IF NOT EXISTS module_skill_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referenzen
    module_id TEXT NOT NULL,  -- Dynamische Module haben Text-IDs
    skill_id UUID REFERENCES goal_skills(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    
    -- Ergebnisse
    quiz_score INT CHECK (quiz_score BETWEEN 0 AND 100),
    confidence_avg DECIMAL(3,2),  -- Durchschnittliche Confidence 1-4
    time_spent_minutes INT,
    
    -- Pre-Test vs Post-Test Vergleich
    pretest_correct BOOLEAN,
    posttest_score INT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE module_skill_mapping IS 'Verknüpft Module mit Skills für Mastery-Tracking';

-- ============================================
-- 3. SKILL TEMPLATES
-- ============================================
-- Vordefinierte Skill-Strukturen für Konsistenz

CREATE TABLE IF NOT EXISTS skill_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Kategorisierung
    goal_category TEXT NOT NULL,  -- z.B. 'presentation', 'leadership'
    goal_keywords TEXT[],  -- Keywords die zu diesem Template passen
    
    -- Template-Struktur
    template_name TEXT NOT NULL,
    skill_structure JSONB NOT NULL,  -- Hierarchische Skill-Struktur
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE skill_templates IS 'Vordefinierte Skill-Strukturen für konsistente KI-Generierung';

-- Beispiel-Template für Präsentationen einfügen
INSERT INTO skill_templates (goal_category, goal_keywords, template_name, skill_structure) VALUES
(
    'presentation',
    ARRAY['präsentation', 'vortrag', 'reden', 'sprechen', 'pitch', 'public speaking'],
    'Präsentations-Skills',
    '{
        "categories": [
            {
                "name": "Content",
                "description": "Inhalt und Struktur",
                "skills": [
                    {"name": "Storytelling", "difficulty": "intermediate", "modules": 3},
                    {"name": "Hook erstellen", "difficulty": "beginner", "modules": 2},
                    {"name": "Struktur (3-Akt)", "difficulty": "beginner", "modules": 2},
                    {"name": "Call-to-Action", "difficulty": "beginner", "modules": 2}
                ]
            },
            {
                "name": "Delivery",
                "description": "Präsentation und Auftreten",
                "skills": [
                    {"name": "Stimmführung", "difficulty": "intermediate", "modules": 3},
                    {"name": "Pausen setzen", "difficulty": "beginner", "modules": 2},
                    {"name": "Körpersprache", "difficulty": "intermediate", "modules": 3},
                    {"name": "Blickkontakt", "difficulty": "beginner", "modules": 2}
                ]
            },
            {
                "name": "Mindset",
                "description": "Mentale Vorbereitung",
                "skills": [
                    {"name": "Nervosität managen", "difficulty": "intermediate", "modules": 4},
                    {"name": "Selbstvertrauen", "difficulty": "advanced", "modules": 4},
                    {"name": "Vorbereitung", "difficulty": "beginner", "modules": 2}
                ]
            }
        ]
    }'::JSONB
),
(
    'leadership',
    ARRAY['führung', 'leader', 'team', 'management', 'chef', 'vorgesetzter'],
    'Leadership-Skills',
    '{
        "categories": [
            {
                "name": "Communication",
                "description": "Kommunikation als Leader",
                "skills": [
                    {"name": "Feedback geben", "difficulty": "intermediate", "modules": 3},
                    {"name": "Aktives Zuhören", "difficulty": "beginner", "modules": 2},
                    {"name": "Schwierige Gespräche", "difficulty": "advanced", "modules": 4},
                    {"name": "Vision kommunizieren", "difficulty": "intermediate", "modules": 3}
                ]
            },
            {
                "name": "Decision Making",
                "description": "Entscheidungsfindung",
                "skills": [
                    {"name": "Priorisierung", "difficulty": "intermediate", "modules": 3},
                    {"name": "Delegation", "difficulty": "intermediate", "modules": 3},
                    {"name": "Risikobewertung", "difficulty": "advanced", "modules": 3}
                ]
            },
            {
                "name": "Team Building",
                "description": "Team aufbauen und führen",
                "skills": [
                    {"name": "Motivation", "difficulty": "intermediate", "modules": 3},
                    {"name": "Konflikte lösen", "difficulty": "advanced", "modules": 4},
                    {"name": "Vertrauen aufbauen", "difficulty": "intermediate", "modules": 3}
                ]
            }
        ]
    }'::JSONB
),
(
    'negotiation',
    ARRAY['verhandlung', 'verhandeln', 'deal', 'harvard', 'konflikt'],
    'Verhandlungs-Skills',
    '{
        "categories": [
            {
                "name": "Preparation",
                "description": "Vorbereitung",
                "skills": [
                    {"name": "BATNA entwickeln", "difficulty": "intermediate", "modules": 3},
                    {"name": "Interessen analysieren", "difficulty": "intermediate", "modules": 3},
                    {"name": "Zielrahmen setzen", "difficulty": "beginner", "modules": 2}
                ]
            },
            {
                "name": "Tactics",
                "description": "Verhandlungstaktiken",
                "skills": [
                    {"name": "Aktives Zuhören", "difficulty": "beginner", "modules": 2},
                    {"name": "Fragen stellen", "difficulty": "intermediate", "modules": 3},
                    {"name": "Anker setzen", "difficulty": "advanced", "modules": 3},
                    {"name": "Win-Win finden", "difficulty": "intermediate", "modules": 3}
                ]
            },
            {
                "name": "Mindset",
                "description": "Mentale Haltung",
                "skills": [
                    {"name": "Menschen vom Problem trennen", "difficulty": "intermediate", "modules": 3},
                    {"name": "Emotionen managen", "difficulty": "advanced", "modules": 4},
                    {"name": "Geduld bewahren", "difficulty": "intermediate", "modules": 2}
                ]
            }
        ]
    }'::JSONB
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. INDIZES FÜR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_goal_skills_goal ON goal_skills(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_skills_user ON goal_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_skills_parent ON goal_skills(parent_skill_id);
CREATE INDEX IF NOT EXISTS idx_goal_skills_weakness ON goal_skills(user_id, is_weakness) WHERE is_weakness = TRUE;
CREATE INDEX IF NOT EXISTS idx_goal_skills_mastery ON goal_skills(user_id, mastery_level);

CREATE INDEX IF NOT EXISTS idx_module_skill_mapping_skill ON module_skill_mapping(skill_id);
CREATE INDEX IF NOT EXISTS idx_module_skill_mapping_user ON module_skill_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_module_skill_mapping_module ON module_skill_mapping(module_id);

CREATE INDEX IF NOT EXISTS idx_skill_templates_category ON skill_templates(goal_category);
CREATE INDEX IF NOT EXISTS idx_skill_templates_keywords ON skill_templates USING GIN(goal_keywords);

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE goal_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_skill_mapping ENABLE ROW LEVEL SECURITY;

-- goal_skills Policies
DROP POLICY IF EXISTS "Users can view their own skills" ON goal_skills;
CREATE POLICY "Users can view their own skills" ON goal_skills
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own skills" ON goal_skills;
CREATE POLICY "Users can insert their own skills" ON goal_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own skills" ON goal_skills;
CREATE POLICY "Users can update their own skills" ON goal_skills
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own skills" ON goal_skills;
CREATE POLICY "Users can delete their own skills" ON goal_skills
    FOR DELETE USING (auth.uid() = user_id);

-- module_skill_mapping Policies
DROP POLICY IF EXISTS "Users can manage their own mappings" ON module_skill_mapping;
CREATE POLICY "Users can manage their own mappings" ON module_skill_mapping
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- skill_templates ist public readable (keine RLS nötig, da Templates für alle gleich)

-- ============================================
-- 6. TRIGGER: SKILL MASTERY UPDATE
-- ============================================

-- Funktion: Aktualisiert Mastery-Level nach Modul-Abschluss
CREATE OR REPLACE FUNCTION update_skill_mastery_on_module_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_score DECIMAL;
    v_completed_count INT;
    v_is_weakness BOOLEAN;
BEGIN
    -- Berechne Durchschnitts-Score für diesen Skill
    SELECT 
        COALESCE(AVG(quiz_score), 0),
        COUNT(*)
    INTO v_avg_score, v_completed_count
    FROM module_skill_mapping
    WHERE skill_id = NEW.skill_id
    AND completed_at IS NOT NULL;
    
    -- Bestimme ob es eine Schwäche ist (< 50% Mastery)
    v_is_weakness := v_avg_score < 50;
    
    -- Update den Skill
    UPDATE goal_skills
    SET 
        mastery_level = ROUND(v_avg_score),
        completed_modules = v_completed_count,
        is_weakness = v_is_weakness,
        weakness_reason = CASE 
            WHEN v_is_weakness THEN 'Quiz-Score unter 50%'
            ELSE NULL
        END,
        last_practiced_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.skill_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger aktivieren
DROP TRIGGER IF EXISTS trigger_update_skill_mastery ON module_skill_mapping;
CREATE TRIGGER trigger_update_skill_mastery
    AFTER INSERT OR UPDATE OF quiz_score, completed_at
    ON module_skill_mapping
    FOR EACH ROW
    WHEN (NEW.completed_at IS NOT NULL)
    EXECUTE FUNCTION update_skill_mastery_on_module_complete();

-- ============================================
-- 7. TRIGGER: UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_goal_skills_updated_at ON goal_skills;
CREATE TRIGGER update_goal_skills_updated_at 
    BEFORE UPDATE ON goal_skills 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. HILFSFUNKTIONEN
-- ============================================

-- Funktion: Hole nächsten empfohlenen Skill für ein Ziel
CREATE OR REPLACE FUNCTION get_recommended_skill_for_goal(
    p_user_id UUID,
    p_goal_id UUID
)
RETURNS TABLE (
    skill_id UUID,
    skill_name TEXT,
    skill_category TEXT,
    mastery_level INT,
    is_weakness BOOLEAN,
    recommendation_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.id AS skill_id,
        gs.skill_name,
        gs.skill_category,
        gs.mastery_level,
        gs.is_weakness,
        CASE
            WHEN gs.is_weakness THEN 'Schwäche - Fokus empfohlen'
            WHEN gs.mastery_level < 30 THEN 'Noch nicht gestartet'
            WHEN gs.mastery_level < 70 THEN 'In Arbeit - weitermachen'
            ELSE 'Fast gemeistert - Feinschliff'
        END AS recommendation_reason
    FROM goal_skills gs
    WHERE gs.user_id = p_user_id
    AND gs.goal_id = p_goal_id
    AND gs.parent_skill_id IS NOT NULL  -- Nur Sub-Skills, keine Kategorien
    ORDER BY 
        gs.is_weakness DESC,  -- Schwächen zuerst
        gs.mastery_level ASC,  -- Niedrigste Mastery zuerst
        gs.last_practiced_at ASC NULLS FIRST  -- Längste nicht geübt zuerst
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Generiere Skill-Struktur für ein Ziel (wird von API aufgerufen)
CREATE OR REPLACE FUNCTION get_skill_progress_for_goal(
    p_user_id UUID,
    p_goal_id UUID
)
RETURNS TABLE (
    category_name TEXT,
    total_skills INT,
    completed_skills INT,
    avg_mastery DECIMAL,
    has_weakness BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.skill_category AS category_name,
        COUNT(*)::INT AS total_skills,
        COUNT(*) FILTER (WHERE gs.mastery_level >= 80)::INT AS completed_skills,
        ROUND(AVG(gs.mastery_level), 1) AS avg_mastery,
        BOOL_OR(gs.is_weakness) AS has_weakness
    FROM goal_skills gs
    WHERE gs.user_id = p_user_id
    AND gs.goal_id = p_goal_id
    AND gs.parent_skill_id IS NOT NULL  -- Nur Sub-Skills
    GROUP BY gs.skill_category
    ORDER BY avg_mastery ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE!
-- ============================================

