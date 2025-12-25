'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Target, Trophy, Zap, Calendar, Star, TrendingUp, Brain } from 'lucide-react';

// ============================================
// PSYCHOLOGISCHE UX-ELEMENTE
// Basierend auf: Kahneman, Cialdini, BJ Fogg, James Clear
// ============================================

// --- GOAL GRADIENT EFFECT ---
// Je näher das Ziel, desto mehr Motivation
interface GoalProgressProps {
  completed: number;
  total: number;
  label?: string;
}

export function GoalGradientProgress({ completed, total, label = 'Fortschritt' }: GoalProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Dynamische Messaging basierend auf Fortschritt
  const getMessage = () => {
    if (percentage === 0) return 'Jeder Schritt zählt – starte jetzt! 🚀';
    if (percentage < 25) return 'Guter Start! Du baust Momentum auf 💪';
    if (percentage < 50) return 'Fast ein Viertel geschafft! Weiter so 🔥';
    if (percentage < 75) return 'Über die Hälfte! Das Ziel ist in Reichweite 🎯';
    if (percentage < 90) return 'Fast da! Nur noch ein kleiner Push ⚡';
    if (percentage < 100) return 'SO NAH! Du kannst es schaffen! 🏆';
    return 'GESCHAFFT! Du bist ein Champion! 🎉';
  };
  
  // Farbe ändert sich mit Fortschritt (psychologischer Boost)
  const getColor = () => {
    if (percentage < 25) return '#574F47';
    if (percentage < 50) return '#D9952A';
    if (percentage < 75) return '#D9952A';
    return '#22c55e'; // Grün für fast geschafft
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color: getColor() }}>
          {percentage}%
        </span>
      </div>
      
      {/* Progress Bar mit Animation */}
      <div className="h-3 bg-[#1f1f1f] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getColor() }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      
      {/* Motivierende Nachricht */}
      <p className="text-xs text-muted-foreground">
        {getMessage()}
      </p>
    </div>
  );
}

// --- STREAK LOSS AVERSION ---
// Verlustangst ist 2x stärker als Gewinnfreude (Kahneman)
interface StreakWarningProps {
  currentStreak: number;
  habitsDone: number;
  habitsTotal: number;
}

export function StreakLossAversion({ currentStreak, habitsDone, habitsTotal }: StreakWarningProps) {
  const allDone = habitsTotal > 0 && habitsDone === habitsTotal;
  const streakAtRisk = currentStreak > 0 && !allDone;
  
  if (allDone || currentStreak === 0) return null;
  
  return (
    <AnimatePresence>
      {streakAtRisk && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="p-4 rounded-xl bg-gradient-to-r from-[#D94F3D]/20 to-[#D94F3D]/5 border border-[#D94F3D]/30"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D94F3D]/20">
              <Flame className="w-5 h-5 text-[#D94F3D] animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-[#D94F3D]">
                Dein {currentStreak}-Tage Streak ist in Gefahr! 🔥
              </p>
              <p className="text-sm text-[#D94F3D]/70">
                Noch {habitsTotal - habitsDone} {habitsTotal - habitsDone === 1 ? 'Habit' : 'Habits'} für heute – 
                verpasse nicht was du dir aufgebaut hast!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- FRESH START EFFECT ---
// Neue Anfänge motivieren (Montage, 1. des Monats, etc.)
export function FreshStartBanner() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  const hour = now.getHours();
  
  // Montag morgens
  const isMonday = dayOfWeek === 1 && hour < 12;
  // Erster des Monats
  const isFirstOfMonth = dayOfMonth === 1;
  // Jahresanfang
  const isNewYear = now.getMonth() === 0 && dayOfMonth <= 7;
  
  let message = '';
  let icon = <Calendar className="w-5 h-5" />;
  let gradient = 'from-[#D9952A]/20 to-[#D9952A]/5';
  let borderColor = 'border-[#D9952A]/30';
  let textColor = 'text-[#D9952A]';
  
  if (isNewYear) {
    message = '🎆 Neues Jahr, neue Chancen! Die perfekte Zeit für große Ziele.';
    gradient = 'from-purple-500/20 to-purple-500/5';
    borderColor = 'border-purple-500/30';
    textColor = 'text-purple-400';
    icon = <Star className="w-5 h-5" />;
  } else if (isFirstOfMonth) {
    message = '📅 Neuer Monat! Ein frischer Start – was wirst du erreichen?';
    gradient = 'from-blue-500/20 to-blue-500/5';
    borderColor = 'border-blue-500/30';
    textColor = 'text-blue-400';
  } else if (isMonday) {
    message = '💪 Montag = Fresh Start! Diese Woche wird DEINE Woche.';
  } else {
    return null; // Kein Fresh Start heute
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl bg-gradient-to-r ${gradient} border ${borderColor} mb-4`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${textColor.replace('text-', 'bg-')}/20`}>
          {icon}
        </div>
        <p className={`font-medium ${textColor}`}>
          {message}
        </p>
      </div>
    </motion.div>
  );
}

