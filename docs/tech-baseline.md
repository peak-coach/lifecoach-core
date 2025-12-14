# LifeCoach – Technische Basis

## Runtime & Sprache

- Backend:
  - Node.js (LTS, z. B. 20 oder 22)
  - TypeScript
  - Framework: Fastify
  - Package-Manager: npm

## Projektstruktur (Repo)

- Root:
  - `backend/`        → LifeCoach Core API (Node/TS)
  - `n8n/`            → JSON-Exports der LC-Workflows
  - `docs/`           → Architektur, Flows, Design-Prinzipien, Tech-Notizen, Prompts

## Hosting & Infrastruktur (Zielbild)

- VPS (z. B. Hetzner, bestehender Server):
  - Docker-Compose-Stack mit:
    - Service `lifecoach-api` (Node/TS)
    - Service `n8n`
    - optional Service `postgres` (für Logs / später RAG)
- Zugriff:
  - Reverse Proxy (z. B. Caddy oder Nginx) vor `lifecoach-api` und `n8n`.

## LLM-Provider-Strategie

- Phase 1:
  - Externer Provider als Default (z. B. OpenAI).
- API enthält eine Abstraktionsschicht:
  - ENV-Variablen wie:
    - `LLM_PROVIDER` (z. B. `openai`)
    - `OPENAI_API_KEY` (oder generischer Key-Name)
- Später:
  - Optionale Anbindung lokaler Modelle (Ollama etc.).
  - Option, pro Service unterschiedliche Modelle zu nutzen (z. B. günstigeres Modell für einfache Aufgaben).

## Konfiguration & Secrets

- Alle sensiblen Daten werden über Environment-Variablen gesteuert:
  - `NOTION_API_KEY`
  - `NOTION_DB_TASKS_ID`
  - `NOTION_DB_DAILYLOG_ID`
  - `NOTION_DB_AREAS_ID`
  - `NOTION_DB_PRINCIPLES_ID`
  - `TELEGRAM_BOT_TOKEN`
  - `LLM_PROVIDER`
  - `OPENAI_API_KEY` (oder ähnliches)
  - `LIFECOACH_API_BASE_URL`
- Im Repo liegt eine `.env.example` mit allen benötigten Keys, aber ohne echte Werte.

## Entscheidungen, die später kommen

- Konkrete Modellwahl pro Use Case (Day Planner, Review, Decision).
- RAG-Implementierung:
  - ob pgvector in Postgres, oder separate Vektor-DB.
- CI/CD-Pipeline:
  - automatisches Deployment auf den VPS (z. B. via GitHub Actions).
