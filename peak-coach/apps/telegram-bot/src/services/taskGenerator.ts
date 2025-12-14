// ============================================
// PEAK COACH - AI Task Generator
// ============================================

import OpenAI from 'openai';
import { supabase } from './supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// INTERFACES
// ============================================

interface GeneratedTask {
  title: string;
  priority: 'high' | 'medium' | 'low';
  energy_required: 'high' | 'medium' | 'low';
  estimated_minutes: number;
  reason: string;
}

interface CheckinData {
  mood: number;
  energy: number;
  sleepHours?: number;
  sleepQuality?: number;
}

interface UserContext {
  name: string;
  goals: any[];
  pendingTasks: any[];
  habits: any[];
  recentLogs: any[];
  chronotype: string;
}

// ============================================
// GET USER CONTEXT
// ============================================

async function getUserContext(userId: string): Promise<UserContext> {
  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();

  const { data: profile } = await supabase
    .from('user_profile')
    .select('chronotype')
    .eq('user_id', userId)
    .single();

  // Get active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('title, description, current_value, target_value, deadline, category')
    .eq('user_id', userId)
    .eq('status', 'active');

  // Get yesterday's incomplete tasks
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('title, priority, times_postponed')
    .eq('user_id', userId)
    .in('status', ['pending', 'postponed'])
    .lte('scheduled_date', formatDate(yesterday));

  // Get active habits
  const { data: habits } = await supabase
    .from('habits')
    .select('name, category, current_streak')
    .eq('user_id', userId)
    .eq('is_active', true);

  // Get recent logs for patterns
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data: recentLogs } = await supabase
    .from('daily_logs')
    .select('date, morning_mood, morning_energy, tasks_completed, tasks_planned')
    .eq('user_id', userId)
    .gte('date', formatDate(weekAgo))
    .order('date', { ascending: false });

  return {
    name: user?.name || 'User',
    goals: goals || [],
    pendingTasks: pendingTasks || [],
    habits: habits || [],
    recentLogs: recentLogs || [],
    chronotype: profile?.chronotype || 'neutral',
  };
}

// ============================================
// GENERATE DAILY TASKS
// ============================================

export async function generateDailyTasks(
  userId: string,
  checkinData: CheckinData
): Promise<GeneratedTask[]> {
  try {
    const context = await getUserContext(userId);
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('de-DE', { weekday: 'long' });
    const hour = today.getHours();

    // Build prompt
    const prompt = `
Du bist ein Peak Performance Coach. Erstelle einen optimalen Tagesplan mit 3-5 Tasks.

# USER KONTEXT

Name: ${context.name}
Chronotyp: ${context.chronotype === 'early_bird' ? 'Frühaufsteher' : context.chronotype === 'night_owl' ? 'Nachteule' : 'Neutral'}
Tag: ${dayOfWeek}
Aktuelle Uhrzeit: ${hour}:00

# HEUTIGER CHECK-IN

- Energie: ${checkinData.energy}/10
- Stimmung: ${checkinData.mood}/10
${checkinData.sleepHours ? `- Schlaf: ${checkinData.sleepHours}h` : ''}
${checkinData.sleepQuality ? `- Schlafqualität: ${checkinData.sleepQuality}/10` : ''}

# AKTIVE ZIELE
${context.goals.length > 0 
  ? context.goals.map(g => `- ${g.title} (${g.current_value || 0}/${g.target_value || '?'}) - ${g.category || 'Allgemein'}`).join('\n')
  : '- Keine Ziele definiert'}

# VERSCHOBENE/OFFENE TASKS
${context.pendingTasks.length > 0
  ? context.pendingTasks.map(t => `- ${t.title} (${t.times_postponed}x verschoben)`).join('\n')
  : '- Keine offenen Tasks'}

# AKTIVE HABITS (zur Info)
${context.habits.length > 0
  ? context.habits.map(h => `- ${h.name} (Streak: ${h.current_streak})`).join('\n')
  : '- Keine Habits'}

# REGELN

1. Bei Energie ≤ 4: Nur leichte Tasks, max 3 Tasks
2. Bei Energie 5-7: Normale Last, 3-4 Tasks
3. Bei Energie ≥ 8: Anspruchsvolle Tasks möglich, bis zu 5 Tasks
4. Verschobene Tasks haben Priorität (aber realistisch)
5. Tasks sollten zu den Zielen beitragen
6. Mix aus Deep Work und Quick Wins
7. Energy Matching: Schwere Tasks wenn Energie hoch

# OUTPUT FORMAT (JSON)

Antworte NUR mit einem JSON Array:
[
  {
    "title": "Konkreter Task-Titel",
    "priority": "high" | "medium" | "low",
    "energy_required": "high" | "medium" | "low",
    "estimated_minutes": 30,
    "reason": "Kurze Begründung warum dieser Task"
  }
]
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Du bist ein Peak Performance Coach. Antworte NUR mit validem JSON, keine zusätzlichen Erklärungen.' 
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    // Parse JSON (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes('```')) {
      jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const tasks: GeneratedTask[] = JSON.parse(jsonStr);
    
    logger.info(`Generated ${tasks.length} tasks for user ${userId}`);
    return tasks;

  } catch (error) {
    logger.error('Error generating daily tasks:', error);
    return getDefaultTasks(checkinData.energy);
  }
}

// ============================================
// CREATE RECURRING TASKS
// ============================================

