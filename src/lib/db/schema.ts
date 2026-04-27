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
export const roomTopicEnum = pgEnum("room_topic", [
  "politics",
  "crypto",
  "sports",
  "entertainment",
  "science",
  "economics",
  "technology",
  "other",
]);

export const roomRoleEnum = pgEnum("room_role", ["owner", "moderator", "member"]);

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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Rooms
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  topic: roomTopicEnum("topic").notNull().default("other"),
  isPublic: boolean("is_public").notNull().default(true),
  inviteCode: text("invite_code").unique(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Room Members
export const roomMembers = pgTable("room_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: roomRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

// Comments
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  marketTicker: text("market_ticker"),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  positionDirection: tradeDirectionEnum("position_direction"),
  positionAmount: real("position_amount"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Watchlist Items
export const watchlistItems = pgTable("watchlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  marketTicker: text("market_ticker").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
});

// User Trades (mock/simulated trades for leaderboard)
export const userTrades = pgTable("user_trades", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
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
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
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
  rooms: many(rooms),
  roomMembers: many(roomMembers),
  comments: many(comments),
  trades: many(userTrades),
  notifications: many(notifications),
  watchlistItems: many(watchlistItems),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  creator: one(users, { fields: [rooms.creatorId], references: [users.id] }),
  members: many(roomMembers),
  comments: many(comments),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, { fields: [roomMembers.roomId], references: [rooms.id] }),
  user: one(users, { fields: [roomMembers.userId], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  room: one(rooms, { fields: [comments.roomId], references: [rooms.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id] }),
}));

export const userTradesRelations = relations(userTrades, ({ one }) => ({
  user: one(users, { fields: [userTrades.userId], references: [users.id] }),
  room: one(rooms, { fields: [userTrades.roomId], references: [rooms.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  user: one(users, { fields: [watchlistItems.userId], references: [users.id] }),
  room: one(rooms, { fields: [watchlistItems.roomId], references: [rooms.id] }),
}));
