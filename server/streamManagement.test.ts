import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { isRecentScheduleRun } from "./streamScheduleHandler";
import { summarizeStreamAnalyticsRecords } from "./streamPersistence";
import { cleanupSession, createMultiStreamSession } from "./multiStreamService";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "stream-test-user",
      email: "stream@example.test",
      name: "Stream Tester",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as NonNullable<TrpcContext["user"]>,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("stream management validation", () => {
  it("rejects malformed Heartbeat cron expressions before persistence", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.multiStream.createSchedule({
      name: "Bad schedule",
      buildSessionId: "build-1",
      cronExpression: "0 18 * * *",
      integrationPublicIds: ["integration-1"],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects highlight markers whose end is not after the start", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.multiStream.createClip({
      sessionId: "missing-session",
      title: "Invalid marker",
      startSeconds: 30,
      endSeconds: 30,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a valid highlight request when the session does not exist", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.multiStream.createClip({
      sessionId: "missing-session",
      title: "Missing session",
      startSeconds: 0,
      endSeconds: 15,
    })).rejects.toThrow("Session not found");
  });

  it("rejects a highlight request owned by another user", async () => {
    const session = createMultiStreamSession("build-1", "another-owner", [
      { id: "youtube-1", platform: "youtube", streamKey: "test", enabled: true },
    ]);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.multiStream.createClip({
      sessionId: session.id,
      title: "Not mine",
      startSeconds: 0,
      endSeconds: 15,
    })).rejects.toThrow("Session not found");
    cleanupSession(session.id);
  });

  it("treats a retried callback within 55 seconds as idempotent", () => {
    const now = Date.now();
    expect(isRecentScheduleRun(new Date(now - 5_000), now)).toBe(true);
    expect(isRecentScheduleRun(new Date(now - 60_000), now)).toBe(false);
    expect(isRecentScheduleRun(null, now)).toBe(false);
  });

  it("summarizes tracked telemetry without implying external platform polling", () => {
    const summary = summarizeStreamAnalyticsRecords([
      { status: "configured", totalViewers: 12, chatMessageCount: 3, platformBreakdown: { youtube: 7, twitch: 5 } },
      { status: "stopped", totalViewers: 8, chatMessageCount: 2, platformBreakdown: { youtube: 8 } },
    ]);
    expect(summary).toMatchObject({
      snapshots: 2,
      configuredSessions: 1,
      peakViewers: 12,
      totalChatMessages: 5,
      platformTotals: { youtube: 15, twitch: 5 },
    });
    expect(summary.telemetryScope).toContain("requires connected platform APIs");
  });
});
