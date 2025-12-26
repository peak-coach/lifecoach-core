# Peak Coach - Projekt Kontext

## Projekt-Übersicht
- **Web App:** Next.js auf Vercel (https://peak-coach-pe9r9fbaa-kelvin-fallers-projects.vercel.app)
- **Telegram Bot:** Node.js auf Railway
- **Datenbank:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4o

## Wichtige Architektur-Info

### User-ID System (KRITISCH!)
Es gibt **zwei verschiedene User-IDs**:

| Tabellen | Referenziert | Im Code verwenden |
|----------|--------------|-------------------|
| `goals`, `habits`, `tasks`, `milestones`, `pomodoro_sessions` | `users(id)` | `userData.id` (aus users Tabelle via Email) |
| `learning_*`, `spaced_repetition`, `goal_learning_progress`, `user_xp`, `goal_skills`, `actions`, `books`, `book_highlights` | `auth.users(id)` | `authUser.id` (aus Supabase Auth) |

### Datei-Struktur
```
peak-coach/
├── apps/
│   ├── web/                    # Next.js Web App
│   │   ├── src/app/
│   │   │   ├── akademie/       # Lern-Center
│   │   │   ├── api/            # API Routes
│   │   │   ├── goals/          # Ziele-Seite
│   │   │   └── page.tsx        # Dashboard
│   │   └── src/lib/
│   │       ├── expertKnowledge.ts  # AI Wissens-Basis
│   │       └── api.ts          # Supabase Client
│   └── telegram-bot/           # Telegram Bot
│       └── src/services/
│           └── expertKnowledge.ts
└── supabase/migrations/        # DB Schema (001-017)
```

## Implementierte Features

### Akademie (Lern-Center) - ERWEITERT
- Dynamische KI-generierte Lernmodule basierend auf Zielen
- **NEU: 8-Schritt-Struktur:** PRE-TEST → WHY → LEARN → GENERATE → DO → TEST → ACTION → REFLECT
- **NEU: Skill Decomposition** - Ziele werden in Sub-Skills aufgebrochen
- **NEU: Implementation Intentions Builder** - WENN-DANN Pläne
- **NEU: Confidence Rating** - Metacognition Tracking
- Spaced Repetition (SM-2 Algorithmus)
- Transfer-Verification (24h nach Modul)
- Eingangs-Diagnose für Wissensstand
- Interleaving (Themen-Wechsel)
- Variable Rewards (Bonus XP)
- Learning Level: Minimal (5min), Standard (15min), Intensive (30min)

### NEU: Unified Actions System
- Actions aus Akademie-Modulen
- Actions aus Büchern
- Implementation Intentions (WENN-DANN)
- Smart Follow-up System
- Effectiveness Tracking

### NEU: Lese-Journal (Books Library)
- Bücher verwalten (mit Google Books API Metadata)
- Highlights speichern (Insight, Action, Quote, Question)
- Spaced Repetition für Buch-Konzepte
- Buch-Actions → Unified Actions System
- Buch-Reflexion nach Abschluss

### Gamification
- XP/Level System
- Streaks
- Badges (geplant)

### Expertenwissen-Kategorien
Rhetorik, Psychologie, Produktivität, Fitness, Muskelaufbau, TRT/Enhanced, Business, Finanzen, Lernen, Schlaf, Sprachen, KI, Prompting, Meditation, Kampfsport, Biohacking, Networking, Lesen, **Supplements**

## Letzte Änderungen
- **NEU: Migration 015** - Skill Decomposition System (goal_skills, module_skill_mapping, skill_templates)
- **NEU: Migration 016** - Unified Actions System (actions, action_reminders)
- **NEU: Migration 017** - Books Library (books, book_highlights, book_reading_sessions)
- User-ID Bug in Akademie gefixt (authUser.id statt userData.id)
- Supplements-Kategorie hinzugefügt

## Bekannte Regeln (Memory)
1. Bei DB-Interaktionen IMMER prüfen: Welche user_id braucht die Tabelle?
2. Vor Implementierung: Annahmen erklären, auf Feedback warten
3. grep-Befehle nutzen statt Code nur lesen

## Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## Telegram Bot
- Deployed auf Railway
- Hauptfunktionen: Morgen/Abend Check-in, Task-Generierung, Pomodoro, Ziel-Erstellung
- Bot nutzt auch `expertKnowledge.ts` für AI-gestützte Vorschläge

## Datenbank-Migrationen
- `001-008`: Basis-Schema (users, goals, habits, tasks, etc.)
- `009`: Work Mode
- `010`: RLS Security Fixes
- `011`: Goal Hierarchy (long/short/sprint goals)
- `012`: Gamification (XP/Levels)
- `013`: Akademie (learning_settings, spaced_repetition, etc.)
- `014`: Learning Progress (goal_learning_progress, learning_actions)
- `015`: **NEU** Skill Decomposition (goal_skills, module_skill_mapping, skill_templates)
- `016`: **NEU** Unified Actions (actions, action_reminders)
- `017`: **NEU** Books Library (books, book_highlights, book_reading_sessions)

## Neue Tabellen (015-017)

### goal_skills (015)
- Skill-Hierarchie pro Ziel
- Mastery-Level Tracking
- Weakness Detection
- Referenziert: `auth.users(id)`, `goals(id)`

### module_skill_mapping (015)
- Verknüpft Module mit Skills
- Quiz-Scores, Confidence
- Trigger aktualisiert Skill-Mastery

### skill_templates (015)
- Vordefinierte Skill-Strukturen
- Für Konsistenz bei KI-Generierung
- Enthält: Präsentation, Leadership, Verhandlung

### actions (016)
- Unified für Module + Bücher + Manual
- Implementation Intentions (WENN-DANN)
- Timing: specific, daily, weekly, opportunity
- Effectiveness Rating & Reflection

### books (017)
- Bücher-Bibliothek
- Google Books Metadata
- Status: want_to_read, reading, completed, abandoned
- Rating, Review, Key Takeaways

### book_highlights (017)
- Highlights aus Büchern
- Typen: insight, action, quote, question, connection
- Eigene Spaced Repetition
- Verknüpfung mit Actions

## Offene/Geplante Features
- [ ] Badges/Achievements System
- [ ] Skill-Tree Visualization
- [ ] Push Notifications (PWA)
- [ ] Telegram-Web Sync verbessern
- [x] Skill Decomposition
- [x] Unified Actions System
- [x] Lese-Journal / Books Library

## Nächste Implementierungs-Schritte
1. API Endpoints für Skill Decomposition
2. API Endpoints für Actions
3. API Endpoints für Books
4. Frontend: Akademie Home Redesign
5. Frontend: Skill-Map Visualisierung
6. Frontend: Lese-Journal UI

## Zuletzt getestet
- Akademie Modul-Flow (nach User-ID Fix) - NEEDS TESTING
- Supplements-Kategorie hinzugefügt - NEEDS TESTING
- **Neue Migrationen 015-017** - NEEDS DEPLOYMENT TO SUPABASE
