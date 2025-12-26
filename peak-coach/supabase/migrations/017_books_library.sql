-- ============================================
-- PEAK COACH - Books Library & Reading Journal
-- Migration 017
-- ============================================
-- 
-- Lese-Journal System:
-- 1. Bücher verwalten (mit Google Books Metadata)
-- 2. Highlights speichern
-- 3. Spaced Repetition für Buch-Konzepte
-- 4. Actions aus Büchern (verknüpft mit 016_unified_actions)
--
-- User-ID: auth.users(id) - konsistent mit Learning-System
-- ============================================

-- ============================================
-- 1. BOOKS TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Referenz
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Buch-Metadaten (von Google Books API oder manuell)
    title TEXT NOT NULL,
    subtitle TEXT,
    authors TEXT[],
    publisher TEXT,
    published_date TEXT,
    description TEXT,
    isbn_10 TEXT,
    isbn_13 TEXT,
    page_count INT,
    
    -- Cover Image
    cover_url TEXT,
    cover_thumbnail TEXT,
    
    -- Kategorisierung
    categories TEXT[],  -- Genre/Kategorie
    language TEXT DEFAULT 'de',
    
    -- Lese-Status
    status TEXT DEFAULT 'reading' CHECK (status IN (
        'want_to_read',  -- Will ich lesen
        'reading',       -- Lese ich gerade
        'completed',     -- Fertig gelesen
        'abandoned'      -- Abgebrochen
    )),
    
    -- Fortschritt
    current_page INT DEFAULT 0,
    started_at DATE,
    completed_at DATE,
    
    -- Bewertung & Reflexion (nach Abschluss)
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    key_takeaways TEXT[],  -- Die 3 wichtigsten Erkenntnisse
    would_recommend_to TEXT,  -- Wem würdest du es empfehlen?
    
    -- Statistiken
    highlight_count INT DEFAULT 0,
    action_count INT DEFAULT 0,
    review_count INT DEFAULT 0,  -- Spaced Repetition Reviews
    
    -- Google Books ID (für spätere Aktualisierung)
    google_books_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE books IS 'Bücher-Bibliothek mit Metadaten und Lese-Status';
COMMENT ON COLUMN books.key_takeaways IS 'Die 3 wichtigsten Erkenntnisse aus dem Buch';

-- ============================================
-- 2. BOOK HIGHLIGHTS TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS book_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referenzen
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Highlight Content
    highlight_text TEXT NOT NULL,
    page_number INT,
    chapter TEXT,
    
    -- User Notizen
    user_note TEXT,
    
    -- Kategorisierung
    highlight_type TEXT DEFAULT 'insight' CHECK (highlight_type IN (
        'insight',     -- Erkenntnis / Idee
        'action',      -- Etwas zum Umsetzen
        'quote',       -- Zitat zum Merken
        'question',    -- Frage die aufkam
        'connection'   -- Verbindung zu anderem Wissen
    )),
    
    -- Tags für Organisation
    tags TEXT[],
    
    -- Verknüpfung mit Zielen (optional)
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES goal_skills(id) ON DELETE SET NULL,
    
    -- Falls Action: Referenz zur Action
    action_id UUID REFERENCES actions(id) ON DELETE SET NULL,
    
    -- Spaced Repetition
    is_reviewable BOOLEAN DEFAULT TRUE,  -- Soll in Reviews erscheinen?
    next_review_date DATE,
    review_interval_days INT DEFAULT 1,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    review_count INT DEFAULT 0,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE book_highlights IS 'Highlights und Notizen aus Büchern';
COMMENT ON COLUMN book_highlights.highlight_type IS 'Art des Highlights: insight, action, quote, question, connection';

-- ============================================
-- 3. BOOK READING SESSIONS (Optional)
-- ============================================
-- Trackt Lese-Sessions für Statistiken

CREATE TABLE IF NOT EXISTS book_reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Session Details
    start_page INT,
    end_page INT,
    pages_read INT GENERATED ALWAYS AS (end_page - start_page) STORED,
    duration_minutes INT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE book_reading_sessions IS 'Lese-Sessions für Statistiken (optional)';

-- ============================================
-- 4. INDIZES
-- ============================================

-- Books
CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_status ON books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_books_google_id ON books(google_books_id) WHERE google_books_id IS NOT NULL;

-- Highlights
CREATE INDEX IF NOT EXISTS idx_highlights_book ON book_highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user ON book_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_type ON book_highlights(user_id, highlight_type);
CREATE INDEX IF NOT EXISTS idx_highlights_review ON book_highlights(user_id, next_review_date) 
    WHERE is_reviewable = TRUE AND next_review_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_highlights_goal ON book_highlights(goal_id) WHERE goal_id IS NOT NULL;

-- Reading Sessions
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON book_reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON book_reading_sessions(user_id);

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reading_sessions ENABLE ROW LEVEL SECURITY;

