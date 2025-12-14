// ============================================
// PEAK COACH - Coach AI Service (Smart Version)
// ============================================

import OpenAI from 'openai';
import { supabase } from './supabase';
import { formatDate, getWeekStart, getGreeting, getDayOfWeek } from '../utils/helpers';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// COACHING KNOWLEDGE BASE (Smart System Prompt)
// ============================================

const COACHING_KNOWLEDGE = `
# COACHING-WISSEN & PRINZIPIEN

Du bist ein Elite Peak Performance Coach. Du kennst und wendest diese evidenzbasierten Prinzipien an:

## 🔬 VERHALTENSPSYCHOLOGIE

### Atomic Habits (James Clear)
- **1% Regel:** Kleine tägliche Verbesserungen führen zu massiven Ergebnissen
- **Habit Stacking:** "Nach [AKTUELLE GEWOHNHEIT] mache ich [NEUE GEWOHNHEIT]"
- **2-Minuten-Regel:** Jede Gewohnheit auf 2 Minuten reduzieren zum Starten
- **Environment Design:** Umgebung so gestalten, dass gutes Verhalten einfach ist
- **Identitätsbasierte Habits:** "Ich BIN ein Sportler" statt "Ich will trainieren"

### Implementation Intentions (Gollwitzer)
- "WENN [Situation], DANN [Verhalten]"
- 2-3x höhere Erfolgsrate als einfache Absichten
- Konkret und spezifisch formulieren

### WOOP Methode (Oettingen)
- **W**ish: Was willst du erreichen?
- **O**utcome: Wie fühlt sich der Erfolg an?
- **O**bstacle: Was könnte dich stoppen?
- **P**lan: Wenn Obstacle, dann [Lösung]

### Temptation Bundling (Milkman)
- Verknüpfe etwas das du WILLST mit etwas das du SOLLST
- Beispiel: Netflix NUR während Training

## 🧠 KOGNITIVE PRINZIPIEN

### Loss Aversion (Kahneman)
- Menschen fürchten Verluste mehr als sie Gewinne schätzen
- "Du VERLIERST deinen 23-Tage-Streak" ist stärker als "Mach weiter!"

### Zeigarnik-Effekt
- Unvollendete Aufgaben bleiben im Kopf
- Nutze: "Du hast 3/5 Tasks erledigt - nur noch 2!"

### Endowed Progress Effect
- Gefühlter Fortschritt motiviert
- Starte bei 20% statt 0% wenn möglich

### Fresh Start Effect
- Montag, Neujahr, Geburtstag = perfekte Neustart-Momente
- Nutze diese natürlichen Übergänge

### Peak-End Rule
- Menschen erinnern sich an den Höhepunkt und das Ende
- Beende jeden Tag/Review IMMER positiv

## ⚡ PRODUKTIVITÄT

### Deep Work (Cal Newport)
- 90-Minuten Blöcke für fokussierte Arbeit
- Keine Ablenkungen, kein Multitasking
- Shallow Work auf Low-Energy-Zeiten legen

### Parkinson's Law
- Arbeit dehnt sich auf die verfügbare Zeit aus
- Setze kürzere Deadlines

### Eat the Frog
- Wichtigste/schwerste Aufgabe ZUERST am Tag
- Willenskraft ist morgens am höchsten

### Eisenhower Matrix
- Wichtig + Dringend: Sofort machen
- Wichtig + Nicht dringend: Planen
- Unwichtig + Dringend: Delegieren
- Unwichtig + Nicht dringend: Eliminieren

## 💪 ENERGIE & PERFORMANCE

### Chronobiologie
- Early Birds: Peak 9-12 Uhr
- Night Owls: Peak 16-20 Uhr
- Deep Work in Peak-Zeiten

### Energy Management
- Energie ist wichtiger als Zeit
- Pausen sind produktiv
- 52-17 Regel: 52 Min Arbeit, 17 Min Pause

### Sleep
- 7-9 Stunden optimal
- Schlafqualität > Quantität
- Gleiche Schlafenszeit wichtiger als Schlafdauer

## 🎯 ZIELSETZUNG

### SMART Goals
- Specific, Measurable, Achievable, Relevant, Time-bound

### Anti-Goals (Inversion)
- "Was will ich VERMEIDEN?"
- Oft stärker motivierend als positive Ziele

### Process vs. Outcome Goals
- Process: "Ich schreibe jeden Tag 30 Minuten"
- Outcome: "Ich schreibe ein Buch"
- Process Goals sind kontrollierbarer

## 🔥 MOTIVATION & ACCOUNTABILITY

### Self-Determination Theory
- Autonomie: Eigene Wahl
- Kompetenz: Fortschritt sehen
- Verbundenheit: Soziale Einbindung

### Variable Rewards
- Unvorhersehbare Belohnungen sind am motivierendsten
- Gelegentliche Überraschungen > konstante Belohnungen

### Social Proof
- "847 andere User haben heute schon trainiert"
- Menschen folgen anderen

### Commitment & Consistency
- Öffentliche Commitments erhöhen Erfolgsrate
- Kleine Zusagen führen zu größeren

## 🛡️ RÜCKSCHLÄGE & RESILIENZ

### Self-Compassion
- Bei Misserfolg: Freundlich zu sich selbst
- Selbstkritik schadet langfristig

### Streak Saver
- Ein verpasster Tag ruiniert nicht alles
- "Nie 2x hintereinander" statt "Nie verpassen"

### Growth Mindset
- Fehler = Lernchance
- Fähigkeiten sind entwickelbar

## 📊 REFLEXION & LERNEN

### Kaizen
- Kontinuierliche kleine Verbesserungen
- Täglich fragen: "Was kann ich 1% verbessern?"

### After Action Review
- Was sollte passieren?
- Was ist passiert?
- Warum der Unterschied?
- Was lerne ich daraus?

### Decision Journal
- Entscheidungen dokumentieren + später reviewen
- Verbessert Entscheidungsqualität
`;

