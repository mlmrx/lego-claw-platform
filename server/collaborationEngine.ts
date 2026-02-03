/**
 * Multi-Agent Collaboration Engine
 * 
 * Orchestrates communication between multiple AI agents during a build session.
 * Handles:
 * - Turn-based agent actions
 * - Agent-to-agent communication
 * - Consensus building for design decisions
 * - Conflict resolution
 */

import { AgentBrain, AgentAction, BuildContext, BrickPlacement, createAgentBrain } from "./agentBrain";
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";
import { agents, buildProjects, agentSkills, skills } from "../drizzle/schema";
import * as schema from "../drizzle/schema";

export interface CollaborationSession {
  id: string;
  projectId: number;
  projectName: string;
  projectDescription: string;
  agents: AgentBrain[];
  actions: AgentAction[];
  bricks: BrickPlacement[];
  phase: string;
  isActive: boolean;
  startedAt: number;
  lastActionAt: number;
}

export interface SessionUpdate {
  type: "action" | "brick" | "phase" | "complete";
  action?: AgentAction;
  brick?: BrickPlacement;
  phase?: string;
  totalBricks?: number;
}

// Active collaboration sessions
const activeSessions = new Map<string, CollaborationSession>();

// Session update listeners (for real-time streaming)
const sessionListeners = new Map<string, Set<(update: SessionUpdate) => void>>();

/**
 * Create a new collaboration session for a build project
 */
export async function createCollaborationSession(
  projectId: number,
  agentIds?: string[]
): Promise<CollaborationSession> {
  const db = await getDb();
  
  // Get project details
  let project = null;
  if (db && projectId > 0) {
    const projects = await db.select().from(buildProjects).where(eq(buildProjects.id, projectId)).limit(1);
    project = projects[0] || null;
  }

  // Use default project if not found
  if (!project) {
    project = {
      id: 0,
      name: "Community LEGO Build",
      description: "A collaborative LEGO creation by AI agents",
    };
  }

  // Get agents for this session
  let agentsData: any[] = [];
  if (db && agentIds && agentIds.length > 0) {
    // Use specified agents
    agentsData = await Promise.all(
      agentIds.map(async (publicId) => {
        const agentResults = await db.select().from(agents).where(eq(agents.publicId, publicId)).limit(1);
        const agent = agentResults[0];
        if (!agent) return null;
        
        // Get agent's skills
        const agentSkillsData = await db
          .select({ name: skills.name })
          .from(agentSkills)
          .innerJoin(skills, eq(agentSkills.skillId, skills.id))
          .where(eq(agentSkills.agentId, agent.id));
        
        return { ...agent, skills: agentSkillsData };
      })
    );
    agentsData = agentsData.filter(Boolean);
  } else if (db) {
    // Get random active agents (3-5 agents)
    const allAgents = await db.select().from(agents).where(eq(agents.status, "idle")).limit(5);
    
    agentsData = await Promise.all(
      allAgents.map(async (agent: any) => {
        const agentSkillsData = await db
          .select({ name: skills.name })
          .from(agentSkills)
          .innerJoin(skills, eq(agentSkills.skillId, skills.id))
          .where(eq(agentSkills.agentId, agent.id));
        
        return { ...agent, skills: agentSkillsData };
      })
    );
  }

  // If no agents available, use default system agents
  if (!agentsData || agentsData.length === 0) {
    agentsData = getDefaultAgents();
  }

  // Create agent brains
  const agentBrains = agentsData.map((agent: any) => createAgentBrain(agent));

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session: CollaborationSession = {
    id: sessionId,
    projectId,
    projectName: project.name,
    projectDescription: project.description || "A collaborative LEGO build",
    agents: agentBrains,
    actions: [],
    bricks: [],
    phase: "planning",
    isActive: true,
    startedAt: Date.now(),
    lastActionAt: Date.now(),
  };

  activeSessions.set(sessionId, session);
  sessionListeners.set(sessionId, new Set());

  return session;
}

/**
 * Default system agents when no user agents are available
 */
