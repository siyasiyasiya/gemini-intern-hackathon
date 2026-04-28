"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Plus,
  Users,
  MessageSquare,
  Trophy,
  Brain,
  Zap,
  Shield,
  Radio,
} from "lucide-react";
import { ConstellationCard } from "@/components/constellations/ConstellationCard";
import { LeaderboardEntry } from "@/components/leaderboard/LeaderboardEntry";
import { cn, formatCompactNumber } from "@/lib/utils";
import type { ConstellationResponse, LeaderboardEntryResponse } from "@/types/api";
import type { Market } from "@/types/market";

// --- Scroll reveal hook ---
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={cn("animate-fade-in-up", className)}>
      {children}
    </div>
  );
}

// --- Count-up animation ---
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current || value === 0) return;
    hasAnimated.current = true;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCompactNumber(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span ref={ref}>{formatCompactNumber(value)}</span>;
}

// --- Category colors (reused from ConstellationCard) ---
const categoryColors: Record<string, string> = {
  politics: "bg-blue-500/10 text-blue-600",
  crypto: "bg-orange-500/10 text-orange-600",
  sports: "bg-green-500/10 text-green-600",
  entertainment: "bg-pink-500/10 text-pink-600",
  science: "bg-cyan-500/10 text-cyan-600",
  economics: "bg-yellow-500/10 text-yellow-600",
  technology: "bg-purple-500/10 text-purple-600",
  commodities: "bg-amber-500/10 text-amber-600",
  business: "bg-slate-500/10 text-slate-600",
  weather: "bg-sky-500/10 text-sky-600",
  media: "bg-rose-500/10 text-rose-600",
  culture: "bg-violet-500/10 text-violet-600",
  other: "bg-gray-500/10 text-gray-600",
};

const topicList = [
  "crypto", "politics", "sports", "entertainment", "science",
  "economics", "technology", "commodities", "business", "weather",
];

