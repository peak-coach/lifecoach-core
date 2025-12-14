'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  ChevronDown,
  X,
  Zap,
  Loader2
} from 'lucide-react';
import { Confetti, CelebrationToast } from '@/components/confetti';
import { useTasks } from '@/lib/hooks';

const priorityColors = {
  high: { dot: 'bg-[#D94F3D]' },
  medium: { dot: 'bg-[#D9952A]' },
  low: { dot: 'bg-[#574F47]' },
};

const priorityLabels = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' };

const triggerSuggestions = [
  'Wenn ich aufwache',
  'Wenn ich meinen Kaffee trinke',
  'Nach dem Mittagessen',
  'Wenn ich von der Arbeit komme',
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (dateStr === today.toISOString().split('T')[0]) return 'Heute';
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Morgen';
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

export default function TasksPage() {
  const { tasks, loading, createTask, toggleTask, deleteTask } = useTasks();
  
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [newTaskTrigger, setNewTaskTrigger] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTime, setNewTaskTime] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showQuickAdd && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showQuickAdd]);

  const celebrationMessages = [
    "Gut gemacht! 🎉",
    "Weiter so! 💪",
    "Du rockst das! 🚀",
    "Produktiv! ⚡",
    "Stark! 🔥",
    "Yes! ✨",
  ];

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

  const addTask = async () => {
    if (!quickAddValue.trim()) return;
    await createTask({
      title: quickAddValue,
      scheduled_date: newTaskDate,
      scheduled_time: newTaskTime || undefined,
      priority: newTaskPriority,
    });
    resetForm();
  };

  const resetForm = () => {
    setQuickAddValue('');
    setNewTaskTrigger('');
    setNewTaskPriority('medium');
    setNewTaskDate(new Date().toISOString().split('T')[0]);
    setNewTaskTime('');
    setShowQuickAdd(false);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const today = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const todayTasks = activeTasks.filter(t => t.scheduled_date === today);
  const upcomingTasks = activeTasks.filter(t => t.scheduled_date && t.scheduled_date > today);

  const displayTasks = filter === 'today' ? todayTasks : filter === 'upcoming' ? upcomingTasks : activeTasks;

  const quickDates = [
    { label: 'Heute', value: today },
    { label: 'Morgen', value: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { label: 'Diese Woche', value: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
  ];

  return (
    <div className="min-h-screen p-8">
      {/* Confetti Effect */}
      <Confetti trigger={showConfetti} />
      <CelebrationToast 
        show={showCelebration} 
        message={celebrationMessage}
        onClose={() => setShowCelebration(false)} 
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">✅ Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {activeTasks.length} offen, {completedTasks.length} erledigt
          </p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D94F3D] text-white font-medium hover:bg-[#c44535] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-[#0f0f0f] rounded-xl w-fit">
        {[
          { id: 'all', label: 'Alle', count: activeTasks.length },
          { id: 'today', label: 'Heute', count: todayTasks.length },
          { id: 'upcoming', label: 'Bald', count: upcomingTasks.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.id
                ? 'bg-[#1a1a1a] text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs ${filter === tab.id ? 'text-[#D94F3D]' : 'text-muted-foreground'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {showQuickAdd && (
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
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 p-5 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Neue Task</h2>
                <button onClick={() => resetForm()} className="p-1 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Task Title */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Was muss erledigt werden?</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={quickAddValue}
                  onChange={(e) => setQuickAddValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && quickAddValue.trim() && addTask()}
                  placeholder="z.B. Businessplan Kapitel 2 schreiben"
                  className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D94F3D]/50"
                />
              </div>

              {/* Implementation Intention */}
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-[#D9952A]/5 to-[#D94F3D]/5 border border-[#D9952A]/10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-[#D9952A]" />
                  <label className="text-xs text-[#D9952A] uppercase tracking-wide font-medium">Implementation Intention</label>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Verknuepfe die Task mit einem Trigger - das erhoeht die Erfolgsrate um 2-3x!
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground font-medium">Wenn</span>
                  <input
                    type="text"
                    value={newTaskTrigger}
                    onChange={(e) => setNewTaskTrigger(e.target.value)}
                    placeholder="ich meinen Kaffee trinke..."
                    className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#D9952A]/50"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {triggerSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setNewTaskTrigger(suggestion)}
                      className="px-2 py-1 rounded-md bg-[#1a1a1a] text-xs text-muted-foreground hover:text-foreground hover:bg-[#252525] transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Datum</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {quickDates.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setNewTaskDate(d.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        newTaskDate === d.value
                          ? 'bg-[#D94F3D] text-white'
                          : 'bg-[#1a1a1a] text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                  <div className="relative">
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <button
                      onClick={() => dateInputRef.current?.showPicker()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#1a1a1a] text-muted-foreground hover:text-foreground"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Time & Priority Row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Uhrzeit</label>
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-foreground outline-none focus:border-[#D94F3D]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Prioritaet</label>
                  <div className="flex items-center gap-1">
                    {(['high', 'medium', 'low'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewTaskPriority(p)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs transition-all ${
                          newTaskPriority === p
                            ? p === 'high' ? 'bg-[#D94F3D]/20 text-[#D94F3D]' :
                              p === 'medium' ? 'bg-[#D9952A]/20 text-[#D9952A]' :
                              'bg-[#574F47]/20 text-[#574F47]'
                            : 'bg-[#1a1a1a] text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${priorityColors[p].dot}`} />
                        {priorityLabels[p]}
                      </button>
                    ))}
                  </div>
                </div>
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
                  onClick={addTask}
                  disabled={!quickAddValue.trim()}
                  className="px-5 py-2 rounded-lg bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Task erstellen
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
          {/* Task List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <p className="text-lg mb-2">Keine Tasks {filter === 'today' ? 'fuer heute' : filter === 'upcoming' ? 'geplant' : ''}</p>
                  <button
                    onClick={() => setShowQuickAdd(true)}
                    className="text-[#D94F3D] hover:underline"
                  >
                    Erste Task erstellen
                  </button>
                </motion.div>
              ) : (
                displayTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    className="group p-4 rounded-xl bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          task.status === 'completed'
                            ? 'bg-[#D9952A] border-[#D9952A]'
                            : 'border-[#3a3a3a] hover:border-[#D94F3D] hover:scale-110'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-black" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>
                        {task.description && task.status !== 'completed' && (
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {task.scheduled_date && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs">{formatDate(task.scheduled_date)}</span>
                          </div>
                        )}
                        {task.scheduled_time && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs">{task.scheduled_time.slice(0, 5)}</span>
                          </div>
                        )}

                        <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority || 'medium'].dot}`} title={priorityLabels[task.priority || 'medium']} />

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Completed Section */}
          {completedTasks.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
              >
                <motion.div animate={{ rotate: showCompleted ? 0 : -90 }}>
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
                <span className="text-sm font-medium">Erledigt ({completedTasks.length})</span>
              </button>

              <AnimatePresence>
                {showCompleted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {completedTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        className="group flex items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] opacity-60"
                      >
                        <button
                          onClick={() => handleToggleTask(task.id, task.status)}
                          className="w-5 h-5 rounded-full bg-[#D9952A] border-2 border-[#D9952A] flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-3 h-3 text-black" />
                        </button>
                        <p className="flex-1 line-through text-muted-foreground">{task.title}</p>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
