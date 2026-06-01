<div align="center">

# CONSTELLATIONS

### **reddit for prediction markets. social meets trading.**

[![built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=for-the-badge)](https://nextjs.org)
[![powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-blue?style=for-the-badge)](https://deepmind.google/technologies/gemini)
[![real-time with Socket.io](https://img.shields.io/badge/Real--time-Socket.io-white?style=for-the-badge)](https://socket.io)

<br />

**a standalone web app where traders gather in persistent community rooms around Gemini Prediction markets. discuss. debate. compete on leaderboards. all in real-time.**

[explore rooms](#) · [view leaderboard](#) · [read docs](#)

</div>

---

## vision

**constellations is the social layer for prediction markets.**

real money prediction platforms exist, but they're often isolated trading terminals. traders don't have a place to discuss strategies, share market insights, or build reputation around their predictions. they're missing the *community*.

i built a discord/reddit-like experience where every room is tied to a real Gemini Prediction market. here, traders become community members. discussions drive market dynamics. leaderboards reward accuracy.

---

## features

### 💬 constellations
- groups tied to specific interests/niches
- real-time discussion threads with user avatars and timestamps
- markdown-rich comments with spoiler support

### 📊 market insight
- live market data streamed from Gemini Predictions API
- probability charts and trade history
- market participants and activity feed

### 🏆 leaderboards
- user/constellation reputation built on tracked stats
- seasonal rankings with badges
- profile pages showing prediction history and win rates

### 👥 user profiles
- prediction history and performance stats
- watchlist of markets and users to follow
- customizable dark-themed profiles

### ⚡ real-time updates
- Socket.io powers live comment streams
- instant market price updates
- real-time user presence indicators

---

## tech stack

| layer | tech | purpose |
|-------|------|---------|
| **frontend** | Next.js 14, React, TypeScript | fast, server-rendered UI |
| **styling** | Tailwind CSS v4, shadcn/ui | consistent dark theme components |
| **database** | PostgreSQL, Drizzle ORM | durable persistence |
| **real-time** | Socket.io + Redis | live updates across users |
| **state** | TanStack Query, Zustand | server & client state management |
| **auth** | NextAuth.js | credentials-based authentication |
| **markets** | Gemini Predictions API | real market data & odds |

---

## what's next

### phase 1 (hackathon)
- [x] core rooms & real-time comments
- [x] market display & leaderboard
- [x] user authentication
- [x] gemini predictions integration

### phase 2 (future)
- [ ] advanced market filters & search
- [ ] user notifications & mentions
- [ ] prediction tracking per user
- [ ] moderation tools for room admins
- [ ] mobile-optimized experience

---

## contributing

this is a hackathon project, but PRs are welcome. feel free to open issues for bugs or feature requests.

---

<div align="center">

**[Constellations](https://github.com/siyasiyasiya/gemini-intern-hackathon)** — *where traders discuss, debate, and compete*

*Built with ❤️ during the Gemini Intern Hackathon*

</div>
