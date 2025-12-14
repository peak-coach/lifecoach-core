# LifeCoach – Kern-Flows (MVP)

## Flow 1: Morning Day Plan (LC-WF2)

**Ziel:**  
Aus den geplanten Tasks für heute einen strukturierten Tagesplan erzeugen und per Telegram anzeigen.

### Ablauf (vereinfachte Sicht)

1. **Cron-Trigger (n8n)**
   - Täglich um 07:00 Uhr (Zeitzone: Europe/Berlin).

2. **Notion – Tasks laden**
   - n8n liest aus der Datenbank `LC – Tasks` alle Einträge, bei denen:
     - `Status` = „Heute“
     - `Due` = heutiges Datum oder leer ist.

3. **LifeCoach Core API – Tagesplan erzeugen**
   - n8n ruft `POST /plan/day` auf.
   - Request-Body enthält:
     - `date`: aktuelles Datum
     - `tasks`: Liste der aus Notion geladenen Tasks (inkl. wichtiger Properties)
   - Die API:
     - bereitet den Kontext auf,
     - ruft den DayPlanner-Service (LLM) auf,
     - liefert eine strukturierte Antwort, z. B.:
       - `blocks[]` mit:
         - Startzeit
         - Endzeit
         - Referenz auf den Task
         - kurze Beschreibung.

4. **Notion – Daily Log aktualisieren**
   - n8n findet oder erstellt den Eintrag in `LC – Daily Log` für das aktuelle Datum.
   - Die geplanten Blöcke werden im Daily Log gespeichert (z. B. über Relationen auf Tasks + Zusatzinfos).

5. **Telegram – Tagesplan senden**
   - n8n baut einen lesbaren Nachrichtentext aus den Blöcken.
   - n8n sendet eine Telegram-Nachricht mit:
     - der Plan-Übersicht,
     - Inline-Buttons (z. B. „Starte Tag“, „Umplanen“).

---

## Flow 2: Execution Tracking (LC-WF3)

**Ziel:**  
Aktionen während des Tages (z. B. „Block gestartet“, „Block erledigt“) erfassen und in Notion spiegeln.

### Ablauf (vereinfachte Sicht)

1. **Telegram-Button-Klick**
   - Ich klicke in Telegram auf einen Inline-Button, z. B.:
     - „Block X gestartet“
     - „Block X fertig“.

2. **n8n – Telegram Trigger**
   - Ein n8n-Workflow reagiert auf den Callback (z. B. „LC-WF3 – Execution Tracking“).
   - n8n extrahiert aus den Callback-Daten:
     - `blockId`
     - `action` (z. B. `started`, `completed`).

3. **LifeCoach Core API – Execution Event**
   - n8n ruft `POST /execution/event` in der LifeCoach API auf.
   - Body enthält:
     - `date`
     - `blockId`
     - `action`
   - Die API:
     - interpretiert das Event,
     - entscheidet, was getan werden soll (z. B. Task als „In Progress“ oder „Done“ markieren).

4. **Notion – Update**
   - Entweder:
     - n8n aktualisiert Notion direkt anhand der Antwort der API,
     - oder die API schreibt selbst in Notion (über ihren eigenen Notion-Client).
   - Der Daily Log und ggf. der Task-Status werden angepasst.

5. **Telegram – Bestätigung (optional)**
   - n8n sendet eine kurze Bestätigung („Block gestartet“, „Block erledigt“) an Telegram.

---

## Flow 3: Evening Review (LC-WF4)

**Ziel:**  
Den Tag reflektieren, Feedback einsammeln und Learnings speichern.

### Ablauf (vereinfachte Sicht)

1. **Cron-Trigger (n8n)**
   - Täglich z. B. um 20:30 Uhr.

2. **Notion – Tagesdaten laden**
   - n8n lädt den Eintrag in `LC – Daily Log` für das heutige Datum.
   - Optional: n8n lädt zusätzlich die geplanten und erledigten Tasks (Relationen).

3. **LifeCoach Core API – Review vorbereiten**
   - n8n ruft `POST /review/day` in der LifeCoach API auf.
   - Body enthält:
     - `date`
     - relevante Tagesdaten (z. B. geplante vs. erledigte Tasks, Notizen).
   - Die API:
     - erstellt eine kurze Zusammenfassung des Tages,
     - generiert 2–3 passende Reflexionsfragen (Review-Service).

4. **Telegram – Review-Dialog**
   - n8n sendet:
     - die Zusammenfassung,
     - und nacheinander die Fragen an mich in Telegram.
   - Meine Antworten werden über weitere Telegram-Triggers abgefangen.

5. **Notion – Feedback speichern**
   - n8n schreibt:
     - Mood,
     - Energy,
     - Textantworten (z. B. „Was lief gut?“, „Was will ich morgen anders machen?“)
     in den Daily Log.

6. **Learning (spätere Phase)**
   - Diese gesammelten Daten werden später vom Learning-Service genutzt, um:
     - Muster zu erkennen,
     - die Tagesplanung anzupassen,
     - und langfristig bessere Empfehlungen zu geben.
