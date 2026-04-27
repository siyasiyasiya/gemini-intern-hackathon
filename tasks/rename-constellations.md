# Task: Rename Communities → Constellations

## Overview
Rename all instances of "communities" to "constellations" throughout the codebase. This is a branding change — a "constellation" is what we call a community/group in the Gemini Constellation app.

## App Name
- "Predictions Communities" → "Gemini Constellation"
- A community is now a "constellation"

## What to Rename

### Database Schema (`src/lib/db/schema.ts`)
- `communities` table → `constellations`
- `communityTopicEnum` → `constellationTopicEnum`
- `communityRoleEnum` → `constellationRoleEnum`
- `communityMembers` table → `constellationMembers`
- All `communityId` columns → `constellationId`
- All relations referencing communities → constellations

### Types (`src/types/api.ts`)
- `CommunityResponse` → `ConstellationResponse`
- `CommunityStatsResponse` → `ConstellationStatsResponse`
- `communitiesJoined` → `constellationsJoined`
- `communityId` fields → `constellationId`

### API Routes
- `src/app/api/communities/` → rename directory to `src/app/api/constellations/`
- All route handlers: update references from community to constellation
- Update any `roomId`/`communityId` params to `constellationId`

### Pages
- `src/app/communities/` → rename directory to `src/app/constellations/`
- Update all page content/copy

### Components (`src/components/communities/`)
- Rename directory to `src/components/constellations/`
- `CommunityCard` → `ConstellationCard`
- `CommunityHeader` → `ConstellationHeader`
- `CommunityList` → `ConstellationList` (if exists)
- `CreateCommunityForm` → `CreateConstellationForm` (if exists)
- `MemberList` — update props from communityId to constellationId

### Hooks
- `useComments` — update communitySlug references
- `useSocket` — update community references

### Layout & Nav (`src/components/layout/Navbar.tsx`)
- "Communities" nav link → "Constellations"
- href `/communities` → `/constellations`

### Home Page (`src/app/page.tsx`)
- "Browse Communities" → "Browse Constellations"
- "Create a Community" → "Create a Constellation"
- "Trending Communities" → "Trending Constellations"
- API fetch from `/api/communities` → `/api/constellations`

### Root Layout (`src/app/layout.tsx`)
- Title: "Predictions Communities" → "Gemini Constellation"

### Socket Server (`src/server/index.ts`)
- `join-community` → `join-constellation`
- `leave-community` → `leave-constellation`
- `communityPresence` → `constellationPresence`

### Auth Pages
- Update any "communities" references in redirects to "constellations"

### Seed file (`src/lib/db/seed.ts`)
- Update any community references

## Rules
- Do NOT change the YES/NO market functionality or market-related code
- Do NOT change color tokens or styling
- Keep all existing functionality working — this is purely a rename
- After renaming, run `pnpm build` to verify no errors
- Commit when done

## Copy Guide
- "community" → "constellation"
- "communities" → "constellations"
- "Community" → "Constellation"
- "Communities" → "Constellations"
- App title: "Gemini Constellation"
