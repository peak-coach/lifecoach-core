'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Coffee, RotateCcw, Timer, Zap } from 'lucide-react';
import * as api from '@/lib/api';
import { useUser } from '@/lib/hooks';

interface PomodoroTimerProps {
  tasks?: api.Task[];
  onComplete?: () => void;
}

type TimerState = 'idle' | 'work' | 'short_break' | 'long_break' | 'paused';

export function PomodoroTimer({ tasks = [], onComplete }: PomodoroTimerProps) {
  const { user } = useUser();
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  // Load active session and stats on mount
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      // Check for active session
      const activeSession = await api.getActivePomodoro(user.id);
      if (activeSession) {
        const elapsed = Math.floor(
          (Date.now() - new Date(activeSession.started_at).getTime()) / 1000
        );
        const remaining = activeSession.duration_minutes * 60 - elapsed;
        
        if (remaining > 0) {
          setSessionId(activeSession.id);
          setSecondsLeft(remaining);
          setTotalSeconds(activeSession.duration_minutes * 60);
          setTimerState(activeSession.type as TimerState);
          setSelectedTaskId(activeSession.task_id);
        } else {
          // Session expired, mark as completed
          await api.stopPomodoro(activeSession.id, 'completed');
        }
      }

      // Load today's stats
      const stats = await api.getTodayPomodoroStats(user.id);
      setSessionsCompleted(stats.sessionsCompleted);
      setTotalMinutesToday(stats.totalMinutes);
    };

    loadData();
  }, [user?.id]);

  // Timer countdown
  useEffect(() => {
    if (timerState === 'idle' || timerState === 'paused') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer finished!
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState]);

  const handleTimerComplete = useCallback(async () => {
    if (!user?.id || !sessionId) return;

    // Mark session as completed
    await api.stopPomodoro(sessionId, 'completed');
    
    // Play notification sound (browser)
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } catch {}

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('🍅 Pomodoro abgeschlossen!', {
        body: timerState === 'work' 
          ? 'Zeit für eine Pause!' 
          : 'Bereit für die nächste Session?',
        icon: '/icon-192.png',
      });
    }

    if (timerState === 'work') {
      setSessionsCompleted((prev) => prev + 1);
      setTotalMinutesToday((prev) => prev + Math.floor(totalSeconds / 60));
    }

    setTimerState('idle');
    setSessionId(null);
    onComplete?.();
  }, [user?.id, sessionId, timerState, totalSeconds, onComplete]);

  const startWork = async (taskId?: string | null) => {
    if (!user?.id) return;

    const session = await api.startPomodoro(user.id, 'work', taskId);
    if (session) {
      setSessionId(session.id);
      setSecondsLeft(session.duration_minutes * 60);
      setTotalSeconds(session.duration_minutes * 60);
      setTimerState('work');
      setSelectedTaskId(taskId || null);
      setShowTaskSelector(false);
    }
  };

  const startBreak = async (type: 'short_break' | 'long_break') => {
    if (!user?.id) return;

    const session = await api.startPomodoro(user.id, type);
    if (session) {
      setSessionId(session.id);
      setSecondsLeft(session.duration_minutes * 60);
      setTotalSeconds(session.duration_minutes * 60);
      setTimerState(type);
    }
  };

  const pauseTimer = () => {
    setTimerState('paused');
  };

  const resumeTimer = () => {
    if (sessionId) {
      // Resume based on what type it was
      setTimerState('work'); // Simplified - could track previous state
    }
  };

  const stopTimer = async () => {
    if (sessionId) {
      await api.stopPomodoro(sessionId, 'cancelled');
    }
    setTimerState('idle');
    setSessionId(null);
    setSecondsLeft(25 * 60);
    setTotalSeconds(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const getStateColors = () => {
    switch (timerState) {
      case 'work':
        return { bg: 'from-[#D94F3D]/20 to-[#D94F3D]/5', ring: '#D94F3D', text: 'text-[#D94F3D]' };
      case 'short_break':
      case 'long_break':
        return { bg: 'from-emerald-500/20 to-emerald-500/5', ring: '#10b981', text: 'text-emerald-400' };
      case 'paused':
        return { bg: 'from-amber-500/20 to-amber-500/5', ring: '#f59e0b', text: 'text-amber-400' };
      default:
        return { bg: 'from-[#1f1f1f] to-[#141414]', ring: '#3f3f3f', text: 'text-muted-foreground' };
    }
  };

  const colors = getStateColors();
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors.bg} border border-[#2a2a2a] p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${colors.text}`} />
          <h3 className="font-semibold text-foreground">Pomodoro Timer</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-[#D9952A]" />
          <span>{sessionsCompleted} Sessions</span>
          <span className="text-[#3f3f3f]">•</span>
          <span>{totalMinutesToday} Min</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative flex flex-col items-center mb-6">
        {/* Circular Progress */}
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1f1f1f"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={colors.ring}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Timer Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={secondsLeft}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-4xl font-bold tabular-nums ${colors.text}`}
            >
              {formatTime(secondsLeft)}
            </motion.span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
              {timerState === 'idle' ? 'Bereit' :
               timerState === 'work' ? 'Fokus' :
               timerState === 'paused' ? 'Pausiert' :
               'Pause'}
            </span>
          </div>
        </div>

        {/* Selected Task */}
        {selectedTask && timerState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]"
          >
            <span className="text-sm text-muted-foreground">📋</span>
            <span className="text-sm text-foreground ml-2">{selectedTask.title}</span>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <AnimatePresence mode="wait">
          {timerState === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              {/* Main Start Button */}
              <button
                onClick={() => tasks.length > 0 ? setShowTaskSelector(true) : startWork()}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#D94F3D] text-white font-medium hover:bg-[#c44535] transition-colors"
              >
                <Play className="w-5 h-5" />
                Fokus starten
              </button>
              
              {/* Break Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startBreak('short_break')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1a1a] text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  <Coffee className="w-4 h-4" />
                  5 Min Pause
                </button>
                <button
                  onClick={() => startBreak('long_break')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1a1a] text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  <Coffee className="w-4 h-4" />
                  15 Min Pause
                </button>
              </div>
            </motion.div>
          )}

          {(timerState === 'work' || timerState === 'short_break' || timerState === 'long_break') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={pauseTimer}
                className="p-3 rounded-xl bg-[#1a1a1a] text-foreground hover:bg-[#2a2a2a] transition-colors"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                onClick={stopTimer}
                className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {timerState === 'paused' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={resumeTimer}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D94F3D] text-white font-medium hover:bg-[#c44535] transition-colors"
              >
                <Play className="w-5 h-5" />
                Fortsetzen
              </button>
              <button
                onClick={stopTimer}
                className="p-3 rounded-xl bg-[#1a1a1a] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task Selector Modal */}
      <AnimatePresence>
        {showTaskSelector && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskSelector(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-5 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Task auswählen</h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {tasks.filter(t => t.status !== 'completed').map((task) => (
                  <button
                    key={task.id}
                    onClick={() => startWork(task.id)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-400' :
                        task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <span className="text-foreground">{task.title}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startWork()}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#1a1a1a] text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Ohne Task starten
                </button>
                <button
                  onClick={() => setShowTaskSelector(false)}
                  className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

