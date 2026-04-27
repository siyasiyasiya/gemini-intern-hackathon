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

export interface RoomResponse {
  id: string;
  name: string;
  description: string | null;
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
  roomId: string;
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
  roomsJoined: number;
  commentsPosted: number;
  bestTrade: number;
  worstTrade: number;
}
