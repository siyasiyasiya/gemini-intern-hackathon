import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const DEMO_EMAIL = "demo@constellation.dev";
const DEMO_PASSWORD = "demo1234";

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ── User data ────────────────────────────────────────────────────────────────

const userData = [
  { username: "demo_trader", email: DEMO_EMAIL, displayName: "Demo Trader", bio: "Exploring prediction markets. Long-term thinker." },
  { username: "alex_macro", email: "alex@fake.dev", displayName: "Alex Chen", bio: "Macro analyst. Fed watcher. Data-driven." },
  { username: "jordan_bets", email: "jordan@fake.dev", displayName: "Jordan Rivera", bio: "Sports + politics markets. Contrarian." },
  { username: "sam_onchain", email: "sam@fake.dev", displayName: "Sam Patel", bio: "Crypto-native. On-chain data nerd." },
  { username: "taylor_quant", email: "taylor@fake.dev", displayName: "Taylor Kim", bio: "Quant background. Probability > opinion." },
  { username: "morgan_ai", email: "morgan@fake.dev", displayName: "Morgan Liu", bio: "AI researcher. Tech prediction markets." },
  { username: "casey_wolf", email: "casey@fake.dev", displayName: "Casey Wolf", bio: "Election forecaster. Poll aggregation hobbyist." },
  { username: "riley_degen", email: "riley@fake.dev", displayName: "Riley Brooks", bio: "Full degen. High conviction, high variance." },
];

// ── Constellation data ───────────────────────────────────────────────────────

const constellationData = [
  {
    name: "Crypto Alpha",
    slug: "crypto-alpha",
    description: "Deep dives into crypto prediction markets",
    about: "A community for crypto-focused prediction market traders. We discuss BTC price targets, ETH milestones, and altcoin markets. Data-driven analysis preferred.",
    rules: "1. Back claims with data\n2. No shilling\n3. Share your positions honestly\n4. Be respectful",
    topic: "crypto" as const,
  },
  {
    name: "Election Watch",
    slug: "election-watch",
    description: "Tracking political prediction markets",
    about: "Non-partisan analysis of political prediction markets. We track elections worldwide, policy outcomes, and geopolitical events through the lens of market probabilities.",
    rules: "1. Stay non-partisan\n2. Cite polls and data\n3. No personal attacks\n4. Markets, not opinions",
    topic: "politics" as const,
  },
  {
    name: "Sports Edge",
    slug: "sports-edge",
    description: "Sports betting market analysis",
    about: "Community for sports prediction market enthusiasts. We analyze lines, track sharp money, and discuss sports outcomes from a probabilistic perspective.",
    rules: "1. Share your reasoning\n2. Track your record\n3. No guaranteed picks\n4. Respect the variance",
    topic: "sports" as const,
  },
  {
    name: "Tech Futures",
    slug: "tech-futures",
    description: "AI, startups, and tech predictions",
    about: "Where technologists trade on the future. AI timelines, startup outcomes, product launches, and tech policy markets.",
    rules: "1. Insider info = ban\n2. Cite sources\n3. Constructive debate only\n4. Long-term thinking encouraged",
    topic: "technology" as const,
  },
  {
    name: "Macro Moves",
    slug: "macro-moves",
    description: "Fed, inflation, and macro markets",
    about: "For macro traders and economics enthusiasts. We track Fed decisions, inflation data, GDP forecasts, and global economic prediction markets.",
    rules: "1. Data over narrative\n2. Timestamp your calls\n3. Acknowledge uncertainty\n4. No doom-posting without evidence",
    topic: "economics" as const,
  },
];

