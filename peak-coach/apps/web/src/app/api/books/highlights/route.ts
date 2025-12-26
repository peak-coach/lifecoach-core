import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

// Supabase Admin Client (lazy initialization)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ============================================
// GET: Hole Highlights
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const bookId = searchParams.get('bookId');
    const highlightType = searchParams.get('type'); // insight, action, quote, question
    const forReview = searchParams.get('forReview') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    let query = getSupabaseAdmin()
      .from('book_highlights')
      .select(`
        *,
        books:book_id (
          id,
          title,
          authors
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    if (highlightType) {
      query = query.eq('highlight_type', highlightType);
    }

    // Für Spaced Repetition Reviews
    if (forReview) {
      query = query
        .eq('is_reviewable', true)
        .lte('next_review_date', new Date().toISOString().split('T')[0])
        .order('next_review_date', { ascending: true })
        .limit(20);
    }

    const { data: highlights, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      highlights,
      count: highlights?.length || 0,
      dueForReview: forReview ? highlights?.length || 0 : undefined,
    });
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 });
  }
}

// ============================================
// POST: Neues Highlight erstellen
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      bookId,
      highlightText,
      pageNumber,
      chapter,
      userNote,
      highlightType = 'insight',
      tags,
      goalId,
      skillId,
      isReviewable = true,
      createAction = false, // Automatisch Action erstellen?
      actionData, // { title, triggerSituation, intendedBehavior, timingType }
    } = body;

    if (!userId || !bookId || !highlightText) {
      return NextResponse.json(
        { error: 'userId, bookId, and highlightText required' },
        { status: 400 }
      );
    }

    // Erstelle Highlight
    const { data: highlight, error } = await getSupabaseAdmin()
      .from('book_highlights')
      .insert({
        user_id: userId,
        book_id: bookId,
        highlight_text: highlightText,
        page_number: pageNumber,
        chapter,
        user_note: userNote,
        highlight_type: highlightType,
        tags,
        goal_id: goalId,
        skill_id: skillId,
        is_reviewable: isReviewable,
        next_review_date: isReviewable
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Optional: Erstelle Action aus Highlight
    let action = null;
    if (createAction || highlightType === 'action') {
      // Hole Buch-Titel für Source
      const { data: book } = await getSupabaseAdmin()
        .from('books')
        .select('title')
        .eq('id', bookId)
        .single();

      const { data: actionData_, error: actionError } = await getSupabaseAdmin()
        .from('actions')
        .insert({
          user_id: userId,
          source_type: 'book',
          source_id: bookId,
          source_title: `Buch: ${book?.title || 'Unbekannt'}`,
          source_page: pageNumber ? `S. ${pageNumber}` : null,
          goal_id: goalId,
          skill_id: skillId,
          action_title: actionData?.title || `Action aus "${highlightText.substring(0, 50)}..."`,
          action_description: `Aus Highlight: "${highlightText}"`,
          trigger_situation: actionData?.triggerSituation,
          intended_behavior: actionData?.intendedBehavior,
          timing_type: actionData?.timingType || 'opportunity',
        })
        .select()
        .single();

      if (!actionError) {
        action = actionData_;

        // Verknüpfe Action mit Highlight
        await getSupabaseAdmin()
          .from('book_highlights')
          .update({ action_id: action.id })
          .eq('id', highlight.id);
      }
    }

    return NextResponse.json({
      success: true,
      highlight,
      action,
    });
  } catch (error) {
    console.error('Error creating highlight:', error);
    return NextResponse.json({ error: 'Failed to create highlight' }, { status: 500 });
  }
}

// ============================================
// PATCH: Update Highlight (inkl. Review)
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      highlightId,
      userId,
      action, // 'update', 'review'
      // Für 'review' (Spaced Repetition)
      quality, // 1-5
      // Für 'update'
      updates,
    } = body;

    if (!highlightId || !userId) {
      return NextResponse.json({ error: 'highlightId and userId required' }, { status: 400 });
    }

    let updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'review') {
      // Spaced Repetition Update (SM-2 Algorithmus)
      const { data: highlight } = await getSupabaseAdmin()
        .from('book_highlights')
        .select('review_interval_days, ease_factor, review_count')
        .eq('id', highlightId)
        .eq('user_id', userId)
        .single();

      if (!highlight) {
        return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
      }

      const currentInterval = highlight.review_interval_days || 1;
      const currentEase = parseFloat(highlight.ease_factor) || 2.5;
      let newInterval: number;
      let newEase: number;

      if (quality < 3) {
        // Vergessen → Reset
        newInterval = 1;
        newEase = Math.max(1.3, currentEase - 0.2);
      } else {
        // Erinnert
        if (currentInterval === 1) {
          newInterval = 3;
        } else if (currentInterval === 3) {
          newInterval = 7;
        } else {
          newInterval = Math.round(currentInterval * currentEase);
        }

        newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        newEase = Math.max(1.3, newEase);
      }

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

      updateData = {
        ...updateData,
        review_interval_days: newInterval,
        ease_factor: newEase,
        review_count: (highlight.review_count || 0) + 1,
        next_review_date: nextReviewDate.toISOString().split('T')[0],
        last_reviewed_at: new Date().toISOString(),
      };
    } else if (action === 'update' && updates) {
      const allowedFields = [
        'highlight_text',
        'user_note',
        'highlight_type',
        'tags',
        'is_reviewable',
        'goal_id',
        'skill_id',
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }
    }

    const { data: highlight, error } = await getSupabaseAdmin()
      .from('book_highlights')
      .update(updateData)
      .eq('id', highlightId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, highlight });
  } catch (error) {
    console.error('Error updating highlight:', error);
    return NextResponse.json({ error: 'Failed to update highlight' }, { status: 500 });
  }
}

// ============================================
// DELETE: Lösche Highlight
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const highlightId = searchParams.get('highlightId');
    const userId = searchParams.get('userId');

    if (!highlightId || !userId) {
      return NextResponse.json({ error: 'highlightId and userId required' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('book_highlights')
      .delete()
      .eq('id', highlightId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
  }
}

// ============================================
// Helper: KI-Analyse ob Highlight eine Action ist
// ============================================
async function analyzeHighlight(highlightText: string): Promise<{
  isAction: boolean;
  suggestedType: string;
  suggestedAction?: {
    title: string;
    triggerSituation: string;
    intendedBehavior: string;
  };
}> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI_API_KEY;

  if (!apiKey) {
    // Fallback: Einfache Keyword-Erkennung
    const actionKeywords = [
      'mach', 'tu', 'übe', 'schreibe', 'probiere', 'versuche',
      'jeden tag', 'täglich', 'regelmäßig', 'wenn du', 'falls',
    ];
    const isAction = actionKeywords.some(kw =>
      highlightText.toLowerCase().includes(kw)
    );

    return {
      isAction,
      suggestedType: isAction ? 'action' : 'insight',
    };
  }

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analysiere dieses Buch-Highlight und bestimme:
1. Ist es eine ACTION (etwas zum Umsetzen) oder ein INSIGHT (Erkenntnis)?
2. Falls ACTION: Schlage einen konkreten WENN-DANN Plan vor.

OUTPUT FORMAT (JSON):
{
  "isAction": true/false,
  "suggestedType": "action|insight|quote|question",
  "suggestedAction": {
    "title": "Kurzer Titel",
    "triggerSituation": "WENN...",
    "intendedBehavior": "DANN..."
  }
}`
        },
        {
          role: 'user',
          content: highlightText,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('AI analysis error:', error);
  }

  return {
    isAction: false,
    suggestedType: 'insight',
  };
}

