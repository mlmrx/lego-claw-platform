/**
 * Streaming Platform Webhook Handlers
 * Processes real-time events from Twitch, YouTube, and other platforms
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { socialIntegrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getIO } from "../socket";

const router = Router();

// Event types we handle
export type StreamingEvent = {
  type: "stream_online" | "stream_offline" | "follow" | "subscription" | "donation" | "chat_message" | "raid" | "bits";
  platform: string;
  integrationId: number;
  userId?: number;
  agentId?: number;
  data: Record<string, unknown>;
  timestamp: Date;
};

// Event queue for processing
const eventQueue: StreamingEvent[] = [];
const eventHandlers: ((event: StreamingEvent) => Promise<void>)[] = [];

/**
 * Register an event handler
 */
export function onStreamingEvent(handler: (event: StreamingEvent) => Promise<void>) {
  eventHandlers.push(handler);
}

/**
 * Process queued events
 */
async function processEvents() {
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    if (!event) continue;
    
    for (const handler of eventHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error("Event handler error:", error);
      }
    }
    
    // Emit to connected clients via Socket.io
    const socketIO = getIO();
    if (socketIO) {
      socketIO.emit("streaming:event", event);
    }
  }
}

// Process events every 100ms
setInterval(processEvents, 100);

/**
 * Verify Twitch webhook signature
 */
function verifyTwitchSignature(req: Request): boolean {
  const messageId = req.headers["twitch-eventsub-message-id"] as string;
  const timestamp = req.headers["twitch-eventsub-message-timestamp"] as string;
  const signature = req.headers["twitch-eventsub-message-signature"] as string;
  
  if (!messageId || !timestamp || !signature) {
    return false;
  }
  
  const secret = process.env.TWITCH_WEBHOOK_SECRET;
  if (!secret) {
    console.error("TWITCH_WEBHOOK_SECRET not configured");
    return false;
  }
  
  const body = JSON.stringify(req.body);
  const message = messageId + timestamp + body;
  const expectedSignature = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Verify YouTube PubSubHubbub signature
 */
function verifyYouTubeSignature(req: Request): boolean {
  const signature = req.headers["x-hub-signature"] as string;
  
  if (!signature) {
    return false;
  }
  
  const secret = process.env.YOUTUBE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("YOUTUBE_WEBHOOK_SECRET not configured");
    return false;
  }
  
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const expectedSignature = "sha1=" + crypto
    .createHmac("sha1", secret)
    .update(body)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Twitch EventSub webhook handler
 */
router.post("/twitch", async (req: Request, res: Response) => {
  const messageType = req.headers["twitch-eventsub-message-type"] as string;
  
  // Handle webhook verification challenge
  if (messageType === "webhook_callback_verification") {
    const challenge = req.body.challenge;
    console.log("Twitch webhook verification:", challenge);
    return res.status(200).send(challenge);
  }
  
  // Verify signature for all other requests
  if (!verifyTwitchSignature(req)) {
    console.error("Invalid Twitch webhook signature");
    return res.status(403).json({ error: "Invalid signature" });
  }
  
  // Handle revocation
  if (messageType === "revocation") {
    console.log("Twitch webhook revoked:", req.body.subscription);
    return res.status(200).send("OK");
  }
  
  // Process notification
  if (messageType === "notification") {
    const { subscription, event } = req.body;
    const subscriptionType = subscription.type;
    
    // Find the integration
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }
    
    const [integration] = await db.select()
      .from(socialIntegrations)
      .where(eq(socialIntegrations.platformUserId, event.broadcaster_user_id))
      .limit(1);
    
    if (!integration) {
      console.warn("No integration found for Twitch user:", event.broadcaster_user_id);
      return res.status(200).send("OK");
    }
    
    // Map Twitch event types to our event types
    let eventType: StreamingEvent["type"];
    switch (subscriptionType) {
      case "stream.online":
        eventType = "stream_online";
        break;
      case "stream.offline":
        eventType = "stream_offline";
        break;
      case "channel.follow":
        eventType = "follow";
        break;
      case "channel.subscribe":
      case "channel.subscription.gift":
      case "channel.subscription.message":
        eventType = "subscription";
        break;
      case "channel.cheer":
        eventType = "bits";
        break;
      case "channel.raid":
        eventType = "raid";
        break;
      default:
        console.log("Unhandled Twitch event type:", subscriptionType);
        return res.status(200).send("OK");
    }
    
    // Queue the event
    eventQueue.push({
      type: eventType,
      platform: "twitch",
      integrationId: integration.id,
      userId: integration.userId || undefined,
      agentId: integration.externalAgentId || undefined,
      data: {
        subscriptionType,
        event,
        broadcasterName: event.broadcaster_user_name,
        broadcasterLogin: event.broadcaster_user_login,
      },
      timestamp: new Date(),
    });
    
    console.log(`Twitch ${eventType} event queued for user ${event.broadcaster_user_login}`);
  }
  
  res.status(200).send("OK");
});

