import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getAllSkills: vi.fn().mockResolvedValue([]),
  getSkillBySlug: vi.fn().mockResolvedValue(null),
  getPublicAgents: vi.fn().mockResolvedValue([]),
  getAgentByPublicId: vi.fn().mockResolvedValue(null),
  getAgentsByOwner: vi.fn().mockResolvedValue([]),
  createAgent: vi.fn().mockResolvedValue({ id: 1, publicId: "test-agent-123" }),
  updateAgent: vi.fn().mockResolvedValue(undefined),
  deleteAgent: vi.fn().mockResolvedValue(undefined),
  addSkillToAgent: vi.fn().mockResolvedValue(undefined),
  getAgentSkills: vi.fn().mockResolvedValue([]),
  getActiveProjects: vi.fn().mockResolvedValue([]),
  getCompletedProjects: vi.fn().mockResolvedValue([]),
  getBuildProjectByPublicId: vi.fn().mockResolvedValue(null),
  createBuildProject: vi.fn().mockResolvedValue({ id: 1, publicId: "test-project-123" }),
  getProjectParticipants: vi.fn().mockResolvedValue([]),
  getProjectsByCreator: vi.fn().mockResolvedValue([]),
  getRecentActivity: vi.fn().mockResolvedValue([]),
  getActivityForProject: vi.fn().mockResolvedValue([]),
  getRealPlatformStats: vi.fn().mockResolvedValue({
    totalAgents: 5,
    totalBricksPlaced: 100,
    totalBuildsCompleted: 3,
    totalUsers: 10,
  }),
  getCompletedBuildsFromDb: vi.fn().mockResolvedValue([]),
  saveCompletedBuild: vi.fn().mockResolvedValue(undefined),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test AI response" } }]
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    displayName: "Test User",
    bio: null,
    avatarUrl: null,
    isVerified: true,
    totalAgents: 0,
    totalContributions: 0,
    reputation: 0,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Skills Router", () => {
  it("returns built-in skills when database is empty", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const skills = await caller.skills.list();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(0);
    // Check that built-in skills have expected structure
    const firstSkill = skills[0];
    expect(firstSkill).toHaveProperty("name");
    expect(firstSkill).toHaveProperty("slug");
    expect(firstSkill).toHaveProperty("category");
  });

  it("returns skill by slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const skill = await caller.skills.bySlug({ slug: "structural-engineering" });

    expect(skill).not.toBeNull();
    expect(skill?.name).toBe("Structural Engineering");
    expect(skill?.category).toBe("engineering");
  });

  it("returns skills by category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const engineeringSkills = await caller.skills.byCategory({ category: "engineering" });

    expect(Array.isArray(engineeringSkills)).toBe(true);
    engineeringSkills.forEach(skill => {
      expect(skill.category).toBe("engineering");
    });
  });
});

describe("Live Agents Router", () => {
  it("returns list of demo agents", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.agents.list();

    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBe(8); // 8 default demo agents
    
    const firstAgent = agents[0];
    expect(firstAgent).toHaveProperty("id");
    expect(firstAgent).toHaveProperty("name");
    expect(firstAgent).toHaveProperty("emoji");
    expect(firstAgent).toHaveProperty("color");
    expect(firstAgent).toHaveProperty("skill");
  });

  it("returns agent stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.agents.getStats();

    expect(stats).toHaveProperty("activeAgents");
    expect(stats).toHaveProperty("totalBricks");
    expect(stats).toHaveProperty("totalMessages");
    expect(stats).toHaveProperty("completedBuildsCount");
    expect(typeof stats.activeAgents).toBe("number");
  });

  it("generates next action with message and optional brick", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agents.generateNextAction();

    expect(result).toHaveProperty("message");
    expect(result).toHaveProperty("agent");
    expect(result).toHaveProperty("buildProgress");
    expect(result).toHaveProperty("totalBricks");
    
    expect(result.message).toHaveProperty("id");
    expect(result.message).toHaveProperty("agentId");
    expect(result.message).toHaveProperty("content");
    expect(result.message).toHaveProperty("type");
    expect(result.message).toHaveProperty("timestamp");
  });

  it("resets build successfully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agents.resetBuild();

    expect(result).toEqual({ success: true });
  });

  it("returns completed builds list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const builds = await caller.agents.getCompletedBuilds({ limit: 10 });

    expect(Array.isArray(builds)).toBe(true);
  });
});

describe("Registered Agents Router", () => {
  it("returns empty list for public agents when none exist", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.registeredAgents.list();

    expect(Array.isArray(agents)).toBe(true);
  });

  it("returns user's agents when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.registeredAgents.myAgents();

    expect(Array.isArray(agents)).toBe(true);
  });

  it("creates agent when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.registeredAgents.create({
      name: "Test Agent",
      emoji: "🤖",
      color: "#E53935",
      tagline: "A test agent",
      voiceStyle: "casual",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("publicId");
  });
});

describe("Projects Router", () => {
  it("returns active projects", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.active();

    expect(Array.isArray(projects)).toBe(true);
  });

  it("returns completed projects", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.completed();

    expect(Array.isArray(projects)).toBe(true);
  });

  it("creates project when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      name: "Test Project",
      description: "A test build project",
      theme: "space",
      targetBricks: 100,
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("publicId");
  });
});

describe("Activity Router", () => {
  it("returns recent activity", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const activity = await caller.activity.recent();

    expect(Array.isArray(activity)).toBe(true);
  });
});

describe("Profile Router", () => {
  it("returns user profile when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const profile = await caller.profile.me();

    expect(profile).not.toBeNull();
    expect(profile?.email).toBe("test@example.com");
  });

  it("returns user stats when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.profile.stats();

    expect(stats).toHaveProperty("totalAgents");
    expect(stats).toHaveProperty("totalBricksPlaced");
    expect(stats).toHaveProperty("totalBuildsContributed");
    expect(stats).toHaveProperty("reputation");
  });
});
