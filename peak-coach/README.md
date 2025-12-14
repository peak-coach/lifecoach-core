# 🏆 Peak Performance Coach

> Your AI-powered Life & Performance Coach

Ein vollständiges System für persönliches Performance-Tracking, Habit-Building und KI-gestütztes Coaching.

## 📋 Features

- ✅ **Telegram Bot** - Quick Check-ins, Task Management, Habit Tracking
- ✅ **Web App (PWA)** - Dashboard, Analytics, Deep Dives
- ✅ **AI Coach** - Personalisierte Empfehlungen mit OpenAI
- ✅ **Gamification** - XP, Levels, Streaks, Badges
- ✅ **Accountability** - Multi-Layer System gegen Prokrastination
- ✅ **Pattern Detection** - Erkennt Muster in deinem Verhalten

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase Account
- Telegram Bot Token
- OpenAI API Key

### 1. Clone & Install

```bash
cd peak-coach
pnpm install
```

### 2. Environment Setup

```bash
cp env.example .env
# Edit .env with your credentials
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Copy your credentials to `.env`

### 4. Run Development

```bash
# Run all apps
pnpm dev

# Or run individually
pnpm dev:web   # Web App on http://localhost:3000
pnpm dev:bot   # Telegram Bot
```

## 📁 Project Structure

```
peak-coach/
├── apps/
│   ├── web/              # Next.js PWA
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── public/
│   │
│   └── telegram-bot/     # Grammy Telegram Bot
│       └── src/
│           ├── commands/
│           ├── handlers/
│           ├── services/
│           └── utils/
│
├── packages/
│   └── shared/           # Shared types, schemas, utils
│       └── src/
│           ├── types/
│           ├── schemas/
│           ├── constants/
│           └── utils/
│
├── supabase/
│   └── migrations/       # Database migrations
│
├── docker-compose.yml    # Docker setup for production
├── turbo.json           # Turborepo config
└── package.json         # Root package.json
```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |
| `OPENAI_API_KEY` | OpenAI API key |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model to use |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |

## 🤖 Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start bot / Onboarding |
| `/checkin` | Morning/Evening Check-in |
| `/tasks` | Show today's tasks |
| `/habits` | Show habits & track |
| `/stats` | Show statistics |
| `/coach` | Chat with AI coach |
| `/help` | Show help |

## 🌐 Web App Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard |
| `/tasks` | Task Management |
| `/goals` | Goal Tracking |
| `/habits` | Habit Tracker |
| `/journal` | Daily Logs |
| `/stats` | Analytics |
| `/coach` | Chat Interface |
| `/profile` | Settings |

## 🐳 Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f telegram-bot
```

## 📊 Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

Main tables:
- `users` - User accounts
- `user_profile` - Preferences & settings
- `tasks` - Task management
- `goals` - Goal tracking
- `habits` / `habit_logs` - Habit tracking
- `daily_logs` - Daily check-ins
- `coach_messages` - AI coach history
- `weekly_reviews` - Weekly summaries

## 🎮 Gamification

### XP Actions

| Action | XP |
|--------|-----|
| Task completed | 10 |
| High-priority task | 20 |
| Habit completed | 15 |
| Morning check-in | 5 |
| Evening review | 10 |
| Goal completed | 500 |

### Levels

1. Beginner (0 XP)
2. Committed (100 XP)
3. Consistent (300 XP)
4. Focused (600 XP)
5. Dedicated (1000 XP)
6. Disciplined (1500 XP)
7. Elite (2500 XP)
8. Master (4000 XP)
9. Legend (6000 XP)
10. Peak Performer (10000 XP)

## 📝 License

Private - All Rights Reserved

## 🙋 Support

Bei Fragen oder Problemen, erstelle ein Issue oder kontaktiere den Entwickler.

---

Built with ❤️ for Peak Performance

