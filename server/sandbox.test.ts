import { describe, expect, it, vi } from "vitest";
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

describe("sandbox.getScenarios", () => {
  it("returns all 8 scenario templates", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const scenarios = await caller.sandbox.getScenarios();

    expect(scenarios).toHaveLength(8);
    expect(scenarios[0]).toHaveProperty("id");
    expect(scenarios[0]).toHaveProperty("name");
    expect(scenarios[0]).toHaveProperty("description");
    expect(scenarios[0]).toHaveProperty("category");
    expect(scenarios[0]).toHaveProperty("difficulty");
    expect(scenarios[0]).toHaveProperty("icon");
  });

  it("includes expected scenario IDs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const scenarios = await caller.sandbox.getScenarios();
    const ids = scenarios.map((s: { id: string }) => s.id);

    expect(ids).toContain("tower-challenge");
    expect(ids).toContain("color-harmony");
    expect(ids).toContain("bridge-engineering");
    expect(ids).toContain("symmetry-debate");
    expect(ids).toContain("resource-scarcity");
    expect(ids).toContain("blind-collaboration");
    expect(ids).toContain("speed-build");
    expect(ids).toContain("creative-freestyle");
  });

  it("each scenario has valid difficulty level", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const scenarios = await caller.sandbox.getScenarios();
    const validDifficulties = ["beginner", "intermediate", "advanced"];

    for (const scenario of scenarios) {
      expect(validDifficulties).toContain((scenario as { difficulty: string }).difficulty);
    }
  });
});

describe("sandbox.getPresets", () => {
  it("returns all 6 agent presets", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const presets = await caller.sandbox.getPresets();

    expect(presets).toHaveLength(6);
  });

  it("each preset has required personality fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const presets = await caller.sandbox.getPresets();

    for (const preset of presets) {
      expect(preset).toHaveProperty("id");
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("emoji");
      expect(preset).toHaveProperty("color");
      expect(preset).toHaveProperty("personality");
      expect(preset).toHaveProperty("strategy");
      expect(preset).toHaveProperty("specialization");

      const p = (preset as { personality: Record<string, number> }).personality;
      expect(p.creativity).toBeGreaterThanOrEqual(0);
      expect(p.creativity).toBeLessThanOrEqual(100);
      expect(p.precision).toBeGreaterThanOrEqual(0);
      expect(p.precision).toBeLessThanOrEqual(100);
      expect(p.sociability).toBeGreaterThanOrEqual(0);
      expect(p.sociability).toBeLessThanOrEqual(100);
      expect(p.boldness).toBeGreaterThanOrEqual(0);
      expect(p.boldness).toBeLessThanOrEqual(100);
    }
  });

  it("presets have valid strategy values", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const presets = await caller.sandbox.getPresets();
    const validStrategies = ["cooperative", "competitive", "independent", "leader", "follower"];

    for (const preset of presets) {
      expect(validStrategies).toContain((preset as { strategy: string }).strategy);
    }
  });

  it("includes expected preset archetypes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const presets = await caller.sandbox.getPresets();
    const ids = presets.map((p: { id: string }) => p.id);

    expect(ids).toContain("architect");
    expect(ids).toContain("artist");
    expect(ids).toContain("engineer");
    expect(ids).toContain("diplomat");
    expect(ids).toContain("maverick");
    expect(ids).toContain("perfectionist");
  });
});

