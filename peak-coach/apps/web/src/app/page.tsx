'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  CheckCircle2, 
  MessageSquare,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  Lightbulb,
  Target,
  Edit3,
  Plus,
  Loader2
} from 'lucide-react';
import { Confetti, CelebrationToast } from '@/components/confetti';
import { PWAInstallBanner } from '@/components/pwa-install-banner';
import { useDashboard, useUser } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { registerPWA } from '@/lib/pwa';

const celebrationMessages = [
  "Gut gemacht! 🎉",
  "Weiter so! 💪",
  "Du rockst das! 🚀",
  "Produktiv! ⚡",
  "Stark! 🔥",
  "Yes! ✨",
];

const getTimeEmoji = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 17) return '🌤️';
  if (hour >= 17 && hour < 21) return '🌅';
  return '🌙';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Guten Morgen';
  if (hour >= 12 && hour < 17) return 'Guten Tag';
  if (hour >= 17 && hour < 21) return 'Guten Abend';
  return 'Gute Nacht';
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

// Emoji map for habits
const habitEmojis: Record<string, string> = {
  'health': '💪',
  'productivity': '⚡',
  'mindset': '🧠',
  'social': '👥',
};

// Emoji map for goal categories
const goalEmojis: Record<string, string> = {
  'career': '💼',
  'health': '🏃',
  'learning': '📚',
  'finance': '💰',
  'relationships': '❤️',
  'personal': '🎯',
};

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const { user } = useUser();
  const { stats, tasks, habits, habitLogs, goals, loading, toggleTask, toggleHabit, refresh } = useDashboard();
  
  const [mounted, setMounted] = useState(false);
  
  // Daily Intention - persisted in localStorage
  const [dailyIntention, setDailyIntention] = useState('');
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [savedIntention, setSavedIntention] = useState('');
  
  // Celebration
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Load from localStorage on mount & register PWA
  useEffect(() => {
    setMounted(true);
    const todayKey = getTodayKey();
    
    // Load daily intention
    const savedInt = localStorage.getItem(`intention-${todayKey}`);
    if (savedInt) {
      setSavedIntention(savedInt);
      setDailyIntention(savedInt);
    }
    
    // Register PWA Service Worker
    registerPWA();
  }, []);

  // Save intention
  const saveIntention = () => {
    if (!dailyIntention.trim()) return;
    setSavedIntention(dailyIntention);
    setIsEditingIntention(false);
    localStorage.setItem(`intention-${getTodayKey()}`, dailyIntention);
  };

  // Handle task toggle with celebration
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const isCompleting = currentStatus !== 'completed';
    if (isCompleting) {
      setShowConfetti(true);
      setCelebrationMessage(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
      setShowCelebration(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
    await toggleTask(taskId, isCompleting);
  };

  // Handle habit toggle with celebration
  const handleToggleHabit = async (habitId: string, isCurrentlyDone: boolean) => {
    if (!isCurrentlyDone) {
      setShowConfetti(true);
      setCelebrationMessage(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
      setShowCelebration(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
    await toggleHabit(habitId, !isCurrentlyDone);
  };

  if (!mounted) return null;

  // Get user name
  const userName = user?.name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'User';

  // Calculate stats
  const tasksCompleted = stats?.tasks?.completed || 0;
  const tasksTotal = stats?.tasks?.total || 0;
  const habitsCompleted = stats?.habits?.completed || 0;
  const habitsTotal = stats?.habits?.total || 0;
  const currentStreak = stats?.streak?.current || 0;
  const bestStreak = stats?.streak?.best || 0;

  // Check if habit is completed today
  const isHabitDoneToday = (habitId: string) => {
    return habitLogs.some(log => log.habit_id === habitId && log.completed);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10">
      {/* Confetti & Celebration */}
      <Confetti trigger={showConfetti} />
      <CelebrationToast 
        show={showCelebration} 
        message={celebrationMessage}
        onClose={() => setShowCelebration(false)} 
      />
      
      {/* === HEADER === */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-1 sm:mb-2 flex items-center gap-2">
              <span>{getTimeEmoji()}</span>
              <span>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {getGreeting()}, <span className="gradient-text">{userName}</span>
            </h1>
            <div className="flex items-center gap-3 mt-2 hidden sm:flex">
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Sparkles className="w-4 h-4 text-[#D9952A]" />
                <span>Level 1</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">High Performer</span>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-[#D94F3D]/10 border border-[#D94F3D]/20 self-start">
            <Flame className="w-5 sm:w-6 h-5 sm:h-6 text-[#D94F3D]" />
            <div>
              <p className="text-xl sm:text-2xl font-bold text-[#D94F3D]">{currentStreak}</p>
              <p className="text-[10px] sm:text-xs text-[#D94F3D]/70">Tage Streak</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* === DAILY INTENTION === */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4 sm:mb-6"
      >
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#D94F3D]/5 to-[#D9952A]/5 border border-[#D94F3D]/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#D94F3D]/10">
              <Target className="w-5 h-5 text-[#D94F3D]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#D94F3D] text-sm">Mein Fokus heute</h3>
                {savedIntention && !isEditingIntention && (
                  <button 
                    onClick={() => setIsEditingIntention(true)}
                    className="p-1 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {(!savedIntention || isEditingIntention) ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={dailyIntention}
                    onChange={(e) => setDailyIntention(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && dailyIntention.trim() && saveIntention()}
                    placeholder="Was ist dein wichtigstes Ziel heute?"
                    className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50"
                    autoFocus={isEditingIntention}
                  />
                  <button
                    onClick={saveIntention}
                    disabled={!dailyIntention.trim()}
                    className="px-4 py-2 rounded-lg bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors disabled:opacity-50"
                  >
                    Setzen
                  </button>
                </div>
              ) : (
                <p className="text-foreground text-lg font-medium">
                  "{savedIntention}"
                </p>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                Ein klarer Fokus schlaegt 10 vage Ziele.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* === COACH MESSAGE === */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 sm:mb-10"
      >
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#1f1f1f]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#D9952A]/10">
              <MessageSquare className="w-5 h-5 text-[#D9952A]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#D9952A] mb-1">Coach</h3>
              <p className="text-foreground/90 leading-relaxed">
                {tasksTotal === 0 
                  ? "Noch keine Tasks für heute! Füge deine wichtigsten Aufgaben hinzu und starte produktiv in den Tag."
                  : tasksCompleted === tasksTotal && tasksTotal > 0
                  ? "🎉 Alle Tasks erledigt! Fantastische Arbeit heute. Zeit für verdiente Erholung."
                  : `Du hast ${tasksTotal - tasksCompleted} von ${tasksTotal} Tasks offen. Fokus auf die wichtigste Aufgabe - du schaffst das!`
                }
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* === TODAY'S OVERVIEW === */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 sm:mb-10"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Heute auf einen Blick
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { emoji: '😊', label: 'Stimmung', value: stats?.today?.mood || '-', suffix: stats?.today?.mood ? '/10' : '' },
            { emoji: '⚡', label: 'Energie', value: stats?.today?.energy || '-', suffix: stats?.today?.energy ? '/10' : '' },
            { emoji: '😴', label: 'Schlaf', value: stats?.today?.sleepHours || '-', suffix: stats?.today?.sleepHours ? 'h' : '' },
            { emoji: '✅', label: 'Tasks', value: `${tasksCompleted}/${tasksTotal}`, suffix: '' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#141414] border border-[#1f1f1f] text-center">
              <span className="text-2xl block mb-2">{stat.emoji}</span>
              <p className="text-xl font-bold text-foreground">{stat.value}<span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span></p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* === MAIN CONTENT: Tasks & Habits === */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-8 mb-6 sm:mb-10">
        
        {/* Tasks */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Heutige Tasks
            </h2>
            <Link href="/tasks" className="text-xs text-[#D94F3D] hover:text-[#D9952A] flex items-center gap-1">
              Alle anzeigen <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#1f1f1f]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#D94F3D]" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Noch keine Tasks für heute</p>
                <Link 
                  href="/tasks"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Task hinzufügen
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${
                      task.status === 'completed' ? 'opacity-50' : 'bg-[#1a1a1a] hover:bg-[#1f1f1f]'
                    }`}
                    onClick={() => handleToggleTask(task.id, task.status)}
                  >
                    <button className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.status === 'completed' ? 'bg-[#D9952A] border-[#D9952A]' : 'border-[#3a3a3a] hover:border-[#D94F3D] hover:scale-110'
                    }`}>
                      {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-black" />}
                    </button>
                    <span className={`flex-1 ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {task.scheduled_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-sm">{task.scheduled_time.slice(0, 5)}</span>
                        </div>
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-[#D94F3D]' : 
                        task.priority === 'medium' ? 'bg-[#D9952A]' : 'bg-[#574F47]'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Habits */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gewohnheiten
            </h2>
            <span className="text-xs text-[#D9952A] font-medium">{habitsCompleted}/{habitsTotal}</span>
          </div>
          
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#1f1f1f]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#D94F3D]" />
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Noch keine Habits</p>
                <Link 
                  href="/habits"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D9952A] text-white text-sm font-medium hover:bg-[#c4832a] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Habit hinzufügen
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const isDone = isHabitDoneToday(habit.id);
                  const emoji = habitEmojis[habit.category || 'productivity'] || '✨';
                  
                  return (
                    <div 
                      key={habit.id} 
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                      onClick={() => handleToggleHabit(habit.id, isDone)}
                    >
                      <button className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all ${
                        isDone ? 'bg-[#D9952A]/15 text-[#D9952A]' : 'bg-[#1f1f1f] hover:scale-105'
                      }`}>
                        {isDone ? '✓' : emoji}
                      </button>
                      <span className={`flex-1 ${isDone ? 'text-muted-foreground' : 'text-foreground'}`}>{habit.name}</span>
                      <div className="flex items-center gap-1 text-[#D94F3D]/70 bg-[#D94F3D]/5 px-2 py-1 rounded-lg">
                        <Flame className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{habit.current_streak}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {/* === GOALS & AI TIP === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        
        {/* Goals */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Aktive Ziele
          </h2>
          
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#1f1f1f]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#D94F3D]" />
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Noch keine Ziele definiert</p>
                <Link 
                  href="/goals"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ziel hinzufügen
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {goals.slice(0, 3).map((goal, index) => {
                  const emoji = goalEmojis[goal.category || 'personal'] || '🎯';
                  const progress = goal.target_value 
                    ? Math.round((goal.current_value / goal.target_value) * 100)
                    : 0;
                  
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{emoji}</span>
                          <span className="text-foreground font-medium">{goal.title}</span>
                        </div>
                        {goal.deadline && (
                          <span className="text-xs text-muted-foreground">
                            bis {new Date(goal.deadline).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: progress >= 70 ? '#D9952A' : '#D94F3D' }}
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground w-10 text-right">{progress}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>

        {/* AI Tip */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            AI Empfehlung
          </h2>
          
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#D9952A]/10 to-[#D94F3D]/5 border border-[#D9952A]/15">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#D9952A]/15">
                <Lightbulb className="w-5 h-5 text-[#D9952A]" />
              </div>
              <div className="flex-1">
                <p className="text-foreground leading-relaxed mb-4">
                  {goals.length > 0 
                    ? `Fokussiere dich auf dein Ziel "${goals[0].title}". Kleine, tägliche Schritte führen zum Erfolg!`
                    : "Setze dir ein klares Ziel, um deine Produktivität zu maximieren. Ziele geben Richtung und Motivation."
                  }
                </p>
                <Link 
                  href="/goals"
                  className="px-4 py-2 rounded-xl bg-[#D9952A] text-white text-sm font-medium hover:bg-[#c4832a] transition-colors inline-block"
                >
                  {goals.length > 0 ? 'Ziele ansehen' : 'Ziel setzen'}
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
