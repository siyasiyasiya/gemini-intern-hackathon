import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { generateInviteCode } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86400000 - Math.random() * 86400000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600000 - Math.random() * 3600000);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

// ─── Data Definitions ───────────────────────────────────────────────────────

const DEMO_EMAIL = "demo@predictions.dev";
const DEMO_PASSWORD = "demo1234";

const usersData = [
  { username: "demo_trader", email: DEMO_EMAIL, displayName: "Demo Trader", bio: "Full-time prediction market degen. Betting on everything from BTC to the next Best Picture winner.", avatarUrl: null },
  { username: "alex_chen", email: "alex@example.com", displayName: "Alex Chen", bio: "Crypto maximalist. DeFi builder.", avatarUrl: null },
  { username: "jordan_rivera", email: "jordan@example.com", displayName: "Jordan Rivera", bio: "Sports analytics nerd. Data-driven predictions.", avatarUrl: null },
  { username: "morgan_liu", email: "morgan@example.com", displayName: "Morgan Liu", bio: "Econ PhD dropout. Now I just bet on my opinions.", avatarUrl: null },
  { username: "sam_patel", email: "sam@example.com", displayName: "Sam Patel", bio: "AI researcher by day, prediction market trader by night.", avatarUrl: null },
  { username: "taylor_kim", email: "taylor@example.com", displayName: "Taylor Kim", bio: "Political junkie. Elections are my Super Bowl.", avatarUrl: null },
  { username: "riley_brooks", email: "riley@example.com", displayName: "Riley Brooks", bio: null, avatarUrl: null },
  { username: "casey_wolf", email: "casey@example.com", displayName: "Casey Wolf", bio: "Lurker. Occasionally right.", avatarUrl: null },
  { username: "jamie_garcia", email: "jamie@example.com", displayName: "Jamie Garcia", bio: "Entertainment industry insider. Oscar predictions are my specialty.", avatarUrl: null },
  { username: "quinn_omalley", email: "quinn@example.com", displayName: "Quinn O'Malley", bio: "Climate scientist turned market maker.", avatarUrl: null },
  { username: "new_user_123", email: "newuser@example.com", displayName: null, bio: null, avatarUrl: null },
];

interface ConstellationDef {
  name: string;
  slug: string;
  description: string | null;
  about: string | null;
  rules: string | null;
  categories: string[];
  isPublic: boolean;
  bannerUrl: string | null;
  creatorIndex: number;
  members: { userIndex: number; role: "owner" | "moderator" | "member" }[];
}

