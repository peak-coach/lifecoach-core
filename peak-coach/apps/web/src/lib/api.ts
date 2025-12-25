import { createClient } from './supabase';

// ============================================
// Types
// ============================================

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'postponed';
  completed_at: string | null;
  goal_id: string | null;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: 'health' | 'productivity' | 'mindset' | 'social' | null;
  current_streak: number;
  best_streak: number;
  total_completions: number;
  is_active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'career' | 'health' | 'learning' | 'finance' | 'relationships' | 'personal' | null;
  target_value: number | null;
  current_value: number;
  deadline: string | null;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  why_important: string | null;
  created_at: string;
  // Hierarchy fields
  goal_type: 'long' | 'short' | 'sprint';
  parent_goal_id: string | null;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  morning_mood: number | null;
  morning_energy: number | null;
  sleep_hours: number | null;
  tasks_completed: number;
  tasks_planned: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  current_level: number;
  total_xp: number;
  coach_style: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
}

// ============================================
// API Functions
// ============================================

// Get or Create User - uses auth user ID directly as user_id
export async function getUserByAuthId(authId: string) {
  const supabase = createClient();
  
  // Get the authenticated user
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    console.log('No auth user found');
    return null;
  }

  const authUser = authData.user;
  console.log('Auth user:', authUser.email, authUser.id);

  // Try to find user by auth ID first (id field = auth.uid)
  let { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  // If not found by ID, try by email
  if (error || !data) {
    const { data: emailUser, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single();
    
    if (emailUser) {
      data = emailUser;
      error = null;
    }
  }

  if (error || !data) {
    console.log('User not found, creating with auth ID...');
    
    // Create user with auth.uid as the ID
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: authUser.id, // Use auth UID as user ID
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      
      // If insert fails (maybe RLS), return a fake user object with auth info
      // This allows the app to work while RLS is being configured
      console.log('Returning auth user as fallback');
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        created_at: new Date().toISOString(),
      };
    }
    console.log('Created new user:', newUser);
    return newUser;
  }

  console.log('Found user:', data);
  return data;
}

// Helper to get supabase client
function getSupabase() {
  return createClient();
}

// Tasks
export async function getTodaysTasks(userId: string): Promise<Task[]> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('scheduled_date', today)
    .order('scheduled_time', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return data || [];
}

export async function getAllTasks(userId: string): Promise<Task[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return data || [];
}

export async function createTask(task: Partial<Task> & { user_id: string; title: string }) {
  const supabase = getSupabase();
  console.log('Creating task:', task);
  
  // Add default values
  const taskWithDefaults = {
    ...task,
    status: task.status || 'pending',
    priority: task.priority || 'medium',
  };
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskWithDefaults)
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return null;
  }

  console.log('Task created:', data);
  return data;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    return null;
  }

  return data;
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  return updateTask(taskId, {
    status: completed ? 'completed' : 'pending',
    completed_at: completed ? new Date().toISOString() : null,
  });
}

export async function deleteTask(taskId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  return !error;
}

// Habits
export async function getHabits(userId: string): Promise<Habit[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching habits:', error);
    return [];
  }

  return data || [];
}

export async function getTodaysHabitLogs(userId: string): Promise<HabitLog[]> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today);

  if (error) {
    console.error('Error fetching habit logs:', error);
    return [];
  }

  return data || [];
}

export async function createHabit(habit: Partial<Habit> & { user_id: string; name: string }) {
  const supabase = getSupabase();
  console.log('Creating habit:', habit);
  
  // Add default values
  const habitWithDefaults = {
    ...habit,
    current_streak: 0,
    best_streak: 0,
    total_completions: 0,
    is_active: true,
  };
  
  const { data, error } = await supabase
    .from('habits')
    .insert(habitWithDefaults)
    .select()
    .single();

  if (error) {
    console.error('Error creating habit:', error);
    return null;
  }
  return data;
}

export async function updateHabit(habitId: string, updates: Partial<Habit>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .select()
    .single();

  if (error) {
    console.error('Error updating habit:', error);
    return null;
  }

  console.log('Habit created:', data);
  return data;
}

export async function toggleHabitComplete(habitId: string, userId: string, completed: boolean) {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  // Check if log exists for today
  const { data: existing } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .eq('date', today)
    .single();

  if (existing) {
    // Update existing log
    const { error } = await supabase
      .from('habit_logs')
      .update({ 
        completed, 
        completed_at: completed ? new Date().toISOString() : null 
      })
      .eq('id', existing.id);

    return !error;
  } else {
    // Create new log
    const { error } = await supabase
      .from('habit_logs')
      .insert({
        habit_id: habitId,
        user_id: userId,
        date: today,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      });

    // Update streak if completed
    if (!error && completed) {
      await supabase.rpc('update_habit_streak', { p_habit_id: habitId });
    }

    return !error;
  }
}

export async function deleteHabit(habitId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('habits')
    .update({ is_active: false })
    .eq('id', habitId);

  return !error;
}

