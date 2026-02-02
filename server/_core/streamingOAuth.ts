/**
 * Streaming Platform OAuth Handlers
 * Implements OAuth 2.0 flows for Twitch and YouTube
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { socialIntegrations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logAudit, createAuditContext } from "./auditLog";

const router = Router();

// OAuth state storage (in production, use Redis or database)
const pendingOAuthStates = new Map<string, {
  userId: number;
  agentId?: number;
  platform: string;
  redirectUri: string;
  createdAt: number;
}>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(pendingOAuthStates.entries());
  for (const [state, data] of entries) {
    if (now - data.createdAt > 10 * 60 * 1000) { // 10 minute expiry
      pendingOAuthStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate OAuth authorization URL
 */
function generateOAuthUrl(platform: string, state: string, redirectUri: string): string | null {
  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  
  if (!clientId) {
    return null;
  }

  switch (platform) {
    case "twitch":
      return `https://id.twitch.tv/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=channel:read:subscriptions+bits:read+channel:read:redemptions+moderator:read:followers&` +
        `state=${state}`;

    case "youtube":
      return `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=https://www.googleapis.com/auth/youtube.readonly+https://www.googleapis.com/auth/youtube.force-ssl&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;

    case "discord":
      return `https://discord.com/api/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=identify+guilds+webhook.incoming&` +
        `state=${state}`;

    default:
      return null;
  }
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(
  platform: string, 
  code: string, 
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  platformUserId?: string;
  platformUsername?: string;
} | null> {
  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    switch (platform) {
      case "twitch": {
        const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          console.error("Twitch token exchange failed:", await tokenResponse.text());
          return null;
        }

        const tokenData = await tokenResponse.json();

        // Get user info
        const userResponse = await fetch("https://api.twitch.tv/helix/users", {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Client-Id": clientId,
          },
        });

        let platformUserId, platformUsername;
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.data?.[0]) {
            platformUserId = userData.data[0].id;
            platformUsername = userData.data[0].login;
          }
        }

        return {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope?.join(" "),
          platformUserId,
          platformUsername,
        };
      }

      case "youtube": {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          console.error("YouTube token exchange failed:", await tokenResponse.text());
          return null;
        }

        const tokenData = await tokenResponse.json();

        // Get channel info
        const channelResponse = await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
          {
            headers: {
              "Authorization": `Bearer ${tokenData.access_token}`,
            },
          }
        );

        let platformUserId, platformUsername;
        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          if (channelData.items?.[0]) {
            platformUserId = channelData.items[0].id;
            platformUsername = channelData.items[0].snippet?.title;
          }
        }

        return {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope,
          platformUserId,
          platformUsername,
        };
      }

      case "discord": {
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          console.error("Discord token exchange failed:", await tokenResponse.text());
          return null;
        }

        const tokenData = await tokenResponse.json();

        // Get user info
        const userResponse = await fetch("https://discord.com/api/users/@me", {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
          },
        });

        let platformUserId, platformUsername;
        if (userResponse.ok) {
          const userData = await userResponse.json();
          platformUserId = userData.id;
          platformUsername = userData.username;
        }

        return {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope,
          platformUserId,
          platformUsername,
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`OAuth token exchange error for ${platform}:`, error);
    return null;
  }
}

/**
 * Encrypt tokens for storage
 */
