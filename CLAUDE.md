# Predictions Communities

## Project Overview
A standalone web app providing persistent community rooms built around real Gemini Predictions markets. Social layer for prediction markets — Reddit/Discord meets trading.

## Tech Stack
- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Database:** PostgreSQL via Drizzle ORM
- **Real-time:** Socket.io (separate server)
- **State:** TanStack Query (server state) + Zustand (client state)
- **Auth:** NextAuth.js (credentials provider for hackathon)
- **Cache/Pub-Sub:** Redis via Upstash

## Project Structure
```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Auth pages (login, register)
    rooms/                # Room pages
    profile/              # Profile pages
    api/                  # API routes
  components/             # React components
    ui/                   # shadcn/ui base components
    rooms/                # Room-specific components
    markets/              # Market-specific components
    comments/             # Comment/discussion components
    leaderboard/          # Leaderboard components
    layout/               # Layout components (nav, sidebar)
  lib/                    # Shared utilities
    db/                   # Drizzle schema, connection, migrations
    auth/                 # Auth config
    socket/               # Socket.io client helpers
    api/                  # API client helpers
    market-data/          # Gemini/mock market data service
  hooks/                  # Custom React hooks
  types/                  # Shared TypeScript types
  server/                 # Socket.io server (separate process)
```

## Conventions
- Use `pnpm` as package manager
- All components are functional with hooks
- Server components by default; add "use client" only when needed
- API routes return `{ data, error }` shape consistently
- Database queries go through Drizzle ORM, never raw SQL at the app layer
- Use `cn()` helper from `lib/utils` for conditional classNames
- Dark theme only — use Tailwind dark colors as defaults
- All times stored as UTC in database

## Module Boundaries (IMPORTANT for parallel development)
Each task owns specific directories. Do NOT edit files outside your task's scope:
- **Task 1 (Scaffold):** project config, `src/lib/db/`, `src/types/`, `src/lib/utils.ts`
- **Task 2 (Auth + Layout):** `src/app/(auth)/`, `src/components/layout/`, `src/lib/auth/`, `src/app/layout.tsx`, `src/app/page.tsx`
- **Task 3 (Rooms):** `src/app/rooms/`, `src/components/rooms/`, `src/app/api/rooms/`
- **Task 4 (Markets + Comments):** `src/components/markets/`, `src/components/comments/`, `src/app/api/markets/`, `src/app/api/rooms/[id]/markets/`, `src/lib/market-data/`
- **Task 5 (Leaderboard + Profiles):** `src/components/leaderboard/`, `src/app/profile/`, `src/app/api/leaderboard/`, `src/app/api/users/`
- **Task 6 (Real-time):** `src/server/`, `src/lib/socket/`, `src/hooks/useSocket.ts`

## Database Schema
Schema is defined in `src/lib/db/schema.ts` using Drizzle ORM. Tables:
- users, rooms, room_members, comments, watchlist_items, user_trades, leaderboard_entries, notifications

## Running the Project
```bash
pnpm install
pnpm dev          # Next.js dev server
pnpm db:push      # Push schema to database
pnpm db:studio    # Drizzle Studio (DB GUI)
```
