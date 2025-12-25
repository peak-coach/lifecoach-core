import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: Check for pending transfer verifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get learning activities from last 7 days that haven't been transfer-verified
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: activities, error } = await supabase
      .from('learning_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', 'module_completed')
      .is('transfer_verified', null) // Not yet verified
      .gte('completed_at', sevenDaysAgo.toISOString())
      .lte('completed_at', oneDayAgo.toISOString()) // At least 24h ago
      .order('completed_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching transfer checks:', error);
      return NextResponse.json({ pendingTransfer: null });
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ pendingTransfer: null });
    }

    const activity = activities[0];
    const metadata = activity.metadata || {};

    return NextResponse.json({
      pendingTransfer: {
        id: activity.id,
        moduleTitle: metadata.moduleTitle || 'Lernmodul',
        goalTitle: metadata.goalTitle || 'Dein Ziel',
        completedAt: activity.completed_at,
        moduleNumber: metadata.moduleNumber,
      },
    });
  } catch (error) {
    console.error('Error in transfer GET:', error);
    return NextResponse.json({ pendingTransfer: null });
  }
}

// POST: Mark transfer as verified
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activityId, userId, applied, notes } = body;

    if (!activityId || !userId) {
      return NextResponse.json({ error: 'activityId and userId required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('learning_activity')
      .update({
        transfer_verified: true,
        transfer_applied: applied,
        transfer_notes: notes,
        transfer_verified_at: new Date().toISOString(),
      })
      .eq('id', activityId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating transfer:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    // If applied, give bonus XP
    if (applied) {
      try {
        await supabase.rpc('add_user_xp', {
          p_user_id: userId,
          p_xp_amount: 25, // Bonus XP for applying knowledge
          p_source: 'transfer_applied',
        });
      } catch (xpError) {
        console.error('Error adding XP:', xpError);
      }
    }

    return NextResponse.json({ success: true, bonusXp: applied ? 25 : 0 });
  } catch (error) {
    console.error('Error in transfer POST:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

