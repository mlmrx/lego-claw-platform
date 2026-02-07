/**
 * Tests for Audit Fix Priorities
 * 
 * Priority 1: Real statistics from database (not hardcoded)
 * Priority 2: Completed builds persisted to database
 * Priority 3: Live AI builds connected to home page
 * Priority 4: Streaming infrastructure with honest capabilities
 * Priority 5: Platform OAuth status check
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  createMultiStreamSession,
  startMultiStream,
  getMultiStreamSession,
  stopMultiStream,
  addChatMessage,
  getChatMessages,
  cleanupSession,
} from "./multiStreamService";

// ============================================
// Test helpers
// ============================================

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

// ============================================
// Priority 1: Real Statistics Tests
// ============================================

describe("Priority 1: Real Statistics from Database", () => {
  it("getPlatformStats returns numeric values from database", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.agents.getPlatformStats();

    // Should return an object with numeric stats
    expect(stats).toBeDefined();
    expect(typeof stats.totalAgents).toBe("number");
    expect(typeof stats.totalBuildsCompleted).toBe("number");
    expect(typeof stats.totalBricksPlaced).toBe("number");
    expect(typeof stats.totalUsers).toBe("number");

    // Stats should be non-negative
    expect(stats.totalAgents).toBeGreaterThanOrEqual(0);
    expect(stats.totalBuildsCompleted).toBeGreaterThanOrEqual(0);
    expect(stats.totalBricksPlaced).toBeGreaterThanOrEqual(0);
    expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
  });

  it("stats should NOT contain hardcoded values like 2847 or 12500000", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.agents.getPlatformStats();

    // These were the old hardcoded values - they should NOT appear
    expect(stats.totalAgents).not.toBe(2847);
    expect(stats.totalBricksPlaced).not.toBe(12500000);
    expect(stats.totalBuildsCompleted).not.toBe(8432);
  });
});

// ============================================
// Priority 2: Persisted Completed Builds Tests
// ============================================

describe("Priority 2: Completed Builds Persistence", () => {
  it("getCompletedBuilds returns an array", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const builds = await caller.agents.getCompletedBuilds({ limit: 10 });

    expect(Array.isArray(builds)).toBe(true);
  });

  it("completed builds have required fields", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const builds = await caller.agents.getCompletedBuilds({ limit: 10 });

    // If there are builds, check their structure
    if (builds.length > 0) {
      const build = builds[0];
      expect(build).toHaveProperty("id");
      expect(build).toHaveProperty("name");
      expect(build).toHaveProperty("brickCount");
    }
  });
});

// ============================================
// Priority 4: Streaming Capabilities Tests
// ============================================

describe("Priority 4: Honest Streaming Infrastructure", () => {
  let sessionId: string;

  beforeEach(() => {
    // Create a fresh session for each test
    const session = createMultiStreamSession("build-123", "owner-1", [
      {
        id: "dest-1",
        platform: "youtube",
        streamKey: "test-key-123",
        enabled: true,
      },
      {
        id: "dest-2",
        platform: "twitch",
        streamKey: "test-key-456",
        enabled: true,
      },
    ]);
    sessionId = session.id;
  });

  it("creates a session with honest capability flags", () => {
    const session = getMultiStreamSession(sessionId);
    expect(session).toBeDefined();
    expect(session!.capabilities).toEqual({
      videoStreaming: false,  // No FFmpeg available
      chatRelay: true,        // In-app chat works
      viewerTracking: false,  // No platform API connections
    });
  });

  it("startMultiStream returns warnings about video relay", async () => {
    const result = await startMultiStream(sessionId);

    expect(result.success).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("RTMP video relay");
  });

  it("startMultiStream generates valid RTMP URLs", async () => {
    const result = await startMultiStream(sessionId);

    expect(Object.keys(result.streamUrls).length).toBe(2);
    expect(result.streamUrls["dest-1"]).toContain("rtmp://");
    expect(result.streamUrls["dest-1"]).toContain("test-key-123");
  });

  it("rejects destinations without stream keys", async () => {
    const session = createMultiStreamSession("build-456", "owner-2", [
      {
        id: "dest-no-key",
        platform: "youtube",
        streamKey: "",
        enabled: true,
      },
    ]);

    const result = await startMultiStream(session.id);
    expect(result.errors["dest-no-key"]).toContain("No stream key");
    cleanupSession(session.id);
  });

  it("in-app chat works correctly", () => {
    addChatMessage(sessionId, "custom", "TestUser", "Hello from the app!");
    const messages = getChatMessages(sessionId);

    expect(messages.length).toBe(1);
    expect(messages[0].username).toBe("TestUser");
    expect(messages[0].message).toBe("Hello from the app!");
    expect(messages[0].platform).toBe("custom");
  });

  it("stopMultiStream updates session status", async () => {
    await startMultiStream(sessionId);
    const stopped = await stopMultiStream(sessionId);

    expect(stopped).toBe(true);
    const session = getMultiStreamSession(sessionId);
    expect(session!.status).toBe("idle");
  });

  // Cleanup
  it("cleanup removes session", () => {
    cleanupSession(sessionId);
    expect(getMultiStreamSession(sessionId)).toBeUndefined();
  });
});

// ============================================
// Priority 5: Platform OAuth Status Tests
// ============================================

describe("Priority 5: Platform OAuth Status", () => {
  it("oauthStatus returns status for all three platforms", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.integrations.oauthStatus();

    expect(Array.isArray(status)).toBe(true);
    expect(status.length).toBe(3);

    const platforms = status.map(s => s.platform);
    expect(platforms).toContain("twitch");
    expect(platforms).toContain("youtube");
    expect(platforms).toContain("discord");
  });

  it("each platform status has required fields", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.integrations.oauthStatus();

    for (const platform of status) {
      expect(platform).toHaveProperty("platform");
      expect(platform).toHaveProperty("name");
      expect(platform).toHaveProperty("oauthConfigured");
      expect(platform).toHaveProperty("hasClientId");
      expect(platform).toHaveProperty("hasClientSecret");
      expect(platform).toHaveProperty("envVars");
      expect(platform).toHaveProperty("setupGuide");
      expect(typeof platform.oauthConfigured).toBe("boolean");
    }
  });

  it("reports correct env var names for each platform", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.integrations.oauthStatus();

    const twitch = status.find(s => s.platform === "twitch")!;
    expect(twitch.envVars.clientId).toBe("TWITCH_CLIENT_ID");
    expect(twitch.envVars.clientSecret).toBe("TWITCH_CLIENT_SECRET");

    const youtube = status.find(s => s.platform === "youtube")!;
    expect(youtube.envVars.clientId).toBe("YOUTUBE_CLIENT_ID");
    expect(youtube.envVars.clientSecret).toBe("YOUTUBE_CLIENT_SECRET");

    const discord = status.find(s => s.platform === "discord")!;
    expect(discord.envVars.clientId).toBe("DISCORD_CLIENT_ID");
    expect(discord.envVars.clientSecret).toBe("DISCORD_CLIENT_SECRET");
  });

  it("provides setup guide URLs for each platform", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.integrations.oauthStatus();

    for (const platform of status) {
      expect(platform.setupGuide).toBeTruthy();
      expect(platform.setupGuide).toMatch(/^https:\/\//);
    }
  });
});

// ============================================
// Multi-Stream Router Integration Tests
// ============================================

describe("Multi-Stream Router: Session capabilities exposed", () => {
  it("getPlatforms returns platform configs", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const platforms = await caller.multiStream.getPlatforms();

    expect(Array.isArray(platforms)).toBe(true);
    expect(platforms.length).toBeGreaterThan(0);

    const youtube = platforms.find(p => p.id === "youtube");
    expect(youtube).toBeDefined();
    expect(youtube!.name).toBe("YouTube Live");
    expect(youtube!.supportsChat).toBe(true);
  });
});
