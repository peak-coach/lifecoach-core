# n8n Workflow Dokumentation - Meeting Audio Processing

## Übersicht

Dieses System verarbeitet automatisch Audio-Aufnahmen von Meetings und erstellt:
- Transkripte (Deepgram STT)
- Zusammenfassungen (OpenAI)
- Todos/Aufgaben (OpenAI)
- SeaTable-Einträge für Aufgabenverwaltung

---

## Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WF1_AUTO_TRIGGER                                │
│  (Nextcloud Audio Polling)                                              │
│                                                                         │
│  Cron (15:00) → List Audio → Filter New → Build Payload → Sign HMAC    │
│                                    ↓                                    │
│                          Trigger WF1 Ingest                             │
│                                    ↓                                    │
│                          Move to processed/                             │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            WF1 (MEET-3)                                 │
│  (Audio Ingest & Transkription)                                         │
│                                                                         │
│  Webhook → HMAC Validation → Nonce Check → Extract Metadata             │
│                                    ↓                                    │
│  Create Folders → Download Audio → Deepgram STT → Save Transcript       │
│                                    ↓                                    │
│                            Trigger WF2                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      WF2 (Summarize & Todos)                            │
│                                                                         │
│  Execute Trigger → Read Transcript → Set Paths → OpenAI Request         │
│                                    ↓                                    │
│  Parse LLM Response → Write summary.md → Write todos.json               │
│                                    ↓                                    │
│                         Prepare WF3 Input → Call WF3                    │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      WF3 (Tasks nach SeaTable)                          │
│                                                                         │
│  Execute Trigger → Prepare Paths → Read todos.json → Parse & Validate   │
│                                    ↓                                    │
│  Get SeaTable Token → List Existing Rows → Build UID Index              │
│                                    ↓                                    │
│  For Each Task: Normalize → Create/Update Row → Build Result            │
│                                    ↓                                    │
│  Aggregate Results → Write taskResults.json → Call WF4                  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            WF4 (Debug)                                  │
│  (Optional: Weitere Verarbeitung/Notifications)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Nextcloud Ordnerstruktur

```
Meetings/
├── Audio/                          # Upload-Ordner für neue Audio-Dateien
│   ├── Teammeeting Dezember.m4a    # Neue Dateien hier hochladen
│   └── processed/                  # Verarbeitete Dateien werden hierhin verschoben
│       └── Teammeeting Dezember.m4a
│
├── _nonce-cache/                   # Replay-Schutz (Nonce-Dateien)
│   └── nc-auto-1234567890.json
│
└── 2025/                           # Jahr
    └── 12/                         # Monat
        └── 09 - Teammeeting Dezember/  # Tag - Meeting Name
            ├── raw/
            │   └── original.m4a    # Original Audio-Datei
            └── out/
                ├── transcript.txt  # Deepgram Transkript
                ├── summary.md      # OpenAI Zusammenfassung
                ├── todos.json      # Extrahierte Aufgaben
                ├── taskResults.json # SeaTable Sync-Ergebnis
                └── meta.json       # Metadaten
```

---

## Workflow Details

### WF1_AUTO_TRIGGER (Nextcloud Audio Polling)

**Zweck:** Erkennt neue Audio-Dateien und triggert die Verarbeitung

**Trigger:** Cron (täglich 15:00) oder manuell

**Wichtige Nodes:**

| Node | Funktion |
|------|----------|
| `List Audio Folder` | WebDAV: Listet `Meetings/Audio/` |
| `Filter New Files` | Filtert Verzeichnisse und bereits verarbeitete Dateien |
| `Build Payload` | Erstellt Meeting-Objekt mit slug, title, datetime |
| `Sign HMAC` | Signiert Request mit HMAC-256 |
| `Trigger WF1 Ingest` | HTTP Request an WF1 Webhook |
| `Move to processed/` | Verschiebt Datei nach `processed/` |

