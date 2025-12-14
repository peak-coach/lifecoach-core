'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Flame,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { useHabits } from '@/lib/hooks';
import { Confetti, CelebrationToast } from '@/components/confetti';

const defaultEmojis = ['🧘', '💪', '📖', '✍️', '🚿', '🥗', '💊', '🏃', '😴', '🧠'];

const categoryEmojis: Record<string, string> = {
  'health': '💪',
  'productivity': '⚡',
  'mindset': '🧠',
  'social': '👥',
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, isCurrentMonth: false });
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  return days;
}

const celebrationMessages = [
  "Gut gemacht! 🎉",
  "Weiter so! 💪",
  "Du rockst das! 🚀",
  "Stark! 🔥",
];

export default function HabitsPage() {
  const { habits, habitLogs, loading, createHabit, toggleHabit } = useHabits();
  
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('🎯');
  
  // Celebration
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Select first habit by default
  useEffect(() => {
    if (habits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits, selectedHabitId]);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  const isHabitDoneToday = (habitId: string) => {
    return habitLogs.some(log => log.habit_id === habitId && log.completed);
  };

  const handleToggleHabit = async (habitId: string) => {
    const isDone = isHabitDoneToday(habitId);
    if (!isDone) {
      setShowConfetti(true);
      setCelebrationMessage(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
      setShowCelebration(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
    await toggleHabit(habitId, !isDone);
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    await createHabit({
      name: newHabitName,
    });
    setNewHabitName('');
    setNewHabitEmoji('🎯');
    setShowAddHabit(false);
  };

  const monthDays = getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth());
  const monthNames = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const totalCompletedToday = habits.filter(h => isHabitDoneToday(h.id)).length;
  const averageStreak = habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + h.current_streak, 0) / habits.length) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.best_streak), 0) : 0;

  return (
    <div className="min-h-screen p-8">
      {/* Confetti */}
      <Confetti trigger={showConfetti} />
      <CelebrationToast 
        show={showCelebration} 
        message={celebrationMessage}
        onClose={() => setShowCelebration(false)} 
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🔄 Gewohnheiten</h1>
          <p className="text-muted-foreground mt-1">
            {totalCompletedToday}/{habits.length} heute erledigt
          </p>
        </div>
        <button
          onClick={() => setShowAddHabit(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D94F3D] text-white font-medium hover:bg-[#c44535] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Gewohnheit
        </button>
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddHabit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddHabit(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-md z-50 p-5 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Neue Gewohnheit</h2>
                <button onClick={() => setShowAddHabit(false)} className="p-1 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {defaultEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewHabitEmoji(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        newHabitEmoji === emoji
                          ? 'bg-[#D94F3D] ring-2 ring-[#D94F3D]'
                          : 'bg-[#1a1a1a] hover:bg-[#252525]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Name</label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newHabitName.trim() && addHabit()}
                  placeholder="z.B. Meditation, Sport, Lesen..."
                  className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowAddHabit(false)}
                  className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={addHabit}
                  disabled={!newHabitName.trim()}
                  className="px-5 py-2 rounded-lg bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Erstellen
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#D94F3D]" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: '🔥', label: 'Avg. Streak', value: `${averageStreak} Tage` },
              { icon: '✅', label: 'Heute', value: `${totalCompletedToday}/${habits.length}` },
              { icon: '🏆', label: 'Bester Streak', value: `${bestStreak} Tage` },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141414] border border-[#1f1f1f]">
                <span className="text-xl mb-2 block">{stat.icon}</span>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Habit List */}
            <div className="lg:col-span-2 space-y-2">
              <AnimatePresence mode="popLayout">
                {habits.map((habit, index) => {
                  const isDone = isHabitDoneToday(habit.id);
                  const emoji = categoryEmojis[habit.category || 'productivity'] || '✨';
                  
                  return (
                    <motion.div
                      key={habit.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedHabitId(habit.id)}
                      className={`group flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                        selectedHabitId === habit.id
                          ? 'bg-[#D94F3D]/10 border border-[#D94F3D]/30'
                          : 'bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleHabit(habit.id); }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all ${
                          isDone
                            ? 'bg-[#D9952A]/15 text-[#D9952A]'
                            : 'bg-[#1f1f1f] hover:bg-[#252525]'
                        }`}
                      >
                        {isDone ? '✓' : emoji}
                      </button>

                      <div className="flex-1">
                        <p className="font-medium text-foreground">{habit.name}</p>
                        <p className="text-xs text-muted-foreground">Taeglich</p>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#D94F3D]/5 text-[#D94F3D]">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-bold">{habit.current_streak}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {habits.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Keine Gewohnheiten</p>
                  <button
                    onClick={() => setShowAddHabit(true)}
                    className="text-[#D94F3D] hover:underline"
                  >
                    Erste Gewohnheit erstellen
                  </button>
                </div>
              )}
            </div>

            {/* Calendar / Details */}
            <div className="lg:col-span-3 p-6 rounded-xl bg-[#141414] border border-[#1f1f1f]">
              {selectedHabit ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoryEmojis[selectedHabit.category || 'productivity'] || '✨'}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">{selectedHabit.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Streak: {selectedHabit.current_streak} Tage | Best: {selectedHabit.best_streak} Tage
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => (
                      <div key={day} className="text-center text-[10px] text-muted-foreground py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid - Simplified */}
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map(({ date, isCurrentMonth }, i) => {
                      const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
                      const isFuture = date > new Date();

                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${
                            !isCurrentMonth
                              ? 'text-muted-foreground/30'
                              : isFuture
                                ? 'text-muted-foreground/50'
                                : isToday
                                  ? 'bg-[#1f1f1f] text-foreground ring-2 ring-[#D94F3D]/50'
                                  : 'bg-[#1a1a1a] text-muted-foreground'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  <div className="mt-6 pt-6 border-t border-[#1f1f1f]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#D94F3D]">{selectedHabit.current_streak}</p>
                        <p className="text-xs text-muted-foreground">Aktueller Streak</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#D9952A]">{selectedHabit.total_completions}</p>
                        <p className="text-xs text-muted-foreground">Gesamt erledigt</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Waehle eine Gewohnheit aus
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
