# LifeCoach – Architektur (High Level)

## Ziel des Systems

- Persönliches Life-OS, das mir hilft:
  - meine Ziele (Führerschein, Business, Skills, Training, Persönlichkeitsentwicklung) in konkrete Tages-/Wochenpläne zu übersetzen,
  - im Alltag dranzubleiben (Tracking, Review, Anpassung),
  - später als Produkt erweitert werden zu können.
- System soll möglichst viel automatisieren (Planung, Erinnerungen, Auswertung), ich übernehme:
  - Ziele setzen,
  - Prioritäten,
  - finale Entscheidungen.

---

## Haupt-Komponenten

1. **Notion (Daten-Backend)**
   - Speichert:
     - Ziele, Bereiche, Projekte
     - Aufgaben / Tasks
     - Daily Log (Tagesplan + Feedback)
     - Prinzipien & Notizen (später für RAG)
   - Notion ist in Phase 1 die „Single Source of Truth" für Inhalte.

2. **LifeCoach Core API (Node.js + TypeScript)**
   - Läuft als REST-API (Fastify) in `backend/`.
   - Verantwortlich für:
     - Tagesplanung (Day Planner Logik)
     - Execution Tracking
     - Tages-Review & Learnings
     - Kommunikation mit LLMs (z. B. OpenAI, später auch lokale Modelle)
     - (später) RAG-Zugriff auf „Principles & Notes"
   - Wird sowohl von n8n als auch später von einem Web-Dashboard genutzt.

3. **n8n (Orchestrierung)**
   - Kümmert sich um:
     - Zeit-Trigger (Cron: Morgen-Plan, Abend-Review)
     - Integrationen:
       - Notion lesen / schreiben
       - LifeCoach API aufrufen (HTTP)
       - Telegram-Nachrichten senden / empfangen
   - Enthält die Kern-Workflows:
     - LC-WF1 – Ingest (später: Prinzipien/Ziele ins RAG bringen)
     - LC-WF2 – Morning Day Plan
     - LC-WF3 – Execution Tracking
     - LC-WF4 – Evening Review
     - LC-WF5 – Learning / Auswertung

4. **Telegram-Bot (Interface)**
   - Hauptschnittstelle im Alltag:
     - Morgendlicher Tagesplan (Plan anzeigen, Buttons)
     - Aktionen tagsüber (Start/Skip/Snooze von Blöcken)
     - Abendlicher Check-in (Stimmung, Feedback, Learnings)
   - Kommuniziert über n8n mit der LifeCoach Core API.

5. **Web-Dashboard (später)**
   - Geplant als Next.js-App.
   - Dient dazu:
     - Ziele, Fortschritt, Statistiken grafisch anzuzeigen
     - Einstellungen / Konfiguration des Coaches zu ändern
   - Spricht direkt mit der LifeCoach Core API.

---

## API Endpoints

| Methode | Pfad | Beschreibung | Workflow |
|---------|------|--------------|----------|
| GET | `/health` | Health Check | - |
| POST | `/plan/day` | Tagesplan generieren | LC-WF2 |
| POST | `/execution/event` | Block-Event tracken | LC-WF3 |
| POST | `/review/day` | Tages-Review generieren | LC-WF4 |

Detaillierte Dokumentation: [docs/api-overview.md](./api-overview.md)

---

## Services im Docker-Stack

Das System wird über Docker Compose orchestriert:

| Service | Container | Port | Beschreibung |
|---------|-----------|------|--------------|
| `lifecoach-api` | lifecoach-api | 3000 | LifeCoach Core REST-API |
| `postgres` | lifecoach-postgres | 5432 | PostgreSQL (für spätere Phasen) |
| `n8n` (optional) | lifecoach-n8n | 5678 | n8n Workflow-Automation |

---

## Backend-Architektur

```
backend/src/
├── index.ts              # Fastify Entry Point
├── config/
│   └── env.ts            # Typisierte ENV-Validierung
├── schemas/              # Zod Validation Schemas
│   ├── planDay.schema.ts
│   ├── executionEvent.schema.ts
│   ├── reviewDay.schema.ts
│   └── common.schema.ts
├── routes/               # API-Routen
│   ├── health.ts
│   ├── plan.ts
│   ├── execution.ts
│   └── review.ts
├── controllers/          # Request Handler
│   ├── healthController.ts
│   ├── planController.ts
│   ├── executionController.ts
│   └── reviewController.ts
├── services/             # Business Logic ("Agenten")
│   ├── dayPlannerService.ts
│   ├── executionService.ts
│   └── reviewService.ts
├── lib/                  # Utilities
│   ├── logger.ts
│   ├── errors.ts
│   ├── validation.ts
│   └── llmClient.ts
└── types/
    └── index.ts          # Type Re-exports
```

---

## Lokales Setup mit Docker

### Voraussetzungen

- Docker & Docker Compose
- Git

### Schritt-für-Schritt

1. **Repository klonen**:
   ```bash
   git clone <repo-url>
   cd lifecoach-core
   ```

2. **Umgebungsvariablen konfigurieren**:
   ```bash
   cp env.example .env
   # Öffne .env und fülle die Platzhalter aus
   ```

3. **Docker-Stack starten**:
   ```bash
   docker-compose up -d
   ```

4. **Health Check testen**:
   ```bash
   curl http://localhost:3000/health
   ```

### Lokale Entwicklung (ohne Docker)

```bash
cd backend
npm install
npm run dev
```

Der Server startet mit Hot-Reload auf `http://localhost:3000`.

Detaillierte Anleitung: [docs/dev-setup.md](./dev-setup.md)

---

## Datenflüsse

### Morning Day Plan (LC-WF2)

1. n8n Cron (z. B. 07:00) triggert Workflow.
2. n8n liest aus Notion alle Tasks für „Heute".
3. n8n ruft `POST /plan/day` auf mit Datum + Tasks.
4. LifeCoach API erstellt strukturierten Tagesplan.
5. n8n schreibt den Plan ins Notion „Daily Log".
6. n8n sendet den Plan per Telegram (mit Buttons).

### Execution Tracking (LC-WF3)

1. User klickt in Telegram auf Button (z. B. „Block erledigt").
2. n8n empfängt den Telegram-Callback.
3. n8n ruft `POST /execution/event` auf.
4. LifeCoach API verarbeitet das Event.
5. n8n aktualisiert Notion und sendet Bestätigung.

### Evening Review (LC-WF4)

1. n8n Cron (z. B. 20:30) startet Workflow.
2. n8n liest Daily Log + Tasks aus Notion.
3. n8n ruft `POST /review/day` auf.
4. LifeCoach API generiert Summary + Reflexionsfragen.
5. n8n führt Telegram-Dialog und speichert Antworten in Notion.

---

## Phasen (Überblick)

1. **Phase 1 – Core API** ✅
   - Backend-Grundgerüst mit Fastify
   - `/health`, `/plan/day`, `/execution/event`, `/review/day`
   - Zod-basierte Validierung
   - Docker & Docker-Compose

2. **Phase 2 – n8n Workflows**
   - Morning Day Plan Flow
   - Execution Tracking Flow
   - Evening Review Flow

3. **Phase 3 – LLM Integration**
   - LLM-basierte Tagesplanung
   - Intelligente Review-Fragen
   - Personalisierte Vorschläge

4. **Phase 4 – RAG & Knowledge**
   - RAG aus „Principles & Notes"
   - Vektor-DB Integration (pgvector)

5. **Phase 5 – Web-Dashboard**
   - Next.js Frontend
   - Statistiken & Visualisierung
   - Multi-User-Vorbereitung
