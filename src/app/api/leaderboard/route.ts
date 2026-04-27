import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, LeaderboardEntryResponse } from "@/types/api";

// Seeded random for consistent mock data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MOCK_USERS = [
  { username: "whale_watcher", displayName: "Whale Watcher" },
  { username: "prediction_pro", displayName: "Prediction Pro" },
  { username: "market_sage", displayName: "Market Sage" },
  { username: "crystal_ball", displayName: "Crystal Ball" },
  { username: "odds_master", displayName: "Odds Master" },
  { username: "trend_rider", displayName: "Trend Rider" },
  { username: "sigma_trader", displayName: "Sigma Trader" },
  { username: "poly_maxi", displayName: "Poly Maxi" },
  { username: "alpha_seeker", displayName: "Alpha Seeker" },
  { username: "bet_builder", displayName: "Bet Builder" },
  { username: "risk_analyst", displayName: "Risk Analyst" },
  { username: "forecast_king", displayName: "Forecast King" },
  { username: "data_driven", displayName: "Data Driven" },
  { username: "contrarian_cal", displayName: "Contrarian Cal" },
  { username: "momentum_mike", displayName: "Momentum Mike" },
  { username: "sharp_money", displayName: "Sharp Money" },
  { username: "edge_finder", displayName: "Edge Finder" },
  { username: "bayesian_beth", displayName: "Bayesian Beth" },
];

function generateMockLeaderboard(
  period: string,
  limit: number
): LeaderboardEntryResponse[] {
  const seed = period === "weekly" ? 42 : period === "monthly" ? 137 : 7;
  const rand = seededRandom(seed);

  const entries = MOCK_USERS.map((user, i) => {
    const pnl = (rand() - 0.3) * 5000;
    const totalTrades = Math.floor(rand() * 150) + 10;
    const winRate = 0.35 + rand() * 0.35;

    return {
      rank: 0,
      userId: `mock-${i}`,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: null,
      totalPnl: Math.round(pnl * 100) / 100,
      totalTrades,
      winRate: Math.round(winRate * 1000) / 1000,
    };
  });

  entries.sort((a, b) => b.totalPnl - a.totalPnl);
  entries.forEach((e, i) => (e.rank = i + 1));

  return entries.slice(0, limit);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all_time";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  try {
    const leaderboard = generateMockLeaderboard(period, limit);

    return NextResponse.json<ApiResponse<LeaderboardEntryResponse[]>>({
      data: leaderboard,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
