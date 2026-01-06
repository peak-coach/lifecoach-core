import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create Supabase client with service role for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET: Fetch learning stats for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const goalId = searchParams.get('goalId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get learning settings
    const { data: settings } = await supabase
      .from('learning_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get today's learning activity
    const today = new Date().toISOString().split('T')[0];
    const { data: todayActivity } = await supabase
      .from('learning_activity')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    // Get modules due for review (spaced repetition)
    const { data: reviewsDue } = await supabase
      .from('spaced_repetition')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_date', today);

    // Get progress for specific goal if requested
    let goalProgress = null;
    if (goalId) {
      const { data: progress } = await supabase
        .from('goal_learning_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_id', goalId)
        .single();
      goalProgress = progress;
    }

    // Get all goal progress for this user
    const { data: allGoalProgress } = await supabase
      .from('goal_learning_progress')
      .select('*')
      .eq('user_id', userId);

    // Get pending action items (transfer follow-up)
    const { data: pendingActions } = await supabase
      .from('learning_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('follow_up_date', today);

    return NextResponse.json({
      settings: settings || {
        learning_level: 'standard',
        daily_goal_minutes: 15,
        streak_current: 0,
        streak_best: 0,
        total_modules_completed: 0,
      },
      todayActivity: todayActivity || [],
      reviewsDue: reviewsDue || [],
      goalProgress,
      allGoalProgress: allGoalProgress || [],
      pendingActions: pendingActions || [],
      learnedToday: (todayActivity?.length || 0) > 0,
    });
  } catch (error) {
    console.error('Learning GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch learning data' }, { status: 500 });
  }
}

