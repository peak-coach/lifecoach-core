// ============================================
// PEAK COACH - Helper Functions
// ============================================

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
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
 * Calculate average of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
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

