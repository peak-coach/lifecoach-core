// ============================================
// VARIABLE REWARDS & ACHIEVEMENTS SYSTEM
// ============================================

// Variable Reward System - Creates dopamine through unpredictability
export interface VariableReward {
  type: 'bonus_xp' | 'streak_bonus' | 'rare_badge' | 'motivation_quote';
  title: string;
  description: string;
  xpBonus: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  emoji: string;
}

const VARIABLE_REWARDS: VariableReward[] = [
  // Common (40% chance)
  { type: 'bonus_xp', title: 'Kleiner Bonus!', description: 'Für deinen Einsatz', xpBonus: 5, rarity: 'common', emoji: '✨' },
  { type: 'bonus_xp', title: 'Weitermachen!', description: 'Du bist auf dem richtigen Weg', xpBonus: 10, rarity: 'common', emoji: '💫' },
  { type: 'motivation_quote', title: 'Weisheit des Tages', description: 'Konsistenz schlägt Talent', xpBonus: 5, rarity: 'common', emoji: '📖' },
  
  // Uncommon (30% chance)
  { type: 'bonus_xp', title: 'Fokus-Bonus!', description: 'Für konzentriertes Lernen', xpBonus: 15, rarity: 'uncommon', emoji: '🎯' },
  { type: 'bonus_xp', title: 'Durchhalte-Bonus!', description: 'Du gibst nicht auf', xpBonus: 20, rarity: 'uncommon', emoji: '💪' },
  { type: 'streak_bonus', title: 'Streak-Power!', description: 'Deine Konsistenz zahlt sich aus', xpBonus: 25, rarity: 'uncommon', emoji: '🔥' },
  
  // Rare (20% chance)
  { type: 'bonus_xp', title: 'Seltener Fund!', description: 'Das Universum belohnt dich', xpBonus: 30, rarity: 'rare', emoji: '💎' },
  { type: 'bonus_xp', title: 'Wissens-Jackpot!', description: 'Dein Gehirn dankt dir', xpBonus: 40, rarity: 'rare', emoji: '🧠' },
  
  // Epic (8% chance)
  { type: 'bonus_xp', title: 'EPIC BONUS!', description: 'Außergewöhnliche Leistung!', xpBonus: 75, rarity: 'epic', emoji: '🌟' },
  { type: 'rare_badge', title: 'Geheimes Achievement!', description: 'Du hast etwas Besonderes entdeckt', xpBonus: 100, rarity: 'epic', emoji: '🏆' },
  
  // Legendary (2% chance)
  { type: 'bonus_xp', title: '⚡ LEGENDARY DROP ⚡', description: 'Unglaublich selten!', xpBonus: 200, rarity: 'legendary', emoji: '👑' },
];

// Roll for variable reward (slot machine effect)
export function rollVariableReward(): VariableReward | null {
  const roll = Math.random() * 100;
  
  // 30% chance to get ANY reward
  if (roll > 30) return null;
  
  // Determine rarity
  const rarityRoll = Math.random() * 100;
  let rarity: VariableReward['rarity'];
  
  if (rarityRoll < 40) rarity = 'common';
  else if (rarityRoll < 70) rarity = 'uncommon';
  else if (rarityRoll < 90) rarity = 'rare';
  else if (rarityRoll < 98) rarity = 'epic';
  else rarity = 'legendary';
  
  // Get rewards of this rarity
  const possibleRewards = VARIABLE_REWARDS.filter(r => r.rarity === rarity);
  
  // Pick random reward from rarity pool
  return possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
}