// Membership matrix: [constellationIndex] -> array of { userIndex, role }
const membershipMap: { userIndex: number; role: "owner" | "moderator" | "member" }[][] = [
  // Crypto Alpha: demo owns, sam moderates
  [
    { userIndex: 0, role: "owner" },
    { userIndex: 3, role: "moderator" },
    { userIndex: 4, role: "member" },
    { userIndex: 7, role: "member" },
    { userIndex: 1, role: "member" },
  ],
  // Election Watch: casey owns, demo + jordan
  [
    { userIndex: 6, role: "owner" },
    { userIndex: 0, role: "member" },
    { userIndex: 2, role: "member" },
    { userIndex: 1, role: "moderator" },
  ],
  // Sports Edge: jordan owns, riley + demo
  [
    { userIndex: 2, role: "owner" },
    { userIndex: 7, role: "moderator" },
    { userIndex: 0, role: "member" },
    { userIndex: 4, role: "member" },
    { userIndex: 3, role: "member" },
    { userIndex: 5, role: "member" },
  ],
  // Tech Futures: demo owns, morgan moderates
  [
    { userIndex: 0, role: "owner" },
    { userIndex: 5, role: "moderator" },
    { userIndex: 4, role: "member" },
    { userIndex: 1, role: "member" },
    { userIndex: 6, role: "member" },
  ],
  // Macro Moves: alex owns, taylor moderates
  [
    { userIndex: 1, role: "owner" },
    { userIndex: 4, role: "moderator" },
    { userIndex: 0, role: "member" },
    { userIndex: 3, role: "member" },
    { userIndex: 5, role: "member" },
  ],
];

// ── Fallback market tickers by topic ─────────────────────────────────────────

const fallbackTickers: Record<string, string[]> = {
  crypto: ["BTCUSDP-27JUN25", "ETHUSDP-27JUN25", "SOLUSDP-27JUN25"],
  politics: ["PRES2028-DEM", "PRES2028-REP", "SENATE2026-DEM"],
  sports: ["NBA-CHAMP-2025", "NFL-SB-LX", "MLB-WS-2025"],
  technology: ["AGI-BEFORE-2030", "AAPL-4T-2025", "OPENAI-IPO-2025"],
  economics: ["FED-RATE-CUT-JUN25", "CPI-ABOVE-3-JUN25", "RECESSION-2025"],
};

// Map Gemini API categories to our constellation topics
const categoryToTopic: Record<string, string> = {
  Crypto: "crypto",
  Politics: "politics",
  Sports: "sports",
  Tech: "technology",
  Business: "technology",
  Economics: "economics",
  Commodities: "economics",
  Culture: "sports",
  Weather: "economics",
};

