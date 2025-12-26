import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: Fetch due reviews for a user (modules + book highlights)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'all', 'modules', 'books'

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const reviews: any[] = [];

    // Fetch MODULE reviews (unless type='books')
    if (type !== 'books') {
      const { data: moduleReviews, error: moduleError } = await supabase
        .from('spaced_repetition')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true });

      if (!moduleError && moduleReviews) {
        reviews.push(...moduleReviews.map(r => ({
          ...r,
          type: 'module',
        })));
      }
    }

    // Fetch BOOK HIGHLIGHT reviews (unless type='modules')
    if (type !== 'modules') {
      const { data: bookHighlights, error: bookError } = await supabase
        .from('book_highlights')
        .select(`
          id,
          highlight_text,
          user_note,
          page_number,
          next_review_date,
          interval_days,
          ease_factor,
          repetitions,
          book_id,
          books:book_id (
            id,
            title,
            author
          )
        `)
        .eq('user_id', userId)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true });

      if (!bookError && bookHighlights) {
        reviews.push(...bookHighlights.map((h: any) => ({
          id: h.id,
          type: 'book',
          module_id: `book-${h.book_id}`,
          module_title: h.books?.title || 'Unbekanntes Buch',
          category: 'Buch',
          book_author: h.books?.author,
          highlight_text: h.highlight_text,
          user_note: h.user_note,
          page_number: h.page_number,
          review_questions: [{
            question: h.highlight_text,
            answer: h.user_note || 'Denke an die Bedeutung dieses Highlights.',
          }],
          interval_days: h.interval_days || 1,
          repetitions: h.repetitions || 0,
          ease_factor: h.ease_factor || 2.5,
          next_review_date: h.next_review_date,
        })));
      }
    }

    // Sort by next_review_date
    reviews.sort((a, b) => 
      new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime()
    );

    return NextResponse.json({
      reviews,
      count: reviews.length,
      moduleCount: reviews.filter(r => r.type === 'module').length,
      bookCount: reviews.filter(r => r.type === 'book').length,
    });
  } catch (error) {
    console.error('Error in reviews GET:', error);
    return NextResponse.json({ reviews: [], count: 0, moduleCount: 0, bookCount: 0 });
  }
}

// POST: Create a new review item (called after module completion)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      moduleId, 
      moduleTitle, 
      category, 
      goalId,
      reviewQuestions,
      concept 
    } = body;

    if (!userId || !moduleId) {
      return NextResponse.json({ error: 'userId and moduleId required' }, { status: 400 });
    }

    // Calculate first review date (1 day from now - SM-2 algorithm start)
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + 1);

    const { data, error } = await supabase
      .from('spaced_repetition')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        module_title: moduleTitle,
        category: category,
        goal_id: goalId,
        review_questions: reviewQuestions || [],
        concept: concept,
        next_review_date: nextReviewDate.toISOString().split('T')[0],
        interval_days: 1,
        ease_factor: 2.5, // Default SM-2 ease factor
        repetitions: 0, // Fixed: was repetition_count
      }, {
        onConflict: 'user_id,module_id',
      });

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in reviews POST:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH: Update review after user completes it (SM-2 algorithm)
// Supports both module reviews (spaced_repetition) and book highlights
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, userId, quality, type = 'module' } = body;
    
    // Quality: 0-5 (0=complete blackout, 5=perfect response)
    // We'll simplify to: 0=forgot, 3=hard, 4=good, 5=easy

    if (!reviewId || !userId || quality === undefined) {
      return NextResponse.json({ error: 'reviewId, userId, and quality required' }, { status: 400 });
    }

    // Determine table based on type
    const table = type === 'book' ? 'book_highlights' : 'spaced_repetition';

    // Fetch current review data
    const { data: current, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // SM-2 Algorithm
    let interval_days = current.interval_days || 1;
    let ease_factor = current.ease_factor || 2.5;
    let repetitions = current.repetitions || 0;
    
    if (quality < 3) {
      // Failed - reset
      repetitions = 0;
      interval_days = 1;
    } else {
      // Success
      repetitions += 1;
      
      if (repetitions === 1) {
        interval_days = 1;
      } else if (repetitions === 2) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }

      // Update ease factor
      ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval_days);

    const { error: updateError } = await supabase
      .from(table)
      .update({
        interval_days,
        ease_factor,
        repetitions,
        next_review_date: nextReviewDate.toISOString().split('T')[0],
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      nextReviewIn: interval_days,
      nextReviewDate: nextReviewDate.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error in reviews PATCH:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