function getDefaultAgents() {
  return [
    {
      publicId: "system_architect",
      name: "Archie",
      emoji: "🏗️",
      color: "#1E88E5",
      bio: "A master architect who specializes in structural integrity and foundational design. Archie ensures every build has a solid base and balanced proportions.",
      voiceStyle: "technical",
      personality: { creativity: 60, precision: 90, sociability: 70, boldness: 50 },
      skills: [{ name: "Structural Engineering" }, { name: "Foundation Design" }],
    },
    {
      publicId: "system_artist",
      name: "Palette",
      emoji: "🎨",
      color: "#E91E63",
      bio: "A creative artist with an eye for color and aesthetics. Palette brings builds to life with vibrant color schemes and artistic flourishes.",
      voiceStyle: "creative",
      personality: { creativity: 95, precision: 40, sociability: 80, boldness: 85 },
      skills: [{ name: "Color Theory" }, { name: "Aesthetic Design" }],
    },
    {
      publicId: "system_detailer",
      name: "Pixel",
      emoji: "🔍",
      color: "#4CAF50",
      bio: "A detail-oriented builder who excels at miniature work and intricate patterns. Pixel adds the finishing touches that make builds special.",
      voiceStyle: "enthusiastic",
      personality: { creativity: 75, precision: 95, sociability: 60, boldness: 55 },
      skills: [{ name: "Miniature Detailing" }, { name: "Pattern Design" }],
    },
    {
      publicId: "system_innovator",
      name: "Nova",
      emoji: "🚀",
      color: "#9C27B0",
      bio: "A bold innovator who pushes boundaries and experiments with unconventional techniques. Nova brings fresh ideas and unexpected solutions.",
      voiceStyle: "enthusiastic",
      personality: { creativity: 90, precision: 50, sociability: 75, boldness: 95 },
      skills: [{ name: "Innovation" }, { name: "Experimental Design" }],
    },
  ];
}

/**
 * Run a single round of agent collaboration
 * Each agent takes a turn to act based on the current context
 */
export async function runCollaborationRound(sessionId: string): Promise<AgentAction[]> {
  const session = activeSessions.get(sessionId);
  if (!session || !session.isActive) {
    throw new Error("Session not found or inactive");
  }

  const roundActions: AgentAction[] = [];
  const context = buildContext(session);

  // Each agent takes a turn
  for (const agent of session.agents) {
    try {
      // Decide action based on context
      const action = await agent.decideAction(context);
      
      // Add to session actions
      session.actions.push(action);
      roundActions.push(action);
      
      // Notify listeners
      notifyListeners(sessionId, { type: "action", action });

      // If it's a build action, add the brick
      if (action.type === "build" && action.brickData) {
        const brick: BrickPlacement = {
          ...action.brickData,
          placedBy: action.agentName,
          timestamp: action.timestamp,
        };
        session.bricks.push(brick);
        notifyListeners(sessionId, { type: "brick", brick, totalBricks: session.bricks.length });
      }

      // Update context for next agent
      context.recentActions.push(action);
      context.totalBricks = session.bricks.length;

      // Small delay between agents for natural pacing
      await delay(500);

    } catch (error) {
      console.error(`Agent ${agent.getConfig().name} error:`, error);
      // Continue with other agents
    }
  }

  // After all agents act, have them react to each other's actions
  const reactions = await runReactionRound(session, roundActions);
  roundActions.push(...reactions);

  session.lastActionAt = Date.now();
  
  return roundActions;
}

/**
 * Run a reaction round where agents respond to each other
 */
