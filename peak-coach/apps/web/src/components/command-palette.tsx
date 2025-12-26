'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Repeat,
  BarChart3,
  Settings,
  Plus,
  Search,
  Sparkles,
  Calendar,
  MessageSquare,
  Zap,
  Loader2
} from 'lucide-react';

interface CommandItem {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'ai';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateQuickTask?: (title: string) => Promise<void>;
}

export function CommandPalette({ isOpen, onClose, onCreateQuickTask }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Check if search looks like a quick task (not a command match)
  const isQuickTaskMode = search.trim().length > 2 && onCreateQuickTask;

  const commands: CommandItem[] = [
    // Navigation
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', shortcut: 'D', action: () => router.push('/'), category: 'navigation' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', shortcut: 'T', action: () => router.push('/tasks'), category: 'navigation' },
    { id: 'habits', icon: Repeat, label: 'Habits', shortcut: 'H', action: () => router.push('/habits'), category: 'navigation' },
    { id: 'goals', icon: Target, label: 'Ziele', shortcut: 'G', action: () => router.push('/goals'), category: 'navigation' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', shortcut: 'A', action: () => router.push('/analytics'), category: 'navigation' },
    { id: 'settings', icon: Settings, label: 'Settings', shortcut: 'S', action: () => router.push('/settings'), category: 'navigation' },
    // Actions
    { id: 'new-task', icon: Plus, label: 'Neue Task erstellen', shortcut: 'N', action: () => { router.push('/tasks?new=true'); }, category: 'actions' },
    { id: 'new-habit', icon: Plus, label: 'Neue Gewohnheit', action: () => { router.push('/habits?new=true'); }, category: 'actions' },
    { id: 'new-goal', icon: Plus, label: 'Neues Ziel', action: () => { router.push('/goals?new=true'); }, category: 'actions' },
    { id: 'today', icon: Calendar, label: 'Heute planen', action: () => { router.push('/tasks?view=today'); }, category: 'actions' },
    // AI
    { id: 'ai-suggest', icon: Sparkles, label: 'AI: Tasks vorschlagen', action: () => { console.log('AI suggest'); }, category: 'ai' },
    { id: 'ai-coach', icon: MessageSquare, label: 'AI: Coach fragen', action: () => { console.log('AI coach'); }, category: 'ai' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.category === 'navigation'),
    actions: filteredCommands.filter(c => c.category === 'actions'),
    ai: filteredCommands.filter(c => c.category === 'ai'),
  };

  const flatFiltered = [...groupedCommands.navigation, ...groupedCommands.actions, ...groupedCommands.ai];

  const handleCreateQuickTask = useCallback(async () => {
    if (!onCreateQuickTask || !search.trim() || isCreating) return;
    
    setIsCreating(true);
    try {
      await onCreateQuickTask(search.trim());
      setSearch('');
      onClose();
    } finally {
      setIsCreating(false);
    }
  }, [onCreateQuickTask, search, isCreating, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % (flatFiltered.length || 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + (flatFiltered.length || 1)) % (flatFiltered.length || 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatFiltered[selectedIndex]) {
          flatFiltered[selectedIndex].action();
          onClose();
        } else if (isQuickTaskMode && search.trim()) {
          // No command match, create quick task
          handleCreateQuickTask();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [isOpen, flatFiltered, selectedIndex, onClose, isQuickTaskMode, search, handleCreateQuickTask]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleItemClick = (cmd: CommandItem) => {
    cmd.action();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1f1f1f]">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suchen, navigieren oder Quick-Task tippen..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  autoFocus
                />
                <kbd className="text-[10px] text-muted-foreground bg-[#1a1a1a] px-2 py-1 rounded">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto py-2">
                {flatFiltered.length === 0 ? (
                  isQuickTaskMode ? (
                    <div className="px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-[#D9952A] px-2 mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Quick-Task erstellen
                      </p>
                      <button
                        onClick={handleCreateQuickTask}
                        disabled={isCreating}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-[#D9952A]/10 text-[#D9952A] hover:bg-[#D9952A]/20 transition-colors"
                      >
                        {isCreating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span className="flex-1 text-left text-sm font-medium">"{search}"</span>
                        <kbd className="text-[10px] bg-[#D9952A]/20 px-1.5 py-0.5 rounded">↵</kbd>
                      </button>
                      <p className="text-[10px] text-muted-foreground px-2 mt-2">
                        Erstellt Task für heute mit mittlerer Priorität
                      </p>
                    </div>
                  ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    Keine Ergebnisse gefunden
                  </div>
                  )
                ) : (
                  <>
                    {groupedCommands.navigation.length > 0 && (
                      <div className="px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1">Navigation</p>
                        {groupedCommands.navigation.map((cmd, idx) => {
                          const globalIdx = flatFiltered.indexOf(cmd);
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => handleItemClick(cmd)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                globalIdx === selectedIndex
                                  ? 'bg-[#D94F3D]/10 text-[#D94F3D]'
                                  : 'text-foreground hover:bg-[#1a1a1a]'
                              }`}
                            >
                              <cmd.icon className="w-4 h-4" />
                              <span className="flex-1 text-left text-sm">{cmd.label}</span>
                              {cmd.shortcut && (
                                <kbd className="text-[10px] text-muted-foreground bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {groupedCommands.actions.length > 0 && (
                      <div className="px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1">Aktionen</p>
                        {groupedCommands.actions.map((cmd) => {
                          const globalIdx = flatFiltered.indexOf(cmd);
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => handleItemClick(cmd)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                globalIdx === selectedIndex
                                  ? 'bg-[#D94F3D]/10 text-[#D94F3D]'
                                  : 'text-foreground hover:bg-[#1a1a1a]'
                              }`}
                            >
                              <cmd.icon className="w-4 h-4" />
                              <span className="flex-1 text-left text-sm">{cmd.label}</span>
                              {cmd.shortcut && (
                                <kbd className="text-[10px] text-muted-foreground bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {groupedCommands.ai.length > 0 && (
                      <div className="px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1">AI Coach</p>
                        {groupedCommands.ai.map((cmd) => {
                          const globalIdx = flatFiltered.indexOf(cmd);
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => handleItemClick(cmd)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                globalIdx === selectedIndex
                                  ? 'bg-[#D9952A]/10 text-[#D9952A]'
                                  : 'text-foreground hover:bg-[#1a1a1a]'
                              }`}
                            >
                              <cmd.icon className="w-4 h-4 text-[#D9952A]" />
                              <span className="flex-1 text-left text-sm">{cmd.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-[#1f1f1f] flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="bg-[#1a1a1a] px-1.5 py-0.5 rounded">↑↓</kbd> navigieren
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-[#1a1a1a] px-1.5 py-0.5 rounded">↵</kbd> auswaehlen
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-[#1a1a1a] px-1.5 py-0.5 rounded">esc</kbd> schliessen
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

