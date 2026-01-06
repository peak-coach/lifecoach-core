-- ============================================
-- FIX: add_xp Funktion fehlte - XP wurde nie hinzugefügt!
-- ============================================

-- Die add_xp Funktion die von der API und dem Trigger aufgerufen wird
CREATE OR REPLACE FUNCTION public.add_xp(
    p_user_id UUID,
    p_xp_amount INTEGER
)
RETURNS void AS $$
DECLARE
    v_current_xp INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Get current XP or create record if not exists
    INSERT INTO user_gamification (user_id, total_xp, current_level)
    VALUES (p_user_id, 0, 1)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current XP
    SELECT total_xp INTO v_current_xp
    FROM user_gamification
    WHERE user_id = p_user_id;
    
    v_new_xp := COALESCE(v_current_xp, 0) + p_xp_amount;
    
    -- Calculate new level based on XP thresholds
    -- Level 1: 0, Level 2: 100, Level 3: 250, Level 4: 500, Level 5: 1000
    -- Level 6: 2000, Level 7: 3500, Level 8: 5500, Level 9: 8000, Level 10: 12000
    v_new_level := CASE
        WHEN v_new_xp >= 12000 THEN 10
        WHEN v_new_xp >= 8000 THEN 9
        WHEN v_new_xp >= 5500 THEN 8
        WHEN v_new_xp >= 3500 THEN 7
        WHEN v_new_xp >= 2000 THEN 6
        WHEN v_new_xp >= 1000 THEN 5
        WHEN v_new_xp >= 500 THEN 4
        WHEN v_new_xp >= 250 THEN 3
        WHEN v_new_xp >= 100 THEN 2
        ELSE 1
    END;
    
    -- Update user gamification
    UPDATE user_gamification
    SET 
        total_xp = v_new_xp,
        current_level = v_new_level,
        xp_to_next_level = CASE v_new_level
            WHEN 1 THEN 100 - v_new_xp
            WHEN 2 THEN 250 - v_new_xp
            WHEN 3 THEN 500 - v_new_xp
            WHEN 4 THEN 1000 - v_new_xp
            WHEN 5 THEN 2000 - v_new_xp
            WHEN 6 THEN 3500 - v_new_xp
            WHEN 7 THEN 5500 - v_new_xp
            WHEN 8 THEN 8000 - v_new_xp
            WHEN 9 THEN 12000 - v_new_xp
            ELSE 0
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log the XP event
    INSERT INTO xp_events (user_id, event_type, xp_amount, description)
    VALUES (p_user_id, 'learning', p_xp_amount, 'Learning activity XP');
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update learning_settings.total_xp for backwards compatibility
CREATE OR REPLACE FUNCTION public.sync_learning_xp()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync XP to learning_settings table too
    UPDATE learning_settings
    SET total_xp = (SELECT total_xp FROM user_gamification WHERE user_id = NEW.user_id)
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_xp_to_learning_settings ON user_gamification;
CREATE TRIGGER sync_xp_to_learning_settings
    AFTER UPDATE OF total_xp ON user_gamification
    FOR EACH ROW EXECUTE FUNCTION public.sync_learning_xp();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.add_xp(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_xp(UUID, INTEGER) TO service_role;

