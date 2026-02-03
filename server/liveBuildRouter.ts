/**
 * Live Build Router - tRPC procedures for autonomous agent collaboration
 * 
 * Provides endpoints for:
 * - Starting autonomous build sessions
 * - Streaming agent actions in real-time
 * - Getting session state
 * - Controlling sessions
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createCollaborationSession,
  createDemoSession,
  runCollaborationRound,
  runBuildSession,
  getSession,
  getActiveSessions,
  stopSession,
  subscribeToSession,
  SessionUpdate,
} from "./collaborationEngine";
import { AgentAction, BrickPlacement } from "./agentBrain";

// Types for client consumption
export interface LiveSessionState {
  id: string;
  projectName: string;
  projectDescription: string;
  phase: string;
  totalBricks: number;
  isActive: boolean;
  agents: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  recentActions: AgentAction[];
  bricks: BrickPlacement[];
}

export const liveBuildRouter = router({
  /**
   * Start a new autonomous build session
   */
  startSession: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      agentIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const session = await createCollaborationSession(
        input.projectId || 0,
        input.agentIds
      );

      // Start the build session in the background
      runBuildSession(session.id, 20).catch(console.error);

      return {
        sessionId: session.id,
        projectName: session.projectName,
        agents: session.agents.map(a => ({
          id: a.getConfig().id,
          name: a.getConfig().name,
          emoji: a.getConfig().emoji,
          color: a.getConfig().color,
        })),
      };
    }),

  /**
   * Start a demo session (no auth required)
   */
  startDemoSession: publicProcedure
    .mutation(async () => {
      const session = await createDemoSession();

      // Start the build session in the background
      runBuildSession(session.id, 15).catch(console.error);

      return {
        sessionId: session.id,
        projectName: session.projectName,
        agents: session.agents.map(a => ({
          id: a.getConfig().id,
          name: a.getConfig().name,
          emoji: a.getConfig().emoji,
          color: a.getConfig().color,
        })),
      };
    }),

  /**
   * Get the current state of a session
   */
  getSessionState: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input }): Promise<LiveSessionState | null> => {
      const session = getSession(input.sessionId);
      if (!session) return null;

      return {
        id: session.id,
        projectName: session.projectName,
        projectDescription: session.projectDescription,
        phase: session.phase,
        totalBricks: session.bricks.length,
        isActive: session.isActive,
        agents: session.agents.map(a => ({
          id: a.getConfig().id,
          name: a.getConfig().name,
          emoji: a.getConfig().emoji,
          color: a.getConfig().color,
        })),
        recentActions: session.actions.slice(-20),
        bricks: session.bricks,
      };
    }),

  /**
   * Get all active sessions
   */
  getActiveSessions: publicProcedure
    .query(async () => {
      const sessions = getActiveSessions();
      return sessions.map(session => ({
        id: session.id,
        projectName: session.projectName,
        phase: session.phase,
        totalBricks: session.bricks.length,
        agentCount: session.agents.length,
        startedAt: session.startedAt,
      }));
    }),

  /**
   * Trigger a single round of collaboration (for manual control)
   */
  triggerRound: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const actions = await runCollaborationRound(input.sessionId);
      return { actions };
    }),

  /**
   * Stop a session
   */
  stopSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      stopSession(input.sessionId);
      return { success: true };
    }),

  /**
   * Poll for new actions (simple polling alternative to SSE)
   */
  pollActions: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      afterTimestamp: z.number(),
    }))
    .query(async ({ input }) => {
      const session = getSession(input.sessionId);
      if (!session) {
        return { actions: [], bricks: [], isActive: false };
      }

      // Get actions after the specified timestamp
      const newActions = session.actions.filter(
        a => a.timestamp > input.afterTimestamp
      );
      const newBricks = session.bricks.filter(
        b => b.timestamp > input.afterTimestamp
      );

      return {
        actions: newActions,
        bricks: newBricks,
        isActive: session.isActive,
        phase: session.phase,
        totalBricks: session.bricks.length,
      };
    }),

  /**
   * Get session history (all actions and bricks)
   */
  getSessionHistory: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input }) => {
      const session = getSession(input.sessionId);
      if (!session) {
        return null;
      }

      return {
        id: session.id,
        projectName: session.projectName,
        projectDescription: session.projectDescription,
        startedAt: session.startedAt,
        lastActionAt: session.lastActionAt,
        isActive: session.isActive,
        phase: session.phase,
        agents: session.agents.map(a => ({
          id: a.getConfig().id,
          name: a.getConfig().name,
          emoji: a.getConfig().emoji,
          color: a.getConfig().color,
          bio: a.getConfig().bio,
          skills: a.getConfig().skills,
        })),
        actions: session.actions,
        bricks: session.bricks,
      };
    }),
});

export type LiveBuildRouter = typeof liveBuildRouter;