-- Books Policies
DROP POLICY IF EXISTS "Users can manage their own books" ON books;
CREATE POLICY "Users can manage their own books" ON books
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Highlights Policies
DROP POLICY IF EXISTS "Users can manage their own highlights" ON book_highlights;
CREATE POLICY "Users can manage their own highlights" ON book_highlights
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reading Sessions Policies
DROP POLICY IF EXISTS "Users can manage their own sessions" ON book_reading_sessions;
CREATE POLICY "Users can manage their own sessions" ON book_reading_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Updated_at Trigger für books
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at 
    BEFORE UPDATE ON books 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Updated_at Trigger für highlights
DROP TRIGGER IF EXISTS update_highlights_updated_at ON book_highlights;
CREATE TRIGGER update_highlights_updated_at 
    BEFORE UPDATE ON book_highlights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update highlight_count in books
CREATE OR REPLACE FUNCTION update_book_highlight_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE books SET highlight_count = highlight_count + 1, updated_at = NOW()
        WHERE id = NEW.book_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE books SET highlight_count = highlight_count - 1, updated_at = NOW()
        WHERE id = OLD.book_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_book_highlight_count ON book_highlights;
CREATE TRIGGER trigger_update_book_highlight_count
    AFTER INSERT OR DELETE ON book_highlights
    FOR EACH ROW
    EXECUTE FUNCTION update_book_highlight_count();

-- Trigger: Set next_review_date für neue Highlights
CREATE OR REPLACE FUNCTION set_highlight_initial_review()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_reviewable AND NEW.next_review_date IS NULL THEN
        -- Erste Review in 1 Tag
        NEW.next_review_date := CURRENT_DATE + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_highlight_review ON book_highlights;
CREATE TRIGGER trigger_set_highlight_review
    BEFORE INSERT ON book_highlights
    FOR EACH ROW
    EXECUTE FUNCTION set_highlight_initial_review();

-- ============================================
-- 7. FUNKTIONEN
-- ============================================

