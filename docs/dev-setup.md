# LifeCoach Core – Developer Setup

## Voraussetzungen

- **Node.js:** Version 20 oder höher (LTS empfohlen)
- **npm:** Version 10 oder höher
- **Docker & Docker Compose:** Für Container-basiertes Setup
- **Git:** Für Versionskontrolle

## Schnellstart

### 1. Repository klonen

```bash
git clone <repo-url>
cd lifecoach-core
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp env.example .env
```

Öffne `.env` und fülle die Platzhalter aus:

```env
# Pflichtfelder für Entwicklung
PORT=3000
NODE_ENV=development

# Optional (für LLM-Features)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Optional (für Notion-Integration)
NOTION_API_KEY=secret_...
```

### 3. Backend starten

#### Option A: Lokale Entwicklung (empfohlen)

```bash
cd backend
npm install
npm run dev
```

Der Server startet auf `http://localhost:3000` mit Hot-Reload.

#### Option B: Docker Compose

```bash
docker-compose up -d
```

### 4. Health Check testen

```bash
curl http://localhost:3000/health
```

Erwartete Antwort:
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T10:00:00.000Z",
  "version": "0.1.0",
  "uptime": 5
}
```

---

## npm Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet den Server mit Hot-Reload |
| `npm run build` | Kompiliert TypeScript nach `dist/` |
| `npm run start` | Startet den kompilierten Server |
| `npm run lint` | Führt ESLint aus |
| `npm run lint:fix` | Führt ESLint mit Auto-Fix aus |
| `npm run format` | Formatiert Code mit Prettier |
| `npm run typecheck` | Prüft TypeScript-Typen |
| `npm run test` | Führt Tests aus |

---

## Projektstruktur

```
lifecoach-core/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Entry Point
│   │   ├── config/            # Umgebungsvariablen & Konfiguration
│   │   │   └── env.ts         # Typisierte ENV-Validierung
│   │   ├── routes/            # API-Routen
│   │   │   ├── health.ts
│   │   │   ├── plan.ts
│   │   │   ├── execution.ts
│   │   │   └── review.ts
│   │   ├── controllers/       # Request Handler
│   │   ├── services/          # Business Logic
│   │   │   ├── dayPlannerService.ts
│   │   │   ├── executionService.ts
│   │   │   └── reviewService.ts
│   │   ├── schemas/           # Zod Validation Schemas
│   │   ├── lib/               # Utilities
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   ├── validation.ts
│   │   │   └── llmClient.ts
│   │   └── types/             # TypeScript Type Definitions
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── architecture.md
│   ├── api-overview.md
│   ├── api-plan-day.md
│   ├── api-execution-event.md
│   ├── api-review-day.md
│   └── dev-setup.md
├── n8n/                       # n8n Workflow Exports
├── docker-compose.yml
└── env.example
```

---

## API testen

### Day Plan erstellen

```bash
curl -X POST http://localhost:3000/plan/day \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-28",
    "tasks": [
      {"id": "task-1", "title": "Projekt planen", "priority": "high", "estimatedMinutes": 60},
      {"id": "task-2", "title": "Meeting vorbereiten", "priority": "medium", "estimatedMinutes": 30}
    ]
  }'
```

### Execution Event tracken

```bash
curl -X POST http://localhost:3000/execution/event \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-28",
    "blockId": "block-1",
    "action": "completed"
  }'
```

### Day Review generieren

```bash
curl -X POST http://localhost:3000/review/day \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-28",
    "daySummary": {
      "plannedBlocks": 6,
      "completedBlocks": 4,
      "skippedBlocks": 1
    },
    "mood": 7,
    "energy": 6
  }'
```

---

## Docker

### Build

```bash
cd backend
docker build -t lifecoach-api .
```

### Run

```bash
docker run -p 3000:3000 --env-file ../.env lifecoach-api
```

### Docker Compose (Full Stack)

```bash
# Im Root-Verzeichnis
docker-compose up -d

# Logs anzeigen
docker-compose logs -f lifecoach-api

# Stoppen
docker-compose down
```

---

## Troubleshooting

### "Cannot find module" Fehler

```bash
cd backend
rm -rf node_modules
npm install
```

### TypeScript Build Fehler

```bash
npm run typecheck
```

### Port bereits in Verwendung

```bash
# Prozess auf Port 3000 finden
lsof -i :3000

# Prozess beenden
kill -9 <PID>
```

### Docker Container startet nicht

```bash
# Container-Logs prüfen
docker-compose logs lifecoach-api

# Container neu bauen
docker-compose build --no-cache lifecoach-api
```