async function fetchGeminiTickers(): Promise<Record<string, string[]> | null> {
  try {
    const res = await fetch("https://api.gemini.com/v1/prediction-markets/events?limit=30", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const events = json?.data;
    if (!Array.isArray(events) || events.length === 0) return null;

    const result: Record<string, string[]> = {
      crypto: [], politics: [], sports: [], technology: [], economics: [],
    };

    for (const event of events) {
      const topic = categoryToTopic[event.category] || null;
      if (!topic || !event.ticker) continue;
      if (result[topic].length < 3) {
        result[topic].push(event.ticker);
      }
    }

    // Only use API tickers if every topic got at least 1
    for (const t of Object.keys(result)) {
      if (result[t].length === 0) return null;
    }

    return result;
  } catch {
    return null;
  }
}

// ── Comment templates ────────────────────────────────────────────────────────

function getComments(constellationIndex: number): {
  content: string;
  userIndex: number;
  marketTicker?: boolean; // true = attach the first tracked market ticker
  positionDirection?: "yes" | "no";
  positionAmount?: number;
  taggedMarketIndices?: number[]; // indices into constellation's tracked markets array
  daysAgo: number;
  replies?: { content: string; userIndex: number; daysAgo: number }[];
}[] {
  const commentSets = [
    // Crypto Alpha
    [
      { content: "BTC breaking above 100k resistance. The prediction market {{market:TICKER_0}} is pricing in 68% chance of hitting 120k by end of June. Seems about right given the ETF inflows.", userIndex: 0, marketTicker: true, positionDirection: "yes" as const, positionAmount: 250, taggedMarketIndices: [0], daysAgo: 6,
        replies: [
          { content: "ETF inflows have slowed this week though. I'd put it closer to 55%.", userIndex: 3, daysAgo: 5 },
          { content: "On-chain data still bullish. Whale accumulation hasn't stopped.", userIndex: 7, daysAgo: 5 },
        ] },
      { content: "Anyone tracking the ETH/BTC ratio market? Feels like ETH is about to have its run.", userIndex: 3, daysAgo: 4,
        replies: [
          { content: "Bought YES at 0.42. The Pectra upgrade narrative is building.", userIndex: 4, daysAgo: 3 },
        ] },
      { content: "Solana prediction markets are getting interesting. {{market:TICKER_2}} — the ecosystem growth is real but markets seem to be overpricing the short-term.", userIndex: 4, marketTicker: true, positionDirection: "no" as const, positionAmount: 100, taggedMarketIndices: [2], daysAgo: 2 },
      { content: "Just published my weekly crypto markets recap in my profile. TL;DR: cautiously bullish on BTC, neutral on alts.", userIndex: 1, daysAgo: 1 },
      { content: "Position update: Added to my BTC YES position. Cost basis at 0.65.", userIndex: 0, positionDirection: "yes" as const, positionAmount: 150, daysAgo: 0 },
    ],
    // Election Watch
    [
      { content: "New polling aggregate shows a tighter race than markets are pricing. Prediction markets at 62% but polls suggest 54-46.", userIndex: 6, marketTicker: true, daysAgo: 7,
        replies: [
          { content: "Markets have been more accurate than polls historically. I trust the 62%.", userIndex: 1, daysAgo: 6 },
          { content: "Depends on which polls. Likely voter screens matter a lot here.", userIndex: 2, daysAgo: 6 },
        ] },
      { content: "Senate control market is mispriced IMO. The generic ballot has shifted 3 points and the market hasn't moved.", userIndex: 2, positionDirection: "yes" as const, positionAmount: 200, daysAgo: 4 },
      { content: "Interesting divergence between state-level and national markets. Worth watching.", userIndex: 0, daysAgo: 3 },
      { content: "Reminder: markets tend to overreact to single polls. Look at the trend, not individual data points.", userIndex: 1, daysAgo: 1 },
    ],
    // Sports Edge
    [
      { content: "NBA Finals market update: odds shifted after last night's game. The series is now priced at 55/45.", userIndex: 2, marketTicker: true, daysAgo: 5,
        replies: [
          { content: "Home court advantage is being underpriced here. Historical data says 60/40.", userIndex: 7, daysAgo: 4 },
        ] },
      { content: "NFL draft implications for the Super Bowl market are interesting. The top picks should shift some lines.", userIndex: 7, daysAgo: 3,
        replies: [
          { content: "Way too early for those markets but I'm already looking at the AFC futures.", userIndex: 4, daysAgo: 2 },
        ] },
      { content: "My model has the World Series market wrong by about 8%. Taking a position.", userIndex: 4, marketTicker: true, positionDirection: "no" as const, positionAmount: 300, daysAgo: 2 },
      { content: "Injury reports are the edge in sports markets. Most people react too slowly to news.", userIndex: 0, daysAgo: 1 },
      { content: "Posted my NBA model's picks for tonight. 3 games with >5% edge vs market.", userIndex: 3, daysAgo: 0 },
      { content: "Great call on the injury angle. That's exactly how I made my best trades this month.", userIndex: 5, daysAgo: 0 },
    ],
    // Tech Futures
    [
      { content: "The AGI timeline market {{market:TICKER_0}} is fascinating. We went from 15% to 35% chance of AGI before 2030 in just 6 months.", userIndex: 5, marketTicker: true, taggedMarketIndices: [0], daysAgo: 6,
        replies: [
          { content: "Depends entirely on your definition. By some definitions we're already there.", userIndex: 0, daysAgo: 5 },
          { content: "The market is pricing in the hype cycle too much. I'm selling YES here.", userIndex: 4, daysAgo: 5 },
        ] },
      { content: "Apple hitting $4T market cap prediction is at 72%. Seems high given the current growth rate.", userIndex: 0, positionDirection: "no" as const, positionAmount: 150, daysAgo: 4 },
      { content: "OpenAI IPO market just opened. Starting at 45% for 2025. What does everyone think?", userIndex: 4, marketTicker: true, daysAgo: 3,
        replies: [
          { content: "With the revenue numbers they're reporting? I'd say >60%. Buying YES.", userIndex: 5, daysAgo: 2 },
        ] },
      { content: "Anthropic's latest model benchmarks should move some of these AI timeline markets.", userIndex: 1, daysAgo: 1 },
      { content: "Position update: Closed my AAPL NO position for a small loss. The services revenue beat changed my thesis.", userIndex: 0, positionDirection: "yes" as const, positionAmount: 50, daysAgo: 0 },
    ],
    // Macro Moves
    [
      { content: "Fed funds futures are pricing in 2 cuts by year-end but {{market:TICKER_0}} only shows 45% for even one cut in June. Interesting divergence.", userIndex: 1, marketTicker: true, taggedMarketIndices: [0], daysAgo: 7,
        replies: [
          { content: "The June cut probability seems too low. Inflation data has been trending down.", userIndex: 4, daysAgo: 6 },
          { content: "But labor market is still hot. I think the Fed stays put longer than markets expect.", userIndex: 0, daysAgo: 6 },
        ] },
      { content: "CPI print next week will be the catalyst. The prediction market for above 3% is at 38%.", userIndex: 4, positionDirection: "no" as const, positionAmount: 200, daysAgo: 4 },
      { content: "Recession probability market hasn't moved in weeks despite mixed signals. Either the market is efficient or complacent.", userIndex: 3, daysAgo: 3 },
      { content: "Historical analysis: when the yield curve uninverts, recession usually follows within 6-12 months. Markets seem to be ignoring this.", userIndex: 5, daysAgo: 2,
        replies: [
          { content: "This time might actually be different given the fiscal spending levels. But I've hedged my positions.", userIndex: 1, daysAgo: 1 },
        ] },
      { content: "My macro model is bearish for Q3. Taking NO positions on the growth markets.", userIndex: 0, positionDirection: "no" as const, positionAmount: 300, daysAgo: 0 },
    ],
  ];

  return commentSets[constellationIndex];
}

// ── Main seed function ───────────────────────────────────────────────────────

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Starting full database seed...\n");

  // ── 1. Drop all existing tables/enums and recreate from scratch ────────
  console.log("Dropping existing tables and enums...");
  await pool.query(`
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS leaderboard_entries CASCADE;
    DROP TABLE IF EXISTS user_trades CASCADE;
    DROP TABLE IF EXISTS comment_likes CASCADE;
    DROP TABLE IF EXISTS watchlist_items CASCADE;
    DROP TABLE IF EXISTS comments CASCADE;
    DROP TABLE IF EXISTS tracked_markets CASCADE;
    DROP TABLE IF EXISTS constellation_members CASCADE;
    DROP TABLE IF EXISTS community_members CASCADE;
    DROP TABLE IF EXISTS constellations CASCADE;
    DROP TABLE IF EXISTS communities CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS __drizzle_migrations CASCADE;
    DROP TYPE IF EXISTS constellation_role CASCADE;
    DROP TYPE IF EXISTS constellation_topic CASCADE;
    DROP TYPE IF EXISTS community_role CASCADE;
    DROP TYPE IF EXISTS community_topic CASCADE;
    DROP TYPE IF EXISTS notification_type CASCADE;
    DROP TYPE IF EXISTS trade_direction CASCADE;
  `);
  console.log("  Dropped old tables/enums.");

  console.log("Creating tables...");
  await pool.query(`
    CREATE TYPE "public"."constellation_role" AS ENUM('owner', 'moderator', 'member');
    CREATE TYPE "public"."constellation_topic" AS ENUM('politics', 'crypto', 'sports', 'entertainment', 'science', 'economics', 'technology', 'other');
    CREATE TYPE "public"."notification_type" AS ENUM('comment_reply', 'room_invite', 'market_resolved', 'leaderboard_rank');
    CREATE TYPE "public"."trade_direction" AS ENUM('yes', 'no');

    CREATE TABLE "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "username" text NOT NULL,
      "email" text NOT NULL,
      "password_hash" text NOT NULL,
      "display_name" text,
      "avatar_url" text,
      "bio" text,
      "gemini_api_key_enc" text,
      "gemini_api_secret_enc" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "users_username_unique" UNIQUE("username"),
      CONSTRAINT "users_email_unique" UNIQUE("email")
    );

    CREATE TABLE "constellations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "slug" text NOT NULL,
      "description" text,
      "about" text,
      "rules" text,
      "banner_url" text,
      "topic" "constellation_topic" DEFAULT 'other' NOT NULL,
      "is_public" boolean DEFAULT true NOT NULL,
      "invite_code" text,
      "creator_id" uuid NOT NULL REFERENCES "users"("id"),
      "member_count" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "constellations_slug_unique" UNIQUE("slug"),
      CONSTRAINT "constellations_invite_code_unique" UNIQUE("invite_code")
    );

    CREATE TABLE "constellation_members" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "constellation_id" uuid NOT NULL REFERENCES "constellations"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "role" "constellation_role" DEFAULT 'member' NOT NULL,
      "joined_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "tracked_markets" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "constellation_id" uuid NOT NULL REFERENCES "constellations"("id") ON DELETE CASCADE,
      "market_ticker" text NOT NULL,
      "pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
      "pinned_by" uuid NOT NULL REFERENCES "users"("id")
    );

    CREATE TABLE "comments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "constellation_id" uuid NOT NULL REFERENCES "constellations"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "market_ticker" text,
      "parent_id" uuid,
      "content" text NOT NULL,
      "position_direction" "trade_direction",
      "position_amount" real,
      "tagged_markets" text[],
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "comment_likes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "comment_id" uuid NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "watchlist_items" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "constellation_id" uuid NOT NULL REFERENCES "constellations"("id") ON DELETE CASCADE,
      "market_ticker" text NOT NULL,
      "added_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "user_trades" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "constellation_id" uuid NOT NULL REFERENCES "constellations"("id") ON DELETE CASCADE,
      "market_ticker" text NOT NULL,
      "direction" "trade_direction" NOT NULL,
      "amount" real NOT NULL,
      "price_at_trade" real NOT NULL,
      "resolved" boolean DEFAULT false NOT NULL,
      "pnl" real,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "leaderboard_entries" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "constellation_id" uuid REFERENCES "constellations"("id") ON DELETE CASCADE,
      "total_pnl" real DEFAULT 0 NOT NULL,
      "total_trades" integer DEFAULT 0 NOT NULL,
      "win_rate" real DEFAULT 0 NOT NULL,
      "rank" integer,
      "period" text DEFAULT 'all_time' NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "notifications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "type" "notification_type" NOT NULL,
      "title" text NOT NULL,
      "body" text,
      "link" text,
      "read" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("  Created all tables.\n");

  // ── 2. Insert users ───────────────────────────────────────────────────
  console.log("Inserting users...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const insertedUsers = await db
    .insert(schema.users)
    .values(
      userData.map((u) => ({
        username: u.username,
        email: u.email,
        passwordHash,
        displayName: u.displayName,
        bio: u.bio,
      }))
    )
    .returning();
  console.log(`  Inserted ${insertedUsers.length} users.\n`);

  // ── 3. Insert constellations ──────────────────────────────────────────
  console.log("Inserting constellations...");
  const insertedConstellations = await db
    .insert(schema.constellations)
    .values(
      constellationData.map((c, i) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        about: c.about,
        rules: c.rules,
        topic: c.topic,
        isPublic: true,
        creatorId: insertedUsers[membershipMap[i].find((m) => m.role === "owner")!.userIndex].id,
        memberCount: membershipMap[i].length,
      }))
    )
    .returning();
  console.log(`  Inserted ${insertedConstellations.length} constellations.\n`);

  // ── 4. Insert constellation members ───────────────────────────────────
  console.log("Inserting constellation members...");
  const memberValues: {
    constellationId: string;
    userId: string;
    role: "owner" | "moderator" | "member";
    joinedAt: Date;
  }[] = [];

  for (let ci = 0; ci < membershipMap.length; ci++) {
    for (const m of membershipMap[ci]) {
      memberValues.push({
        constellationId: insertedConstellations[ci].id,
        userId: insertedUsers[m.userIndex].id,
        role: m.role,
        joinedAt: daysAgo(Math.floor(Math.random() * 20) + 7),
      });
    }
  }

  await db.insert(schema.constellationMembers).values(memberValues);
  console.log(`  Inserted ${memberValues.length} memberships.\n`);

  // ── 5. Fetch & insert tracked markets ─────────────────────────────────
  console.log("Fetching Gemini prediction market tickers...");
  let tickersByTopic = await fetchGeminiTickers();
  if (!tickersByTopic) {
    console.log("  Gemini API unavailable, using fallback tickers.");
    tickersByTopic = fallbackTickers;
  } else {
    console.log("  Got tickers from Gemini API.");
  }

  const trackedMarketValues: {
    constellationId: string;
    marketTicker: string;
    pinnedBy: string;
  }[] = [];

  for (let ci = 0; ci < insertedConstellations.length; ci++) {
    const topic = constellationData[ci].topic;
    const tickers = tickersByTopic[topic] || fallbackTickers[topic];
    const ownerId = insertedUsers[membershipMap[ci].find((m) => m.role === "owner")!.userIndex].id;

    for (const ticker of tickers.slice(0, 3)) {
      trackedMarketValues.push({
        constellationId: insertedConstellations[ci].id,
        marketTicker: ticker,
        pinnedBy: ownerId,
      });
    }
  }

  const insertedTrackedMarkets = await db
    .insert(schema.trackedMarkets)
    .values(trackedMarketValues)
    .returning();
  console.log(`  Inserted ${insertedTrackedMarkets.length} tracked markets.\n`);

  // Build a lookup: constellationIndex -> list of tickers
  const tickersByConstellation: string[][] = insertedConstellations.map((c) =>
    insertedTrackedMarkets
      .filter((tm) => tm.constellationId === c.id)
      .map((tm) => tm.marketTicker)
  );

  // ── 6. Insert comments (with replies) ────────────────────────────────
  console.log("Inserting comments...");
  let totalComments = 0;

  for (let ci = 0; ci < insertedConstellations.length; ci++) {
    const commentDefs = getComments(ci);
    const constellationTickers = tickersByConstellation[ci];

    for (const cDef of commentDefs) {
      // Resolve TICKER_N placeholders in content
      let resolvedContent = cDef.content;
      const taggedMarkets: string[] = [];
      if (cDef.taggedMarketIndices) {
        for (const idx of cDef.taggedMarketIndices) {
          const ticker = constellationTickers[idx] || constellationTickers[0];
          if (ticker) {
            resolvedContent = resolvedContent.replace(`TICKER_${idx}`, ticker);
            taggedMarkets.push(ticker);
          }
        }
      }

      const [parent] = await db
        .insert(schema.comments)
        .values({
          constellationId: insertedConstellations[ci].id,
          userId: insertedUsers[cDef.userIndex].id,
          content: resolvedContent,
          marketTicker: cDef.marketTicker ? constellationTickers[0] : null,
          positionDirection: cDef.positionDirection || null,
          positionAmount: cDef.positionAmount || null,
          taggedMarkets: taggedMarkets.length > 0 ? taggedMarkets : null,
          createdAt: daysAgo(cDef.daysAgo),
        })
        .returning();
      totalComments++;

      if (cDef.replies) {
        for (const reply of cDef.replies) {
          await db.insert(schema.comments).values({
            constellationId: insertedConstellations[ci].id,
            userId: insertedUsers[reply.userIndex].id,
            content: reply.content,
            parentId: parent.id,
            createdAt: daysAgo(reply.daysAgo),
          });
          totalComments++;
        }
      }
    }
  }
  console.log(`  Inserted ${totalComments} comments.\n`);

  // ── 7. Insert user trades ─────────────────────────────────────────────
  console.log("Inserting user trades...");
  const tradeValues: {
    userId: string;
    constellationId: string;
    marketTicker: string;
    direction: "yes" | "no";
    amount: number;
    priceAtTrade: number;
    resolved: boolean;
    pnl: number | null;
    createdAt: Date;
  }[] = [];

  // Generate trades for each user in their constellations
  for (let ui = 0; ui < insertedUsers.length; ui++) {
    // Find which constellations this user is in
    const userConstellations: number[] = [];
    for (let ci = 0; ci < membershipMap.length; ci++) {
      if (membershipMap[ci].some((m) => m.userIndex === ui)) {
        userConstellations.push(ci);
      }
    }

    // Generate 5-10 trades per user
    const numTrades = Math.floor(Math.random() * 6) + 5;
    for (let t = 0; t < numTrades; t++) {
      const ci = pick(userConstellations);
      const tickers = tickersByConstellation[ci];
      if (tickers.length === 0) continue;

      const direction = Math.random() > 0.5 ? "yes" as const : "no" as const;
      const amount = pick([10, 25, 50, 100, 150, 200, 250, 300, 500]);
      const priceAtTrade = randBetween(0.15, 0.85);
      const resolved = Math.random() > 0.4;
      let pnl: number | null = null;
      if (resolved) {
        // Simulate P&L: roughly 50/50 win/loss with varying magnitude
        const won = Math.random() > 0.45;
        pnl = won
          ? randBetween(amount * 0.1, amount * 0.8)
          : -randBetween(amount * 0.1, amount * 0.6);
      }

      tradeValues.push({
        userId: insertedUsers[ui].id,
        constellationId: insertedConstellations[ci].id,
        marketTicker: pick(tickers),
        direction,
        amount,
        priceAtTrade,
        resolved,
        pnl,
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      });
    }
  }

  await db.insert(schema.userTrades).values(tradeValues);
  console.log(`  Inserted ${tradeValues.length} trades.\n`);

  // ── 8. Compute & insert leaderboard entries ───────────────────────────
  console.log("Computing leaderboard entries...");

  // Group trades by user
  const userStats: Map<string, { totalPnl: number; totalTrades: number; wins: number }> = new Map();
  for (const trade of tradeValues) {
    const stats = userStats.get(trade.userId) || { totalPnl: 0, totalTrades: 0, wins: 0 };
    stats.totalTrades++;
    if (trade.resolved && trade.pnl !== null) {
      stats.totalPnl += trade.pnl;
      if (trade.pnl > 0) stats.wins++;
    }
    userStats.set(trade.userId, stats);
  }

  // Sort by PnL for ranking
  const ranked = Array.from(userStats.entries())
    .map(([userId, stats]) => ({
      userId,
      ...stats,
      winRate: stats.totalTrades > 0 ? stats.wins / stats.totalTrades : 0,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl);

  const leaderboardValues: {
    userId: string;
    totalPnl: number;
    totalTrades: number;
    winRate: number;
    rank: number;
    period: string;
  }[] = [];

  for (const period of ["all_time", "weekly", "monthly"]) {
    ranked.forEach((entry, idx) => {
      leaderboardValues.push({
        userId: entry.userId,
        totalPnl: Math.round(entry.totalPnl * 100) / 100,
        totalTrades: entry.totalTrades,
        winRate: Math.round(entry.winRate * 100) / 100,
        rank: idx + 1,
        period,
      });
    });
  }

  await db.insert(schema.leaderboardEntries).values(leaderboardValues);
  console.log(`  Inserted ${leaderboardValues.length} leaderboard entries.\n`);

  // ── 9. Insert notifications for demo user ─────────────────────────────
  console.log("Inserting notifications for demo user...");
  const demoUserId = insertedUsers[0].id;

  const notificationValues = [
    {
      userId: demoUserId,
      type: "comment_reply" as const,
      title: "Sam Patel replied to your comment",
      body: "ETF inflows have slowed this week though...",
      link: `/rooms/${insertedConstellations[0].slug}`,
      read: true,
      createdAt: daysAgo(5),
    },
    {
      userId: demoUserId,
      type: "comment_reply" as const,
      title: "Taylor Kim replied in Tech Futures",
      body: "The market is pricing in the hype cycle too much...",
      link: `/rooms/${insertedConstellations[3].slug}`,
      read: true,
      createdAt: daysAgo(5),
    },
    {
      userId: demoUserId,
      type: "market_resolved" as const,
      title: "Market resolved: BTC above 100k",
      body: "Your YES position resolved. Check your P&L.",
      link: `/rooms/${insertedConstellations[0].slug}`,
      read: false,
      createdAt: daysAgo(2),
    },
    {
      userId: demoUserId,
      type: "leaderboard_rank" as const,
      title: "You moved up on the leaderboard!",
      body: `You're now ranked #${ranked.findIndex((r) => r.userId === demoUserId) + 1} overall.`,
      link: `/rooms/${insertedConstellations[0].slug}`,
      read: false,
      createdAt: daysAgo(1),
    },
    {
      userId: demoUserId,
      type: "room_invite" as const,
      title: "You were invited to Macro Moves",
      body: "Alex Chen invited you to join the discussion.",
      link: `/rooms/${insertedConstellations[4].slug}`,
      read: false,
      createdAt: daysAgo(3),
    },
    {
      userId: demoUserId,
      type: "comment_reply" as const,
      title: "Alex Chen replied in Macro Moves",
      body: "But labor market is still hot...",
      link: `/rooms/${insertedConstellations[4].slug}`,
      read: false,
      createdAt: daysAgo(6),
    },
    {
      userId: demoUserId,
      type: "market_resolved" as const,
      title: "CPI market resolved",
      body: "The CPI above 3% market resolved NO. Your position won!",
      link: `/rooms/${insertedConstellations[4].slug}`,
      read: false,
      createdAt: daysAgo(0),
    },
  ];

  await db.insert(schema.notifications).values(notificationValues);
  console.log(`  Inserted ${notificationValues.length} notifications.\n`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("=".repeat(50));
  console.log("Seed complete!");
  console.log("=".repeat(50));
  console.log(`  Users:          ${insertedUsers.length}`);
  console.log(`  Constellations: ${insertedConstellations.length}`);
  console.log(`  Members:        ${memberValues.length}`);
  console.log(`  Tracked Markets:${insertedTrackedMarkets.length}`);
  console.log(`  Comments:       ${totalComments}`);
  console.log(`  Trades:         ${tradeValues.length}`);
  console.log(`  Leaderboard:    ${leaderboardValues.length}`);
  console.log(`  Notifications:  ${notificationValues.length}`);
  console.log();
  console.log("Demo credentials:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("=".repeat(50));

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
