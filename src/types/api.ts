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
  categories: string[];
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
  positionContractLabel?: string | null;
  taggedMarkets: string[] | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  user: UserResponse;
  replyCount?: number;
  replies?: CommentResponse[];
}

export interface FeedItemResponse extends CommentResponse {
  constellation: {
    id: string;
    name: string;
    slug: string;
    topic: string;
  };
  replyCount: number;
}

export interface ActivityItemResponse extends FeedItemResponse {
  parentComment?: {
    username: string;
    content: string;
  };
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

export interface TradeDetail {
  pnl: number;
  market: string;
  direction: "yes" | "no" | null;
  amount: number | null;
  price: number | null;
  date: string | null;
  resolved: "won" | "lost" | null;
}

export interface UserStatsResponse {
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  constellationsJoined: number;
  commentsPosted: number;
  bestTrade: TradeDetail | null;
  worstTrade: TradeDetail | null;
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

export interface ConsensusData {
  consensusPercent: number; // 0-1, dollar-weighted portion of money on YES
  totalPositions: number; // distinct current members with a position
  yesAmount: number;
  noAmount: number;
}

export interface OutcomeConsensusEntry {
  label: string;
  amount: number;
  percent: number; // 0-1, share of total positioned volume
  count: number;   // number of distinct positions
}

export interface CategoricalConsensusData {
  outcomes: OutcomeConsensusEntry[];
  totalPositions: number;
  totalAmount: number;
}

export interface ConstellationStatsResponse {
  collectiveAccuracy: number;
  totalVolume: number;
  totalTrades: number;
  memberCount: number;
}
