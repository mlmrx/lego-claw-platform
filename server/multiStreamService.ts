/**
 * Multi-Platform Streaming Service
 * 
 * Enables simultaneous streaming to multiple platforms:
 * - YouTube Live
 * - Twitch
 * - X/Twitter (via Periscope)
 * - TikTok Live
 * - Facebook Gaming
 * - Kick
 * 
 * Each platform uses RTMP for video streaming with platform-specific configurations.
 */

import { z } from "zod";

// Supported streaming platforms
export const StreamingPlatform = z.enum([
  "youtube",
  "twitch",
  "twitter",
  "tiktok",
  "facebook",
  "kick",
  "custom"
]);

export type StreamingPlatform = z.infer<typeof StreamingPlatform>;

// Platform configuration with RTMP endpoints
export const PLATFORM_CONFIGS: Record<StreamingPlatform, {
  name: string;
  icon: string;
  rtmpUrl: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  maxBitrate: number;
  supportsChat: boolean;
  chatApiEndpoint?: string;
  color: string;
}> = {
  youtube: {
    name: "YouTube Live",
    icon: "🔴",
    rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
    aspectRatio: "16:9",
    maxBitrate: 51000,
    supportsChat: true,
    chatApiEndpoint: "/api/youtube/chat",
    color: "#FF0000"
  },
  twitch: {
    name: "Twitch",
    icon: "💜",
    rtmpUrl: "rtmp://live.twitch.tv/app",
    aspectRatio: "16:9",
    maxBitrate: 6000,
    supportsChat: true,
    chatApiEndpoint: "/api/twitch/chat",
    color: "#9146FF"
  },
  twitter: {
    name: "X / Twitter",
    icon: "🐦",
    rtmpUrl: "rtmp://va.pscp.tv:80/x",
    aspectRatio: "16:9",
    maxBitrate: 2500,
    supportsChat: true,
    color: "#000000"
  },
  tiktok: {
    name: "TikTok Live",
    icon: "🎵",
    rtmpUrl: "rtmp://push.tiktokv.com/live",
    aspectRatio: "9:16",
    maxBitrate: 4000,
    supportsChat: true,
    color: "#000000"
  },
  facebook: {
    name: "Facebook Gaming",
    icon: "📘",
    rtmpUrl: "rtmps://live-api-s.facebook.com:443/rtmp",
    aspectRatio: "16:9",
    maxBitrate: 4000,
    supportsChat: true,
    color: "#1877F2"
  },
  kick: {
    name: "Kick",
    icon: "💚",
    rtmpUrl: "rtmp://fa723fc1b171.global-contribute.live-video.net/app",
    aspectRatio: "16:9",
    maxBitrate: 8000,
    supportsChat: true,
    color: "#53FC18"
  },
  custom: {
    name: "Custom RTMP",
    icon: "⚙️",
    rtmpUrl: "",
    aspectRatio: "16:9",
    maxBitrate: 6000,
    supportsChat: false,
    color: "#666666"
  }
};

// Stream destination configuration
export const StreamDestinationSchema = z.object({
  id: z.string(),
  platform: StreamingPlatform,
  streamKey: z.string(),
  customRtmpUrl: z.string().optional(),
  enabled: z.boolean().default(true),
  title: z.string().optional(),
  description: z.string().optional()
});

export type StreamDestination = z.infer<typeof StreamDestinationSchema>;

// Multi-stream session
export interface MultiStreamSession {
  id: string;
  buildSessionId: string;
  ownerId: string;
  destinations: StreamDestination[];
  status: "idle" | "starting" | "live" | "stopping" | "error";
  startedAt?: Date;
  viewerCounts: Record<string, number>;
  totalViewers: number;
  chatMessages: AggregatedChatMessage[];
  error?: string;
}

// Aggregated chat message from any platform
export interface AggregatedChatMessage {
  id: string;
  platform: StreamingPlatform;
  platformIcon: string;
  platformColor: string;
  username: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  isModerator?: boolean;
  isSubscriber?: boolean;
}

// In-memory storage for active streams (in production, use Redis)
const activeStreams = new Map<string, MultiStreamSession>();

/**
 * Create a new multi-stream session
 */
