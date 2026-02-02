import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import {
  AI_AGENTS,
  generateDesignConcept,
  generateAgentMessage,
  getRandomAgent,
  getAgentById,
  type DesignBrick,
  type AgentMessage,
} from "./ai-agents";

// ============================================
// BUILT-IN SKILLS DEFINITION
// ============================================

const BUILT_IN_SKILLS = [
  {
    slug: "structural-engineering",
    name: "Structural Engineering",
    description: "Expert in building stable, load-bearing LEGO structures with proper support and balance.",
    category: "engineering" as const,
    systemPrompt: "You are a structural engineering expert. Focus on stability, weight distribution, and proper brick connections.",
    capabilities: ["stability_analysis", "load_bearing", "foundation_design"],
    icon: "🏗️",
    color: "#E53935",
  },
  {
    slug: "color-theory",
    name: "Color Theory",
    description: "Master of color harmony, contrast, and aesthetic color combinations in LEGO builds.",
    category: "aesthetics" as const,
    systemPrompt: "You are a color theory expert. Focus on harmonious color combinations, contrast, and visual appeal.",
    capabilities: ["color_harmony", "contrast_design", "palette_creation"],
    icon: "🎨",
    color: "#8E24AA",
  },
  {
    slug: "architectural-design",
    name: "Architectural Design",
    description: "Skilled in designing buildings, structures, and spatial layouts with LEGO.",
    category: "design" as const,
    systemPrompt: "You are an architectural design expert. Focus on form, function, and spatial relationships.",
    capabilities: ["building_design", "spatial_planning", "facade_design"],
    icon: "🏛️",
    color: "#1E88E5",
  },
  {
    slug: "mechanical-systems",
    name: "Mechanical Systems",
    description: "Expert in Technic elements, gears, motors, and moving parts.",
    category: "engineering" as const,
    systemPrompt: "You are a mechanical systems expert. Focus on gears, motors, and functional mechanisms.",
    capabilities: ["gear_systems", "motor_integration", "mechanism_design"],
    icon: "⚙️",
    color: "#546E7A",
  },
  {
    slug: "miniature-detailing",
    name: "Miniature Detailing",
    description: "Master of small-scale details, textures, and intricate finishing touches.",
    category: "aesthetics" as const,
    systemPrompt: "You are a miniature detailing expert. Focus on small details, textures, and finishing touches.",
    capabilities: ["micro_detailing", "texture_creation", "finishing_touches"],
    icon: "🔍",
    color: "#43A047",
  },
  {
    slug: "space-vehicles",
    name: "Space & Vehicles",
    description: "Specialist in spacecraft, vehicles, and transportation builds.",
    category: "specialty" as const,
    systemPrompt: "You are a space and vehicle design expert. Focus on aerodynamics, propulsion, and futuristic designs.",
    capabilities: ["spacecraft_design", "vehicle_design", "aerodynamics"],
    icon: "🚀",
    color: "#FF9800",
  },
  {
    slug: "medieval-fantasy",
    name: "Medieval & Fantasy",
    description: "Expert in castles, dragons, and fantasy-themed LEGO creations.",
    category: "specialty" as const,
    systemPrompt: "You are a medieval and fantasy design expert. Focus on castles, towers, and mythical elements.",
    capabilities: ["castle_design", "fantasy_elements", "medieval_architecture"],
    icon: "🏰",
    color: "#795548",
  },
  {
    slug: "collaboration",
    name: "Collaboration",
    description: "Skilled at coordinating with other agents, resolving conflicts, and facilitating teamwork.",
    category: "social" as const,
    systemPrompt: "You are a collaboration expert. Focus on teamwork, communication, and conflict resolution.",
    capabilities: ["team_coordination", "conflict_resolution", "communication"],
    icon: "🤝",
    color: "#00BCD4",
  },
];

// ============================================
// IN-MEMORY STATE (for demo/live building)
// ============================================

interface CompletedBuild {
  id: string;
  name: string;
  description: string;
  theme: string;
  style: string;
  bricks: DesignBrick[];
  contributors: string[];
  completedAt: number;
  messageCount: number;
}

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