**Datenstruktur (Build Payload Output):**
```json
{
  "meeting": {
    "slug": "2025/12/09 - Teammeeting Dezember",
    "title": "Teammeeting Dezember",
    "datetime": "2025-12-09T15:00:00.000Z",
    "language": "de"
  },
  "audioUrl": "https://...",
  "filePath": "Meetings/Audio/Teammeeting Dezember.m4a",
  "source": "nextcloud-auto"
}
```

---

### WF1 (MEET-3) - Audio Ingest

**Zweck:** Lädt Audio, transkribiert mit Deepgram, speichert Ergebnisse

**Trigger:** Webhook (von WF1_AUTO_TRIGGER)

**Wichtige Nodes:**

| Node | Funktion |
|------|----------|
| `Extract Headers & Body1` | Parst Webhook-Request |
| `Compute HMAC` | Validiert HMAC-Signatur |
| `Check Nonce Exists1` | Replay-Schutz |
| `Extract & Validate Metadata1` | Extrahiert Meeting-Infos, erstellt Pfade |
| `Create Meeting Folder` | Erstellt Ordnerstruktur in Nextcloud |
| `Download Audio (for STT)` | WebDAV Download der Audio-Datei |
| `Call Deepgram STT1` | Speech-to-Text API |
| `Save transcript.txt` | Speichert Transkript in Nextcloud |
| `Trigger WF2` | Ruft WF2 auf (Execute Workflow) |

**Wichtige Datenfelder:**
```json
{
  "meeting": { "slug", "title", "datetime", "language" },
  "meta": { "source", "fileType", "fileExtension" },
  "paths": {
    "root": "/Meetings/2025/12/09 - Teammeeting Dezember/",
    "transcript": ".../out/transcript.txt",
    "raw": ".../raw/",
    "out": ".../out/"
  }
}
```

---

### WF2 (Summarize & Todos)

**Zweck:** Erstellt Zusammenfassung und extrahiert Todos mit OpenAI

**Trigger:** Execute Workflow (von WF1)

**Wichtige Nodes:**

| Node | Funktion |
|------|----------|
| `Set Paths1` | Setzt alle Pfade inkl. `meeting_id` |
| `Read transcript.txt1` | Liest Transkript aus Nextcloud |
| `OpenAI Structured Outputs1` | LLM-Aufruf für Summary + Todos |
| `Parse LLM Response1` | Parst JSON-Antwort |
| `Write summary.md1` | Speichert Zusammenfassung |
| `Write todos.json1` | Speichert Todos |
| `Prepare WF3 Input1` | Bereitet Daten für WF3 vor |
| `Call WF3` | Execute Workflow |

**meeting_id Expression (in Set Paths1):**
```javascript
{{ $json.meeting && $json.meeting.title ? $json.meeting.title : '' }}
```

**OpenAI Output Format:**
```json
{
  "summary_md": "## Zusammenfassung...",
  "todos": {
    "todos": [
      {
        "uid": "todo-1",
        "title": "Aufgabe XY",
        "description": "...",
        "assignee": "Max Mustermann",
        "due": "2025-12-15",
        "priority": "high",
        "status": "open"
      }
    ]
  }
}
```

---

### WF3 (Tasks nach SeaTable)

**Zweck:** Synchronisiert Todos mit SeaTable (Upsert)

**Trigger:** Execute Workflow (von WF2)

**Wichtige Nodes:**

| Node | Funktion |
|------|----------|
| `Prepare Paths1` | Berechnet alle Pfade |
| `Read todos.json (WebDAV)1` | Liest Todos aus Nextcloud |
| `Parse & Validate todos.json1` | Validiert UTS-v2 Format |
| `Get SeaTable Access Token1` | Holt API Token |
| `List Existing Rows` | Pagination über bestehende Einträge |
| `Build UID Index1` | Mappt todo_id → row_id |
| `Normalize Task & Map Fields1` | Konvertiert zu SeaTable-Format |
| `Create Row (POST)1` / `Update Row (PUT)1` | Upsert |
| `Write taskResults.json` | Speichert Sync-Ergebnis |

