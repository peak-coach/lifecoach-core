# LifeCoach Core API – Übersicht

## Base URL

- **Development:** `http://localhost:3000`
- **Production:** `https://api.lifecoach.example.com` (Platzhalter)

## Authentication

Aktuell keine Authentifizierung erforderlich (nur interner Gebrauch).  
Später geplant: API-Key oder JWT-basierte Authentifizierung.

---

## Endpoints

| Methode | Pfad | Beschreibung | Spec |
|---------|------|--------------|------|
| GET | `/health` | Health Check | - |
| POST | `/plan/day` | Tagesplan generieren | [api-plan-day.md](./api-plan-day.md) |
| POST | `/execution/event` | Execution Event tracken | [api-execution-event.md](./api-execution-event.md) |
| POST | `/review/day` | Tages-Review generieren | [api-review-day.md](./api-review-day.md) |

---

## GET /health

**Beschreibung:** Health Check für Container-Orchestrierung und Monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T10:00:00.000Z",
  "version": "0.1.0",
  "uptime": 3600
}
```

---

## POST /plan/day

**Beschreibung:** Generiert einen strukturierten Tagesplan aus einer Liste von Tasks.

**Request:**
```json
{
  "date": "2025-11-28",
  "tasks": [
    {
      "id": "task-1",
      "title": "Projekt planen",
      "priority": "high",
      "estimatedMinutes": 60
    }
  ]
}
```

**Response:** Siehe [api-plan-day.md](./api-plan-day.md)

---

## POST /execution/event

**Beschreibung:** Erfasst ein Execution-Event für einen Tagesplan-Block.

**Request:**
```json
{
  "date": "2025-11-28",
  "blockId": "block-1",
  "action": "completed"
}
```

**Response:** Siehe [api-execution-event.md](./api-execution-event.md)

---

## POST /review/day

**Beschreibung:** Generiert einen Tages-Review mit Summary und Reflexionsfragen.

**Request:**
```json
{
  "date": "2025-11-28",
  "daySummary": {
    "plannedBlocks": 6,
    "completedBlocks": 4
  },
  "mood": 7,
  "energy": 6
}
```

**Response:** Siehe [api-review-day.md](./api-review-day.md)

---

## Error Responses

Alle Endpoints liefern einheitliche Error-Responses:

### 400 – Bad Request
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Missing required field: date"
}
```

### 422 – Validation Error
```json
{
  "statusCode": 422,
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    { "field": "date", "message": "Date must be in YYYY-MM-DD format" }
  ]
}
```

### 500 – Internal Server Error
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