export function createMultiStreamSession(
  buildSessionId: string,
  ownerId: string,
  destinations: StreamDestination[]
): MultiStreamSession {
  const session: MultiStreamSession = {
    id: `mss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    buildSessionId,
    ownerId,
    destinations: destinations.filter(d => d.enabled),
    status: "idle",
    viewerCounts: {},
    totalViewers: 0,
    chatMessages: []
  };
  
  activeStreams.set(session.id, session);
  return session;
}

/**
 * Start streaming to all configured destinations
 */
export async function startMultiStream(sessionId: string): Promise<{
  success: boolean;
  streamUrls: Record<string, string>;
  errors: Record<string, string>;
}> {
  const session = activeStreams.get(sessionId);
  if (!session) {
    return { success: false, streamUrls: {}, errors: { general: "Session not found" } };
  }
  
  session.status = "starting";
  const streamUrls: Record<string, string> = {};
  const errors: Record<string, string> = {};
  
  for (const dest of session.destinations) {
    try {
      const config = PLATFORM_CONFIGS[dest.platform];
      const rtmpUrl = dest.customRtmpUrl || config.rtmpUrl;
      
      // Generate the full stream URL with key
      const fullUrl = `${rtmpUrl}/${dest.streamKey}`;
      streamUrls[dest.id] = fullUrl;
      
      // Initialize viewer count
      session.viewerCounts[dest.id] = 0;
      
      console.log(`[MultiStream] Configured ${config.name} stream: ${rtmpUrl}`);
    } catch (error) {
      errors[dest.id] = error instanceof Error ? error.message : "Unknown error";
    }
  }
  
  // If at least one destination succeeded, mark as live
  if (Object.keys(streamUrls).length > 0) {
    session.status = "live";
    session.startedAt = new Date();
  } else {
    session.status = "error";
    session.error = "Failed to start any streams";
  }
  
  return {
    success: session.status === "live",
    streamUrls,
    errors
  };
}

/**
 * Stop all streams in a session
 */
export async function stopMultiStream(sessionId: string): Promise<boolean> {
  const session = activeStreams.get(sessionId);
  if (!session) return false;
  
  session.status = "stopping";
  
  // In a real implementation, this would stop the RTMP streams
  // For now, we just update the status
  
  session.status = "idle";
  return true;
}

/**
 * Get current session status
 */
export function getMultiStreamSession(sessionId: string): MultiStreamSession | undefined {
  return activeStreams.get(sessionId);
}

/**
 * Update viewer counts (called periodically or via webhooks)
 */
export function updateViewerCount(
  sessionId: string,
  destinationId: string,
  count: number
): void {
  const session = activeStreams.get(sessionId);
  if (!session) return;
  
  session.viewerCounts[destinationId] = count;
  session.totalViewers = Object.values(session.viewerCounts).reduce((a, b) => a + b, 0);
}

/**
 * Add a chat message from any platform
 */
export function addChatMessage(
  sessionId: string,
  platform: StreamingPlatform,
  username: string,
  message: string,
  metadata?: {
    userAvatar?: string;
    isModerator?: boolean;
    isSubscriber?: boolean;
  }
): void {
  const session = activeStreams.get(sessionId);
  if (!session) return;
  
  const config = PLATFORM_CONFIGS[platform];
  
  const chatMessage: AggregatedChatMessage = {
    id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    platform,
    platformIcon: config.icon,
    platformColor: config.color,
    username,
    message,
    timestamp: new Date(),
    userAvatar: metadata?.userAvatar,
    isModerator: metadata?.isModerator,
    isSubscriber: metadata?.isSubscriber
  };
  
  session.chatMessages.push(chatMessage);
  
  // Keep only last 500 messages
  if (session.chatMessages.length > 500) {
    session.chatMessages = session.chatMessages.slice(-500);
  }
}

/**
 * Get aggregated chat messages
 */
export function getChatMessages(
  sessionId: string,
  limit: number = 100
): AggregatedChatMessage[] {
  const session = activeStreams.get(sessionId);
  if (!session) return [];
  
  return session.chatMessages.slice(-limit);
}

/**
 * Get all active sessions for an owner
 */
export function getOwnerSessions(ownerId: string): MultiStreamSession[] {
  return Array.from(activeStreams.values()).filter(s => s.ownerId === ownerId);
}

/**
 * Clean up ended sessions
 */
export function cleanupSession(sessionId: string): void {
  activeStreams.delete(sessionId);
}

/**
 * Generate browser source URLs for each platform's overlay
 */
export function getOverlayUrls(
  sessionId: string,
  baseUrl: string
): Record<string, string> {
  const session = activeStreams.get(sessionId);
  if (!session) return {};
  
  const urls: Record<string, string> = {};
  
  for (const dest of session.destinations) {
    const config = PLATFORM_CONFIGS[dest.platform];
    const aspectParam = config.aspectRatio === "9:16" ? "vertical" : "horizontal";
    urls[dest.id] = `${baseUrl}/stream/${session.buildSessionId}?platform=${dest.platform}&layout=${aspectParam}&session=${sessionId}`;
  }
  
  return urls;
}
