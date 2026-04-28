import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const constellationTopicEnum = pgEnum("constellation_topic", [
  "politics",
  "crypto",
  "sports",
  "entertainment",
  "science",
  "economics",
  "technology",
  "other",
]);

export const constellationRoleEnum = pgEnum("constellation_role", ["owner", "moderator", "member"]);

export const tradeDirectionEnum = pgEnum("trade_direction", ["yes", "no"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "comment_reply",
  "room_invite",
  "market_resolved",
  "leaderboard_rank",
]);

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  geminiApiKeyEnc: text("gemini_api_key_enc"),
  geminiApiSecretEnc: text("gemini_api_secret_enc"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Constellations
export const constellations = pgTable("constellations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  about: text("about"),
  rules: text("rules"),
  bannerUrl: text("banner_url"),
  topic: constellationTopicEnum("topic").notNull().default("other"),
  isPublic: boolean("is_public").notNull().default(true),
  inviteCode: text("invite_code").unique(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Constellation Members
export const constellationMembers = pgTable("constellation_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  constellationId: uuid("constellation_id")
    .notNull()
    .references(() => constellations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: constellationRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tracked Markets
export const trackedMarkets = pgTable("tracked_markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  constellationId: uuid("constellation_id")
    .notNull()
    .references(() => constellations.id, { onDelete: "cascade" }),
  marketTicker: text("market_ticker").notNull(),
  pinnedAt: timestamp("pinned_at", { withTimezone: true }).defaultNow().notNull(),
  pinnedBy: uuid("pinned_by")
    .notNull()
    .references(() => users.id),
});

// Comments
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  constellationId: uuid("constellation_id")
    .notNull()
    .references(() => constellations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  marketTicker: text("market_ticker"),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  positionDirection: tradeDirectionEnum("position_direction"),
  positionAmount: real("position_amount"),
  taggedMarkets: text("tagged_markets").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Watchlist Items
export const watchlistItems = pgTable("watchlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  constellationId: uuid("constellation_id")
    .notNull()
    .references(() => constellations.id, { onDelete: "cascade" }),
  marketTicker: text("market_ticker").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
});

// User Trades (mock/simulated trades for leaderboard)
export const userTrades = pgTable("user_trades", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  constellationId: uuid("constellation_id")
    .notNull()
    .references(() => constellations.id, { onDelete: "cascade" }),
  marketTicker: text("market_ticker").notNull(),
  direction: tradeDirectionEnum("direction").notNull(),
  amount: real("amount").notNull(),
  priceAtTrade: real("price_at_trade").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  pnl: real("pnl"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Leaderboard Entries (cached/computed)
export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  constellationId: uuid("constellation_id").references(() => constellations.id, { onDelete: "cascade" }),
  totalPnl: real("total_pnl").notNull().default(0),
  totalTrades: integer("total_trades").notNull().default(0),
  winRate: real("win_rate").notNull().default(0),
  rank: integer("rank"),
  period: text("period").notNull().default("all_time"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  constellations: many(constellations),
  constellationMembers: many(constellationMembers),
  comments: many(comments),
  trades: many(userTrades),
  notifications: many(notifications),
  watchlistItems: many(watchlistItems),
}));

export const constellationsRelations = relations(constellations, ({ one, many }) => ({
  creator: one(users, { fields: [constellations.creatorId], references: [users.id] }),
  members: many(constellationMembers),
  comments: many(comments),
  trackedMarkets: many(trackedMarkets),
}));

export const constellationMembersRelations = relations(constellationMembers, ({ one }) => ({
  constellation: one(constellations, { fields: [constellationMembers.constellationId], references: [constellations.id] }),
  user: one(users, { fields: [constellationMembers.userId], references: [users.id] }),
}));

export const trackedMarketsRelations = relations(trackedMarkets, ({ one }) => ({
  constellation: one(constellations, { fields: [trackedMarkets.constellationId], references: [constellations.id] }),
  pinnedByUser: one(users, { fields: [trackedMarkets.pinnedBy], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  constellation: one(constellations, { fields: [comments.constellationId], references: [constellations.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id] }),
}));

export const userTradesRelations = relations(userTrades, ({ one }) => ({
  user: one(users, { fields: [userTrades.userId], references: [users.id] }),
  constellation: one(constellations, { fields: [userTrades.constellationId], references: [constellations.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  user: one(users, { fields: [watchlistItems.userId], references: [users.id] }),
  constellation: one(constellations, { fields: [watchlistItems.constellationId], references: [constellations.id] }),
}));
