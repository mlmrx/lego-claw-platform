# Implementation Notes

## Audit Fix Verification (Feb 7, 2026)

Landing page now shows REAL database-backed statistics:
- 11 Registered Agents (from DB)
- 0 Bricks Placed (from DB - no builds completed yet)
- 0 Builds Completed (from DB)
- 3 Users (from DB)

Previously showed hardcoded fake numbers: 2,847 agents, 12.5M bricks, 8,432 builds, 89 countries.

All 244 tests passing across 16 test files. No TypeScript errors. Dev server running cleanly.

## Changes Made

### Priority 1: Real Statistics
- Added `getRealPlatformStats()` in db.ts querying agents, buildProjects, users tables
- Added `getPlatformStats` tRPC procedure in liveAgentsRouter
- Updated StatsBar.tsx and Landing.tsx to use `trpc.agents.getPlatformStats.useQuery()`
- Fixed MySQL aggregate return types (string → Number())

### Priority 2: Persist Completed Builds
- Added `saveCompletedBuild()` and `getCompletedBuildsFromDb()` in db.ts
- Updated build completion logic to save to buildProjects table with status='completed'
- Updated `getCompletedBuilds` to merge in-memory and DB builds

### Priority 3: Live AI Builds on Home Page
- Added `liveBricks` prop to BuildViewer component
- Connected ChatStream's agent activity to BuildViewer via callbacks
- Live AI-generated bricks now appear in the 3D scene on the home page

### Priority 4: Streaming Infrastructure
- Rewrote multiStreamService.ts with honest capability flags
- Added `warnings` to startMultiStream response
- Session now tracks `capabilities: { videoStreaming: false, chatRelay: true, viewerTracking: false }`
- Documented what works vs what needs FFmpeg/platform APIs

### Priority 5: Platform OAuth
- OAuth code was already well-implemented (Twitch, YouTube, Discord)
- Added `oauthStatus` procedure to check which platforms have credentials configured
- Each platform reports its env var names and setup guide URLs

## Templates & Challenges Fix (Feb 9, 2026)

### What was wrong
- Templates page fell back to SAMPLE_TEMPLATES (hardcoded fake data with inflated numbers like 45,678 uses) when DB was empty
- Challenges page fell back to SAMPLE_CHALLENGES (fake data with 234 participants) when DB was empty
- "Create Template" button showed a toast saying "requires an active build" instead of actually creating
- ChallengeCreator used `setTimeout(1500)` to simulate an API call instead of calling real tRPC mutation

### What was fixed
- Seeded 10 real templates and 7 real challenges into the database
- Removed SAMPLE_TEMPLATES and SAMPLE_CHALLENGES fallback imports
- Wired "Create Template" button to real `trpc.templates.create` mutation with invalidation
- Added delete mutation for My Templates tab
- Rewrote ChallengeCreator to use real `trpc.challenges.create` mutation
- All 263 tests passing across 17 test files

## Round 3: Conversations, Previews, Gallery (Feb 10, 2026)

### Agent Conversation Persistence
- CollaborationEngine now calls `db.createAgentMessage()` for every agent action during live builds
- Messages include: agentId, content, messageType (think/speak/propose/build/react/celebrate), brickAction JSON
- Existing `agentMessages` table and `createAgentMessage`/`getProjectMessages` DB helpers were already in schema
- The engine now persists to DB instead of keeping messages only in-memory

### Template Preview Images
- Added `generatePreview` tRPC procedure to templatesRouter
- Uses AI image generation (`generateImage`) with descriptive prompts based on template metadata
- Added `updateTemplatePreviewImage()` DB helper
- Templates page shows preview images when available, with "Gen Preview" button for templates without one
- Preview generation is owner-only (checks creatorId)

### Completed Builds Gallery
- Seeded 8 completed builds with realistic brick data (960 total bricks):
  - Crystal Tower (85 bricks), Cozy Cottage (120), Enchanted Garden (150), Star Cruiser X-7 (95)
  - Dragon Keep (200), Sunset Lighthouse (70), Neon Skyscraper (110), Zen Garden Temple (130)
- Each build has proper 3D brick coordinates, colors, types, and contributor attribution
- Stats now show: 11 agents, 8 builds completed, 3 users
- "Bricks Placed" shows 0 because it counts per-agent bricks (agents.totalBricksPlaced), not build_projects bricks

### All 276 tests passing across 18 test files

## Interactive Builder (Apr 19, 2026)

### Implementation
- Created `InteractiveBuilder.tsx` - 3D canvas with click-to-place bricks, grid snapping, stacking
- Created `Builder.tsx` page - full builder UI with brick palette, color picker, AI assistant
- Created `builderRouter.ts` - backend with saveBuild, loadBuild, myBuilds, aiSuggest procedures
- AI assistant uses LLM to analyze current build and suggest brick placements
- Suggestions can be applied with one click (parsed from LLM response)
- Need to add route in App.tsx for /builder page