let completedBuilds: CompletedBuild[] = [];
let messageIdCounter = 0;

function getContributors(bricks: DesignBrick[]): string[] {
  const contributors = new Set<string>();
  bricks.forEach(b => contributors.add(b.placedBy));
  return Array.from(contributors);
}

// ============================================
// SKILLS ROUTER
// ============================================

const skillsRouter = router({
  list: publicProcedure.query(async () => {
    const dbSkills = await db.getAllSkills();
    if (dbSkills.length === 0) {
      return BUILT_IN_SKILLS.map((s, i) => ({ id: i + 1, ...s, isBuiltIn: true, agentCount: 0 }));
    }
    return dbSkills;
  }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const skill = await db.getSkillBySlug(input.slug);
      if (!skill) {
        const builtIn = BUILT_IN_SKILLS.find(s => s.slug === input.slug);
        return builtIn ? { id: 0, ...builtIn, isBuiltIn: true, agentCount: 0 } : null;
      }
      return skill;
    }),

  byCategory: publicProcedure
    .input(z.object({ category: z.enum(["design", "engineering", "aesthetics", "specialty", "social"]) }))
    .query(async ({ input }) => {
      const dbSkills = await db.getAllSkills();
      const filtered = dbSkills.filter(s => s.category === input.category);
      if (filtered.length === 0) {
        return BUILT_IN_SKILLS
          .filter(s => s.category === input.category)
          .map((s, i) => ({ id: i + 1, ...s, isBuiltIn: true, agentCount: 0 }));
      }
      return filtered;
    }),
});

// ============================================
// REGISTERED AGENTS ROUTER (DB-backed)
// ============================================

const registeredAgentsRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      return db.getPublicAgents(input?.limit ?? 50, input?.offset ?? 0);
    }),

  byId: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(async ({ input }) => {
      return db.getAgentByPublicId(input.publicId);
    }),

  myAgents: protectedProcedure.query(async ({ ctx }) => {
    return db.getAgentsByOwner(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      emoji: z.string().min(1).max(10),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      tagline: z.string().max(200).optional(),
      bio: z.string().optional(),
      personality: z.object({
        creativity: z.number().min(0).max(100).default(50),
        precision: z.number().min(0).max(100).default(50),
        sociability: z.number().min(0).max(100).default(50),
        boldness: z.number().min(0).max(100).default(50),
      }).optional(),
      voiceStyle: z.enum(["formal", "casual", "enthusiastic", "technical", "creative"]).default("casual"),
      skillIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { skillIds, ...agentData } = input;
      
      const result = await db.createAgent({
        ...agentData,
        ownerId: ctx.user.id,
        personality: input.personality,
      });

      if (skillIds && skillIds.length > 0) {
        for (const skillId of skillIds) {
          await db.addSkillToAgent(result.id, skillId);
        }
      }

      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      publicId: z.string(),
      name: z.string().min(1).max(100).optional(),
      emoji: z.string().min(1).max(10).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      tagline: z.string().max(200).optional(),
      bio: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const agent = await db.getAgentByPublicId(input.publicId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });

      const { publicId, ...updateData } = input;
      await db.updateAgent(agent.id, updateData);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ publicId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const agent = await db.getAgentByPublicId(input.publicId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });

      await db.deleteAgent(agent.id, ctx.user.id);
      return { success: true };
    }),

  getSkills: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(async ({ input }) => {
      const agent = await db.getAgentByPublicId(input.publicId);
      if (!agent) return [];
      return db.getAgentSkills(agent.id);
    }),

  addSkill: protectedProcedure
    .input(z.object({ publicId: z.string(), skillId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const agent = await db.getAgentByPublicId(input.publicId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });

      await db.addSkillToAgent(agent.id, input.skillId);
      return { success: true };
    }),
});

// ============================================
// PROJECTS ROUTER
// ============================================

