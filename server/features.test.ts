import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getPublicTemplates: vi.fn().mockResolvedValue([
    { publicId: "tmpl1", name: "Test Template", totalBricks: 50, usageCount: 10, likes: 5, difficulty: "beginner", isPublic: true },
  ]),
  getFeaturedTemplates: vi.fn().mockResolvedValue([
    { publicId: "tmpl2", name: "Featured Template", totalBricks: 100, usageCount: 50, likes: 25, isFeatured: true },
  ]),
  getBuildTemplateByPublicId: vi.fn().mockResolvedValue({
    id: 1, publicId: "tmpl1", name: "Test Template", brickData: [{ x: 0, y: 0, z: 0, color: "#ff0000" }], creatorId: 1,
  }),
  getTemplatesByCreator: vi.fn().mockResolvedValue([]),
  incrementTemplateUsage: vi.fn().mockResolvedValue(undefined),
  likeTemplate: vi.fn().mockResolvedValue(undefined),
  createBuildTemplate: vi.fn().mockResolvedValue({ id: 1, publicId: "new-tmpl" }),
  getActiveChallenges: vi.fn().mockResolvedValue([
    { publicId: "chal1", name: "Speed Build", status: "active", participantCount: 5, maxAgents: 10, challengeType: "speed" },
  ]),
  getUpcomingChallenges: vi.fn().mockResolvedValue([
    { publicId: "chal2", name: "Upcoming Challenge", status: "upcoming", durationMinutes: 30 },
  ]),
  getCompletedChallenges: vi.fn().mockResolvedValue([]),
  getChallengeByPublicId: vi.fn().mockResolvedValue({
    id: 1, publicId: "chal1", name: "Speed Build", status: "active", participantCount: 5, maxAgents: 10, minLevel: 1,
  }),
  getChallengeParticipants: vi.fn().mockResolvedValue([]),
  getAgentByPublicId: vi.fn().mockResolvedValue({ id: 1, publicId: "agent1", name: "Test Agent", ownerId: 1, level: 5 }),
  joinChallenge: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue("notif1"),
  getUserNotifications: vi.fn().mockResolvedValue([
    { publicId: "notif1", title: "Test", message: "Test notification", notificationType: "system", isRead: false, createdAt: new Date() },
  ]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(3),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  archiveNotification: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Templates Router", () => {
  it("lists public templates", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.templates.list({ limit: 10, offset: 0 });
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Template");
  });

  it("gets featured templates", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.templates.featured({ limit: 5 });
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Featured Template");
  });

  it("uses a template and returns brick data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.templates.use({ publicId: "tmpl1" });
    
    expect(result.success).toBe(true);
    expect(result.brickData).toBeDefined();
  });

  it("likes a template when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.templates.like({ publicId: "tmpl1" });
    
    expect(result.success).toBe(true);
  });
});

describe("Challenges Router", () => {
  it("lists active challenges", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.challenges.active({ limit: 10 });
    
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("active");
  });

  it("lists upcoming challenges", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.challenges.upcoming({ limit: 10 });
    
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("upcoming");
  });

  it("gets challenge participants", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.challenges.participants({ publicId: "chal1" });
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows authenticated user to join a challenge", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.challenges.join({
      challengePublicId: "chal1",
      agentPublicId: "agent1",
    });
    
    expect(result.success).toBe(true);
  });
});

describe("Notifications Router", () => {
  it("lists user notifications", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.notifications.list({ limit: 20, includeRead: false });
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test");
  });

  it("gets unread notification count", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.notifications.unreadCount();
    
    expect(result).toBe(3);
  });

  it("marks a notification as read", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.notifications.markRead({ publicId: "notif1" });
    
    expect(result.success).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.notifications.markAllRead();
    
    expect(result.success).toBe(true);
  });

  it("archives a notification", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.notifications.archive({ publicId: "notif1" });
    
    expect(result.success).toBe(true);
  });
});