function encryptToken(token: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(process.env.JWT_SECRET || "default-secret", "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Initiate OAuth flow
 */
router.get("/oauth/init/:platform", async (req: Request, res: Response) => {
  const { platform } = req.params;
  const { userId, agentId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  const supportedPlatforms = ["twitch", "youtube", "discord"];
  if (!supportedPlatforms.includes(platform)) {
    return res.status(400).json({ error: "Unsupported platform" });
  }

  // Generate state token
  const state = crypto.randomBytes(32).toString("hex");
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${baseUrl}/api/streaming/oauth/callback/${platform}`;

  // Store state
  pendingOAuthStates.set(state, {
    userId: parseInt(userId as string),
    agentId: agentId ? parseInt(agentId as string) : undefined,
    platform,
    redirectUri,
    createdAt: Date.now(),
  });

  const authUrl = generateOAuthUrl(platform, state, redirectUri);
  
  if (!authUrl) {
    return res.status(500).json({ 
      error: "OAuth not configured for this platform",
      message: `Please configure ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET environment variables`
    });
  }

  res.json({ authUrl, state });
});

/**
 * OAuth callback handler
 */
router.get("/oauth/callback/:platform", async (req: Request, res: Response) => {
  const { platform } = req.params;
  const { code, state, error, error_description } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error(`OAuth error for ${platform}:`, error, error_description);
    return res.redirect(`/integrations?error=${encodeURIComponent(error_description as string || error as string)}`);
  }

  if (!code || !state) {
    return res.redirect("/integrations?error=Missing+authorization+code+or+state");
  }

  // Validate state
  const stateData = pendingOAuthStates.get(state as string);
  if (!stateData) {
    return res.redirect("/integrations?error=Invalid+or+expired+state");
  }

  // Remove used state
  pendingOAuthStates.delete(state as string);

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(platform, code as string, stateData.redirectUri);
  
  if (!tokens) {
    return res.redirect("/integrations?error=Failed+to+exchange+authorization+code");
  }

  try {
    const db = await getDb();
    if (!db) {
      return res.redirect("/integrations?error=Database+connection+failed");
    }
    
    // Check if integration already exists
    const platformValue = platform as "twitch" | "youtube" | "discord";
    const existing = await db.select()
      .from(socialIntegrations)
      .where(
        and(
          eq(socialIntegrations.userId, stateData.userId),
          eq(socialIntegrations.platform, platformValue),
          stateData.agentId ? eq(socialIntegrations.externalAgentId, stateData.agentId) : undefined
        )
      )
      .limit(1);

    const encryptedAccessToken = encryptToken(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
    const expiresAt = tokens.expiresIn 
      ? new Date(Date.now() + tokens.expiresIn * 1000) 
      : null;

    if (existing.length > 0) {
      // Update existing integration
      await db.update(socialIntegrations)
        .set({
          encryptedAccessToken: encryptedAccessToken,
          encryptedRefreshToken: encryptedRefreshToken,
          tokenExpiresAt: expiresAt,
          platformUserId: tokens.platformUserId || existing[0].platformUserId,
          platformUsername: tokens.platformUsername || existing[0].platformUsername,
          isActive: true,
          isVerified: true,
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(socialIntegrations.id, existing[0].id));
    } else {
      // Create new integration
      const publicId = crypto.randomBytes(16).toString("hex");
      await db.insert(socialIntegrations).values({
        publicId,
        userId: stateData.userId,
        externalAgentId: stateData.agentId || null,
        platform: platform as "twitch" | "youtube" | "discord",
        platformUserId: tokens.platformUserId || null,
        platformUsername: tokens.platformUsername || null,
        encryptedAccessToken: encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        isActive: true,
        isVerified: true,
        lastVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Log audit event
    await logAudit(
      { userId: stateData.userId },
      {
        action: "external_agent_registered",
        entityType: "external_agent",
        details: {
          platform,
          agentId: stateData.agentId,
          platformUsername: tokens.platformUsername,
          oauthConnected: true,
        },
      }
    );

    res.redirect(`/integrations?success=${platform}+connected+successfully`);
  } catch (error) {
    console.error(`Failed to save ${platform} integration:`, error);
    res.redirect("/integrations?error=Failed+to+save+integration");
  }
});

/**
 * Refresh OAuth tokens
 */
export async function refreshOAuthToken(integrationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const [integration] = await db.select()
    .from(socialIntegrations)
    .where(eq(socialIntegrations.id, integrationId))
    .limit(1);

  if (!integration || !integration.encryptedRefreshToken) {
    return false;
  }

  const platform = integration.platform;
  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    return false;
  }

  try {
    // Decrypt refresh token
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.JWT_SECRET || "default-secret", "salt", 32);
    const [ivHex, encrypted] = integration.encryptedRefreshToken.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let refreshToken = decipher.update(encrypted, "hex", "utf8");
    refreshToken += decipher.final("utf8");

    let tokenUrl: string;
    let body: URLSearchParams;

    switch (platform) {
      case "twitch":
        tokenUrl = "https://id.twitch.tv/oauth2/token";
        body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        });
        break;

      case "youtube":
        tokenUrl = "https://oauth2.googleapis.com/token";
        body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        });
        break;

      case "discord":
        tokenUrl = "https://discord.com/api/oauth2/token";
        body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        });
        break;

      default:
        return false;
    }

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      console.error(`Token refresh failed for ${platform}:`, await response.text());
      return false;
    }

    const tokenData = await response.json();
    const encryptedAccessToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token 
      ? encryptToken(tokenData.refresh_token) 
      : integration.encryptedRefreshToken;
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000) 
      : null;

    await db.update(socialIntegrations)
      .set({
        encryptedAccessToken: encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(socialIntegrations.id, integrationId));

    return true;
  } catch (error) {
    console.error(`Token refresh error for ${platform}:`, error);
    return false;
  }
}

export const streamingOAuthRouter = router;
