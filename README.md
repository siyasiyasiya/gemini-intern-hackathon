# Predictions Communities (Gemini Constellation)

**Predictions Communities** is a Next.js web app that turns Gemini prediction markets into community-driven spaces. Users join **Constellations** (persistent rooms), track live market data, and debate outcomes in real time—then measure performance on shared leaderboards.

**Why it’s compelling:** prediction markets are information-dense but socially thin. This project layers identity, conversation, and friendly competition on top of market data so communities can build shared context around fast-moving events.

## Table of Contents
- [Overview](#overview)
- [Product Highlights](#product-highlights)
- [User Journey](#user-journey)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Realtime Layer](#realtime-layer)
- [Data Model Snapshot](#data-model-snapshot)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Run Locally](#run-locally)
- [Scripts](#scripts)
- [Data & Integrations](#data--integrations)
- [Security Notes](#security-notes)
- [Contributing](#contributing)

## Overview
Predictions Communities is a standalone social layer for Gemini prediction markets. Each **Constellation** is a persistent room centered around a market theme, combining live pricing, threaded discussion, and performance tracking into a single experience.

## Product Highlights
- **Constellations as community hubs:** public or invite-only rooms with rules, topics, member counts, and pinned markets.
- **Market intelligence at a glance:** browse Gemini markets, drill into market detail pages, and follow watchlisted tickers.
- **Real-time discussion & presence:** Socket.io-powered presence counts and live comment updates.
- **Opinionated commentary:** comments can include tagged markets and trade positions.
- **Leaderboards & profiles:** view performance summaries, user activity, and rank progress.
- **Activity feed:** surface recent community activity and trending commentary.
- **Gemini account linking:** connect Gemini API credentials to show authenticated trading stats.
- **Market Autopsy (optional):** AI-assisted inflection point summaries for major price moves.

## User Journey
1. **Discover** a market or topic and join a constellation.
2. **Track** live price changes and related markets in the room’s watchlist.
3. **Discuss** outcomes with structured comments, likes, and threaded replies.
4. **Compete** on leaderboards based on trade history and performance.
5. **Analyze** inflection points with the Market Autopsy timeline.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Auth:** NextAuth (credentials provider)
- **Database:** PostgreSQL + Drizzle ORM
- **Real-time:** Socket.io (separate Node server)
- **State:** TanStack Query + Zustand

## Architecture
- **Next.js app** provides UI, server components, and API routes in `src/app`.
- **Socket server** runs as a separate process in `src/server` for presence and live updates.
- **PostgreSQL** stores users, constellations, comments, trades, and leaderboard data.
- **Gemini integrations** fetch public market data and authenticated user stats.
- **Optional Gemini AI** powers Market Autopsy summaries (requires API key).

## Realtime Layer
Socket.io broadcasts keep rooms in sync:
- **presence-update:** user join/leave events + online count per constellation.
- **comment-added:** live comment fan-out to the room.
- **market-price-update:** broadcast price and volume changes.

## Data Model Snapshot
Key tables (Drizzle/Postgres):
- **users**: profiles, credentials, and Gemini connection state.
- **constellations**: community rooms with categories, rules, and invite codes.
- **constellation_members**: roles (owner/moderator/member) and membership records.
- **tracked_markets**: room-level watchlist/pins.
- **comments + comment_likes**: threaded discussion with reactions.
- **watchlist_items**: per-user market follow list.
- **user_trades + leaderboard_entries**: performance tracking and rankings.

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

## Security Notes
- Gemini API credentials are encrypted at rest using AES-256-GCM and the `AUTH_SECRET` key.
- Use a strong, unique `AUTH_SECRET` for local and production environments.

## Contributing
1. Create a feature branch.
2. Run lint/build before opening a PR.
3. Keep changes focused and documented.
