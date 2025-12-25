'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Target,
  Calendar,
  X,
  Trash2,
  Loader2,
  CheckCircle2,
  Edit3,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Zap,
  Flag,
  Link2,
  Timer,
  Rocket,
  Mountain
} from 'lucide-react';
import { useGoals } from '@/lib/hooks';

// ============================================
// Types & Constants
// ============================================

type GoalType = 'long' | 'short' | 'sprint';

const goalTypeConfig = {
  long: {
    label: '🎯 Langzeit',
    sublabel: '3-12+ Monate',
    description: 'Große Visionen & Lebens-Ziele',
    color: '#D94F3D',
    bgColor: 'from-[#D94F3D]/10 to-[#D94F3D]/5',
    icon: Mountain,
  },
  short: {
    label: '🏃 Kurzzeit',
    sublabel: '1-4 Wochen',
    description: 'Monatliche Meilensteine',
    color: '#D9952A',
    bgColor: 'from-[#D9952A]/10 to-[#D9952A]/5',
    icon: Flag,
  },
  sprint: {
    label: '⚡ Sprint',
    sublabel: '1-7 Tage',
    description: 'Diese Woche erledigen',
    color: '#22C55E',
    bgColor: 'from-[#22C55E]/10 to-[#22C55E]/5',
    icon: Zap,
  },
};

const categories = ['personal', 'career', 'health', 'finance', 'relationships', 'learning'] as const;
const categoryLabels: Record<string, string> = {
  'personal': 'Persönlich',
  'career': 'Arbeit',
  'health': 'Gesundheit',
  'finance': 'Finanzen',
  'relationships': 'Beziehungen',
  'learning': 'Lernen',
};

// ============================================
// Helper Functions
// ============================================