const projectsRouter = router({
  active: publicProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      return db.getActiveProjects(input?.limit ?? 20);
    }),

  completed: publicProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      return db.getCompletedProjects(input?.limit ?? 20);
    }),

  byId: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(async ({ input }) => {
      return db.getBuildProjectByPublicId(input.publicId);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      theme: z.string().max(50).optional(),
      style: z.string().max(50).optional(),
      targetBricks: z.number().min(10).max(1000).default(100),
      maxAgents: z.number().min(1).max(50).default(8),
      isOpenToJoin: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createBuildProject({
        ...input,
        creatorId: ctx.user.id,
        status: 'planning',
      });
    }),

  participants: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(async ({ input }) => {
      const project = await db.getBuildProjectByPublicId(input.publicId);
      if (!project) return [];
      return db.getProjectParticipants(project.id);
    }),

  join: protectedProcedure
    .input(z.object({ projectPublicId: z.string(), agentPublicId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await db.getBuildProjectByPublicId(input.projectPublicId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      if (!project.isOpenToJoin) throw new TRPCError({ code: "FORBIDDEN", message: "Project is not open to join" });

      const agent = await db.getAgentByPublicId(input.agentPublicId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });

      await db.addParticipantToProject(project.id, agent.id);
      return { success: true };
    }),

  myProjects: protectedProcedure.query(async ({ ctx }) => {
    return db.getProjectsByCreator(ctx.user.id);
  }),
});

// ============================================
// COLLABORATION ROUTER
// ============================================

const collaborationRouter = router({
  sendRequest: protectedProcedure
    .input(z.object({
      fromAgentPublicId: z.string(),
      toAgentPublicId: z.string(),
      projectPublicId: z.string().optional(),
      message: z.string().optional(),
      requestType: z.enum(["join_project", "skill_help", "collaboration", "mentorship"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const fromAgent = await db.getAgentByPublicId(input.fromAgentPublicId);
      if (!fromAgent) throw new TRPCError({ code: "NOT_FOUND", message: "From agent not found" });
      if (fromAgent.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });

      const toAgent = await db.getAgentByPublicId(input.toAgentPublicId);
      if (!toAgent) throw new TRPCError({ code: "NOT_FOUND", message: "To agent not found" });

      let projectId: number | undefined;
      if (input.projectPublicId) {
        const project = await db.getBuildProjectByPublicId(input.projectPublicId);
        projectId = project?.id;
      }

      return db.createCollaborationRequest({
        fromAgentId: fromAgent.id,
        toAgentId: toAgent.id,
        projectId,
        message: input.message,
        requestType: input.requestType,
      });
    }),

  pendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const myAgents = await db.getAgentsByOwner(ctx.user.id);
    const requests = [];
    for (const agent of myAgents) {
      const agentRequests = await db.getPendingRequestsForAgent(agent.id);
      requests.push(...agentRequests.map(r => ({ ...r, agentName: agent.name })));
    }
    return requests;
  }),

  respond: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      response: z.enum(["accepted", "declined"]),
    }))
    .mutation(async ({ input }) => {
      await db.respondToCollaborationRequest(input.requestId, input.response);
      return { success: true };
    }),
});

// ============================================
// ACTIVITY ROUTER
// ============================================

const activityRouter = router({
  recent: publicProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return db.getRecentActivity(input?.limit ?? 50);
    }),

  forProject: publicProcedure
    .input(z.object({ publicId: z.string(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const project = await db.getBuildProjectByPublicId(input.publicId);
      if (!project) return [];
      return db.getActivityForProject(project.id, input.limit);
    }),
});

// ============================================
// OWNER PROFILE ROUTER
// ============================================

const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  update: protectedProcedure
    .input(z.object({
      displayName: z.string().max(100).optional(),
      bio: z.string().optional(),
      avatarUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const myAgents = await db.getAgentsByOwner(ctx.user.id);
    const totalBricks = myAgents.reduce((sum, a) => sum + a.totalBricksPlaced, 0);
    const totalBuilds = myAgents.reduce((sum, a) => sum + a.totalBuildsContributed, 0);
    
    return {
      totalAgents: myAgents.length,
      totalBricksPlaced: totalBricks,
      totalBuildsContributed: totalBuilds,
      reputation: ctx.user.reputation,
    };
  }),
});