export async function createRecurringTasks(userId: string): Promise<number> {
  try {
    const today = formatDate(new Date());
    const dayOfWeek = new Date().getDay(); // 0 = Sunday
    
    // Get user's recurring task templates
    const { data: templates } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!templates || templates.length === 0) {
      return 0;
    }

    let createdCount = 0;

    for (const template of templates) {
      // Check if should create today based on frequency
      const shouldCreate = checkFrequency(template.frequency, dayOfWeek, template.days_of_week);
      
      if (!shouldCreate) continue;

      // Check if already exists for today
      const { data: existing } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('recurring_task_id', template.id)
        .eq('scheduled_date', today)
        .single();

      if (existing) continue;

      // Create the task
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: template.title,
          description: template.description,
          priority: template.priority,
          energy_required: template.energy_required,
          scheduled_date: today,
          scheduled_time: template.preferred_time,
          status: 'pending',
          recurring_task_id: template.id,
        });

      if (!error) {
        createdCount++;
      }
    }

    logger.info(`Created ${createdCount} recurring tasks for user ${userId}`);
    return createdCount;

  } catch (error) {
    logger.error('Error creating recurring tasks:', error);
    return 0;
  }
}

function checkFrequency(frequency: string, dayOfWeek: number, daysOfWeek?: number[]): boolean {
  switch (frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'weekly':
      // Default to Monday if no specific days
      return daysOfWeek?.includes(dayOfWeek) || dayOfWeek === 1;
    case 'custom':
      return daysOfWeek?.includes(dayOfWeek) || false;
    default:
      return false;
  }
}

// ============================================
// SAVE GENERATED TASKS
// ============================================

export async function saveGeneratedTasks(
  userId: string,
  tasks: GeneratedTask[]
): Promise<string[]> {
  const today = formatDate(new Date());
  const savedIds: string[] = [];

  for (const task of tasks) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: task.title,
        priority: task.priority,
        energy_required: task.energy_required,
        estimated_minutes: task.estimated_minutes,
        scheduled_date: today,
        status: 'pending',
        source: 'ai_generated',
      })
      .select('id')
      .single();

    if (!error && data) {
      savedIds.push(data.id);
    }
  }

  logger.info(`Saved ${savedIds.length} AI-generated tasks`);
  return savedIds;
}

// ============================================
// DEFAULT TASKS (FALLBACK)
// ============================================

function getDefaultTasks(energy: number): GeneratedTask[] {
  if (energy <= 4) {
    return [
      {
        title: 'Emails & Messages checken',
        priority: 'low',
        energy_required: 'low',
        estimated_minutes: 15,
        reason: 'Leichte Aufgabe für niedrige Energie',
      },
      {
        title: '15 Min Spaziergang',
        priority: 'medium',
        energy_required: 'low',
        estimated_minutes: 15,
        reason: 'Bewegung kann Energie steigern',
      },
    ];
  } else if (energy <= 7) {
    return [
      {
        title: 'Wichtigste Aufgabe des Tages',
        priority: 'high',
        energy_required: 'medium',
        estimated_minutes: 60,
        reason: 'Eat the Frog - Wichtigstes zuerst',
      },
      {
        title: 'Admin-Aufgaben erledigen',
        priority: 'medium',
        energy_required: 'low',
        estimated_minutes: 30,
        reason: 'Routine-Aufgaben abarbeiten',
      },
      {
        title: 'Planung für morgen',
        priority: 'medium',
        energy_required: 'low',
        estimated_minutes: 15,
        reason: 'Vorbereitung reduziert Stress',
      },
    ];
  } else {
    return [
      {
        title: 'Deep Work Session (90 Min)',
        priority: 'high',
        energy_required: 'high',
        estimated_minutes: 90,
        reason: 'Hohe Energie optimal für Fokus',
      },
      {
        title: 'Zweite Fokus-Aufgabe',
        priority: 'high',
        energy_required: 'medium',
        estimated_minutes: 45,
        reason: 'Energie nutzen solange verfügbar',
      },
      {
        title: 'Sport / Training',
        priority: 'medium',
        energy_required: 'high',
        estimated_minutes: 45,
        reason: 'Körperliche Aktivität bei hoher Energie',
      },
      {
        title: 'Lernen / Weiterbildung',
        priority: 'medium',
        energy_required: 'medium',
        estimated_minutes: 30,
        reason: 'Persönliches Wachstum',
      },
    ];
  }
}

// ============================================
// DERIVE TASKS FROM GOALS
// ============================================

export async function deriveTasksFromGoals(userId: string): Promise<GeneratedTask[]> {
  try {
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!goals || goals.length === 0) {
      return [];
    }

    const prompt = `
Leite aus diesen Zielen konkrete Tasks für HEUTE ab:

# ZIELE
${goals.map(g => `
- ${g.title}
  Beschreibung: ${g.description || 'Keine'}
  Fortschritt: ${g.current_value || 0}/${g.target_value || '?'}
  Deadline: ${g.deadline || 'Keine'}
`).join('\n')}

# REGELN
1. Pro Ziel maximal 1-2 Tasks
2. Tasks müssen HEUTE machbar sein
3. Kleine, konkrete Schritte
4. Berücksichtige Deadlines

# OUTPUT FORMAT (JSON Array)
[
  {
    "title": "Konkreter Task",
    "priority": "high" | "medium" | "low",
    "energy_required": "medium",
    "estimated_minutes": 30,
    "reason": "Trägt zu Ziel X bei"
  }
]
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'Antworte NUR mit validem JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content || '[]';
    let jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
    logger.error('Error deriving tasks from goals:', error);
    return [];
  }
}

