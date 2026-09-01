import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getStreamScheduleByTaskUid: vi.fn(),
  updateStreamScheduleState: vi.fn(),
  createStreamAnalyticsSnapshot: vi.fn(),
  getSocialIntegrationWithCredentials: vi.fn(),
  createMultiStreamSession: vi.fn(),
  startMultiStream: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./db", () => ({ getSocialIntegrationWithCredentials: mocks.getSocialIntegrationWithCredentials }));
vi.mock("./streamPersistence", () => ({
  getStreamScheduleByTaskUid: mocks.getStreamScheduleByTaskUid,
  updateStreamScheduleState: mocks.updateStreamScheduleState,
  createStreamAnalyticsSnapshot: mocks.createStreamAnalyticsSnapshot,
}));
vi.mock("./multiStreamService", () => ({
  createMultiStreamSession: mocks.createMultiStreamSession,
  startMultiStream: mocks.startMultiStream,
}));

import { runScheduledMultiStream } from "./streamScheduleHandler";

function responseMock() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

const baseSchedule = {
  id: 1,
  publicId: "schedule-1",
  userId: 42,
  name: "Friday build",
  buildSessionId: "build-1",
  cronExpression: "0 0 18 * * 5",
  integrationPublicIds: ["integration-1"],
  scheduleCronTaskUid: "task-1",
  isEnabled: true,
  lastRunAt: null,
  lastRunStatus: "never" as const,
  lastSessionId: null,
  lastError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("runScheduledMultiStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-1" });
    mocks.updateStreamScheduleState.mockResolvedValue(undefined);
    mocks.createStreamAnalyticsSnapshot.mockResolvedValue("snapshot-1");
  });

  it("treats an unknown task UID as an idempotent orphan skip", async () => {
    mocks.getStreamScheduleByTaskUid.mockResolvedValue(undefined);
    const res = responseMock();
    await runScheduledMultiStream({ originalUrl: "/api/scheduled/startMultiStream" } as any, res as any);
    expect(res.json).toHaveBeenCalledWith({ ok: true, skipped: "orphan" });
    expect(mocks.createMultiStreamSession).not.toHaveBeenCalled();
  });

  it("skips a duplicate retry within the protected 55-second window", async () => {
    mocks.getStreamScheduleByTaskUid.mockResolvedValue({ ...baseSchedule, lastRunAt: new Date() });
    const res = responseMock();
    await runScheduledMultiStream({ originalUrl: "/api/scheduled/startMultiStream" } as any, res as any);
    expect(res.json).toHaveBeenCalledWith({ ok: true, skipped: "duplicate-retry", sessionId: null });
    expect(mocks.getSocialIntegrationWithCredentials).not.toHaveBeenCalled();
  });

  it("configures a scheduled destination and records a telemetry snapshot", async () => {
    mocks.getStreamScheduleByTaskUid.mockResolvedValue(baseSchedule);
    mocks.getSocialIntegrationWithCredentials.mockResolvedValue({
      publicId: "integration-1",
      userId: 42,
      isActive: true,
      platform: "youtube",
      streamSettings: { streamKey: "encrypted-at-rest-key" },
    });
    mocks.createMultiStreamSession.mockReturnValue({
      id: "session-1",
      buildSessionId: "build-1",
      destinations: [{ id: "integration-1", platform: "youtube" }],
      totalViewers: 0,
      chatMessages: [],
      capabilities: { videoStreaming: false },
      startedAt: new Date(),
    });
    mocks.startMultiStream.mockResolvedValue({
      success: true,
      streamUrls: { "integration-1": "rtmp://example/key" },
      warnings: ["Relay required"],
      errors: {},
    });
    const res = responseMock();
    await runScheduledMultiStream({ originalUrl: "/api/scheduled/startMultiStream" } as any, res as any);
    expect(mocks.createMultiStreamSession).toHaveBeenCalledTimes(1);
    expect(mocks.createStreamAnalyticsSnapshot).toHaveBeenCalledWith(expect.objectContaining({ status: "configured", destinationCount: 1 }));
    expect(mocks.updateStreamScheduleState).toHaveBeenCalledWith("schedule-1", expect.objectContaining({ lastRunStatus: "configured", lastSessionId: "session-1" }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, sessionId: "session-1", videoRelayActive: false }));
  });
});
