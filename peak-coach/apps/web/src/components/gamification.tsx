'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, Flame, Crown, Award, TrendingUp } from 'lucide-react';

// ============================================
// XP & LEVEL SYSTEM
// Based on: Gamification Psychology (Yu-kai Chou, Nir Eyal)
// ============================================

// XP Constants
export const XP_VALUES = {
  TASK_COMPLETED: 10,
  HABIT_COMPLETED: 15,
  STREAK_DAY: 20,
  MILESTONE_REACHED: 50,
  GOAL_COMPLETED: 100,
  PERFECT_DAY: 30,
};

// Level thresholds (cumulative XP needed)
export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Beginner', emoji: '🌱' },
  { level: 2, xp: 100, title: 'Starter', emoji: '🌿' },
  { level: 3, xp: 250, title: 'Achiever', emoji: '⭐' },
  { level: 4, xp: 500, title: 'Focused', emoji: '🎯' },
  { level: 5, xp: 1000, title: 'Consistent', emoji: '💪' },
  { level: 6, xp: 2000, title: 'Dedicated', emoji: '🔥' },
  { level: 7, xp: 3500, title: 'Master', emoji: '🏆' },
  { level: 8, xp: 5500, title: 'Expert', emoji: '💎' },
  { level: 9, xp: 8000, title: 'Elite', emoji: '👑' },
  { level: 10, xp: 12000, title: 'Peak Performer', emoji: '🚀' },
];

// Badge definitions
export const BADGES = {
  first_task: { id: 'first_task', name: 'Erster Schritt', emoji: '👣', description: 'Ersten Task erledigt' },
  streak_7: { id: 'streak_7', name: 'Woche des Fokus', emoji: '📅', description: '7-Tage Streak' },
  streak_30: { id: 'streak_30', name: 'Monat der Konsistenz', emoji: '🗓️', description: '30-Tage Streak' },
  streak_100: { id: 'streak_100', name: 'Unaufhaltsam', emoji: '⚡', description: '100-Tage Streak' },
  level_5: { id: 'level_5', name: 'Focus Master', emoji: '🎯', description: 'Level 5 erreicht' },
  level_10: { id: 'level_10', name: 'Peak Performer', emoji: '🚀', description: 'Level 10 erreicht' },
  perfect_week: { id: 'perfect_week', name: 'Perfekte Woche', emoji: '✨', description: '7 perfekte Tage' },
  goal_crusher: { id: 'goal_crusher', name: 'Ziel-Crusher', emoji: '💥', description: '5 Ziele erreicht' },
  early_bird: { id: 'early_bird', name: 'Frühaufsteher', emoji: '🌅', description: 'Task vor 7 Uhr' },
  night_owl: { id: 'night_owl', name: 'Nachteule', emoji: '🦉', description: 'Task nach 22 Uhr' },
};

// Helper: Get level info from XP
export function getLevelFromXP(totalXP: number) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
      break;
    }
  }
  
  const xpInCurrentLevel = totalXP - currentLevel.xp;
  const xpNeededForNextLevel = nextLevel.xp - currentLevel.xp;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    emoji: currentLevel.emoji,
    currentXP: totalXP,
    xpInLevel: xpInCurrentLevel,
    xpToNextLevel: xpNeededForNextLevel,
    progressPercent,
    isMaxLevel: currentLevel.level === 10,
  };
}

// ============================================
// COMPONENTS
// ============================================

// XP Progress Bar with Level
interface XPProgressBarProps {
  totalXP: number;
  compact?: boolean;
}

