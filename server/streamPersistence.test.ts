import { beforeEach, describe, expect, it, vi } from "vitest";

const values = vi.fn();
const insert = vi.fn(() => ({ values }));

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({ insert })),
}));

import { streamAnalytics, streamClips } from "../drizzle/schema";
import { createStreamAnalyticsSnapshot, createStreamClipMarker } from "./streamPersistence";

describe("stream persistence", () => {
  beforeEach(() => {
    values.mockReset();
    values.mockResolvedValue(undefined);
    insert.mockClear();
  });

  it("persists a capability-honest analytics snapshot", async () => {
    const publicId = await createStreamAnalyticsSnapshot({
      userId: 9,
      sessionId: "session-1",
      buildSessionId: "build-1",
      status: "configured",
      destinationCount: 2,
      totalViewers: 0,
      platformBreakdown: { youtube: 0, twitch: 0 },
      chatMessageCount: 3,
      startedAt: new Date("2026-09-01T20:00:00Z"),
    });

    expect(publicId).toHaveLength(16);
    expect(insert).toHaveBeenCalledWith(streamAnalytics);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      publicId,
      status: "configured",
      destinationCount: 2,
      platformBreakdown: { youtube: 0, twitch: 0 },
    }));
  });

  it("persists a cross-platform highlight marker without pretending it is encoded video", async () => {
    const publicId = await createStreamClipMarker({
      userId: 9,
      sessionId: "session-1",
      buildSessionId: "build-1",
      title: "Tower reveal",
      startSeconds: 15,
      endSeconds: 32,
      platforms: ["youtube", "twitch"],
      note: "Encoder export pending",
    });

    expect(publicId).toHaveLength(16);
    expect(insert).toHaveBeenCalledWith(streamClips);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      publicId,
      title: "Tower reveal",
      startSeconds: 15,
      endSeconds: 32,
      platforms: ["youtube", "twitch"],
    }));
  });
});
