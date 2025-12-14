'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Flame,
  Zap,
  Moon,
  CheckSquare
} from 'lucide-react';

// Simple bar chart component
function SimpleBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((value, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(value / max) * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="flex-1 rounded-t"
          style={{ backgroundColor: color, minHeight: 4 }}
        />
      ))}
    </div>
  );
}

// Line chart approximation with CSS
function SimpleTrendLine({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="relative h-20 flex items-end">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
          d={data.map((value, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((value - min) / range) * 80;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={`${data.map((value, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((value - min) / range) * 80;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')} L 100 100 L 0 100 Z`}
          fill={`url(#gradient-${color})`}
        />
      </svg>
      <div className="flex justify-between w-full text-[10px] text-muted-foreground mt-2">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
          <span key={i}>{day}</span>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Mock data
  const weeklyMood = [6, 7, 8, 7, 9, 8, 7];
  const weeklyEnergy = [7, 8, 7, 6, 8, 9, 8];
  const weeklySleep = [7.5, 8, 7, 6.5, 8, 8.5, 7.5];
  const weeklyTasks = [5, 7, 6, 8, 4, 3, 5];
  const weeklyHabits = [4, 5, 5, 4, 5, 5, 4];

  const stats = {
    avgMood: 7.4,
    moodTrend: 0.3,
    avgEnergy: 7.6,
    energyTrend: 0.5,
    avgSleep: 7.6,
    sleepTrend: 0.2,
    tasksCompleted: 38,
    tasksTrend: 12,
    habitsRate: 85,
    habitsTrend: 5,
    streak: 23,
  };

  return (
    <div className="min-h-screen">
      <div className="px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{'\uD83D\uDCC8'} Analytics</h1>
            <p className="text-muted-foreground mt-1">Deine Performance im Ueberblick</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-[#0f0f0f] rounded-xl">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-[#1a1a1a] text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'week' ? 'Woche' : p === 'month' ? 'Monat' : 'Jahr'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '\uD83D\uDE0A', label: 'Avg. Stimmung', value: stats.avgMood, suffix: '/10', trend: stats.moodTrend, up: true },
            { icon: '\u26A1', label: 'Avg. Energie', value: stats.avgEnergy, suffix: '/10', trend: stats.energyTrend, up: true },
            { icon: '\uD83D\uDE34', label: 'Avg. Schlaf', value: stats.avgSleep, suffix: 'h', trend: stats.sleepTrend, up: true },
            { icon: '\uD83D\uDD25', label: 'Streak', value: stats.streak, suffix: ' Tage', trend: null, up: true },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl bg-[#141414] border border-[#1f1f1f]"
            >
              <span className="text-xl mb-3 block">{stat.icon}</span>
              <p className="text-2xl font-bold text-foreground">
                {stat.value}<span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span>
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {stat.trend !== null && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? 'text-[#D9952A]' : 'text-[#D94F3D]'}`}>
                    {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    +{stat.trend}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Mood & Energy Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#1f1f1f]"
          >
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              {'\uD83D\uDE0A'} Stimmung & Energie
            </h3>
            <SimpleTrendLine data={weeklyMood} color="#D94F3D" />
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#D94F3D]" />
                <span className="text-xs text-muted-foreground">Stimmung</span>
              </div>
            </div>
          </motion.div>

          {/* Sleep Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#1f1f1f]"
          >
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              {'\uD83D\uDE34'} Schlaf
            </h3>
            <SimpleBarChart data={weeklySleep} color="#D9952A" />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
                <span key={i}>{day}</span>
              ))}
            </div>
          </motion.div>

          {/* Tasks Completed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#1f1f1f]"
          >
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              {'\u2705'} Tasks erledigt
            </h3>
            <SimpleBarChart data={weeklyTasks} color="#D94F3D" />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
                <span key={i}>{day}</span>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#1f1f1f] flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Diese Woche</span>
              <span className="text-lg font-bold text-foreground">{stats.tasksCompleted} Tasks</span>
            </div>
          </motion.div>

          {/* Habits Rate */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#1f1f1f]"
          >
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              {'\uD83D\uDD04'} Habit Completion
            </h3>
            
            {/* Circular Progress */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#1f1f1f"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#D9952A"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 352' }}
                    animate={{ strokeDasharray: `${(stats.habitsRate / 100) * 352} 352` }}
                    transition={{ duration: 1 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-foreground">{stats.habitsRate}%</span>
                  <span className="text-xs text-muted-foreground">Completion</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-[#D9952A]" />
              <span className="text-[#D9952A] font-medium">+{stats.habitsTrend}%</span>
              <span className="text-muted-foreground">vs. letzte Woche</span>
            </div>
          </motion.div>
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl bg-gradient-to-r from-[#D9952A]/5 to-[#D94F3D]/5 border border-[#D9952A]/10"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            {'\u2728'} AI Insights
          </h3>
          <div className="space-y-3">
            {[
              { text: 'Deine Stimmung ist am hoechsten an Freitagen - plane wichtige Aufgaben fuer diese Tage.', icon: '\uD83D\uDCA1' },
              { text: 'Mit 7.6h Durchschnittsschlaf bist du im gruenen Bereich. Kleine Verbesserung moeglich!', icon: '\uD83D\uDE34' },
              { text: 'Dein Streak von 23 Tagen ist beeindruckend - noch 8 Tage bis zum neuen Rekord!', icon: '\uD83D\uDD25' },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#141414]/50">
                <span className="text-lg">{insight.icon}</span>
                <p className="text-sm text-foreground/90">{insight.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

