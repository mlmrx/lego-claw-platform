import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import {
  createMultiStreamSession,
  startMultiStream,
  type StreamDestination,
  type StreamingPlatform,
} from "./multiStreamService";
import {
  createStreamAnalyticsSnapshot,
  getStreamScheduleByTaskUid,
  updateStreamScheduleState,
} from "./streamPersistence";

export function isRecentScheduleRun(lastRunAt: Date | null, now = Date.now()) {
  return Boolean(lastRunAt && now - lastRunAt.getTime() < 55_000);
}

export async function runScheduledMultiStream(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      res.status(403).json({ error: "cron-only" });
      return;
    }

    const schedule = await getStreamScheduleByTaskUid(user.taskUid);
    if (!schedule) {
      res.json({ ok: true, skipped: "orphan" });
      return;
    }
    if (!schedule.isEnabled) {
      res.json({ ok: true, skipped: "disabled" });
      return;
    }
    if (isRecentScheduleRun(schedule.lastRunAt)) {
      res.json({ ok: true, skipped: "duplicate-retry", sessionId: schedule.lastSessionId });
      return;
    }

    const integrationIds = Array.isArray(schedule.integrationPublicIds)
      ? schedule.integrationPublicIds.filter((value): value is string => typeof value === "string")
      : [];
    const destinations: StreamDestination[] = [];
    for (const publicId of integrationIds) {
      const integration = await db.getSocialIntegrationWithCredentials(publicId);
      if (!integration || integration.userId !== schedule.userId || !integration.isActive) continue;
      const settings = integration.streamSettings as Record<string, unknown> | null;
      const configuredStreamKey = typeof settings?.streamKey === "string" ? settings.streamKey : undefined;
      const streamKey = configuredStreamKey || integration.apiKey || integration.accessToken || "";
      destinations.push({
        id: integration.publicId,
        platform: integration.platform as StreamingPlatform,
        streamKey,
        customRtmpUrl: typeof settings?.customRtmpUrl === "string" ? settings.customRtmpUrl : undefined,
        enabled: true,
        title: schedule.name,
      });
    }

    if (destinations.length === 0) {
      await updateStreamScheduleState(schedule.publicId, {
        lastRunAt: new Date(),
        lastRunStatus: "skipped",
        lastSessionId: null,
        lastError: "No active integrations with stream credentials",
      });
      res.json({ ok: true, skipped: "no-configured-destinations" });
      return;
    }

    const session = createMultiStreamSession(schedule.buildSessionId, String(schedule.userId), destinations);
    const result = await startMultiStream(session.id);
    const status = result.success ? "configured" as const : "failed" as const;
    await createStreamAnalyticsSnapshot({
      userId: schedule.userId,
      sessionId: session.id,
      buildSessionId: schedule.buildSessionId,
      status,
      destinationCount: destinations.length,
      totalViewers: session.totalViewers,
      platformBreakdown: Object.fromEntries(destinations.map(destination => [destination.platform, 0])),
      chatMessageCount: session.chatMessages.length,
      startedAt: session.startedAt,
    });
    await updateStreamScheduleState(schedule.publicId, {
      lastRunAt: new Date(),
      lastRunStatus: status,
      lastSessionId: session.id,
      lastError: result.success ? null : Object.values(result.errors).join("; ") || "Configuration failed",
    });

    res.json({
      ok: result.success,
      sessionId: session.id,
      configuredDestinations: Object.keys(result.streamUrls).length,
      videoRelayActive: session.capabilities.videoStreaming,
      warnings: result.warnings,
      errors: result.errors,
    });
  } catch (error) {
    console.error("[Scheduled MultiStream]", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}