const constellationsData: ConstellationDef[] = [
  // 1. Multi-category: crypto + economics
  {
    name: "Crypto Alpha",
    slug: "crypto-alpha",
    description: "Deep dives into crypto markets, DeFi, and macro economics.",
    about: "We combine on-chain analysis with macroeconomic signals to find alpha in crypto prediction markets. Weekly calls, shared research, and real-time trade alerts.",
    rules: "1. Back your claims with data\n2. No shilling personal bags\n3. Share your position when making calls\n4. Be respectful even when you disagree",
    categories: ["crypto", "economics"],
    isPublic: true,
    bannerUrl: null,
    creatorIndex: 1,
    members: [
      { userIndex: 1, role: "owner" },
      { userIndex: 0, role: "moderator" },
      { userIndex: 3, role: "member" },
      { userIndex: 4, role: "member" },
      { userIndex: 7, role: "member" },
      { userIndex: 10, role: "member" },
    ],
  },
  // 2. Single category: sports
  {
    name: "Sports Edge",
    slug: "sports-edge",
    description: "Data-driven sports predictions and analysis.",
    about: "Statistical models, injury reports, and line movement analysis for major sports leagues.",
    rules: "1. Cite your sources\n2. No trolling after bad beats\n3. Share bankroll management tips",
    categories: ["sports"],
    isPublic: true,
    bannerUrl: null,
    creatorIndex: 2,
    members: [
      { userIndex: 2, role: "owner" },
      { userIndex: 0, role: "member" },
      { userIndex: 5, role: "member" },
      { userIndex: 6, role: "member" },
      { userIndex: 7, role: "member" },
    ],
  },
  // 3. Multi-category: politics + economics
  {
    name: "Policy & Markets",
    slug: "policy-and-markets",
    description: "Where political analysis meets prediction markets.",
    about: "Forecasting elections, legislation, and their market impact. We track polling data, policy proposals, and geopolitical events.",
    rules: "1. Keep it analytical, not partisan\n2. Update your priors when new data arrives\n3. No personal attacks",
    categories: ["politics", "economics"],
    isPublic: true,
    bannerUrl: null,
    creatorIndex: 5,
    members: [
      { userIndex: 5, role: "owner" },
      { userIndex: 0, role: "member" },
      { userIndex: 3, role: "moderator" },
      { userIndex: 4, role: "member" },
      { userIndex: 8, role: "member" },
    ],
  },
  // 4. Multi-category: technology + science + entertainment
  {
    name: "AI & Future Tech",
    slug: "ai-future-tech",
    description: "Predictions on AI milestones, tech releases, and scientific breakthroughs.",
    about: "Tracking AI benchmarks, product launches, and breakthrough research. From GPT-5 release dates to fusion energy timelines.",
    rules: "1. Distinguish hype from substance\n2. Link primary sources\n3. Declare conflicts of interest",
    categories: ["technology", "science", "entertainment"],
    isPublic: true,
    bannerUrl: null,
    creatorIndex: 4,
    members: [
      { userIndex: 4, role: "owner" },
      { userIndex: 0, role: "member" },
      { userIndex: 1, role: "member" },
      { userIndex: 3, role: "member" },
      { userIndex: 9, role: "member" },
      { userIndex: 8, role: "member" },
      { userIndex: 10, role: "member" },
    ],
  },
  // 5. PRIVATE constellation — invite only
  {
    name: "Whale Watchers",
    slug: "whale-watchers",
    description: "Private group for serious traders only.",
    about: "High-conviction calls from experienced traders. Minimum $1k bankroll. We share real positions and hold each other accountable.",
    rules: "1. Share real positions or don't post\n2. No screenshots outside the group\n3. Minimum 1 trade per week",
    categories: ["crypto", "economics", "politics"],
    isPublic: false,
    bannerUrl: null,
    creatorIndex: 0,
    members: [
      { userIndex: 0, role: "owner" },
      { userIndex: 1, role: "moderator" },
      { userIndex: 3, role: "member" },
    ],
  },
  // 6. NO categories — general constellation
  {
    name: "The Water Cooler",
    slug: "water-cooler",
    description: "Anything goes. General prediction market chatter.",
    about: "No topic restrictions. Talk about whatever markets interest you. Casual vibes only.",
    rules: null,
    categories: [],
    isPublic: true,
    bannerUrl: null,
    creatorIndex: 6,
    members: [
      { userIndex: 6, role: "owner" },
      { userIndex: 0, role: "member" },
      { userIndex: 2, role: "member" },
      { userIndex: 7, role: "member" },
      { userIndex: 8, role: "member" },
      { userIndex: 9, role: "member" },
      { userIndex: 10, role: "member" },
    ],
  },
  // 7. Single category: entertainment
  {
    name: "Awards Season",
    slug: "awards-season",
    description: "Oscars, Emmys, Grammys — predict the winners before they're announced.",
    about: "We track early screenings, guild awards, and critic scores to forecast major entertainment awards. Seasonal activity peaks during awards season.",
    rules: "1. No spoilers from early screenings\n2. Back predictions with evidence\n3. Update your picks as new info drops",
    categories: ["entertainment"],
    isPublic: true,
    bannerUrl: null,
    creatorIndex: 8,
    members: [
      { userIndex: 8, role: "owner" },
      { userIndex: 0, role: "member" },
      { userIndex: 5, role: "member" },
    ],
  },
  // 8. Single category: science — small, no rules, no about
  {
    name: "Climate Bets",
    slug: "climate-bets",
    description: "Will global temps hit the target? Place your bets.",
    about: null,
    rules: null,
    categories: ["science"],
    isPublic: true,
    bannerUrl: null,
    creatorIndex: 9,
    members: [
      { userIndex: 9, role: "owner" },
      { userIndex: 4, role: "member" },
    ],
  },
  // 9. PRIVATE, single category — exclusive politics group
  {
    name: "Election War Room",
    slug: "election-war-room",
    description: "Invite-only election forecasting.",
    about: "Serious election analysis with proprietary polling models. Members only.",
    rules: "1. No leaking internal analysis\n2. Quantify your uncertainty\n3. Weekly forecast updates required",
    categories: ["politics"],
    isPublic: false,
    bannerUrl: null,
    creatorIndex: 5,
    members: [
      { userIndex: 5, role: "owner" },
      { userIndex: 0, role: "moderator" },
      { userIndex: 3, role: "member" },
      { userIndex: 4, role: "member" },
    ],
  },
  // 10. Empty constellation — just created, no activity
  {
    name: "Fresh Start",
    slug: "fresh-start",
    description: "Brand new constellation. Join and help shape the community!",
    about: null,
    rules: null,
    categories: ["other"],
    isPublic: true,
    bannerUrl: null,
    creatorIndex: 10,
    members: [
      { userIndex: 10, role: "owner" },
    ],
  },
];

