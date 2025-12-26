'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  Target,
  Clock,
  Flame,
  Trophy,
  ChevronRight,
  Sparkles,
  Play,
  CheckCircle2,
  Zap,
  Brain,
  TrendingUp,
  Settings,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
  Star,
  BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ============================================
// Types
// ============================================

type LearningLevel = 'minimal' | 'standard' | 'intensive';

interface LearningSettings {
  learning_level: LearningLevel;
  daily_goal_minutes: number;
  streak_current: number;
  streak_best: number;
  total_modules_completed: number;
  total_xp?: number;
  current_level?: number;
}

interface Category {
  slug: string;
  name: string;
  icon: string;
  color: string;
}

interface UserGoal {
  id: string;
  title: string;
  category: string;
  status: string;
  currentModule?: number;
  totalModulesCompleted?: number;
}

// ============================================
// Constants
// ============================================

const LEARNING_LEVELS = {
  minimal: { label: '🐢 Minimal', minutes: 5, description: '5 Min/Tag', color: 'from-green-500 to-emerald-600' },
  standard: { label: '⚡ Standard', minutes: 15, description: '15 Min/Tag', color: 'from-blue-500 to-indigo-600', recommended: true },
  intensive: { label: '🚀 Intensiv', minutes: 30, description: '30+ Min/Tag', color: 'from-purple-500 to-pink-600' },
};

const CATEGORIES: Category[] = [
  { slug: 'rhetorik', name: 'Rhetorik', icon: '🎤', color: '#ef4444' },
  { slug: 'psychologie', name: 'Psychologie', icon: '🧠', color: '#8b5cf6' },
  { slug: 'produktivitaet', name: 'Produktivität', icon: '⚡', color: '#f59e0b' },
  { slug: 'fitness', name: 'Fitness', icon: '💪', color: '#10b981' },
  { slug: 'business', name: 'Business', icon: '💼', color: '#3b82f6' },
  { slug: 'lernen', name: 'Lernen', icon: '📚', color: '#ec4899' },
  { slug: 'finanzen', name: 'Finanzen', icon: '💰', color: '#14b8a6' },
  { slug: 'trt', name: 'TRT', icon: '💉', color: '#7c3aed' },
];

// ============================================
// Components
// ============================================

// XP Progress Bar
function XPProgressBar({ currentXP, level }: { currentXP: number; level: number }) {
  const xpForNextLevel = level * 100;
  const xpInCurrentLevel = currentXP % 100;
  const progress = (xpInCurrentLevel / 100) * 100;

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
            <Star className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">Level {level}</span>
        </div>
        <span className="text-sm text-white/60">{xpInCurrentLevel} / 100 XP</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
        />
      </div>
    </div>
  );
}

// Hero Learning Card
function HeroLearningCard({
  settings,
  onStartLearning,
  reviewsDue,
  pendingActions,
  isLoading,
}: {
  settings: LearningSettings;
  onStartLearning: () => void;
  reviewsDue: number;
  pendingActions: number;
  isLoading: boolean;
}) {
  const levelConfig = LEARNING_LEVELS[settings.learning_level];
  
  // Determine what to show
  const hasUrgent = reviewsDue > 0 || pendingActions > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6"
    >
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Heute lernen</h2>
            <div className="flex items-center gap-3 text-white/80">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {levelConfig.minutes} Min
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-400" />
                {settings.streak_current} Tage
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{settings.total_modules_completed}</p>
            <p className="text-sm text-white/60">Module</p>
          </div>
        </div>

        {/* Urgent notifications */}
        {hasUrgent && !isLoading && (
          <div className="flex gap-2 mb-4">
            {reviewsDue > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/30 rounded-full text-amber-200 text-sm">
                <RefreshCw className="w-4 h-4" />
                {reviewsDue} Reviews
              </div>
            )}
            {pendingActions > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/30 rounded-full text-rose-200 text-sm">
                <Target className="w-4 h-4" />
                {pendingActions} Actions
              </div>
            )}
          </div>
        )}

        {/* CTA Button */}
        <motion.button
          onClick={onStartLearning}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-white text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Play className="w-6 h-6" />
          Jetzt lernen
        </motion.button>
      </div>
    </motion.div>
  );
}