// ============================================
// COACH STYLES
// ============================================

const COACH_STYLES = {
  tough: {
    description: 'Direkt, fordernd, keine Ausreden',
    tone: `
      - Sei direkt und konfrontativ (aber respektvoll)
      - Akzeptiere keine Ausreden
      - Push den User aus der Komfortzone
      - "Keine Zeit" ist keine Ausrede
      - Halte den User an seine eigenen Standards
    `,
  },
  gentle: {
    description: 'Einfühlsam, unterstützend, verständnisvoll',
    tone: `
      - Sei warmherzig und verständnisvoll
      - Erkenne Struggles an
      - Feiere auch kleine Wins
      - Druck rausnehmen wenn nötig
      - Selbstmitgefühl fördern
    `,
  },
  balanced: {
    description: 'Ausgewogen zwischen fordernd und unterstützend',
    tone: `
      - Sei direkt aber empathisch
      - Fordere und unterstütze gleichzeitig
      - Passe den Ton an die Situation an
      - Bei Erfolg: Feiern
      - Bei Struggle: Verstehen + Lösung
    `,
  },
};

// ============================================
// INTERFACES
// ============================================

interface CheckinData {
  type: 'morning' | 'evening';
  mood?: number;
  energy?: number;
  sleepHours?: number;
  sleepQuality?: number;
}

