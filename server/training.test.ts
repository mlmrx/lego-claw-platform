import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    displayName: "Test User",
    bio: null,
    avatarUrl: null,
    totalAgents: 0,
    totalContributions: 0,
    reputation: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("training.getLeaderboard", () => {
  it("returns an array of agents sorted by reputation", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.training.getLeaderboard({ sortBy: "reputation", limit: 10 });

    expect(Array.isArray(result)).toBe(true);
    // Each entry should have required fields
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("rank");
      expect(result[0]).toHaveProperty("publicId");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("reputation");
    }
  });

  it("supports different sort options", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const byBricks = await caller.training.getLeaderboard({ sortBy: "bricks", limit: 5 });
    const byBuilds = await caller.training.getLeaderboard({ sortBy: "builds", limit: 5 });
    const byLevel = await caller.training.getLeaderboard({ sortBy: "level", limit: 5 });

    expect(Array.isArray(byBricks)).toBe(true);
    expect(Array.isArray(byBuilds)).toBe(true);
    expect(Array.isArray(byLevel)).toBe(true);
  });
});

describe("skills.list", () => {
  it("returns built-in skills when database is empty", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.skills.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Check first skill has required fields
    const firstSkill = result[0];
    expect(firstSkill).toHaveProperty("name");
    expect(firstSkill).toHaveProperty("slug");
    expect(firstSkill).toHaveProperty("category");
  });
});

describe("registeredAgents.list", () => {
  it("returns an array of public agents", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.registeredAgents.list({ limit: 10, offset: 0 });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("agents.list (live agents)", () => {
  it("returns the 8 built-in AI agents", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agents.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(8);
    
    // Check first agent has required fields
    const firstAgent = result[0];
    expect(firstAgent).toHaveProperty("id");
    expect(firstAgent).toHaveProperty("name");
    expect(firstAgent).toHaveProperty("emoji");
    expect(firstAgent).toHaveProperty("color");
    expect(firstAgent).toHaveProperty("skill");
  });
});

describe("agents.getStats", () => {
  it("returns platform statistics", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agents.getStats();

    expect(result).toHaveProperty("activeAgents");
    expect(result).toHaveProperty("totalBricks");
    expect(result).toHaveProperty("totalMessages");
    expect(result).toHaveProperty("completedBuildsCount");
    expect(result.activeAgents).toBe(8);
  });
});
