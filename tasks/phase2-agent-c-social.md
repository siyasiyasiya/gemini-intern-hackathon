# Phase 2 — Agent C: Comments + Leaderboard + Profiles

## Your Scope
You own these directories ONLY. Do NOT edit files outside them:
- `src/components/comments/` (comment components)
- `src/components/leaderboard/` (leaderboard components)
- `src/app/profile/` (profile pages)
- `src/app/api/rooms/[id]/comments/` (comment API routes)
- `src/app/api/leaderboard/` (leaderboard API routes)
- `src/app/api/users/` (user API routes)
- `src/hooks/useComments.ts`
- `src/hooks/useLeaderboard.ts`

## Shared Dependencies (READ ONLY — do not modify)
- `src/lib/db/schema.ts` — comments, user_trades, leaderboard_entries, users tables
- `src/lib/db/index.ts` — `db` export
- `src/lib/auth/index.ts` — `auth` export
- `src/types/api.ts` — `ApiResponse`, `CommentResponse`, `LeaderboardEntryResponse`, `UserStatsResponse`, `UserResponse`
- `src/lib/utils.ts` — `cn()`, formatters, `timeAgo()`

## What to Build

### Comment System

**API Routes (`src/app/api/rooms/[id]/comments/`)**
1. `GET /api/rooms/[id]/comments` — list comments (query: marketTicker, parentId for threading)
2. `POST /api/rooms/[id]/comments` — create comment (auth required)
   - Body: { content, marketTicker?, parentId?, positionDirection?, positionAmount? }

**Components (`src/components/comments/`)**
1. **CommentThread** — displays threaded comments for a market within a room
   - Props: roomId, marketTicker
   - Fetch comments filtered by room + ticker
   - Show nested replies (1 level of nesting is fine)
   - "Load more replies" for long threads

2. **CommentForm** — form to post a comment
   - Text area for content
   - Optional: position sharing toggle ("I'm buying YES/NO at X%")
   - Submit button, loading state

3. **Comment** — single comment display
   - User avatar + username
   - Timestamp (use timeAgo)
   - Comment content
   - Position badge if shared (green "YES 62%" or red "NO 38%")
   - Reply button
   - Nested replies

### Leaderboard

**API Routes (`src/app/api/leaderboard/`)**
1. `GET /api/leaderboard` — get leaderboard (query: roomId?, period=all_time|weekly|monthly, limit)
   - Compute rankings from user_trades table
   - For the hackathon: if no real trade data exists, generate mock leaderboard data in the API handler
2. `GET /api/leaderboard/[userId]` — get user's rank and stats

**Components (`src/components/leaderboard/`)**
1. **Leaderboard** — full leaderboard display
   - Time period tabs: All Time, Weekly, Monthly
   - Table/list of LeaderboardEntry items
   - Highlight top 3 with special styling (gold/silver/bronze)
   - Props: roomId? (if provided, show room-specific leaderboard)

2. **LeaderboardEntry** — single row in leaderboard
   - Rank number (with medal icons for top 3)
   - User avatar + username
   - Total P&L (green if positive, red if negative)
   - Win rate percentage
   - Total trades count

### User Profiles

**API Routes (`src/app/api/users/`)**
1. `GET /api/users/[id]` — get user profile
2. `GET /api/users/[id]/stats` — get user stats (total trades, P&L, win rate, rooms joined, comments posted)
3. `GET /api/users/[id]/trades` — get user's recent trades

**Pages (`src/app/profile/`)**
1. **`/profile/[id]`** — user profile page
   - User info header (avatar, display name, username, bio, join date)
   - Stats grid (trades, P&L, win rate, rooms)
   - Recent activity section
   - Rooms they're a member of

### Hooks
1. **useComments(roomId, marketTicker?)** — TanStack Query hook for fetching comments
2. **useLeaderboard(roomId?, period?)** — TanStack Query hook for fetching leaderboard

## Mock Data for Leaderboard
Since we don't have real trades yet, generate mock leaderboard data in the API. Create 15-20 mock entries with realistic names and stats. Use a seeded approach so the data is consistent across requests.

## Style Guide
- Comments: left border for nesting, subtle bg-card for comment bodies
- Position badges: green pill for YES, red pill for NO
- Leaderboard: top 3 get gold/silver/bronze accents
- Profile: clean card-based layout
- Use lucide-react for icons (MessageSquare, Trophy, User, TrendingUp)
- Loading states with animate-pulse skeletons
