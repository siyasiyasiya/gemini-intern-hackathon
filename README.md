# Predictions Communities (Gemini Constellation)

A Next.js web app that adds a social layer to Gemini prediction markets. Users join “Constellations” (persistent community rooms), track live market data, and discuss trades in real time.

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Run Locally](#run-locally)
- [Scripts](#scripts)
- [Data & Integrations](#data--integrations)
- [Contributing](#contributing)

## Overview
Predictions Communities is a standalone web app that turns real Gemini prediction markets into community-driven spaces. Each Constellation is a persistent room centered around a market theme where users can track prices, share commentary, and compete on leaderboards.

## Key Features
- **Constellations (community rooms):** persistent rooms with shared market focus.
- **Markets explorer:** browse Gemini markets and view detailed market pages.
- **Real-time presence & comments:** Socket.io-powered presence counts and live comment updates.
- **Leaderboards & profiles:** track performance and view user activity.
- **Activity feed:** surface recent actions across communities.
- **Gemini account linking:** connect API credentials to show real trading stats.
- **Market “Autopsy” (optional):** Gemini AI-generated context for market inflection points.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Auth:** NextAuth (credentials provider)
- **Database:** PostgreSQL + Drizzle ORM
- **Real-time:** Socket.io (separate Node server)
- **State:** TanStack Query + Zustand

## Architecture
- **Next.js app** handles UI, server components, and API routes in `src/app`.
- **Socket server** runs as a separate process in `src/server` for presence and live updates.
- **PostgreSQL** stores users, constellations, comments, trades, and leaderboard data.
- **Gemini integrations** fetch market data and user trading stats.
- **Optional Gemini AI** provides market “autopsy” summaries (requires API key).

## Project Structure
```
src/
  app/                      # Next.js pages and API routes
    (auth)/                 # Login/register
    api/                    # API routes
    constellations/         # Community rooms
    markets/                # Market pages
    feed/                   # Activity feed
    leaderboard/            # Rankings
    profile/                # User profiles
    settings/               # User settings
  components/               # UI components
    constellations/         # Constellation UI
    markets/                # Market UI
    comments/               # Discussion UI
    leaderboard/            # Leaderboard UI
    layout/                 # Navbar, layout pieces
    ui/                     # shadcn/ui components
  hooks/                    # Custom hooks
  lib/                      # Shared utilities (db, auth, market data, sockets)
  server/                   # Socket.io server (separate process)
  types/                    # Shared TypeScript types
```

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- pnpm (`npm install -g pnpm`)
- PostgreSQL database

### Environment Variables
Create a `.env.local` in the repository root:

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://username@localhost:5432/predictions` |
| `AUTH_SECRET` | Encryption secret for stored credentials | `your-long-random-string` |
| `NEXT_PUBLIC_APP_URL` | Frontend base URL (Socket CORS) | `http://localhost:3000` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket server URL (client) | `http://localhost:3001` |
| `SOCKET_PORT` | Socket server port | `3001` |
| `GEMINI_AI_API_KEY` | (Optional) Gemini AI key for autopsy summaries | `your-gemini-key` |

### Database Setup
1. Create a PostgreSQL database.
2. Push the schema:
   ```bash
   pnpm db:push
   ```
3. (Optional) Seed demo data:
   ```bash
   pnpm db:seed
   ```

### Run Locally
Start the Next.js app and Socket.io server in separate terminals:

```bash
pnpm dev
```

```bash
pnpm socket
```

Open http://localhost:3000 to view the app.

## Scripts
| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Build production bundle |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm socket` | Start Socket.io server |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:seed` | Seed demo data |

## Data & Integrations
- **Gemini Markets:** Market browsing uses Gemini’s public prediction market APIs.
- **User Trading Stats:** Users can connect Gemini API keys to display positions and order history.
- **Market Autopsy:** Optional Gemini AI integration to summarize catalysts for market moves (requires `GEMINI_AI_API_KEY`).

## Contributing
1. Create a feature branch.
2. Run lint/build before opening a PR.
3. Keep changes focused and documented.
