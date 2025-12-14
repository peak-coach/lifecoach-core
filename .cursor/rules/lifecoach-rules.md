# LifeCoach Project Rules

- Always aim for test-driven development:
  - If I ask for a new feature or endpoint, first create or update tests, then implement the code, and run the tests.
- Do not change the overall architecture (folders, main stacks) unless I explicitly request an architecture change.
- Prefer small, incremental changes over big refactors.
- When working with external systems (Notion, n8n, Telegram), always keep configuration and secrets in environment variables, never hard-coded.
- For n8n-related tasks:
  - Prefer using MCP tools (if available) to modify workflows instead of asking me to manually click around.
  - When changing or creating workflows, describe clearly which nodes you add/change, and what inputs/outputs they use.
- If something is ambiguous, propose a safe default and explain it briefly.