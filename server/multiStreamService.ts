/**
 * Multi-Platform Streaming Service
 * 
 * STATUS: Session management and configuration are functional.
 * LIMITATION: Actual RTMP video streaming requires additional infrastructure:
 *   - FFmpeg or node-media-server for RTMP relay
 *   - A video source (canvas capture, screen capture, or generated frames)
 *   - Platform API integrations for real-time chat and viewer counts
 * 
 * What WORKS:
 *   - Creating and managing stream sessions
 *   - Storing platform configurations and stream keys
 *   - Generating overlay URLs for OBS browser sources
 *   - In-app chat aggregation (messages from the platform itself)
 *   - Session lifecycle (create → start → stop → cleanup)
 * 
 * What NEEDS real infrastructure:
 *   - Sending actual RTMP video to platforms (requires FFmpeg + video source)
 *   - Receiving real chat from Twitch IRC / YouTube Chat API / etc.
 *   - Real viewer count polling from platform APIs
 *   - Stream health monitoring
 * 
 * To enable real streaming, you would need to:
 *   1. Install FFmpeg: apt-get install ffmpeg
 *   2. Create a canvas/video source from the 3D scene
 *   3. Pipe frames through FFmpeg to RTMP endpoints
 *   4. OR use a service like Restream.io which handles multi-platform relay
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
  setupGuideUrl: string;
}> = {
  youtube: {
    name: "YouTube Live",
    icon: "🔴",
    rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
    aspectRatio: "16:9",
    maxBitrate: 51000,
    supportsChat: true,
    chatApiEndpoint: "/api/youtube/chat",
    color: "#FF0000",
    setupGuideUrl: "https://support.google.com/youtube/answer/2474026"
  },
  twitch: {
    name: "Twitch",
    icon: "💜",
    rtmpUrl: "rtmp://live.twitch.tv/app",
    aspectRatio: "16:9",
    maxBitrate: 6000,
    supportsChat: true,
    chatApiEndpoint: "/api/twitch/chat",
    color: "#9146FF",
    setupGuideUrl: "https://help.twitch.tv/s/article/twitch-stream-key-faq"
  },
  twitter: {
    name: "X / Twitter",
    icon: "🐦",
    rtmpUrl: "rtmp://va.pscp.tv:80/x",
    aspectRatio: "16:9",
    maxBitrate: 2500,
    supportsChat: true,
    color: "#000000",
    setupGuideUrl: "https://help.twitter.com/en/using-x/x-live"
  },
  tiktok: {
    name: "TikTok Live",
    icon: "🎵",
    rtmpUrl: "rtmp://push.tiktokv.com/live",
    aspectRatio: "9:16",
    maxBitrate: 4000,
    supportsChat: true,
    color: "#000000",
    setupGuideUrl: "https://support.tiktok.com/en/live-gifts-wallet/tiktok-live/going-live"
  },
  facebook: {
    name: "Facebook Gaming",
    icon: "📘",
    rtmpUrl: "rtmps://live-api-s.facebook.com:443/rtmp",
    aspectRatio: "16:9",
    maxBitrate: 4000,
    supportsChat: true,
    color: "#1877F2",
    setupGuideUrl: "https://www.facebook.com/help/587160588142067"
  },
  kick: {
    name: "Kick",
    icon: "💚",
    rtmpUrl: "rtmp://fa723fc1b171.global-contribute.live-video.net/app",
    aspectRatio: "16:9",
    maxBitrate: 8000,
    supportsChat: true,
    color: "#53FC18",
    setupGuideUrl: "https://help.kick.com/en/articles/7104889-how-to-stream-on-kick"
  },
  custom: {
    name: "Custom RTMP",
    icon: "⚙️",
    rtmpUrl: "",
    aspectRatio: "16:9",
    maxBitrate: 6000,
    supportsChat: false,
    color: "#666666",
    setupGuideUrl: ""
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
  // Track what's actually working
  capabilities: {
    videoStreaming: boolean;  // Always false until FFmpeg is set up
    chatRelay: boolean;       // True for in-app chat, false for platform chat
    viewerTracking: boolean;  // Always false until platform APIs are connected
  };
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
    chatMessages: [],
    capabilities: {
      videoStreaming: false,  // No FFmpeg/RTMP relay available
      chatRelay: true,        // In-app chat works
      viewerTracking: false,  // No platform API connections
    }
  };
  
  activeStreams.set(session.id, session);
  return session;
}

/**
 * Start streaming to all configured destinations
 * 
 * HONEST STATUS: This creates the session and generates RTMP URLs,
 * but does NOT actually send video. To send video, you need:
 * 1. A video source (canvas capture from the 3D scene)
 * 2. FFmpeg to encode and relay to RTMP endpoints
 * 3. Or use Restream.io/similar service as a relay
 */
export async function startMultiStream(sessionId: string): Promise<{
  success: boolean;
  streamUrls: Record<string, string>;
  errors: Record<string, string>;
  warnings: string[];
}> {
  const session = activeStreams.get(sessionId);
  if (!session) {
    return { success: false, streamUrls: {}, errors: { general: "Session not found" }, warnings: [] };
  }
  
  session.status = "starting";
  const streamUrls: Record<string, string> = {};
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  
  // Warn that video streaming is not yet functional
  warnings.push(
    "Stream session created but actual RTMP video relay is not yet configured. " +
    "The overlay URLs work for OBS browser sources, but no video is being sent to platforms. " +
    "To enable real streaming, configure FFmpeg or use a relay service like Restream.io."
  );
  
  for (const dest of session.destinations) {
    try {
      const config = PLATFORM_CONFIGS[dest.platform];
      const rtmpUrl = dest.customRtmpUrl || config.rtmpUrl;
      
      if (!dest.streamKey) {
        errors[dest.id] = `No stream key provided for ${config.name}`;
        continue;
      }
      
      // Generate the full stream URL with key
      const fullUrl = `${rtmpUrl}/${dest.streamKey}`;
      streamUrls[dest.id] = fullUrl;
      
      // Initialize viewer count
      session.viewerCounts[dest.id] = 0;
      
      console.log(`[MultiStream] Configured ${config.name} stream URL (video relay not active)`);
    } catch (error) {
      errors[dest.id] = error instanceof Error ? error.message : "Unknown error";
    }
  }
  
  // Mark as "live" for the session management layer
  // (even though actual video isn't being sent)
  if (Object.keys(streamUrls).length > 0) {
    session.status = "live";
    session.startedAt = new Date();
  } else {
    session.status = "error";
    session.error = "No valid stream destinations configured";
  }
  
  return {
    success: session.status === "live",
    streamUrls,
    errors,
    warnings
  };
}

/**
 * Stop all streams in a session
 */
export async function stopMultiStream(sessionId: string): Promise<boolean> {
  const session = activeStreams.get(sessionId);
  if (!session) return false;
  
  session.status = "stopping";
  
  // In a real implementation with FFmpeg, this would kill the FFmpeg processes
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
 * Update viewer counts
 * In production, this would be called by platform API polling or webhooks
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
 * Currently only supports in-app messages. Platform chat integration
 * requires connecting to each platform's chat API:
 * - Twitch: IRC (wss://irc-ws.chat.twitch.tv)
 * - YouTube: YouTube Data API v3 liveChatMessages
 * - etc.
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
 * These URLs work with OBS and other streaming software as browser sources
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