// Goals
export async function getGoals(userId: string): Promise<Goal[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('deadline', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  return data || [];
}

export async function createGoal(goal: Partial<Goal> & { user_id: string; title: string }) {
  const supabase = getSupabase();
  console.log('Creating goal:', goal);
  
  // Add default values
  const goalWithDefaults = {
    ...goal,
    target_value: goal.target_value || 100,
    current_value: goal.current_value || 0,
    status: goal.status || 'active',
    goal_type: goal.goal_type || 'long',
  };
  
  const { data, error } = await supabase
    .from('goals')
    .insert(goalWithDefaults)
    .select()
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    return null;
  }

  console.log('Goal created:', data);
  return data;
}

// Get goals with hierarchy
export async function getGoalsWithHierarchy(userId: string): Promise<Goal[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('goal_type', { ascending: true }) // long, short, sprint
    .order('deadline', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  return data || [];
}

// Get child goals
export async function getChildGoals(parentId: string): Promise<Goal[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('parent_goal_id', parentId)
    .eq('status', 'active')
    .order('deadline', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching child goals:', error);
    return [];
  }

  return data || [];
}

export async function updateGoal(goalId: string, updates: Partial<Goal>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating goal:', error);
    return null;
  }

  return data;
}

export async function deleteGoal(goalId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('goals')
    .update({ status: 'abandoned' })
    .eq('id', goalId);

  return !error;
}

// Milestones
export async function getMilestones(goalId: string): Promise<Milestone[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching milestones:', error);
    return [];
  }

  return data || [];
}

export async function createMilestone(milestone: { goal_id: string; user_id: string; title: string; position?: number }) {
  const supabase = getSupabase();
  console.log('Creating milestone:', milestone);
  
  const { data, error } = await supabase
    .from('milestones')
    .insert({
      ...milestone,
      completed: false,
      position: milestone.position || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating milestone:', error);
    return null;
  }

  console.log('Milestone created:', data);
  return data;
}

export async function toggleMilestone(milestoneId: string, completed: boolean) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('milestones')
    .update({ 
      completed, 
      completed_at: completed ? new Date().toISOString() : null 
    })
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling milestone:', error);
    return null;
  }

  return data;
}

export async function deleteMilestone(milestoneId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId);

  return !error;
}

// Daily Logs
export async function getTodaysLog(userId: string): Promise<DailyLog | null> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function createOrUpdateDailyLog(userId: string, log: Partial<DailyLog>) {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert({
      user_id: userId,
      date: today,
      ...log,
    }, {
      onConflict: 'user_id,date',
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating daily log:', error);
    return null;
  }

  return data;
}

// User Profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Create profile if not exists
    const { data: newProfile, error: createError } = await supabase
      .from('user_profile')
      .insert({ user_id: userId })
      .select()
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      return null;
    }
    return newProfile;
  }

  return data;
}

// Stats
export async function getDashboardStats(userId: string) {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('user_id', userId)
    .eq('scheduled_date', today);

  const tasksTotal = tasks?.length || 0;
  const tasksCompleted = tasks?.filter(t => t.status === 'completed').length || 0;

  // Get habits and their logs for today
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true);

  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('completed')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('completed', true);

  const habitsTotal = habits?.length || 0;
  const habitsCompleted = habitLogs?.length || 0;

  // Get today's log for mood/energy/sleep
  const { data: dailyLog } = await supabase
    .from('daily_logs')
    .select('morning_mood, morning_energy, sleep_hours')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  // Calculate streak (consecutive days with completed habits)
  // For now, just get the best streak from any habit
  const { data: streakData } = await supabase
    .from('habits')
    .select('current_streak, best_streak')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('current_streak', { ascending: false })
    .limit(1)
    .single();

  return {
    tasks: {
      total: tasksTotal,
      completed: tasksCompleted,
    },
    habits: {
      total: habitsTotal,
      completed: habitsCompleted,
    },
    today: {
      mood: dailyLog?.morning_mood || null,
      energy: dailyLog?.morning_energy || null,
      sleepHours: dailyLog?.sleep_hours || null,
    },
    streak: {
      current: streakData?.current_streak || 0,
      best: streakData?.best_streak || 0,
    },
  };
}

// ============================================
// Pomodoro
// ============================================

export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id: string | null;
  type: 'work' | 'short_break' | 'long_break';
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'completed' | 'cancelled';
}

export async function getActivePomodoro(userId: string): Promise<PomodoroSession | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function startPomodoro(
  userId: string,
  type: 'work' | 'short_break' | 'long_break',
  taskId?: string | null,
  durationMinutes?: number
): Promise<PomodoroSession | null> {
  const supabase = createClient();
  
  // Default durations
  const defaultDurations = {
    work: 25,
    short_break: 5,
    long_break: 15,
  };

  const { data } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: userId,
      task_id: taskId || null,
      type,
      duration_minutes: durationMinutes || defaultDurations[type],
      started_at: new Date().toISOString(),
      status: 'active',
    })
    .select()
    .single();

  return data;
}