export default function Home() {
  const { data: session } = useSession();

  const { data: constellationsData } = useQuery({
    queryKey: ["landing-constellations"],
    queryFn: async () => {
      const res = await fetch("/api/constellations?page=1&pageSize=12");
      return res.json();
    },
  });

  const { data: marketsData } = useQuery({
    queryKey: ["landing-markets"],
    queryFn: async () => {
      const res = await fetch("/api/markets?sort=trending");
      return res.json();
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      return res.json();
    },
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ["landing-leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard?limit=3");
      return res.json();
    },
  });

  const constellations: ConstellationResponse[] = constellationsData?.data || [];
  const markets: Market[] = marketsData?.data || [];
  const tickerMarkets = markets.slice(0, 10);
  const previewMarkets = markets.slice(0, 6);
  const stats = statsData?.data || { activeMarkets: 0, constellations: 0, traders: 0 };
  const topTraders: LeaderboardEntryResponse[] = leaderboardData?.data || [];

  // Unique categories from constellations for filter pills
  const allCategories = Array.from(
    new Set(constellations.flatMap((c) => c.categories || []))
  );

  // Get user joined constellations (we'll just show CTAs for now)
  const { data: userConstellationsData } = useQuery({
    queryKey: ["user-constellations", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${session!.user!.id}/constellations`);
      return res.json();
    },
    enabled: !!session?.user?.id,
  });
  const userConstellations: ConstellationResponse[] = userConstellationsData?.data || [];

  return (
    <main className="min-h-screen">
      {/* Section 1: Live Market Ticker */}
      {tickerMarkets.length > 0 && <TickerBar markets={tickerMarkets} />}

      {/* Section 2: Hero / Welcome */}
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        {session ? (
          <WelcomeHero
            session={session}
            userConstellations={userConstellations}
          />
        ) : (
          <HeroSection stats={stats} />
        )}
      </div>

      {/* Section 3: Live Market Preview */}
      {previewMarkets.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <RevealSection>
            <MarketPreview markets={previewMarkets} />
          </RevealSection>
        </div>
      )}

      {/* Section 4 & 5: How It Works + Value Props (logged-out only) */}
      {!session && (
        <>
          <RevealSection className="bg-secondary mt-16">
            <div className="mx-auto max-w-6xl px-4 lg:px-6 py-16">
              <HowItWorks />
            </div>
          </RevealSection>

          <div className="mx-auto max-w-6xl px-4 lg:px-6 py-16">
            <RevealSection>
              <ValueProps />
            </RevealSection>
          </div>
        </>
      )}

      {/* Section 6: Top Traders */}
      {topTraders.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 lg:px-6 pb-16">
          <RevealSection>
            <TopTraders traders={topTraders} />
          </RevealSection>
        </div>
      )}

      {/* Section 7: Trending Constellations */}
      {constellations.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 lg:px-6 pb-16">
          <RevealSection>
            <ConstellationsSection
              constellations={constellations}
              allCategories={allCategories}
            />
          </RevealSection>
        </div>
      )}

      {/* Section 9: Bottom CTA */}
      <RevealSection className="bg-secondary">
        <BottomCTA isLoggedIn={!!session} />
      </RevealSection>
    </main>
  );
}

// ============================================================
// Section Components
// ============================================================

function TickerBar({ markets }: { markets: Market[] }) {
  const pills = markets.map((m) => {
    const yesPercent = Math.round(m.yesPrice * 100);
    return (
      <span
        key={m.ticker}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-background border border-border px-3 py-1 text-xs font-medium mx-2"
      >
        <span className="text-foreground truncate max-w-[200px]">{m.title}</span>
        <span className={cn("font-semibold", yesPercent >= 50 ? "text-yes-text" : "text-no-text")}>
          {yesPercent}% YES
        </span>
      </span>
    );
  });

  return (
    <div className="w-full overflow-hidden bg-secondary border-b border-border py-2">
      <div className="animate-ticker flex w-max">
        {pills}
        {/* Duplicate for seamless loop */}
        {pills}
      </div>
    </div>
  );
}

function HeroSection({ stats }: { stats: { activeMarkets: number; constellations: number; traders: number } }) {
  return (
    <div className="text-center pt-20 pb-16">
      <div className="inline-flex items-center gap-2 rounded-full bg-accent-bg border border-accent/20 px-4 py-1.5 text-sm text-accent mb-8 animate-accent-pulse">
        Powered by Gemini Prediction Markets
      </div>
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-5">
        Gemini Constellation
      </h1>
      <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
        The social layer for prediction markets. Join communities, share analysis,
        and compete on the leaderboard — all powered by real Gemini market data.
      </p>
      <div className="flex items-center justify-center gap-3 mb-12">
        <Link
          href="/constellations"
          className="rounded-full bg-primary px-7 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all btn-glow"
        >
          Browse Constellations
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-border bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors"
        >
          Sign In
        </Link>
      </div>

      {/* Social proof stats */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-accent" />
          <span className="font-semibold text-foreground"><AnimatedNumber value={stats.activeMarkets} /></span>
          <span>active markets</span>
        </div>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-accent" />
          <span className="font-semibold text-foreground"><AnimatedNumber value={stats.constellations} /></span>
          <span>constellations</span>
        </div>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-accent" />
          <span className="font-semibold text-foreground"><AnimatedNumber value={stats.traders} /></span>
          <span>traders</span>
        </div>
      </div>
    </div>
  );
}

function WelcomeHero({
  session,
  userConstellations,
}: {
  session: { user?: { name?: string | null; id?: string } };
  userConstellations: ConstellationResponse[];
}) {
  const name = session.user?.name || "Trader";

  return (
    <div className="pt-16 pb-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        Welcome back, {name}
      </h1>
      <p className="text-muted-foreground mb-8">Here&apos;s what&apos;s happening across your constellations.</p>

      <div className="flex flex-wrap items-center gap-3 mb-10">
        <Link
          href="/feed"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all btn-glow"
        >
          Your Feed
        </Link>
        <Link
          href="/constellations"
          className="rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors"
        >
          Explore Markets
        </Link>
        <Link
          href="/constellations/create"
          className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-bg px-5 py-2.5 text-sm font-medium text-accent hover:bg-accent-bg-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create
        </Link>
      </div>

      {userConstellations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Constellations</h2>
            <Link
              href="/constellations"
              className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userConstellations.slice(0, 6).map((c) => (
              <ConstellationCard key={c.id} constellation={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MarketPreview({ markets }: { markets: Market[] }) {
  return (
    <section className="pb-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Trending Markets</h2>
        <Link
          href="/constellations"
          className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {markets.map((m) => (
          <MarketPill key={m.ticker} market={m} />
        ))}
      </div>
    </section>
  );
}

function MarketPill({ market }: { market: Market }) {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const isCategorical = market.outcomes && market.outcomes.length > 1;

  return (
    <Link
      href={`/markets/${encodeURIComponent(market.ticker)}`}
      className="flex-shrink-0 w-[280px] rounded-xl border border-border bg-card p-4 transition-all hover:border-border-hover hover:bg-card-hover hover:shadow-sm"
    >
      <div className="flex items-start gap-3 mb-3">
        {market.imageUrl ? (
          <img src={market.imageUrl} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground">{market.ticker.slice(0, 2)}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className={cn(
            "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize mb-1",
            categoryColors[market.category] || categoryColors.other
          )}>
            {market.category}
          </span>
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {market.title}
          </h3>
        </div>
      </div>

      {isCategorical ? (
        <div className="space-y-1 mb-3">
          {market.outcomes!.slice(0, 2).map((o) => (
            <div key={o.ticker} className="flex items-center gap-2 text-xs">
              <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color || "#6b7280" }} />
              <span className="text-foreground truncate flex-1">{o.label}</span>
              <span className="font-medium">{Math.round(o.yesPrice * 100)}%</span>
            </div>
          ))}
          {market.outcomes!.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{market.outcomes!.length - 2} more</span>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg bg-yes-bg px-2 py-1.5 text-center">
            <span className="text-xs font-medium text-yes-text">Yes {yesPercent}%</span>
          </div>
          <div className="rounded-lg bg-no-bg px-2 py-1.5 text-center">
            <span className="text-xs font-medium text-no-text">No {noPercent}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>${formatCompactNumber(market.volume24h)} vol</span>
        {market.changePercent24h !== 0 && (
          <span className={market.changePercent24h > 0 ? "text-yes-text" : "text-no-text"}>
            {market.changePercent24h > 0 ? "+" : ""}{market.changePercent24h.toFixed(1)}%
          </span>
        )}
      </div>
    </Link>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: 1,
      icon: Users,
      title: "Join a Constellation",
      desc: "Find communities around topics you care about — crypto, politics, sports, and more.",
    },
    {
      num: 2,
      icon: MessageSquare,
      title: "Discuss & Analyze",
      desc: "Share takes, tag markets, debate predictions with others who share your interests.",
    },
    {
      num: 3,
      icon: Trophy,
      title: "Track & Compete",
      desc: "Follow markets together, make calls, and climb the leaderboard.",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.num} className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent-bg text-accent mb-4">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-foreground text-background text-xs font-bold mb-3 ml-2 align-top -mt-2">
              {s.num}
            </div>
            <h3 className="font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValueProps() {
  const props = [
    {
      icon: Brain,
      title: "Community Intelligence",
      desc: "See what your community thinks before you trade. Collective wisdom, surfaced.",
    },
    {
      icon: Zap,
      title: "Real Markets, Real Data",
      desc: "Powered by Gemini's live prediction markets. No simulations — real odds, real volume.",
    },
    {
      icon: Shield,
      title: "Reputation That Matters",
      desc: "Your accuracy follows you. Earn trust through correct calls and climb the ranks.",
    },
    {
      icon: Radio,
      title: "Real-Time Discussion",
      desc: "Live comments and market updates as events unfold. Never miss the moment.",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-10">Why Constellation?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {props.map((p) => (
          <div
            key={p.title}
            className="rounded-xl border border-border bg-card p-6 transition-colors hover:bg-card-hover"
          >
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-accent-bg text-accent mb-4">
              <p.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1.5">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopTraders({ traders }: { traders: LeaderboardEntryResponse[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Top Traders</h2>
        <Link
          href="/leaderboard"
          className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
        >
          Full leaderboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {traders.map((t) => (
          <LeaderboardEntry key={t.userId} entry={t} />
        ))}
      </div>
    </section>
  );
}

function ConstellationsSection({
  constellations,
  allCategories,
}: {
  constellations: ConstellationResponse[];
  allCategories: string[];
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Trending Constellations</h2>
        <Link
          href="/constellations"
          className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {allCategories.slice(0, 8).map((cat) => (
            <Link
              key={cat}
              href={`/constellations?category=${cat}`}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors hover:opacity-80",
                categoryColors[cat] || categoryColors.other
              )}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {constellations.map((c) => (
          <ConstellationCard key={c.id} constellation={c} />
        ))}
      </div>
    </section>
  );
}

function BottomCTA({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="mx-auto max-w-6xl px-4 lg:px-6 py-20 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-4">
        {isLoggedIn ? "Start a new conversation" : "Ready to join the conversation?"}
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        {isLoggedIn
          ? "Create a constellation and build your community around the markets you follow."
          : "Join thousands discussing, analyzing, and competing on real prediction markets."}
      </p>
      <Link
        href={isLoggedIn ? "/constellations/create" : "/register"}
        className="inline-flex rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all btn-glow"
      >
        {isLoggedIn ? "Create a Constellation" : "Get Started"}
      </Link>

      {/* Topic tags */}
      <div className="flex flex-wrap justify-center gap-2 mt-10">
        {topicList.map((topic) => (
          <Link
            key={topic}
            href={`/constellations?category=${topic}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors hover:opacity-80",
              categoryColors[topic] || categoryColors.other
            )}
          >
            {topic}
          </Link>
        ))}
      </div>
    </div>
  );
}