// ============================================
// ACHIEVEMENTS / BADGES
// ============================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'learning' | 'streak' | 'goals' | 'special';
  requirement: {
    type: 'modules_completed' | 'streak_days' | 'total_xp' | 'goals_completed' | 'quizzes_aced' | 'categories_explored';
    value: number;
  };
  xpReward: number;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export const BADGES: Badge[] = [
  // Learning Badges
  { id: 'first_module', name: 'Erster Schritt', description: 'Erstes Modul abgeschlossen', emoji: '🎓', category: 'learning', requirement: { type: 'modules_completed', value: 1 }, xpReward: 50, rarity: 'bronze' },
  { id: 'module_5', name: 'Wissbegierig', description: '5 Module abgeschlossen', emoji: '📚', category: 'learning', requirement: { type: 'modules_completed', value: 5 }, xpReward: 100, rarity: 'silver' },
  { id: 'module_10', name: 'Lern-Enthusiast', description: '10 Module abgeschlossen', emoji: '🎯', category: 'learning', requirement: { type: 'modules_completed', value: 10 }, xpReward: 200, rarity: 'gold' },
  { id: 'module_25', name: 'Wissens-Sammler', description: '25 Module abgeschlossen', emoji: '💎', category: 'learning', requirement: { type: 'modules_completed', value: 25 }, xpReward: 500, rarity: 'platinum' },
  { id: 'module_50', name: 'Meister des Wissens', description: '50 Module abgeschlossen', emoji: '👑', category: 'learning', requirement: { type: 'modules_completed', value: 50 }, xpReward: 1000, rarity: 'diamond' },
  
  // Streak Badges
  { id: 'streak_3', name: 'Guter Start', description: '3 Tage Streak', emoji: '🔥', category: 'streak', requirement: { type: 'streak_days', value: 3 }, xpReward: 30, rarity: 'bronze' },
  { id: 'streak_7', name: 'Woche der Disziplin', description: '7 Tage Streak', emoji: '💪', category: 'streak', requirement: { type: 'streak_days', value: 7 }, xpReward: 100, rarity: 'silver' },
  { id: 'streak_14', name: 'Zwei Wochen stark', description: '14 Tage Streak', emoji: '⚡', category: 'streak', requirement: { type: 'streak_days', value: 14 }, xpReward: 250, rarity: 'gold' },
  { id: 'streak_30', name: 'Monat der Meisterschaft', description: '30 Tage Streak', emoji: '🌟', category: 'streak', requirement: { type: 'streak_days', value: 30 }, xpReward: 500, rarity: 'platinum' },
  { id: 'streak_100', name: 'Legende der Konsistenz', description: '100 Tage Streak', emoji: '🏆', category: 'streak', requirement: { type: 'streak_days', value: 100 }, xpReward: 2000, rarity: 'diamond' },
  
  // XP Badges
  { id: 'xp_100', name: 'XP Sammler', description: '100 XP gesammelt', emoji: '✨', category: 'special', requirement: { type: 'total_xp', value: 100 }, xpReward: 20, rarity: 'bronze' },
  { id: 'xp_500', name: 'XP Jäger', description: '500 XP gesammelt', emoji: '💫', category: 'special', requirement: { type: 'total_xp', value: 500 }, xpReward: 50, rarity: 'silver' },
  { id: 'xp_1000', name: 'XP Meister', description: '1.000 XP gesammelt', emoji: '🌠', category: 'special', requirement: { type: 'total_xp', value: 1000 }, xpReward: 100, rarity: 'gold' },
  { id: 'xp_5000', name: 'XP König', description: '5.000 XP gesammelt', emoji: '👑', category: 'special', requirement: { type: 'total_xp', value: 5000 }, xpReward: 500, rarity: 'platinum' },
  
  // Quiz Badges
  { id: 'quiz_ace_5', name: 'Quiz-Ass', description: '5 Quizze mit 100% bestanden', emoji: '🧠', category: 'learning', requirement: { type: 'quizzes_aced', value: 5 }, xpReward: 100, rarity: 'silver' },
  { id: 'quiz_ace_20', name: 'Quiz-Genie', description: '20 Quizze mit 100% bestanden', emoji: '🎯', category: 'learning', requirement: { type: 'quizzes_aced', value: 20 }, xpReward: 300, rarity: 'gold' },
  
  // Explorer Badges
  { id: 'explorer_3', name: 'Neugierig', description: '3 verschiedene Kategorien erkundet', emoji: '🗺️', category: 'special', requirement: { type: 'categories_explored', value: 3 }, xpReward: 75, rarity: 'silver' },
  { id: 'explorer_all', name: 'Universalgelehrter', description: 'Alle Kategorien erkundet', emoji: '🌍', category: 'special', requirement: { type: 'categories_explored', value: 10 }, xpReward: 500, rarity: 'platinum' },
];

// Check which badges a user has earned
export function checkBadgeProgress(stats: {
  modulesCompleted: number;
  streakDays: number;
  totalXP: number;
  quizzesAced: number;
  categoriesExplored: number;
}): { earned: Badge[]; nextUp: Badge | null } {
  const earned: Badge[] = [];
  let nextUp: Badge | null = null;
  let smallestGap = Infinity;
  
  for (const badge of BADGES) {
    let currentValue = 0;
    
    switch (badge.requirement.type) {
      case 'modules_completed':
        currentValue = stats.modulesCompleted;
        break;
      case 'streak_days':
        currentValue = stats.streakDays;
        break;
      case 'total_xp':
        currentValue = stats.totalXP;
        break;
      case 'quizzes_aced':
        currentValue = stats.quizzesAced;
        break;
      case 'categories_explored':
        currentValue = stats.categoriesExplored;
        break;
    }
    
    if (currentValue >= badge.requirement.value) {
      earned.push(badge);
    } else {
      const gap = badge.requirement.value - currentValue;
      if (gap < smallestGap) {
        smallestGap = gap;
        nextUp = badge;
      }
    }
  }
  
  return { earned, nextUp };
}

// Get rarity color
export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'bronze': return 'from-amber-700 to-amber-500';
    case 'silver': return 'from-gray-400 to-gray-300';
    case 'gold': return 'from-yellow-500 to-amber-400';
    case 'platinum': return 'from-cyan-400 to-blue-400';
    case 'diamond': return 'from-purple-500 to-pink-500';
  }
}

export function getRewardRarityColor(rarity: VariableReward['rarity']): string {
  switch (rarity) {
    case 'common': return 'from-gray-500 to-gray-400';
    case 'uncommon': return 'from-green-500 to-emerald-400';
    case 'rare': return 'from-blue-500 to-cyan-400';
    case 'epic': return 'from-purple-500 to-pink-400';
    case 'legendary': return 'from-amber-500 to-yellow-300';
  }
}

