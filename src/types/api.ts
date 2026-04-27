export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  error?: string;
  total: number;
  page: number;
  pageSize: number;
}

export interface ConstellationResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  about: string | null;
  rules: string | null;
  bannerUrl: string | null;
  topic: string;
  isPublic: boolean;
  inviteCode: string | null;
  creatorId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface CommentResponse {
  id: string;
  constellationId: string;
  userId: string;
  marketTicker: string | null;
  parentId: string | null;
  content: string;
  positionDirection: "yes" | "no" | null;
  positionAmount: number | null;
  createdAt: string;
  user: UserResponse;
  replies?: CommentResponse[];
}

export interface LeaderboardEntryResponse {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
}

export interface UserStatsResponse {
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  constellationsJoined: number;
  commentsPosted: number;
  bestTrade: number;
  worstTrade: number;
  geminiConnected?: boolean;
  /** "gemini" = live API data, "local" = seeded/simulated trades, "none" = no trade data */
  dataSource?: "gemini" | "local" | "none";
}

export interface TrackedMarketResponse {
  id: string;
  constellationId: string;
  marketTicker: string;
  pinnedAt: string;
  pinnedBy: string;
}

export interface ConstellationStatsResponse {
  collectiveAccuracy: number;
  totalVolume: number;
  totalTrades: number;
  activeMemberCount: number;
}
