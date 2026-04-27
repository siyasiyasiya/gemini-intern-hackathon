# Phase 2 — Agent B: Market Feed + Mock Data UI

## Your Scope
You own these directories ONLY. Do NOT edit files outside them:
- `src/components/markets/` (all market components)
- `src/app/api/markets/` (market API routes)
- `src/app/api/rooms/[id]/markets/` (room-filtered market endpoints)
- `src/hooks/useMarkets.ts`
- `src/hooks/useMarketDetail.ts`

## Shared Dependencies (READ ONLY — do not modify)
- `src/lib/market-data/index.ts` — `getMarkets()`, `getMarketByTicker()`
- `src/lib/market-data/mock-data.ts` — `MOCK_MARKETS` array
- `src/types/market.ts` — `Market`, `MarketDetail`, `MarketFilters`, etc.
- `src/types/api.ts` — `ApiResponse`
- `src/lib/utils.ts` — `cn()`, `formatCurrency()`, `formatPercentage()`, `formatCompactNumber()`

## What to Build

### API Routes
1. `GET /api/markets` — list all markets (query: category, sort, search, status)
2. `GET /api/markets/[ticker]` — get market detail with history
3. `GET /api/rooms/[id]/markets` — get markets filtered by room topic

Use the mock data service from `src/lib/market-data/index.ts`. The room-filtered endpoint should look up the room's topic from the DB, then filter markets by that category.

### Components (`src/components/markets/`)

1. **MarketCard** — displays a single market:
   - Ticker badge (e.g. "FED-RATE-CUT-JUL")
   - Title
   - YES/NO price bars (visual bars showing odds)
   - 24h change with up/down arrow + color (green/red)
   - Volume (formatted compact)
   - Time to resolution (e.g. "23d left")
   - Hover state with slight scale/glow

2. **MarketFeed** — scrollable list of MarketCards:
   - Sort/filter bar at top (trending, resolving soon, newest, biggest movers)
   - Uses `useMarkets` hook
   - Loading skeleton states
   - Empty state

3. **MarketDetail** — expanded view of a single market:
   - Full title and description
   - Large YES/NO odds display
   - Price history chart (use a simple SVG line chart or just styled data points)
   - Resolution date and source
   - Related markets list
   - Volume stats

4. **MarketFilters** — filter bar component:
   - Category pills
   - Sort dropdown
   - Search input

5. **WatchlistDisplay** — compact list of watched markets for sidebar

### Hooks
1. **useMarkets(filters)** — TanStack Query hook for fetching market list
2. **useMarketDetail(ticker)** — TanStack Query hook for fetching single market

### Chart
For the price history chart, build a simple SVG-based line chart component. No need for a charting library — just plot the history points as an SVG path. Include:
- Line showing YES price over time
- Hover tooltip showing price at each point
- Y-axis labels (0%, 25%, 50%, 75%, 100%)

## Style Guide
- YES = green (#22c55e), NO = red (#ef4444)
- Price change positive = green, negative = red
- Cards: bg-card with border, hover:border-accent
- Use lucide-react for icons (TrendingUp, TrendingDown, Clock, BarChart3)
- Loading skeletons should pulse with animate-pulse
