-- ============================================
-- PEAK COACH AKADEMIE - Datenbank Migration
-- ============================================

-- ============================================
-- 1. LERN-EINSTELLUNGEN (User Level)
-- ============================================

CREATE TABLE IF NOT EXISTS learning_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    learning_level TEXT DEFAULT 'standard' CHECK (learning_level IN ('minimal', 'standard', 'intensive')),
    daily_goal_minutes INT DEFAULT 15,
    preferred_time TEXT DEFAULT 'morning' CHECK (preferred_time IN ('morning', 'afternoon', 'evening', 'flexible')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    streak_current INT DEFAULT 0,
    streak_best INT DEFAULT 0,
    streak_freeze_available INT DEFAULT 1,
    last_learning_date DATE,
    total_modules_completed INT DEFAULT 0,
    total_learning_minutes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für learning_settings
ALTER TABLE learning_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own learning settings"
    ON learning_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. KATEGORIEN (Wissens-Kategorien)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📚',
    color TEXT DEFAULT '#6366f1',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basis-Kategorien einfügen
INSERT INTO knowledge_categories (slug, name, description, icon, color, sort_order) VALUES
    ('rhetorik', 'Rhetorik & Kommunikation', 'Überzeugend sprechen, präsentieren und kommunizieren', '🎤', '#ef4444', 1),
    ('psychologie', 'Psychologie & Mindset', 'Verhaltensänderung, Motivation und mentale Stärke', '🧠', '#8b5cf6', 2),
    ('produktivitaet', 'Produktivität & Fokus', 'Zeitmanagement, Deep Work und Effizienz', '⚡', '#f59e0b', 3),
    ('fitness', 'Fitness & Gesundheit', 'Training, Ernährung und körperliche Optimierung', '💪', '#10b981', 4),
    ('business', 'Business & Karriere', 'Unternehmertum, Leadership und beruflicher Erfolg', '💼', '#3b82f6', 5),
    ('lernen', 'Lernen & Wissen', 'Effektive Lernmethoden und Wissensaufbau', '📚', '#ec4899', 6),
    ('finanzen', 'Finanzen & Investing', 'Vermögensaufbau und finanzielle Freiheit', '💰', '#14b8a6', 7),
    ('beziehungen', 'Beziehungen & Social Skills', 'Networking, Empathie und soziale Intelligenz', '❤️', '#f43f5e', 8),
    ('trt', 'TRT & Enhanced Performance', 'Hormonoptimierung und fortgeschrittene Protokolle', '💉', '#7c3aed', 9),
    ('schlaf', 'Schlaf & Recovery', 'Schlafoptimierung und Regeneration', '😴', '#6366f1', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. WISSENS-PRINZIPIEN (Kern-Wissen)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_principles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES knowledge_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT, -- Buch/Forscher
    importance INT DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
    tags TEXT[], -- z.B. ['anfänger', 'fortgeschritten']
    related_principles UUID[], -- Verbindungen zu anderen Prinzipien
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_principles_category ON knowledge_principles(category_id);
CREATE INDEX IF NOT EXISTS idx_principles_tags ON knowledge_principles USING GIN(tags);

-- ============================================
-- 4. LERNPFADE (Personalisierte Pfade)
-- ============================================

CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    categories TEXT[], -- Multi-Kategorien z.B. ['rhetorik', 'psychologie']
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_weeks INT DEFAULT 8,
    total_modules INT DEFAULT 0,
    completed_modules INT DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    ai_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für learning_paths
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own learning paths"
    ON learning_paths FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. MODULE (Lern-Einheiten)
-- ============================================

CREATE TABLE IF NOT EXISTS learning_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Strukturierter Content (Hook, Konzept, Übung, etc.)
    category_slug TEXT,
    difficulty TEXT DEFAULT 'beginner',
    estimated_minutes INT DEFAULT 10,
    order_index INT DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für learning_modules
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own modules"
    ON learning_modules FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_modules_path ON learning_modules(path_id);
CREATE INDEX IF NOT EXISTS idx_modules_user ON learning_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON learning_modules(status);

-- ============================================
-- 6. QUIZ-FRAGEN & ANTWORTEN
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- ["Option A", "Option B", "Option C", "Option D"]
    correct_index INT NOT NULL,
    explanation TEXT, -- Warum ist das die richtige Antwort?
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_index INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken_seconds INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für quiz_results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quiz results"
    ON quiz_results FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. SPACED REPETITION
-- ============================================

CREATE TABLE IF NOT EXISTS spaced_repetition (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
    next_review_date DATE NOT NULL,
    interval_days INT DEFAULT 1, -- 1, 3, 7, 14, 30, 60
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    repetitions INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- RLS für spaced_repetition
ALTER TABLE spaced_repetition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own spaced repetition"
    ON spaced_repetition FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index für tägliche Reviews
CREATE INDEX IF NOT EXISTS idx_spaced_rep_review ON spaced_repetition(user_id, next_review_date);

-- ============================================
-- 8. LERN-AKTIVITÄT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS learning_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('module_started', 'module_completed', 'quiz_completed', 'review_completed', 'streak_maintained')),
    module_id UUID REFERENCES learning_modules(id) ON DELETE SET NULL,
    path_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
    xp_earned INT DEFAULT 0,
    duration_minutes INT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für learning_activity
ALTER TABLE learning_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning activity"
    ON learning_activity FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index für Analytics
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON learning_activity(user_id, created_at);

-- ============================================
-- 9. FUNKTIONEN
-- ============================================

-- Funktion: Learning Settings initialisieren für neue User
CREATE OR REPLACE FUNCTION public.handle_new_user_learning()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.learning_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für neue User
DROP TRIGGER IF EXISTS on_auth_user_created_learning ON auth.users;
CREATE TRIGGER on_auth_user_created_learning
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_learning();

-- Funktion: Streak aktualisieren
CREATE OR REPLACE FUNCTION public.update_learning_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INT;
    v_best_streak INT;
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT last_learning_date, streak_current, streak_best
    INTO v_last_date, v_current_streak, v_best_streak
    FROM learning_settings
    WHERE user_id = p_user_id;

    IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
        -- Streak reset (mehr als 1 Tag Pause)
        v_current_streak := 1;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
        -- Streak fortsetzen
        v_current_streak := v_current_streak + 1;
    ELSIF v_last_date = v_today THEN
        -- Bereits heute gelernt, Streak bleibt
        RETURN v_current_streak;
    END IF;

    -- Best Streak aktualisieren
    IF v_current_streak > v_best_streak THEN
        v_best_streak := v_current_streak;
    END IF;

    -- Update
    UPDATE learning_settings
    SET 
        streak_current = v_current_streak,
        streak_best = v_best_streak,
        last_learning_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN v_current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: XP für Lern-Aktivität vergeben
CREATE OR REPLACE FUNCTION public.grant_learning_xp()
RETURNS TRIGGER AS $$
DECLARE
    v_xp INT := 0;
BEGIN
    -- XP basierend auf Aktivitäts-Typ
    CASE NEW.activity_type
        WHEN 'module_completed' THEN v_xp := 50;
        WHEN 'quiz_completed' THEN v_xp := 20;
        WHEN 'review_completed' THEN v_xp := 15;
        WHEN 'streak_maintained' THEN v_xp := 10;
        ELSE v_xp := 5;
    END CASE;

    -- XP zum User hinzufügen
    PERFORM public.add_xp(NEW.user_id, v_xp);
    
    -- XP im Activity Log speichern
    UPDATE learning_activity SET xp_earned = v_xp WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_learning_activity_grant_xp ON learning_activity;
CREATE TRIGGER on_learning_activity_grant_xp
    AFTER INSERT ON learning_activity
    FOR EACH ROW EXECUTE FUNCTION public.grant_learning_xp();

-- ============================================
-- 10. DIAGNOSE-ASSESSMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS diagnosis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_slug TEXT NOT NULL,
    skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    strengths TEXT[],
    weaknesses TEXT[],
    recommended_focus TEXT[],
    assessment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_slug)
);

-- RLS für diagnosis_results
ALTER TABLE diagnosis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own diagnosis results"
    ON diagnosis_results FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