async function runReactionRound(
  session: CollaborationSession,
  roundActions: AgentAction[]
): Promise<AgentAction[]> {
  const reactions: AgentAction[] = [];
  const context = buildContext(session);

  // Find the most significant action (proposals get priority)
  const significantAction = roundActions.find(a => a.type === "propose") || roundActions[0];
  if (!significantAction) return reactions;

  // Have other agents react to the significant action
  for (const agent of session.agents) {
    // Don't react to your own action
    if (agent.getConfig().id === significantAction.agentId) continue;

    // Only some agents react (based on sociability)
    const config = agent.getConfig();
    const shouldReact = Math.random() * 100 < config.personality.sociability;
    if (!shouldReact) continue;

    try {
      const reaction = await agent.reactToAction(significantAction, context);
      session.actions.push(reaction);
      reactions.push(reaction);
      notifyListeners(session.id, { type: "action", action: reaction });

      // If reaction includes a brick, add it
      if (reaction.brickData && (reaction.type === "propose" || reaction.type === "build")) {
        const brick: BrickPlacement = {
          ...reaction.brickData,
          placedBy: reaction.agentName,
          timestamp: reaction.timestamp,
        };
        session.bricks.push(brick);
        notifyListeners(session.id, { type: "brick", brick, totalBricks: session.bricks.length });
      }

      await delay(300);
    } catch (error) {
      console.error(`Reaction error for ${config.name}:`, error);
    }
  }

  return reactions;
}

/**
 * Run a complete build session with multiple rounds
 */
export async function runBuildSession(
  sessionId: string,
  rounds: number = 10
): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  // Phase progression
  const phases = ["planning", "foundation", "structure", "details", "finishing"];
  let currentPhaseIndex = 0;

  for (let round = 0; round < rounds && session.isActive; round++) {
    // Update phase based on progress
    const progress = session.bricks.length;
    const newPhaseIndex = Math.min(
      Math.floor(progress / 10), // New phase every 10 bricks
      phases.length - 1
    );
    
    if (newPhaseIndex > currentPhaseIndex) {
      currentPhaseIndex = newPhaseIndex;
      session.phase = phases[currentPhaseIndex];
      notifyListeners(sessionId, { type: "phase", phase: session.phase });
    }

    await runCollaborationRound(sessionId);
    
    // Delay between rounds
    await delay(2000);
  }

  // Complete the session
  session.isActive = false;
  notifyListeners(sessionId, { type: "complete" });
}

/**
 * Build the context object for agent decision making
 */
function buildContext(session: CollaborationSession): BuildContext {
  return {
    projectName: session.projectName,
    projectDescription: session.projectDescription,
    currentPhase: session.phase,
    totalBricks: session.bricks.length,
    recentActions: session.actions.slice(-10),
    currentStructure: session.bricks,
    buildGoals: [
      "Create a structurally sound build",
      "Use colors harmoniously",
      "Add interesting details",
      "Collaborate effectively with other agents",
    ],
    constraints: [
      "Build within a 32x32x32 space",
      "Ensure structural stability",
      "Consider color balance",
    ],
  };
}

/**
 * Subscribe to session updates
 */
export function subscribeToSession(
  sessionId: string,
  callback: (update: SessionUpdate) => void
): () => void {
  const listeners = sessionListeners.get(sessionId);
  if (!listeners) {
    throw new Error("Session not found");
  }
  
  listeners.add(callback);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Notify all listeners of a session update
 */
function notifyListeners(sessionId: string, update: SessionUpdate): void {
  const listeners = sessionListeners.get(sessionId);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error("Listener error:", error);
      }
    });
  }
}

/**
 * Get session state
 */
export function getSession(sessionId: string): CollaborationSession | undefined {
  return activeSessions.get(sessionId);
}

/**
 * Get all active sessions
 */
export function getActiveSessions(): CollaborationSession[] {
  return Array.from(activeSessions.values()).filter(s => s.isActive);
}

/**
 * Stop a session
 */
export function stopSession(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.isActive = false;
    notifyListeners(sessionId, { type: "complete" });
  }
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a quick demo session with default agents
 */
export async function createDemoSession(): Promise<CollaborationSession> {
  const sessionId = `demo_${Date.now()}`;
  const agentsData = getDefaultAgents();
  const agents = agentsData.map((agent: any) => createAgentBrain(agent));

  const session: CollaborationSession = {
    id: sessionId,
    projectId: 0,
    projectName: "Community LEGO Tower",
    projectDescription: "A collaborative tower build where each agent contributes their unique skills to create something amazing together.",
    agents,
    actions: [],
    bricks: [],
    phase: "planning",
    isActive: true,
    startedAt: Date.now(),
    lastActionAt: Date.now(),
  };

  activeSessions.set(sessionId, session);
  sessionListeners.set(sessionId, new Set());

  return session;
}
