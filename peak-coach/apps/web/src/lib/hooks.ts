'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import * as api from './api';

// ============================================
// User Hook
// ============================================

export function useUser() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      api.getUserByAuthId(authUser.id).then((data) => {
        setUser(data);
        setLoading(false);
      });
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [authUser]);

  return { user, loading };
}

// ============================================
// Dashboard Hook
// ============================================

export function useDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [habits, setHabits] = useState<api.Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<api.HabitLog[]>([]);
  const [goals, setGoals] = useState<api.Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [statsData, tasksData, habitsData, habitLogsData, goalsData] = await Promise.all([
        api.getDashboardStats(user.id),
        api.getTodaysTasks(user.id),
        api.getHabits(user.id),
        api.getTodaysHabitLogs(user.id),
        api.getGoals(user.id),
      ]);

      setStats(statsData);
      setTasks(tasksData);
      setHabits(habitsData);
      setHabitLogs(habitLogsData);
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    await api.toggleTaskComplete(taskId, completed);
    await refresh();
  };

  const toggleHabit = async (habitId: string, completed: boolean) => {
    if (!user?.id) return;
    await api.toggleHabitComplete(habitId, user.id, completed);
    await refresh();
  };

  return {
    stats,
    tasks,
    habits,
    habitLogs,
    goals,
    loading,
    refresh,
    toggleTask,
    toggleHabit,
  };
}

// ============================================
// Tasks Hook
// ============================================

export function useTasks() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await api.getAllTasks(user.id);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTask = async (task: { title: string; scheduled_date?: string; scheduled_time?: string; priority?: 'high' | 'medium' | 'low' }) => {
    if (!user?.id) return null;
    const result = await api.createTask({ ...task, user_id: user.id });
    await refresh();
    return result;
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await api.toggleTaskComplete(taskId, completed);
    await refresh();
  };

  const deleteTask = async (taskId: string) => {
    await api.deleteTask(taskId);
    await refresh();
  };

  return {
    tasks,
    loading,
    refresh,
    createTask,
    toggleTask,
    deleteTask,
  };
}

// ============================================
// Habits Hook
// ============================================

export function useHabits() {
  const { user } = useUser();
  const [habits, setHabits] = useState<api.Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<api.HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [habitsData, logsData] = await Promise.all([
        api.getHabits(user.id),
        api.getTodaysHabitLogs(user.id),
      ]);
      setHabits(habitsData);
      setHabitLogs(logsData);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createHabit = async (habit: { name: string; category?: 'health' | 'productivity' | 'mindset' | 'social' }) => {
    if (!user?.id) return null;
    const result = await api.createHabit({ ...habit, user_id: user.id });
    await refresh();
    return result;
  };

  const toggleHabit = async (habitId: string, completed: boolean) => {
    if (!user?.id) return;
    await api.toggleHabitComplete(habitId, user.id, completed);
    await refresh();
  };

  const updateHabit = async (habitId: string, updates: { name?: string; category?: 'health' | 'productivity' | 'mindset' | 'social'; description?: string | null }) => {
    const result = await api.updateHabit(habitId, updates);
    await refresh();
    return result;
  };

  const deleteHabit = async (habitId: string) => {
    await api.deleteHabit(habitId);
    await refresh();
  };

  return {
    habits,
    habitLogs,
    loading,
    refresh,
    createHabit,
    updateHabit,
    toggleHabit,
    deleteHabit,
  };
}

// ============================================
// Goals Hook
// ============================================

export function useGoals() {
  const { user } = useUser();
  const [goals, setGoals] = useState<api.Goal[]>([]);
  const [milestones, setMilestones] = useState<Record<string, api.Milestone[]>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await api.getGoals(user.id);
      setGoals(data);
      
      // Load milestones for each goal
      const milestonesMap: Record<string, api.Milestone[]> = {};
      for (const goal of data) {
        const goalMilestones = await api.getMilestones(goal.id);
        milestonesMap[goal.id] = goalMilestones;
      }
      setMilestones(milestonesMap);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGoal = async (goal: { 
    title: string; 
    description?: string | null;
    why_important?: string | null;
    category?: 'career' | 'health' | 'learning' | 'finance' | 'relationships' | 'personal';
    deadline?: string | null;
    target_value?: number | null;
    goal_type?: 'long' | 'short' | 'sprint';
    parent_goal_id?: string | null;
  }, milestoneTitles?: string[]) => {
    if (!user?.id) return null;
    const result = await api.createGoal({ ...goal, user_id: user.id });
    
    // Create milestones if provided
    if (result && milestoneTitles && milestoneTitles.length > 0) {
      for (let i = 0; i < milestoneTitles.length; i++) {
        if (milestoneTitles[i].trim()) {
          await api.createMilestone({
            goal_id: result.id,
            user_id: user.id,
            title: milestoneTitles[i],
            position: i,
          });
        }
      }
    }
    
    await refresh();
    return result;
  };

  const updateGoal = async (goalId: string, updates: Partial<api.Goal>) => {
    await api.updateGoal(goalId, updates);
    await refresh();
  };

  const deleteGoal = async (goalId: string) => {
    await api.deleteGoal(goalId);
    await refresh();
  };

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    await api.toggleMilestone(milestoneId, completed);
    await refresh();
  };

  const createMilestone = async (goalId: string, title: string) => {
    if (!user?.id) return null;
    const currentMilestones = milestones[goalId] || [];
    const result = await api.createMilestone({
      goal_id: goalId,
      user_id: user.id,
      title,
      position: currentMilestones.length,
    });
    await refresh();
    return result;
  };

  const deleteMilestone = async (milestoneId: string) => {
    await api.deleteMilestone(milestoneId);
    await refresh();
  };

  return {
    goals,
    milestones,
    loading,
    refresh,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    createMilestone,
    deleteMilestone,
  };
}

// ============================================
// Gamification Hook
// ============================================

export interface GamificationData {
  totalXP: number;
  level: number;
  badges: string[];
  todayXP: number;
  todayEvents: Array<{ type: string; amount: number; description: string }>;
}

export function useGamification() {
  const { user } = useUser();
  const [data, setData] = useState<GamificationData>({
    totalXP: 0,
    level: 1,
    badges: [],
    todayXP: 0,
    todayEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [showXPGain, setShowXPGain] = useState(false);
  const [lastXPGain, setLastXPGain] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const gamificationData = await api.getGamificationData(user.id);
      setData(gamificationData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addXP = useCallback(async (
    eventType: string, 
    amount: number, 
    description: string,
    relatedId?: string
  ) => {
    if (!user?.id) return;
    
    const oldLevel = data.level;
    
    try {
      const result = await api.addXPEvent(user.id, eventType, amount, description, relatedId);
      
      // Show XP animation
      setLastXPGain(amount);
      setShowXPGain(true);
      setTimeout(() => setShowXPGain(false), 2000);
      
      // Check for level up
      if (result.newLevel > oldLevel) {
        setNewLevel(result.newLevel);
        setShowLevelUp(true);
      }
      
      await refresh();
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  }, [user?.id, data.level, refresh]);

  const closeLevelUp = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  return {
    ...data,
    loading,
    refresh,
    addXP,
    showXPGain,
    lastXPGain,
    showLevelUp,
    newLevel,
    closeLevelUp,
  };
}

