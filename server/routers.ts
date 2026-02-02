import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  AI_AGENTS,
  generateDesignConcept,
  generateAgentMessage,
  getRandomAgent,
  getAgentById,
  type DesignBrick,
  type AgentMessage,
} from "./ai-agents";

// In-memory state for the current build session
// In production, this would be stored in a database
let currentDesign: {
  id: string;
  name: string;
  description: string;
  theme: string;
  style: string;
  bricks: DesignBrick[];
  messages: AgentMessage[];
  startedAt: number;
} | null = null;

// Message ID counter
let messageIdCounter = 0;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // AI Agents router
  agents: router({
    // Get all agent definitions
    list: publicProcedure.query(() => {
      return AI_AGENTS.map(agent => ({
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
        skill: agent.skill,
        personality: agent.personality,
      }));
    }),

    // Get current build state
    getCurrentBuild: publicProcedure.query(() => {
      if (!currentDesign) {
        return null;
      }
      return {
        id: currentDesign.id,
        name: currentDesign.name,
        description: currentDesign.description,
        theme: currentDesign.theme,
        style: currentDesign.style,
        brickCount: currentDesign.bricks.length,
        messageCount: currentDesign.messages.length,
        startedAt: currentDesign.startedAt,
      };
    }),

    // Get bricks for current build
    getBricks: publicProcedure.query(() => {
      return currentDesign?.bricks || [];
    }),

    // Get recent messages
    getMessages: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        after: z.number().optional(),
      }))
      .query(({ input }) => {
        if (!currentDesign) return [];
        
        let messages = currentDesign.messages;
        if (input.after !== undefined) {
          messages = messages.filter(m => m.timestamp > input.after!);
        }
        
        return messages.slice(-input.limit);
      }),

    // Start a new build with AI-generated concept
    startNewBuild: publicProcedure.mutation(async () => {
      const concept = await generateDesignConcept();
      
      currentDesign = {
        id: `build-${Date.now()}`,
        name: concept.name,
        description: concept.description,
        theme: concept.theme,
        style: concept.style,
        bricks: [],
        messages: [],
        startedAt: Date.now(),
      };

      // Add initial announcement message
      const announcer = getRandomAgent();
      currentDesign.messages.push({
        id: `msg-${++messageIdCounter}`,
        agentId: announcer.id,
        content: `🎉 New build starting: "${concept.name}"! ${concept.description}`,
        type: 'celebration',
        timestamp: Date.now(),
      });

      return {
        id: currentDesign.id,
        name: currentDesign.name,
        description: currentDesign.description,
        theme: currentDesign.theme,
        style: currentDesign.style,
      };
    }),

    // Generate next agent action (message + optional brick)
    generateNextAction: publicProcedure.mutation(async () => {
      // Start a new build if none exists
      if (!currentDesign) {
        const concept = await generateDesignConcept();
        currentDesign = {
          id: `build-${Date.now()}`,
          name: concept.name,
          description: concept.description,
          theme: concept.theme,
          style: concept.style,
          bricks: [],
          messages: [],
          startedAt: Date.now(),
        };
      }

      // Pick a random agent
      const agent = getRandomAgent();
      
      // Calculate build progress (assume ~50 bricks for a complete build)
      const buildProgress = Math.min(100, Math.round((currentDesign.bricks.length / 50) * 100));

      // Generate agent message
      const result = await generateAgentMessage(agent, {
        designConcept: {
          name: currentDesign.name,
          description: currentDesign.description,
          theme: currentDesign.theme,
          style: currentDesign.style,
        },
        currentBricks: currentDesign.bricks,
        recentMessages: currentDesign.messages.slice(-10),
        buildProgress,
      });

      // Create message
      const message: AgentMessage = {
        id: `msg-${++messageIdCounter}`,
        agentId: agent.id,
        content: result.content,
        type: result.type,
        timestamp: Date.now(),
        brickAction: result.brickAction,
      };

      // Add message to history
      currentDesign.messages.push(message);

      // Add brick if action includes one
      if (result.brickAction?.brick) {
        currentDesign.bricks.push(result.brickAction.brick);
      }

      // Get agent info for response
      const agentInfo = {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
        skill: agent.skill,
      };

      return {
        message,
        agent: agentInfo,
        buildProgress,
        totalBricks: currentDesign.bricks.length,
        newBrick: result.brickAction?.brick || null,
      };
    }),

    // Reset the current build
    resetBuild: publicProcedure.mutation(() => {
      currentDesign = null;
      messageIdCounter = 0;
      return { success: true };
    }),

    // Get build stats
    getStats: publicProcedure.query(() => {
      return {
        activeAgents: AI_AGENTS.length,
        totalBricks: currentDesign?.bricks.length || 0,
        totalMessages: currentDesign?.messages.length || 0,
        currentBuild: currentDesign ? {
          name: currentDesign.name,
          theme: currentDesign.theme,
        } : null,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