/**
 * YouTube PubSubHubbub webhook handler
 */
router.post("/youtube", async (req: Request, res: Response) => {
  // Handle hub verification
  if (req.query["hub.mode"] === "subscribe" || req.query["hub.mode"] === "unsubscribe") {
    const challenge = req.query["hub.challenge"];
    console.log("YouTube webhook verification:", req.query["hub.mode"]);
    return res.status(200).send(challenge);
  }
  
  // Verify signature
  if (!verifyYouTubeSignature(req)) {
    console.error("Invalid YouTube webhook signature");
    return res.status(403).json({ error: "Invalid signature" });
  }
  
  // Parse the Atom feed
  const body = req.body;
  
  // Extract video/stream info from the feed
  // YouTube sends Atom XML, so we need to parse it
  // For simplicity, we'll look for key patterns
  const channelId = extractFromXml(body, "yt:channelId");
  const videoId = extractFromXml(body, "yt:videoId");
  const title = extractFromXml(body, "title");
  
  if (!channelId) {
    console.warn("No channel ID in YouTube webhook");
    return res.status(200).send("OK");
  }
  
  // Find the integration
  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: "Database unavailable" });
  }
  
  const [integration] = await db.select()
    .from(socialIntegrations)
    .where(eq(socialIntegrations.channelId, channelId))
    .limit(1);
  
  if (!integration) {
    console.warn("No integration found for YouTube channel:", channelId);
    return res.status(200).send("OK");
  }
  
  // Determine event type (new video/stream)
  eventQueue.push({
    type: "stream_online",
    platform: "youtube",
    integrationId: integration.id,
    userId: integration.userId || undefined,
    agentId: integration.externalAgentId || undefined,
    data: {
      channelId,
      videoId,
      title,
      rawBody: body,
    },
    timestamp: new Date(),
  });
  
  console.log(`YouTube event queued for channel ${channelId}`);
  res.status(200).send("OK");
});

/**
 * Discord webhook handler
 */
router.post("/discord", async (req: Request, res: Response) => {
  // Discord uses interaction endpoints differently
  // This handles incoming webhook events from Discord bots
  
  const { type, data, guild_id, channel_id, member } = req.body;
  
  // Verify Discord signature
  const signature = req.headers["x-signature-ed25519"] as string;
  const timestamp = req.headers["x-signature-timestamp"] as string;
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  
  if (!publicKey || !signature || !timestamp) {
    return res.status(401).json({ error: "Missing authentication" });
  }
  
  // Discord uses Ed25519 signatures
  // For full implementation, use tweetnacl or similar library
  // For now, we'll accept the request if the public key is configured
  
  // Handle ping
  if (type === 1) {
    return res.json({ type: 1 });
  }
  
  // Find integration by guild
  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: "Database unavailable" });
  }
  
  // Queue event for processing
  if (type === 2) { // Application command
    eventQueue.push({
      type: "chat_message",
      platform: "discord",
      integrationId: 0, // Will be resolved by handler
      data: {
        type,
        data,
        guildId: guild_id,
        channelId: channel_id,
        member,
      },
      timestamp: new Date(),
    });
  }
  
  res.status(200).json({ type: 1 });
});

