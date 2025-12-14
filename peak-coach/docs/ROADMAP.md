# 🗺️ PEAK PERFORMANCE COACH - Roadmap

> **Version:** 1.0  
> **Erstellt:** 11. Dezember 2025  
> **Status:** Phase 1 abgeschlossen ✅

---

## 📊 Übersicht

```
Phase 1: Foundation       ████████████████████ 100% ✅
Phase 2: Core Features    ░░░░░░░░░░░░░░░░░░░░   0%
Phase 3: Accountability   ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: Psychologie      ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Gamification     ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: Advanced         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 7: Elite            ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## Phase 1: Foundation ✅ DONE
**Zeitraum:** Woche 1  
**Status:** Abgeschlossen

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Supabase Setup | ✅ | Datenbank + 12 Tabellen |
| Telegram Bot | ✅ | Grammy Framework |
| Check-in Flow | ✅ | Morning + Evening |
| Deutsche Texte | ✅ | Komplett auf Deutsch |
| Button-Navigation | ✅ | Kein Tippen nötig |
| User Registration | ✅ | Account + Profil |
| OpenAI Integration | ✅ | GPT-4o für Coach |

---

## Phase 2: Core Features
**Zeitraum:** Woche 2  
**Status:** Ausstehend

| Feature | Status | Priorität | Beschreibung |
|---------|--------|-----------|--------------|
| Tasks CRUD | ⏳ | 🔴 Hoch | Erstellen, bearbeiten, löschen, erledigen |
| Habits CRUD | ⏳ | 🔴 Hoch | Habits + automatisches Streak-Tracking |
| Goals CRUD | ⏳ | 🔴 Hoch | Ziele + Fortschritts-Tracking |
| Basis-Statistiken | ⏳ | 🟡 Mittel | Wochen-Übersicht, Trends |
| Coach AI Responses | ⏳ | 🔴 Hoch | Personalisierte Antworten basierend auf Daten |

### Technische Details:
```
Tasks:
- Titel, Beschreibung, Priorität, Energie-Level
- Datum + Uhrzeit
- Status: pending → in_progress → completed/skipped
- Wiederkehrende Tasks

Habits:
- Name, Kategorie, Frequenz
- Streak-Tracking automatisch
- Reminder-Zeit
- Streak Saver (1x/Monat)

Goals:
- Titel, Beschreibung, Kategorie
- Zielwert + Aktueller Wert
- Deadline
- Verknüpfung mit Tasks
```

---

## Phase 3: Accountability
**Zeitraum:** Woche 3  
**Status:** Ausstehend

| Feature | Status | Priorität | Beschreibung |
|---------|--------|-----------|--------------|
| 📸 Foto-Verification | ⏳ | 🔴 Hoch | Training nur mit Beweis-Foto |
| ⏱️ Task-Timer | ⏳ | 🟡 Mittel | Pomodoro-Style Timer |
| 🔔 Proaktive Reminders | ⏳ | 🔴 Hoch | Scheduler-basierte Erinnerungen |
| ⚠️ Interventionen | ⏳ | 🔴 Hoch | Bei Inaktivität, Low Mood, etc. |
| 🔥 Streak-Alerts | ⏳ | 🟡 Mittel | Warnings + Celebrations |

### Foto-Verification Flow:
```
1. User klickt "Training beendet"
2. Bot fordert Foto an
3. User macht Selfie (im Gym, verschwitzt, etc.)
4. Optional: AI prüft Authentizität
5. Training wird bestätigt + XP vergeben
```

---

## Phase 4: Psychologie-Features
**Zeitraum:** Woche 4  
**Status:** Ausstehend

| Feature | Status | Wissenschaft | Beschreibung |
|---------|--------|--------------|--------------|
| Implementation Intentions | ⏳ | Gollwitzer 1999 | "Wenn X, dann Y" Pläne |
| WOOP Integration | ⏳ | Oettingen 2014 | Wish-Outcome-Obstacle-Plan |
| Habit Stacking | ⏳ | Clear 2018 | "Nach X mache ich Y" |
| Anti-Goals | ⏳ | Inversion | "Was will ich NICHT?" |
| Energy Matching | ⏳ | Chronobiologie | Tasks nach Energie-Level |
| 2-Minuten-Regel | ⏳ | Allen 2001 | Sofort erledigen wenn < 2 Min |
| Temptation Bundling | ⏳ | Milkman 2014 | Guilty Pleasure + gute Gewohnheit |

### Implementation Details:
```
Implementation Intentions:
- User definiert: "Wenn [Situation], dann [Verhalten]"
- Bot erinnert in der Situation
- Tracking ob umgesetzt

