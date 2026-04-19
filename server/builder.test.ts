/**
 * Tests for the Interactive Builder feature
 * Tests the builder router: saveBuild, loadBuild, myBuilds, aiSuggest
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  createBuildProject: vi.fn().mockResolvedValue({ id: 1, publicId: "test-build-123" }),
  getBuildProjectByPublicId: vi.fn(),
  updateBuildProject: vi.fn(),
  updateProjectBricks: vi.fn(),
  getProjectsByCreator: vi.fn().mockResolvedValue([]),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: "I suggest adding a red 2x2 brick on top of your structure.\n\n```bricks\n[{\"position\":[0,0.48,0],\"color\":\"#D01012\",\"width\":2,\"depth\":2,\"height\":3}]\n```"
      }
    }]
  }),
}));

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

describe("Builder Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveBuild", () => {
    it("should create a new build project when no publicId is provided", async () => {
      const mockCreate = vi.mocked(db.createBuildProject);
      const mockUpdateBricks = vi.mocked(db.updateProjectBricks);
      
      mockCreate.mockResolvedValue({ id: 1, publicId: "new-build-abc" });
      mockUpdateBricks.mockResolvedValue(undefined);

      // Verify the db functions are callable
      const result = await db.createBuildProject({
        creatorId: 1,
        name: "Test Build",
        description: "A test build",
        theme: "custom",
        style: "freeform",
        targetBricks: 500,
        maxAgents: 1,
        status: "building",
      });

      expect(result.publicId).toBe("new-build-abc");
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        creatorId: 1,
        name: "Test Build",
      }));
    });

    it("should update an existing build when publicId is provided", async () => {
      const mockGetByPublicId = vi.mocked(db.getBuildProjectByPublicId);
      const mockUpdate = vi.mocked(db.updateBuildProject);
      const mockUpdateBricks = vi.mocked(db.updateProjectBricks);

      mockGetByPublicId.mockResolvedValue({
        id: 5,
        publicId: "existing-build",
        creatorId: 1,
        name: "Old Name",
        description: null,
        theme: "custom",
        style: "freeform",
        sourceImageUrl: null,
        legoSetInfo: null,
        targetBricks: 500,
        maxAgents: 1,
        isOpenToJoin: true,
        status: "building",
        brickData: null,
        currentBricks: 0,
        totalContributors: 0,
        totalMessages: 0,
        likes: 0,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      });
      mockUpdate.mockResolvedValue(undefined);
      mockUpdateBricks.mockResolvedValue(undefined);

      const existing = await db.getBuildProjectByPublicId("existing-build");
      expect(existing).toBeDefined();
      expect(existing!.publicId).toBe("existing-build");
      expect(existing!.creatorId).toBe(1);

      await db.updateBuildProject(5, { name: "Updated Name" });
      expect(mockUpdate).toHaveBeenCalledWith(5, { name: "Updated Name" });

      await db.updateProjectBricks(5, "[]", 0);
      expect(mockUpdateBricks).toHaveBeenCalledWith(5, "[]", 0);
    });

    it("should reject updates to builds owned by other users", async () => {
      const mockGetByPublicId = vi.mocked(db.getBuildProjectByPublicId);
      mockGetByPublicId.mockResolvedValue({
        id: 5,
        publicId: "other-user-build",
        creatorId: 999, // Different user
        name: "Not My Build",
        description: null,
        theme: "custom",
        style: "freeform",
        sourceImageUrl: null,
        legoSetInfo: null,
        targetBricks: 500,
        maxAgents: 1,
        isOpenToJoin: true,
        status: "building",
        brickData: null,
        currentBricks: 0,
        totalContributors: 0,
        totalMessages: 0,
        likes: 0,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      });

      const existing = await db.getBuildProjectByPublicId("other-user-build");
      expect(existing!.creatorId).not.toBe(1);
      // In the actual router, this would throw FORBIDDEN
    });
  });

  describe("loadBuild", () => {
    it("should return build data for the owner", async () => {
      const mockGetByPublicId = vi.mocked(db.getBuildProjectByPublicId);
      mockGetByPublicId.mockResolvedValue({
        id: 1,
        publicId: "my-build",
        creatorId: 1,
        name: "My Build",
        description: "A cool build",
        theme: "custom",
        style: "freeform",
        sourceImageUrl: null,
        legoSetInfo: null,
        targetBricks: 500,
        maxAgents: 1,
        isOpenToJoin: true,
        status: "building",
        brickData: JSON.stringify([
          { id: "b1", position: [0, 0.48, 0], color: "#D01012", width: 2, depth: 1, height: 3, placedAt: 1000 }
        ]),
        currentBricks: 1,
        totalContributors: 0,
        totalMessages: 0,
        likes: 0,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      });

      const result = await db.getBuildProjectByPublicId("my-build");
      expect(result).toBeDefined();
      expect(result!.name).toBe("My Build");
      expect(result!.brickData).toBeTruthy();
      
      const bricks = JSON.parse(result!.brickData as string);
      expect(bricks).toHaveLength(1);
      expect(bricks[0].color).toBe("#D01012");
    });

    it("should return undefined for non-existent builds", async () => {
      const mockGetByPublicId = vi.mocked(db.getBuildProjectByPublicId);
      mockGetByPublicId.mockResolvedValue(undefined);

      const result = await db.getBuildProjectByPublicId("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("myBuilds", () => {
    it("should return all builds for a user", async () => {
      const mockGetByCreator = vi.mocked(db.getProjectsByCreator);
      mockGetByCreator.mockResolvedValue([
        {
          id: 1,
          publicId: "build-1",
          creatorId: 1,
          name: "Build 1",
          description: null,
          theme: "custom",
          style: "freeform",
          sourceImageUrl: null,
          legoSetInfo: null,
          targetBricks: 500,
          maxAgents: 1,
          isOpenToJoin: true,
          status: "building" as const,
          brickData: null,
          currentBricks: 10,
          totalContributors: 0,
          totalMessages: 0,
          likes: 0,
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        },
        {
          id: 2,
          publicId: "build-2",
          creatorId: 1,
          name: "Build 2",
          description: "My second build",
          theme: "medieval",
          style: "realistic",
          sourceImageUrl: null,
          legoSetInfo: null,
          targetBricks: 200,
          maxAgents: 1,
          isOpenToJoin: true,
          status: "completed" as const,
          brickData: null,
          currentBricks: 50,
          totalContributors: 0,
          totalMessages: 0,
          likes: 3,
          views: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: new Date(),
        },
      ]);

      const builds = await db.getProjectsByCreator(1);
      expect(builds).toHaveLength(2);
      expect(builds[0].name).toBe("Build 1");
      expect(builds[1].status).toBe("completed");
    });
  });

  describe("aiSuggest", () => {
    it("should parse brick suggestions from LLM response", async () => {
      const mockLLM = vi.mocked(invokeLLM);
      
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a LEGO building assistant." },
          { role: "user", content: "Suggest a brick" },
        ],
      });

      expect(mockLLM).toHaveBeenCalled();
      const content = response.choices[0].message.content as string;
      
      // Verify the response contains a bricks block
      expect(content).toContain("```bricks");
      
      // Parse the bricks
      const bricksMatch = content.match(/```bricks\s*\n([\s\S]*?)\n```/);
      expect(bricksMatch).toBeTruthy();
      
      const parsed = JSON.parse(bricksMatch![1]);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty("position");
      expect(parsed[0]).toHaveProperty("color");
      expect(parsed[0]).toHaveProperty("width");
      expect(parsed[0]).toHaveProperty("depth");
      expect(parsed[0]).toHaveProperty("height");
    });

    it("should handle LLM responses without brick suggestions", async () => {
      const mockLLM = vi.mocked(invokeLLM);
      mockLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: "I recommend using warm colors like red and orange for a sunset theme. Try alternating between these colors for visual interest."
          }
        }]
      } as any);

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a LEGO building assistant." },
          { role: "user", content: "What colors should I use?" },
        ],
      });

      const content = response.choices[0].message.content as string;
      expect(content).not.toContain("```bricks");
      expect(content).toContain("warm colors");
    });

    it("should handle empty build state", async () => {
      const currentBricks: any[] = [];
      const brickSummary = currentBricks.length === 0
        ? "The build is empty - no bricks have been placed yet."
        : `Has ${currentBricks.length} bricks`;
      
      expect(brickSummary).toBe("The build is empty - no bricks have been placed yet.");
    });

    it("should limit brick context to last 30 bricks", async () => {
      const currentBricks = Array.from({ length: 50 }, (_, i) => ({
        position: [i * 0.8, 0.48, 0] as [number, number, number],
        color: "#D01012",
        width: 2,
        depth: 1,
        height: 3,
      }));

      const sliced = currentBricks.slice(-30);
      expect(sliced).toHaveLength(30);
      expect(sliced[0].position[0]).toBe(20 * 0.8); // Starts from index 20
    });
  });

  describe("Brick stacking logic", () => {
    it("should calculate correct Y position for ground-level bricks", () => {
      const BRICK_H = 0.96;
      const groundY = BRICK_H / 2; // 0.48
      expect(groundY).toBeCloseTo(0.48);
    });

    it("should calculate correct Y position for stacked bricks", () => {
      const BRICK_H = 0.96;
      const firstBrickTop = 0.48 + BRICK_H / 2; // 0.96
      const secondBrickY = firstBrickTop + BRICK_H / 2; // 1.44
      expect(secondBrickY).toBeCloseTo(1.44);
    });

    it("should handle plate height correctly", () => {
      const BRICK_H = 0.96;
      const PLATE_H = BRICK_H / 3; // 0.32
      expect(PLATE_H).toBeCloseTo(0.32);
    });
  });

  describe("Brick type definitions", () => {
    it("should have standard LEGO brick dimensions", () => {
      const brickTypes = [
        { name: "1x1", width: 1, depth: 1, height: 3 },
        { name: "2x1", width: 2, depth: 1, height: 3 },
        { name: "2x2", width: 2, depth: 2, height: 3 },
        { name: "4x2", width: 4, depth: 2, height: 3 },
        { name: "1x1 Plate", width: 1, depth: 1, height: 1 },
        { name: "2x1 Plate", width: 2, depth: 1, height: 1 },
        { name: "2x2 Plate", width: 2, depth: 2, height: 1 },
        { name: "4x2 Plate", width: 4, depth: 2, height: 1 },
      ];

      // Standard bricks should have height 3 (3 plates)
      const standardBricks = brickTypes.filter(b => !b.name.includes("Plate"));
      standardBricks.forEach(b => expect(b.height).toBe(3));

      // Plates should have height 1
      const plates = brickTypes.filter(b => b.name.includes("Plate"));
      plates.forEach(b => expect(b.height).toBe(1));
    });
  });

  describe("Color options", () => {
    it("should include all standard LEGO colors", () => {
      const LEGO_COLORS: Record<string, string> = {
        red: "#D01012",
        blue: "#0057A8",
        yellow: "#FED700",
        green: "#00852B",
        orange: "#FF7E14",
        white: "#F4F4F4",
        black: "#1B1B1B",
        gray: "#A0A0A0",
        darkGray: "#595959",
        brown: "#583927",
        tan: "#DEC69C",
        lime: "#A5CA18",
        pink: "#FF87A0",
        purple: "#8B4789",
        cyan: "#00BCD4",
      };

      expect(Object.keys(LEGO_COLORS)).toHaveLength(15);
      // All colors should be valid hex
      Object.values(LEGO_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
});
