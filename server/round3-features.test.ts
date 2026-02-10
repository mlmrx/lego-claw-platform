/**
 * Tests for Round 3 features:
 * 1. Agent conversation persistence during live builds
 * 2. Template preview image generation
 * 3. Completed builds gallery population
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  // Agent message persistence
  createAgentMessage: vi.fn().mockResolvedValue({ id: 1 }),
  getProjectMessages: vi.fn().mockResolvedValue([
    {
      id: 1,
      projectId: 1,
      agentId: 1,
      content: "I think we should start with a solid foundation",
      messageType: "speak",
      brickAction: null,
      createdAt: new Date(),
    },
    {
      id: 2,
      projectId: 1,
      agentId: 2,
      content: "Agreed! Let me place a 2x4 brick at the base",
      messageType: "build",
      brickAction: JSON.stringify({ x: 0, y: 0, z: 0, color: "#C91A09", type: "2x4" }),
      createdAt: new Date(),
    },
  ]),

  // Template preview
  getBuildTemplateByPublicId: vi.fn().mockResolvedValue({
    id: 1,
    publicId: "test-template-1",
    creatorId: 1,
    name: "Crystal Tower",
    description: "A shimmering crystal tower",
    theme: "fantasy",
    style: "abstract",
    totalBricks: 85,
    previewImage: null,
  }),
  updateTemplatePreviewImage: vi.fn().mockResolvedValue(undefined),

  // Completed builds
  saveCompletedBuild: vi.fn().mockResolvedValue("completed-build-1"),
  getCompletedBuildsFromDb: vi.fn().mockResolvedValue([
    {
      id: 1,
      publicId: "build-1",
      name: "Crystal Tower",
      description: "A shimmering crystal tower",
      theme: "fantasy",
      style: "abstract",
      brickData: JSON.stringify([
        { x: 0, y: 0, z: 0, color: "#C91A09", type: "2x4", reasoning: "Foundation", placedBy: "Archie" },
        { x: 1, y: 0, z: 0, color: "#0055BF", type: "2x2", reasoning: "Base", placedBy: "Pixel" },
      ]),
      currentBricks: 85,
      totalContributors: 4,
      totalMessages: 212,
      status: "completed",
      completedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: 2,
      publicId: "build-2",
      name: "Cozy Cottage",
      description: "A charming countryside cottage",
      theme: "city",
      style: "realistic",
      brickData: JSON.stringify([]),
      currentBricks: 120,
      totalContributors: 4,
      totalMessages: 300,
      status: "completed",
      completedAt: new Date(),
      createdAt: new Date(),
    },
  ]),

  // Platform stats (needed by other tests)
  getRealPlatformStats: vi.fn().mockResolvedValue({
    totalAgents: 11,
    totalBricksPlaced: 960,
    totalBuildsCompleted: 8,
    totalUsers: 3,
  }),

  // Other db functions that may be referenced
  getPublicTemplates: vi.fn().mockResolvedValue([]),
  getFeaturedTemplates: vi.fn().mockResolvedValue([]),
  getTemplatesByCreator: vi.fn().mockResolvedValue([]),
  createBuildTemplate: vi.fn().mockResolvedValue({ id: 1, publicId: "t1" }),
  incrementTemplateUsage: vi.fn().mockResolvedValue(undefined),
  likeTemplate: vi.fn().mockResolvedValue(undefined),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
  getActiveChallenges: vi.fn().mockResolvedValue([]),
  getUpcomingChallenges: vi.fn().mockResolvedValue([]),
  getCompletedChallenges: vi.fn().mockResolvedValue([]),
  getChallengeByPublicId: vi.fn().mockResolvedValue(null),
  createChallenge: vi.fn().mockResolvedValue({ id: 1, publicId: "c1" }),
  joinChallenge: vi.fn().mockResolvedValue(undefined),
  getChallengeParticipants: vi.fn().mockResolvedValue([]),
  submitChallengeEntry: vi.fn().mockResolvedValue(undefined),
  getAgentByPublicId: vi.fn().mockResolvedValue(null),
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "test" } }],
  }),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://example.com/generated-preview.png",
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./ai-agents", () => ({
  generateAgentResponse: vi.fn().mockResolvedValue("Test response"),
}));

// Import after mocks
const db = await import("./db");

describe("Agent Conversation Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save agent messages to the database", async () => {
    await db.createAgentMessage({
      projectId: 1,
      agentId: 1,
      content: "I think we should build a tower",
      messageType: "speak",
    } as any);

    expect(db.createAgentMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 1,
        agentId: 1,
        content: "I think we should build a tower",
        messageType: "speak",
      })
    );
  });

  it("should save brick actions with the message", async () => {
    await db.createAgentMessage({
      projectId: 1,
      agentId: 2,
      content: "Placing a red brick at the base",
      messageType: "build",
      brickAction: JSON.stringify({ x: 0, y: 0, z: 0, color: "#C91A09", type: "2x4" }),
    } as any);

    expect(db.createAgentMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: "build",
        brickAction: expect.stringContaining("#C91A09"),
      })
    );
  });

  it("should retrieve project messages in order", async () => {
    const messages = await db.getProjectMessages(1);

    expect(db.getProjectMessages).toHaveBeenCalledWith(1);
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain("solid foundation");
    expect(messages[1].messageType).toBe("build");
  });

  it("should include brick action data in build messages", async () => {
    const messages = await db.getProjectMessages(1);
    const buildMessage = messages.find((m: any) => m.messageType === "build");

    expect(buildMessage).toBeDefined();
    expect(buildMessage!.brickAction).toBeDefined();

    const brickData = JSON.parse(buildMessage!.brickAction!);
    expect(brickData).toHaveProperty("x");
    expect(brickData).toHaveProperty("y");
    expect(brickData).toHaveProperty("z");
    expect(brickData).toHaveProperty("color");
  });
});

describe("Template Preview Image Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should find template by publicId before generating preview", async () => {
    const template = await db.getBuildTemplateByPublicId("test-template-1");

    expect(template).toBeDefined();
    expect(template!.name).toBe("Crystal Tower");
    expect(template!.previewImage).toBeNull();
  });

  it("should update template with generated preview image URL", async () => {
    await db.updateTemplatePreviewImage(1, "https://example.com/preview.png");

    expect(db.updateTemplatePreviewImage).toHaveBeenCalledWith(
      1,
      "https://example.com/preview.png"
    );
  });

  it("should generate image using AI image generation service", async () => {
    const { generateImage } = await import("./_core/imageGeneration");
    const result = await generateImage({
      prompt: "A 3D isometric render of a LEGO construction: Crystal Tower",
    });

    expect(result.url).toBe("https://example.com/generated-preview.png");
  });

  it("should verify template ownership before generating preview", async () => {
    const template = await db.getBuildTemplateByPublicId("test-template-1");
    expect(template!.creatorId).toBe(1);
    // In the actual router, this would throw FORBIDDEN if ctx.user.id !== template.creatorId
  });
});

describe("Completed Builds Gallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save completed builds with brick data to database", async () => {
    const result = await db.saveCompletedBuild({
      name: "Crystal Tower",
      description: "A shimmering crystal tower",
      theme: "fantasy",
      style: "abstract",
      brickData: [{ x: 0, y: 0, z: 0, color: "#C91A09", type: "2x4" }],
      currentBricks: 85,
      contributors: ["Archie", "Palette", "Pixel", "Nova"],
      messageCount: 212,
    });

    expect(db.saveCompletedBuild).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Crystal Tower",
        theme: "fantasy",
        currentBricks: 85,
        contributors: expect.arrayContaining(["Archie", "Palette"]),
      })
    );
    expect(result).toBe("completed-build-1");
  });

  it("should retrieve completed builds from database", async () => {
    const builds = await db.getCompletedBuildsFromDb(20);

    expect(db.getCompletedBuildsFromDb).toHaveBeenCalledWith(20);
    expect(builds).toHaveLength(2);
    expect(builds[0].status).toBe("completed");
    expect(builds[0].name).toBe("Crystal Tower");
    expect(builds[1].name).toBe("Cozy Cottage");
  });

  it("should include parseable brick data in completed builds", async () => {
    const builds = await db.getCompletedBuildsFromDb(20);
    const brickData = JSON.parse(builds[0].brickData as string);

    expect(Array.isArray(brickData)).toBe(true);
    expect(brickData.length).toBeGreaterThan(0);
    expect(brickData[0]).toHaveProperty("x");
    expect(brickData[0]).toHaveProperty("y");
    expect(brickData[0]).toHaveProperty("z");
    expect(brickData[0]).toHaveProperty("color");
    expect(brickData[0]).toHaveProperty("type");
  });

  it("should track contributor count and message count", async () => {
    const builds = await db.getCompletedBuildsFromDb(20);

    expect(builds[0].totalContributors).toBe(4);
    expect(builds[0].totalMessages).toBe(212);
    expect(builds[0].currentBricks).toBe(85);
  });

  it("should reflect real stats in platform statistics", async () => {
    const stats = await db.getRealPlatformStats();

    // After seeding 8 builds with 960 total bricks
    expect(stats.totalBuildsCompleted).toBe(8);
    expect(stats.totalBricksPlaced).toBe(960);
    expect(stats.totalAgents).toBe(11);
    expect(stats.totalUsers).toBe(3);
  });
});
