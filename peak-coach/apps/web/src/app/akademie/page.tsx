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
  Lock,
  Zap,
  Brain,
  TrendingUp,
  Settings,
  RefreshCw,
  X,
  Loader2,
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
}

interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  moduleCount?: number;
  completedCount?: number;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  categories: string[];
  total_modules: number;
  completed_modules: number;
  status: string;
}

// ============================================
// Constants
// ============================================

const LEARNING_LEVELS = {
  minimal: {
    label: '🐢 Minimal',
    minutes: 5,
    description: '5 Min/Tag - Perfekt für busy Tage',
    color: 'from-green-500 to-emerald-600',
  },
  standard: {
    label: '⚡ Standard',
    minutes: 15,
    description: '10-15 Min/Tag - Optimaler Fortschritt',
    color: 'from-blue-500 to-indigo-600',
    recommended: true,
  },
  intensive: {
    label: '🚀 Intensiv',
    minutes: 30,
    description: '30+ Min/Tag - Schnelle Ergebnisse',
    color: 'from-purple-500 to-pink-600',
  },
};

const CATEGORIES: Category[] = [
  { slug: 'rhetorik', name: 'Rhetorik & Kommunikation', description: 'Überzeugend sprechen und präsentieren', icon: '🎤', color: '#ef4444' },
  { slug: 'psychologie', name: 'Psychologie & Mindset', description: 'Verhaltensänderung und mentale Stärke', icon: '🧠', color: '#8b5cf6' },
  { slug: 'produktivitaet', name: 'Produktivität & Fokus', description: 'Zeitmanagement und Deep Work', icon: '⚡', color: '#f59e0b' },
  { slug: 'fitness', name: 'Fitness & Gesundheit', description: 'Training und körperliche Optimierung', icon: '💪', color: '#10b981' },
  { slug: 'business', name: 'Business & Karriere', description: 'Unternehmertum und Leadership', icon: '💼', color: '#3b82f6' },
  { slug: 'lernen', name: 'Lernen & Wissen', description: 'Effektive Lernmethoden', icon: '📚', color: '#ec4899' },
  { slug: 'finanzen', name: 'Finanzen & Investing', description: 'Vermögensaufbau', icon: '💰', color: '#14b8a6' },
  { slug: 'trt', name: 'TRT & Enhanced', description: 'Hormonoptimierung', icon: '💉', color: '#7c3aed' },
];

// ============================================
// Components
// ============================================

// Level Selection Card
function LevelCard({ 
  level, 
  config, 
  isSelected, 
  onSelect 
}: { 
  level: LearningLevel; 
  config: typeof LEARNING_LEVELS.minimal & { recommended?: boolean };
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-4 rounded-xl border-2 transition-all text-left w-full ${
        isSelected 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      {config.recommended && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
          EMPFOHLEN
        </span>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-semibold">{config.label}</span>
        <span className="text-sm text-white/60">{config.minutes} Min</span>
      </div>
      <p className="text-sm text-white/60">{config.description}</p>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 left-2"
        >
          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Stats Card
function StatsCard({ icon: Icon, label, value, color }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-white/60">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Category Card
function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  const progress = category.completedCount && category.moduleCount 
    ? (category.completedCount / category.moduleCount) * 100 
    : 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{category.icon}</span>
        <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
      </div>
      <h3 className="font-semibold mb-1">{category.name}</h3>
      <p className="text-sm text-white/60 mb-3">{category.description}</p>
      {category.moduleCount && (
        <>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: category.color }}
            />
          </div>
          <p className="text-xs text-white/50">
            {category.completedCount || 0} / {category.moduleCount} Module
          </p>
        </>
      )}
    </motion.button>
  );
}

// Learning Path Card
function LearningPathCard({ path, onClick }: { path: LearningPath; onClick: () => void }) {
  const progress = path.total_modules > 0 
    ? (path.completed_modules / path.total_modules) * 100 
    : 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-5 border border-indigo-500/30 hover:border-indigo-500/50 transition-all text-left w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          <span className="text-sm text-indigo-400 font-medium">Aktiver Lernpfad</span>
        </div>
        <span className="text-sm text-white/60">{Math.round(progress)}%</span>
      </div>
      <h3 className="font-semibold text-lg mb-2">{path.title}</h3>
      <p className="text-sm text-white/60 mb-4">{path.description}</p>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {path.categories.map((cat) => (
            <span key={cat} className="px-2 py-1 bg-white/10 rounded text-xs">
              {CATEGORIES.find(c => c.slug === cat)?.icon} {cat}
            </span>
          ))}
        </div>
        <span className="text-sm text-white/60">
          {path.completed_modules} / {path.total_modules} Module
        </span>
      </div>
    </motion.button>
  );
}

