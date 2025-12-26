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

export interface GeneratedTask {
  title: string;
  priority: 'high' | 'medium' | 'low';
  energy_required: 'high' | 'medium' | 'low';
  estimated_minutes: number;
  reason: string;
  goal_title?: string; // Which goal this task supports
}

export interface CheckinData {
  mood: number;
  energy: number;
  sleepHours?: number;
  sleepQuality?: number;
}

export type WorkMode = 'focus' | 'working' | 'recovery';

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

  // Get active goals (including why_important for motivation context)
  // Also include 'in_progress' status as those are also active goals
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select(`
      id,
      title, 
      description, 
      current_value, 
      target_value, 
      deadline, 
      category, 
      why_important, 
      status
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'in_progress']);
  
  if (goalsError) {
    logger.error('Error fetching goals:', goalsError);
  }
  
  // Get milestones for each goal
  const goalsWithMilestones = [];
  for (const goal of goals || []) {
    const { data: milestones } = await supabase
      .from('milestones')
      .select('title, completed, position')
      .eq('goal_id', goal.id)
      .order('position', { ascending: true });
    
    goalsWithMilestones.push({
      ...goal,
      milestones: milestones || [],
      nextMilestone: milestones?.find(m => !m.completed)?.title || null,
    });
  }
  
  logger.info(`Found ${goalsWithMilestones.length} goals for user ${userId}:`, goalsWithMilestones.map(g => `${g.title} (${g.milestones.length} milestones)`));

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
    goals: goalsWithMilestones,
    pendingTasks: pendingTasks || [],
    habits: habits || [],
    recentLogs: recentLogs || [],
    chronotype: profile?.chronotype || 'neutral',
  };
}

// ============================================
// GENERATE DAILY TASKS (GOAL-FIRST APPROACH)
// ============================================

export async function generateDailyTasks(
  userId: string,
  checkinData: CheckinData,
  workMode: WorkMode = 'focus'
): Promise<GeneratedTask[]> {
  try {
    const context = await getUserContext(userId);
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('de-DE', { weekday: 'long' });
    const hour = today.getHours();

    // ARBEITSZEIT MODE: Nur Mini-Tasks
    if (workMode === 'working') {
      return getWorkingModeTasks(checkinData.energy);
    }

    // RECOVERY MODE: Sehr leichte Tasks
    if (workMode === 'recovery' || checkinData.energy <= 3) {
      return getRecoveryTasks();
    }

    // Keine Ziele? Leere Liste - User soll Ziele erstellen
    if (context.goals.length === 0) {
      logger.info(`No goals found for user ${userId} - returning empty array`);
      return []; // Return empty so UI can prompt user to create goals
    }
    
    logger.info(`Generating GOAL-FIRST tasks for ${context.goals.length} goals: ${context.goals.map(g => g.title).join(', ')}`);

    // PERFECT TASK GENERATION PROMPT
    const prompt = `
Du bist ein ELITE Peak Performance Coach. Erstelle für JEDES Ziel den PERFEKTEN nächsten Task.

# 🎯 DEIN VORGEHEN (PERFEKTE TASKS)

Für JEDES Ziel - in dieser Reihenfolge:

1. **HAT DAS ZIEL EINEN MEILENSTEIN?**
   → JA: Der Task MUSS direkt aus dem nächsten Meilenstein abgeleitet sein!
   → NEIN: Finde den effektivsten ersten Schritt

2. **WAS IST DIE IMMEDIATE NEXT ACTION?**
   → Nicht "Buch lesen" sondern "Kapitel 1 lesen (20 Min)"
   → Nicht "Recherchieren" sondern "3 konkrete Optionen googlen und in Notiz speichern"
   → Der User muss SOFORT starten können, ohne nachzudenken

3. **WENDE DIE BESTE METHODE AN:**
   → Nutze dein Expertenwissen für die effektivste Strategie

# 🧠 EXPERTENWISSEN (automatisch anwenden!)

**Rhetorik/Kommunikation:**
- NICHT: "Buch über Rhetorik kaufen" (passiv, kein Fortschritt)
- SONDERN: "5 Min Rede zu beliebigem Thema aufnehmen + analysieren" (Deliberate Practice!)
- Micro-Skills isoliert üben: Blickkontakt, Pausen, Gestik
- Feedback-Loops sind ALLES: Aufnehmen → Analysieren → Verbessern

**Führerschein/Prüfungen:**
- NICHT: "Über Voraussetzungen informieren" (Prokrastination)
- SONDERN: "Fahrschule XY anrufen und Termin vereinbaren" (Immediate Action!)
- Theorie: Spaced Repetition Apps > passives Lesen

**Produkt/Business/Projekte:**
- NICHT: "Ideen brainstormen" (zu vage)
- SONDERN: "30 Min mit Claude: 5 Produktideen generieren und beste 2 auswählen" (konkret!)
- Prototyping > Perfektionismus
- Ship fast, iterate faster

**Fitness/Abnehmen:**
- NICHT: "Sport machen"
- SONDERN: "30 Min Krafttraining: Squats 4x8, Deadlifts 3x8, Bench 3x10"
- Krafttraining > Cardio (Grundumsatz!)
- Progressive Overload ist der Schlüssel

**Lernen/Skills:**
- NICHT: "Lernen" oder "Üben"
- SONDERN: "25 Min fokussiert: [spezifisches Thema] mit Active Recall"
- Pomodoro + Deliberate Practice = Optimal
- Aktiv üben > passiv konsumieren

**Finanzen:**
- NICHT: "Über Sparen nachdenken"
- SONDERN: "Dauerauftrag für 100€/Monat auf Sparkonto einrichten"
- Automatisieren > Willenskraft

# 👤 USER KONTEXT

Name: ${context.name}
Tag: ${dayOfWeek}, ${hour}:00 Uhr
Energie: ${checkinData.energy}/10 ${checkinData.energy <= 4 ? '(NIEDRIG - nur leichte Tasks!)' : checkinData.energy >= 8 ? '(HOCH - anspruchsvolle Tasks möglich!)' : ''}
Stimmung: ${checkinData.mood}/10
${checkinData.sleepHours ? `Schlaf: ${checkinData.sleepHours}h` : ''}

# USER KONTEXT

Name: ${context.name}
Tag: ${dayOfWeek}, ${hour}:00 Uhr
Energie heute: ${checkinData.energy}/10
Stimmung: ${checkinData.mood}/10
${checkinData.sleepHours ? `Schlaf: ${checkinData.sleepHours}h` : ''}

# DIE ZIELE DES USERS (MIT MEILENSTEINEN!)

${context.goals.map((g: any, i: number) => {
  const completedMilestones = g.milestones?.filter((m: any) => m.completed).length || 0;
  const totalMilestones = g.milestones?.length || 0;
  const nextMilestone = g.milestones?.find((m: any) => !m.completed);
  
  return `
ZIEL ${i + 1}: "${g.title}"
- Kategorie: ${g.category || 'Allgemein'}
- Fortschritt: ${g.current_value || 0}/${g.target_value || '?'}
- Deadline: ${g.deadline || 'Keine'}
- Warum wichtig: ${g.why_important || 'Nicht angegeben'}
- Beschreibung: ${g.description || 'Keine'}
${totalMilestones > 0 ? `- Meilensteine: ${completedMilestones}/${totalMilestones} erledigt` : ''}
${nextMilestone ? `- ⭐ NÄCHSTER MEILENSTEIN: "${nextMilestone.title}" ← FOKUSSIERE DARAUF!` : ''}
${g.milestones?.length > 0 ? `- Alle Meilensteine: ${g.milestones.map((m: any) => `${m.completed ? '✅' : '⬜'} ${m.title}`).join(', ')}` : ''}
`;
}).join('\n')}

# VERSCHOBENE TASKS (sollten Priorität haben)
${context.pendingTasks.length > 0
  ? context.pendingTasks.map(t => `- ${t.title} (${t.times_postponed}x verschoben)`).join('\n')
  : 'Keine'}

# ⚡ REGELN FÜR PERFEKTE TASKS

1. **MEILENSTEIN = TASK:** Wenn ein Meilenstein existiert → Task MUSS direkt darauf hinarbeiten!
   - Meilenstein: "Mit Claude Idee entwickeln" → Task: "30 Min Claude-Session: 5 Produktideen generieren"
   
2. **IMMEDIATE ACTION:** Der Task muss SOFORT startbar sein
   - ❌ "Recherchiere über X" (zu vage)
   - ✅ "Google: '3 beste Apps für X' und installiere die Top-bewertete"

3. **TIME-BOXED:** Jeder Task hat eine klare Zeitangabe (5-60 Min)
   - Bei Energie ${checkinData.energy}/10: ${checkinData.energy <= 4 ? 'Max 15-20 Min pro Task!' : checkinData.energy <= 6 ? '20-45 Min pro Task' : 'Bis zu 60-90 Min möglich'}

4. **AKTIV > PASSIV:** 
   - ❌ "Buch lesen" / "Video schauen" / "Informieren"
   - ✅ "Üben" / "Erstellen" / "Anrufen" / "Aufnehmen"

5. **KONKRET & MESSBAR:**
   - ❌ "Sport machen"
   - ✅ "30 Min Krafttraining: Squats 4x8, Deadlifts 3x8"

6. **REASON = WARUM EFFEKTIV:** Erkläre die Methode dahinter

# OUTPUT FORMAT (JSON)

KRITISCH: 
- Für JEDES der oben genannten Ziele MUSS ein Task erstellt werden
- "goal_title" MUSS EXAKT dem Titel des Ziels entsprechen (copy-paste!)
- Du MUSST alle ${context.goals.length} Ziele abdecken

Beispiel für Ziel "10kg abnehmen":
  {
  "goal_title": "10kg abnehmen",  // EXAKT wie oben!
  "title": "30 Min Krafttraining: Squats 3x10, Deadlifts 3x8",
  "priority": "high",
  "energy_required": "medium",
    "estimated_minutes": 30,
  "reason": "Krafttraining erhöht Grundumsatz und fördert Fettabbau"
  }

Gib NUR das JSON Array zurück:
[
  { "goal_title": "EXAKTER TITEL VON ZIEL 1", "title": "...", "priority": "...", "energy_required": "...", "estimated_minutes": ..., "reason": "..." },
  { "goal_title": "EXAKTER TITEL VON ZIEL 2", "title": "...", ... }
]
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Du bist ein Elite Performance Coach. Erstelle für JEDES Ziel einen optimalen Task. Antworte NUR mit validem JSON.' 
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    logger.info('AI Response:', content.substring(0, 500));
    
    // Parse JSON (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes('```')) {
      jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const tasks: GeneratedTask[] = JSON.parse(jsonStr);
    
    // Validate that goal_title is set for each task
    for (const task of tasks) {
      if (!task.goal_title) {
        logger.warn(`Task "${task.title}" has no goal_title, using default`);
        task.goal_title = 'Allgemein';
      }
    }
    
    logger.info(`Generated ${tasks.length} GOAL-FIRST tasks for user ${userId}:`, tasks.map(t => `${t.goal_title}: ${t.title}`));
    return tasks;

  } catch (error) {
    logger.error('Error generating daily tasks:', error);
    // Don't return default tasks - let UI handle empty array
    return [];
  }
}

