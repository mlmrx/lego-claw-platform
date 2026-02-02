import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("agents router", () => {
  it("returns list of AI agents", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.agents.list();

    expect(agents).toBeInstanceOf(Array);
    expect(agents.length).toBe(8);
    
    // Check first agent has required properties
    const firstAgent = agents[0];
    expect(firstAgent).toHaveProperty("id");
    expect(firstAgent).toHaveProperty("name");
    expect(firstAgent).toHaveProperty("emoji");
    expect(firstAgent).toHaveProperty("color");
    expect(firstAgent).toHaveProperty("skill");
    expect(firstAgent).toHaveProperty("personality");
  });

  it("returns null for current build when none exists", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Reset any existing build first
    await caller.agents.resetBuild();
    
    const build = await caller.agents.getCurrentBuild();
    expect(build).toBeNull();
  });

  it("returns empty bricks array when no build exists", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Reset any existing build first
    await caller.agents.resetBuild();
    
    const bricks = await caller.agents.getBricks();
    expect(bricks).toEqual([]);
  });

  it("returns stats with correct structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.agents.getStats();

    expect(stats).toHaveProperty("activeAgents");
    expect(stats).toHaveProperty("totalBricks");
    expect(stats).toHaveProperty("totalMessages");
    expect(stats).toHaveProperty("currentBuild");
    expect(stats.activeAgents).toBe(8);
  });

  it("can reset build successfully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agents.resetBuild();
    
    expect(result).toEqual({ success: true });
  });

  it("returns empty messages when no build exists", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Reset any existing build first
    await caller.agents.resetBuild();
    
    const messages = await caller.agents.getMessages({ limit: 10 });
    expect(messages).toEqual([]);
  });
});