// Today's Learning Card
function TodaysLearningCard({ 
  settings, 
  onStartLearning 
}: { 
  settings: LearningSettings;
  onStartLearning: () => void;
}) {
  const levelConfig = LEARNING_LEVELS[settings.learning_level];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Heute lernen</h2>
            <p className="text-white/70 text-sm">
              {levelConfig.label} • {levelConfig.minutes} Minuten
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="font-bold">{settings.streak_current}</span>
            <span className="text-sm text-white/70">Tage</span>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Deine Mikro-Lektion</p>
              <p className="text-sm text-white/70">Basierend auf deinen Zielen</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-2">
            📖 Heute lernst du etwas Neues aus deinem aktiven Lernpfad...
          </p>
        </div>

        <motion.button
          onClick={onStartLearning}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-white text-indigo-700 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
        >
          <Play className="w-5 h-5" />
          Jetzt starten
        </motion.button>
      </div>
    </motion.div>
  );
}

// Reviews Due Card
function ReviewsDueCard({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between w-full"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/30 rounded-lg">
          <RefreshCw className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-left">
          <p className="font-medium text-amber-200">{count} Reviews fällig</p>
          <p className="text-sm text-amber-200/60">Spaced Repetition</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-amber-400" />
    </motion.button>
  );
}

// Transfer Verification Card
interface PendingTransfer {
  id: string;
  moduleTitle: string;
  goalTitle: string;
  completedAt: string;
  moduleNumber: number;
}

