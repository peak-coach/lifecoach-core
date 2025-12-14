# API – POST /review/day

## 1. Zweck des Endpoints

**Kurzbeschreibung:**
- Dieser Endpoint bereitet den Abend-Review vor.
- Er wird im Evening Review Workflow (LC-WF4) von n8n verwendet.
- Ziel: Eine Zusammenfassung des Tages erstellen und Reflexionsfragen generieren.

---

## 2. Endpoint-Übersicht

- **Methode:** POST
- **Pfad:** `/review/day`
- **Content-Type:** `application/json`
- **Auth:** aktuell keine (nur interner Gebrauch; später optional API-Key/JWT)

---

## 3. Request

### 3.1 Struktur

**Felder:**

- `date` (string, Pflicht)
  - Format: `YYYY-MM-DD`
  - Das Datum des Tages, der reviewed werden soll.

- `daySummary` (object, optional)
  - Zusammenfassung des Tages:
    - `plannedBlocks` (number) – Anzahl geplanter Blöcke
    - `completedBlocks` (number) – Anzahl erledigter Blöcke
    - `skippedBlocks` (number) – Anzahl übersprungener Blöcke

- `completedTaskIds` (array of strings, optional)
  - IDs der erledigten Tasks.

- `skippedTaskIds` (array of strings, optional)
  - IDs der übersprungenen Tasks.

- `mood` (number, optional)
  - Stimmung auf einer Skala von 1-10.

- `energy` (number, optional)
  - Energielevel auf einer Skala von 1-10.

- `notes` (string, optional)
  - Zusätzliche Notizen zum Tag.

### 3.2 Beispiel-Request

```json
{
  "date": "2025-11-28",
  "daySummary": {
    "plannedBlocks": 6,
    "completedBlocks": 4,
    "skippedBlocks": 1
  },
  "completedTaskIds": ["task-1", "task-2", "task-3"],
  "skippedTaskIds": ["task-4"],
  "mood": 7,
  "energy": 6
}
```

---

## 4. Response

### 4.1 Struktur

**Top-Level:**

- `success` (boolean)
  - `true`, wenn der Review erfolgreich generiert wurde.

- `summary` (string)
  - Textuelle Zusammenfassung des Tages.

- `questions` (array)
  - Liste von 2-3 Reflexionsfragen.
  - Jede Frage enthält:
    - `id` (string) – Eindeutige ID der Frage
    - `question` (string) – Die Frage
    - `type` (string) – Art der Antwort: `text`, `scale`, `choice`
    - `options` (array, optional) – Bei `choice`: mögliche Antworten

- `insights` (array of strings, optional)
  - Optionale Erkenntnisse basierend auf den Tagesdaten.

- `createdAt` (string, ISO-8601)
  - Zeitpunkt der Review-Erstellung.

### 4.2 Beispiel-Response

```json
{
  "success": true,
  "summary": "Today you completed 4 out of 6 planned blocks (67%). You finished 3 tasks and skipped 1. Your energy level was moderate (6/10) with a good mood (7/10).",
  "questions": [
    {
      "id": "q1",
      "question": "What was your biggest win today?",
      "type": "text"
    },
    {
      "id": "q2",
      "question": "What would you do differently tomorrow?",
      "type": "text"
    },
    {
      "id": "q3",
      "question": "How satisfied are you with today's progress?",
      "type": "scale",
      "options": ["1", "2", "3", "4", "5"]
    }
  ],
  "insights": [
    "You tend to be more productive in the morning hours.",
    "Consider shorter focus blocks to maintain energy."
  ],
  "createdAt": "2025-11-28T20:35:00.000Z"
}
```

---

## 5. Fehlerfälle

- **400 – Bad Request**
  - Wenn `date` fehlt oder kein gültiges Datum ist.

- **422 – Validation Error**
  - Wenn Feldtypen nicht stimmen (z.B. `mood` ist kein Number).

- **500 – Internal Server Error**
  - Unerwarteter Fehler bei der Verarbeitung.

---

## 6. Verwendung in n8n (LC-WF4 – Evening Review)

1. n8n Cron triggert den Workflow um 20:30.
2. n8n lädt den Daily Log und Task-Status aus Notion.
3. n8n sendet `POST /review/day` mit den gesammelten Daten.
4. n8n präsentiert Summary und Fragen in Telegram.
5. User-Antworten werden zurück in Notion gespeichert.

