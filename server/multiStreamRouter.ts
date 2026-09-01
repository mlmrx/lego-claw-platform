/**
 * Multi-Platform Streaming Router
 * 
 * tRPC procedures for managing multi-platform streaming sessions
 */

import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import {
  createHeartbeatJob,
  deleteHeartbeatJob,
  updateHeartbeatJob,
} from "./_core/heartbeat";
import {
  createStreamAnalyticsSnapshot,
  createStreamClipMarker,
  createStreamSchedule,
  deleteStreamSchedule,
  getStreamSchedule,
  listStreamAnalytics,
  listStreamClips,
  listStreamSchedules,
  setStreamScheduleTaskUid,
  summarizeStreamAnalyticsRecords,
  updateStreamScheduleState,
} from "./streamPersistence";
import {
  StreamingPlatform,
  StreamDestinationSchema,
  PLATFORM_CONFIGS,
  createMultiStreamSession,
  startMultiStream,
  stopMultiStream,
  getMultiStreamSession,
  updateViewerCount,
  addChatMessage,
  getChatMessages,
  getOwnerSessions,
  cleanupSession,
  getOverlayUrls,
  type MultiStreamSession,
  type AggregatedChatMessage
} from "./multiStreamService";

export const multiStreamRouter = router({
  // Get available platforms and their configurations
  getPlatforms: publicProcedure.query(() => {
    return Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
      id: key as StreamingPlatform,
      name: config.name,
      icon: config.icon,
      aspectRatio: config.aspectRatio,
      supportsChat: config.supportsChat,
      color: config.color
    }));
  }),

  // Create a new multi-stream session
  createSession: protectedProcedure
    .input(z.object({
      buildSessionId: z.string(),
      destinations: z.array(StreamDestinationSchema)
    }))
    .mutation(async ({ ctx, input }) => {
      const session = createMultiStreamSession(
        input.buildSessionId,
        String(ctx.user.id),
        input.destinations
      );
      
      return {
        sessionId: session.id,
        destinations: session.destinations.length,
        status: session.status
      };
    }),

  // Start streaming to all destinations
  startStream: protectedProcedure
    .input(z.object({
      sessionId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const session = getMultiStreamSession(input.sessionId);
      
      if (!session) {
        throw new Error("Session not found");
      }
      
      if (session.ownerId !== String(ctx.user.id)) {
        throw new Error("Not authorized to control this stream");
      }
      
      const result = await startMultiStream(input.sessionId);

      await createStreamAnalyticsSnapshot({
        userId: ctx.user.id,
        sessionId: session.id,
        buildSessionId: session.buildSessionId,
        status: result.success ? "configured" : "failed",
        destinationCount: session.destinations.length,
        totalViewers: session.totalViewers,
        platformBreakdown: Object.fromEntries(
          session.destinations.map(destination => [destination.platform, session.viewerCounts[destination.id] || 0]),
        ),
        chatMessageCount: session.chatMessages.length,
        startedAt: session.startedAt,
      });
      
      return {
        success: result.success,
        activeStreams: Object.keys(result.streamUrls).length,
        errors: result.errors,
        warnings: result.warnings
      };
    }),

  // Stop all streams
  stopStream: protectedProcedure
    .input(z.object({
      sessionId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const session = getMultiStreamSession(input.sessionId);
      
      if (!session) {
        throw new Error("Session not found");
      }
      
      if (session.ownerId !== String(ctx.user.id)) {
        throw new Error("Not authorized to control this stream");
      }
      
      const success = await stopMultiStream(input.sessionId);

      await createStreamAnalyticsSnapshot({
        userId: ctx.user.id,
        sessionId: session.id,
        buildSessionId: session.buildSessionId,
        status: "stopped",
        destinationCount: session.destinations.length,
        totalViewers: session.totalViewers,
        platformBreakdown: Object.fromEntries(
          session.destinations.map(destination => [destination.platform, session.viewerCounts[destination.id] || 0]),
        ),
        chatMessageCount: session.chatMessages.length,
        startedAt: session.startedAt,
        endedAt: new Date(),
      });
      
      return { success };
    }),

  // Get session status
  getSession: protectedProcedure
    .input(z.object({
      sessionId: z.string()
    }))
    .query(({ input }) => {
      const session = getMultiStreamSession(input.sessionId);
      
      if (!session) {
        return null;
      }
      
      return {
        id: session.id,
        buildSessionId: session.buildSessionId,
        status: session.status,
        startedAt: session.startedAt,
        destinations: session.destinations.map(d => ({
          id: d.id,
          platform: d.platform,
          platformName: PLATFORM_CONFIGS[d.platform].name,
          platformIcon: PLATFORM_CONFIGS[d.platform].icon,
          platformColor: PLATFORM_CONFIGS[d.platform].color,
          enabled: d.enabled,
          viewerCount: session.viewerCounts[d.id] || 0
        })),
        totalViewers: session.totalViewers,
        error: session.error,
        capabilities: session.capabilities
      };
    }),

  // Get all sessions for current user
  getMySessions: protectedProcedure.query(({ ctx }) => {
    const sessions = getOwnerSessions(String(ctx.user.id));
    
    return sessions.map(session => ({
      id: session.id,
      buildSessionId: session.buildSessionId,
      status: session.status,
      startedAt: session.startedAt,
      destinationCount: session.destinations.length,
      totalViewers: session.totalViewers
    }));
  }),

  // Get aggregated chat messages
  getChat: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      limit: z.number().min(1).max(500).default(100)
    }))
    .query(({ input }) => {
      return getChatMessages(input.sessionId, input.limit);
    }),

  // Send a chat message (broadcast to all platforms)
  sendChat: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      message: z.string().min(1).max(500)
    }))
    .mutation(async ({ ctx, input }) => {
      const session = getMultiStreamSession(input.sessionId);
      
      if (!session) {
        throw new Error("Session not found");
      }
      
      // Add message as "host" from the LEGO Claw platform
      addChatMessage(
        input.sessionId,
        "custom",
        ctx.user.name || "Host",
        input.message,
        { isModerator: true }
      );
      
      // In production, this would also send to each platform's chat API
      
      return { success: true };
    }),

  // Get overlay URLs for OBS/streaming software
  getOverlayUrls: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      baseUrl: z.string()
    }))
    .query(({ input }) => {
      return getOverlayUrls(input.sessionId, input.baseUrl);
    }),

  // Update viewer count (called by platform webhooks or polling)
  updateViewers: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      destinationId: z.string(),
      count: z.number().min(0)
    }))
    .mutation(({ input }) => {
      updateViewerCount(input.sessionId, input.destinationId, input.count);
      return { success: true };
    }),

  // Cleanup a session
  cleanup: protectedProcedure
    .input(z.object({
      sessionId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const session = getMultiStreamSession(input.sessionId);
      
      if (!session) {
        return { success: true }; // Already cleaned up
      }
      
      if (session.ownerId !== String(ctx.user.id)) {
        throw new Error("Not authorized");
      }
      
      cleanupSession(input.sessionId);
      return { success: true };
    }),

  // Simulate incoming chat (for testing)
  simulateChat: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      platform: StreamingPlatform,
      username: z.string(),
      message: z.string()
    }))
    .mutation(({ input }) => {
      addChatMessage(
        input.sessionId,
        input.platform,
        input.username,
        input.message
      );
      return { success: true };
    }),

  listSchedules: protectedProcedure.query(({ ctx }) => listStreamSchedules(ctx.user.id)),

  createSchedule: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(120),
      buildSessionId: z.string().min(1).max(64),
      cronExpression: z.string().refine(value => value.trim().split(/\s+/).length === 6, {
        message: "Use a six-field UTC cron expression: sec min hour day month weekday",
      }),
      integrationPublicIds: z.array(z.string().min(1).max(32)).min(1).max(8),
    }))
    .mutation(async ({ ctx, input }) => {
      for (const publicId of input.integrationPublicIds) {
        const integration = await db.getSocialIntegrationByPublicId(publicId);
        if (!integration || integration.userId !== ctx.user.id) {
          throw new Error(`Integration ${publicId} was not found for this account`);
        }
      }

      const schedule = await createStreamSchedule({ userId: ctx.user.id, ...input });
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      try {
        const job = await createHeartbeatJob({
          name: `stream-${schedule.publicId}`,
          cron: input.cronExpression,
          path: "/api/scheduled/startMultiStream",
          method: "POST",
          description: `Configure ${input.name} across the selected streaming integrations`,
        }, sessionToken);
        await setStreamScheduleTaskUid(schedule.publicId, ctx.user.id, job.taskUid);
        return { ...schedule, scheduleCronTaskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt ?? null };
      } catch (error) {
        await deleteStreamSchedule(schedule.publicId, ctx.user.id);
        throw error;
      }
    }),

  setScheduleEnabled: protectedProcedure
    .input(z.object({ publicId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await getStreamSchedule(input.publicId, ctx.user.id);
      if (!schedule || !schedule.scheduleCronTaskUid) throw new Error("Schedule not found");
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const result = await updateHeartbeatJob(schedule.scheduleCronTaskUid, { enable: input.enabled }, sessionToken);
      await updateStreamScheduleState(schedule.publicId, { isEnabled: input.enabled });
      return { success: true, nextExecutionAt: result.nextExecutionAt ?? null };
    }),

  deleteSchedule: protectedProcedure
    .input(z.object({ publicId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await getStreamSchedule(input.publicId, ctx.user.id);
      if (!schedule) return { success: true };
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (schedule.scheduleCronTaskUid) {
        await deleteHeartbeatJob(schedule.scheduleCronTaskUid, sessionToken);
      }
      await deleteStreamSchedule(schedule.publicId, ctx.user.id);
      return { success: true };
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const records = await listStreamAnalytics(ctx.user.id, input?.limit ?? 50);
      return {
        summary: summarizeStreamAnalyticsRecords(records),
        records,
      };
    }),

  createClip: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      title: z.string().min(1).max(160),
      startSeconds: z.number().int().min(0),
      endSeconds: z.number().int().positive(),
      note: z.string().max(1000).optional(),
    }).refine(value => value.endSeconds > value.startSeconds, {
      message: "Clip end must be after its start",
      path: ["endSeconds"],
    }))
    .mutation(async ({ ctx, input }) => {
      const session = getMultiStreamSession(input.sessionId);
      if (!session || session.ownerId !== String(ctx.user.id)) throw new Error("Session not found");
      const publicId = await createStreamClipMarker({
        userId: ctx.user.id,
        sessionId: session.id,
        buildSessionId: session.buildSessionId,
        title: input.title,
        startSeconds: input.startSeconds,
        endSeconds: input.endSeconds,
        platforms: [...new Set(session.destinations.map(destination => destination.platform))],
        note: input.note,
      });
      return {
        publicId,
        markerOnly: !session.capabilities.videoStreaming,
        message: session.capabilities.videoStreaming
          ? "Highlight marker created."
          : "Highlight marker saved. Exported video requires an active encoder or relay.",
      };
    }),

  getClips: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
    .query(({ ctx, input }) => listStreamClips(ctx.user.id, input?.limit ?? 50))
});

export type MultiStreamRouter = typeof multiStreamRouter;