interface UserContext {
  name: string;
  coachStyle: string;
  chronotype: string;
  recentLogs: any[];
  todaysTasks: any[];
  activeGoals: any[];
  currentStreaks: any[];
  todayStatus: {
    dayType: string;
    workStatus: string;
    isGraceDay: boolean;
  } | null;
  calculatedIntensity: number; // 1-10, AI-calculated
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getUserContext(userId: string): Promise<UserContext> {
  // Get user + profile
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();

  const { data: profile } = await supabase
    .from('user_profile')
    .select('coach_style, chronotype')
    .eq('user_id', userId)
    .single();

  // Get recent logs (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data: recentLogs } = await supabase
    .from('daily_logs')
    .select('date, morning_mood, morning_energy, sleep_hours, tasks_completed, tasks_planned')
    .eq('user_id', userId)
    .gte('date', formatDate(weekAgo))
    .order('date', { ascending: false });

  // Get today's tasks
  const today = formatDate(new Date());
  const { data: todaysTasks } = await supabase
    .from('tasks')
    .select('title, priority, status')
    .eq('user_id', userId)
    .eq('scheduled_date', today);

  // Get active goals
  const { data: activeGoals } = await supabase
    .from('goals')
    .select('title, current_value, target_value, deadline')
    .eq('user_id', userId)
    .eq('status', 'active');

  // Get habits with streaks
  const { data: habits } = await supabase
    .from('habits')
    .select('name, current_streak')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('current_streak', 0);

  // Get today's work status
  let todayStatus = null;
  try {
    const { data: status } = await supabase.rpc('get_today_status', { p_user_id: userId });
    if (status) {
      todayStatus = {
        dayType: status.day_type || 'normal',
        workStatus: status.work_status || 'not_started',
        isGraceDay: status.is_grace_day || false,
      };
    }
  } catch { /* ignore */ }

  // Calculate optimal intensity (1-10)
  const calculatedIntensity = calculateIntensity({
    recentLogs: recentLogs || [],
    todayLog: (recentLogs || []).find(l => l.date === today),
    dayType: todayStatus?.dayType || 'normal',
    isGraceDay: todayStatus?.isGraceDay || false,
    activeGoals: activeGoals || [],
    pendingTasks: (todaysTasks || []).filter(t => t.status === 'pending').length,
  });

  return {
    name: user?.name || 'Champion',
    coachStyle: profile?.coach_style || 'balanced',
    chronotype: profile?.chronotype || 'neutral',
    recentLogs: recentLogs || [],
    todaysTasks: todaysTasks || [],
    activeGoals: activeGoals || [],
    currentStreaks: habits || [],
    todayStatus,
    calculatedIntensity,
  };
}

// ============================================
// INTENSITY CALCULATION (AI-driven)
// ============================================

interface IntensityFactors {
  recentLogs: any[];
  todayLog: any;
  dayType: string;
  isGraceDay: boolean;
  activeGoals: any[];
  pendingTasks: number;
}

function calculateIntensity(factors: IntensityFactors): number {
  let intensity = 6; // Default: slightly above middle

  // 1. Day Type modifier
  const dayTypeModifiers: Record<string, number> = {
    'normal': 0,
    'montage': -1,      // Field work = less mental tasks
    'recovery': -3,     // Take it easy
    'urlaub': -5,       // Vacation mode
    'krank': -5,        // Sick = minimal
  };
  intensity += dayTypeModifiers[factors.dayType] || 0;

  // 2. Grace Day = automatic low
  if (factors.isGraceDay) {
    return Math.min(intensity, 3);
  }

  // 3. Today's check-in data
  if (factors.todayLog) {
    const energy = factors.todayLog.morning_energy || 5;
    const mood = factors.todayLog.morning_mood || 5;
    const sleep = factors.todayLog.sleep_hours || 7;

    // Energy impact (-2 to +2)
    if (energy <= 3) intensity -= 2;
    else if (energy <= 5) intensity -= 1;
    else if (energy >= 8) intensity += 1;
    else if (energy >= 9) intensity += 2;

    // Mood impact (-1 to +1)
    if (mood <= 3) intensity -= 1;
    else if (mood >= 8) intensity += 1;

    // Sleep impact (-2 to +1)
    if (sleep < 5) intensity -= 2;
    else if (sleep < 6) intensity -= 1;
    else if (sleep >= 7.5) intensity += 1;
  }

  // 4. Recent days pattern (burnout detection)
  if (factors.recentLogs.length >= 3) {
    const last3 = factors.recentLogs.slice(0, 3);
    const avgEnergy = last3.reduce((a, b) => a + (b.morning_energy || 5), 0) / 3;
    
    // Consistently low energy = reduce intensity
    if (avgEnergy < 5) intensity -= 1;
  }

  // 5. Deadline pressure (boost if needed)
  const urgentGoals = factors.activeGoals.filter(g => {
    if (!g.deadline) return false;
    const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
    return daysLeft > 0 && daysLeft <= 3;
  });
  
  if (urgentGoals.length > 0) {
    intensity += 1; // Slight push for deadlines
  }

  // 6. Task load (don't overwhelm)
  if (factors.pendingTasks > 8) {
    intensity -= 1; // Already loaded, don't push more
  }

  // Clamp to 1-10
  return Math.max(1, Math.min(10, Math.round(intensity)));
}

function getIntensityDescription(level: number): string {
  if (level <= 2) return '(Recovery-Modus)';
  if (level <= 4) return '(Sanfter Tag)';
  if (level <= 6) return '(Normaler Tag)';
  if (level <= 8) return '(Produktiver Tag)';
  return '(Maximum Push!)';
}

// Export for use in other modules
export { calculateIntensity, getIntensityDescription };

function buildSystemPrompt(context: UserContext): string {
  const style = COACH_STYLES[context.coachStyle as keyof typeof COACH_STYLES] || COACH_STYLES.balanced;
  
  return `
${COACHING_KNOWLEDGE}

# DEINE ROLLE

Du bist der persönliche Peak Performance Coach von ${context.name}.
Dein Stil: ${style.description}

${style.tone}

# WICHTIGE REGELN

1. **Sprache:** Deutsch, Du-Form, natürlich und direkt
2. **Länge:** Kurz und prägnant (max 3-4 Sätze für normale Nachrichten)
3. **Personalisierung:** Beziehe dich auf die Daten des Users
4. **Actionable:** Gib konkrete, umsetzbare Empfehlungen
5. **Kontext-aware:** Berücksichtige Tageszeit, Energie, Mood
6. **Prinzipien:** Wende das Coaching-Wissen situationsgerecht an
7. **Keine Emojis übertreiben:** Max 1-2 pro Nachricht

# USER KONTEXT

- Chronotyp: ${context.chronotype === 'early_bird' ? 'Frühaufsteher' : context.chronotype === 'night_owl' ? 'Nachteule' : 'Neutral'}
- Aktive Streaks: ${context.currentStreaks.length > 0 ? context.currentStreaks.map(h => `${h.name} (${h.current_streak} Tage)`).join(', ') : 'Keine'}
- Heutige Tasks: ${context.todaysTasks.length} (${context.todaysTasks.filter(t => t.status === 'completed').length} erledigt)
- Aktive Ziele: ${context.activeGoals.length > 0 ? context.activeGoals.map(g => g.title).join(', ') : 'Keine'}

# HEUTIGER TAG

- Tagestyp: ${context.todayStatus?.dayType || 'normal'}
- Status: ${context.todayStatus?.workStatus || 'nicht gestartet'}
- Grace Day: ${context.todayStatus?.isGraceDay ? 'JA - Heute ist Scheitern okay!' : 'Nein'}
- **INTENSITY LEVEL: ${context.calculatedIntensity}/10** ${getIntensityDescription(context.calculatedIntensity)}

WICHTIG: Passe deinen Push-Level an die Intensity an!
- 1-3: Sehr sanft, minimale Anforderungen, Selbstfürsorge betonen
- 4-6: Normal, ausgewogen zwischen Push und Support
- 7-8: Fordernd, klare Erwartungen, Accountability
- 9-10: Maximum Push, keine Ausreden, volle Leistung fordern

# LETZTE 7 TAGE
${context.recentLogs.length > 0 ? context.recentLogs.map(log => 
  `- ${log.date}: Mood ${log.morning_mood || '?'}/10, Energie ${log.morning_energy || '?'}/10, Schlaf ${log.sleep_hours || '?'}h`
).join('\n') : 'Keine Daten'}
`;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

export async function generateCoachMessage(
  userId: string,
  messageType: 'morning' | 'evening' | 'intervention',
  checkinData?: CheckinData
): Promise<string> {
  try {
    const context = await getUserContext(userId);
    const systemPrompt = buildSystemPrompt(context);
    
    const hour = new Date().getHours();
    const dayOfWeek = getDayOfWeek();

    let userPrompt = '';

    if (messageType === 'morning' && checkinData) {
      // Calculate averages for comparison
      const avgSleep = context.recentLogs.length > 0 
        ? (context.recentLogs.reduce((a, b) => a + (b.sleep_hours || 0), 0) / context.recentLogs.length).toFixed(1)
        : null;
      const avgMood = context.recentLogs.length > 0
        ? (context.recentLogs.reduce((a, b) => a + (b.morning_mood || 0), 0) / context.recentLogs.length).toFixed(1)
        : null;

      userPrompt = `
Erstelle eine Morning Message für ${context.name}.

AKTUELLE DATEN:
- Heute ist ${dayOfWeek}
- Schlaf: ${checkinData.sleepHours}h (Qualität: ${checkinData.sleepQuality}/10)
- Energie: ${checkinData.energy}/10
- Stimmung: ${checkinData.mood}/10
${avgSleep ? `- Schlaf-Durchschnitt letzte Woche: ${avgSleep}h` : ''}
${avgMood ? `- Mood-Durchschnitt letzte Woche: ${avgMood}/10` : ''}

HEUTIGE TASKS (${context.todaysTasks.length}):
${context.todaysTasks.length > 0 ? context.todaysTasks.map(t => `- ${t.title} [${t.priority}]`).join('\n') : 'Keine Tasks geplant'}

STREAKS ZU SCHÜTZEN:
${context.currentStreaks.length > 0 ? context.currentStreaks.map(h => `- ${h.name}: ${h.current_streak} Tage 🔥`).join('\n') : 'Keine aktiven Streaks'}

AUFGABE:
Erstelle eine kurze, personalisierte Morning Message (max 4 Sätze) die:
1. Die aktuellen Daten berücksichtigt
2. Den wichtigsten Fokus für heute hervorhebt
3. Ein relevantes Coaching-Prinzip subtil einbaut
4. Motivierend oder supportiv ist (je nach Daten)
`;
    } else if (messageType === 'evening') {
      userPrompt = `
Erstelle eine Abend-Reflexions-Nachricht für ${context.name}.

AUFGABE:
Erstelle eine kurze, reflektierende Nachricht (max 3 Sätze) die:
1. Den Tag positiv abschließt (Peak-End Rule)
2. Eine Reflexionsfrage stellt ODER einen Erfolg anerkennt
3. Auf morgen vorbereitet
`;
    } else {
      // Intervention/Motivation
      userPrompt = `
Erstelle eine motivierende Intervention für ${context.name}.

KONTEXT:
- Aktuelle Uhrzeit: ${hour}:00
- Streaks zu schützen: ${context.currentStreaks.length}
- Offene Tasks heute: ${context.todaysTasks.filter(t => t.status === 'pending').length}

AUFGABE:
Erstelle eine kurze, kraftvolle Motivations-Nachricht (max 3 Sätze) die:
1. Einen relevanten Coaching-Prinzip nutzt
2. Konkret und actionable ist
3. Zum User-Kontext passt
`;
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || getDefaultMessage(messageType);
  } catch (error) {
    logger.error('Error generating coach message:', error);
    return getDefaultMessage(messageType);
  }
}

export async function chatWithCoach(
  userId: string,
  userMessage: string
): Promise<string> {
  try {
    const context = await getUserContext(userId);
    const systemPrompt = buildSystemPrompt(context);

    // Get RAG context (knowledge + learnings)
    let ragContext = '';
    try {
      const { getRAGContext, extractAndSaveKnowledge } = await import('./rag');
      ragContext = await getRAGContext(userId, userMessage);
      
      // Extract knowledge from conversation (async, don't wait)
      extractAndSaveKnowledge(userId, `User: ${userMessage}`).catch(() => {});
    } catch {
      // RAG not available, continue without
    }

    const fullSystemPrompt = ragContext 
      ? `${systemPrompt}\n\n${ragContext}`
      : systemPrompt;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || 'Hmm, da bin ich mir nicht sicher. Kannst du das anders formulieren?';

    // Extract knowledge from coach's response too
    try {
      const { extractAndSaveKnowledge } = await import('./rag');
      extractAndSaveKnowledge(userId, `User: ${userMessage}\nCoach: ${reply}`).catch(() => {});
    } catch {
      // Ignore
    }

    return reply;
  } catch (error) {
    logger.error('Error in coach chat:', error);
    return 'Es gab einen Fehler. Bitte versuche es nochmal.';
  }
}

function getDefaultMessage(type: string): string {
  const defaults: Record<string, string> = {
    morning: 'Guten Morgen! Lass uns den Tag rocken. Was ist dein wichtigstes Ziel heute?',
    evening: 'Gute Arbeit heute! Was war dein größter Win?',
    intervention: 'Hey, kurzer Check: Wie läuft dein Tag? Brauchst du Support?',
  };
  return defaults[type] || 'Lass uns das Beste aus dem Tag machen! 💪';
}

// ============================================
// PROACTIVE INSIGHTS (Pattern Detection)
// ============================================

interface InsightResult {
  type: 'warning' | 'celebration' | 'suggestion' | 'streak_risk';
  message: string;
  priority: number; // 1-10, higher = more important
}

export async function getProactiveInsight(userId: string): Promise<InsightResult | null> {
  try {
    const context = await getUserContext(userId);
    const insights: InsightResult[] = [];

    // 1. Streak at Risk (highest priority)
    const streaksAtRisk = context.currentStreaks.filter(h => h.current_streak >= 7);
    if (streaksAtRisk.length > 0) {
      const biggestStreak = streaksAtRisk.reduce((a, b) => 
        a.current_streak > b.current_streak ? a : b
      );
      insights.push({
        type: 'streak_risk',
        message: `🔥 Dein ${biggestStreak.name}-Streak (${biggestStreak.current_streak} Tage) ist in Gefahr! Nicht vergessen heute.`,
        priority: 9,
      });
    }

    // 2. Low energy/mood pattern (last 3 days)
    if (context.recentLogs.length >= 3) {
      const last3 = context.recentLogs.slice(0, 3);
      const avgMood = last3.reduce((a, b) => a + (b.morning_mood || 5), 0) / 3;
      const avgEnergy = last3.reduce((a, b) => a + (b.morning_energy || 5), 0) / 3;
      
      if (avgMood < 5 || avgEnergy < 5) {
        insights.push({
          type: 'warning',
          message: `📊 Deine Energie/Stimmung war in den letzten Tagen niedrig. Brauchst du einen Recovery Day?`,
          priority: 7,
        });
      }
    }

    // 3. Sleep deficit
    if (context.recentLogs.length >= 3) {
      const last3 = context.recentLogs.slice(0, 3);
      const avgSleep = last3.reduce((a, b) => a + (b.sleep_hours || 7), 0) / 3;
      
      if (avgSleep < 6.5) {
        insights.push({
          type: 'warning',
          message: `😴 Schlafdefizit erkannt (Ø ${avgSleep.toFixed(1)}h). Dein Ziel: 7.5h. Heute früher ins Bett?`,
          priority: 8,
        });
      }
    }

    // 4. Goal deadline approaching
    const upcomingDeadlines = context.activeGoals.filter(g => {
      if (!g.deadline) return false;
      const days = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
      return days > 0 && days <= 3;
    });
    
    if (upcomingDeadlines.length > 0) {
      const urgent = upcomingDeadlines[0];
      const daysLeft = Math.ceil((new Date(urgent.deadline).getTime() - Date.now()) / 86400000);
      insights.push({
        type: 'warning',
        message: `⏰ "${urgent.title}" Deadline in ${daysLeft} Tag(en)! Fokus-Zeit einplanen?`,
        priority: 8,
      });
    }

    // 5. Task completion celebration
    const todayCompleted = context.todaysTasks.filter(t => t.status === 'completed').length;
    const todayTotal = context.todaysTasks.length;
    
    if (todayTotal >= 3 && todayCompleted === todayTotal) {
      insights.push({
        type: 'celebration',
        message: `🎉 Alle ${todayTotal} Tasks erledigt! Du bist heute on fire!`,
        priority: 6,
      });
    } else if (todayTotal >= 5 && todayCompleted >= todayTotal * 0.8) {
      insights.push({
        type: 'celebration',
        message: `💪 ${todayCompleted}/${todayTotal} Tasks erledigt - starke Leistung!`,
        priority: 5,
      });
    }

    // 6. Midday nudge (if tasks pending)
    const hour = new Date().getHours();
    const pendingTasks = context.todaysTasks.filter(t => t.status === 'pending');
    
    if (hour >= 14 && hour <= 16 && pendingTasks.length > 0) {
      const highPriority = pendingTasks.filter(t => t.priority === 'high');
      if (highPriority.length > 0) {
        insights.push({
          type: 'suggestion',
          message: `⚡ Noch ${highPriority.length} wichtige Task(s) offen. Afternoon Push?`,
          priority: 6,
        });
      }
    }

    // Return highest priority insight
    if (insights.length === 0) return null;
    
    insights.sort((a, b) => b.priority - a.priority);
    return insights[0];
  } catch (error) {
    logger.error('Error getting proactive insight:', error);
    return null;
  }
}

export async function generateInsightMessage(userId: string, insight: InsightResult): Promise<string> {
  try {
    const context = await getUserContext(userId);
    const systemPrompt = buildSystemPrompt(context);

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `
Erstelle eine kurze, proaktive Coach-Nachricht basierend auf diesem Insight:

INSIGHT: ${insight.message}
TYPE: ${insight.type}

AUFGABE:
- Erweitere diesen Insight zu 2-3 Sätzen
- Gib einen konkreten Handlungsvorschlag
- Nutze passenden Coaching-Prinzipien
- Bleib kurz und actionable
`
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || insight.message;
  } catch {
    return insight.message;
  }
}
