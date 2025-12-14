-- ============================================
-- PEAK COACH - RAG Knowledge Base
-- ============================================
-- Run this migration in Supabase SQL Editor
-- Requires: pgvector extension

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- KNOWLEDGE BASE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'note' CHECK (content_type IN ('note', 'insight', 'preference', 'goal_learning', 'habit_learning', 'reflection')),
  
  -- Metadata
  source TEXT DEFAULT 'user' CHECK (source IN ('user', 'coach', 'system', 'reflection')),
  tags TEXT[] DEFAULT '{}',
  
  -- Vector embedding (1536 dimensions for OpenAI ada-002)
  embedding vector(1536),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_user ON knowledge_base(user_id);

-- ============================================
-- FUNCTION: Search Similar Knowledge
-- ============================================
CREATE OR REPLACE FUNCTION search_knowledge(
  p_user_id UUID,
  p_query_embedding vector(1536),
  p_limit INT DEFAULT 5,
  p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  content_type TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.content,
    kb.content_type,
    1 - (kb.embedding <=> p_query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.user_id = p_user_id
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> p_query_embedding) > p_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COACH LEARNINGS TABLE (Auto-generated insights)
-- ============================================
CREATE TABLE IF NOT EXISTS coach_learnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Learning
  learning TEXT NOT NULL,
  category TEXT CHECK (category IN ('productivity', 'energy', 'mood', 'habits', 'goals', 'sleep', 'work', 'general')),
  confidence INT DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  
  -- Evidence
  evidence_count INT DEFAULT 1,
  last_evidence_date DATE,
  
  -- Vector
  embedding vector(1536),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for coach learnings
CREATE INDEX IF NOT EXISTS idx_coach_learnings_user ON coach_learnings(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_learnings_embedding ON coach_learnings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ============================================
-- FUNCTION: Add or Update Learning
-- ============================================
CREATE OR REPLACE FUNCTION upsert_coach_learning(
  p_user_id UUID,
  p_learning TEXT,
  p_category TEXT,
  p_embedding vector(1536)
)
RETURNS UUID AS $$
DECLARE
  v_existing_id UUID;
  v_result_id UUID;
BEGIN
  -- Check for similar existing learning (cosine similarity > 0.9)
  SELECT id INTO v_existing_id
  FROM coach_learnings
  WHERE user_id = p_user_id
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> p_embedding) > 0.9
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing learning (increase confidence)
    UPDATE coach_learnings
    SET 
      evidence_count = evidence_count + 1,
      confidence = LEAST(confidence + 5, 100),
      last_evidence_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_result_id;
  ELSE
    -- Insert new learning
    INSERT INTO coach_learnings (user_id, learning, category, embedding, last_evidence_date)
    VALUES (p_user_id, p_learning, p_category, p_embedding, CURRENT_DATE)
    RETURNING id INTO v_result_id;
  END IF;

  RETURN v_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Knowledge Base
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own knowledge" ON knowledge_base
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge" ON knowledge_base
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge" ON knowledge_base
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge" ON knowledge_base
  FOR DELETE USING (auth.uid() = user_id);

-- Service role bypass for bot
CREATE POLICY "Service role full access knowledge" ON knowledge_base
  FOR ALL USING (auth.role() = 'service_role');

-- Coach Learnings
ALTER TABLE coach_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learnings" ON coach_learnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access learnings" ON coach_learnings
  FOR ALL USING (auth.role() = 'service_role');