// --- IDENTITY-BASED FRAMING ---
// "Du BIST jemand der..." statt "Du solltest..."
interface IdentityMessageProps {
  tasksCompleted: number;
  habitsCompleted: number;
  streak: number;
}

export function IdentityBasedMessage({ tasksCompleted, habitsCompleted, streak }: IdentityMessageProps) {
  const getIdentityMessage = () => {
    // Basierend auf Verhalten → Identität aufbauen
    if (streak >= 30) {
      return {
        identity: 'Du bist ein Meister der Konsistenz',
        proof: `${streak} Tage ohne Unterbrechung!`,
        icon: <Trophy className="w-5 h-5 text-yellow-400" />,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10'
      };
    }
    if (streak >= 7) {
      return {
        identity: 'Du bist jemand, der durchzieht',
        proof: `Schon ${streak} Tage am Stück – das zeigt Charakter`,
        icon: <Flame className="w-5 h-5 text-[#D94F3D]" />,
        color: 'text-[#D94F3D]',
        bg: 'bg-[#D94F3D]/10'
      };
    }
    if (tasksCompleted >= 5) {
      return {
        identity: 'Du bist ein produktiver Mensch',
        proof: `${tasksCompleted} Tasks heute – stark!`,
        icon: <Zap className="w-5 h-5 text-[#D9952A]" />,
        color: 'text-[#D9952A]',
        bg: 'bg-[#D9952A]/10'
      };
    }
    if (habitsCompleted >= 3) {
      return {
        identity: 'Du baust starke Gewohnheiten',
        proof: `${habitsCompleted} Habits erledigt – das wird zur Routine`,
        icon: <Brain className="w-5 h-5 text-purple-400" />,
        color: 'text-purple-400',
        bg: 'bg-purple-400/10'
      };
    }
    if (tasksCompleted >= 1 || habitsCompleted >= 1) {
      return {
        identity: 'Du bist aktiv dabei',
        proof: 'Jede Aktion zählt – du bist auf dem richtigen Weg',
        icon: <TrendingUp className="w-5 h-5 text-green-400" />,
        color: 'text-green-400',
        bg: 'bg-green-400/10'
      };
    }
    return null;
  };
  
  const message = getIdentityMessage();
  if (!message) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-xl ${message.bg} border border-white/5`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${message.bg}`}>
          {message.icon}
        </div>
        <div>
          <p className={`font-semibold ${message.color}`}>
            {message.identity}
          </p>
          <p className="text-sm text-muted-foreground">
            {message.proof}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// --- PEAK-END RULE ---
// Das Ende einer Erfahrung bleibt am stärksten im Gedächtnis
interface DayEndMessageProps {
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
}

