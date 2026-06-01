<div align="center">

# CONSTELLATIONS

### **reddit for prediction markets. social meets trading.**

[![built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=for-the-badge)](https://nextjs.org)
[![powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-blue?style=for-the-badge)](https://deepmind.google/technologies/gemini)
[![real-time with Socket.io](https://img.shields.io/badge/Real--time-Socket.io-white?style=for-the-badge)](https://socket.io)

<br />

**a standalone web app where traders gather in persistent community rooms around Gemini Prediction markets. discuss. debate. compete on leaderboards. all in real-time.**

[explore rooms](#) · [view leaderboard](#) · [read docs](#)

</div>

---

## vision

**constellations is the social layer for prediction markets.**

real money prediction platforms exist, but they're often isolated trading terminals. traders don't have a place to discuss strategies, share market insights, or build reputation around their predictions. they're missing the *community*.

we built a Discord/Reddit-like experience where every room is tied to a real Gemini Prediction market. here, traders become community members. discussions drive market dynamics. leaderboards reward accuracy.

---

## features

### 💬 community rooms
- persistent rooms tied to individual prediction markets
- real-time discussion threads with user avatars and timestamps
- markdown-rich comments with spoiler support

### 📊 market insight
- live market data streamed from Gemini Predictions API
- probability charts and trade history
- market participants and activity feed

### 🏆 leaderboards
- user reputation built on prediction accuracy
- seasonal rankings with badges
- profile pages showing prediction history and win rates

### 👥 user profiles
- prediction history and performance stats
- watchlist of markets and users to follow
- customizable dark-themed profiles

### ⚡ real-time updates
- Socket.io powers live comment streams
- instant market price updates
- real-time user presence indicators

---

## tech stack

| layer | tech | purpose |
|-------|------|---------|
| **frontend** | Next.js 14, React, TypeScript | fast, server-rendered UI |
| **styling** | Tailwind CSS v4, shadcn/ui | consistent dark theme components |
| **database** | PostgreSQL, Drizzle ORM | durable persistence |
| **real-time** | Socket.io + Redis | live updates across users |
| **state** | TanStack Query, Zustand | server & client state management |
| **auth** | NextAuth.js | credentials-based authentication |
| **markets** | Gemini Predictions API | real market data & odds |

---

## getting started

### prerequisites

- Node.js 18+
- PostgreSQL database
- Gemini Predictions API credentials
- Redis instance (via Upstash)

### setup

```bash
# clone & install
git clone https://github.com/siyasiyasiya/gemini-intern-hackathon.git
cd gemini-intern-hackathon
pnpm install

# configure environment
cp .env.example .env
# edit .env with your DATABASE_URL, GEMINI_API_KEY, etc.

# initialize database
pnpm db:push

# start dev server
pnpm dev
```

then open http://localhost:3000 in your browser.

### database studio

to explore the database with a GUI:

```bash
pnpm db:studio
```

---

## project structure

```
src/
  app/                    # next.js app router pages & api routes
    (auth)/               # login/register pages
    rooms/                # room listing & detail pages
    profile/              # user profiles
    api/                  # api endpoints
  components/             # react components
    ui/                   # shadcn/ui base components
    rooms/                # room-specific components
    markets/              # market data components
    comments/             # discussion/comment components
    leaderboard/          # rankings components
    layout/               # nav, sidebar, layout wrappers
  lib/                    # utilities & helpers
    db/                   # drizzle schema & migrations
    auth/                 # nextauth config
    socket/               # socket.io client setup
    market-data/          # gemini api integration
  hooks/                  # custom react hooks
  types/                  # shared typescript types
  server/                 # socket.io server (separate process)
```

---

## key conventions

- **pnpm** as package manager
- **functional components** with hooks
- **server components** by default (add `"use client"` only when needed)
- **Drizzle ORM** for all database queries (never raw SQL)
- **dark theme** — tailwind dark colors as defaults
- **UTC timezone** for all stored times
- **consistent API shape:** `{ data, error }`

---

## development

### running the dev server

```bash
pnpm dev
```

this starts the Next.js dev server on http://localhost:3000.

### running the real-time server (Socket.io)

in a separate terminal:

```bash
pnpm dev:socket
```

or run it as a separate process in production.

### database migrations

to update the schema:

1. edit `src/lib/db/schema.ts`
2. run `pnpm db:push` to apply changes
3. drizzle will handle migrations automatically

---

## api endpoints

| method | endpoint | auth | description |
|--------|----------|------|-------------|
| `GET` | `/api/rooms` | none | list all rooms |
| `GET` | `/api/rooms/[id]` | none | get room details |
| `POST` | `/api/rooms/[id]/join` | session | join a room |
| `GET` | `/api/rooms/[id]/markets` | none | get markets in a room |
| `POST` | `/api/rooms/[id]/comments` | session | post a comment |
| `GET` | `/api/leaderboard` | none | get top users |
| `GET` | `/api/users/[id]` | none | get user profile |
| `GET` | `/api/markets/[id]` | none | get market details |

---

## deployment

the app is ready to deploy on:

- **Vercel** — easiest for Next.js
- **Railway** — works well with Drizzle & Socket.io
- **AWS** — full control over infrastructure

for Socket.io, deploy as a separate Node.js service and update your client config to point to its URL.

---

## what's next

### phase 1 (hackathon)
- [x] core rooms & real-time comments
- [x] market display & leaderboard
- [x] user authentication
- [x] gemini predictions integration

### phase 2 (future)
- [ ] advanced market filters & search
- [ ] user notifications & mentions
- [ ] prediction tracking per user
- [ ] moderation tools for room admins
- [ ] mobile-optimized experience

---

## contributing

this is a hackathon project, but PRs are welcome. feel free to open issues for bugs or feature requests.

---

## license

MIT License — build freely.

---

<div align="center">

**[Constellations](https://github.com/siyasiyasiya/gemini-intern-hackathon)** — *where traders discuss, debate, and compete*

*Built with ❤️ during the Gemini Intern Hackathon*

</div>