-- Funktion: Hole fällige Buch-Reviews
CREATE OR REPLACE FUNCTION get_due_book_reviews(p_user_id UUID)
RETURNS TABLE (
    highlight_id UUID,
    book_id UUID,
    book_title TEXT,
    highlight_text TEXT,
    user_note TEXT,
    page_number INT,
    review_count INT,
    interval_days INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bh.id AS highlight_id,
        bh.book_id,
        b.title AS book_title,
        bh.highlight_text,
        bh.user_note,
        bh.page_number,
        bh.review_count,
        bh.review_interval_days AS interval_days
    FROM book_highlights bh
    JOIN books b ON b.id = bh.book_id
    WHERE bh.user_id = p_user_id
    AND bh.is_reviewable = TRUE
    AND bh.next_review_date <= CURRENT_DATE
    ORDER BY bh.next_review_date ASC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Complete Book Review (SM-2 Algorithmus)
CREATE OR REPLACE FUNCTION complete_book_review(
    p_highlight_id UUID,
    p_user_id UUID,
    p_quality INT  -- 1-5, wobei 5 = perfekte Erinnerung
)
RETURNS VOID AS $$
DECLARE
    v_current_interval INT;
    v_current_ease DECIMAL;
    v_new_interval INT;
    v_new_ease DECIMAL;
BEGIN
    -- Hole aktuelle Werte
    SELECT review_interval_days, ease_factor 
    INTO v_current_interval, v_current_ease
    FROM book_highlights
    WHERE id = p_highlight_id AND user_id = p_user_id;
    
    -- SM-2 Algorithmus
    IF p_quality < 3 THEN
        -- Vergessen → Reset Interval
        v_new_interval := 1;
        v_new_ease := GREATEST(1.3, v_current_ease - 0.2);
    ELSE
        -- Erinnert
        IF v_current_interval = 1 THEN
            v_new_interval := 3;
        ELSIF v_current_interval = 3 THEN
            v_new_interval := 7;
        ELSE
            v_new_interval := ROUND(v_current_interval * v_current_ease);
        END IF;
        
        v_new_ease := v_current_ease + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02));
        v_new_ease := GREATEST(1.3, v_new_ease);
    END IF;
    
    -- Update Highlight
    UPDATE book_highlights
    SET 
        review_interval_days = v_new_interval,
        ease_factor = v_new_ease,
        review_count = review_count + 1,
        next_review_date = CURRENT_DATE + v_new_interval,
        last_reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_highlight_id AND user_id = p_user_id;
    
    -- Update Book review_count
    UPDATE books
    SET review_count = review_count + 1, updated_at = NOW()
    WHERE id = (SELECT book_id FROM book_highlights WHERE id = p_highlight_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Erstelle Action aus Highlight
CREATE OR REPLACE FUNCTION create_action_from_highlight(
    p_highlight_id UUID,
    p_user_id UUID,
    p_action_title TEXT,
    p_trigger_situation TEXT DEFAULT NULL,
    p_intended_behavior TEXT DEFAULT NULL,
    p_timing_type TEXT DEFAULT 'opportunity'
)
RETURNS UUID AS $$
DECLARE
    v_book_id UUID;
    v_book_title TEXT;
    v_highlight_text TEXT;
    v_page_number INT;
    v_goal_id UUID;
    v_skill_id UUID;
    v_action_id UUID;
BEGIN
    -- Hole Highlight-Daten
    SELECT 
        bh.book_id,
        b.title,
        bh.highlight_text,
        bh.page_number,
        bh.goal_id,
        bh.skill_id
    INTO 
        v_book_id,
        v_book_title,
        v_highlight_text,
        v_page_number,
        v_goal_id,
        v_skill_id
    FROM book_highlights bh
    JOIN books b ON b.id = bh.book_id
    WHERE bh.id = p_highlight_id AND bh.user_id = p_user_id;
    
    -- Erstelle Action
    INSERT INTO actions (
        user_id,
        source_type,
        source_id,
        source_title,
        source_page,
        goal_id,
        skill_id,
        action_title,
        action_description,
        trigger_situation,
        intended_behavior,
        timing_type
    ) VALUES (
        p_user_id,
        'book',
        v_book_id::TEXT,
        'Buch: ' || v_book_title,
        CASE WHEN v_page_number IS NOT NULL THEN 'S. ' || v_page_number END,
        v_goal_id,
        v_skill_id,
        p_action_title,
        'Aus Highlight: "' || LEFT(v_highlight_text, 100) || '..."',
        p_trigger_situation,
        p_intended_behavior,
        p_timing_type
    )
    RETURNING id INTO v_action_id;
    
    -- Verknüpfe Action mit Highlight
    UPDATE book_highlights
    SET action_id = v_action_id, updated_at = NOW()
    WHERE id = p_highlight_id;
    
    -- Update Book action_count
    UPDATE books
    SET action_count = action_count + 1, updated_at = NOW()
    WHERE id = v_book_id;
    
    RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Buch abschließen
CREATE OR REPLACE FUNCTION complete_book(
    p_book_id UUID,
    p_user_id UUID,
    p_rating INT DEFAULT NULL,
    p_review_text TEXT DEFAULT NULL,
    p_key_takeaways TEXT[] DEFAULT NULL,
    p_would_recommend_to TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE books
    SET 
        status = 'completed',
        completed_at = CURRENT_DATE,
        rating = p_rating,
        review_text = p_review_text,
        key_takeaways = p_key_takeaways,
        would_recommend_to = p_would_recommend_to,
        updated_at = NOW()
    WHERE id = p_book_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Bücher-Statistiken für User
CREATE OR REPLACE FUNCTION get_reading_statistics(p_user_id UUID)
RETURNS TABLE (
    total_books INT,
    completed_books INT,
    reading_books INT,
    total_highlights INT,
    total_actions_from_books INT,
    avg_rating DECIMAL,
    pages_read_this_month INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT b.id)::INT AS total_books,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed')::INT AS completed_books,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'reading')::INT AS reading_books,
        COALESCE(SUM(b.highlight_count), 0)::INT AS total_highlights,
        COALESCE(SUM(b.action_count), 0)::INT AS total_actions_from_books,
        ROUND(AVG(b.rating) FILTER (WHERE b.rating IS NOT NULL), 1) AS avg_rating,
        COALESCE((
            SELECT SUM(rs.pages_read)
            FROM book_reading_sessions rs
            WHERE rs.user_id = p_user_id
            AND rs.started_at >= date_trunc('month', CURRENT_DATE)
        ), 0)::INT AS pages_read_this_month
    FROM books b
    WHERE b.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. VIEW: Unified Reviews (Module + Bücher)
-- ============================================

CREATE OR REPLACE VIEW unified_due_reviews AS
-- Module Reviews (aus spaced_repetition)
SELECT 
    sr.id,
    sr.user_id,
    'module' AS review_type,
    sr.module_id AS source_id,
    sr.module_title AS title,
    sr.category,
    sr.concept AS content,
    sr.review_questions,
    sr.next_review_date,
    sr.interval_days,
    sr.repetitions AS review_count
FROM spaced_repetition sr
WHERE sr.next_review_date <= CURRENT_DATE

UNION ALL

-- Buch Reviews (aus book_highlights)
SELECT 
    bh.id,
    bh.user_id,
    'book' AS review_type,
    bh.book_id::TEXT AS source_id,
    b.title AS title,
    'book' AS category,
    bh.highlight_text AS content,
    jsonb_build_array(
        jsonb_build_object(
            'question', 'Was bedeutet dieses Highlight für dich?',
            'answer', COALESCE(bh.user_note, bh.highlight_text)
        )
    ) AS review_questions,
    bh.next_review_date,
    bh.review_interval_days AS interval_days,
    bh.review_count
FROM book_highlights bh
JOIN books b ON b.id = bh.book_id
WHERE bh.is_reviewable = TRUE
AND bh.next_review_date <= CURRENT_DATE;

COMMENT ON VIEW unified_due_reviews IS 'Kombinierte View für Module- und Buch-Reviews';

-- ============================================
-- DONE!
-- ============================================

