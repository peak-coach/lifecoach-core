'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Target,
  Calendar,
  X,
  Trash2,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useGoals } from '@/lib/hooks';

const categories = ['personal', 'career', 'health', 'finance', 'relationships', 'learning'] as const;
const categoryLabels: Record<string, string> = {
  'personal': 'Persoenlich',
  'career': 'Arbeit',
  'health': 'Gesundheit',
  'finance': 'Finanzen',
  'relationships': 'Beziehungen',
  'learning': 'Lernen',
};

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
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GoalsPage() {
  const { goals, milestones, loading, createGoal, updateGoal, deleteGoal, toggleMilestone, createMilestone } = useGoals();
  
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  
  // New goal form state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<typeof categories[number]>('personal');
  const [newGoalMilestones, setNewGoalMilestones] = useState<string[]>(['', '', '']);

  const selectedGoal = goals.find(g => g.id === selectedGoalId) || goals[0] || null;
  const selectedMilestones = selectedGoal ? (milestones[selectedGoal.id] || []) : [];

  const resetForm = () => {
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalDeadline('');
    setNewGoalCategory('personal');
    setNewGoalMilestones(['', '', '']);
    setShowAddGoal(false);
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const validMilestones = newGoalMilestones.filter(m => m.trim());
    await createGoal({
      title: newGoalTitle,
      description: newGoalDescription || null,
      deadline: newGoalDeadline || null,
      category: newGoalCategory,
    }, validMilestones);
    resetForm();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
    if (selectedGoalId === goalId) setSelectedGoalId(null);
  };

  const handleUpdateProgress = async (goalId: string, value: number) => {
    await updateGoal(goalId, { current_value: value });
  };

  const handleToggleMilestone = async (milestoneId: string, currentCompleted: boolean) => {
    await toggleMilestone(milestoneId, !currentCompleted);
  };

  const handleAddMilestone = async () => {
    if (!selectedGoal || !newMilestoneText.trim()) return;
    await createMilestone(selectedGoal.id, newMilestoneText);
    setNewMilestoneText('');
  };

  const addMilestoneField = () => {
    setNewGoalMilestones([...newGoalMilestones, '']);
  };

  const updateMilestoneField = (index: number, value: string) => {
    const updated = [...newGoalMilestones];
    updated[index] = value;
    setNewGoalMilestones(updated);
  };

  const removeMilestoneField = (index: number) => {
    setNewGoalMilestones(newGoalMilestones.filter((_, i) => i !== index));
  };

  // Calculate progress based on milestones if available
  const getGoalProgress = (goalId: string) => {
    const goalMilestones = milestones[goalId] || [];
    if (goalMilestones.length > 0) {
      const completed = goalMilestones.filter(m => m.completed).length;
      return Math.round((completed / goalMilestones.length) * 100);
    }
    const goal = goals.find(g => g.id === goalId);
    return goal?.target_value ? Math.round((goal.current_value / goal.target_value) * 100) : 0;
  };

  const overallProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + getGoalProgress(g.id), 0) / goals.length) 
    : 0;

  const totalMilestones = Object.values(milestones).flat().length;
  const completedMilestones = Object.values(milestones).flat().filter(m => m.completed).length;

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🎯 Ziele</h1>
          <p className="text-muted-foreground mt-1">
            {goals.length} aktive Ziele, {overallProgress}% Gesamtfortschritt
          </p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D94F3D] text-white font-medium hover:bg-[#c44535] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neues Ziel
        </button>
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => resetForm()}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 p-5 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Neues Ziel</h2>
                <button onClick={() => resetForm()} className="p-1 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Titel *</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="z.B. Fuehrerschein machen"
                  className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50"
                  autoFocus
                />
              </div>

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

              {/* Milestones */}
              <div className="mb-6">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Meilensteine (Schritte zum Ziel)
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
                        <button
                          onClick={() => removeMilestoneField(index)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addMilestoneField}
                  className="mt-2 text-sm text-[#D94F3D] hover:underline"
                >
                  + Weiteren Schritt hinzufuegen
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => resetForm()}
                  className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground text-sm"
                >
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
              { icon: '🎯', label: 'Aktive Ziele', value: goals.length },
              { icon: '📈', label: 'Avg. Fortschritt', value: `${overallProgress}%` },
              { icon: '✅', label: 'Milestones', value: `${completedMilestones}/${totalMilestones}` },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141414] border border-[#1f1f1f]">
                <span className="text-xl mb-2 block">{stat.icon}</span>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Goals List */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {goals.map((goal, index) => {
                  const daysRemaining = getDaysRemaining(goal.deadline);
                  const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
                  const isOverdue = daysRemaining < 0;
                  const progress = getGoalProgress(goal.id);
                  const goalMilestones = milestones[goal.id] || [];

                  return (
                    <motion.div
                      key={goal.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedGoalId(goal.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedGoal?.id === goal.id
                          ? 'bg-[#D94F3D]/10 border border-[#D94F3D]/30'
                          : 'bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">🎯</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{goal.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabels[goal.category || 'personal']}
                            {goalMilestones.length > 0 && ` • ${goalMilestones.filter(m => m.completed).length}/${goalMilestones.length} Schritte`}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Fortschritt</span>
                          <span className={`font-medium ${progress >= 70 ? 'text-[#D9952A]' : 'text-foreground'}`}>
                            {progress}%
                          </span>
                        </div>
                        <div className="h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full rounded-full"
                            style={{
                              background: progress >= 70 ? '#D9952A' : '#D94F3D'
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(goal.deadline)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-lg ${
                          isOverdue ? 'bg-red-500/10 text-red-400' :
                          isUrgent ? 'bg-[#D94F3D]/10 text-[#D94F3D]' :
                          'bg-[#1a1a1a] text-muted-foreground'
                        }`}>
                          {isOverdue ? 'Ueberfaellig' : daysRemaining === 0 ? 'Heute' : daysRemaining === 999 ? 'Offen' : `${daysRemaining} Tage`}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {goals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Keine Ziele</p>
                  <button onClick={() => setShowAddGoal(true)} className="text-[#D94F3D] hover:underline">
                    Erstes Ziel erstellen
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
                      <span className="text-3xl">🎯</span>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{selectedGoal.title}</h2>
                        <p className="text-sm text-muted-foreground">{selectedGoal.description || 'Keine Beschreibung'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteGoal(selectedGoal.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Gesamtfortschritt</span>
                      <span className="text-lg font-bold text-foreground">
                        {getGoalProgress(selectedGoal.id)}%
                      </span>
                    </div>
                    <div className="h-3 bg-[#1f1f1f] rounded-full overflow-hidden">
                      <motion.div
                        key={getGoalProgress(selectedGoal.id)}
                        initial={{ width: 0 }}
                        animate={{ width: `${getGoalProgress(selectedGoal.id)}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#D94F3D] to-[#D9952A]"
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-[#0f0f0f] text-center">
                      <p className="text-lg font-bold text-foreground">
                        {selectedMilestones.filter(m => m.completed).length}/{selectedMilestones.length}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">Schritte</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0f0f0f] text-center">
                      <p className="text-lg font-bold text-foreground">{getDaysRemaining(selectedGoal.deadline)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Tage uebrig</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0f0f0f] text-center">
                      <p className="text-lg font-bold text-foreground">{categoryLabels[selectedGoal.category || 'personal']}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Kategorie</p>
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
                            onClick={() => handleToggleMilestone(milestone.id, milestone.completed)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              milestone.completed
                                ? 'bg-[#D9952A]/5'
                                : 'bg-[#0f0f0f] hover:bg-[#1a1a1a]'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              milestone.completed
                                ? 'bg-[#D9952A] border-[#D9952A]'
                                : 'border-[#3a3a3a] hover:border-[#D94F3D]'
                            }`}>
                              {milestone.completed && <CheckCircle2 className="w-4 h-4 text-black" />}
                            </div>
                            <span className={`flex-1 text-sm ${
                              milestone.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}>
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
                        placeholder="Neuen Meilenstein hinzufuegen..."
                        className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50"
                      />
                      <button
                        onClick={handleAddMilestone}
                        disabled={!newMilestoneText.trim()}
                        className="px-3 py-2 rounded-lg bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Waehle ein Ziel aus oder erstelle ein neues
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