function TransferVerificationCard({ 
  transfer, 
  onVerify 
}: { 
  transfer: PendingTransfer;
  onVerify: (applied: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const daysAgo = Math.floor(
    (Date.now() - new Date(transfer.completedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-emerald-200">Hast du es angewendet?</p>
            <p className="text-sm text-emerald-200/60">
              "{transfer.moduleTitle}" • vor {daysAgo} Tag{daysAgo !== 1 ? 'en' : ''}
            </p>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-emerald-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <p className="text-sm text-white/60 mb-4">
              🎯 Du hast "{transfer.moduleTitle}" gelernt. Hast du das Gelernte im Alltag angewendet?
            </p>
            <div className="flex gap-3">
              <motion.button
                onClick={() => onVerify(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 bg-emerald-500/30 hover:bg-emerald-500/40 rounded-lg text-emerald-200 font-medium text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Ja, angewendet! (+25 XP)
              </motion.button>
              <motion.button
                onClick={() => onVerify(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 text-sm"
              >
                Noch nicht
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Onboarding Modal for Level Selection
function OnboardingModal({ 
  isOpen, 
  onComplete 
}: { 
  isOpen: boolean; 
  onComplete: (level: LearningLevel) => void;
}) {
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>('standard');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a2e] rounded-2xl p-6 max-w-lg w-full border border-white/10"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Willkommen in der Akademie!</h2>
            <p className="text-white/60">
              Wähle dein Lern-Level. Du kannst es jederzeit ändern.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {(Object.entries(LEARNING_LEVELS) as [LearningLevel, typeof LEARNING_LEVELS.minimal][]).map(([level, config]) => (
              <LevelCard
                key={level}
                level={level}
                config={config}
                isSelected={selectedLevel === level}
                onSelect={() => setSelectedLevel(level)}
              />
            ))}
          </div>

          <motion.button
            onClick={() => onComplete(selectedLevel)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Los geht's!
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Goal Selection Modal
interface UserGoal {
  id: string;
  title: string;
  category: string;
  status: string;
  currentModule?: number;
  totalModulesCompleted?: number;
  lastQuizScore?: number;
}

interface ReviewItem {
  id: string;
  module_id: string;
  module_title: string;
  category: string;
  goal_id: string;
  review_questions: string[];
  next_review_date: string;
}

interface PendingAction {
  id: string;
  action_task: string;
  goal_id: string;
  follow_up_date: string;
}

function GoalSelectionModal({ 
  isOpen, 
  onClose,
  onSelectGoal,
  goals,
  isLoading,
  lastLearnedCategory
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSelectGoal: (goal: UserGoal) => void;
  goals: UserGoal[];
  isLoading: boolean;
  lastLearnedCategory: string | null;
}) {
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      health: '💪',
      career: '💼',
      learning: '📚',
      finance: '💰',
      relationships: '❤️',
      personal: '🌟',
      rhetorik: '🎤',
      psychologie: '🧠',
      produktivitaet: '⚡',
      fitness: '💪',
      business: '💼',
      finanzen: '💰',
    };
    return icons[category] || '🎯';
  };

  // INTERLEAVING: Sort goals so different categories come first
  const sortedGoals = [...goals].sort((a, b) => {
    // If we have a last learned category, prioritize different categories
    if (lastLearnedCategory) {
      const aIsDifferent = a.category !== lastLearnedCategory;
      const bIsDifferent = b.category !== lastLearnedCategory;
      
      if (aIsDifferent && !bIsDifferent) return -1;
      if (!aIsDifferent && bIsDifferent) return 1;
    }
    return 0;
  });

  // The first goal in sorted list is the recommended one (for interleaving)
  const recommendedGoalId = sortedGoals.length > 0 ? sortedGoals[0].id : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a2e] rounded-2xl p-6 max-w-lg w-full border border-white/10 max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Woran willst du arbeiten?</h2>
              <p className="text-white/60 text-sm">Wähle ein Ziel für deine heutige Lern-Session</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Interleaving Info Banner */}
          {lastLearnedCategory && goals.length > 1 && (
            <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-sm text-indigo-300">
                🧠 <strong>Interleaving aktiv:</strong> Für besseres Lernen empfehlen wir ein anderes Thema als "{lastLearnedCategory}".
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Du hast noch keine Ziele erstellt.</p>
              <motion.button
                onClick={() => window.location.href = '/goals'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-indigo-500 rounded-lg font-medium"
              >
                Ziel erstellen
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1">
              {sortedGoals.map((goal, index) => {
                const isRecommended = goal.id === recommendedGoalId && lastLearnedCategory && goal.category !== lastLearnedCategory;
                
                return (
                  <motion.button
                    key={goal.id}
                    onClick={() => onSelectGoal(goal)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full p-4 rounded-xl border transition-all text-left flex items-center gap-4 ${
                      isRecommended
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/50 hover:border-indigo-500'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-indigo-500/50'
                    }`}
                  >
                    <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{goal.title}</h3>
                        {isRecommended && (
                          <span className="px-2 py-0.5 bg-indigo-500 text-xs rounded-full font-medium">
                            Empfohlen
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/60 capitalize">{goal.category}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
  });
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [lastLearnedCategory, setLastLearnedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user goals
  const fetchGoals = async () => {
    if (!user?.email) return;
    
    setGoalsLoading(true);
    try {
      const supabase = createClient();
      
      // Get BOTH user IDs - app user ID (for goals) and auth user ID (for learning_* tables)
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!userData?.id) return;

      // Fetch active goals - uses app user ID (users table)
      const { data: goals } = await supabase
        .from('goals')
        .select('id, title, category, status')
        .eq('user_id', userData.id)
        .in('status', ['active', 'in_progress'])
        .order('created_at', { ascending: false });

      if (goals && authUser?.id) {
        // Fetch progress for each goal - uses AUTH user ID (auth.users table)
        const { data: progressData } = await supabase
          .from('goal_learning_progress')
          .select('*')
          .eq('user_id', authUser.id);

        // Merge progress with goals
        const goalsWithProgress = goals.map(goal => {
          const progress = progressData?.find(p => p.goal_id === goal.id);
          return {
            ...goal,
            currentModule: progress?.current_module || 1,
            totalModulesCompleted: progress?.total_modules_completed || 0,
            lastQuizScore: progress?.last_quiz_score || 0,
          };
        });

        setUserGoals(goalsWithProgress);
      } else if (goals) {
        // No auth user, just show goals without progress
        setUserGoals(goals.map(g => ({ ...g, currentModule: 1, totalModulesCompleted: 0, lastQuizScore: 0 })));
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  // Fetch learning settings from DB
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
          });
          setShowOnboarding(false);
        } else {
          // No settings found, show onboarding
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error fetching learning settings:', error);
      // If error (e.g. no row), show onboarding
      setShowOnboarding(true);
    }
  };

  // Fetch reviews due count and pending transfers
  const fetchReviewsAndTransfers = async () => {
    if (!user?.email) return;
    
    try {
      const supabase = createClient();
      
      // Get AUTH user ID - learning_* tables use auth.users(id), not users(id)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.id) return;

      // Fetch due reviews count - uses AUTH user ID
      const reviewsResponse = await fetch(`/api/reviews?userId=${authUser.id}`);
      const reviewsData = await reviewsResponse.json();
      setReviewsDue(reviewsData.count || 0);

      // Fetch pending transfer verification - uses AUTH user ID
      const transferResponse = await fetch(`/api/transfer?userId=${authUser.id}`);
      const transferData = await transferResponse.json();
      setPendingTransfer(transferData.pendingTransfer || null);

      // Fetch last learned category for interleaving - uses AUTH user ID
      const { data: lastActivity } = await supabase
        .from('learning_activity')
        .select('metadata')
        .eq('user_id', authUser.id)
        .eq('activity_type', 'module_completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastActivity?.metadata?.goalCategory) {
        setLastLearnedCategory(lastActivity.metadata.goalCategory);
      }
    } catch (error) {
      console.error('Error fetching reviews/transfers:', error);
    }
  };

  // Handle transfer verification
  const handleTransferVerify = async (applied: boolean) => {
    if (!pendingTransfer) return;

    try {
      const supabase = createClient();
      
      // Use AUTH user ID - learning_activity uses auth.users(id)
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser?.id) return;

      await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: pendingTransfer.id,
          userId: authUser.id,
          applied,
        }),
      });

      // Clear the pending transfer
      setPendingTransfer(null);

      // Show success feedback
      if (applied) {
        // Could show a toast here
        console.log('Transfer verified! +25 XP');
      }
    } catch (error) {
      console.error('Error verifying transfer:', error);
    }
  };

  useEffect(() => {
    // Fetch settings, reviews count and transfers when user is available
    if (user?.email) {
      fetchLearningSettings();
      fetchReviewsAndTransfers();
    }
    
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [user]);

  const handleLevelComplete = async (level: LearningLevel) => {
    // Update local state
    setSettings(prev => ({
      ...prev,
      learning_level: level,
      daily_goal_minutes: LEARNING_LEVELS[level].minutes,
    }));
    setShowOnboarding(false);

    // Save to database
    if (user?.email) {
      try {
        const supabase = createClient();
        
        // Get user ID from auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser?.id) {
          await supabase
            .from('learning_settings')
            .upsert({
              user_id: authUser.id,
              learning_level: level,
              daily_goal_minutes: LEARNING_LEVELS[level].minutes,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });
        }
      } catch (error) {
        console.error('Error saving learning settings:', error);
      }
    }
  };

  const handleStartLearning = () => {
    // Show goal selection modal
    fetchGoals();
    setShowGoalSelection(true);
  };

  const handleSelectGoal = (goal: UserGoal) => {
    setShowGoalSelection(false);
    // Navigate to learning page with goal context and current module number
    const moduleNumber = goal.currentModule || 1;
    router.push(`/akademie/lernen?goalId=${goal.id}&goalTitle=${encodeURIComponent(goal.title)}&category=${goal.category}&moduleNumber=${moduleNumber}`);
  };

  const handleCategoryClick = (slug: string) => {
    router.push(`/akademie/kategorie/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <BookOpen className="w-8 h-8 text-indigo-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Akademie</h1>
              <p className="text-sm text-white/60">Lerne & Wachse</p>
            </div>
          </div>
          <button 
            onClick={() => setShowOnboarding(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard 
            icon={Flame} 
            label="Streak" 
            value={settings.streak_current} 
            color="from-orange-500 to-red-500"
          />
          <StatsCard 
            icon={Trophy} 
            label="Best Streak" 
            value={settings.streak_best} 
            color="from-amber-500 to-yellow-500"
          />
          <StatsCard 
            icon={BookOpen} 
            label="Module" 
            value={settings.total_modules_completed} 
            color="from-indigo-500 to-purple-500"
          />
          <StatsCard 
            icon={Clock} 
            label="Min/Tag" 
            value={settings.daily_goal_minutes} 
            color="from-emerald-500 to-teal-500"
          />
        </div>

        {/* Transfer Verification (if pending) */}
        {pendingTransfer && (
          <TransferVerificationCard
            transfer={pendingTransfer}
            onVerify={handleTransferVerify}
          />
        )}

        {/* Today's Learning */}
        <TodaysLearningCard 
          settings={settings} 
          onStartLearning={handleStartLearning}
        />

        {/* Reviews Due */}
        <ReviewsDueCard 
          count={reviewsDue} 
          onClick={() => router.push('/akademie/review')}
        />

        {/* Active Learning Path */}
        {activePath && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Dein Lernpfad
            </h2>
            <LearningPathCard 
              path={activePath} 
              onClick={() => router.push(`/akademie/pfad/${activePath.id}`)}
            />
          </section>
        )}

        {/* Categories */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Wissens-Kategorien
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((category) => (
              <CategoryCard 
                key={category.slug}
                category={category}
                onClick={() => handleCategoryClick(category.slug)}
              />
            ))}
          </div>
        </section>

        {/* Tools Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Deine Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Actions */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/aktionen')}
              className="p-4 bg-gradient-to-br from-rose-500/20 to-pink-500/10 rounded-xl border border-rose-500/30 hover:border-rose-500/50 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="p-3 bg-rose-500/20 rounded-xl">
                <Target className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <p className="font-medium">Aktionen</p>
                <p className="text-xs text-white/60">Umsetzen</p>
              </div>
            </motion.button>

            {/* Books */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/buecher')}
              className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl border border-amber-500/30 hover:border-amber-500/50 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="font-medium">Bücher</p>
                <p className="text-xs text-white/60">Lese-Journal</p>
              </div>
            </motion.button>

            {/* Diagnose */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/akademie/diagnose')}
              className="p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Diagnose</p>
                <p className="text-xs text-white/60">Stärken finden</p>
              </div>
            </motion.button>

            {/* Skill-Tree */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/akademie/skill-tree')}
              className="p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/10 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Skill-Tree</p>
                <p className="text-xs text-white/60">Fortschritt</p>
              </div>
            </motion.button>
          </div>
        </section>
      </main>

      {/* Goal Selection Modal */}
      <GoalSelectionModal
        isOpen={showGoalSelection}
        onClose={() => setShowGoalSelection(false)}
        onSelectGoal={handleSelectGoal}
        goals={userGoals}
        isLoading={goalsLoading}
        lastLearnedCategory={lastLearnedCategory}
      />

      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onComplete={handleLevelComplete}
      />
    </div>
  );
}

