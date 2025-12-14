// ============================================
// PEAK COACH - Constants
// ============================================

// XP System
export const XP_ACTIONS = {
  TASK_COMPLETED: 10,
  TASK_COMPLETED_HIGH_PRIORITY: 20,
  TASK_COMPLETED_ON_TIME: 5,
  HABIT_COMPLETED: 15,
  HABIT_STREAK_MAINTAINED: 5,
  STREAK_MILESTONE_7: 50,
  STREAK_MILESTONE_30: 200,
  STREAK_MILESTONE_100: 500,
  MORNING_CHECKIN: 5,
  MORNING_CHECKIN_EARLY: 10,
  EVENING_REVIEW: 10,
  EVENING_REVIEW_DETAILED: 15,
  GOAL_PROGRESS_10: 25,
  GOAL_COMPLETED: 500,
  LEARNING_ADDED: 20,
  DECISION_DOCUMENTED: 30,
  DECISION_REVIEWED: 25,
} as const;

// Level System
export const LEVELS = [
  { level: 1, xp_required: 0, title: 'Beginner' },
  { level: 2, xp_required: 100, title: 'Committed' },
  { level: 3, xp_required: 300, title: 'Consistent' },
  { level: 4, xp_required: 600, title: 'Focused' },
  { level: 5, xp_required: 1000, title: 'Dedicated' },
  { level: 6, xp_required: 1500, title: 'Disciplined' },
  { level: 7, xp_required: 2500, title: 'Elite' },
  { level: 8, xp_required: 4000, title: 'Master' },
  { level: 9, xp_required: 6000, title: 'Legend' },
  { level: 10, xp_required: 10000, title: 'Peak Performer' },
] as const;

// Badges
export const BADGES = [
  { id: 'early_bird', name: 'Early Bird', description: '7 day streak morning check-in before 7am', icon: '🐦' },
  { id: 'night_owl', name: 'Night Owl', description: '7 day streak evening review', icon: '🦉' },
  { id: 'deep_worker', name: 'Deep Worker', description: 'Complete 10 deep work sessions', icon: '🧠' },
  { id: 'habit_starter', name: 'Habit Starter', description: '7 day streak on any habit', icon: '🌱' },
  { id: 'habit_master', name: 'Habit Master', description: '30 day streak on any habit', icon: '🌳' },
  { id: 'habit_legend', name: 'Habit Legend', description: '100 day streak on any habit', icon: '🏆' },
  { id: 'goal_setter', name: 'Goal Setter', description: 'Create your first goal', icon: '🎯' },
  { id: 'goal_crusher', name: 'Goal Crusher', description: 'Complete 3 goals', icon: '💪' },
  { id: 'reflector', name: 'Reflector', description: '30 day journal streak', icon: '📝' },
  { id: 'unstoppable', name: 'Unstoppable', description: '100% task completion for 7 days', icon: '🔥' },
  { id: 'learner', name: 'Learner', description: 'Document 10 learnings', icon: '📚' },
  { id: 'decision_maker', name: 'Decision Maker', description: 'Document and review 5 decisions', icon: '⚖️' },
  { id: 'comeback', name: 'Comeback Kid', description: 'Return after 7+ days inactive', icon: '🔄' },
] as const;

// Coach Message Templates
export const COACH_STYLES = {
  tough: {
    greeting_good: "Zeit aufzustehen und zu liefern.",
    greeting_bad: "Schwieriger Start? Egal. Wir machen trotzdem.",
    motivation: "Keine Ausreden. Du hast dir das Ziel gesetzt.",
    celebration: "Gut. Weiter.",
  },
  gentle: {
    greeting_good: "Guten Morgen! Ich hoffe du hast gut geschlafen. 🌅",
    greeting_bad: "Hey, das ist okay. Lass uns den Tag sanft angehen. 💙",
    motivation: "Du machst das großartig. Ein Schritt nach dem anderen.",
    celebration: "Das hast du toll gemacht! Ich bin stolz auf dich! 🎉",
  },
  balanced: {
    greeting_good: "Guten Morgen! Bereit für einen produktiven Tag?",
    greeting_bad: "Kein perfekter Start, aber wir passen an. Das kriegen wir hin.",
    motivation: "Du hast dir das vorgenommen. Ich weiß du kannst das.",
    celebration: "Stark! Das war gute Arbeit. 💪",
  },
} as const;

// Time Constants
export const SCHEDULE = {
  MORNING_CHECKIN_START: '06:00',
  MORNING_CHECKIN_IDEAL: '07:00',
  MORNING_CHECKIN_LATE: '10:00',
  MIDDAY_CHECK: '12:00',
  AFTERNOON_NUDGE: '15:00',
  EVENING_REVIEW_START: '19:00',
  EVENING_REVIEW_IDEAL: '21:00',
  EVENING_REVIEW_LATE: '23:00',
} as const;

// Skip Reasons
export const SKIP_REASONS = [
  'Keine Zeit heute',
  'Zu müde/keine Energie',
  'Blockiert/brauche etwas',
  'Nicht mehr relevant',
  'Zu schwierig',
  'Vergessen',
  'Anderer Grund',
] as const;

// Categories
export const GOAL_CATEGORIES = [
  { id: 'career', name: 'Karriere', icon: '💼', color: '#3B82F6' },
  { id: 'health', name: 'Gesundheit', icon: '🏋️', color: '#10B981' },
  { id: 'learning', name: 'Lernen', icon: '📚', color: '#8B5CF6' },
  { id: 'finance', name: 'Finanzen', icon: '💰', color: '#F59E0B' },
  { id: 'relationships', name: 'Beziehungen', icon: '❤️', color: '#EF4444' },
  { id: 'personal', name: 'Persönlich', icon: '🌟', color: '#EC4899' },
] as const;

export const HABIT_CATEGORIES = [
  { id: 'health', name: 'Gesundheit', icon: '💪', color: '#10B981' },
  { id: 'productivity', name: 'Produktivität', icon: '⚡', color: '#3B82F6' },
  { id: 'mindset', name: 'Mindset', icon: '🧘', color: '#8B5CF6' },
  { id: 'social', name: 'Sozial', icon: '👥', color: '#F59E0B' },
] as const;

// Intervention Triggers
export const INTERVENTION_TRIGGERS = {
  NO_TASK_UPDATE_HOURS: 4,
  LOW_MOOD_DAYS: 2,
  LOW_MOOD_THRESHOLD: 5,
  STREAK_WARNING_HOURS: 20,
  LOW_SLEEP_DAYS: 3,
  LOW_SLEEP_THRESHOLD: 6,
  TASK_POSTPONED_TIMES: 3,
  GOAL_DEADLINE_WARNING_DAYS: 7,
} as const;

// Emojis
export const MOOD_EMOJIS = ['😫', '😔', '😐', '🙂', '😊', '😁', '🤩'] as const;
export const ENERGY_EMOJIS = ['🪫', '😴', '😐', '⚡', '🔥'] as const;
export const PRIORITY_EMOJIS = { high: '🔴', medium: '🟡', low: '🟢' } as const;
export const STATUS_EMOJIS = {
  pending: '⬜',
  in_progress: '🔄',
  completed: '✅',
  skipped: '⏭️',
  postponed: '📅',
} as const;

