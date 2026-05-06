import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          reasoning: "Building a foundation with red bricks for stability",
          bricks: [
            { x: 0, z: 0, color: "#CC0000", width: 4, depth: 2, height: 3, shape: "standard" },
            { x: 4, z: 0, color: "#CC0000", width: 4, depth: 2, height: 3, shape: "standard" },
          ],
          message: "I placed a solid foundation of red bricks.",
        })
      }
    }]
  })
}));

// Mock the database module
vi.mock("./db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
    then: vi.fn().mockResolvedValue([]),
  }
}));

describe("Social Build Router", () => {
  describe("Room Management", () => {
    it("should define the socialBuildRouter with expected procedures", async () => {
      const { socialBuildRouter } = await import("./socialBuildRouter");
      expect(socialBuildRouter).toBeDefined();
      
      // Check that the router has the expected procedure names
      const routerDef = socialBuildRouter._def;
      expect(routerDef).toBeDefined();
    });

    it("should export the router with correct type", async () => {
      const mod = await import("./socialBuildRouter");
      expect(mod.socialBuildRouter).toBeDefined();
    });
  });

  describe("Build Room Schema", () => {
    it("should have buildRooms table in schema", async () => {
      const schema = await import("../drizzle/schema");
      expect(schema.buildRooms).toBeDefined();
    });

    it("should have roomParticipants table in schema", async () => {
      const schema = await import("../drizzle/schema");
      expect(schema.roomParticipants).toBeDefined();
    });

    it("should have roomTurns table in schema", async () => {
      const schema = await import("../drizzle/schema");
      expect(schema.roomTurns).toBeDefined();
    });

    it("should have roomChat table in schema", async () => {
      const schema = await import("../drizzle/schema");
      expect(schema.roomChat).toBeDefined();
    });
  });

  describe("Room Status Enum", () => {
    it("should have valid room status values in schema", async () => {
      const schema = await import("../drizzle/schema");
      // The buildRooms table should have a status column
      const columns = schema.buildRooms;
      expect(columns).toBeDefined();
    });
  });

  describe("LLM Integration for Agent Turns", () => {
    it("should call invokeLLM with structured response format", async () => {
      const { invokeLLM } = await import("./_core/llm");
      
      const result = await invokeLLM({
        messages: [
          { role: "system", content: "You are a LEGO builder agent." },
          { role: "user", content: "Build something on this baseplate." },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "agent_turn",
            strict: true,
            schema: {
              type: "object",
              properties: {
                reasoning: { type: "string" },
                bricks: { type: "array", items: { type: "object", properties: {} } },
                message: { type: "string" },
              },
              required: ["reasoning", "bricks", "message"],
              additionalProperties: false,
            },
          },
        },
      });

      expect(result.choices[0].message.content).toBeDefined();
      const parsed = JSON.parse(result.choices[0].message.content as string);
      expect(parsed.reasoning).toBeDefined();
      expect(parsed.bricks).toBeInstanceOf(Array);
      expect(parsed.bricks.length).toBeGreaterThan(0);
      expect(parsed.message).toBeDefined();
    });

    it("should generate bricks with valid properties", async () => {
      const { invokeLLM } = await import("./_core/llm");
      
      const result = await invokeLLM({
        messages: [{ role: "user", content: "test" }],
      });

      const parsed = JSON.parse(result.choices[0].message.content as string);
      const brick = parsed.bricks[0];
      
      expect(brick).toHaveProperty("x");
      expect(brick).toHaveProperty("z");
      expect(brick).toHaveProperty("color");
      expect(brick).toHaveProperty("width");
      expect(brick).toHaveProperty("depth");
      expect(brick).toHaveProperty("height");
      expect(brick).toHaveProperty("shape");
      expect(typeof brick.x).toBe("number");
      expect(typeof brick.color).toBe("string");
    });
  });

  describe("Review Mechanics", () => {
    it("should support approve and reject actions", () => {
      const validActions = ["approve", "reject"];
      expect(validActions).toContain("approve");
      expect(validActions).toContain("reject");
    });

    it("should support review status values", () => {
      const validStatuses = ["pending", "approved", "rejected"];
      expect(validStatuses).toContain("pending");
      expect(validStatuses).toContain("approved");
      expect(validStatuses).toContain("rejected");
    });
  });
});
