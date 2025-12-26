'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  BookOpen,
  Target,
  Clock,
  Calendar,
  Flame,
  Brain,
  CheckCircle2,
  BarChart3,
  Trophy,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ============================================
// Types
// ============================================

interface LearningStats {
  totalModulesCompleted: number;
  totalMinutesLearned: number;
  currentStreak: number;
  longestStreak: number;
  avgQuizScore: number;
  totalReviewsCompleted: number;
  totalActionsCompleted: number;
  totalBooksRead: number;
  totalHighlights: number;
}

interface WeeklyData {
  day: string;
  modules: number;
  minutes: number;
}

interface SkillProgress {
  name: string;
  mastery: number;
  change: number;
}

// ============================================
// Stat Card Component
// ============================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-xl p-4 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-500/20 text-emerald-300' :
            trend === 'down' ? 'bg-red-500/20 text-red-300' :
            'bg-white/10 text-white/60'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
      {subValue && <p className="text-xs text-white/40 mt-1">{subValue}</p>}
    </motion.div>
  );
}

// ============================================
// Weekly Chart Component
// ============================================

function WeeklyChart({ data }: { data: WeeklyData[] }) {
  const maxModules = Math.max(...data.map(d => d.modules), 1);

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        Diese Woche
      </h3>
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((day, idx) => (
          <div key={day.day} className="flex-1 flex flex-col items-center">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(day.modules / maxModules) * 100}%` }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg min-h-[4px]"
              style={{ maxHeight: '100%' }}
            />
            <p className="text-xs text-white/40 mt-2">{day.day}</p>
            <p className="text-xs font-medium">{day.modules}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4 pt-4 border-t border-white/10 text-sm">
        <div>
          <p className="text-white/60">Module</p>
          <p className="font-bold">{data.reduce((sum, d) => sum + d.modules, 0)}</p>
        </div>
        <div className="text-right">
          <p className="text-white/60">Minuten</p>
          <p className="font-bold">{data.reduce((sum, d) => sum + d.minutes, 0)}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Skill Progress Component
// ============================================

function SkillProgressList({ skills }: { skills: SkillProgress[] }) {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-400" />
        Skill-Fortschritt
      </h3>
      {skills.length === 0 ? (
        <p className="text-white/40 text-sm">Noch keine Skills getrackt</p>
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => (
            <div key={skill.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{skill.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{skill.mastery}%</span>
                  {skill.change !== 0 && (
                    <span className={`text-xs ${
                      skill.change > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {skill.change > 0 ? '+' : ''}{skill.change}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.mastery}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user?.email) return;

      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return;

      try {
        // Fetch learning activity for stats
        const { data: activities } = await supabase
          .from('learning_activity')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        // Fetch learning settings for streak
        const { data: settings } = await supabase
          .from('learning_settings')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        // Fetch completed actions
        const { count: actionsCount } = await supabase
          .from('actions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('status', 'completed');

        // Fetch books
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', authUser.id);

        // Fetch highlights
        const { count: highlightsCount } = await supabase
          .from('book_highlights')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);

        // Fetch skills for progress
        const { data: skills } = await supabase
          .from('goal_skills')
          .select('skill_name, mastery_level')
          .eq('user_id', authUser.id)
          .not('parent_skill_id', 'is', null)
          .order('mastery_level', { ascending: false })
          .limit(5);

        // Calculate stats
        const moduleActivities = activities?.filter(a => a.activity_type === 'module_completed') || [];
        const quizScores = moduleActivities.map(a => a.metadata?.quizScore).filter(Boolean);
        const avgQuizScore = quizScores.length > 0
          ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
          : 0;

        setStats({
          totalModulesCompleted: moduleActivities.length,
          totalMinutesLearned: moduleActivities.length * 12, // ~12min per module
          currentStreak: settings?.streak_current || 0,
          longestStreak: settings?.streak_best || 0,
          avgQuizScore,
          totalReviewsCompleted: activities?.filter(a => a.activity_type === 'review_completed').length || 0,
          totalActionsCompleted: actionsCount || 0,
          totalBooksRead: books?.filter(b => b.status === 'completed').length || 0,
          totalHighlights: highlightsCount || 0,
        });

        // Generate weekly data (last 7 days)
        const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        const today = new Date();
        const weekData = days.map((day, idx) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - idx));
          const dateStr = date.toISOString().split('T')[0];
          
          const dayActivities = moduleActivities.filter(a => 
            a.created_at?.startsWith(dateStr)
          );
          
          return {
            day,
            modules: dayActivities.length,
            minutes: dayActivities.length * 12,
          };
        });
        setWeeklyData(weekData);

        // Set skill progress
        if (skills) {
          setSkillProgress(skills.map(s => ({
            name: s.skill_name,
            mastery: s.mastery_level,
            change: 0, // Would need historical data to calculate
          })));
        }

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [user]);

  if (isLoading) {
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Analytics</h1>
              <p className="text-sm text-white/60">Dein Lernfortschritt</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Module"
            value={stats?.totalModulesCompleted || 0}
            color="from-indigo-500 to-purple-500"
          />
          <StatCard
            icon={Clock}
            label="Lernzeit"
            value={`${stats?.totalMinutesLearned || 0}m`}
            subValue={`~${Math.round((stats?.totalMinutesLearned || 0) / 60)} Stunden`}
            color="from-emerald-500 to-teal-500"
          />
          <StatCard
            icon={Flame}
            label="Streak"
            value={stats?.currentStreak || 0}
            subValue={`Best: ${stats?.longestStreak || 0}`}
            color="from-orange-500 to-red-500"
          />
          <StatCard
            icon={Trophy}
            label="Quiz-Score"
            value={`${stats?.avgQuizScore || 0}%`}
            color="from-amber-500 to-yellow-500"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Brain}
            label="Reviews"
            value={stats?.totalReviewsCompleted || 0}
            color="from-pink-500 to-rose-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Actions"
            value={stats?.totalActionsCompleted || 0}
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            icon={BookOpen}
            label="Bücher"
            value={stats?.totalBooksRead || 0}
            color="from-amber-500 to-orange-500"
          />
          <StatCard
            icon={Sparkles}
            label="Highlights"
            value={stats?.totalHighlights || 0}
            color="from-purple-500 to-pink-500"
          />
        </div>

        {/* Weekly Chart */}
        <WeeklyChart data={weeklyData} />

        {/* Skill Progress */}
        <SkillProgressList skills={skillProgress} />

        {/* Insights */}
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-xl p-6 border border-indigo-500/30">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Insights
          </h3>
          <div className="space-y-2 text-sm">
            {stats && stats.currentStreak > 0 && (
              <p className="text-white/80">
                🔥 Du hast einen {stats.currentStreak}-Tage Streak! Halte ihn aufrecht!
              </p>
            )}
            {stats && stats.avgQuizScore >= 80 && (
              <p className="text-white/80">
                🎯 Dein Quiz-Score ist exzellent ({stats.avgQuizScore}%)! Du lernst effektiv.
              </p>
            )}
            {stats && stats.totalActionsCompleted > 5 && (
              <p className="text-white/80">
                ✅ Du hast bereits {stats.totalActionsCompleted} Actions abgeschlossen - großartig!
              </p>
            )}
            {stats && stats.totalModulesCompleted === 0 && (
              <p className="text-white/60">
                📚 Starte dein erstes Modul, um deinen Fortschritt zu tracken!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

