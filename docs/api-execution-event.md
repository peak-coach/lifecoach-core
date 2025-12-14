# API – POST /execution/event

## 1. Zweck des Endpoints

**Kurzbeschreibung:**
- Dieser Endpoint erfasst Execution-Events für Tagesplan-Blöcke.
- Er wird im Execution Tracking Workflow (LC-WF3) von n8n verwendet.
- Ziel: Aktionen wie "Block gestartet", "Block erledigt", "Block übersprungen" zu tracken.

---

## 2. Endpoint-Übersicht

- **Methode:** POST
- **Pfad:** `/execution/event`
- **Content-Type:** `application/json`
- **Auth:** aktuell keine (nur interner Gebrauch; später optional API-Key/JWT)

---

## 3. Request

### 3.1 Struktur

**Felder:**

- `date` (string, Pflicht)
  - Format: `YYYY-MM-DD`
  - Das Datum des Tages, zu dem das Event gehört.

- `blockId` (string, Pflicht)
  - Die ID des Blocks aus dem Tagesplan (z.B. `block-0`, `block-1`).

- `action` (string, Pflicht)
  - Art der Aktion. Mögliche Werte:
    - `started` – Block wurde begonnen
    - `completed` – Block wurde abgeschlossen
    - `skipped` – Block wurde übersprungen
    - `paused` – Block wurde pausiert

- `timestamp` (string, optional)
  - ISO-8601 Zeitstempel des Events.
  - Falls nicht angegeben, wird der Server-Zeitpunkt verwendet.

- `notes` (string, optional)
  - Optionale Notizen zum Event.

### 3.2 Beispiel-Request

```json
{
  "date": "2025-11-28",
  "blockId": "block-1",
  "action": "completed",
  "timestamp": "2025-11-28T10:45:00.000Z"
}
```

---

## 4. Response

### 4.1 Struktur

**Top-Level:**

- `success` (boolean)
  - `true`, wenn das Event erfolgreich verarbeitet wurde.

- `event` (object)
  - Echo der verarbeiteten Event-Daten:
    - `date` (string)
    - `blockId` (string)
    - `action` (string)
    - `processedAt` (string, ISO-8601)

- `nextSuggestedAction` (string, optional)
  - Optionaler Vorschlag für die nächste Aktion (z.B. "Start next block", "Take a break").

### 4.2 Beispiel-Response

```json
{
  "success": true,
  "event": {
    "date": "2025-11-28",
    "blockId": "block-1",
    "action": "completed",
    "processedAt": "2025-11-28T10:45:12.502Z"
  },
  "nextSuggestedAction": "Take a 15-minute break before starting the next focus block."
}
```

---

## 5. Fehlerfälle

- **400 – Bad Request**
  - Wenn `date`, `blockId` oder `action` fehlt.
  - Wenn `date` kein gültiges Datum ist.

- **422 – Validation Error**
  - Wenn `action` keinen der erlaubten Werte hat.
  - Wenn Feldtypen nicht stimmen.

- **500 – Internal Server Error**
  - Unerwarteter Fehler bei der Verarbeitung.

---

## 6. Verwendung in n8n (LC-WF3 – Execution Tracking)

1. User klickt in Telegram auf einen Button (z.B. "Block erledigt").
2. n8n empfängt den Telegram-Callback.
3. n8n extrahiert `blockId` und `action` aus den Callback-Daten.
4. n8n sendet `POST /execution/event` an die LifeCoach API.
5. n8n aktualisiert basierend auf der Response ggf. Notion und sendet Bestätigung an Telegram.

