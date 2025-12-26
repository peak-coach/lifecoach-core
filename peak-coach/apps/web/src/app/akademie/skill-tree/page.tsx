'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Brain,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ============================================
// Types
// ============================================

interface Skill {
  id: string;
  goal_id: string;
  skill_name: string;
  skill_description: string | null;
  skill_category: string | null;
  parent_skill_id: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mastery_level: number;
  is_weakness: boolean;
  weakness_reason: string | null;
  last_practiced_at: string | null;
  subSkills?: Skill[];
}

interface Goal {
  id: string;
  title: string;
  category: string;
}

interface SkillSummary {
  totalSkills: number;
  completedSkills: number;
  avgMastery: number;
  weaknessCount: number;
  weaknesses: { id: string; name: string; mastery: number }[];
}

// ============================================
// Mastery Colors & Labels
// ============================================

function getMasteryColor(level: number): string {
  if (level >= 80) return 'from-emerald-500 to-green-500';
  if (level >= 60) return 'from-blue-500 to-indigo-500';
  if (level >= 40) return 'from-amber-500 to-yellow-500';
  if (level >= 20) return 'from-orange-500 to-red-500';
  return 'from-gray-500 to-gray-600';
}

function getMasteryLabel(level: number): string {
  if (level >= 80) return 'Meister';
  if (level >= 60) return 'Fortgeschritten';
  if (level >= 40) return 'Kompetent';
  if (level >= 20) return 'Anfänger';
  return 'Neu';
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'bg-green-500/20 text-green-300';
    case 'intermediate': return 'bg-amber-500/20 text-amber-300';
    case 'advanced': return 'bg-red-500/20 text-red-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
}

// ============================================
// Circular Progress Ring
// ============================================

function ProgressRing({ 
  progress, 
  size = 60, 
  strokeWidth = 6 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-white/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{progress}%</span>
      </div>
    </div>
  );
}

// ============================================
// Skill Node Component (Tree View)
// ============================================

