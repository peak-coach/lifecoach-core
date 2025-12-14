// ============================================
// PEAK COACH - Type Definitions
// ============================================

// User Types
export interface User {
  id: string;
  telegram_id: number | null;
  name: string;
  email: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  chronotype: 'early_bird' | 'night_owl' | 'neutral';
  personality_type: string | null;
  learning_style: string | null;
  work_hours_start: string;
  work_hours_end: string;
  deep_work_duration_min: number;
  motivators: string[];
  demotivators: string[];
  coach_style: 'tough' | 'gentle' | 'balanced';
  notification_frequency: 'low' | 'normal' | 'high';
  current_level: number;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

// Goal Types
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  progress_percent: number;
  deadline: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export type GoalCategory = 'career' | 'health' | 'learning' | 'finance' | 'relationships' | 'personal';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';

// Task Types
export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_minutes: number | null;
  priority: Priority;
  energy_required: EnergyLevel;
  category: string | null;
  status: TaskStatus;
  completed_at: string | null;
  times_postponed: number;
  skip_reason: string | null;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  created_at: string;
  updated_at: string;
}

export type Priority = 'high' | 'medium' | 'low';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'postponed';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

// Daily Log Types
export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  morning_mood: number | null;
  morning_energy: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  morning_notes: string | null;
  evening_mood: number | null;
  evening_energy: number | null;
  wins: string[];
  struggles: string[];
  grateful_for: string[];
  learnings: string | null;
  tomorrow_focus: string | null;
  tasks_planned: number;
  tasks_completed: number;
  tasks_skipped: number;
  productivity_score: number | null;
  coach_morning_message: string | null;
  coach_evening_message: string | null;
  created_at: string;
  updated_at: string;
}

// Habit Types
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: HabitCategory;
  frequency: HabitFrequency;
  target_days: string[] | null;
  current_streak: number;
  best_streak: number;
  total_completions: number;
  preferred_time: string | null;
  reminder_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  completed_at: string | null;
  skipped: boolean;
  skip_reason: string | null;
  notes: string | null;
  created_at: string;
}

export type HabitCategory = 'health' | 'productivity' | 'mindset' | 'social';
export type HabitFrequency = 'daily' | 'weekly' | 'specific_days';

// Learning Types
export interface Learning {
  id: string;
  user_id: string;
  date: string;
  category: string | null;
  what_worked: string | null;
  what_didnt: string | null;
  key_insight: string;
  apply_to: string[];
  source: LearningSource;
  created_at: string;
}

export type LearningSource = 'daily_review' | 'weekly_review' | 'manual';

// Decision Types
export interface Decision {
  id: string;
  user_id: string;
  title: string;
  context: string | null;
  options: DecisionOption[];
  chosen_option: string | null;
  reasoning: string | null;
  gut_feeling: number | null;
  review_date: string | null;
  review_completed: boolean;
  review_rating: number | null;
  review_notes: string | null;
  would_do_again: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionOption {
  name: string;
  pros: string[];
  cons: string[];
}

// Coach Message Types
export interface CoachMessage {
  id: string;
  user_id: string;
  message_type: CoachMessageType;
  content: string;
  trigger_reason: string | null;
  context_data: Record<string, any> | null;
  delivered_at: string | null;
  read_at: string | null;
  platform: 'telegram' | 'web';
  user_response: string | null;
  response_at: string | null;
  created_at: string;
}

export type CoachMessageType = 'morning' | 'evening' | 'intervention' | 'motivation' | 'warning' | 'celebration';

// Weekly Review Types
export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  avg_mood: number | null;
  avg_energy: number | null;
  avg_sleep: number | null;
  total_tasks_planned: number;
  total_tasks_completed: number;
  completion_rate: number | null;
  goal_progress: Record<string, number>;
  best_day: string | null;
  worst_day: string | null;
  patterns_detected: Pattern[];
  key_wins: string[];
  key_struggles: string[];
  main_learning: string | null;
  next_week_focus: string | null;
  coach_analysis: string | null;
  recommendations: Recommendation[];
  created_at: string;
}

export interface Pattern {
  type: string;
  description: string;
  confidence: number;
}

export interface Recommendation {
  category: string;
  suggestion: string;
  priority: Priority;
}

// Accountability Types
export interface AccountabilityStake {
  id: string;
  user_id: string;
  stake_type: 'financial' | 'social' | 'commitment';
  description: string | null;
  amount_cents: number | null;
  currency: string;
  recipient: 'charity' | 'anti_charity' | 'friend';
  recipient_details: string | null;
  goal_id: string | null;
  habit_id: string | null;
  condition_description: string | null;
  deadline: string | null;
  status: 'active' | 'won' | 'lost' | 'cancelled';
  triggered_at: string | null;
  created_at: string;
}

// Check-in Types
export interface MorningCheckin {
  mood: number;
  energy: number;
  sleep_hours: number;
  sleep_quality: number;
  notes?: string;
}

export interface EveningReview {
  mood: number;
  energy: number;
  wins: string[];
  struggles: string[];
  grateful_for: string[];
  learnings?: string;
  tomorrow_focus?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Stats Types
export interface DailyStats {
  date: string;
  mood: number | null;
  energy: number | null;
  tasks_completed: number;
  tasks_planned: number;
  completion_rate: number;
  habits_completed: number;
  habits_total: number;
}

export interface WeeklyStats {
  week_start: string;
  week_end: string;
  avg_mood: number;
  avg_energy: number;
  avg_sleep: number;
  total_tasks_completed: number;
  total_tasks_planned: number;
  completion_rate: number;
  best_day: string;
  worst_day: string;
}

// Gamification Types
export interface XPAction {
  action: string;
  xp: number;
}

export interface Level {
  level: number;
  xp_required: number;
  title: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at?: string;
}

