# API – POST /plan/day

## 1. Zweck des Endpoints

**Kurzbeschreibung:**
- Dieser Endpoint erzeugt einen strukturierten Tagesplan für ein bestimmtes Datum.
- Er wird hauptsächlich im Morning-Workflow (LC-WF2 – Morning Day Plan) von n8n verwendet.
- Ziel: Aus einer Menge von Tasks für „heute“ eine Abfolge von Tagesblöcken (Focus, Pausen, Routinen) zu bauen, die später in Notion gespeichert und per Telegram angezeigt werden kann.

---

## 2. Endpoint-Übersicht

- **Methode:** POST
- **Pfad:** `/plan/day`
- **Content-Type:** `application/json`
- **Auth:** aktuell keine (nur interner Gebrauch; später optional API-Key/JWT)

---

## 3. Request

### 3.1 Struktur (in Worten)

Der Request beschreibt:
- das Datum, für das der Plan erstellt werden soll,
- und eine Liste von Tasks, die für diesen Tag zur Verfügung stehen.

**Felder:**

- `date` (string, Pflicht)
  - Format: `YYYY-MM-DD`
  - Das Datum des Tages, für den der Plan erstellt werden soll.

- `tasks` (Array, Pflicht, kann aber leer sein)
  - Liste der Tasks, die für die Planung in Frage kommen.
  - Jedes Task-Objekt:

    - `id` (string, Pflicht)
      - Interne ID des Tasks (kann später z. B. die Notion-Task-ID sein).
    - `title` (string, Pflicht)
      - Titel / Kurzbeschreibung des Tasks.
    - `priority` (string, optional, aber empfohlen)
      - z. B. `low`, `medium`, `high` (später Mapping auf P0/P1/P2 möglich).
    - `estimatedMinutes` (number, optional)
      - Geschätzte Dauer in Minuten.

### 3.2 Beispiel-Request (JSON)

```json
{
  "date": "2025-11-28",
  "tasks": [
    {
      "id": "task-1",
      "title": "Führerschein lernen Theorie",
      "priority": "high",
      "estimatedMinutes": 60
    },
    {
      "id": "task-2",
      "title": "Training: Kraft & Mobility",
      "priority": "medium",
      "estimatedMinutes": 45
    }
  ]
}
4. Response
4.1 Struktur (in Worten)
Die Antwort enthält:

Ein Erfolgs-Flag (success),

das Plan-Objekt (plan) mit:

Datum,

einer Liste von Blöcken (blocks[]),

einer textuellen Zusammenfassung (summary),

einem Erstellungszeitpunkt (createdAt).

Top-Level:

success (boolean)

true, wenn der Plan erfolgreich erstellt wurde.

plan (object)

date (string)

Datum des Plans (sollte dem Request-date entsprechen).

blocks (Array)

Liste der geplanten Tagesblöcke (Zeitblöcke mit Typ, Titel usw.).

summary (string)

Kurze Zusammenfassung des erstellten Tagesplans.

createdAt (string, ISO-8601)

Zeitpunkt, wann der Plan erzeugt wurde (z. B. 2025-11-28T17:28:14.502Z).

Jeder Block in blocks[]:

id (string)

Interne Block-ID, z. B. block-0, block-1, …

startTime (string)

Startzeit im Format HH:MM (24-Stunden-Format).

endTime (string)

Endzeit im Format HH:MM.

type (string)

Typ des Blocks, z. B.:

routine (z. B. Morning Routine, Evening Review)

focus (fokussierte Arbeitszeit / Task)

break (Pause)

taskId (string, optional)

Verweist auf das entsprechende Task-id aus dem Request,

nur gesetzt, wenn der Block direkt einem Task zugeordnet ist (z. B. Focus-Blöcke).

title (string)

Titel des Blocks (Task-Titel oder generischer Titel wie „Morning Routine“).

description (string, optional)

Zusätzliche Beschreibung/Anweisung (besonders für Routinen oder Pausen).

4.2 Beispiel-Response (JSON)
json
Code kopieren
{
  "success": true,
  "plan": {
    "date": "2025-11-28",
    "blocks": [
      {
        "id": "block-0",
        "startTime": "08:00",
        "endTime": "09:00",
        "type": "routine",
        "title": "Morning Routine",
        "description": "Start the day with intention"
      },
      {
        "id": "block-1",
        "startTime": "09:00",
        "endTime": "10:00",
        "type": "focus",
        "taskId": "task-1",
        "title": "Führerschein lernen Theorie"
      },
      {
        "id": "block-2",
        "startTime": "10:00",
        "endTime": "10:15",
        "type": "break",
        "title": "Short Break",
        "description": "Rest and recharge"
      },
      {
        "id": "block-3",
        "startTime": "11:00",
        "endTime": "12:00",
        "type": "focus",
        "taskId": "task-2",
        "title": "Training: Kraft & Mobility"
      },
      {
        "id": "block-4",
        "startTime": "12:00",
        "endTime": "12:15",
        "type": "break",
        "title": "Short Break",
        "description": "Rest and recharge"
      },
      {
        "id": "block-5",
        "startTime": "20:00",
        "endTime": "20:30",
        "type": "routine",
        "title": "Evening Review",
        "description": "Reflect on the day and prepare for tomorrow"
      }
    ],
    "summary": "Day plan for 2025-11-28: 2 tasks scheduled, 1 high priority. Focus on completing your most important work during morning hours.",
    "createdAt": "2025-11-28T17:28:14.502Z"
  }
}
5. Fehlerfälle (geplant)
Noch nicht implementiert, aber geplant:

400 – Bad Request

z. B. wenn date fehlt oder kein gültiges Datum ist.

422 – Validation Error

z. B. wenn tasks kein Array ist oder erforderliche Felder in einem Task fehlen.

500 – Internal Server Error

Unerwarteter Fehler in der Business-Logik oder (später) im LLM-Aufruf.

Wenn Validation & Fehlerhandling in der API ergänzt werden, werden diese Fälle hier konkretisiert.

6. Verwendung in n8n (LC-WF2 – Morning Day Plan)
n8n lädt aus der Notion-Datenbank LC – Tasks:

alle Tasks mit Status = Heute (und optional Due = heute oder leer).

n8n baut daraus einen JSON-Body:

date: heutiges Datum im Format YYYY-MM-DD

tasks[]: Liste aus Notion, gemappt auf:

id

title

priority

estimatedMinutes

n8n sendet diesen Body per HTTP-Request-Node an POST /plan/day.

n8n nimmt die blocks[]-Liste aus der Response und:

schreibt die Plan-Informationen in LC – Daily Log (Relationen auf Tasks + Zusatzfelder),

baut daraus den Text für eine Telegram-Nachricht (Tagesplan),

erzeugt pro Block Buttons (z. B. für Start/Fertig), die später in LC-WF3 (Execution Tracking) verwendet werden.