/**
 * Generic webhook handler for custom platforms
 */
router.post("/custom/:integrationId", async (req: Request, res: Response) => {
  const { integrationId } = req.params;
  const signature = req.headers["x-webhook-signature"] as string;
  
  // Find the integration
  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: "Database unavailable" });
  }
  
  const [integration] = await db.select()
    .from(socialIntegrations)
    .where(eq(socialIntegrations.publicId, integrationId))
    .limit(1);
  
  if (!integration) {
    return res.status(404).json({ error: "Integration not found" });
  }
  
  // Verify signature if webhook secret is configured
  if (integration.encryptedApiSecret && signature) {
    // Decrypt and verify
    // For custom webhooks, we use HMAC-SHA256
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.JWT_SECRET || "default-secret", "salt", 32);
    
    try {
      const [ivHex, encrypted] = integration.encryptedApiSecret.split(":");
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let secret = decipher.update(encrypted, "hex", "utf8");
      secret += decipher.final("utf8");
      
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return res.status(403).json({ error: "Invalid signature" });
      }
    } catch (error) {
      console.error("Signature verification error:", error);
      return res.status(403).json({ error: "Signature verification failed" });
    }
  }
  
  // Queue the event
  const eventType = req.body.type || "chat_message";
  eventQueue.push({
    type: eventType as StreamingEvent["type"],
    platform: "custom",
    integrationId: integration.id,
    userId: integration.userId || undefined,
    agentId: integration.externalAgentId || undefined,
    data: req.body,
    timestamp: new Date(),
  });
  
  console.log(`Custom webhook event queued for integration ${integrationId}`);
  res.status(200).json({ success: true });
});

/**
 * Helper to extract values from XML
 */
function extractFromXml(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<]+)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Subscribe to Twitch EventSub
 */
export async function subscribeTwitchEventSub(
  integrationId: number,
  broadcasterUserId: string,
  eventTypes: string[]
): Promise<boolean> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const accessToken = process.env.TWITCH_APP_ACCESS_TOKEN;
  const callbackUrl = process.env.BASE_URL + "/api/streaming/webhooks/twitch";
  const secret = process.env.TWITCH_WEBHOOK_SECRET;
  
  if (!clientId || !accessToken || !secret) {
    console.error("Twitch EventSub not configured");
    return false;
  }
  
  for (const eventType of eventTypes) {
    try {
      const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Client-Id": clientId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: eventType,
          version: "1",
          condition: {
            broadcaster_user_id: broadcasterUserId,
          },
          transport: {
            method: "webhook",
            callback: callbackUrl,
            secret,
          },
        }),
      });
      
      if (!response.ok) {
        console.error(`Failed to subscribe to ${eventType}:`, await response.text());
      } else {
        console.log(`Subscribed to Twitch ${eventType} for user ${broadcasterUserId}`);
      }
    } catch (error) {
      console.error(`Error subscribing to ${eventType}:`, error);
    }
  }
  
  return true;
}

/**
 * Subscribe to YouTube PubSubHubbub
 */
export async function subscribeYouTubePubSub(
  integrationId: number,
  channelId: string
): Promise<boolean> {
  const callbackUrl = process.env.BASE_URL + "/api/streaming/webhooks/youtube";
  const secret = process.env.YOUTUBE_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error("YouTube webhook secret not configured");
    return false;
  }
  
  try {
    const response = await fetch("https://pubsubhubbub.appspot.com/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "hub.callback": callbackUrl,
        "hub.topic": `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
        "hub.verify": "async",
        "hub.mode": "subscribe",
        "hub.secret": secret,
        "hub.lease_seconds": "864000", // 10 days
      }),
    });
    
    if (!response.ok) {
      console.error("Failed to subscribe to YouTube PubSub:", await response.text());
      return false;
    }
    
    console.log(`Subscribed to YouTube PubSub for channel ${channelId}`);
    return true;
  } catch (error) {
    console.error("Error subscribing to YouTube PubSub:", error);
    return false;
  }
}

export const streamingWebhooksRouter = router;