export function XPProgressBar({ totalXP, compact = false }: XPProgressBarProps) {
  const levelInfo = getLevelFromXP(totalXP);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{levelInfo.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-foreground">Lvl {levelInfo.level}</span>
            <span className="text-muted-foreground">{levelInfo.currentXP} XP</span>
          </div>
          <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#D94F3D] to-[#D9952A] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[#2a2a2a]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D94F3D] to-[#D9952A] flex items-center justify-center text-2xl">
          {levelInfo.emoji}
        </div>
        <div>
          <p className="text-foreground font-bold">Level {levelInfo.level}: {levelInfo.title}</p>
          <p className="text-sm text-muted-foreground">
            {levelInfo.isMaxLevel 
              ? '🎉 Max Level erreicht!' 
              : `${levelInfo.xpToNextLevel - levelInfo.xpInLevel} XP bis Level ${levelInfo.level + 1}`
            }
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-[#D9952A]">{levelInfo.currentXP}</p>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-3 bg-[#1f1f1f] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#D94F3D] to-[#D9952A] rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${levelInfo.progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{levelInfo.xpInLevel} XP</span>
        <span>{levelInfo.progressPercent}%</span>
        <span>{levelInfo.xpToNextLevel} XP</span>
      </div>
    </div>
  );
}

// XP Gain Animation
interface XPGainProps {
  amount: number;
  show: boolean;
  onComplete?: () => void;
}

export function XPGainAnimation({ amount, show, onComplete }: XPGainProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          onAnimationComplete={() => {
            setTimeout(() => onComplete?.(), 500);
          }}
          className="fixed bottom-24 right-8 z-50"
        >
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D94F3D] to-[#D9952A] text-white font-bold text-lg shadow-lg shadow-[#D94F3D]/30">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>+{amount} XP</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Level Up Celebration
interface LevelUpProps {
  newLevel: number;
  show: boolean;
  onClose: () => void;
}

export function LevelUpCelebration({ newLevel, show, onClose }: LevelUpProps) {
  const levelInfo = LEVEL_THRESHOLDS.find(l => l.level === newLevel);
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 text-center max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="text-6xl mb-4"
            >
              {levelInfo?.emoji || '🎉'}
            </motion.div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Level Up!
            </h2>
            <p className="text-lg text-[#D9952A] font-semibold mb-4">
              Level {newLevel}: {levelInfo?.title}
            </p>
            <p className="text-muted-foreground mb-6">
              Du wächst über dich hinaus! Weiter so!
            </p>
            
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D94F3D] to-[#D9952A] text-white font-bold hover:opacity-90 transition-opacity"
            >
              Weiter dominieren 💪
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Badge Display
interface BadgeProps {
  badges: string[];
  compact?: boolean;
}

export function BadgeDisplay({ badges, compact = false }: BadgeProps) {
  const earnedBadges = badges.map(id => BADGES[id as keyof typeof BADGES]).filter(Boolean);
  
  if (compact) {
    return (
      <div className="flex -space-x-2">
        {earnedBadges.slice(0, 5).map((badge, i) => (
          <div
            key={badge.id}
            className="w-8 h-8 rounded-full bg-[#1f1f1f] border-2 border-[#141414] flex items-center justify-center text-sm"
            title={badge.name}
          >
            {badge.emoji}
          </div>
        ))}
        {earnedBadges.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border-2 border-[#141414] flex items-center justify-center text-xs text-muted-foreground">
            +{earnedBadges.length - 5}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-5 gap-2">
      {Object.values(BADGES).map(badge => {
        const earned = badges.includes(badge.id);
        return (
          <div
            key={badge.id}
            className={`p-3 rounded-xl text-center transition-all ${
              earned 
                ? 'bg-[#1f1f1f] border border-[#D9952A]/30' 
                : 'bg-[#0f0f0f] opacity-40'
            }`}
            title={badge.description}
          >
            <span className="text-2xl block mb-1">{badge.emoji}</span>
            <p className="text-[10px] text-muted-foreground truncate">{badge.name}</p>
          </div>
        );
      })}
    </div>
  );
}

// Today's XP Summary
interface TodayXPProps {
  events: Array<{ type: string; amount: number; description?: string }>;
}

export function TodayXPSummary({ events }: TodayXPProps) {
  const totalToday = events.reduce((sum, e) => sum + e.amount, 0);
  
  if (events.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-[#141414] border border-[#1f1f1f] text-center">
        <p className="text-muted-foreground text-sm">
          Noch keine XP heute – starte jetzt! 🚀
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 rounded-xl bg-[#141414] border border-[#1f1f1f]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#D9952A]" />
          Heute verdient
        </h3>
        <span className="text-lg font-bold text-[#D9952A]">+{totalToday} XP</span>
      </div>
      
      <div className="space-y-2">
        {events.slice(0, 5).map((event, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{event.description || event.type}</span>
            <span className="text-[#D9952A] font-medium">+{event.amount}</span>
          </div>
        ))}
        {events.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            ... und {events.length - 5} weitere
          </p>
        )}
      </div>
    </div>
  );
}

// Primary Action Card (ONE clear next step)
interface PrimaryActionProps {
  title: string;
  subtitle?: string;
  xpReward: number;
  onAction: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export function PrimaryActionCard({ 
  title, 
  subtitle, 
  xpReward, 
  onAction, 
  onSkip,
  isLoading 
}: PrimaryActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-[#D94F3D] to-[#D9952A] text-white relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5" />
          <span className="text-white/80 text-sm font-medium">Dein nächster Schritt</span>
        </div>
        
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        {subtitle && (
          <p className="text-white/70 text-sm mb-4">{subtitle}</p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
            <Zap className="w-4 h-4" />
            <span className="font-semibold">+{xpReward} XP</span>
          </div>
          
          <div className="flex gap-2">
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Später
              </button>
            )}
            <button
              onClick={onAction}
              disabled={isLoading}
              className="px-6 py-2 rounded-xl bg-white text-[#D94F3D] font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Lädt...' : 'Jetzt erledigen ✓'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Focus Mode Toggle
interface FocusModeProps {
  enabled: boolean;
  onToggle: () => void;
}

export function FocusModeToggle({ enabled, onToggle }: FocusModeProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        enabled 
          ? 'bg-[#D94F3D] text-white' 
          : 'bg-[#1f1f1f] text-muted-foreground hover:text-foreground'
      }`}
    >
      <Target className="w-4 h-4" />
      <span className="text-sm font-medium">
        {enabled ? 'Fokus-Modus' : 'Alle anzeigen'}
      </span>
    </button>
  );
}

// Quick Stats Row (minimal, for header)
interface QuickStatsProps {
  xp: number;
  streak: number;
  tasksToday: { done: number; total: number };
}

export function QuickStats({ xp, streak, tasksToday }: QuickStatsProps) {
  const levelInfo = getLevelFromXP(xp);
  
  return (
    <div className="flex items-center gap-4">
      {/* Level & XP */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f1f]">
        <span>{levelInfo.emoji}</span>
        <span className="text-sm font-medium text-foreground">Lvl {levelInfo.level}</span>
        <span className="text-xs text-[#D9952A]">{xp} XP</span>
      </div>
      
      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D94F3D]/10 text-[#D94F3D]">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-semibold">{streak}</span>
        </div>
      )}
      
      {/* Tasks */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f1f1f] text-muted-foreground">
        <span className="text-sm">
          <span className="text-foreground font-medium">{tasksToday.done}</span>/{tasksToday.total}
        </span>
      </div>
    </div>
  );
}

// Add shimmer animation to globals.css
// .animate-shimmer { animation: shimmer 2s linear infinite; }
// @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