WOOP:
- Wish: Was willst du?
- Outcome: Wie fühlt sich das an?
- Obstacle: Was könnte dich stoppen?
- Plan: Wenn Obstacle, dann...

Habit Stacking:
- "Nach dem Kaffee meditiere ich"
- Verknüpfung von Habits
- Sequenz-Tracking
```

---

## Phase 5: Gamification
**Zeitraum:** Woche 5  
**Status:** Ausstehend

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| ⭐ XP-System | ⏳ | Punkte für Aktionen |
| 🏅 Badges | ⏳ | Achievements freischalten |
| 📈 Level-System | ⏳ | 10 Level: Beginner → Peak Performer |
| 🏆 Achievements | ⏳ | Spezielle Meilensteine |
| 🎰 Variable Rewards | ⏳ | Zufällige Bonus-XP |
| 📊 Progress Bars | ⏳ | Visuelle Fortschrittsanzeigen |

### XP-Tabelle:
```
Task erledigt:           10 XP
High-Priority Task:      20 XP
Habit erledigt:          15 XP
Streak gehalten:          5 XP
Morning Check-in:         5 XP
Evening Review:          10 XP
Goal Fortschritt 10%:    25 XP
Goal abgeschlossen:     500 XP
```

---

## Phase 6: Advanced
**Zeitraum:** Woche 6-8  
**Status:** Ausstehend

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| 🌐 Web App | ⏳ | Next.js Dashboard |
| 📱 PWA | ⏳ | Installierbar auf Handy |
| 📊 Advanced Analytics | ⏳ | Trends, Korrelationen |
| 🧠 Pattern Recognition | ⏳ | Automatische Muster-Erkennung |
| 📅 Weekly Reviews | ⏳ | Automatische Wochenanalyse |
| 🔄 Data Export | ⏳ | JSON/CSV Export |

---

## Phase 7: Elite Features
**Zeitraum:** Woche 9-12  
**Status:** Ausstehend

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| 🤖 RAG Personal | ⏳ | Persönliche Historie durchsuchbar |
| 🤖 RAG External | ⏳ | Externes Wissen (Bücher, Studien) |
| 🎙️ Voice Memos | ⏳ | Sprach-Journaling |
| 📍 Location Triggers | ⏳ | GPS-basierte Aktionen |
| ⌚ Wearable Integration | ⏳ | Apple Watch, Fitbit, Oura |
| 💰 Financial Stakes | ⏳ | Geld-basierte Accountability |
| 👥 Accountability Partner | ⏳ | Partner-Matching |
| 🏆 Challenges | ⏳ | 30-Tage Challenges |
| 📞 Intervention Calls | ⏳ | Anruf bei Inaktivität |

### RAG Architecture:
```
┌─────────────────────────────────────────────────┐
│                  RAG SYSTEM                     │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │  PERSONAL RAG   │  │  EXTERNAL RAG   │      │
│  │                 │  │                 │      │
│  │ • Check-ins    │  │ • Atomic Habits │      │
│  │ • Learnings    │  │ • Deep Work     │      │
│  │ • Decisions    │  │ • WOOP Studien  │      │
│  │ • Patterns     │  │ • Psychologie   │      │
│  │ • Goals        │  │ • Best Practices│      │
│  └────────┬────────┘  └────────┬────────┘      │
│           │                    │               │
│           └──────────┬─────────┘               │
│                      ▼                         │
│           ┌─────────────────┐                  │
│           │   COACH LLM     │                  │
│           │   (GPT-4o)      │                  │
│           └─────────────────┘                  │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Empfohlene Priorität

```
JETZT (Diese Woche):
1. Tasks CRUD           → Basis für Produktivität
2. Habits CRUD          → Basis für Gewohnheiten
3. Coach AI verbessern  → Personalisierung

NÄCHSTE WOCHE:
4. Foto-Verification    → Accountability
5. Proaktive Reminders  → Nicht ignorierbar
6. Statistiken          → Feedback-Loop

DANACH:
7. Goals CRUD           → Langfristige Planung
8. Psychologie-Features → Elite-Coaching
9. Web App              → Übersicht
10. RAG                 → Deep Personalization
```

---

## 📝 Notizen

- **Tech Stack:** Next.js, Supabase, Grammy, OpenAI
- **Hosting:** Vercel (Web), Hetzner (Bot)
- **Kosten:** ~15-30€/Monat (Supabase Free, OpenAI ~15€, Server ~5€)

---

**Letzte Aktualisierung:** 11. Dezember 2025