// Real Gemini prediction market tickers (long-term, non-daily-expiry)
const realTickers: Record<string, string[]> = {
  crypto: ["CRYPTOSTRUCT26", "RECESSION26"],
  economics: ["GDP2026", "CPI260512", "FED260617", "NASDAQ2026"],
  sports: ["NBAF-2526CHAMP", "NBAF-2526CONF-WEST", "NBAF-2526CONF-EAST", "STANLEY26"],
  politics: ["CABINET-26", "CTRLUSHOU", "COPRES2026", "SAVEACT"],
  technology: ["BESTAI26", "GEMINI35", "GROK5", "NASAMOON"],
  science: ["NASAMOON", "GDP2026"],
  entertainment: ["SURV50", "EUROWIN26"],
  other: ["MUSKTRIL", "SPACEXBANK", "USSTAKE"],
};

function getTickersForCategories(categories: string[]): string[] {
  if (categories.length === 0) {
    // No-category constellation gets a grab bag
    return [
      ...realTickers.crypto.slice(0, 1),
      ...realTickers.sports.slice(0, 1),
      ...realTickers.entertainment.slice(0, 1),
    ];
  }
  const tickers: string[] = [];
  for (const cat of categories) {
    const t = realTickers[cat] || realTickers.other;
    tickers.push(...t.slice(0, 2));
  }
  return [...new Set(tickers)];
}

// ─── Comment definitions per constellation ──────────────────────────────────

interface CommentDef {
  userIndex: number;
  content: string;
  positionDirection?: "yes" | "no";
  positionAmount?: number;
  positionContractLabel?: string;
  taggedMarkets?: number[]; // indices into constellation's ticker array
  daysAgo: number;
  replies?: { userIndex: number; content: string; daysAgo: number }[];
}

