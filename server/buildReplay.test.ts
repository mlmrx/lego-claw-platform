import { describe, expect, it } from "vitest";
import { buildReplayEvents } from "./buildReplay";

describe("buildReplayEvents", () => {
  it("creates chronological replay events from persisted message brick actions", () => {
    const events = buildReplayEvents(
      { brickData: [], createdAt: new Date("2026-01-01T00:00:00Z") },
      [
        {
          message: {
            id: 2,
            publicId: "m2",
            content: "Added the second support",
            brickAction: { brick: { position: { x: 2, y: 1, z: 0 }, color: "#00AA00", width: 2, depth: 2, height: 1 } },
            createdAt: new Date("2026-01-01T00:00:02Z"),
          },
          agent: { name: "Engineer", emoji: "⚙️", color: "#777777" },
        },
        {
          message: {
            id: 1,
            publicId: "m1",
            content: "Started the foundation",
            brickAction: { position: [-2, 0, 0], color: "#AA0000", width: 4, depth: 2, height: 1 },
            createdAt: new Date("2026-01-01T00:00:00Z"),
          },
          agent: { name: "Architect", emoji: "📐", color: "#0055BF" },
        },
      ],
    );

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      id: "m1-0",
      agentName: "Architect",
      position: [-2, 0, 0],
      timestamp: 0,
      source: "message",
    });
    expect(events[1]).toMatchObject({
      id: "m2-0",
      agentName: "Engineer",
      position: [2, 1, 0],
      timestamp: 2000,
    });
  });

  it("uses real final brick data when older builds have no persisted action history", () => {
    const events = buildReplayEvents(
      {
        createdAt: new Date("2026-01-01T00:00:00Z"),
        brickData: [
          { position: [0, 0, 0], color: "#FFD700", width: 2, depth: 4, height: 1, placedBy: "Palette" },
          { x: 2, y: 1, z: 0, color: "#0055BF", placedBy: "Nova" },
        ],
      },
      [],
    );

    expect(events).toHaveLength(2);
    expect(events[0].source).toBe("snapshot");
    expect(events[0].agentName).toBe("Palette");
    expect(events[1]).toMatchObject({
      position: [2, 1, 0],
      agentName: "Nova",
      timestamp: 220,
    });
  });

  it("ignores messages without brick actions", () => {
    const events = buildReplayEvents(
      { brickData: [], createdAt: Date.now() },
      [
        {
          message: {
            id: 1,
            publicId: "m1",
            content: "Discussing the plan",
            brickAction: null,
            createdAt: Date.now(),
          },
          agent: { name: "Diplomat", emoji: "🤝", color: "#00BCD4" },
        },
      ],
    );
    expect(events).toEqual([]);
  });
});
