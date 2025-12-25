import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: Fetch due reviews for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get reviews that are due (next_review_date <= today)
    const today = new Date().toISOString().split('T')[0];

    const { data: reviews, error } = await supabase
      .from('spaced_repetition')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ reviews: [], count: 0 });
    }

    return NextResponse.json({
      reviews: reviews || [],
      count: reviews?.length || 0,
    });
  } catch (error) {
    console.error('Error in reviews GET:', error);
    return NextResponse.json({ reviews: [], count: 0 });
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
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, userId, quality } = body;
    
    // Quality: 0-5 (0=complete blackout, 5=perfect response)
    // We'll simplify to: 0=forgot, 3=hard, 4=good, 5=easy

    if (!reviewId || !userId || quality === undefined) {
      return NextResponse.json({ error: 'reviewId, userId, and quality required' }, { status: 400 });
    }

    // Fetch current review data
    const { data: current, error: fetchError } = await supabase
      .from('spaced_repetition')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // SM-2 Algorithm
    let { interval_days, ease_factor, repetitions } = current;
    
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
      .from('spaced_repetition')
      .update({
        interval_days,
        ease_factor,
        repetitions, // Fixed: was repetition_count
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

