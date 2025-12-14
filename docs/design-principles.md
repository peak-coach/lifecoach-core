# LifeCoach – Design-Prinzipien

## 1. Architekturgrundsatz

- Kernarchitektur:
  - LifeCoach Core API (Node.js + TypeScript)
  - n8n als Orchestrator für Trigger und Integrationen
  - Notion als operatives Backend (Ziele, Projekte, Tasks, Daily Log, Prinzipien)
  - Telegram als Hauptinterface
  - Web-Dashboard (Next.js) in späterer Phase

- Ziel:
  - Saubere Trennung von:
    - Logik (API),
    - Orchestrierung/Integrationen (n8n),
    - Daten (Notion),
    - UI (Telegram, später Web).
  - System soll von Anfang an so gebaut sein, dass es später für mehrere Nutzer (Produkt) erweiterbar ist.

## 2. Thin n8n, Fat API

- n8n:
  - Kümmert sich um:
    - Trigger (Cron, Telegram, Webhooks)
    - Integrationen (Notion lesen/schreiben, Telegram senden/empfangen)
    - Aufruf der LifeCoach Core API per HTTP
  - Enthält so wenig Business-Logik wie möglich.
  - Keine komplexen If/Else-Bäume, kein „Mini-Backend“ in n8n.

- LifeCoach Core API:
  - Enthält die eigentliche Business-Logik:
    - Tagesplanung (Day Planner)
    - Entscheidungslogik (Decision)
    - Review & Learning
    - Umgang mit LLMs und (später) RAG
  - Bietet klare, stabile Endpunkte, die:
    - von n8n,
    - später vom Web-Dashboard,
    - und ggf. anderen Clients genutzt werden können.

## 3. Agenten als Services

- Agenten werden als Services in der API modelliert, z. B.:
  - `DayPlannerService`
  - `ReviewLearningService`
  - `DecisionService`
  - (später) `MasterCoachService`

- Jeder Service:
  - Nimmt klar definierte JSON-Kontexte entgegen (Tasks, Ziele, Daily Log, Prinzipien).
  - Ruft das LLM über einen sauberen Prompt an.
  - Gibt strukturierte Antworten zurück (z. B. Tagesplan-Blöcke, Empfehlungen, Auswertungen).

- Vorteile:
  - Agenten-Verhalten kann getestet, angepasst und pro User konfiguriert werden.
  - LLM-Provider können später gewechselt oder kombiniert werden.

## 4. RAG und Datenhaltung

- Phase 1:
  - Notion ist die Source of Truth für:
    - Ziele, Projekte, Tasks
    - Daily Logs (Plan + Feedback)
    - Prinzipien & Notizen
  - Keine eigene Business-Datenbank notwendig.
  - Postgres (falls vorhanden) wird höchstens für Logs oder technische Daten genutzt.

- Phase 2+:
  - RAG wird eingeführt, basierend auf Inhalten aus „LC – Principles & Notes“ (und ggf. weiteren Quellen).
  - Vektor-Speicher kann z. B.:
    - pgvector in Postgres,
    - oder eine dedizierte Vektor-DB sein.
  - RAG-Zugriff passiert ausschließlich über die LifeCoach Core API (eigene Services/Endpunkte).

## 5. Produktfähigkeit von Anfang an

- Das System wird so entwickelt, dass es später zu einem Produkt ausgebaut werden kann:
  - Saubere API-Grenzen
  - Versionierung (Git, n8n-JSON-Exports)
  - Trennung zwischen persönlicher Nutzung und späterer Multi-User-Nutzung

- Strategie:
  - Zuerst nutze ich das System selbst („User 0“ / Alpha-Version).
  - Wenn der tägliche Ablauf stabil ist (Planung + Review funktionieren), werden:
    - Prompts verfeinert,
    - Kosten optimiert,
    - und produktrelevante Themen (Onboarding, Rollen, Sicherheit) ergänzt.

## 6. Einfach vor fancy

- Bevor komplexe Features gebaut werden (z. B. viele Agenten, RAG, Gamification):
  - Fokus zuerst auf:
    - stabiler Tagesplanung,
    - sauberem Tracking,
    - ehrlichem Review.
- Regel:
  - Erst wenn der Kern (Plan → Ausführen → Review) sich im Alltag bewährt,
    werden „nice to have“-Features angefasst.