**SeaTable Tabelle: `todos_v1`**

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `todo_id` | String | Eindeutige ID aus todos.json |
| `meeting_id` | String | Meeting-Name (Audio-Dateiname) |
| `who` | String | Zugewiesene Person |
| `what` | String | Aufgabentitel |
| `due` | Date | Fälligkeitsdatum |
| `status` | Single Select | `todo`, `done` |
| `created_at` | Date | Erstellungsdatum |

---

## Bekannte Issues & Fixes

### 1. Expression-Modus in n8n
- Wenn Feld im Expression-Modus ist: `{{ ... }}` (ohne `=`)
- Wenn Feld im Fixed-Modus ist: `={{ ... }}` (mit `=`)
- **Fehler:** `=/Meetings/...` (doppeltes `=`)

### 2. Datenfluss zwischen Nodes
Daten können nach HTTP Requests verloren gehen. Lösung: Direkt auf frühere Nodes referenzieren:
```javascript
{{ $node["Set Paths1"].json.meeting_id }}
// statt
{{ $json.meeting_id }}
```

### 3. Optional Chaining
n8n unterstützt `?.` nicht. Stattdessen:
```javascript
// Falsch:
{{ $json.meeting?.title }}

// Richtig:
{{ $json.meeting && $json.meeting.title ? $json.meeting.title : '' }}
```

### 4. WebDAV Pfade
Pfade sollten relativ sein (ohne führendes `/`):
```
Meetings/Audio/file.m4a  ✅
/Meetings/Audio/file.m4a ❌ (kann Probleme machen)
```

---

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|--------------|
| `HMAC_SECRET` | Shared Secret für HMAC-Signierung |
| `NC_SHARE_ID` | Nextcloud Public Share ID (falls URL-basiert) |
| `WEBDAV_BASE_URL` | WebDAV Basis-URL |
| `WF1_INGEST_URL` | Webhook-URL von WF1 |

---

## Credentials in n8n

| Name | Typ | Verwendet für |
|------|-----|---------------|
| `WebDAV account` | WebDAV | Nextcloud Dateioperationen |
| `NextCloud account` | Nextcloud | Alternative Nextcloud-Operationen |
| `Deepgram API` | Header Auth | Speech-to-Text |
| `OpenAI` | API Key | LLM für Summary/Todos |
| `SeaTable` | API Token | Aufgabenverwaltung |

---

## Erweiterungsmöglichkeiten

1. **Email-Benachrichtigung:** In WF4 bei neuen Todos
2. **Slack-Integration:** Todos an Slack-Channel posten
3. **Kalender-Integration:** Deadlines in Kalender eintragen
4. **Dashboard:** Statistiken über Meetings/Todos
5. **Multi-Language:** Automatische Spracherkennung

---

## Dateien im Repository

```
n8n/
├── WF1_MEET-3.json           # Haupt-Ingest Workflow
├── WF1_AUTO_TRIGGER.json     # Nextcloud Polling
├── WF 2.json                 # Summarize & Todos
├── WF 3.json                 # SeaTable Sync
└── ...
```

---

## Troubleshooting

### Workflow stoppt bei "Filter New Files"
- Keine neuen Audio-Dateien in `Meetings/Audio/`
- Dateien bereits in `processed/`

### meeting_id ist leer
- Expression in WF2 "Set Paths1" prüfen
- `$json.meeting.title` verwenden

### SeaTable schreibt nicht
- API Token gültig?
- Tabelle `todos_v1` existiert?
- Spaltentypen korrekt?

### Deepgram 415 Error
- Audio als Binary senden, nicht URL
- Content-Type: `audio/mp4` setzen

---

## Kontakt

System eingerichtet für: Montage GmbH (3 Mitarbeiter)
Erstellt: Dezember 2025

