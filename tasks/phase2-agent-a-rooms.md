# Phase 2 — Agent A: Room System

## Your Scope
You own these directories ONLY. Do NOT edit files outside them:
- `src/app/rooms/` (all pages)
- `src/app/api/rooms/` (API routes)
- `src/components/rooms/` (components)
- `src/app/page.tsx` (home page — replace placeholder with trending rooms)

## Shared Dependencies (READ ONLY — do not modify)
- `src/lib/db/schema.ts` — room/room_members tables
- `src/lib/db/index.ts` — `db` export
- `src/lib/auth/index.ts` — `auth` export for getting session
- `src/lib/utils.ts` — `cn()`, formatters
- `src/types/api.ts` — `ApiResponse`, `RoomResponse`

## What to Build

### API Routes (`src/app/api/rooms/`)
1. `GET /api/rooms` — list rooms (query params: topic, search, page)
2. `POST /api/rooms` — create room (auth required)
3. `GET /api/rooms/[id]` — get room detail
4. `POST /api/rooms/[id]/join` — join room (auth required)
5. `POST /api/rooms/[id]/leave` — leave room (auth required)
6. `GET /api/rooms/[id]/members` — list room members
7. `POST /api/rooms/[id]/invite` — generate invite code (owner/mod only)
8. `GET /api/rooms/join/[code]` — join via invite code

All API responses must use `{ data, error }` shape.

### Components (`src/components/rooms/`)
1. **RoomCard** — card showing room name, topic badge, member count, description preview
2. **RoomList** — grid of RoomCards with topic filter tabs
3. **CreateRoomForm** — modal/form: name, description, topic dropdown, public/private toggle
4. **RoomHeader** — room name, topic, member count, join/leave button, invite link
5. **MemberList** — sidebar list of room members with role badges

### Pages (`src/app/rooms/`)
1. **`/rooms`** — browse all rooms page with RoomList, search bar, create room button
2. **`/rooms/create`** — create room page with CreateRoomForm
3. **`/rooms/[id]`** — room detail page with 3-column layout:
   - Left sidebar: market feed placeholder (just a div with id="market-feed")
   - Center: comments placeholder (div with id="comments")
   - Right sidebar: MemberList + watchlist placeholder

### Home Page (`src/app/page.tsx`)
Replace the placeholder with:
- Hero section with app title
- Grid of trending/popular rooms (fetch from API)
- "Browse all rooms" link
- "Create a room" CTA button

## Style Guide
- Dark theme only — use bg-card, text-foreground, text-muted-foreground
- Use Tailwind classes, cn() for conditionals
- Topic badges should be color-coded
- Cards should have hover effects
- Use lucide-react for icons
