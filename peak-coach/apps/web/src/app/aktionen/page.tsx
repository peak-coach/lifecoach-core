'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  PlayCircle,
  FileText,
  X,
  Loader2,
  ChevronRight,
  Star,
  AlertCircle,
  Archive,
  Plus,
  Filter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ============================================
// Types
// ============================================

interface Action {
  id: string;
  source_type: 'module' | 'book' | 'manual' | 'video';
  source_id: string | null;
  source_title: string | null;
  action_description: string;
  trigger_situation: string | null;
  intended_behavior: string | null;
  timing_type: 'specific' | 'daily' | 'weekly' | 'opportunity';
  due_date: string | null;
  status: 'pending' | 'completed' | 'skipped' | 'archived';
  completed_at: string | null;
  effectiveness_rating: number | null;
  reflection_note: string | null;
  created_at: string;
}

// ============================================
// Add Action Modal
// ============================================

function AddActionModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAdd: (action: Partial<Action>) => void;
}) {
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('');
  const [timing, setTiming] = useState<Action['timing_type']>('opportunity');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsLoading(true);
    await onAdd({
      action_description: description.trim(),
      trigger_situation: trigger.trim() || null,
      timing_type: timing,
      due_date: dueDate || null,
      source_type: 'manual',
    });
    setIsLoading(false);
    setDescription('');
    setTrigger('');
    setTiming('opportunity');
    setDueDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-400" />
              Neue Action
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Was willst du tun? *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. Täglich 10 Min meditieren"
                rows={3}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-rose-500/50 outline-none resize-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Wann? (Trigger-Situation)</label>
              <input
                type="text"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="z.B. Nach dem Aufstehen"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-rose-500/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Timing</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'daily', label: 'Täglich', icon: '📅' },
                  { value: 'weekly', label: 'Wöchentlich', icon: '📆' },
                  { value: 'specific', label: 'Bestimmter Tag', icon: '🎯' },
                  { value: 'opportunity', label: 'Bei Gelegenheit', icon: '⚡' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTiming(opt.value as Action['timing_type'])}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      timing === opt.value
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {timing === 'specific' && (
              <div>
                <label className="block text-sm text-white/60 mb-2">Datum</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-rose-500/50 outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!description.trim() || isLoading}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                description.trim() && !isLoading
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Action erstellen
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Complete Action Modal
// ============================================

function CompleteActionModal({
  action,
  onClose,
  onComplete,
}: {
  action: Action;
  onClose: () => void;
  onComplete: (rating: number, reflection: string) => void;
}) {
  const [rating, setRating] = useState(3);
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await onComplete(rating, reflection);
    setIsLoading(false);
    onClose();
  };

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
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Action abschließen
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-white/80 mb-4 p-3 rounded-lg bg-white/5">
          "{action.action_description}"
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-3">Wie effektiv war es?</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)}>
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-white/40 mt-2">
              {rating === 1 && 'Nicht hilfreich'}
              {rating === 2 && 'Wenig hilfreich'}
              {rating === 3 && 'Okay'}
              {rating === 4 && 'Hilfreich'}
              {rating === 5 && 'Sehr effektiv!'}
            </p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Kurze Reflexion (optional)</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Was hast du gelernt? Was würdest du anders machen?"
              rows={3}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500/50 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 font-semibold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Erledigt!
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Action Card
// ============================================

function ActionCard({
  action,
  onComplete,
  onArchive,
}: {
  action: Action;
  onComplete: () => void;
  onArchive: () => void;
}) {
  const sourceIcons = {
    module: <Sparkles className="w-4 h-4 text-indigo-400" />,
    book: <BookOpen className="w-4 h-4 text-amber-400" />,
    video: <PlayCircle className="w-4 h-4 text-red-400" />,
    manual: <FileText className="w-4 h-4 text-blue-400" />,
  };

  const sourceLabels = {
    module: 'Lernmodul',
    book: 'Buch',
    video: 'Video',
    manual: 'Manuell',
  };

  const timingLabels = {
    specific: 'Bestimmter Tag',
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    opportunity: 'Bei Gelegenheit',
  };

  const isOverdue = action.due_date && new Date(action.due_date) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-xl border ${
        action.status === 'completed'
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : isOverdue
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onComplete}
          disabled={action.status === 'completed'}
          className="mt-1"
        >
          {action.status === 'completed' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : (
            <Circle className="w-6 h-6 text-white/30 hover:text-white/60" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-medium ${action.status === 'completed' ? 'line-through text-white/50' : ''}`}>
            {action.action_description}
          </p>
          
          {action.trigger_situation && (
            <p className="text-sm text-white/60 mt-1">
              ⏰ {action.trigger_situation}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-xs">
              {sourceIcons[action.source_type]}
              {action.source_title || sourceLabels[action.source_type]}
            </span>
            
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-xs">
              <Clock className="w-3 h-3" />
              {timingLabels[action.timing_type]}
            </span>

            {action.due_date && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                isOverdue ? 'bg-red-500/20 text-red-300' : 'bg-white/10'
              }`}>
                <Calendar className="w-3 h-3" />
                {new Date(action.due_date).toLocaleDateString('de-DE')}
              </span>
            )}
          </div>

          {action.status === 'completed' && action.effectiveness_rating && (
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= action.effectiveness_rating! ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {action.status !== 'completed' && (
          <button
            onClick={onArchive}
            className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white/60"
            title="Archivieren"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Main Page
// ============================================

export default function AktionenPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAction, setShowAddAction] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  // Fetch actions
  useEffect(() => {
    async function fetchActions() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return;

      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', authUser.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setActions(data);
      }
      setIsLoading(false);
    }

    fetchActions();
  }, []);

  const handleAddAction = async (actionData: Partial<Action>) => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return;

    const { data, error } = await supabase
      .from('actions')
      .insert({
        user_id: authUser.id,
        ...actionData,
        status: 'pending',
      })
      .select()
      .single();

    if (!error && data) {
      setActions([data, ...actions]);
    }
  };

  const handleCompleteAction = async (actionId: string, rating: number, reflection: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        effectiveness_rating: rating,
        reflection_note: reflection || null,
      })
      .eq('id', actionId);

    if (!error) {
      setActions(actions.map(a => 
        a.id === actionId 
          ? { ...a, status: 'completed' as const, effectiveness_rating: rating }
          : a
      ));
    }
  };

  const handleArchiveAction = async (actionId: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('actions')
      .update({ status: 'archived' })
      .eq('id', actionId);

    if (!error) {
      setActions(actions.filter(a => a.id !== actionId));
    }
  };

  const filteredActions = actions.filter(action => {
    if (filter === 'all') return true;
    return action.status === filter;
  });

  const stats = {
    total: actions.length,
    pending: actions.filter(a => a.status === 'pending').length,
    completed: actions.filter(a => a.status === 'completed').length,
    overdue: actions.filter(a => a.status === 'pending' && a.due_date && new Date(a.due_date) < new Date()).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="sticky top-0 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Aktionen</h1>
                <p className="text-sm text-white/60">Was du umsetzen willst</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddAction(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Neue Action</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-white/60">Gesamt</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-xs text-white/60">Offen</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
            <p className="text-xs text-white/60">Erledigt</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
            <p className="text-xs text-white/60">Überfällig</p>
          </div>
        </div>

        {/* Overdue Warning */}
        {stats.overdue > 0 && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">
              Du hast {stats.overdue} überfällige Action{stats.overdue > 1 ? 's' : ''}!
            </p>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {f === 'pending' ? 'Offen' : f === 'completed' ? 'Erledigt' : 'Alle'}
            </button>
          ))}
        </div>

        {/* Actions List */}
        {filteredActions.length === 0 ? (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {filter === 'pending' ? 'Keine offenen Aktionen' : 'Keine Aktionen'}
            </h3>
            <p className="text-white/60 text-sm mb-4">
              {filter === 'pending' 
                ? 'Super! Du hast alles erledigt 🎉'
                : 'Erstelle deine erste Aktion oder lerne in der Akademie'}
            </p>
            <button
              onClick={() => setShowAddAction(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 font-medium"
            >
              Neue Action
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onComplete={() => setSelectedAction(action)}
                  onArchive={() => handleArchiveAction(action.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddActionModal
        isOpen={showAddAction}
        onClose={() => setShowAddAction(false)}
        onAdd={handleAddAction}
      />

      <AnimatePresence>
        {selectedAction && selectedAction.status === 'pending' && (
          <CompleteActionModal
            action={selectedAction}
            onClose={() => setSelectedAction(null)}
            onComplete={(rating, reflection) => {
              handleCompleteAction(selectedAction.id, rating, reflection);
              setSelectedAction(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

