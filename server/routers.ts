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

// Completed build type
interface CompletedBuild {
  id: string;
  name: string;
  description: string;
  theme: string;
  style: string;
  bricks: DesignBrick[];
  contributors: string[];  // Agent IDs who contributed
  completedAt: number;
  messageCount: number;
}

// In-memory state for the current build session
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

// Completed builds gallery (in production, store in database)
let completedBuilds: CompletedBuild[] = [];

// Message ID counter
let messageIdCounter = 0;

// Helper to extract unique contributors from bricks
function getContributors(bricks: DesignBrick[]): string[] {
  const contributors = new Set<string>();
  bricks.forEach(b => contributors.add(b.placedBy));
  return Array.from(contributors);
}

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
      // If there's an existing build with bricks, save it to gallery
      if (currentDesign && currentDesign.bricks.length > 0) {
        completedBuilds.push({
          id: currentDesign.id,
          name: currentDesign.name,
          description: currentDesign.description,
          theme: currentDesign.theme,
          style: currentDesign.style,
          bricks: [...currentDesign.bricks],
          contributors: getContributors(currentDesign.bricks),
          completedAt: Date.now(),
          messageCount: currentDesign.messages.length,
        });
        
        // Keep only last 20 completed builds
        if (completedBuilds.length > 20) {
          completedBuilds = completedBuilds.slice(-20);
        }
      }

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

    // Generate next agent action (message + optional brick) with @mention support
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

      // Pick a random agent, but sometimes pick one that was recently mentioned
      let agent = getRandomAgent();
      const recentMessages = currentDesign.messages.slice(-5);
      
      // Check if any recent message mentions another agent
      const mentionedAgentIds = recentMessages
        .flatMap(m => {
          const mentions = m.content.match(/@(\w+[-\w]*)/g) || [];
          return mentions.map(mention => mention.slice(1).toLowerCase());
        })
        .filter(id => AI_AGENTS.some(a => a.id === id || a.name.toLowerCase().replace(/\s+/g, '-') === id));
      
      // 40% chance to have a mentioned agent respond
      if (mentionedAgentIds.length > 0 && Math.random() < 0.4) {
        const mentionedId = mentionedAgentIds[mentionedAgentIds.length - 1];
        const mentionedAgent = AI_AGENTS.find(a => 
          a.id === mentionedId || 
          a.name.toLowerCase().replace(/\s+/g, '-') === mentionedId
        );
        if (mentionedAgent) {
          agent = mentionedAgent;
        }
      }
      
      // Calculate build progress (assume ~50 bricks for a complete build)
      const buildProgress = Math.min(100, Math.round((currentDesign.bricks.length / 50) * 100));

      // Generate agent message with @mention context
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

      // Sometimes add @mention to the message (30% chance)
      let content = result.content;
      if (Math.random() < 0.3 && recentMessages.length > 0) {
        const lastMessage = recentMessages[recentMessages.length - 1];
        const lastAgent = getAgentById(lastMessage.agentId);
        if (lastAgent && lastAgent.id !== agent.id) {
          // Add @mention at the start of the message
          content = `@${lastAgent.name.replace(/\s+/g, '-')} ${content}`;
        }
      }

      // Create message with potential replyTo
      const message: AgentMessage = {
        id: `msg-${++messageIdCounter}`,
        agentId: agent.id,
        content,
        type: result.type,
        timestamp: Date.now(),
        brickAction: result.brickAction,
        replyTo: recentMessages.length > 0 && Math.random() < 0.25 
          ? recentMessages[recentMessages.length - 1].id 
          : undefined,
      };

      // Add message to history
      currentDesign.messages.push(message);

      // Add brick if action includes one
      if (result.brickAction?.brick) {
        currentDesign.bricks.push(result.brickAction.brick);
      }

      // Check if build is complete (50+ bricks) and auto-save to gallery
      if (currentDesign.bricks.length >= 50) {
        completedBuilds.push({
          id: currentDesign.id,
          name: currentDesign.name,
          description: currentDesign.description,
          theme: currentDesign.theme,
          style: currentDesign.style,
          bricks: [...currentDesign.bricks],
          contributors: getContributors(currentDesign.bricks),
          completedAt: Date.now(),
          messageCount: currentDesign.messages.length,
        });
        
        // Keep only last 20 completed builds
        if (completedBuilds.length > 20) {
          completedBuilds = completedBuilds.slice(-20);
        }

        // Start a new build automatically
        const newConcept = await generateDesignConcept();
        currentDesign = {
          id: `build-${Date.now()}`,
          name: newConcept.name,
          description: newConcept.description,
          theme: newConcept.theme,
          style: newConcept.style,
          bricks: [],
          messages: [],
          startedAt: Date.now(),
        };

        // Add celebration message for completed build
        const celebrator = getRandomAgent();
        currentDesign.messages.push({
          id: `msg-${++messageIdCounter}`,
          agentId: celebrator.id,
          content: `🎊 Build complete! Starting new project: "${newConcept.name}"! ${newConcept.description}`,
          type: 'celebration',
          timestamp: Date.now(),
        });
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
        buildProgress: Math.min(100, Math.round((currentDesign.bricks.length / 50) * 100)),
        totalBricks: currentDesign.bricks.length,
        newBrick: result.brickAction?.brick || null,
        buildComplete: currentDesign.bricks.length === 0 && completedBuilds.length > 0,
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
        completedBuildsCount: completedBuilds.length,
      };
    }),

    // Get completed builds gallery
    getCompletedBuilds: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
      }))
      .query(({ input }) => {
        return completedBuilds
          .slice(-input.limit)
          .reverse()
          .map(build => ({
            id: build.id,
            name: build.name,
            description: build.description,
            theme: build.theme,
            style: build.style,
            brickCount: build.bricks.length,
            contributors: build.contributors,
            completedAt: build.completedAt,
            messageCount: build.messageCount,
          }));
      }),

    // Get a specific completed build with all bricks
    getCompletedBuild: publicProcedure
      .input(z.object({
        id: z.string(),
      }))
      .query(({ input }) => {
        const build = completedBuilds.find(b => b.id === input.id);
        if (!build) return null;
        
        return {
          id: build.id,
          name: build.name,
          description: build.description,
          theme: build.theme,
          style: build.style,
          bricks: build.bricks,
          contributors: build.contributors,
          completedAt: build.completedAt,
          messageCount: build.messageCount,
        };
      }),

    // Load a completed build into the 3D viewer
    loadCompletedBuild: publicProcedure
      .input(z.object({
        id: z.string(),
      }))
      .mutation(({ input }) => {
        const build = completedBuilds.find(b => b.id === input.id);
        if (!build) {
          return { success: false, error: 'Build not found' };
        }
        
        return {
          success: true,
          bricks: build.bricks,
          name: build.name,
          description: build.description,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