// ============================================
// WORKING MODE TASKS (Bei der Arbeit/Baustelle)
// ============================================

function getWorkingModeTasks(energy: number): GeneratedTask[] {
  return [
    {
      title: '💧 Wasser trinken (500ml)',
      priority: 'medium',
      energy_required: 'low',
      estimated_minutes: 1,
      reason: 'Hydration verbessert Konzentration und Energie',
      goal_title: 'Gesundheit',
    },
    {
      title: '🚶 Kurze Bewegungspause (5 Min)',
      priority: 'low',
      energy_required: 'low',
      estimated_minutes: 5,
      reason: 'Bewegung nach langem Stehen/Sitzen reduziert Verspannungen',
      goal_title: 'Gesundheit',
    },
    {
      title: '🍎 Gesunden Snack essen',
      priority: 'low',
      energy_required: 'low',
      estimated_minutes: 5,
      reason: 'Stabiler Blutzucker = konstante Energie',
      goal_title: 'Gesundheit',
    },
  ];
}

// ============================================
// RECOVERY MODE TASKS
// ============================================

function getRecoveryTasks(): GeneratedTask[] {
  return [
    {
      title: '😴 20 Min Power Nap oder Ruhe',
      priority: 'high',
      energy_required: 'low',
      estimated_minutes: 20,
      reason: 'Recovery ist produktiv - Körper braucht Erholung',
      goal_title: 'Recovery',
    },
    {
      title: '🚶 15 Min leichter Spaziergang',
      priority: 'medium',
      energy_required: 'low',
      estimated_minutes: 15,
      reason: 'Leichte Bewegung kann Energie wiederherstellen',
      goal_title: 'Recovery',
    },
    {
      title: '📵 Digital Detox (30 Min)',
      priority: 'low',
      energy_required: 'low',
      estimated_minutes: 30,
      reason: 'Bildschirmpause reduziert mentale Erschöpfung',
      goal_title: 'Recovery',
    },
  ];
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
Du bist ein ELITE Coach. Leite aus diesen Zielen die EFFEKTIVSTEN Tasks für HEUTE ab.

# DEIN WISSEN (automatisch anwenden)

- Health: Krafttraining > Cardio, Protein wichtig, NEAT, Schlaf, moderate Defizite
- Produktivität: Deep Work, Eat the Frog, Pareto 80/20, Time Blocking
- Finanzen: Automatisieren, Einnahmen erhöhen, 50/30/20
- Lernen: Active Recall, Spaced Repetition, Feynman
- Habits: Implementation Intentions, Habit Stacking, 2-Min Regel

# ZIELE
${goals.map(g => `
- ${g.title}
  Kategorie: ${g.category || 'Allgemein'}
  Beschreibung: ${g.description || 'Keine'}
  Why: ${g.why_important || 'Nicht angegeben'}
  Fortschritt: ${g.current_value || 0}/${g.target_value || '?'}
  Deadline: ${g.deadline || 'Keine'}
`).join('\n')}

# REGELN
1. Pro Ziel 1-2 HIGH-IMPACT Tasks
2. Tasks müssen HEUTE machbar sein
3. Konkret & spezifisch (nicht "Sport" sondern "30 Min Krafttraining: Squats, Deadlifts")
4. Wähle die WISSENSCHAFTLICH BESTE Methode für jedes Ziel
5. Berücksichtige Deadlines - dringend = höhere Priorität

# OUTPUT FORMAT (JSON Array)
[
  {
    "title": "Konkreter, spezifischer Task",
    "priority": "high" | "medium" | "low",
    "energy_required": "medium",
    "estimated_minutes": 30,
    "reason": "Warum dieser Task effektiv ist + Methode dahinter"
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