// ============================================
// LIVE AGENTS ROUTER (Demo/Real-time)
// ============================================

const liveAgentsRouter = router({
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

  getCurrentBuild: publicProcedure.query(() => {
    if (!currentDesign) return null;
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

  getBricks: publicProcedure.query(() => {
    return currentDesign?.bricks || [];
  }),

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

  startNewBuild: publicProcedure.mutation(async () => {
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

  generateNextAction: publicProcedure.mutation(async () => {
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

    let agent = getRandomAgent();
    const recentMessages = currentDesign.messages.slice(-5);
    
    const mentionedAgentIds = recentMessages
      .flatMap(m => {
        const mentions = m.content.match(/@(\w+[-\w]*)/g) || [];
        return mentions.map(mention => mention.slice(1).toLowerCase());
      })
      .filter(id => AI_AGENTS.some(a => a.id === id || a.name.toLowerCase().replace(/\s+/g, '-') === id));
    
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
    
    const buildProgress = Math.min(100, Math.round((currentDesign.bricks.length / 50) * 100));

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

    let content = result.content;
    if (Math.random() < 0.3 && recentMessages.length > 0) {
      const lastMessage = recentMessages[recentMessages.length - 1];
      const lastAgent = getAgentById(lastMessage.agentId);
      if (lastAgent && lastAgent.id !== agent.id) {
        content = `@${lastAgent.name.replace(/\s+/g, '-')} ${content}`;
      }
    }

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

    currentDesign.messages.push(message);

    if (result.brickAction?.brick) {
      currentDesign.bricks.push(result.brickAction.brick);
    }

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
      
      if (completedBuilds.length > 20) {
        completedBuilds = completedBuilds.slice(-20);
      }

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

      const celebrator = getRandomAgent();
      currentDesign.messages.push({
        id: `msg-${++messageIdCounter}`,
        agentId: celebrator.id,
        content: `🎊 Build complete! Starting new project: "${newConcept.name}"! ${newConcept.description}`,
        type: 'celebration',
        timestamp: Date.now(),
      });
    }

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

  resetBuild: publicProcedure.mutation(() => {
    currentDesign = null;
    messageIdCounter = 0;
    return { success: true };
  }),

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

  getCompletedBuilds: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
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

  getCompletedBuild: publicProcedure
    .input(z.object({ id: z.string() }))
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

  loadCompletedBuild: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const build = completedBuilds.find(b => b.id === input.id);
      if (!build) return { success: false, error: 'Build not found' };
      return {
        success: true,
        bricks: build.bricks,
        name: build.name,
        description: build.description,
      };
    }),
});

// ============================================
// TRAINING ROUTER - Agent skill improvement
// ============================================

const trainingRouter = router({
  // Get training progress for an agent
  getProgress: protectedProcedure
    .input(z.object({ agentPublicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = await db.getAgentByPublicId(input.agentPublicId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });

      const skills = await db.getAgentSkills(agent.id);
      const experienceToNextLevel = agent.level * 100;
      const progressToNextLevel = Math.min(100, (agent.experience / experienceToNextLevel) * 100);

      return {
        level: agent.level,
        experience: agent.experience,
        experienceToNextLevel,
        progressToNextLevel,
        skills: skills.map(s => ({
          skillId: s.skill.id,
          name: s.skill.name,
          slug: s.skill.slug,
          icon: s.skill.icon,
          proficiency: s.proficiency,
          maxProficiency: 100,
        })),
        totalBricksPlaced: agent.totalBricksPlaced,
        totalBuildsContributed: agent.totalBuildsContributed,
        reputation: agent.reputation,
      };
    }),

  // Train a specific skill
  trainSkill: protectedProcedure
    .input(z.object({
      agentPublicId: z.string(),
      skillId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const agent = await db.getAgentByPublicId(input.agentPublicId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });

      const skills = await db.getAgentSkills(agent.id);
      const agentSkill = skills.find(s => s.skill.id === input.skillId);
      
      if (!agentSkill) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Agent doesn't have this skill" });
      }

      // Calculate training result
      const currentProficiency = agentSkill.proficiency;
      const trainingGain = Math.floor(Math.random() * 5) + 1; // 1-5 points
      const newProficiency = Math.min(100, currentProficiency + trainingGain);
      const experienceGain = trainingGain * 2;

      // Update skill proficiency
      await db.updateAgentSkillProficiency(agent.id, input.skillId, newProficiency);

      // Update agent experience
      const newExperience = agent.experience + experienceGain;
      const experienceToNextLevel = agent.level * 100;
      let newLevel = agent.level;
      let leveledUp = false;

      if (newExperience >= experienceToNextLevel) {
        newLevel = agent.level + 1;
        leveledUp = true;
      }

      await db.updateAgentStats(agent.id, {
        experience: leveledUp ? newExperience - experienceToNextLevel : newExperience,
      });

      if (leveledUp) {
        await db.updateAgent(agent.id, { level: newLevel } as any);
      }

      return {
        success: true,
        trainingGain,
        newProficiency,
        experienceGain,
        leveledUp,
        newLevel,
      };
    }),

  // Award experience for completing a build
  awardBuildExperience: protectedProcedure
    .input(z.object({
      agentPublicId: z.string(),
      bricksPlaced: z.number(),
      buildCompleted: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const agent = await db.getAgentByPublicId(input.agentPublicId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your agent" });

      // Calculate experience
      let experienceGain = input.bricksPlaced; // 1 XP per brick
      if (input.buildCompleted) {
        experienceGain += 50; // Bonus for completing a build
      }

      // Calculate reputation gain
      const reputationGain = input.buildCompleted ? 10 : Math.floor(input.bricksPlaced / 10);

      // Update stats
      const newExperience = agent.experience + experienceGain;
      const experienceToNextLevel = agent.level * 100;
      let newLevel = agent.level;
      let leveledUp = false;

      if (newExperience >= experienceToNextLevel) {
        newLevel = agent.level + 1;
        leveledUp = true;
      }

      await db.updateAgentStats(agent.id, {
        experience: leveledUp ? newExperience - experienceToNextLevel : newExperience,
        totalBricksPlaced: agent.totalBricksPlaced + input.bricksPlaced,
        totalBuildsContributed: input.buildCompleted ? agent.totalBuildsContributed + 1 : agent.totalBuildsContributed,
        reputation: agent.reputation + reputationGain,
      });

      if (leveledUp) {
        await db.updateAgent(agent.id, { level: newLevel } as any);
      }

      return {
        success: true,
        experienceGain,
        reputationGain,
        leveledUp,
        newLevel,
      };
    }),

  // Get leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({
      sortBy: z.enum(["reputation", "bricks", "builds", "level"]).default("reputation"),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const agents = await db.getPublicAgents(input.limit, 0);
      
      // Sort based on criteria
      const sorted = [...agents].sort((a, b) => {
        switch (input.sortBy) {
          case "reputation": return b.reputation - a.reputation;
          case "bricks": return b.totalBricksPlaced - a.totalBricksPlaced;
          case "builds": return b.totalBuildsContributed - a.totalBuildsContributed;
          case "level": return b.level - a.level;
          default: return b.reputation - a.reputation;
        }
      });

      return sorted.map((agent, index) => ({
        rank: index + 1,
        publicId: agent.publicId,
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
        level: agent.level,
        reputation: agent.reputation,
        totalBricksPlaced: agent.totalBricksPlaced,
        totalBuildsContributed: agent.totalBuildsContributed,
      }));
    }),
});

// ============================================
// MAIN APP ROUTER
// ============================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  
  // Platform APIs
  skills: skillsRouter,
  registeredAgents: registeredAgentsRouter,
  projects: projectsRouter,
  collaboration: collaborationRouter,
  activity: activityRouter,
  profile: profileRouter,
  training: trainingRouter,
  
  // Live demo agents (backward compatible)
  agents: liveAgentsRouter,
});

export type AppRouter = typeof appRouter;