// Use T(n) as placeholder for ticker at index n — resolved at insert time
function getComments(ci: number): CommentDef[] {
  switch (ci) {
    case 0: // Crypto Alpha — tickers: [CRYPTOSTRUCT26, RECESSION26, GDP2026, CPI260512]
      return [
        {
          userIndex: 1, content: "{{market:T0}} is the sleeper market of the year. If crypto gets proper market structure legislation, everything re-rates.", positionDirection: "yes", positionAmount: 500, taggedMarkets: [0], daysAgo: 5,
          replies: [
            { userIndex: 0, content: "Agreed. The bipartisan support is real this time. Going heavy YES on {{market:T0}}.", daysAgo: 5 },
            { userIndex: 3, content: "Counterpoint: midterm politics could stall it. Don't underestimate legislative gridlock.", daysAgo: 4 },
            { userIndex: 7, content: "What's your stop loss on this?", daysAgo: 4 },
          ],
        },
        { userIndex: 0, content: "DeFi TVL just crossed $200B again. {{market:T1}} is not pricing this in — if there's no recession, crypto runs.", positionDirection: "no", positionAmount: 200, taggedMarkets: [1], daysAgo: 3 },
        { userIndex: 3, content: "Fed minutes coming out tomorrow. Expect volatility on {{market:T2}} and {{market:T3}}.", taggedMarkets: [2, 3], daysAgo: 2 },
        { userIndex: 4, content: "On-chain data shows whales accumulating aggressively. {{market:T1}} going NO feels like free money if the economy holds.", positionDirection: "no", positionAmount: 300, taggedMarkets: [1], daysAgo: 1,
          replies: [
            { userIndex: 1, content: "Mixed signals though — {{market:T3}} could come in hot and change the narrative fast.", daysAgo: 1 },
          ],
        },
        { userIndex: 10, content: "New here, just joined! Excited to learn from you all.", daysAgo: 0 },
      ];
    case 1: // Sports Edge — tickers: [NBAF-2526CHAMP, NBAF-2526CONF-WEST]
      return [
        {
          userIndex: 2, content: "NBA playoff model update: Celtics have a 72% chance of repeating. Going YES on {{market:T0}}.", positionDirection: "yes", positionAmount: 150, taggedMarkets: [0], daysAgo: 7,
          replies: [
            { userIndex: 5, content: "What about injury adjustments? Tatum's been dealing with that knee.", daysAgo: 6 },
            { userIndex: 0, content: "Your model has been fire this season. Tailing on {{market:T0}}.", daysAgo: 6 },
          ],
        },
        { userIndex: 6, content: "{{market:T1}} is wide open this year. Thunder, Nuggets, Wolves all have a shot.", taggedMarkets: [1], daysAgo: 4 },
        { userIndex: 7, content: "The Western Conference is stacked. I think {{market:T1}} has the most value right now.", taggedMarkets: [1], daysAgo: 2 },
        { userIndex: 0, content: "Line movement on the Lakers series looks sharp. Pros are on the under.", positionDirection: "no", positionAmount: 100, taggedMarkets: [0], daysAgo: 1 },
      ];
    case 2: // Policy & Markets — tickers: [CABINET-26, CTRLUSHOU, GDP2026, CPI260512]
      return [
        {
          userIndex: 5, content: "{{market:T1}} is mispriced. New polling aggregate has it at 52-48 but market says 60-40.", positionDirection: "no", positionAmount: 400, taggedMarkets: [1], daysAgo: 8,
          replies: [
            { userIndex: 3, content: "Polls this far out are basically noise. I'd wait until after the debates.", daysAgo: 7 },
            { userIndex: 4, content: "The prediction market is usually more accurate than polls by this point in the cycle.", daysAgo: 7 },
          ],
        },
        { userIndex: 0, content: "More {{market:T0}} drama incoming. This cabinet is historically unstable.", positionDirection: "yes", positionAmount: 250, taggedMarkets: [0], daysAgo: 4 },
        { userIndex: 3, content: "CPI report lands Thursday. Consensus is 3.1%. I think {{market:T3}} comes in hot.", positionDirection: "yes", positionAmount: 200, taggedMarkets: [3], daysAgo: 2,
          replies: [
            { userIndex: 8, content: "Shelter inflation is sticky. I agree with the over bet on {{market:T3}}.", daysAgo: 1 },
          ],
        },
        { userIndex: 4, content: "Government shutdown odds just spiked. Watch the budget negotiations — {{market:T2}} will react.", taggedMarkets: [2], daysAgo: 1 },
      ];
    case 3: // AI & Future Tech — tickers: [BESTAI26, GEMINI35, NASAMOON, GDP2026, SURV50, EUROWIN26]
      return [
        {
          userIndex: 4, content: "GPT-5 rumored for Q3. If it passes the bar exam with 95%+, {{market:T0}} will move fast.", positionDirection: "yes", positionAmount: 300, positionContractLabel: "ChatGPT", taggedMarkets: [0], daysAgo: 10,
          replies: [
            { userIndex: 1, content: "Benchmark performance ≠ AGI. But {{market:T0}} doesn't care about that distinction.", daysAgo: 9 },
            { userIndex: 9, content: "More interested in the reasoning capabilities. Benchmarks are increasingly gamed.", daysAgo: 8 },
            { userIndex: 0, content: "Bought YES on {{market:T0}} at $0.35. Feels like free money.", daysAgo: 8 },
          ],
        },
        { userIndex: 1, content: "Claude's reasoning evals are unmatched. Going heavy on Claude for {{market:T0}}.", positionDirection: "yes", positionAmount: 500, positionContractLabel: "Claude", taggedMarkets: [0], daysAgo: 8 },
        { userIndex: 0, content: "Gemini 2.5 just dropped. Multimodal is where the real competition is. YES on Gemini for {{market:T0}}.", positionDirection: "yes", positionAmount: 200, positionContractLabel: "Gemini", taggedMarkets: [0], daysAgo: 6 },
        { userIndex: 9, content: "Don't sleep on Claude — Anthropic's scaling is aggressive. Adding more.", positionDirection: "yes", positionAmount: 350, positionContractLabel: "Claude", taggedMarkets: [0], daysAgo: 5 },
        { userIndex: 8, content: "{{market:T1}} is the race to watch right now. Google is under pressure to ship.", taggedMarkets: [1], daysAgo: 5 },
        { userIndex: 3, content: "Grok is a dark horse. xAI has the compute. Small position.", positionDirection: "yes", positionAmount: 75, positionContractLabel: "Grok", taggedMarkets: [0], daysAgo: 4 },
        { userIndex: 5, content: "ChatGPT still has the distribution advantage. Enterprise adoption is massive.", positionDirection: "yes", positionAmount: 250, positionContractLabel: "ChatGPT", taggedMarkets: [0], daysAgo: 3 },
        { userIndex: 3, content: "{{market:T2}} is a long shot but the Artemis program is back on track. Going small YES.", positionDirection: "yes", positionAmount: 50, taggedMarkets: [2], daysAgo: 3 },
        { userIndex: 0, content: "Interesting cross-category play: {{market:T4}} and {{market:T5}} are both entertainment markets you can pair for diversification.", taggedMarkets: [4, 5], daysAgo: 1 },
        { userIndex: 10, content: "What resources do you all use to track AI benchmarks?", daysAgo: 0,
          replies: [
            { userIndex: 4, content: "Papers With Code leaderboards + Epoch AI database for {{market:T0}} tracking.", daysAgo: 0 },
          ],
        },
      ];
    case 4: // Whale Watchers (PRIVATE) — tickers: [CRYPTOSTRUCT26, RECESSION26, GDP2026, CPI260512, CABINET-26, CTRLUSHOU]
      return [
        {
          userIndex: 0, content: "Position update: 60% allocated to {{market:T0}} YES, 30% {{market:T4}} NO, 10% cash. Total bankroll $12k.", positionDirection: "yes", positionAmount: 7200, taggedMarkets: [0, 4], daysAgo: 6,
          replies: [
            { userIndex: 1, content: "Heavy into crypto legislation. I'm more balanced — 40/40/20. {{market:T5}} has been paying lately.", daysAgo: 5 },
            { userIndex: 3, content: "I'm sitting on mostly cash. Waiting for the {{market:T3}} print to deploy.", daysAgo: 5 },
          ],
        },
        { userIndex: 1, content: "Just closed my {{market:T1}} position for +$800. Recession odds dropping fast.", taggedMarkets: [1], daysAgo: 3 },
        { userIndex: 3, content: "Hot take: {{market:T5}} is pricing the House race correctly for once. No edge to be found.", taggedMarkets: [5], daysAgo: 1 },
      ];
    case 5: // The Water Cooler (NO categories) — tickers: [CRYPTOSTRUCT26, NBAF-2526CHAMP, SURV50]
      return [
        {
          userIndex: 6, content: "Anyone else notice prediction markets are way more fun than actual trading? No leverage to blow up your account lol", daysAgo: 12,
          replies: [
            { userIndex: 7, content: "Until you YOLO your whole bankroll on a 95% YES that resolves NO", daysAgo: 11 },
            { userIndex: 0, content: "Been there. The pain is real.", daysAgo: 11 },
            { userIndex: 9, content: "That's why bankroll management is key. Never risk more than 5% per trade.", daysAgo: 10 },
          ],
        },
        { userIndex: 8, content: "What's everyone's prediction for the weirdest market that resolves YES this year? I'm watching {{market:T2}}.", taggedMarkets: [2], daysAgo: 7 },
        { userIndex: 10, content: "How do resolution disputes work? Had a market that seemed wrong.", daysAgo: 5,
          replies: [
            { userIndex: 6, content: "Each platform has its own resolution process. Gemini uses predetermined oracle sources.", daysAgo: 4 },
          ],
        },
        { userIndex: 0, content: "Just hit my best month ever. +$2k across all positions. Feeling good.", daysAgo: 2 },
        { userIndex: 2, content: "Anyone watching {{market:T1}}? The playoff race is heating up.", taggedMarkets: [1], daysAgo: 1 },
        { userIndex: 9, content: "Hot take: most prediction market traders would be better off dollar-cost-averaging into index funds.", daysAgo: 0 },
      ];
    case 6: // Awards Season — tickers: [SURV50, EUROWIN26]
      return [
        {
          userIndex: 8, content: "{{market:T0}} is heating up. The merge tribe has a clear numbers advantage but alliances are shifting.", positionDirection: "yes", positionAmount: 200, taggedMarkets: [0], daysAgo: 14,
          replies: [
            { userIndex: 0, content: "The edit is pointing to a different winner though. Classic misdirect on {{market:T0}}.", daysAgo: 13 },
            { userIndex: 5, content: "Edgic analysis is the best predictor historically. Wait for the merge episode.", daysAgo: 12 },
          ],
        },
        { userIndex: 0, content: "{{market:T1}} is wide open. No clear front-runner yet from the semi-final results.", positionDirection: "yes", positionAmount: 100, taggedMarkets: [1], daysAgo: 5 },
      ];
    case 7: // Climate Bets — tickers: [NASAMOON, GDP2026]
      return [
        {
          userIndex: 9, content: "{{market:T0}} is the most exciting science market on the platform. Artemis III timeline keeps slipping though.", positionDirection: "yes", positionAmount: 500, taggedMarkets: [0], daysAgo: 20,
          replies: [
            { userIndex: 4, content: "What's your confidence on {{market:T0}}? The SpaceX Starship timeline is the real bottleneck.", daysAgo: 18 },
          ],
        },
        { userIndex: 4, content: "Interesting correlation: {{market:T1}} performance affects NASA funding. If GDP tanks, Artemis gets cut.", taggedMarkets: [1], daysAgo: 3 },
      ];
    case 8: // Election War Room (PRIVATE) — tickers: [CABINET-26, CTRLUSHOU]
      return [
        {
          userIndex: 5, content: "Internal model update: shifted 3 key races on {{market:T1}} based on new demographic data. Sharing the full spreadsheet in DMs.", taggedMarkets: [1], daysAgo: 4,
          replies: [
            { userIndex: 0, content: "The suburban shift is real. Your model on {{market:T1}} captures it well.", daysAgo: 3 },
            { userIndex: 3, content: "What's your methodology for weighting different polling firms?", daysAgo: 3 },
          ],
        },
        { userIndex: 4, content: "{{market:T0}} is getting spicy. Two more resignations rumored this week.", taggedMarkets: [0], daysAgo: 1 },
        { userIndex: 0, content: "Arbitrage opportunity between Polymarket and Gemini on {{market:T1}}. Going YES.", positionDirection: "yes", positionAmount: 350, taggedMarkets: [1], daysAgo: 0 },
      ];
    case 9: // Fresh Start (EMPTY — no comments)
      return [];
    default:
      return [];
  }
}

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("=".repeat(60));
  console.log("COMPREHENSIVE SEED — dropping all data and rebuilding");
  console.log("=".repeat(60));

  // ── Drop everything ────────────────────────────────────────────────────
  console.log("\nDropping existing tables...");
  await pool.query(`
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS leaderboard_entries CASCADE;
    DROP TABLE IF EXISTS user_trades CASCADE;
    DROP TABLE IF EXISTS comment_likes CASCADE;
    DROP TABLE IF EXISTS watchlist_items CASCADE;
    DROP TABLE IF EXISTS comments CASCADE;
    DROP TABLE IF EXISTS tracked_markets CASCADE;
    DROP TABLE IF EXISTS constellation_members CASCADE;
    DROP TABLE IF EXISTS constellations CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TYPE IF EXISTS constellation_topic CASCADE;
    DROP TYPE IF EXISTS constellation_role CASCADE;
    DROP TYPE IF EXISTS trade_direction CASCADE;
    DROP TYPE IF EXISTS notification_type CASCADE;
  `);

  // ── Recreate tables ────────────────────────────────────────────────────
  console.log("Recreating tables...");
  await pool.query(`
    CREATE TYPE "public"."constellation_role" AS ENUM('owner', 'moderator', 'member');
    CREATE TYPE "public"."constellation_topic" AS ENUM('politics', 'crypto', 'sports', 'entertainment', 'science', 'economics', 'technology', 'other');
    CREATE TYPE "public"."notification_type" AS ENUM('comment_reply', 'room_invite', 'market_resolved', 'leaderboard_rank');
    CREATE TYPE "public"."trade_direction" AS ENUM('yes', 'no');

    CREATE TABLE "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "username" text NOT NULL UNIQUE,
      "email" text NOT NULL UNIQUE,
      "password_hash" text NOT NULL,
      "display_name" text,
      "avatar_url" text,
      "bio" text,
      "gemini_api_key_enc" text,
      "gemini_api_secret_enc" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "constellations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "description" text,
      "about" text,
      "rules" text,
      "banner_url" text,
      "categories" text[] NOT NULL DEFAULT ARRAY[]::text[],
      "is_public" boolean NOT NULL DEFAULT true,
      "invite_code" text UNIQUE,
      "creator_id" uuid NOT NULL REFERENCES "users"("id"),
      "member_count" integer NOT NULL DEFAULT 0,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "constellation_members" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "constellation_id" uuid NOT NULL REFERENCES "constellations"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "role" "constellation_role" NOT NULL DEFAULT 'member',
      "joined_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "tracked_markets" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "constellation_id" uuid NOT NULL REFERENCES "constellations"("id") ON DELETE CASCADE,
      "market_ticker" text NOT NULL,
      "pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
      "pinned_by" uuid NOT NULL REFERENCES "users"("id"),
      CONSTRAINT "tracked_markets_constellation_ticker" UNIQUE("constellation_id", "market_ticker")
    );
    CREATE UNIQUE INDEX "tracked_markets_constellation_ticker_idx" ON "tracked_markets" ("constellation_id", "market_ticker");

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
      "period" text NOT NULL DEFAULT 'all_time',
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "notifications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "type" "notification_type" NOT NULL,
      "title" text NOT NULL,
      "body" text,
      "link" text,
      "read" boolean NOT NULL DEFAULT false,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  // ── 1. Insert users ──────────────────────────────────────────────────
  console.log("\nInserting users...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const insertedUsers: { id: string; username: string }[] = [];

  for (const u of usersData) {
    const [user] = await db
      .insert(schema.users)
      .values({
        username: u.username,
        email: u.email,
        passwordHash,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        createdAt: daysAgo(Math.floor(Math.random() * 60) + 30),
      })
      .returning({ id: schema.users.id, username: schema.users.username });
    insertedUsers.push(user);
  }
  console.log(`  Inserted ${insertedUsers.length} users.`);

  // ── 2. Insert constellations + members ────────────────────────────────
  console.log("\nInserting constellations...");
  const insertedConstellations: { id: string; slug: string }[] = [];

  for (const c of constellationsData) {
    const [constellation] = await db
      .insert(schema.constellations)
      .values({
        name: c.name,
        slug: c.slug,
        description: c.description,
        about: c.about,
        rules: c.rules,
        bannerUrl: c.bannerUrl,
        categories: c.categories,
        isPublic: c.isPublic,
        inviteCode: generateInviteCode(),
        creatorId: insertedUsers[c.creatorIndex].id,
        memberCount: c.members.length,
        createdAt: daysAgo(Math.floor(Math.random() * 30) + 15),
      })
      .returning({ id: schema.constellations.id, slug: schema.constellations.slug });
    insertedConstellations.push(constellation);

    // Insert members
    for (const m of c.members) {
      await db.insert(schema.constellationMembers).values({
        constellationId: constellation.id,
        userId: insertedUsers[m.userIndex].id,
        role: m.role,
        joinedAt: daysAgo(Math.floor(Math.random() * 14)),
      });
    }
  }
  console.log(`  Inserted ${insertedConstellations.length} constellations.`);

  // ── 3. Insert tracked markets ─────────────────────────────────────────
  console.log("\nInserting tracked markets...");
  const tickersByConstellation: string[][] = [];
  let trackedCount = 0;

  for (let ci = 0; ci < constellationsData.length; ci++) {
    const tickers = getTickersForCategories(constellationsData[ci].categories);
    tickersByConstellation.push(tickers);

    // Skip tracked markets for the empty constellation
    if (ci === 9) continue;

    for (const ticker of tickers) {
      try {
        await db.insert(schema.trackedMarkets).values({
          constellationId: insertedConstellations[ci].id,
          marketTicker: ticker,
          pinnedBy: insertedUsers[constellationsData[ci].creatorIndex].id,
          pinnedAt: daysAgo(Math.floor(Math.random() * 10)),
        });
        trackedCount++;
      } catch {
        // skip duplicates
      }
    }
  }
  console.log(`  Inserted ${trackedCount} tracked markets.`);

  // ── 4. Insert comments + replies ──────────────────────────────────────
  console.log("\nInserting comments...");
  let totalComments = 0;
  const allCommentIds: string[] = [];

  for (let ci = 0; ci < insertedConstellations.length; ci++) {
    const commentDefs = getComments(ci);
    const tickers = tickersByConstellation[ci];

    // Resolve T0, T1, etc. placeholders in content to actual tickers
    function resolveContent(content: string): string {
      return content.replace(/\{\{market:T(\d+)\}\}/g, (_match, idx) => {
        const ticker = tickers[parseInt(idx, 10)];
        return ticker ? `{{market:${ticker}}}` : _match;
      });
    }

    for (const cDef of commentDefs) {
      const taggedMarkets: string[] = [];
      if (cDef.taggedMarkets) {
        for (const idx of cDef.taggedMarkets) {
          if (tickers[idx]) taggedMarkets.push(tickers[idx]);
        }
      }

      const [parent] = await db
        .insert(schema.comments)
        .values({
          constellationId: insertedConstellations[ci].id,
          userId: insertedUsers[cDef.userIndex].id,
          content: resolveContent(cDef.content),
          positionDirection: cDef.positionDirection || null,
          positionAmount: cDef.positionAmount || null,
          positionContractLabel: cDef.positionContractLabel || null,
          taggedMarkets: taggedMarkets.length > 0 ? taggedMarkets : null,
          createdAt: daysAgo(cDef.daysAgo),
        })
        .returning({ id: schema.comments.id });
      allCommentIds.push(parent.id);
      totalComments++;

      if (cDef.replies) {
        for (const reply of cDef.replies) {
          const [r] = await db
            .insert(schema.comments)
            .values({
              constellationId: insertedConstellations[ci].id,
              userId: insertedUsers[reply.userIndex].id,
              parentId: parent.id,
              content: resolveContent(reply.content),
              createdAt: daysAgo(reply.daysAgo),
            })
            .returning({ id: schema.comments.id });
          allCommentIds.push(r.id);
          totalComments++;
        }
      }
    }
  }
  console.log(`  Inserted ${totalComments} comments.`);

  // ── 5. Insert comment likes ───────────────────────────────────────────
  console.log("\nInserting comment likes...");
  let likeCount = 0;

  for (const commentId of allCommentIds) {
    // Each comment gets 0 to 5 random likes
    const numLikes = Math.floor(Math.random() * 6);
    const shuffled = [...insertedUsers].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numLikes, shuffled.length); i++) {
      try {
        await db.insert(schema.commentLikes).values({
          commentId,
          userId: shuffled[i].id,
          createdAt: Math.random() > 0.5 ? hoursAgo(Math.floor(Math.random() * 24)) : daysAgo(Math.floor(Math.random() * 7)),
        });
        likeCount++;
      } catch {
        // skip duplicate
      }
    }
  }
  console.log(`  Inserted ${likeCount} comment likes.`);

  // ── 6. Insert trades ──────────────────────────────────────────────────
  console.log("\nInserting trades...");
  interface TradeValue {
    userId: string;
    constellationId: string;
    marketTicker: string;
    direction: "yes" | "no";
    amount: number;
    priceAtTrade: number;
    resolved: boolean;
    pnl: number | null;
    createdAt: Date;
  }
  const tradeValues: TradeValue[] = [];

  // Build membership map: which constellations each user belongs to
  const userConstellationMap = new Map<number, number[]>();
  for (let ci = 0; ci < constellationsData.length; ci++) {
    for (const m of constellationsData[ci].members) {
      const list = userConstellationMap.get(m.userIndex) || [];
      list.push(ci);
      userConstellationMap.set(m.userIndex, list);
    }
  }

  for (let ui = 0; ui < insertedUsers.length; ui++) {
    const userConstellations = userConstellationMap.get(ui) || [];
    if (userConstellations.length === 0) continue;

    // Vary trade count: 0 for brand-new users, 5-15 for active
    const numTrades = ui === 10 ? 0 : Math.floor(Math.random() * 11) + 5;

    for (let t = 0; t < numTrades; t++) {
      const ci = pick(userConstellations);
      const tickers = tickersByConstellation[ci];
      if (tickers.length === 0) continue;

      const direction = Math.random() > 0.5 ? "yes" as const : "no" as const;
      const amount = pick([10, 25, 50, 100, 150, 200, 250, 300, 500]);
      const priceAtTrade = randBetween(0.15, 0.85);
      const resolved = Math.random() > 0.35;
      let pnl: number | null = null;
      if (resolved) {
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

  if (tradeValues.length > 0) {
    await db.insert(schema.userTrades).values(tradeValues);
  }
  console.log(`  Inserted ${tradeValues.length} trades.`);

  // ── 7. Compute leaderboard ────────────────────────────────────────────
  console.log("\nComputing leaderboard...");
  const userStats = new Map<string, { totalPnl: number; totalTrades: number; wins: number }>();

  for (const trade of tradeValues) {
    const stats = userStats.get(trade.userId) || { totalPnl: 0, totalTrades: 0, wins: 0 };
    stats.totalTrades++;
    if (trade.resolved && trade.pnl !== null) {
      stats.totalPnl += trade.pnl;
      if (trade.pnl > 0) stats.wins++;
    }
    userStats.set(trade.userId, stats);
  }

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

  if (leaderboardValues.length > 0) {
    await db.insert(schema.leaderboardEntries).values(leaderboardValues);
  }
  console.log(`  Inserted ${leaderboardValues.length} leaderboard entries.`);

  // ── 8. Insert notifications for demo user ─────────────────────────────
  console.log("\nInserting notifications...");
  const demoUserId = insertedUsers[0].id;

  const notificationValues = [
    {
      userId: demoUserId,
      type: "comment_reply" as const,
      title: "Alex Chen replied to your comment",
      body: "Counterpoint: spot ETF inflows are still strong...",
      link: `/constellations/${insertedConstellations[0].slug}`,
      read: true,
      createdAt: daysAgo(5),
    },
    {
      userId: demoUserId,
      type: "room_invite" as const,
      title: "You were invited to Election War Room",
      body: "Taylor Kim invited you to join a private constellation.",
      link: `/constellations/${insertedConstellations[8].slug}`,
      read: true,
      createdAt: daysAgo(4),
    },
    {
      userId: demoUserId,
      type: "market_resolved" as const,
      title: "Market resolved: BTC 15-min prediction",
      body: "Your YES position resolved. Check your P&L.",
      link: `/constellations/${insertedConstellations[0].slug}`,
      read: false,
      createdAt: daysAgo(2),
    },
    {
      userId: demoUserId,
      type: "leaderboard_rank" as const,
      title: "You moved up on the leaderboard!",
      body: "You're now in the top 3 on Crypto Alpha.",
      link: `/constellations/${insertedConstellations[0].slug}`,
      read: false,
      createdAt: daysAgo(1),
    },
    {
      userId: demoUserId,
      type: "comment_reply" as const,
      title: "Morgan Liu replied to your comment",
      body: "I'm sitting on mostly cash. Waiting for the CPI print...",
      link: `/constellations/${insertedConstellations[4].slug}`,
      read: false,
      createdAt: hoursAgo(3),
    },
    {
      userId: demoUserId,
      type: "market_resolved" as const,
      title: "CPI market resolved",
      body: "The CPI above 3% market resolved NO. Your position won!",
      link: `/constellations/${insertedConstellations[2].slug}`,
      read: false,
      createdAt: hoursAgo(1),
    },
  ];

  await db.insert(schema.notifications).values(notificationValues);
  console.log(`  Inserted ${notificationValues.length} notifications.`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("SEED COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Users:          ${insertedUsers.length}`);
  console.log(`  Constellations: ${insertedConstellations.length} (${constellationsData.filter(c => !c.isPublic).length} private)`);
  console.log(`  Members:        ${constellationsData.reduce((sum, c) => sum + c.members.length, 0)}`);
  console.log(`  Tracked Markets:${trackedCount}`);
  console.log(`  Comments:       ${totalComments}`);
  console.log(`  Likes:          ${likeCount}`);
  console.log(`  Trades:         ${tradeValues.length}`);
  console.log(`  Leaderboard:    ${leaderboardValues.length}`);
  console.log(`  Notifications:  ${notificationValues.length}`);
  console.log();
  console.log("Constellation variety:");
  for (const c of constellationsData) {
    const cats = c.categories.length > 0 ? c.categories.join(", ") : "(none)";
    const vis = c.isPublic ? "public" : "PRIVATE";
    console.log(`  ${c.name.padEnd(22)} ${vis.padEnd(8)} categories: ${cats}`);
  }
  console.log();
  console.log("Demo credentials:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("=".repeat(60));

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
