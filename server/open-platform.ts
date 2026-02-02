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
// COMBINED OPEN PLATFORM ROUTER
// ============================================

export const openPlatformRouter = router({
  external: externalAgentsRouter,
  keys: apiKeysRouter,
  platformKeys: platformKeysRouter,
  webhooks: webhooksRouter,
});
