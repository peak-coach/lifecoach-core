import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Supabase Admin Client (lazy initialization)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Max offene Actions pro User
const MAX_PENDING_ACTIONS = 10;

// ============================================
// GET: Hole Actions für einen User
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // pending, completed, all
    const goalId = searchParams.get('goalId');
    const sourceType = searchParams.get('sourceType'); // module, book, manual
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    let query = getSupabaseAdmin()
      .from('actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter nach Status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter nach Ziel
    if (goalId) {
      query = query.eq('goal_id', goalId);
    }

    // Filter nach Source
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    const { data: actions, error } = await query;

    if (error) throw error;

    // Berechne Statistiken
    const pending = actions?.filter(a => a.status === 'pending') || [];
    const overdue = pending.filter(a => a.due_date && new Date(a.due_date) < new Date());
    const dueToday = pending.filter(a => {
      if (!a.due_date) return false;
      const due = new Date(a.due_date);
      const today = new Date();
      return due.toDateString() === today.toDateString();
    });

    return NextResponse.json({
      actions,
      stats: {
        total: actions?.length || 0,
        pending: pending.length,
        overdue: overdue.length,
        dueToday: dueToday.length,
        completed: actions?.filter(a => a.status === 'completed').length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }
}

// ============================================
// POST: Neue Action erstellen
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      sourceType = 'manual',
      sourceId,
      sourceTitle,
      sourcePage,
      goalId,
      skillId,
      actionTitle,
      actionDescription,
      triggerSituation,
      intendedBehavior,
      successMetric,
      timingType = 'opportunity',
      dueDate,
      dueTime,
      reminderEnabled = true,
    } = body;

    if (!userId || !actionTitle) {
      return NextResponse.json(
        { error: 'userId and actionTitle required' },
        { status: 400 }
      );
    }

    // Prüfe Action-Limit
    const { data: pendingActions } = await getSupabaseAdmin()
      .from('actions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (pendingActions && pendingActions.length >= MAX_PENDING_ACTIONS) {
      return NextResponse.json(
        {
          error: 'Too many pending actions',
          message: `Du hast bereits ${pendingActions.length} offene Actions. Schließe einige ab bevor du neue erstellst.`,
          maxActions: MAX_PENDING_ACTIONS,
        },
        { status: 429 }
      );
    }

    // Erstelle Action
    const { data: action, error } = await getSupabaseAdmin()
      .from('actions')
      .insert({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        source_title: sourceTitle,
        source_page: sourcePage,
        goal_id: goalId,
        skill_id: skillId,
        action_title: actionTitle,
        action_description: actionDescription,
        trigger_situation: triggerSituation,
        intended_behavior: intendedBehavior,
        success_metric: successMetric,
        timing_type: timingType,
        due_date: dueDate,
        due_time: dueTime,
        reminder_enabled: reminderEnabled,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Error creating action:', error);
    return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
  }
}

// ============================================
// PATCH: Update Action (Complete, Skip, etc.)
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      actionId,
      userId,
      action, // 'complete', 'skip', 'archive', 'update'
      effectivenessRating,
      reflectionNote,
      wouldRepeat,
      skipReason,
      updates, // Für 'update' action
    } = body;

    if (!actionId || !userId) {
      return NextResponse.json({ error: 'actionId and userId required' }, { status: 400 });
    }

    let updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'complete':
        updateData = {
          ...updateData,
          status: 'completed',
          completed_at: new Date().toISOString(),
          effectiveness_rating: effectivenessRating,
          reflection_note: reflectionNote,
          would_repeat: wouldRepeat,
        };
        break;

      case 'skip':
        updateData = {
          ...updateData,
          status: 'skipped',
          skipped_at: new Date().toISOString(),
          skip_reason: skipReason,
        };
        break;

      case 'archive':
        updateData = {
          ...updateData,
          status: 'archived',
        };
        break;

      case 'update':
        // Erlaubte Felder für Update
        const allowedFields = [
          'action_title',
          'action_description',
          'trigger_situation',
          'intended_behavior',
          'success_metric',
          'timing_type',
          'due_date',
          'due_time',
          'reminder_enabled',
        ];
        
        for (const field of allowedFields) {
          if (updates?.[field] !== undefined) {
            updateData[field] = updates[field];
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('actions')
      .update(updateData)
      .eq('id', actionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, action: data });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
  }
}

// ============================================
// DELETE: Lösche eine Action
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actionId = searchParams.get('actionId');
    const userId = searchParams.get('userId');

    if (!actionId || !userId) {
      return NextResponse.json({ error: 'actionId and userId required' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('actions')
      .delete()
      .eq('id', actionId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
  }
}