describe("sandbox.startSimulation", () => {
  it("rejects with fewer than 2 agents", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sandbox.startSimulation({
        scenarioId: "tower-challenge",
        agents: [
          {
            id: "architect",
            name: "The Architect",
            emoji: "📐",
            color: "#1E88E5",
            personality: { creativity: 40, precision: 95, sociability: 60, boldness: 70 },
            strategy: "leader",
            specialization: "structural",
          },
        ],
        totalTurns: 4,
      })
    ).rejects.toThrow();
  });

  it("rejects with more than 4 agents", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const agent = {
      id: "test",
      name: "Test",
      emoji: "🤖",
      color: "#000000",
      personality: { creativity: 50, precision: 50, sociability: 50, boldness: 50 },
      strategy: "cooperative" as const,
      specialization: "structural",
    };

    await expect(
      caller.sandbox.startSimulation({
        scenarioId: "tower-challenge",
        agents: [
          { ...agent, id: "a1" },
          { ...agent, id: "a2" },
          { ...agent, id: "a3" },
          { ...agent, id: "a4" },
          { ...agent, id: "a5" },
        ],
        totalTurns: 4,
      })
    ).rejects.toThrow();
  });

  it("rejects invalid scenario ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const agent = {
      id: "test",
      name: "Test",
      emoji: "🤖",
      color: "#000000",
      personality: { creativity: 50, precision: 50, sociability: 50, boldness: 50 },
      strategy: "cooperative" as const,
      specialization: "structural",
    };

    await expect(
      caller.sandbox.startSimulation({
        scenarioId: "nonexistent-scenario",
        agents: [
          { ...agent, id: "a1" },
          { ...agent, id: "a2" },
        ],
        totalTurns: 4,
      })
    ).rejects.toThrow();
  });

  it("rejects turns below minimum (4)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const agent = {
      id: "test",
      name: "Test",
      emoji: "🤖",
      color: "#000000",
      personality: { creativity: 50, precision: 50, sociability: 50, boldness: 50 },
      strategy: "cooperative" as const,
      specialization: "structural",
    };

    await expect(
      caller.sandbox.startSimulation({
        scenarioId: "tower-challenge",
        agents: [
          { ...agent, id: "a1" },
          { ...agent, id: "a2" },
        ],
        totalTurns: 2,
      })
    ).rejects.toThrow();
  });

  it("rejects turns above maximum (20)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const agent = {
      id: "test",
      name: "Test",
      emoji: "🤖",
      color: "#000000",
      personality: { creativity: 50, precision: 50, sociability: 50, boldness: 50 },
      strategy: "cooperative" as const,
      specialization: "structural",
    };

    await expect(
      caller.sandbox.startSimulation({
        scenarioId: "tower-challenge",
        agents: [
          { ...agent, id: "a1" },
          { ...agent, id: "a2" },
        ],
        totalTurns: 25,
      })
    ).rejects.toThrow();
  });
});

describe("sandbox.runSingleTurn", () => {
  it("rejects invalid scenario ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const agent = {
      id: "test",
      name: "Test",
      emoji: "🤖",
      color: "#000000",
      personality: { creativity: 50, precision: 50, sociability: 50, boldness: 50 },
      strategy: "cooperative" as const,
      specialization: "structural",
    };

    await expect(
      caller.sandbox.runSingleTurn({
        scenarioId: "nonexistent",
        agents: [
          { ...agent, id: "a1" },
          { ...agent, id: "a2" },
        ],
        previousTurns: [],
        nextAgentIndex: 0,
      })
    ).rejects.toThrow();
  });
});

describe("sandbox.analyzeSimulation", () => {
  it("accepts valid analysis input structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // This will call LLM which may fail in test env, but validates input schema
    // The function has a fallback, so it should return a result regardless
    const result = await caller.sandbox.analyzeSimulation({
      scenario: "Tower Challenge",
      agents: [
        {
          name: "The Architect",
          personality: { creativity: 40, precision: 95, sociability: 60, boldness: 70 },
          strategy: "leader",
        },
        {
          name: "The Artist",
          personality: { creativity: 95, precision: 30, sociability: 75, boldness: 50 },
          strategy: "independent",
        },
      ],
      turns: [
        {
          agentName: "The Architect",
          action: "speak",
          message: "Let's build a strong foundation first.",
          reasoning: "Starting with stability is key.",
          metrics: { cooperationScore: 80, buildQuality: 70, communicationClarity: 90 },
        },
        {
          agentName: "The Artist",
          action: "suggest",
          message: "I think we should use blue and white colors.",
          reasoning: "Color harmony will make it look better.",
          metrics: { cooperationScore: 75, buildQuality: 60, communicationClarity: 85 },
        },
      ],
    });

    // Should return analysis structure (either from LLM or fallback)
    expect(result).toHaveProperty("overallGrade");
    expect(result).toHaveProperty("collaborationPattern");
    expect(result).toHaveProperty("keyInsights");
    expect(result).toHaveProperty("agentAnalysis");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("patternClassification");
  });
});