export function DayEndCelebration({ tasksCompleted, tasksTotal, habitsCompleted, habitsTotal }: DayEndMessageProps) {
  const hour = new Date().getHours();
  
  // Nur abends zeigen (nach 18 Uhr)
  if (hour < 18) return null;
  
  const taskRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;
  const habitRate = habitsTotal > 0 ? habitsCompleted / habitsTotal : 0;
  const overallRate = (taskRate + habitRate) / 2;
  
  const getMessage = () => {
    if (overallRate >= 0.9) {
      return {
        title: '🏆 Ausgezeichneter Tag!',
        message: 'Du hast heute alles gegeben. Zeit für verdiente Erholung – morgen geht es weiter!',
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/30'
      };
    }
    if (overallRate >= 0.7) {
      return {
        title: '⭐ Guter Tag!',
        message: 'Solide Leistung heute. Du bist auf dem richtigen Weg – bleib dran!',
        color: 'text-[#D9952A]',
        bg: 'bg-[#D9952A]/10',
        border: 'border-[#D9952A]/30'
      };
    }
    if (overallRate >= 0.5) {
      return {
        title: '💪 Fortschritt gemacht!',
        message: 'Jeder Tag, an dem du etwas tust, ist ein Gewinn. Morgen ist eine neue Chance!',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/30'
      };
    }
    return {
      title: '🌙 Tag fast vorbei',
      message: 'Morgen ist ein neuer Tag – plane jetzt, was du erreichen willst!',
      color: 'text-muted-foreground',
      bg: 'bg-[#1f1f1f]',
      border: 'border-[#2a2a2a]'
    };
  };
  
  const msg = getMessage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl ${msg.bg} border ${msg.border}`}
    >
      <h3 className={`font-semibold ${msg.color} mb-1`}>{msg.title}</h3>
      <p className="text-sm text-foreground/80">{msg.message}</p>
      
      {/* Schnelle Zusammenfassung */}
      <div className="flex gap-4 mt-3 text-xs">
        <span className="text-muted-foreground">
          Tasks: <span className="text-foreground font-medium">{tasksCompleted}/{tasksTotal}</span>
        </span>
        <span className="text-muted-foreground">
          Habits: <span className="text-foreground font-medium">{habitsCompleted}/{habitsTotal}</span>
        </span>
      </div>
    </motion.div>
  );
}

// --- ENDOWED PROGRESS EFFECT ---
// Menschen arbeiten härter, wenn sie schon "Vorsprung" haben
interface EndowedProgressProps {
  goalTitle: string;
  milestonesCompleted: number;
  milestonesTotal: number;
}

export function EndowedProgressCard({ goalTitle, milestonesCompleted, milestonesTotal }: EndowedProgressProps) {
  // Trick: +1 um den "schon gestartet" Effekt zu geben
  const displayCompleted = milestonesCompleted + 1; // Du hast schon 1 Schritt gemacht (das Ziel setzen)
  const displayTotal = milestonesTotal + 2; // +2 für Start und Abschluss
  const percentage = Math.round((displayCompleted / displayTotal) * 100);
  
  return (
    <div className="p-4 rounded-xl bg-[#141414] border border-[#1f1f1f]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">
          {goalTitle}
        </span>
        <span className="text-xs text-[#D9952A] font-semibold whitespace-nowrap">
          {percentage}% gestartet
        </span>
      </div>
      
      {/* Segmentierte Progress Bar (zeigt einzelne Schritte) */}
      <div className="flex gap-1">
        {Array.from({ length: displayTotal }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all ${
              i < displayCompleted 
                ? 'bg-[#D9952A]' 
                : 'bg-[#1f1f1f]'
            }`}
          />
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        {milestonesCompleted === 0 
          ? 'Du hast das Ziel gesetzt – erster Schritt geschafft! 🎯'
          : `${milestonesCompleted} von ${milestonesTotal} Meilensteinen erreicht`
        }
      </p>
    </div>
  );
}

// --- VARIABLE REWARDS ---
// Unvorhersehbare Belohnungen = mehr Dopamin (wie Slot Machines)
const motivationalQuotes = [
  { text: "Der beste Zeitpunkt war gestern. Der zweitbeste ist jetzt.", author: "Chinesisches Sprichwort" },
  { text: "Du musst nicht perfekt sein, du musst nur anfangen.", author: "James Clear" },
  { text: "Disziplin ist die Brücke zwischen Zielen und Erfolg.", author: "Jim Rohn" },
  { text: "Die einzige Art zu versagen ist aufzugeben.", author: "Naval Ravikant" },
  { text: "Kleine Schritte jeden Tag führen zu großen Veränderungen.", author: "BJ Fogg" },
  { text: "Motivation bringt dich in Gang. Gewohnheit hält dich in Bewegung.", author: "Jim Ryun" },
  { text: "Du bist, was du wiederholst.", author: "Aristoteles" },
  { text: "Der Schmerz der Disziplin wiegt weniger als der Schmerz des Bedauerns.", author: "Jim Rohn" },
  { text: "Fokus ist Nein sagen zu 1000 guten Ideen.", author: "Steve Jobs" },
  { text: "Erfolg ist die Summe kleiner Anstrengungen, Tag für Tag wiederholt.", author: "Robert Collier" },
];

export function VariableRewardQuote() {
  // Pseudo-zufälliges Quote basierend auf Tag (damit es sich täglich ändert)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const quote = motivationalQuotes[dayOfYear % motivationalQuotes.length];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#141414] border border-[#1f1f1f]"
    >
      <p className="text-foreground/90 italic text-sm leading-relaxed">
        "{quote.text}"
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        — {quote.author}
      </p>
    </motion.div>
  );
}