export async function stopPomodoro(sessionId: string, status: 'completed' | 'cancelled' = 'cancelled'): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('pomodoro_sessions')
    .update({
      status,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

export async function getTodayPomodoroStats(userId: string): Promise<{ sessionsCompleted: number; totalMinutes: number }> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('pomodoro_sessions')
    .select('duration_minutes')
    .eq('user_id', userId)
    .eq('type', 'work')
    .eq('status', 'completed')
    .gte('started_at', `${today}T00:00:00`)
    .lte('started_at', `${today}T23:59:59`);

  return {
    sessionsCompleted: data?.length || 0,
    totalMinutes: data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0,
  };
}

// ============================================
// GAMIFICATION API
// ============================================

// XP Values
const XP_VALUES = {
  TASK_COMPLETED: 10,
  HABIT_COMPLETED: 15,
  STREAK_DAY: 20,
  MILESTONE_REACHED: 50,
  GOAL_COMPLETED: 100,
  PERFECT_DAY: 30,
};

// Level thresholds
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];

function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export interface GamificationData {
  totalXP: number;
  level: number;
  badges: string[];
  todayXP: number;
  todayEvents: Array<{ type: string; amount: number; description: string }>;
}

export async function getGamificationData(userId: string): Promise<GamificationData> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  
  // Get or create user gamification record
  let { data: gamification } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // If no record exists, create one
  if (!gamification) {
    const { data: newRecord } = await supabase
      .from('user_gamification')
      .insert({ user_id: userId })
      .select()
      .single();
    gamification = newRecord;
  }
  
  // Get today's XP events
  const { data: todayEvents } = await supabase
    .from('xp_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00`)
    .order('created_at', { ascending: false });
  
  const todayXP = todayEvents?.reduce((sum, e) => sum + e.xp_amount, 0) || 0;
  
  return {
    totalXP: gamification?.total_xp || 0,
    level: gamification?.current_level || 1,
    badges: gamification?.badges || [],
    todayXP,
    todayEvents: (todayEvents || []).map(e => ({
      type: e.event_type,
      amount: e.xp_amount,
      description: e.description || e.event_type,
    })),
  };
}

export async function addXPEvent(
  userId: string,
  eventType: string,
  amount: number,
  description: string,
  relatedId?: string
): Promise<{ newXP: number; newLevel: number }> {
  const supabase = createClient();
  
  // Add XP event
  await supabase
    .from('xp_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      xp_amount: amount,
      description,
      related_id: relatedId || null,
    });
  
  // Get current gamification data
  let { data: gamification } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // Create if not exists
  if (!gamification) {
    const { data: newRecord } = await supabase
      .from('user_gamification')
      .insert({ user_id: userId })
      .select()
      .single();
    gamification = newRecord;
  }
  
  const newXP = (gamification?.total_xp || 0) + amount;
  const newLevel = calculateLevel(newXP);
  const oldLevel = gamification?.current_level || 1;
  
  // Update gamification stats
  const updates: Record<string, unknown> = {
    total_xp: newXP,
    current_level: newLevel,
    updated_at: new Date().toISOString(),
  };
  
  // Update specific counters based on event type
  if (eventType === 'task_completed') {
    updates.tasks_completed_total = (gamification?.tasks_completed_total || 0) + 1;
  } else if (eventType === 'habit_completed') {
    updates.habits_completed_total = (gamification?.habits_completed_total || 0) + 1;
  } else if (eventType === 'goal_completed') {
    updates.goals_completed_total = (gamification?.goals_completed_total || 0) + 1;
  }
  
  await supabase
    .from('user_gamification')
    .update(updates)
    .eq('user_id', userId);
  
  // Check for badge unlocks
  await checkAndUnlockBadges(userId, newXP, newLevel, gamification);
  
  return { newXP, newLevel };
}

async function checkAndUnlockBadges(
  userId: string, 
  totalXP: number, 
  level: number, 
  gamification: Record<string, unknown> | null
) {
  const supabase = createClient();
  const currentBadges: string[] = (gamification?.badges as string[]) || [];
  const newBadges: string[] = [...currentBadges];
  
  // Check level badges
  if (level >= 5 && !currentBadges.includes('level_5')) {
    newBadges.push('level_5');
  }
  if (level >= 10 && !currentBadges.includes('level_10')) {
    newBadges.push('level_10');
  }
  
  // Check task count badges
  const tasksTotal = (gamification?.tasks_completed_total as number) || 0;
  if (tasksTotal >= 1 && !currentBadges.includes('first_task')) {
    newBadges.push('first_task');
  }
  
  // Check goal badges
  const goalsTotal = (gamification?.goals_completed_total as number) || 0;
  if (goalsTotal >= 5 && !currentBadges.includes('goal_crusher')) {
    newBadges.push('goal_crusher');
  }
  
  // Update badges if changed
  if (newBadges.length > currentBadges.length) {
    await supabase
      .from('user_gamification')
      .update({ badges: newBadges })
      .eq('user_id', userId);
  }
}