// Quick Action Card
function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
  count,
  color,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  count?: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-4 rounded-xl border transition-all text-left ${color}`}
    >
      {count !== undefined && count > 0 && (
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
          {count}
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/20 rounded-xl">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm opacity-80">{subtitle}</p>
        </div>
      </div>
    </motion.button>
  );
}

// Tool Button (larger)
function ToolButton({
  icon: Icon,
  title,
  subtitle,
  gradient,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  gradient: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-5 rounded-2xl bg-gradient-to-br ${gradient} border border-white/10 hover:border-white/20 transition-all text-center`}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
          {badge}
        </span>
      )}
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 bg-white/20 rounded-xl">
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="font-semibold text-lg">{title}</p>
          <p className="text-sm opacity-70">{subtitle}</p>
        </div>
      </div>
    </motion.button>
  );
}

// Category Chip (compact)
function CategoryChip({ category, onClick }: { category: Category; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all whitespace-nowrap"
    >
      <span className="text-xl">{category.icon}</span>
      <span className="font-medium">{category.name}</span>
      <ChevronRight className="w-4 h-4 text-white/40" />
    </motion.button>
  );
}

// Goal Progress Card
function GoalProgressCard({ goal, onClick }: { goal: UserGoal; onClick: () => void }) {
  const progress = goal.totalModulesCompleted ? Math.min((goal.totalModulesCompleted / 10) * 100, 100) : 0;
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/10 rounded-xl border border-indigo-500/30 hover:border-indigo-500/50 transition-all text-left"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          <span className="text-sm text-indigo-400 font-medium">Aktives Ziel</span>
        </div>
        <span className="text-sm text-white/60">{Math.round(progress)}%</span>
      </div>
      <h3 className="font-semibold mb-2">{goal.title}</h3>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
      </div>
    </motion.button>
  );
}

