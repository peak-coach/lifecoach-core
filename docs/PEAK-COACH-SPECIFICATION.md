
# 🏆 PEAK PERFORMANCE COACH - Technische Spezifikation

> **Version:** 1.0.0  
> **Status:** Ready for Development  
> **Erstellt:** Dezember 2025  
> **Ziel:** Der beste Life-Coach der Welt

---

## 📋 Inhaltsverzeichnis

1. [Vision & Ziele](#1-vision--ziele)
2. [Architektur Übersicht](#2-architektur-übersicht)
3. [Tech Stack](#3-tech-stack)
4. [Datenbank Schema (Supabase)](#4-datenbank-schema-supabase)
5. [Telegram Bot](#5-telegram-bot)
6. [Web App (PWA)](#6-web-app-pwa)
7. [n8n Workflows](#7-n8n-workflows)
8. [Coach AI Logik](#8-coach-ai-logik)
9. [Accountability System](#9-accountability-system)
10. [API Endpunkte](#10-api-endpunkte)
11. [Deployment](#11-deployment)
12. [Roadmap](#12-roadmap)

---

## 1. Vision & Ziele

### 1.1 Was wir bauen

Ein **KI-gestützter Peak Performance Coach**, der:

- 🎯 **Personalisiert:** Kennt dich, deine Ziele, Stärken, Schwächen
- 🧠 **Intelligent:** Erkennt Muster, gibt proaktive Empfehlungen
- 💪 **Accountable:** Lässt sich nicht ignorieren
- 📊 **Datengetrieben:** Trackt alles, zeigt Trends
- 🏋️ **Holistisch:** Life + Performance + Health

### 1.2 Kernfunktionen

| Funktion | Beschreibung |
|----------|--------------|
| **Morning Planning** | Tagesplan basierend auf Energie, Prioritäten, Zielen |
| **Task Management** | Tasks tracken, erledigen, überspringen |
| **Evening Review** | Tagesreflexion, Mood, Learnings |
| **Goal Tracking** | Langfristige Ziele → Fortschritt |
| **Habit/Streak Tracking** | Gewohnheiten aufbauen |
| **Pattern Recognition** | Muster erkennen, Interventionen |
| **Energy Management** | Tasks nach Energie-Level planen |
| **Accountability** | Financial Stakes, Social Pressure |

### 1.3 Unique Selling Points

```
Was diesen Coach zum BESTEN macht:

1. PROAKTIV - Wartet nicht, bis du fragst
2. UNIGNORIERBAR - Multi-Layer Accountability
3. PERSONALISIERT - Lernt was bei DIR funktioniert
4. HOLISTISCH - Nicht nur Tasks, sondern Leben
5. DATENGETRIEBEN - Entscheidungen basieren auf DEINEN Daten
```

---

## 2. Architektur Übersicht

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PEAK PERFORMANCE COACH                          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        USER INTERFACES                            │  │
│  │                                                                   │  │
│  │   ┌─────────────────┐          ┌─────────────────┐               │  │
│  │   │  TELEGRAM BOT   │          │    WEB APP      │               │  │
│  │   │                 │          │     (PWA)       │               │  │
│  │   │ • Quick Actions │          │ • Dashboard     │               │  │
│  │   │ • Check-ins     │          │ • Analytics     │               │  │
│  │   │ • Notifications │          │ • Settings      │               │  │
│  │   │ • Coach Chat    │          │ • Deep Dives    │               │  │
│  │   └────────┬────────┘          └────────┬────────┘               │  │
│  │            │                            │                         │  │
│  └────────────┼────────────────────────────┼─────────────────────────┘  │
│               │                            │                            │
│               └──────────────┬─────────────┘                            │
│                              │                                          │
│  ┌───────────────────────────┼──────────────────────────────────────┐  │
│  │                           ▼                                       │  │
│  │                      API LAYER                                    │  │
│  │              (Next.js API Routes / Edge)                          │  │
│  │                                                                   │  │
│  │   /api/checkin    /api/tasks    /api/coach    /api/stats         │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
│                              │                                          │
│               ┌──────────────┼──────────────┐                          │
│               │              │              │                          │
│               ▼              ▼              ▼                          │
│  ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐              │
│  │    SUPABASE     │ │     n8n     │ │    OPENAI       │              │
│  │                 │ │             │ │                 │              │
│  │ • Database      │ │ • Cron Jobs │ │ • Coach Brain   │              │
│  │ • Auth          │ │ • Workflows │ │ • Analysis      │              │
│  │ • Realtime      │ │ • Triggers  │ │ • Patterns      │              │
│  │ • Storage       │ │ • LLM Calls │ │                 │              │
│  └─────────────────┘ └─────────────┘ └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### 3.1 Frontend

| Technologie | Zweck | Version |
|-------------|-------|---------|
| **Next.js** | Web Framework | 14.x |
| **React** | UI Library | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **TailwindCSS** | Styling | 3.x |
| **Shadcn/UI** | Component Library | Latest |
| **Framer Motion** | Animations | 10.x |
| **Recharts** | Charts | 2.x |
| **next-pwa** | PWA Support | 5.x |

### 3.2 Backend

| Technologie | Zweck | Version |
|-------------|-------|---------|
| **Supabase** | Database + Auth + Realtime | Latest |
| **n8n** | Workflow Automation | Self-hosted |
| **OpenAI** | LLM (GPT-4o) | API |
| **grammy** | Telegram Bot Framework | 1.x |

### 3.3 Infrastructure

| Technologie | Zweck |
|-------------|-------|
| **Hetzner VPS** | Hosting (n8n, Bot) |
| **Vercel** | Web App Hosting (oder Self-hosted) |
| **Docker** | Container für n8n |
| **GitHub** | Version Control |

---

## 4. Datenbank Schema (Supabase)

### 4.1 Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE SCHEMA                            │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   users     │    │   goals     │    │   tasks     │         │
│  │             │◄───│             │◄───│             │         │
│  │ • id        │    │ • user_id   │    │ • goal_id   │         │
│  │ • profile   │    │ • title     │    │ • title     │         │
│  │ • settings  │    │ • progress  │    │ • status    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                                     │                 │
│         │           ┌─────────────┐           │                 │
│         │           │  daily_logs │           │                 │
│         └──────────►│             │◄──────────┘                 │
│                     │ • mood      │                             │
│                     │ • energy    │                             │
│                     │ • tasks_done│                             │
│                     └─────────────┘                             │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                │
│         ▼                  ▼                  ▼                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   habits    │    │  learnings  │    │  decisions  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Tabellen Detail

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  timezone TEXT DEFAULT 'Europe/Berlin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_profile
```sql
CREATE TABLE user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Persönlichkeit
  chronotype TEXT, -- 'early_bird', 'night_owl', 'neutral'
  personality_type TEXT, -- MBTI etc.
  learning_style TEXT,
  
  -- Präferenzen
  work_hours_start TIME DEFAULT '09:00',
  work_hours_end TIME DEFAULT '18:00',
  deep_work_duration_min INT DEFAULT 90,
  
  -- Motivatoren
  motivators JSONB DEFAULT '[]',
  demotivators JSONB DEFAULT '[]',
  
  -- Coach Settings
  coach_style TEXT DEFAULT 'balanced', -- 'tough', 'gentle', 'balanced'
  notification_frequency TEXT DEFAULT 'normal',
  
  -- Streaks & Gamification
  current_level INT DEFAULT 1,
  total_xp INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### goals
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'career', 'health', 'learning', 'finance', 'relationships'
  
  -- Progress
  target_value DECIMAL,
  current_value DECIMAL DEFAULT 0,
  unit TEXT, -- 'percent', 'hours', 'count', etc.
  progress_percent INT GENERATED ALWAYS AS (
    CASE WHEN target_value > 0 
    THEN LEAST(100, (current_value / target_value * 100)::INT)
    ELSE 0 END
  ) STORED,
  
  -- Timing
  deadline DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused', 'abandoned'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  estimated_minutes INT,
  
  -- Categorization
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  energy_required TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  category TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped', 'postponed'
  completed_at TIMESTAMPTZ,
  
  -- Tracking
  times_postponed INT DEFAULT 0,
  skip_reason TEXT,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### daily_logs
```sql
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Morning Check-in
  morning_mood INT CHECK (morning_mood BETWEEN 1 AND 10),
  morning_energy INT CHECK (morning_energy BETWEEN 1 AND 10),
  sleep_hours DECIMAL,
  sleep_quality INT CHECK (sleep_quality BETWEEN 1 AND 10),
  morning_notes TEXT,
  
  -- Evening Review
  evening_mood INT CHECK (evening_mood BETWEEN 1 AND 10),
  evening_energy INT CHECK (evening_energy BETWEEN 1 AND 10),
  
  -- Reflection
  wins TEXT[], -- Array of wins
  struggles TEXT[], -- Array of struggles
  grateful_for TEXT[], -- Array of gratitude items
  learnings TEXT,
  tomorrow_focus TEXT,
  
  -- Stats (computed)
  tasks_planned INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_skipped INT DEFAULT 0,
  productivity_score INT, -- Calculated
  
  -- Coach
  coach_morning_message TEXT,
  coach_evening_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);
```

#### habits
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'health', 'productivity', 'mindset', 'social'
  
  -- Frequency
  frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'specific_days'
  target_days TEXT[], -- ['monday', 'wednesday', 'friday'] for specific_days
  
  -- Tracking
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  total_completions INT DEFAULT 0,
  
  -- Timing
  preferred_time TIME,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### habit_logs
```sql
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(habit_id, date)
);
```

#### learnings
```sql
CREATE TABLE learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  
  category TEXT, -- 'productivity', 'health', 'mindset', 'technical', 'life'
  what_worked TEXT,
  what_didnt TEXT,
  key_insight TEXT NOT NULL,
  apply_to TEXT[], -- Tags for when to apply this learning
  
  -- Source
  source TEXT, -- 'daily_review', 'weekly_review', 'manual'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### decisions
```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  context TEXT, -- Situation/Background
  options JSONB, -- Array of options considered
  chosen_option TEXT,
  reasoning TEXT,
  gut_feeling INT CHECK (gut_feeling BETWEEN 1 AND 10),
  
  -- Review
  review_date DATE, -- When to review this decision
  review_completed BOOLEAN DEFAULT FALSE,
  review_rating INT CHECK (review_rating BETWEEN 1 AND 10),
  review_notes TEXT,
  would_do_again BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### coach_messages
```sql
CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  message_type TEXT, -- 'morning', 'evening', 'intervention', 'motivation', 'warning'
  content TEXT NOT NULL,
  
  -- Context
  trigger_reason TEXT, -- Why this message was sent
  context_data JSONB, -- Data used to generate message
  
  -- Delivery
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  platform TEXT, -- 'telegram', 'web'
  
  -- Response
  user_response TEXT,
  response_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### weekly_reviews
```sql
CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- Aggregated Stats
  avg_mood DECIMAL,
  avg_energy DECIMAL,
  avg_sleep DECIMAL,
  total_tasks_planned INT,
  total_tasks_completed INT,
  completion_rate DECIMAL,
  
  -- Goal Progress
  goal_progress JSONB, -- {goal_id: progress_this_week}
  
  -- Patterns
  best_day TEXT,
  worst_day TEXT,
  patterns_detected JSONB,
  
  -- Reflection
  key_wins TEXT[],
  key_struggles TEXT[],
  main_learning TEXT,
  next_week_focus TEXT,
  
  -- Coach Analysis
  coach_analysis TEXT,
  recommendations JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, week_start)
);
```

#### accountability_stakes
```sql
CREATE TABLE accountability_stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  stake_type TEXT, -- 'financial', 'social', 'commitment'
  description TEXT,
  
  -- For financial stakes
  amount_cents INT,
  currency TEXT DEFAULT 'EUR',
  recipient TEXT, -- 'charity', 'anti_charity', 'friend'
  recipient_details TEXT,
  
  -- Conditions
  goal_id UUID REFERENCES goals(id),
  habit_id UUID REFERENCES habits(id),
  condition_description TEXT,
  deadline DATE,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'won', 'lost', 'cancelled'
  triggered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Indexes

```sql
-- Performance Indexes
CREATE INDEX idx_tasks_user_date ON tasks(user_id, scheduled_date);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date);
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_coach_messages_user ON coach_messages(user_id, created_at DESC);
```

### 4.4 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_stakes ENABLE ROW LEVEL SECURITY;

-- Simple policy: User can only access own data
CREATE POLICY "Users can only access own data" ON users
  FOR ALL USING (id = auth.uid());

-- Repeat for all tables with user_id
CREATE POLICY "Users can only access own data" ON tasks
  FOR ALL USING (user_id = auth.uid());
-- ... etc for all tables
```

---

## 5. Telegram Bot

### 5.1 Commands

| Command | Beschreibung | Beispiel |
|---------|--------------|----------|
| `/start` | Bot starten, Onboarding | - |
| `/checkin` | Morning/Evening Check-in | - |
| `/tasks` | Heutige Tasks anzeigen | - |
| `/done [id]` | Task als erledigt markieren | `/done 1` |
| `/skip [id]` | Task überspringen | `/skip 2` |
| `/mood [1-10]` | Mood updaten | `/mood 7` |
| `/energy [1-10]` | Energy updaten | `/energy 6` |
| `/habits` | Habits anzeigen | - |
| `/habit [name]` | Habit als erledigt | `/habit meditation` |
| `/stats` | Statistiken anzeigen | - |
| `/coach` | Mit Coach sprechen | - |
| `/settings` | Einstellungen | - |

### 5.2 Inline Keyboards

#### Morning Check-in Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  🌅 Guten Morgen! Zeit für deinen Check-in.                    │
│                                                                 │
│  Wie hast du geschlafen?                                        │
│  [😫 1-3] [😐 4-6] [😊 7-8] [🤩 9-10]                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Wie viele Stunden?                                             │
│  [< 5h] [5-6h] [6-7h] [7-8h] [8h+]                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Wie ist deine Energie?                                         │
│  [😫 1-3] [😐 4-6] [😊 7-8] [🤩 9-10]                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Wie ist deine Stimmung?                                        │
│  [😫 1-3] [😐 4-6] [😊 7-8] [🤩 9-10]                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Check-in complete!                                          │
│                                                                 │
│  📊 Deine Stats heute:                                          │
│  😴 Schlaf: 7h (Quality: 8/10)                                  │
│  ⚡ Energie: 7/10                                                │
│  😊 Mood: 8/10                                                   │
│                                                                 │
│  💬 Coach sagt:                                                  │
│  "Guter Start! Mit 7h Schlaf und hoher Energie habe ich        │
│   dir heute Deep Work auf den Morgen gelegt..."                 │
│                                                                 │
│  [📋 Tasks anzeigen] [💬 Mit Coach sprechen]                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Task Management

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 DEINE TASKS HEUTE                                           │
│                                                                 │
│  1. ⬜ 08:00 Deep Work: Businessplan        🔴 High             │
│  2. ✅ 10:00 Emails                         🟡 Med              │
│  3. ⬜ 11:00 Führerschein Theorie           🔴 High             │
│  4. ⬜ 14:00 Training                       🟢 Low              │
│                                                                 │
│  Erledigt: 1/4 (25%)                                           │
│                                                                 │
│  [✅ Task erledigt] [⏭️ Task überspringen]                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Notification Schedule

| Zeit | Notification | Bedingung |
|------|--------------|-----------|
| 07:00 | Morning Check-in Reminder | Täglich |
| 08:00 | Tagesplan | Nach Check-in |
| 12:00 | Midday Check | Wenn < 50% Tasks erledigt |
| 15:00 | Afternoon Nudge | Bei Low Energy Warning |
| 20:00 | Evening Review Reminder | Täglich |
| 21:00 | Habit Reminder | Wenn Habits offen |

### 5.4 Bot Code Struktur

```
telegram-bot/
├── src/
│   ├── index.ts              # Bot Entry Point
│   ├── bot.ts                # Bot Instance & Config
│   ├── commands/
│   │   ├── start.ts          # /start Command
│   │   ├── checkin.ts        # /checkin Command
│   │   ├── tasks.ts          # /tasks Command
│   │   ├── habits.ts         # /habits Command
│   │   ├── stats.ts          # /stats Command
│   │   └── coach.ts          # /coach Command
│   ├── handlers/
│   │   ├── callback.ts       # Inline Keyboard Callbacks
│   │   ├── message.ts        # Text Message Handler
│   │   └── error.ts          # Error Handler
│   ├── services/
│   │   ├── supabase.ts       # Database Client
│   │   ├── coach.ts          # Coach AI Logic
│   │   └── notifications.ts  # Scheduled Notifications
│   ├── keyboards/
│   │   ├── checkin.ts        # Check-in Keyboards
│   │   ├── tasks.ts          # Task Keyboards
│   │   └── common.ts         # Common Keyboards
│   ├── utils/
│   │   ├── format.ts         # Message Formatting
│   │   └── helpers.ts        # Helper Functions
│   └── types/
│       └── index.ts          # Type Definitions
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## 6. Web App (PWA)

### 6.1 Screens

| Screen | Route | Beschreibung |
|--------|-------|--------------|
| Dashboard | `/` | Übersicht, Today's Tasks, Coach Message |
| Tasks | `/tasks` | Task Management, Kanban/Liste |
| Goals | `/goals` | Goal Tracking, Progress |
| Journal | `/journal` | Daily Logs, Reflections |
| Habits | `/habits` | Habit Tracker, Streaks |
| Stats | `/stats` | Analytics, Charts, Patterns |
| Decisions | `/decisions` | Decision Journal |
| Profile | `/profile` | Settings, Preferences |
| Coach | `/coach` | Chat with Coach |

### 6.2 Component Struktur

```
web/
├── app/
│   ├── layout.tsx            # Root Layout
│   ├── page.tsx              # Dashboard
│   ├── tasks/
│   │   └── page.tsx
│   ├── goals/
│   │   └── page.tsx
│   ├── journal/
│   │   └── page.tsx
│   ├── habits/
│   │   └── page.tsx
│   ├── stats/
│   │   └── page.tsx
│   ├── decisions/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── coach/
│   │   └── page.tsx
│   └── api/
│       ├── checkin/
│       │   └── route.ts
│       ├── tasks/
│       │   └── route.ts
│       ├── coach/
│       │   └── route.ts
│       └── stats/
│           └── route.ts
├── components/
│   ├── ui/                   # Shadcn Components
│   ├── dashboard/
│   │   ├── DailyOverview.tsx
│   │   ├── TaskList.tsx
│   │   ├── MoodEnergy.tsx
│   │   ├── StreakDisplay.tsx
│   │   └── CoachMessage.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskForm.tsx
│   │   └── TaskFilters.tsx
│   ├── charts/
│   │   ├── MoodChart.tsx
│   │   ├── ProductivityChart.tsx
│   │   └── GoalProgress.tsx
│   ├── coach/
│   │   ├── ChatInterface.tsx
│   │   └── MessageBubble.tsx
│   └── common/
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── Loading.tsx
├── lib/
│   ├── supabase.ts           # Supabase Client
│   ├── openai.ts             # OpenAI Client
│   ├── utils.ts              # Utility Functions
│   └── hooks/
│       ├── useTasks.ts
│       ├── useGoals.ts
│       └── useStats.ts
├── types/
│   └── index.ts
├── styles/
│   └── globals.css
├── public/
│   ├── manifest.json         # PWA Manifest
│   └── icons/
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 6.3 PWA Configuration

```json
// public/manifest.json
{
  "name": "Peak Performance Coach",
  "short_name": "PeakCoach",
  "description": "Your AI-powered Life & Performance Coach",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 7. n8n Workflows

### 7.1 Workflow Übersicht

| ID | Name | Trigger | Funktion |
|----|------|---------|----------|
| LC-WF1 | Morning Routine | Cron 07:00 | Check-in Reminder, Plan erstellen |
| LC-WF2 | Task Monitoring | Every 2h | Check Task Progress, Nudges |
| LC-WF3 | Evening Routine | Cron 20:00 | Review Reminder, Analyse |
| LC-WF4 | Weekly Review | Cron Sun 19:00 | Wochenanalyse, Report |
| LC-WF5 | Pattern Detection | Cron Daily 22:00 | Muster erkennen, Learnings |
| LC-WF6 | Intervention | Event-based | Proaktive Interventionen |

### 7.2 Workflow Details

#### LC-WF1: Morning Routine

```
┌─────────────────────────────────────────────────────────────────┐
│  LC-WF1: MORNING ROUTINE                                        │
│  Trigger: Cron 07:00                                            │
│                                                                 │
│  1. [Cron Trigger]                                              │
│         ↓                                                       │
│  2. [Load User Profile] ← Supabase                              │
│         ↓                                                       │
│  3. [Check if Check-in Done]                                    │
│         ↓                                                       │
│  4. [If NOT Done] → [Send Telegram Reminder]                    │
│         ↓                                                       │
│  5. [Wait for Check-in] (Webhook)                               │
│         ↓                                                       │
│  6. [Load Today's Tasks] ← Supabase                             │
│         ↓                                                       │
│  7. [Load Goals & Context]                                      │
│         ↓                                                       │
│  8. [Generate Coach Message] ← OpenAI                           │
│         ↓                                                       │
│  9. [Generate Day Plan] ← OpenAI                                │
│         ↓                                                       │
│  10. [Save to Database]                                         │
│         ↓                                                       │
│  11. [Send Plan via Telegram]                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### LC-WF6: Intervention System

```
┌─────────────────────────────────────────────────────────────────┐
│  LC-WF6: INTERVENTION SYSTEM                                    │
│  Trigger: Various (Cron, Webhook, Event)                        │
│                                                                 │
│  TRIGGERS:                                                      │
│  ├── No Task Updates for 4h                                     │
│  ├── Mood < 5 for 2+ days                                       │
│  ├── Habit Streak about to break                                │
│  ├── Goal deadline approaching                                  │
│  └── Sleep < 6h for 3+ days                                     │
│                                                                 │
│  FLOW:                                                          │
│  1. [Trigger Detected]                                          │
│         ↓                                                       │
│  2. [Load User Context]                                         │
│         ↓                                                       │
│  3. [Determine Intervention Type]                               │
│         ↓                                                       │
│  4. [Generate Intervention Message] ← OpenAI                    │
│         ↓                                                       │
│  5. [Send via Telegram with Response Options]                   │
│         ↓                                                       │
│  6. [Handle Response]                                           │
│         ↓                                                       │
│  7. [Update Database]                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Coach AI Logik

### 8.1 System Prompt

```markdown
# PEAK PERFORMANCE COACH

Du bist der persönliche Peak Performance Coach von {user.name}.

## DEINE IDENTITÄT
- Name: Coach (oder was der User bevorzugt)
- Stil: {user.coach_style} (tough/gentle/balanced)
- Sprache: Deutsch (Du-Form)

## DEINE ROLLE
1. **Accountability Partner** - Du hältst den User accountable
2. **Stratege** - Du hilfst bei der Tagesplanung
3. **Analyst** - Du erkennst Muster und gibst Feedback
4. **Motivator** - Du feierst Wins und pushst bei Struggles
5. **Berater** - Du gibst evidenzbasierte Empfehlungen

## DEINE PRINZIPIEN
- Sei direkt und ehrlich, aber respektvoll
- Basiere Empfehlungen auf DATEN, nicht auf Vermutungen
- Erkenne wenn der User Unterstützung braucht vs. Push
- Feiere kleine Wins, sie sind wichtig
- Halte den User an seine eigenen Ziele/Prinzipien

## USER PROFIL
{user.profile}

## AKTUELLE ZIELE
{user.goals}

## LETZTE 7 TAGE KONTEXT
{context.last_7_days}

## ERKANNTE MUSTER
{context.patterns}

## AKTUELLE SITUATION
{context.current}

## WICHTIGE REGELN
1. Beziehe dich auf konkrete Daten wenn möglich
2. Erwähne relevante vergangene Situationen
3. Verbinde tägliche Tasks mit langfristigen Zielen
4. Passe deinen Ton an die aktuelle Stimmung an
5. Bei Mood < 5: Sei supportive, nicht pushy
6. Bei Streak-Gefahr: Erinnere an den Streak-Wert
```

### 8.2 Prompt Templates

#### Morning Message

```markdown
GENERIERE EINE MORNING MESSAGE:

User: {name}
Schlaf: {sleep_hours}h (Quality: {sleep_quality}/10)
Energie: {energy}/10
Mood: {mood}/10

Letzte Nacht:
- Schlaf-Durchschnitt letzte Woche: {avg_sleep}h
- Trend: {sleep_trend}

Heutige Tasks:
{tasks}

Aktive Goals:
{goals}

Relevante Patterns:
{patterns}

---

Erstelle eine kurze, personalisierte Morning Message die:
1. Den User begrüßt (passend zur Tageszeit/Wochentag)
2. Auf die Schlaf/Energie-Daten eingeht
3. Den wichtigsten Task/Fokus für heute hervorhebt
4. Einen motivierenden oder supportiven Ton hat (je nach Daten)
5. Max 100 Worte

Format: Direkte Ansprache, keine Überschriften
```

#### Intervention Message

```markdown
GENERIERE EINE INTERVENTION:

Trigger: {trigger_type}
- {trigger_details}

User Context:
- Aktueller Mood: {mood}
- Aktuelle Energie: {energy}
- Letzte Aktivität: {last_activity}

Historie:
- Wie oft wurde dieser Trigger ausgelöst: {trigger_count}
- Letzte Intervention: {last_intervention}
- Reaktion auf letzte Intervention: {last_response}

---

Erstelle eine Intervention-Nachricht die:
1. Das Problem direkt anspricht
2. Verständnis zeigt (wenn angemessen)
3. Konkrete Optionen gibt (2-4 Buttons)
4. Nicht nervig oder belehrend wirkt
5. Die Intervention-Historie berücksichtigt

Format:
- Nachricht (max 80 Worte)
- Button-Optionen (2-4)
```

### 8.3 Pattern Detection Queries

```sql
-- Produktivität nach Wochentag
SELECT 
  EXTRACT(DOW FROM date) as day_of_week,
  AVG(tasks_completed::float / NULLIF(tasks_planned, 0) * 100) as avg_completion_rate
FROM daily_logs
WHERE user_id = $1 AND date > NOW() - INTERVAL '30 days'
GROUP BY day_of_week
ORDER BY day_of_week;

-- Mood-Energy Korrelation
SELECT 
  CORR(morning_energy, evening_mood) as energy_mood_correlation,
  CORR(sleep_hours, morning_energy) as sleep_energy_correlation
FROM daily_logs
WHERE user_id = $1 AND date > NOW() - INTERVAL '30 days';

-- Task-Postpone Patterns
SELECT 
  title,
  times_postponed,
  category,
  priority
FROM tasks
WHERE user_id = $1 AND times_postponed > 2
ORDER BY times_postponed DESC
LIMIT 10;

-- Habit Streak Risk
SELECT 
  h.name,
  h.current_streak,
  MAX(hl.date) as last_completed
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.completed = true
WHERE h.user_id = $1 AND h.is_active = true
GROUP BY h.id, h.name, h.current_streak
HAVING MAX(hl.date) < CURRENT_DATE;
```

---

## 9. Accountability System

### 9.1 Layer Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                   ACCOUNTABILITY LAYERS                         │
│                                                                 │
│  LAYER 1: POSITIVE REINFORCEMENT                               │
│  ├── Streaks & XP                                               │
│  ├── Levels & Badges                                            │
│  ├── Progress Visualization                                     │
│  └── Celebration of Wins                                        │
│                                                                 │
│  LAYER 2: FRICTION FOR SKIPPING                                │
│  ├── Required Skip Reason                                       │
│  ├── 30 Second Wait Time                                        │
│  ├── Skip Counter Visible                                       │
│  └── Escalating Questions                                       │
│                                                                 │
│  LAYER 3: SOCIAL ACCOUNTABILITY                                │
│  ├── Accountability Partner                                     │
│  ├── Weekly Report to Partner                                   │
│  ├── Shared Goals (optional)                                    │
│  └── Public Commitments                                         │
│                                                                 │
│  LAYER 4: FINANCIAL STAKES                                     │
│  ├── Commitment Contracts                                       │
│  ├── Beeminder Integration                                      │
│  ├── Money to Charity/Anti-Charity                             │
│  └── Refundable Deposits                                        │
│                                                                 │
│  LAYER 5: NUCLEAR OPTIONS                                      │
│  ├── Partner/Friend Notification                               │
│  ├── Embarrassing Social Posts                                  │
│  └── Account Lockout until Check-in                            │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Gamification System

```typescript
// XP & Levels
const XP_ACTIONS = {
  TASK_COMPLETED: 10,
  TASK_COMPLETED_HIGH_PRIORITY: 20,
  HABIT_COMPLETED: 15,
  STREAK_MAINTAINED: 5,
  STREAK_MILESTONE_7: 50,
  STREAK_MILESTONE_30: 200,
  MORNING_CHECKIN: 5,
  EVENING_REVIEW: 10,
  GOAL_PROGRESS: 25,
  GOAL_COMPLETED: 500,
};

const LEVELS = [
  { level: 1, xp_required: 0, title: "Beginner" },
  { level: 2, xp_required: 100, title: "Committed" },
  { level: 3, xp_required: 300, title: "Consistent" },
  { level: 4, xp_required: 600, title: "Focused" },
  { level: 5, xp_required: 1000, title: "Dedicated" },
  { level: 6, xp_required: 1500, title: "Disciplined" },
  { level: 7, xp_required: 2500, title: "Elite" },
  { level: 8, xp_required: 4000, title: "Master" },
  { level: 9, xp_required: 6000, title: "Legend" },
  { level: 10, xp_required: 10000, title: "Peak Performer" },
];

const BADGES = [
  { id: "early_bird", name: "Early Bird", condition: "7 day streak morning check-in before 7am" },
  { id: "deep_worker", name: "Deep Worker", condition: "Complete 10 deep work sessions" },
  { id: "habit_master", name: "Habit Master", condition: "30 day streak on any habit" },
  { id: "goal_crusher", name: "Goal Crusher", condition: "Complete 3 goals" },
  { id: "reflector", name: "Reflector", condition: "30 day journal streak" },
  { id: "unstoppable", name: "Unstoppable", condition: "100% task completion for 7 days" },
];
```

### 9.3 Skip Friction Flow

```typescript
const SKIP_FLOW = {
  step1: {
    message: "Warum möchtest du diesen Task überspringen?",
    options: [
      "Keine Zeit heute",
      "Zu müde/keine Energie", 
      "Blockiert/brauche etwas",
      "Nicht mehr relevant",
      "Anderer Grund"
    ],
    required: true
  },
  step2: {
    message: "Das ist das {count}. Mal diese Woche. Bist du sicher?",
    show_if: "skip_count_this_week >= 3",
    wait_seconds: 30
  },
  step3: {
    message: "Was brauchst du, um diesen Task doch noch zu schaffen?",
    show_if: "times_postponed >= 3",
    options: [
      "Kleinere Version machen",
      "Hilfe holen",
      "Deadline setzen",
      "Task löschen",
      "Trotzdem überspringen"
    ]
  }
};
```

---

## 10. API Endpunkte

### 10.1 Übersicht

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/auth/telegram` | Telegram Auth |
| GET | `/api/user/profile` | User Profile |
| PUT | `/api/user/profile` | Update Profile |
| POST | `/api/checkin` | Morning/Evening Check-in |
| GET | `/api/tasks` | Get Tasks |
| POST | `/api/tasks` | Create Task |
| PATCH | `/api/tasks/:id` | Update Task |
| DELETE | `/api/tasks/:id` | Delete Task |
| GET | `/api/goals` | Get Goals |
| POST | `/api/goals` | Create Goal |
| GET | `/api/habits` | Get Habits |
| POST | `/api/habits/:id/log` | Log Habit |
| GET | `/api/stats/daily` | Daily Stats |
| GET | `/api/stats/weekly` | Weekly Stats |
| POST | `/api/coach/message` | Get Coach Response |

### 10.2 Request/Response Examples

#### POST /api/checkin

```typescript
// Request
{
  "type": "morning", // or "evening"
  "mood": 7,
  "energy": 6,
  "sleep_hours": 7.5,
  "sleep_quality": 8,
  "notes": "Gut geschlafen, motiviert für heute"
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2025-12-10",
    "morning_mood": 7,
    "morning_energy": 6,
    "sleep_hours": 7.5,
    "sleep_quality": 8
  },
  "coach_message": "Guter Start heute! Mit 7.5h Schlaf...",
  "day_plan": {
    "focus": "Businessplan Kapitel 2",
    "tasks": [...],
    "energy_allocation": {...}
  }
}
```

---

## 11. Deployment

### 11.1 Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    HETZNER VPS                            │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │   n8n       │  │  Telegram   │  │   Nginx     │       │  │
│  │  │  (Docker)   │  │    Bot      │  │  (Reverse   │       │  │
│  │  │             │  │  (Docker)   │  │   Proxy)    │       │  │
│  │  │  :5678      │  │  :3001      │  │  :80/:443   │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    VERCEL                                 │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │              Next.js Web App                        │ │  │
│  │  │              (PWA)                                  │ │  │
│  │  │              peak-coach.vercel.app                  │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   SUPABASE                                │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │  Database   │  │    Auth     │  │   Storage   │       │  │
│  │  │  (Postgres) │  │             │  │             │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Docker Compose (Hetzner)

```yaml
# docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=${WEBHOOK_URL}
      - GENERIC_TIMEZONE=Europe/Berlin
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - peak-coach

  telegram-bot:
    build: ./telegram-bot
    restart: always
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    networks:
      - peak-coach

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - n8n
    networks:
      - peak-coach

volumes:
  n8n_data:

networks:
  peak-coach:
    driver: bridge
```

### 11.3 Environment Variables

```bash
# .env.example

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-xxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# n8n
N8N_HOST=n8n.yourdomain.com
WEBHOOK_URL=https://n8n.yourdomain.com

# App
NEXT_PUBLIC_APP_URL=https://coach.yourdomain.com
```

---

## 12. Roadmap

### Phase 1: Foundation (Woche 1-2)

- [ ] Supabase Projekt erstellen
- [ ] Datenbank Schema implementieren
- [ ] Telegram Bot Grundgerüst
- [ ] Basic Commands (/start, /checkin)
- [ ] Supabase Integration im Bot

### Phase 2: Core Features (Woche 3-4)

- [ ] Morning Check-in Flow
- [ ] Task Management (CRUD)
- [ ] Evening Review Flow
- [ ] Basic Coach Messages (Templates)
- [ ] n8n Workflows (Morning, Evening)

### Phase 3: Intelligence (Woche 5-6)

- [ ] OpenAI Integration
- [ ] Personalized Coach Messages
- [ ] Pattern Detection Queries
- [ ] Proactive Interventions
- [ ] Weekly Review Automation

### Phase 4: Web App (Woche 7-8)

- [ ] Next.js Project Setup
- [ ] Dashboard Screen
- [ ] Task Management Screen
- [ ] Stats/Analytics Screen
- [ ] PWA Configuration

### Phase 5: Enhancement (Woche 9-10)

- [ ] Habit Tracking
- [ ] Goal Management
- [ ] Gamification (XP, Levels)
- [ ] Accountability Features
- [ ] Decision Journal

### Phase 6: Polish (Woche 11-12)

- [ ] Bug Fixes
- [ ] Performance Optimization
- [ ] UX Improvements
- [ ] Documentation
- [ ] Production Deployment

### Future (Nach MVP)

- [ ] Financial Stakes Integration
- [ ] Social Accountability
- [ ] Voice Memos
- [ ] Calendar Integration
- [ ] Apple Watch Support
- [ ] Advanced Analytics

---

## 📎 Anhang

### A. Beispiel Coach Messages

```
MORNING (Guter Tag):
"Guten Morgen! 7.5h Schlaf und Energie bei 8/10 - das wird ein 
produktiver Tag! Ich habe dir 'Businessplan Kapitel 2' auf deinen 
Peak-Zeit-Slot um 9 Uhr gelegt. Dein Führerschein-Ziel ist zu 75% 
erreicht - heute noch 30 Min Theorie bringt dich auf 80%. Los geht's! 💪"

MORNING (Schwieriger Start):
"Hey, ich sehe du hast nur 5h geschlafen und die Energie ist bei 4/10. 
Das ist okay - wir passen den Tag an. Ich habe die Deep-Work-Session 
auf morgen verschoben. Heute fokussieren wir uns auf: 
1) Leichte Admin-Tasks 
2) Ein kurzer Spaziergang (Energie booster!)
3) Früh ins Bett. 
Nicht jeder Tag muss ein 100%-Tag sein."

INTERVENTION (Prokrastination):
"Hey, kurzer Check: 'Steuererklärung' wurde jetzt 5x verschoben. 
Das kenne ich - ist ein nerviger Task. Aber er blockiert dein 
Mental-Bandwidth. Vorschlag: Lass uns die ersten 15 Min JETZT machen. 
Nur sortieren, nicht fertig machen. Deal? 
[Ja, 15 Min jetzt] [Morgen fix] [Task aufteilen]"

WEEKLY (Positive):
"🎉 Starke Woche! 85% Task-Completion, 3x Training, Journal-Streak 
bei 23 Tagen. Dein Führerschein-Ziel ist jetzt bei 80% - noch 2 Wochen 
bis zur Prüfung, du bist auf Kurs! Einziger Verbesserungspunkt: 
Schlaf war im Schnitt nur 6.2h. Nächste Woche: 22:30 Schlafens-Alarm?"
```

### B. Keyboard Layouts

```
TASK LIST:
┌────────────────────────────┐
│ ✅ Done  │ ⏭️ Skip │ 📝 Edit │
└────────────────────────────┘

MOOD INPUT:
┌─────────────────────────────────────────┐
│ 😫 1-3 │ 😐 4-5 │ 😊 6-7 │ 😁 8-9 │ 🤩 10 │
└─────────────────────────────────────────┘

QUICK ACTIONS:
┌────────────────────────────┐
│ ➕ Task │ 📊 Stats │ 💬 Coach │
└────────────────────────────┘
```

---

**Dokument Ende**

*Bereit für Entwicklung. Los geht's! 🚀*