function getDaysRemaining(deadline: string | null): number {
  if (!deadline) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Kein Datum';
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// ============================================
// Main Component
// ============================================

export default function GoalsPage() {
  const { goals, milestones, loading, createGoal, updateGoal, deleteGoal, toggleMilestone, createMilestone } = useGoals();
  
  const [activeTab, setActiveTab] = useState<GoalType>('long');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  
  // New goal form state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalWhyImportant, setNewGoalWhyImportant] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<typeof categories[number]>('personal');
  const [newGoalType, setNewGoalType] = useState<GoalType>('long');
  const [newGoalParentId, setNewGoalParentId] = useState<string | null>(null);
  const [newGoalMilestones, setNewGoalMilestones] = useState<string[]>(['', '', '']);
  
  // Edit goal state
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  
  // AI Refinement state
  const [isRefining, setIsRefining] = useState(false);
  const [refinedGoal, setRefinedGoal] = useState<{
    title: string;
    description: string;
    suggestedMilestones: string[];
    expertTips: string[];
    whySuggestion?: string;
  } | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
  const [expertSources, setExpertSources] = useState<string[]>([]);
  const [showRefinedPreview, setShowRefinedPreview] = useState(false);

  // ============================================
  // Computed Data
  // ============================================

  // Group goals by type and parent
  const goalsByType = useMemo(() => {
    const grouped: Record<GoalType, typeof goals> = {
      long: [],
      short: [],
      sprint: [],
    };
    
    goals.forEach(goal => {
      const type = (goal.goal_type as GoalType) || 'long';
      grouped[type].push(goal);
    });
    
    return grouped;
  }, [goals]);

  // Get child goals for a parent
  const getChildGoals = (parentId: string) => {
    return goals.filter(g => g.parent_goal_id === parentId);
  };

  // Get available parent goals (only long-term goals can be parents)
  const availableParentGoals = useMemo(() => {
    if (newGoalType === 'long') return [];
    if (newGoalType === 'short') return goalsByType.long;
    return [...goalsByType.long, ...goalsByType.short];
  }, [newGoalType, goalsByType]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId) || null;
  const selectedMilestones = selectedGoal ? (milestones[selectedGoal.id] || []) : [];

  // Stats
  const stats = useMemo(() => {
    return {
      long: goalsByType.long.length,
      short: goalsByType.short.length,
      sprint: goalsByType.sprint.length,
      total: goals.length,
    };
  }, [goals, goalsByType]);

  // ============================================
  // Handlers
  // ============================================

  const resetForm = () => {
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalWhyImportant('');
    setNewGoalDeadline('');
    setNewGoalCategory('personal');
    setNewGoalType(activeTab);
    setNewGoalParentId(null);
    setNewGoalMilestones(['', '', '']);
    setShowAddGoal(false);
    setShowEditGoal(false);
    setEditGoalId(null);
    setRefinedGoal(null);
    setDetectedCategory(null);
    setExpertSources([]);
    setShowRefinedPreview(false);
  };

  const openAddGoal = (type: GoalType, parentId?: string) => {
    setNewGoalType(type);
    setNewGoalParentId(parentId || null);
    setShowAddGoal(true);
  };

  const handleRefineGoal = async () => {
    if (!newGoalTitle.trim()) return;
    
    setIsRefining(true);
    try {
      const response = await fetch('/api/refine-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoalTitle,
          category: newGoalCategory,
          whyImportant: newGoalWhyImportant,
          goalType: newGoalType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error message
        const errorMsg = data.details || data.error || 'Unbekannter Fehler';
        alert(`KI-Optimierung fehlgeschlagen: ${errorMsg}`);
        return;
      }

      setRefinedGoal(data.refined);
      setDetectedCategory(data.detectedCategory || null);
      setExpertSources(data.sources || []);
      setShowRefinedPreview(true);
    } catch (error) {
      console.error('Goal refinement error:', error);
      alert('Netzwerk-Fehler bei der KI-Optimierung. Bitte prüfe deine Internetverbindung.');
    } finally {
      setIsRefining(false);
    }
  };

  const acceptRefinedGoal = () => {
    if (!refinedGoal) return;
    setNewGoalTitle(refinedGoal.title);
    setNewGoalDescription(refinedGoal.description || '');
    setNewGoalMilestones(refinedGoal.suggestedMilestones || ['', '', '']);
    // Also set the suggested Why if the user hasn't written one
    if (!newGoalWhyImportant && refinedGoal.whySuggestion) {
      setNewGoalWhyImportant(refinedGoal.whySuggestion);
    }
    setShowRefinedPreview(false);
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const validMilestones = newGoalMilestones.filter(m => m.trim());
    await createGoal({
      title: newGoalTitle,
      description: newGoalDescription || null,
      why_important: newGoalWhyImportant || null,
      deadline: newGoalDeadline || null,
      category: newGoalCategory,
      goal_type: newGoalType,
      parent_goal_id: newGoalParentId,
    }, validMilestones);
    resetForm();
  };

  const openEditModal = (goal: typeof goals[0]) => {
    setEditGoalId(goal.id);
    setNewGoalTitle(goal.title);
    setNewGoalDescription(goal.description || '');
    setNewGoalWhyImportant(goal.why_important || '');
    setNewGoalDeadline(goal.deadline || '');
    setNewGoalCategory((goal.category as typeof categories[number]) || 'personal');
    setNewGoalType((goal.goal_type as GoalType) || 'long');
    setNewGoalParentId(goal.parent_goal_id || null);
    setShowEditGoal(true);
  };

  const handleEditGoal = async () => {
    if (!editGoalId || !newGoalTitle.trim()) return;
    await updateGoal(editGoalId, {
      title: newGoalTitle,
      description: newGoalDescription || null,
      why_important: newGoalWhyImportant || null,
      deadline: newGoalDeadline || null,
      category: newGoalCategory,
      goal_type: newGoalType,
      parent_goal_id: newGoalParentId,
    });
    resetForm();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Ziel wirklich löschen?')) return;
    await deleteGoal(goalId);
    if (selectedGoalId === goalId) setSelectedGoalId(null);
  };

  const toggleExpand = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const getGoalProgress = (goalId: string) => {
    const goalMilestones = milestones[goalId] || [];
    if (goalMilestones.length > 0) {
      const completed = goalMilestones.filter(m => m.completed).length;
      return Math.round((completed / goalMilestones.length) * 100);
    }
    return 0;
  };

  const addMilestoneField = () => setNewGoalMilestones([...newGoalMilestones, '']);
  const updateMilestoneField = (index: number, value: string) => {
    const updated = [...newGoalMilestones];
    updated[index] = value;
    setNewGoalMilestones(updated);
  };
  const removeMilestoneField = (index: number) => {
    setNewGoalMilestones(newGoalMilestones.filter((_, i) => i !== index));
  };

  const handleAddMilestone = async () => {
    if (!selectedGoal || !newMilestoneText.trim()) return;
    await createMilestone(selectedGoal.id, newMilestoneText);
    setNewMilestoneText('');
  };

  // ============================================
  // Render Goal Card (with hierarchy)
  // ============================================

  const renderGoalCard = (goal: typeof goals[0], depth = 0) => {
    const config = goalTypeConfig[goal.goal_type as GoalType] || goalTypeConfig.long;
    const daysRemaining = getDaysRemaining(goal.deadline);
    const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
    const isOverdue = daysRemaining < 0;
    const progress = getGoalProgress(goal.id);
    const childGoals = getChildGoals(goal.id);
    const hasChildren = childGoals.length > 0;
    const isExpanded = expandedGoals.has(goal.id);
    const isSelected = selectedGoalId === goal.id;

    return (
      <div key={goal.id} className="space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setSelectedGoalId(goal.id)}
          style={{ marginLeft: depth * 24 }}
          className={`group p-4 rounded-xl cursor-pointer transition-all border ${
            isSelected
              ? `bg-gradient-to-r ${config.bgColor} border-[${config.color}]/40`
              : 'bg-[#141414] border-[#1f1f1f] hover:border-[#2a2a2a]'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Expand/Collapse */}
            {hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand(goal.id); }}
                className="mt-1 p-1 rounded hover:bg-white/10"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            {/* Goal Type Icon */}
            <div
              className="mt-0.5 p-2 rounded-lg"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <config.icon className="w-4 h-4" style={{ color: config.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground truncate">{goal.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#1a1a1a]">
                      {categoryLabels[goal.category || 'personal']}
                    </span>
                    {goal.parent_goal_id && (
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        Verknüpft
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {goal.goal_type === 'long' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openAddGoal('short', goal.id); }}
                      className="p-1.5 rounded-lg hover:bg-[#D9952A]/20 text-[#D9952A]"
                      title="Kurzzeit-Ziel hinzufügen"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  {goal.goal_type === 'short' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openAddGoal('sprint', goal.id); }}
                      className="p-1.5 rounded-lg hover:bg-[#22C55E]/20 text-[#22C55E]"
                      title="Sprint hinzufügen"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(goal); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {milestones[goal.id]?.filter(m => m.completed).length || 0}/
                    {milestones[goal.id]?.length || 0} Schritte
                  </span>
                  <span className={`font-medium ${isOverdue ? 'text-red-400' : isUrgent ? 'text-[#D94F3D]' : ''}`}>
                    {isOverdue ? 'Überfällig' : daysRemaining === 999 ? '' : `${daysRemaining}d`}
                  </span>
                </div>
                <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Child Goals */}
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {childGoals.map(child => renderGoalCard(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // Main Render
  // ============================================

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🎯 Ziele</h1>
          <p className="text-muted-foreground mt-1">
            {stats.long} Langzeit • {stats.short} Kurzzeit • {stats.sprint} Sprints
          </p>
        </div>
        <button
          onClick={() => openAddGoal(activeTab)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D94F3D] text-white font-medium hover:bg-[#c44535] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neues Ziel
        </button>
      </div>

      {/* Goal Type Tabs */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(goalTypeConfig) as GoalType[]).map((type) => {
          const config = goalTypeConfig[type];
          const count = goalsByType[type].length;
          const isActive = activeTab === type;

          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex-1 p-4 rounded-xl transition-all border ${
                isActive
                  ? `bg-gradient-to-r ${config.bgColor} border-[${config.color}]/40`
                  : 'bg-[#141414] border-[#1f1f1f] hover:border-[#2a2a2a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: isActive ? `${config.color}30` : '#1a1a1a' }}
                >
                  <config.icon
                    className="w-5 h-5"
                    style={{ color: isActive ? config.color : '#666' }}
                  />
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{config.sublabel}</p>
                </div>
                <span
                  className="ml-auto px-2 py-0.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: isActive ? `${config.color}30` : '#1a1a1a',
                    color: isActive ? config.color : '#666',
                  }}
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[5%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 p-5 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Neues Ziel</h2>
                  <p className="text-xs text-muted-foreground">
                    {goalTypeConfig[newGoalType].label} • {goalTypeConfig[newGoalType].sublabel}
                  </p>
                </div>
                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Goal Type Selection */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Ziel-Typ</label>
                <div className="flex gap-2">
                  {(Object.keys(goalTypeConfig) as GoalType[]).map((type) => {
                    const config = goalTypeConfig[type];
                    return (
                      <button
                        key={type}
                        onClick={() => { setNewGoalType(type); setNewGoalParentId(null); }}
                        className={`flex-1 p-3 rounded-xl transition-all border ${
                          newGoalType === type
                            ? `bg-gradient-to-r ${config.bgColor} border-[${config.color}]/40`
                            : 'bg-[#0f0f0f] border-[#1f1f1f]'
                        }`}
                      >
                        <config.icon
                          className="w-5 h-5 mx-auto mb-1"
                          style={{ color: newGoalType === type ? config.color : '#666' }}
                        />
                        <p className="text-xs font-medium">{config.label.split(' ')[1]}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parent Goal Selection */}
              {availableParentGoals.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                    Verknüpfen mit (optional)
                  </label>
                  <select
                    value={newGoalParentId || ''}
                    onChange={(e) => setNewGoalParentId(e.target.value || null)}
                    className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground outline-none focus:border-[#D94F3D]/50"
                  >
                    <option value="">Kein übergeordnetes Ziel</option>
                    {availableParentGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {goalTypeConfig[g.goal_type as GoalType]?.label.split(' ')[0]} {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title + AI Refine */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Titel *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder={
                      newGoalType === 'long' ? 'z.B. Fließend Spanisch sprechen' :
                      newGoalType === 'short' ? 'z.B. A2 Level erreichen' :
                      'z.B. Lektion 1-10 abschließen'
                    }
                    className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50"
                    autoFocus
                  />
                  <button
                    onClick={handleRefineGoal}
                    disabled={!newGoalTitle.trim() || isRefining}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* AI Refined Preview */}
              <AnimatePresence>
                {showRefinedPreview && refinedGoal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-purple-400">KI-Optimiertes Ziel</span>
                      </div>
                      {detectedCategory && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                          📚 {detectedCategory}
                        </span>
                      )}
                    </div>
                    
                    {/* Expert Sources */}
                    {expertSources.length > 0 && (
                      <div className="mb-3 p-2 rounded-lg bg-[#0f0f0f]/50 border border-purple-500/10">
                        <p className="text-[10px] text-purple-300/70 uppercase tracking-wide mb-1">Wissenschaftliche Quellen:</p>
                        <p className="text-[10px] text-muted-foreground">
                          {expertSources.slice(0, 4).join(' • ')}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-foreground font-medium mb-2">{refinedGoal.title}</p>
                    {refinedGoal.description && (
                      <p className="text-sm text-muted-foreground mb-3">{refinedGoal.description}</p>
                    )}

                    {/* Suggested Why */}
                    {refinedGoal.whySuggestion && !newGoalWhyImportant && (
                      <div className="mb-3 p-3 rounded-lg bg-[#0f0f0f] border border-[#D94F3D]/20">
                        <p className="text-xs text-[#D94F3D] uppercase tracking-wide mb-1">⭐ Vorgeschlagenes "Why":</p>
                        <p className="text-sm text-foreground/80 italic">"{refinedGoal.whySuggestion}"</p>
                      </div>
                    )}
                    
                    {/* Milestones */}
                    {refinedGoal.suggestedMilestones?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-purple-400 uppercase tracking-wide mb-2">📍 Wissenschaftlich fundierte Meilensteine:</p>
                        <div className="space-y-1.5">
                          {refinedGoal.suggestedMilestones.slice(0, 5).map((m, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                              <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400 shrink-0 mt-0.5">{i + 1}</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expert Tips */}
                    {refinedGoal.expertTips?.length > 0 && (
                      <div className="mb-3 p-3 rounded-lg bg-[#0f0f0f]">
                        <p className="text-xs text-yellow-500 uppercase tracking-wide mb-2">🧠 Experten-Tipps:</p>
                        <div className="space-y-1">
                          {refinedGoal.expertTips.map((tip, i) => (
                            <p key={i} className="text-xs text-muted-foreground">{tip}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={acceptRefinedGoal}
                        className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
                      >
                        <CheckCircle2 className="w-4 h-4 inline mr-2" />
                        Übernehmen
                      </button>
                      <button
                        onClick={() => setShowRefinedPreview(false)}
                        className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-muted-foreground text-sm"
                      >
                        Verwerfen
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Description */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Beschreibung</label>
                <textarea
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  placeholder="Was genau willst du erreichen?"
                  rows={2}
                  className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50 resize-none"
                />
              </div>

              {/* Why Important */}
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-[#D94F3D]/5 to-[#D9952A]/5 border border-[#D94F3D]/20">
                <label className="text-xs text-[#D94F3D] uppercase tracking-wide mb-2 block font-semibold">
                  ⭐ Warum ist das wichtig?
                </label>
                <textarea
                  value={newGoalWhyImportant}
                  onChange={(e) => setNewGoalWhyImportant(e.target.value)}
                  placeholder="Was ändert sich wenn du es erreichst?"
                  rows={2}
                  className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50 resize-none"
                />
              </div>

              {/* Deadline */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Deadline</label>
                <input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground outline-none focus:border-[#D94F3D]/50"
                />
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Kategorie</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewGoalCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        newGoalCategory === cat
                          ? 'bg-[#D94F3D] text-white'
                          : 'bg-[#1a1a1a] text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {categoryLabels[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestones (only for long-term goals) */}
              {newGoalType === 'long' && (
                <div className="mb-6">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                    Meilensteine
                  </label>
                  <div className="space-y-2">
                    {newGoalMilestones.map((milestone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border-2 border-[#3a3a3a] flex items-center justify-center text-xs text-muted-foreground">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={milestone}
                          onChange={(e) => updateMilestoneField(index, e.target.value)}
                          placeholder={`Schritt ${index + 1}...`}
                          className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50"
                        />
                        {newGoalMilestones.length > 1 && (
                          <button onClick={() => removeMilestoneField(index)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addMilestoneField} className="mt-2 text-sm text-[#D94F3D] hover:underline">
                    + Weiteren Schritt
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground text-sm">
                  Abbrechen
                </button>
                <button
                  onClick={handleAddGoal}
                  disabled={!newGoalTitle.trim()}
                  className="px-5 py-2 rounded-lg bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ziel erstellen
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Goal Modal (simplified) */}
      <AnimatePresence>
        {showEditGoal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 p-5 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Ziel bearbeiten</h2>
                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Titel *</label>
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground outline-none focus:border-[#D94F3D]/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Beschreibung</label>
                  <textarea
                    value={newGoalDescription}
                    onChange={(e) => setNewGoalDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground outline-none focus:border-[#D94F3D]/50 resize-none"
                  />
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-[#D94F3D]/5 to-[#D9952A]/5 border border-[#D94F3D]/20">
                  <label className="text-xs text-[#D94F3D] uppercase tracking-wide mb-2 block font-semibold">⭐ Warum ist das wichtig?</label>
                  <textarea
                    value={newGoalWhyImportant}
                    onChange={(e) => setNewGoalWhyImportant(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground outline-none focus:border-[#D94F3D]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Deadline</label>
                  <input
                    type="date"
                    value={newGoalDeadline}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground outline-none focus:border-[#D94F3D]/50"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#1f1f1f]">
                  <button
                    onClick={() => editGoalId && handleDeleteGoal(editGoalId)}
                    className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm"
                  >
                    Löschen
                  </button>
                  <div className="flex gap-2">
                    <button onClick={resetForm} className="px-4 py-2 rounded-lg text-muted-foreground text-sm">
                      Abbrechen
                    </button>
                    <button
                      onClick={handleEditGoal}
                      disabled={!newGoalTitle.trim()}
                      className="px-5 py-2 rounded-lg bg-[#D94F3D] text-white text-sm font-medium disabled:opacity-50"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#D94F3D]" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Goals List */}
          <div className="lg:col-span-2 space-y-3">
            {goalsByType[activeTab].filter(g => !g.parent_goal_id).length > 0 ? (
              goalsByType[activeTab]
                .filter(g => !g.parent_goal_id)
                .map(goal => renderGoalCard(goal))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">Keine {goalTypeConfig[activeTab].label} Ziele</p>
                <button
                  onClick={() => openAddGoal(activeTab)}
                  className="text-[#D94F3D] hover:underline"
                >
                  Erstes {goalTypeConfig[activeTab].label.split(' ')[1]}-Ziel erstellen
                </button>
              </div>
            )}
          </div>

          {/* Goal Detail */}
          <div className="lg:col-span-3 p-6 rounded-xl bg-[#141414] border border-[#1f1f1f]">
            {selectedGoal ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${goalTypeConfig[selectedGoal.goal_type as GoalType]?.color || '#D94F3D'}20` }}
                    >
                      {(() => {
                        const Icon = goalTypeConfig[selectedGoal.goal_type as GoalType]?.icon || Target;
                        return <Icon className="w-6 h-6" style={{ color: goalTypeConfig[selectedGoal.goal_type as GoalType]?.color || '#D94F3D' }} />;
                      })()}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase">
                        {goalTypeConfig[selectedGoal.goal_type as GoalType]?.label || 'Ziel'}
                      </span>
                      <h2 className="text-xl font-bold text-foreground">{selectedGoal.title}</h2>
                      {selectedGoal.description && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedGoal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(selectedGoal)} className="p-2 rounded-lg hover:bg-[#D94F3D]/10 text-muted-foreground hover:text-[#D94F3D]">
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteGoal(selectedGoal.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Why Important */}
                {selectedGoal.why_important && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#D94F3D]/5 to-[#D9952A]/5 border border-[#D94F3D]/20">
                    <p className="text-xs text-[#D94F3D] uppercase tracking-wide mb-2 font-semibold">⭐ Mein "Why"</p>
                    <p className="text-foreground italic">"{selectedGoal.why_important}"</p>
                  </div>
                )}

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Fortschritt</span>
                    <span className="text-lg font-bold text-foreground">{getGoalProgress(selectedGoal.id)}%</span>
                  </div>
                  <div className="h-3 bg-[#1f1f1f] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getGoalProgress(selectedGoal.id)}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#D94F3D] to-[#D9952A]"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-[#0f0f0f] text-center">
                    <p className="text-lg font-bold text-foreground">
                      {selectedMilestones.filter(m => m.completed).length}/{selectedMilestones.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Schritte</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0f0f0f] text-center">
                    <p className="text-lg font-bold text-foreground">{getDaysRemaining(selectedGoal.deadline)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Tage übrig</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0f0f0f] text-center">
                    <p className="text-lg font-bold text-foreground">{getChildGoals(selectedGoal.id).length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Unter-Ziele</p>
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#D94F3D]" />
                    Meilensteine
                  </h3>
                  
                  {selectedMilestones.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {selectedMilestones.map((milestone, index) => (
                        <motion.div
                          key={milestone.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => toggleMilestone(milestone.id, !milestone.completed)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            milestone.completed ? 'bg-[#D9952A]/5' : 'bg-[#0f0f0f] hover:bg-[#1a1a1a]'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            milestone.completed ? 'bg-[#D9952A] border-[#D9952A]' : 'border-[#3a3a3a] hover:border-[#D94F3D]'
                          }`}>
                            {milestone.completed && <CheckCircle2 className="w-4 h-4 text-black" />}
                          </div>
                          <span className={`flex-1 text-sm ${milestone.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {milestone.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">Keine Meilensteine definiert</p>
                  )}

                  {/* Add Milestone */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMilestoneText}
                      onChange={(e) => setNewMilestoneText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                      placeholder="Neuen Meilenstein hinzufügen..."
                      className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50"
                    />
                    <button
                      onClick={handleAddMilestone}
                      disabled={!newMilestoneText.trim()}
                      className="px-3 py-2 rounded-lg bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Child Goals */}
                {getChildGoals(selectedGoal.id).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#1f1f1f]">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-[#D9952A]" />
                      Verknüpfte Ziele
                    </h3>
                    <div className="space-y-2">
                      {getChildGoals(selectedGoal.id).map(child => {
                        const config = goalTypeConfig[child.goal_type as GoalType] || goalTypeConfig.short;
                        return (
                          <div
                            key={child.id}
                            onClick={() => setSelectedGoalId(child.id)}
                            className="p-3 rounded-lg bg-[#0f0f0f] hover:bg-[#1a1a1a] cursor-pointer flex items-center gap-3"
                          >
                            <config.icon className="w-4 h-4" style={{ color: config.color }} />
                            <span className="text-sm text-foreground">{child.title}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {config.label.split(' ')[1]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Wähle ein Ziel aus oder erstelle ein neues
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
