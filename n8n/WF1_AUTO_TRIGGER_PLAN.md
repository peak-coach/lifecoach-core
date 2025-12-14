# WF1 Auto-Trigger Plan

## Ziel
WF1 soll automatisch starten, wenn eine Audio-Datei in `Meetings/Audio` hochgeladen wird.

## Aktueller Zustand
- WF1 startet über **Webhook** (`POST /wf1/ingest`)
- Erwartet JSON-Body mit:
  - `meeting` (slug, title, datetime, etc.)
  - Optional: `audioUrl` oder Audio-Datei als Binary
- Validiert HMAC, Timestamp, Nonce

## Lösungsoptionen

### Option 1: Scheduled Polling (EMPFOHLEN)

**Wie es funktioniert:**
- n8n Cron-Trigger prüft regelmäßig (z.B. alle 2-5 Minuten) den `Meetings/Audio` Ordner
- Erkennt neue/unverarbeitete Audio-Dateien
- Extrahiert Metadaten aus Dateiname oder Meta-JSON
- Startet WF1-Verarbeitung

**Vorteile:**
- ✅ Funktioniert immer (keine Nextcloud-Konfiguration nötig)
- ✅ Zuverlässig
- ✅ Einfach zu implementieren

**Nachteile:**
- ❌ Kurze Verzögerung (2-5 Minuten)
- ❌ Läuft regelmäßig auch ohne neue Dateien

**Umsetzung:**
1. Neuer Workflow "WF1-Auto-Trigger" mit:
   - Cron-Trigger (z.B. alle 2 Minuten)
   - WebDAV: Liste Dateien in `Meetings/Audio`
   - Filter: Nur neue Dateien (nach Timestamp oder Markierung)
   - Code-Node: Extrahiere Metadaten aus Dateiname/Meta
   - Starte WF1-Verarbeitung

### Option 2: Nextcloud Webhook

**Wie es funktioniert:**
- Nextcloud sendet Webhook bei Datei-Upload
- n8n empfängt Webhook mit Datei-Info
- Startet WF1-Verarbeitung

**Vorteile:**
- ✅ Sofortiger Trigger (keine Verzögerung)
- ✅ Effizienter

**Nachteile:**
- ❌ Nextcloud muss Webhooks unterstützen
- ❌ Zusätzliche Konfiguration in Nextcloud

### Option 3: Hybrid (Polling + Webhook)

- Webhook für sofortige Verarbeitung
- Scheduled als Fallback für verpasste Events

## Offene Fragen

### 1. Metadaten-Quelle
Wie werden Meeting-Metadaten übermittelt?

**Option A: Dateiname**
```
Format: YYYY-MM-DD_Meeting-Titel_optional-info.mp3
Beispiel: 2025-11-23_Kickoff-Testkunde_de.mp3
```

**Option B: Meta-JSON-Datei**
```
audio.mp3
audio.meta.json:
{
  "meeting": {
    "slug": "2025-11-23 - Kickoff Testkunde",
    "title": "Kickoff Testkunde",
    "datetime": "2025-11-23T13:00:00Z",
    "language": "de"
  }
}
```

**Option C: Ordnerstruktur**
```
Meetings/
  └── 2025-11-23 - Kickoff Testkunde/
      ├── audio.mp3
      └── (optional meta.json)
```

### 2. Verarbeitungs-Status
Wie wird verhindert, dass die gleiche Datei mehrfach verarbeitet wird?

**Option A: Datei verschieben**
- Nach Verarbeitung: `Meetings/Audio/processed/audio.mp3`

**Option B: Markierung**
- `.processed` Datei erstellen
- Oder Datei umbenennen: `audio.mp3.processed`

**Option C: Datenbank/Log**
- Liste verarbeiteter Dateien speichern
- Prüfe vor Verarbeitung

### 3. HMAC-Validierung
Bei automatischem Trigger gibt es keinen HTTP-Request mit HMAC.

**Option A: HMAC weglassen**
- Nur bei automatischem Trigger
- Webhook-Variante behält HMAC

**Option B: HMAC-Ersatz**
- Signatur-basiert auf Datei-Metadaten
- Oder API-Key statt HMAC

## Empfohlene Implementierung

### Phase 1: Scheduled Polling
1. Neuer Workflow "WF1-Auto-Trigger"
2. Cron-Trigger alle 2-5 Minuten
3. Prüfe `Meetings/Audio` auf neue Dateien
4. Extrahiere Metadaten (Format noch zu klären)
5. Starte WF1-Verarbeitung (ohne HMAC-Validierung)

### Phase 2: Metadaten-Standard definieren
- Dateiname-Format ODER Meta-JSON
- Dokumentation erstellen

### Phase 3: Status-Tracking
- Verhindere Doppel-Verarbeitung
- Log/Verzeichnis für verarbeitete Dateien

## Nächste Schritte

1. ✅ Metadaten-Format festlegen (Dateiname vs. Meta-JSON vs. Ordnerstruktur)
2. ✅ Verarbeitungs-Status-Strategie wählen
3. ✅ HMAC-Strategie für Auto-Trigger klären
4. ✅ Workflow "WF1-Auto-Trigger" erstellen