// Onboarding Modal
function OnboardingModal({ isOpen, onComplete }: { isOpen: boolean; onComplete: (level: LearningLevel) => void }) {
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>('standard');

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1a2e] rounded-2xl p-6 max-w-lg w-full border border-white/10"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Willkommen!</h2>
          <p className="text-white/60">Wie viel Zeit hast du täglich zum Lernen?</p>
        </div>

        <div className="space-y-3 mb-6">
          {(Object.entries(LEARNING_LEVELS) as [LearningLevel, typeof LEARNING_LEVELS.minimal & { recommended?: boolean }][]).map(([level, config]) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedLevel === level
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{config.label}</span>
                <span className="text-sm text-white/60">{config.minutes} Min</span>
              </div>
              {config.recommended && (
                <span className="text-xs text-amber-400">⭐ Empfohlen</span>
              )}
            </button>
          ))}
        </div>

        <motion.button
          onClick={() => onComplete(selectedLevel)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold rounded-xl"
        >
          Los geht's! 🚀
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// Goal Selection Modal
function GoalSelectionModal({
  isOpen,
  onClose,
  onSelectGoal,
  goals,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoal: (goal: UserGoal) => void;
  goals: UserGoal[];
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    const found = CATEGORIES.find(c => c.slug === category);
    return found?.icon || '🎯';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1a2e] rounded-2xl p-6 max-w-lg w-full border border-white/10 max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Woran arbeiten?</h2>
            <p className="text-white/60 text-sm">Wähle ein Ziel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-4">Noch keine Ziele erstellt.</p>
            <button
              onClick={() => window.location.href = '/goals'}
              className="px-6 py-2 bg-indigo-500 rounded-lg font-medium"
            >
              Ziel erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto flex-1">
            {goals.map((goal) => (
              <motion.button
                key={goal.id}
                onClick={() => onSelectGoal(goal)}
                whileHover={{ scale: 1.01 }}
                className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 transition-all text-left flex items-center gap-4"
              >
                <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                <div className="flex-1">
                  <h3 className="font-medium">{goal.title}</h3>
                  <p className="text-sm text-white/60">Modul {goal.currentModule || 1}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function AkademiePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [settings, setSettings] = useState<LearningSettings>({
    learning_level: 'standard',
    daily_goal_minutes: 15,
    streak_current: 0,
    streak_best: 0,
    total_modules_completed: 0,
    total_xp: 0,
    current_level: 1,
  });
  const [reviewsDue, setReviewsDue] = useState(0);
  const [pendingActions, setPendingActions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGoal, setActiveGoal] = useState<UserGoal | null>(null);

  // Fetch user goals
  const fetchGoals = async () => {
    if (!user?.email) return;
    setGoalsLoading(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.from('users').select('id').eq('email', user.email).single();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!userData?.id) return;

      const { data: goals } = await supabase
        .from('goals')
        .select('id, title, category, status')
        .eq('user_id', userData.id)
        .in('status', ['active', 'in_progress'])
        .order('created_at', { ascending: false });

      if (goals && authUser?.id) {
        const { data: progressData } = await supabase
          .from('goal_learning_progress')
          .select('*')
          .eq('user_id', authUser.id);

        const goalsWithProgress = goals.map(goal => {
          const progress = progressData?.find(p => p.goal_id === goal.id);
          return {
            ...goal,
            currentModule: progress?.current_module || 1,
            totalModulesCompleted: progress?.total_modules_completed || 0,
          };
        });

        setUserGoals(goalsWithProgress);
        if (goalsWithProgress.length > 0) {
          setActiveGoal(goalsWithProgress[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  // Fetch learning settings
  const fetchLearningSettings = async () => {
    if (!user?.email) return;
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.id) {
        const { data: settingsData } = await supabase
          .from('learning_settings')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (settingsData) {
          setSettings({
            learning_level: settingsData.learning_level || 'standard',
            daily_goal_minutes: settingsData.daily_goal_minutes || 15,
            streak_current: settingsData.streak_current || 0,
            streak_best: settingsData.streak_best || 0,
            total_modules_completed: settingsData.total_modules_completed || 0,
            total_xp: settingsData.total_xp || 0,
            current_level: settingsData.current_level || 1,
          });
        } else {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setShowOnboarding(true);
    }
  };

  // Fetch reviews and actions count
  const fetchCounts = async () => {
    if (!user?.email) return;
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.id) return;

      // Reviews
      const reviewsResponse = await fetch(`/api/reviews?userId=${authUser.id}`);
      const reviewsData = await reviewsResponse.json();
      setReviewsDue(reviewsData.count || 0);

      // Actions
      const { count } = await supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('status', 'pending');
      setPendingActions(count || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchLearningSettings();
      fetchGoals();
      fetchCounts();
    }
    setTimeout(() => setIsLoading(false), 300);
  }, [user]);

  const handleLevelComplete = async (level: LearningLevel) => {
    setSettings(prev => ({ ...prev, learning_level: level, daily_goal_minutes: LEARNING_LEVELS[level].minutes }));
    setShowOnboarding(false);

    if (user?.email) {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.id) {
        await supabase.from('learning_settings').upsert({
          user_id: authUser.id,
          learning_level: level,
          daily_goal_minutes: LEARNING_LEVELS[level].minutes,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    }
  };

  const handleStartLearning = () => {
    fetchGoals();
    setShowGoalSelection(true);
  };

  const handleSelectGoal = (goal: UserGoal) => {
    setShowGoalSelection(false);
    router.push(`/akademie/lernen?goalId=${goal.id}&goalTitle=${encodeURIComponent(goal.title)}&category=${goal.category}&moduleNumber=${goal.currentModule || 1}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Akademie</h1>
              <p className="text-sm text-white/60">Lerne & Wachse</p>
            </div>
          </div>
          <button onClick={() => setShowOnboarding(true)} className="p-2 hover:bg-white/10 rounded-lg">
            <Settings className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 1. HERO - Today's Learning */}
        <HeroLearningCard
          settings={settings}
          onStartLearning={handleStartLearning}
          reviewsDue={reviewsDue}
          pendingActions={pendingActions}
          isLoading={isLoading}
        />

        {/* 2. XP Progress */}
        <XPProgressBar currentXP={settings.total_xp || 0} level={settings.current_level || 1} />

        {/* 3. Active Goal Progress (if exists) */}
        {activeGoal && (
          <GoalProgressCard goal={activeGoal} onClick={() => handleSelectGoal(activeGoal)} />
        )}

        {/* 4. Quick Actions - Reviews & Actions */}
        {(reviewsDue > 0 || pendingActions > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {reviewsDue > 0 && (
              <QuickActionCard
                icon={RefreshCw}
                title="Reviews"
                subtitle="Wissen festigen"
                count={reviewsDue}
                color="bg-amber-500/20 border-amber-500/30 hover:border-amber-500/50"
                onClick={() => router.push('/akademie/review')}
              />
            )}
            {pendingActions > 0 && (
              <QuickActionCard
                icon={Target}
                title="Actions"
                subtitle="Umsetzen"
                count={pendingActions}
                color="bg-rose-500/20 border-rose-500/30 hover:border-rose-500/50"
                onClick={() => router.push('/aktionen')}
              />
            )}
          </div>
        )}

        {/* 5. TOOLS - Prominent Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Deine Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ToolButton
              icon={Target}
              title="Aktionen"
              subtitle="Umsetzen"
              gradient="from-rose-500/20 to-pink-500/10"
              onClick={() => router.push('/aktionen')}
              badge={pendingActions}
            />
            <ToolButton
              icon={BookOpen}
              title="Bücher"
              subtitle="Lese-Journal"
              gradient="from-amber-500/20 to-orange-500/10"
              onClick={() => router.push('/buecher')}
            />
            <ToolButton
              icon={TrendingUp}
              title="Diagnose"
              subtitle="Stärken finden"
              gradient="from-emerald-500/20 to-teal-500/10"
              onClick={() => router.push('/akademie/diagnose')}
            />
            <ToolButton
              icon={Zap}
              title="Skill-Tree"
              subtitle="Deine Skills"
              gradient="from-purple-500/20 to-indigo-500/10"
              onClick={() => router.push('/akademie/skill-tree')}
            />
            <ToolButton
              icon={BarChart3}
              title="Analytics"
              subtitle="Statistiken"
              gradient="from-cyan-500/20 to-blue-500/10"
              onClick={() => router.push('/akademie/analytics')}
            />
            <ToolButton
              icon={RefreshCw}
              title="Reviews"
              subtitle="Wiederholen"
              gradient="from-indigo-500/20 to-violet-500/10"
              onClick={() => router.push('/akademie/review')}
              badge={reviewsDue}
            />
          </div>
        </section>

        {/* 6. CATEGORIES - Compact horizontal scroll */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Kategorien erkunden
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <CategoryChip
                key={category.slug}
                category={category}
                onClick={() => router.push(`/akademie/kategorie/${category.slug}`)}
              />
            ))}
          </div>
        </section>

        {/* 7. Stats Overview */}
        <section className="grid grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{settings.streak_current}</p>
            <p className="text-xs text-white/50">Streak</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{settings.streak_best}</p>
            <p className="text-xs text-white/50">Best</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <BookOpen className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{settings.total_modules_completed}</p>
            <p className="text-xs text-white/50">Module</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <Star className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{settings.total_xp || 0}</p>
            <p className="text-xs text-white/50">XP</p>
          </div>
        </section>
      </main>

      {/* Modals */}
      <GoalSelectionModal
        isOpen={showGoalSelection}
        onClose={() => setShowGoalSelection(false)}
        onSelectGoal={handleSelectGoal}
        goals={userGoals}
        isLoading={goalsLoading}
      />
      <OnboardingModal isOpen={showOnboarding} onComplete={handleLevelComplete} />
    </div>
  );
}
