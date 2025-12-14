// ============================================
// PEAK COACH - Utility Functions
// ============================================

import { LEVELS, XP_ACTIONS } from '../constants';

/**
 * Calculate user level based on XP
 */
export function calculateLevel(totalXp: number): { level: number; title: string; progress: number; nextLevelXp: number } {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp_required) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }

  const xpInCurrentLevel = totalXp - currentLevel.xp_required;
  const xpNeededForNextLevel = nextLevel.xp_required - currentLevel.xp_required;
  const progress = xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : 100;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    progress: Math.min(100, Math.round(progress)),
    nextLevelXp: nextLevel.xp_required,
  };
}

/**
 * Calculate XP for an action
 */
export function getXpForAction(action: keyof typeof XP_ACTIONS): number {
  return XP_ACTIONS[action] || 0;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format time to HH:MM
 */
export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(hour: number = new Date().getHours()): string {
  if (hour < 12) return 'Guten Morgen';
  if (hour < 17) return 'Guten Tag';
  if (hour < 21) return 'Guten Abend';
  return 'Gute Nacht';
}

/**
 * Get day of week in German
 */
export function getDayOfWeek(date: Date = new Date()): string {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return days[date.getDay()];
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get mood emoji based on value (1-10)
 */
export function getMoodEmoji(mood: number): string {
  if (mood <= 2) return '😫';
  if (mood <= 4) return '😔';
  if (mood <= 5) return '😐';
  if (mood <= 6) return '🙂';
  if (mood <= 7) return '😊';
  if (mood <= 8) return '😁';
  return '🤩';
}

/**
 * Get energy emoji based on value (1-10)
 */
export function getEnergyEmoji(energy: number): string {
  if (energy <= 2) return '🪫';
  if (energy <= 4) return '😴';
  if (energy <= 6) return '😐';
  if (energy <= 8) return '⚡';
  return '🔥';
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get start of week (Monday)
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Sunday)
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return formatDate(d) === formatDate(today);
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Days until date
 */
export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

/**
 * Sleep for ms
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a simple unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Calculate average of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