// POST: Log learning activity and update streak
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, activityType, moduleId, pathId, durationMinutes, metadata } = body;

    if (!userId || !activityType) {
      return NextResponse.json({ error: 'userId and activityType required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Log the activity
    const { data: activity, error: activityError } = await supabase
      .from('learning_activity')
      .insert({
        user_id: userId,
        activity_type: activityType,
        module_id: moduleId,
        path_id: pathId,
        duration_minutes: durationMinutes,
        metadata,
      })
      .select()
      .single();

    if (activityError) {
      console.error('Activity insert error:', activityError);
    }

    // Update streak
    let streakResult = { current: 0, best: 0 };
    
    // Get current settings
    const { data: currentSettings } = await supabase
      .from('learning_settings')
      .select('streak_current, streak_best, last_learning_date')
      .eq('user_id', userId)
      .single();

    if (currentSettings) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = currentSettings.last_learning_date;
      
      let newStreak = currentSettings.streak_current;
      
      if (!lastDate) {
        // First time learning
        newStreak = 1;
      } else if (lastDate === today) {
        // Already learned today, keep streak
        newStreak = currentSettings.streak_current;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDate === yesterdayStr) {
          // Consecutive day, increase streak
          newStreak = currentSettings.streak_current + 1;
        } else {
          // Streak broken, reset to 1
          newStreak = 1;
        }
      }

      const newBest = Math.max(newStreak, currentSettings.streak_best);

      // Update settings
      await supabase
        .from('learning_settings')
        .update({
          streak_current: newStreak,
          streak_best: newBest,
          last_learning_date: today,
          total_modules_completed: activityType === 'module_completed' 
            ? (currentSettings as any).total_modules_completed + 1 
            : (currentSettings as any).total_modules_completed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      streakResult = { current: newStreak, best: newBest };
    } else {
      // Create settings if not exist
      await supabase
        .from('learning_settings')
        .insert({
          user_id: userId,
          streak_current: 1,
          streak_best: 1,
          last_learning_date: new Date().toISOString().split('T')[0],
          total_modules_completed: activityType === 'module_completed' ? 1 : 0,
        });
      streakResult = { current: 1, best: 1 };
    }

    // If module completed, do multiple things
    if (activityType === 'module_completed') {
      const goalId = metadata?.goalId;
      const moduleNumber = metadata?.moduleNumber || 1;
      const quizScore = metadata?.quizScore || 0;
      const actionTask = metadata?.actionTask;
      
      console.log('[Learning API] Module completed:', {
        userId,
        goalId,
        moduleNumber,
        moduleTitle: metadata?.moduleTitle,
        nextModule: moduleNumber + 1,
      });
      
      // 1. Schedule spaced repetition review
      if (moduleId) {
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1); // First review tomorrow

        const { error: srError } = await supabase
          .from('spaced_repetition')
          .upsert({
            user_id: userId,
            module_id: moduleId,
            goal_id: goalId,
            next_review_date: nextReview.toISOString().split('T')[0],
            interval_days: 1,
            repetitions: 1,
            review_questions: metadata?.reviewQuestions || [],
          }, {
            onConflict: 'user_id,module_id',
          });
        
        if (srError) {
          console.error('[Learning API] Spaced repetition error:', srError);
        }
      }
      
      // 2. Update goal learning progress
      if (goalId) {
        const { data: existingProgress, error: fetchError } = await supabase
          .from('goal_learning_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('goal_id', goalId)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[Learning API] Error fetching progress:', fetchError);
        }
        
        if (existingProgress) {
          // Update existing progress
          const { error: updateError } = await supabase
            .from('goal_learning_progress')
            .update({
              current_module: moduleNumber + 1,
              last_module_completed: moduleNumber,
              last_quiz_score: quizScore,
              total_modules_completed: existingProgress.total_modules_completed + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('goal_id', goalId);
          
          if (updateError) {
            console.error('[Learning API] Error updating progress:', updateError);
          } else {
            console.log('[Learning API] Progress updated: current_module =', moduleNumber + 1);
          }
        } else {
          // Create new progress
          const { error: insertError } = await supabase
            .from('goal_learning_progress')
            .insert({
              user_id: userId,
              goal_id: goalId,
              current_module: moduleNumber + 1,
              last_module_completed: moduleNumber,
              last_quiz_score: quizScore,
              total_modules_completed: 1,
            });
          
          if (insertError) {
            console.error('[Learning API] Error inserting progress:', insertError);
          } else {
            console.log('[Learning API] Progress created: current_module =', moduleNumber + 1);
          }
        }
      } else {
        console.warn('[Learning API] WARNING: No goalId provided - progress will NOT be saved!');
      }
      
      // 3. Create action follow-up for transfer tracking
      if (actionTask) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 1); // Follow up tomorrow
        
        await supabase
          .from('learning_actions')
          .insert({
            user_id: userId,
            goal_id: goalId,
            module_id: moduleId,
            action_task: actionTask,
            follow_up_date: followUpDate.toISOString().split('T')[0],
            status: 'pending',
          });
      }
    }

    // Grant XP
    const xpAmount = activityType === 'module_completed' ? 50 : 20;
    let xpGranted = false;
    
    try {
      // Try RPC function first
      const { error: rpcError } = await supabase.rpc('add_xp', { 
        p_user_id: userId, 
        p_xp_amount: xpAmount 
      });
      
      if (rpcError) {
        console.log('[Learning API] RPC add_xp failed, using fallback:', rpcError.message);
        throw rpcError;
      }
      xpGranted = true;
      console.log('[Learning API] XP granted via RPC:', xpAmount);
    } catch (xpError) {
      // Fallback: Direct table update
      try {
        // Ensure user_gamification exists
        await supabase
          .from('user_gamification')
          .upsert({
            user_id: userId,
            total_xp: 0,
            current_level: 1,
          }, { onConflict: 'user_id', ignoreDuplicates: true });
        
        // Get current XP
        const { data: gamification } = await supabase
          .from('user_gamification')
          .select('total_xp, current_level')
          .eq('user_id', userId)
          .single();
        
        const currentXP = gamification?.total_xp || 0;
        const newXP = currentXP + xpAmount;
        
        // Calculate level
        const newLevel = newXP >= 12000 ? 10 :
                        newXP >= 8000 ? 9 :
                        newXP >= 5500 ? 8 :
                        newXP >= 3500 ? 7 :
                        newXP >= 2000 ? 6 :
                        newXP >= 1000 ? 5 :
                        newXP >= 500 ? 4 :
                        newXP >= 250 ? 3 :
                        newXP >= 100 ? 2 : 1;
        
        // Update gamification
        await supabase
          .from('user_gamification')
          .update({
            total_xp: newXP,
            current_level: newLevel,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        
        // Log XP event
        await supabase
          .from('xp_events')
          .insert({
            user_id: userId,
            event_type: activityType,
            xp_amount: xpAmount,
            description: `${activityType}: ${metadata?.moduleTitle || 'Learning'}`,
          });
        
        // Also update learning_settings.total_xp
        await supabase
          .from('learning_settings')
          .update({ total_xp: newXP })
          .eq('user_id', userId);
        
        xpGranted = true;
        console.log('[Learning API] XP granted via fallback:', xpAmount, 'New total:', newXP);
      } catch (fallbackError) {
        console.error('[Learning API] XP fallback also failed:', fallbackError);
      }
    }

    return NextResponse.json({
      success: true,
      activity,
      streak: streakResult,
      xpEarned: xpAmount,
      xpGranted,
    });
  } catch (error) {
    console.error('Learning POST error:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}

