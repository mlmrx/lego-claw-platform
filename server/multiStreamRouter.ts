/**
 * Multi-Platform Streaming Router
 * 
 * tRPC procedures for managing multi-platform streaming sessions
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
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
      
      return {
        success: result.success,
        activeStreams: Object.keys(result.streamUrls).length,
        errors: result.errors
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
        error: session.error
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
    })
});

export type MultiStreamRouter = typeof multiStreamRouter;
