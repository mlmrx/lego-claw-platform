/**
 * YouTube Live Streaming Service
 * Enables users to stream Krewdoo agent assembly sessions to YouTube Live
 * 
 * Architecture:
 * - Users provide their YouTube stream key (from YouTube Studio)
 * - We generate a "virtual stream" by capturing build state and rendering it
 * - The stream is sent to YouTube via their RTMP endpoint
 * 
 * Note: Browser-based streaming to YouTube requires:
 * 1. User's YouTube stream key (RTMP)
 * 2. Server-side stream composition (since browsers can't do RTMP directly)
 * 3. FFmpeg or similar for encoding
 * 
 * For this implementation, we'll create a "Stream Mode" that:
 * - Generates a shareable stream URL
 * - Creates an embeddable view optimized for streaming
 * - Provides OBS/streaming software integration instructions
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { eq, and, desc } from "drizzle-orm";

// In-memory store for active streams (in production, use Redis)
const activeStreams = new Map<string, {
  sessionId: string;
  userId: number;
  streamKey: string;
  title: string;
  description: string;
  startedAt: Date;
  viewerCount: number;
  isLive: boolean;
  overlaySettings: {
    showAgentNames: boolean;
    showBrickCount: boolean;
    showPhase: boolean;
    showChat: boolean;
    brandingPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    customLogo?: string;
  };
}>();

// Stream view tokens for public access
const streamViewTokens = new Map<string, {
  streamKey: string;
  createdAt: Date;
  expiresAt: Date;
}>();

export const youtubeStreamingRouter = router({
  /**
   * Create a new stream session
   * Returns a stream key and embed URL for OBS/streaming software
   */
  createStream: protectedProcedure
    .input(z.object({
      buildSessionId: z.string().optional(),
      title: z.string().min(1).max(100).default("Krewdoo - Live Agent Assembly"),
      description: z.string().max(500).default("Watch a specialist AI crew negotiate and assemble a shared creation."),
      overlaySettings: z.object({
        showAgentNames: z.boolean().default(true),
        showBrickCount: z.boolean().default(true),
        showPhase: z.boolean().default(true),
        showChat: z.boolean().default(true),
        brandingPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).default('top-left'),
        customLogo: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const streamKey = `lc_${nanoid(16)}`;
      const viewToken = nanoid(24);
      
      // Create stream session
      activeStreams.set(streamKey, {
        sessionId: input.buildSessionId || nanoid(),
        userId: ctx.user.id,
        streamKey,
        title: input.title,
        description: input.description,
        startedAt: new Date(),
        viewerCount: 0,
        isLive: false,
        overlaySettings: input.overlaySettings || {
          showAgentNames: true,
          showBrickCount: true,
          showPhase: true,
          showChat: true,
          brandingPosition: 'top-left',
        },
      });

      // Create view token (expires in 24 hours)
      streamViewTokens.set(viewToken, {
        streamKey,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      return {
        streamKey,
        viewToken,
        embedUrl: `/stream/${viewToken}`,
        obsInstructions: {
          step1: "Open OBS Studio or your preferred streaming software",
          step2: "Add a 'Browser Source' with the embed URL below",
          step3: "Set the browser source size to 1920x1080 for best quality",
          step4: "Configure your YouTube stream settings in OBS",
          step5: "Start streaming to YouTube!",
          embedUrl: `/stream/${viewToken}`,
          recommendedSettings: {
            resolution: "1920x1080",
            fps: 30,
            bitrate: "4500 kbps",
          },
        },
        youtubeSetup: {
          step1: "Go to YouTube Studio → Create → Go Live",
          step2: "Copy your Stream Key from YouTube",
          step3: "In OBS, go to Settings → Stream → Select YouTube",
          step4: "Paste your YouTube stream key",
          step5: "Add the Krewdoo browser source and start streaming!",
        },
      };
    }),

  /**
   * Start the stream (mark as live)
   */
  startStream: protectedProcedure
    .input(z.object({
      streamKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stream = activeStreams.get(input.streamKey);
      
      if (!stream) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stream not found",
        });
      }

      if (stream.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to control this stream",
        });
      }

      stream.isLive = true;
      stream.startedAt = new Date();
      activeStreams.set(input.streamKey, stream);

      return { success: true, isLive: true };
    }),

  /**
   * Stop the stream
   */
  stopStream: protectedProcedure
    .input(z.object({
      streamKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stream = activeStreams.get(input.streamKey);
      
      if (!stream) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stream not found",
        });
      }

      if (stream.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to control this stream",
        });
      }

      stream.isLive = false;
      activeStreams.set(input.streamKey, stream);

      return { success: true, isLive: false };
    }),

  /**
   * Get stream status
   */
  getStreamStatus: protectedProcedure
    .input(z.object({
      streamKey: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const stream = activeStreams.get(input.streamKey);
      
      if (!stream) {
        return null;
      }

      if (stream.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this stream",
        });
      }

      return {
        isLive: stream.isLive,
        viewerCount: stream.viewerCount,
        startedAt: stream.startedAt,
        duration: stream.isLive 
          ? Math.floor((Date.now() - stream.startedAt.getTime()) / 1000)
          : 0,
        title: stream.title,
        description: stream.description,
      };
    }),

  /**
   * Update overlay settings
   */
  updateOverlay: protectedProcedure
    .input(z.object({
      streamKey: z.string(),
      overlaySettings: z.object({
        showAgentNames: z.boolean().optional(),
        showBrickCount: z.boolean().optional(),
        showPhase: z.boolean().optional(),
        showChat: z.boolean().optional(),
        brandingPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
        customLogo: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const stream = activeStreams.get(input.streamKey);
      
      if (!stream) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stream not found",
        });
      }

      if (stream.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this stream",
        });
      }

      stream.overlaySettings = {
        ...stream.overlaySettings,
        ...input.overlaySettings,
      };
      activeStreams.set(input.streamKey, stream);

      return { success: true, overlaySettings: stream.overlaySettings };
    }),

  /**
   * Get stream data for public view (via view token)
   */
  getPublicStream: publicProcedure
    .input(z.object({
      viewToken: z.string(),
    }))
    .query(async ({ input }) => {
      const tokenData = streamViewTokens.get(input.viewToken);
      
      if (!tokenData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stream not found or expired",
        });
      }

      if (new Date() > tokenData.expiresAt) {
        streamViewTokens.delete(input.viewToken);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stream link has expired",
        });
      }

      const stream = activeStreams.get(tokenData.streamKey);
      
      if (!stream) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stream not found",
        });
      }

      // Increment viewer count
      stream.viewerCount++;
      activeStreams.set(tokenData.streamKey, stream);

      return {
        sessionId: stream.sessionId,
        title: stream.title,
        description: stream.description,
        isLive: stream.isLive,
        overlaySettings: stream.overlaySettings,
      };
    }),

  /**
   * Get user's active streams
   */
  getMyStreams: protectedProcedure
    .query(async ({ ctx }) => {
      const streams: Array<{
        streamKey: string;
        title: string;
        isLive: boolean;
        viewerCount: number;
        startedAt: Date;
      }> = [];

      activeStreams.forEach((stream, key) => {
        if (stream.userId === ctx.user.id) {
          streams.push({
            streamKey: key,
            title: stream.title,
            isLive: stream.isLive,
            viewerCount: stream.viewerCount,
            startedAt: stream.startedAt,
          });
        }
      });

      return streams;
    }),

  /**
   * Delete a stream
   */
  deleteStream: protectedProcedure
    .input(z.object({
      streamKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stream = activeStreams.get(input.streamKey);
      
      if (!stream) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stream not found",
        });
      }

      if (stream.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this stream",
        });
      }

      activeStreams.delete(input.streamKey);

      // Also delete associated view tokens
      streamViewTokens.forEach((tokenData, token) => {
        if (tokenData.streamKey === input.streamKey) {
          streamViewTokens.delete(token);
        }
      });

      return { success: true };
    }),
});