function SkillNode({ 
  skill, 
  isExpanded, 
  onToggle,
  onSelect,
  depth = 0 
}: { 
  skill: Skill; 
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (skill: Skill) => void;
  depth?: number;
}) {
  const hasSubSkills = skill.subSkills && skill.subSkills.length > 0;
  const masteryColor = getMasteryColor(skill.mastery_level);

  return (
    <div className="relative">
      {/* Connection Line */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 w-4 h-6 border-l-2 border-b-2 border-white/20 rounded-bl-lg"
          style={{ marginLeft: '-16px' }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.05 }}
        className={`relative ${depth > 0 ? 'ml-6' : ''}`}
      >
        {/* Skill Card */}
        <div
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            skill.is_weakness
              ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
              : 'bg-white/5 border-white/10 hover:border-white/30'
          }`}
          onClick={() => hasSubSkills ? onToggle() : onSelect(skill)}
        >
          <div className="flex items-center gap-3">
            {/* Expand/Collapse Button */}
            {hasSubSkills && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className="p-1 hover:bg-white/10 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Progress Ring */}
            <ProgressRing progress={skill.mastery_level} size={48} strokeWidth={4} />

            {/* Skill Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{skill.skill_name}</h3>
                {skill.is_weakness && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    Schwäche
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(skill.difficulty)}`}>
                  {skill.difficulty === 'beginner' ? 'Einsteiger' : skill.difficulty === 'intermediate' ? 'Mittel' : 'Fortgeschritten'}
                </span>
                <span className="text-xs text-white/40">
                  {getMasteryLabel(skill.mastery_level)}
                </span>
              </div>
            </div>

            {/* Mastery Bar (Desktop) */}
            <div className="hidden md:block w-32">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.mastery_level}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${masteryColor} rounded-full`}
                />
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-white/30" />
          </div>
        </div>

        {/* Sub-Skills */}
        <AnimatePresence>
          {isExpanded && hasSubSkills && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2 pl-4 border-l-2 border-white/10"
            >
              {skill.subSkills!.map((subSkill) => (
                <SkillNode
                  key={subSkill.id}
                  skill={subSkill}
                  isExpanded={false}
                  onToggle={() => {}}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================
// Skill Detail Modal
// ============================================

function SkillDetailModal({
  skill,
  onClose,
  onPractice,
}: {
  skill: Skill;
  onClose: () => void;
  onPractice: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{skill.skill_name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mastery Progress */}
        <div className="flex items-center gap-4 mb-6">
          <ProgressRing progress={skill.mastery_level} size={80} strokeWidth={6} />
          <div>
            <p className="text-2xl font-bold">{skill.mastery_level}%</p>
            <p className="text-white/60">{getMasteryLabel(skill.mastery_level)}</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3 mb-6">
          {skill.skill_description && (
            <p className="text-white/80">{skill.skill_description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(skill.difficulty)}`}>
              {skill.difficulty === 'beginner' ? 'Einsteiger' : skill.difficulty === 'intermediate' ? 'Mittel' : 'Fortgeschritten'}
            </span>
            {skill.is_weakness && (
              <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-300">
                Schwäche
              </span>
            )}
          </div>

          {skill.weakness_reason && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-300">
                💡 {skill.weakness_reason}
              </p>
            </div>
          )}

          {skill.last_practiced_at && (
            <p className="text-sm text-white/40">
              Zuletzt geübt: {new Date(skill.last_practiced_at).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onPractice}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Jetzt üben
          </button>
          {skill.mastery_level < 80 && (
            <p className="text-center text-xs text-white/40">
              Noch {80 - skill.mastery_level}% bis zur Meisterschaft
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Goal Selector
// ============================================

function GoalSelector({
  goals,
  selectedGoalId,
  onSelect,
}: {
  goals: Goal[];
  selectedGoalId: string | null;
  onSelect: (goalId: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {goals.map((goal) => (
        <button
          key={goal.id}
          onClick={() => onSelect(goal.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            selectedGoalId === goal.id
              ? 'bg-indigo-500 text-white'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          {goal.title}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Summary Card
// ============================================

function SummaryCard({ summary }: { summary: SkillSummary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-2xl font-bold">{summary.totalSkills}</p>
        <p className="text-sm text-white/60">Skills</p>
      </div>
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <p className="text-2xl font-bold text-emerald-400">{summary.completedSkills}</p>
        <p className="text-sm text-white/60">Gemeistert</p>
      </div>
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
        <p className="text-2xl font-bold text-indigo-400">{summary.avgMastery}%</p>
        <p className="text-sm text-white/60">Ø Mastery</p>
      </div>
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
        <p className="text-2xl font-bold text-red-400">{summary.weaknessCount}</p>
        <p className="text-sm text-white/60">Schwächen</p>
      </div>
    </div>
  );
}

// ============================================
// Weaknesses Section
// ============================================

function WeaknessesSection({ 
  weaknesses, 
  onPractice 
}: { 
  weaknesses: SkillSummary['weaknesses'];
  onPractice: (skillId: string) => void;
}) {
  if (weaknesses.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
      <h3 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Fokus-Bereiche ({weaknesses.length})
      </h3>
      <div className="space-y-2">
        {weaknesses.map((w) => (
          <div 
            key={w.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
          >
            <div className="flex items-center gap-3">
              <ProgressRing progress={w.mastery} size={36} strokeWidth={3} />
              <span>{w.name}</span>
            </div>
            <button
              onClick={() => onPractice(w.id)}
              className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors"
            >
              Üben
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function SkillTreePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [summary, setSummary] = useState<SkillSummary | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user goals
  useEffect(() => {
    async function fetchGoals() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return;

      // Get app user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (!userData) return;

      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, title, category')
        .eq('user_id', userData.id)
        .in('status', ['active', 'in_progress'])
        .order('created_at', { ascending: false });

      if (goalsData && goalsData.length > 0) {
        setGoals(goalsData);
        setSelectedGoalId(goalsData[0].id);
      }
      setIsLoading(false);
    }

    fetchGoals();
  }, []);

  // Fetch skills for selected goal
  useEffect(() => {
    async function fetchSkills() {
      if (!selectedGoalId) return;

      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return;

      setIsLoading(true);

      const response = await fetch(`/api/skills?userId=${authUser.id}&goalId=${selectedGoalId}`);
      const data = await response.json();

      if (data.skills) {
        setSkills(data.skills);
        setSummary(data.summary);
        // Expand all top-level skills by default
        setExpandedSkills(new Set(data.skills.map((s: Skill) => s.id)));
      } else {
        setSkills([]);
        setSummary(null);
      }

      setIsLoading(false);
    }

    fetchSkills();
  }, [selectedGoalId]);

  const toggleSkill = (skillId: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const handleGenerateSkills = async () => {
    if (!selectedGoalId) return;

    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          goalId: goal.id,
          goalTitle: goal.title,
          goalCategory: goal.category,
        }),
      });

      const data = await response.json();

      if (data.skills) {
        setSkills(data.skills);
        setSummary(data.summary);
        setExpandedSkills(new Set(data.skills.map((s: Skill) => s.id)));
      }
    } catch (error) {
      console.error('Error generating skills:', error);
    }

    setIsGenerating(false);
  };

  const handlePracticeSkill = (skillId?: string) => {
    // Navigate to learning page with skill focus
    const goal = goals.find(g => g.id === selectedGoalId);
    if (goal) {
      router.push(`/akademie/lernen?goalId=${goal.id}&goalTitle=${encodeURIComponent(goal.title)}&category=${goal.category}${skillId ? `&skillId=${skillId}` : ''}`);
    }
    setSelectedSkill(null);
  };

  if (isLoading && goals.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="sticky top-0 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Skill-Tree</h1>
              <p className="text-sm text-white/60">Dein Fortschritt visualisiert</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Goal Selector */}
        {goals.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-white/60 mb-2">Wähle ein Ziel:</p>
            <GoalSelector
              goals={goals}
              selectedGoalId={selectedGoalId}
              onSelect={setSelectedGoalId}
            />
          </div>
        )}

        {/* No Goals */}
        {goals.length === 0 && !isLoading && (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Keine aktiven Ziele</h3>
            <p className="text-white/60 text-sm mb-4">
              Erstelle ein Ziel, um deinen Skill-Tree zu sehen
            </p>
            <button
              onClick={() => router.push('/goals')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 font-medium"
            >
              Ziel erstellen
            </button>
          </div>
        )}

        {/* Loading Skills */}
        {isLoading && selectedGoalId && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        )}

        {/* No Skills for Goal */}
        {!isLoading && selectedGoalId && skills.length === 0 && (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Keine Skills gefunden</h3>
            <p className="text-white/60 text-sm mb-4">
              Lass die KI deinen Skill-Tree für dieses Ziel erstellen
            </p>
            <button
              onClick={handleGenerateSkills}
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 font-medium flex items-center gap-2 mx-auto"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isGenerating ? 'Generiere...' : 'Skill-Tree generieren'}
            </button>
          </div>
        )}

        {/* Skills Content */}
        {!isLoading && skills.length > 0 && summary && (
          <>
            {/* Summary */}
            <SummaryCard summary={summary} />

            {/* Weaknesses */}
            <WeaknessesSection
              weaknesses={summary.weaknesses}
              onPractice={handlePracticeSkill}
            />

            {/* Skill Tree */}
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Deine Skills
              </h2>
              {skills.map((skill) => (
                <SkillNode
                  key={skill.id}
                  skill={skill}
                  isExpanded={expandedSkills.has(skill.id)}
                  onToggle={() => toggleSkill(skill.id)}
                  onSelect={setSelectedSkill}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <SkillDetailModal
            skill={selectedSkill}
            onClose={() => setSelectedSkill(null)}
            onPractice={() => handlePracticeSkill(selectedSkill.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

