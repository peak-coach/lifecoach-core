// ============================================
// PEAK COACH - RAG (Retrieval Augmented Generation) Service
// ============================================

import OpenAI from 'openai';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// EMBEDDING GENERATION
// ============================================

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.slice(0, 8000), // Max input length
    });

    return response.data[0]?.embedding || null;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    return null;
  }
}

// ============================================
// KNOWLEDGE BASE OPERATIONS
// ============================================

export interface KnowledgeEntry {
  content: string;
  contentType: 'note' | 'insight' | 'preference' | 'goal_learning' | 'habit_learning' | 'reflection';
  tags?: string[];
  source?: 'user' | 'coach' | 'system' | 'reflection';
}

export async function addKnowledge(
  userId: string,
  entry: KnowledgeEntry
): Promise<string | null> {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(entry.content);
    
    if (!embedding) {
      logger.warn('Could not generate embedding, saving without');
    }

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: userId,
        content: entry.content,
        content_type: entry.contentType,
        tags: entry.tags || [],
        source: entry.source || 'user',
        embedding: embedding ? `[${embedding.join(',')}]` : null,
      })
      .select('id')
      .single();

    if (error) throw error;

    logger.info(`Added knowledge entry for user ${userId}`);
    return data.id;
  } catch (error) {
    logger.error('Error adding knowledge:', error);
    return null;
  }
}

export async function searchKnowledge(
  userId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ content: string; type: string; similarity: number }>> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding) {
      logger.warn('Could not generate query embedding');
      return [];
    }

    // Search using pgvector
    const { data, error } = await supabase.rpc('search_knowledge', {
      p_user_id: userId,
      p_query_embedding: `[${queryEmbedding.join(',')}]`,
      p_limit: limit,
      p_threshold: 0.7,
    });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      content: item.content,
      type: item.content_type,
      similarity: item.similarity,
    }));
  } catch (error) {
    logger.error('Error searching knowledge:', error);
    return [];
  }
}

// ============================================
// COACH LEARNINGS (Auto-generated)
// ============================================

export async function addCoachLearning(
  userId: string,
  learning: string,
  category: string
): Promise<string | null> {
  try {
    const embedding = await generateEmbedding(learning);
    
    if (!embedding) return null;

    const { data, error } = await supabase.rpc('upsert_coach_learning', {
      p_user_id: userId,
      p_learning: learning,
      p_category: category,
      p_embedding: `[${embedding.join(',')}]`,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error adding coach learning:', error);
    return null;
  }
}

export async function getCoachLearnings(
  userId: string,
  category?: string,
  minConfidence: number = 50
): Promise<Array<{ learning: string; category: string; confidence: number }>> {
  try {
    let query = supabase
      .from('coach_learnings')
      .select('learning, category, confidence')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('confidence', minConfidence)
      .order('confidence', { ascending: false })
      .limit(10);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting coach learnings:', error);
    return [];
  }
}

// ============================================
// RAG-ENHANCED CONTEXT FOR COACH
// ============================================

export async function getRAGContext(
  userId: string,
  userMessage: string
): Promise<string> {
  try {
    // 1. Search relevant knowledge
    const relevantKnowledge = await searchKnowledge(userId, userMessage, 3);
    
    // 2. Get high-confidence learnings
    const learnings = await getCoachLearnings(userId, undefined, 60);

    let context = '';

    if (relevantKnowledge.length > 0) {
      context += '# RELEVANTES WISSEN DES USERS\n';
      relevantKnowledge.forEach((k, i) => {
        context += `${i + 1}. [${k.type}] ${k.content}\n`;
      });
      context += '\n';
    }

    if (learnings.length > 0) {
      context += '# WAS ICH ÜBER DIESEN USER GELERNT HABE\n';
      learnings.slice(0, 5).forEach((l, i) => {
        context += `${i + 1}. [${l.category}] ${l.learning} (${l.confidence}% sicher)\n`;
      });
      context += '\n';
    }

    return context;
  } catch (error) {
    logger.error('Error getting RAG context:', error);
    return '';
  }
}

// ============================================
// KNOWLEDGE EXTRACTION FROM CONVERSATIONS
// ============================================

export async function extractAndSaveKnowledge(
  userId: string,
  conversationText: string
): Promise<void> {
  try {
    // Use GPT to extract learnable insights
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Du extrahierst wichtige persönliche Informationen aus Gesprächen.
Fokus auf:
- Präferenzen ("Ich arbeite am besten wenn...")
- Learnings ("Ich habe gemerkt dass...")
- Ziele und Motivationen
- Herausforderungen
- Gewohnheiten und Routinen

Output: JSON Array mit max 3 Einträgen, Format:
[{"content": "...", "type": "preference|insight|habit_learning|goal_learning", "category": "productivity|energy|mood|habits|goals|sleep|work|general"}]

Wenn nichts Relevantes: leeres Array []`,
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    try {
      const insights = JSON.parse(content);
      
      for (const insight of insights) {
        if (insight.content && insight.type) {
          await addKnowledge(userId, {
            content: insight.content,
            contentType: insight.type,
            source: 'coach',
            tags: [insight.category],
          });
          
          // Also add as learning if it's an insight
          if (insight.type === 'insight' || insight.type === 'preference') {
            await addCoachLearning(userId, insight.content, insight.category);
          }
        }
      }
    } catch {
      // JSON parse failed, ignore
    }
  } catch (error) {
    logger.error('Error extracting knowledge:', error);
  }
}

// ============================================
// MANUAL KNOWLEDGE COMMANDS
// ============================================

export async function listUserKnowledge(
  userId: string,
  limit: number = 10
): Promise<Array<{ id: string; content: string; type: string; createdAt: string }>> {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('id, content, content_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      content: item.content,
      type: item.content_type,
      createdAt: item.created_at,
    }));
  } catch (error) {
    logger.error('Error listing knowledge:', error);
    return [];
  }
}

export async function deleteKnowledge(userId: string, knowledgeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', knowledgeId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    logger.error('Error deleting knowledge:', error);
    return false;
  }
}

