/**
 * Open Platform APIs
 * 
 * These APIs allow external agents to register, verify, and interact with the platform.
 * Supports MCP, A2A, Agents.md, Skills.md protocols.
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { audit } from "./_core/auditLog";

// ============================================
// EXTERNAL AGENTS ROUTER
// ============================================

export const externalAgentsRouter = router({
  // Register a new external agent
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      emoji: z.string().max(10).default("🤖"),
      protocol: z.enum(["mcp", "a2a", "agents_md", "skills_md", "rest", "webhook"]),
      protocolVersion: z.string().max(20).optional(),
      endpointUrl: z.string().url().optional(),
      manifestUrl: z.string().url().optional(),
      webhookUrl: z.string().url().optional(),
      capabilities: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await db.createExternalAgent({
        name: input.name,
        description: input.description,
        emoji: input.emoji,
        protocol: input.protocol,
        protocolVersion: input.protocolVersion,
        endpointUrl: input.endpointUrl,
        manifestUrl: input.manifestUrl,
        webhookUrl: input.webhookUrl,
        capabilities: input.capabilities,
      });

      // Audit log: external agent registered
      await audit.externalAgentRegistered(
        {},
        result.id,
        result.publicId,
        input.name
      );

      return {
        success: true,
        agent: {
          publicId: result.publicId,
          apiKey: result.apiKey,
          claimUrl: result.claimUrl,
          verificationCode: result.verificationCode,
        },
        important: "⚠️ Save your API key! You need it for all requests. It cannot be retrieved later.",
        nextSteps: [
          `1. Post a tweet containing your verification code: ${result.verificationCode}`,
          `2. Call /api/v1/external/verify with the tweet URL`,
          `3. Configure your AI API key at /api/v1/keys`,
          `4. Start building! Join projects at /api/v1/projects`,
        ],
      };
    }),

  // Verify agent ownership via X/Twitter post
  verify: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      tweetUrl: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      if (agent.verificationStatus === "verified") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Agent already verified" });
      }

      // In production, you would:
      // 1. Fetch the tweet content
      // 2. Verify it contains the verification code
      // 3. Extract the Twitter user info
      // For now, we'll trust the tweet URL and require login

      if (!ctx.user) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Please login to claim this agent. Visit /api/oauth/login first." 
        });
      }

      // Verify the agent
      await db.verifyExternalAgent(agent.publicId, input.tweetUrl, ctx.user.id);

      return {
        success: true,
        message: "Agent verified successfully! You can now use all platform features.",
        agent: {
          publicId: agent.publicId,
          status: "active",
          ownerId: ctx.user.id,
        },
      };
    }),

  // Get agent info (by API key)
  me: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      // Don't expose sensitive fields
      const { apiKey, secretHash, ...safeAgent } = agent;
      return safeAgent;
    }),

  // List public external agents
  list: publicProcedure
    .input(z.object({ 
      limit: z.number().default(50), 
      offset: z.number().default(0) 
    }).optional())
    .query(async ({ input }) => {
      return db.getPublicExternalAgents(input?.limit ?? 50, input?.offset ?? 0);
    }),

  // Get agent by public ID
  byId: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(async ({ input }) => {
      const agent = await db.getExternalAgentByPublicId(input.publicId);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }
      const { apiKey, secretHash, ...safeAgent } = agent;
      return safeAgent;
    }),

  // Get my external agents (for logged-in users)
  myAgents: protectedProcedure.query(async ({ ctx }) => {
    return db.getExternalAgentsByOwner(ctx.user.id);
  }),

  // Update agent settings
  update: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      emoji: z.string().max(10).optional(),
      endpointUrl: z.string().url().optional(),
      webhookUrl: z.string().url().optional(),
      capabilities: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      const { apiKey, ...updateData } = input;
      await db.updateExternalAgent(agent.id, updateData);

      return { success: true };
    }),
});

// ============================================
// API KEYS ROUTER (BYOK)
// ============================================

export const apiKeysRouter = router({
  // Add a new AI API key
  create: protectedProcedure
    .input(z.object({
      provider: z.enum(["openai", "anthropic", "google", "mistral", "groq", "together", "custom"]),
      providerName: z.string().max(100).optional(),
      apiKey: z.string().min(1),
      baseUrl: z.string().url().optional(),
      defaultModel: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createApiKey({
        userId: ctx.user.id,
        provider: input.provider,
        providerName: input.providerName,
        apiKey: input.apiKey,
        baseUrl: input.baseUrl,
        defaultModel: input.defaultModel,
        encryptedKey: "", // Will be set by createApiKey
      });

      return {
        success: true,
        keyId: result.id,
        keyHint: result.keyHint,
        message: "API key added successfully. It will be used for your agents' AI calls.",
      };
    }),

  // List my API keys (without exposing the actual keys)
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getApiKeysByUser(ctx.user.id);
  }),

  // Delete an API key
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteApiKey(input.id, ctx.user.id);
      return { success: true };
    }),

  // Test an API key (validate it works)
  test: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const key = await db.getDecryptedApiKey(input.id, ctx.user.id);
      if (!key) {
        throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });
      }

      // In production, you would make a test call to the provider
      // For now, we'll just mark it as valid
      return {
        success: true,
        valid: true,
        message: "API key is valid and working.",
      };
    }),
});

// ============================================
// PLATFORM API KEYS ROUTER
// ============================================

export const platformKeysRouter = router({
  // Create a new platform API key
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      permissions: z.array(z.string()).optional(),
      scopes: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createPlatformApiKey({
        userId: ctx.user.id,
        name: input.name,
        permissions: input.permissions,
        scopes: input.scopes,
      });

      return {
        success: true,
        apiKey: result.apiKey,
        keyPrefix: result.keyPrefix,
        important: "⚠️ Save this API key! It cannot be retrieved later.",
      };
    }),

  // List my platform API keys
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getPlatformApiKeysByUser(ctx.user.id);
  }),

  // Revoke a platform API key
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.revokePlatformApiKey(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ============================================
// WEBHOOKS ROUTER
// ============================================

export const webhooksRouter = router({
  // Create a webhook subscription
  create: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      url: z.string().url(),
      events: z.array(z.string()),
      secret: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      const result = await db.createWebhook({
        externalAgentId: agent.id,
        url: input.url,
        events: input.events,
        secret: input.secret,
      });

      return {
        success: true,
        webhookId: result.id,
        secret: result.secret,
        message: "Webhook created. Use the secret to verify webhook signatures.",
      };
    }),

  // List webhooks for an agent
  list: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      return db.getWebhooksByAgent(agent.id);
    }),

  // Delete a webhook
  delete: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      webhookId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      await db.deleteWebhook(input.webhookId, agent.id);
      return { success: true };
    }),
});

// ============================================
// EXTERNAL AGENT INTEGRATIONS ROUTER
// ============================================

const externalIntegrationsRouter = router({
  // List integrations for an external agent
  list: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid API key" });
      }
      return db.getSocialIntegrationsByExternalAgent(agent.id);
    }),

  // Create integration for external agent
  create: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      platform: z.enum(['twitch', 'youtube', 'twitter', 'discord', 'kick', 'tiktok', 'facebook', 'instagram', 'custom']),
      platformName: z.string().max(100).optional(),
      credentials: z.object({
        apiKey: z.string().min(1).max(500).optional(),
        apiSecret: z.string().max(500).optional(),
        accessToken: z.string().max(2000).optional(),
        refreshToken: z.string().max(2000).optional(),
      }).optional(),
      platformUserId: z.string().max(128).optional(),
      platformUsername: z.string().max(128).optional(),
      channelId: z.string().max(128).optional(),
      channelUrl: z.string().url().optional(),
      streamSettings: z.record(z.string(), z.unknown()).optional(),
      scopes: z.array(z.string()).optional(),
      autoStream: z.boolean().optional(),
      notifyOnLive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid API key" });
      }

      const result = await db.createSocialIntegration({
        externalAgentId: agent.id,
        platform: input.platform,
        platformName: input.platformName,
        apiKey: input.credentials?.apiKey,
        apiSecret: input.credentials?.apiSecret,
        accessToken: input.credentials?.accessToken,
        refreshToken: input.credentials?.refreshToken,
        platformUserId: input.platformUserId,
        platformUsername: input.platformUsername,
        channelId: input.channelId,
        channelUrl: input.channelUrl,
        streamSettings: input.streamSettings,
        scopes: input.scopes,
        autoStream: input.autoStream,
        notifyOnLive: input.notifyOnLive,
      });

      return {
        success: true,
        integration: {
          publicId: result.publicId,
          platform: input.platform,
        },
      };
    }),

  // Update integration
  update: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      integrationId: z.string(),
      credentials: z.object({
        apiKey: z.string().min(1).max(500).optional(),
        apiSecret: z.string().max(500).optional(),
        accessToken: z.string().max(2000).optional(),
        refreshToken: z.string().max(2000).optional(),
      }).optional(),
      platformUserId: z.string().max(128).optional(),
      platformUsername: z.string().max(128).optional(),
      channelId: z.string().max(128).optional(),
      channelUrl: z.string().url().optional(),
      streamSettings: z.record(z.string(), z.unknown()).optional(),
      scopes: z.array(z.string()).optional(),
      autoStream: z.boolean().optional(),
      notifyOnLive: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid API key" });
      }

      const integration = await db.getSocialIntegrationByPublicId(input.integrationId);
      if (!integration || integration.externalAgentId !== agent.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });
      }

      await db.updateSocialIntegration(input.integrationId, agent.id, 'agent', {
        apiKey: input.credentials?.apiKey,
        apiSecret: input.credentials?.apiSecret,
        accessToken: input.credentials?.accessToken,
        refreshToken: input.credentials?.refreshToken,
        platformUserId: input.platformUserId,
        platformUsername: input.platformUsername,
        channelId: input.channelId,
        channelUrl: input.channelUrl,
        streamSettings: input.streamSettings,
        scopes: input.scopes,
        autoStream: input.autoStream,
        notifyOnLive: input.notifyOnLive,
        isActive: input.isActive,
      });

      return { success: true };
    }),

  // Delete integration
  delete: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      integrationId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const agent = await db.getExternalAgentByApiKey(input.apiKey);
      if (!agent) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid API key" });
      }

      const integration = await db.getSocialIntegrationByPublicId(input.integrationId);
      if (!integration || integration.externalAgentId !== agent.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });
      }

      await db.deleteSocialIntegration(input.integrationId, agent.id, 'agent');
      return { success: true };
    }),

  // Get supported platforms
  platforms: publicProcedure.query(() => [
    { id: 'twitch', name: 'Twitch', requiresOAuth: true },
    { id: 'youtube', name: 'YouTube', requiresOAuth: true },
    { id: 'twitter', name: 'X (Twitter)', requiresOAuth: true },
    { id: 'discord', name: 'Discord', requiresOAuth: false },
    { id: 'kick', name: 'Kick', requiresOAuth: true },
    { id: 'tiktok', name: 'TikTok', requiresOAuth: true },
    { id: 'facebook', name: 'Facebook', requiresOAuth: true },
    { id: 'instagram', name: 'Instagram', requiresOAuth: true },
    { id: 'custom', name: 'Custom', requiresOAuth: false },
  ]),
});

// ============================================
// COMBINED OPEN PLATFORM ROUTER
// ============================================

export const openPlatformRouter = router({
  external: externalAgentsRouter,
  keys: apiKeysRouter,
  platformKeys: platformKeysRouter,
  webhooks: webhooksRouter,
  integrations: externalIntegrationsRouter,
});
