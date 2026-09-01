/**
 * Social Build Router
 * Direction 2: Social Building Game - Async Multiplayer Collaboration
 * 
 * Users create or join "Build Rooms" where their AI agents collaborate.
 * When offline, your agent keeps building based on your directives.
 * When you return, review what happened and approve/reject/redirect.
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { buildRooms, roomParticipants, roomTurns, roomChat, agents } from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// ============================================
// TYPES
// ============================================

interface PlacedBrick {
  id: string;
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number;
  shape: string;
  placedBy: string;
  turnId: string;
}

// ============================================
// HELPER: Generate agent turn using AI
// ============================================

async function generateAgentTurn(params: {
  agentName: string;
  agentEmoji: string;
  agentPersonality: any;
  roomGoal: string;
  roomTheme: string;
  directive: string | null;
  existingBricks: PlacedBrick[];
  recentMessages: string[];
  turnNumber: number;
}): Promise<{ message: string; reasoning: string; bricks: Omit<PlacedBrick, "id" | "turnId">[] }> {
  const { agentName, agentEmoji, agentPersonality, roomGoal, roomTheme, directive, existingBricks, recentMessages, turnNumber } = params;

  const personalityDesc = agentPersonality
    ? `Creativity: ${agentPersonality.creativity}/100, Precision: ${agentPersonality.precision}/100, Boldness: ${agentPersonality.boldness}/100`
    : "Balanced and collaborative";

  const systemPrompt = `You are ${agentEmoji} ${agentName}, a Krewdoo specialist participating in a collaborative modular assembly room.

YOUR PERSONALITY: ${personalityDesc}
ROOM GOAL: ${roomGoal || "Build something amazing together!"}
ROOM THEME: ${roomTheme || "freestyle"}
${directive ? `YOUR OWNER'S DIRECTIVE: "${directive}" (follow this guidance for what to build)` : ""}

CURRENT STATE:
- Turn number: ${turnNumber}
- Existing bricks placed: ${existingBricks.length}
- Grid: 24x24 studs (X/Z range: -12 to +12)
- Standard brick height: 1.2 units. Y=0 is baseplate top. First layer center Y=0.6.
- Available colors: #D01012 (red), #0057A8 (blue), #FED700 (yellow), #00852B (green), #FF7E14 (orange), #F4F4F4 (white), #1B1B1B (black), #A0A0A0 (gray), #583927 (brown), #DEC69C (tan), #A5CA18 (lime), #FF87A0 (pink), #8B4789 (purple), #00BCD4 (cyan)
- Available shapes: "standard", "plate", "slope", "arch", "cylinder", "cone"

RULES:
1. Place 2-6 bricks per turn (be thoughtful, not excessive)
2. Don't overlap with existing bricks
3. Build on top of or adjacent to existing bricks (unless it's the first turn)
4. Stay within the grid bounds
5. Your message should be conversational - explain what you're doing and why
6. Consider what other agents have built and complement their work

${recentMessages.length > 0 ? `RECENT ROOM ACTIVITY:\n${recentMessages.join("\n")}` : ""}

Respond with JSON:
{
  "message": "What you say to the room (1-2 sentences, in character)",
  "reasoning": "Your internal reasoning about what to build and why (1-2 sentences)",
  "bricks": [
    { "position": [x, y, z], "color": "#hex", "width": 2, "depth": 1, "height": 3, "shape": "standard", "placedBy": "${agentName}" }
  ]
}`;

  const existingBricksSummary = existingBricks.length > 0
    ? `Current bricks on the board (last 20): ${JSON.stringify(existingBricks.slice(-20).map(b => ({ pos: b.position, color: b.color, by: b.placedBy })))}`
    : "The board is empty - you're starting fresh!";

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: existingBricksSummary },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "{}";
    const parsed = JSON.parse(content);

    return {
      message: parsed.message || `${agentName} placed some bricks.`,
      reasoning: parsed.reasoning || "Building collaboratively.",
      bricks: (parsed.bricks || []).map((b: any) => ({
        position: [
          Math.max(-12, Math.min(12, Number(b.position?.[0]) || 0)),
          Math.max(0, Number(b.position?.[1]) || 0.6),
          Math.max(-12, Math.min(12, Number(b.position?.[2]) || 0)),
        ] as [number, number, number],
        color: b.color || "#D01012",
        width: Math.max(1, Math.min(4, Math.round(b.width || 2))),
        depth: Math.max(1, Math.min(4, Math.round(b.depth || 2))),
        height: Math.max(1, Math.min(6, Math.round(b.height || 3))),
        shape: b.shape || "standard",
        placedBy: agentName,
      })),
    };
  } catch (error) {
    console.error("[SocialBuild] Agent turn generation failed:", error);
    return {
      message: `${agentName} is thinking about what to build next...`,
      reasoning: "Fallback turn due to AI error.",
      bricks: [{
        position: [Math.floor(Math.random() * 6) - 3, 0.6, Math.floor(Math.random() * 6) - 3] as [number, number, number],
        color: "#D01012",
        width: 2,
        depth: 2,
        height: 3,
        shape: "standard",
        placedBy: agentName,
      }],
    };
  }
}

// ============================================
// ROUTER
// ============================================

export const socialBuildRouter = router({
  listRooms: publicProcedure
    .input(z.object({
      status: z.enum(["waiting", "active", "completed"]).optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { rooms: [], total: 0 };

      const status = input?.status;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const conditions = [eq(buildRooms.isPublic, true)];
      if (status) {
        conditions.push(eq(buildRooms.status, status));
      }

      const rooms = await db
        .select()
        .from(buildRooms)
        .where(and(...conditions))
        .orderBy(desc(buildRooms.lastActivityAt))
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(buildRooms)
        .where(and(...conditions));

      return { rooms, total: countResult?.count ?? 0 };
    }),

  getRoom: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

      const [room] = await db
        .select()
        .from(buildRooms)
        .where(eq(buildRooms.publicId, input.publicId));

      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

      const participants = await db
        .select({
          participant: roomParticipants,
          agent: agents,
        })
        .from(roomParticipants)
        .leftJoin(agents, eq(roomParticipants.agentId, agents.id))
        .where(eq(roomParticipants.roomId, room.id));

      const turns = await db
        .select()
        .from(roomTurns)
        .where(eq(roomTurns.roomId, room.id))
        .orderBy(desc(roomTurns.createdAt))
        .limit(50);

      const chat = await db
        .select()
        .from(roomChat)
        .where(eq(roomChat.roomId, room.id))
        .orderBy(desc(roomChat.createdAt))
        .limit(30);

      return {
        room,
        participants: participants.map(p => ({
          ...p.participant,
          agent: p.agent,
        })),
        turns: turns.reverse(),
        chat: chat.reverse(),
      };
    }),

  createRoom: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(200),
      description: z.string().max(500).optional(),
      theme: z.string().max(50).optional(),
      goalDescription: z.string().max(500).optional(),
      maxParticipants: z.number().min(2).max(12).default(6),
      turnDurationMinutes: z.number().min(5).max(120).default(30),
      isPublic: z.boolean().default(true),
      agentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const publicId = nanoid(12);

      await db.insert(buildRooms).values({
        publicId,
        creatorId: ctx.user.id,
        name: input.name,
        description: input.description || null,
        theme: input.theme || null,
        goalDescription: input.goalDescription || null,
        maxParticipants: input.maxParticipants,
        turnDurationMinutes: input.turnDurationMinutes,
        isPublic: input.isPublic,
        brickData: JSON.stringify([]),
        status: "waiting",
        participantCount: 1,
      });

      const [room] = await db
        .select()
        .from(buildRooms)
        .where(eq(buildRooms.publicId, publicId));

      await db.insert(roomParticipants).values({
        roomId: room.id,
        userId: ctx.user.id,
        ...(input.agentId ? { agentId: input.agentId } : {}),
        role: "creator",
        agentAutoPlay: true,
        isOnline: true,
      });

      await db.insert(roomChat).values({
        roomId: room.id,
        userId: null,
        content: `Room "${input.name}" created! Waiting for builders to join...`,
        messageType: "system",
      });

      return { publicId, roomId: room.id };
    }),

  joinRoom: protectedProcedure
    .input(z.object({
      roomPublicId: z.string(),
      agentId: z.number().optional(),
      directive: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [room] = await db
        .select()
        .from(buildRooms)
        .where(eq(buildRooms.publicId, input.roomPublicId));

      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      if (room.status === "completed" || room.status === "archived") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This room is no longer accepting participants" });
      }

      const [existing] = await db
        .select()
        .from(roomParticipants)
        .where(and(
          eq(roomParticipants.roomId, room.id),
          eq(roomParticipants.userId, ctx.user.id),
        ));

      if (existing) {
        await db.update(roomParticipants)
          .set({ isOnline: true, lastSeenAt: new Date() })
          .where(eq(roomParticipants.id, existing.id));
        return { success: true, alreadyJoined: true };
      }

      if (room.participantCount >= room.maxParticipants) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Room is full" });
      }

      let agentName = ctx.user.name || "A builder";
      if (input.agentId) {
        const [agent] = await db.select().from(agents).where(eq(agents.id, input.agentId));
        if (agent) agentName = `${agent.emoji} ${agent.name}`;
      }

      await db.insert(roomParticipants).values({
        roomId: room.id,
        userId: ctx.user.id,
        ...(input.agentId ? { agentId: input.agentId } : {}),
        role: "builder",
        agentDirective: input.directive || null,
        agentAutoPlay: true,
        isOnline: true,
      });

      await db.update(buildRooms)
        .set({ participantCount: sql`${buildRooms.participantCount} + 1` })
        .where(eq(buildRooms.id, room.id));

      if (room.status === "waiting") {
        await db.update(buildRooms)
          .set({ status: "active" })
          .where(eq(buildRooms.id, room.id));
      }

      await db.insert(roomChat).values({
        roomId: room.id,
        userId: ctx.user.id,
        content: `${agentName} joined the room!`,
        messageType: "system",
      });

      return { success: true, alreadyJoined: false };
    }),

  takeTurn: protectedProcedure
    .input(z.object({
      roomPublicId: z.string(),
      manualBricks: z.array(z.object({
        position: z.tuple([z.number(), z.number(), z.number()]),
        color: z.string(),
        width: z.number(),
        depth: z.number(),
        height: z.number(),
        shape: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [room] = await db
        .select()
        .from(buildRooms)
        .where(eq(buildRooms.publicId, input.roomPublicId));

      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      if (room.status !== "active" && room.status !== "waiting") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Room is not active" });
      }

      const [participant] = await db
        .select()
        .from(roomParticipants)
        .where(and(
          eq(roomParticipants.roomId, room.id),
          eq(roomParticipants.userId, ctx.user.id),
        ));

      if (!participant) throw new TRPCError({ code: "FORBIDDEN", message: "You're not in this room" });

      let agentName = "Builder";
      let agentEmoji = "🧱";
      let agentPersonality: any = null;
      if (participant.agentId) {
        const [agent] = await db.select().from(agents).where(eq(agents.id, participant.agentId));
        if (agent) {
          agentName = agent.name;
          agentEmoji = agent.emoji;
          agentPersonality = agent.personality;
        }
      }

      const existingBricks: PlacedBrick[] = room.brickData ? JSON.parse(room.brickData as string) : [];

      const recentChat = await db
        .select()
        .from(roomChat)
        .where(eq(roomChat.roomId, room.id))
        .orderBy(desc(roomChat.createdAt))
        .limit(5);

      const recentMessages = recentChat.reverse().map(m => m.content);

      let turnBricks: Omit<PlacedBrick, "id" | "turnId">[];
      let message: string;
      let reasoning: string;

      if (input.manualBricks && input.manualBricks.length > 0) {
        turnBricks = input.manualBricks.map(b => ({
          ...b,
          placedBy: agentName,
        }));
        message = `${agentEmoji} ${agentName} placed ${turnBricks.length} bricks manually.`;
        reasoning = "Owner placed bricks directly.";
      } else {
        const result = await generateAgentTurn({
          agentName,
          agentEmoji,
          agentPersonality,
          roomGoal: room.goalDescription || "",
          roomTheme: room.theme || "freestyle",
          directive: participant.agentDirective,
          existingBricks,
          recentMessages,
          turnNumber: room.totalTurns + 1,
        });
        turnBricks = result.bricks;
        message = result.message;
        reasoning = result.reasoning;
      }

      const turnPublicId = nanoid(12);
      const newBricksWithIds: PlacedBrick[] = turnBricks.map(b => ({
        ...b,
        id: nanoid(8),
        turnId: turnPublicId,
      }));

      await db.insert(roomTurns).values({
        publicId: turnPublicId,
        roomId: room.id,
        participantId: participant.id,
        agentId: participant.agentId,
        userId: ctx.user.id,
        turnNumber: room.totalTurns + 1,
        message,
        reasoning,
        bricksPlaced: JSON.stringify(newBricksWithIds),
        brickCount: newBricksWithIds.length,
        reviewStatus: input.manualBricks ? "approved" : "pending",
        isAutoPlay: !input.manualBricks,
      });

      const updatedBricks = [...existingBricks, ...newBricksWithIds];
      await db.update(buildRooms)
        .set({
          brickData: JSON.stringify(updatedBricks),
          totalBricks: updatedBricks.length,
          totalTurns: room.totalTurns + 1,
          lastActivityAt: new Date(),
          status: "active",
        })
        .where(eq(buildRooms.id, room.id));

      await db.update(roomParticipants)
        .set({
          bricksPlaced: sql`${roomParticipants.bricksPlaced} + ${newBricksWithIds.length}`,
          turnsCompleted: sql`${roomParticipants.turnsCompleted} + 1`,
          pendingReviewCount: input.manualBricks
            ? participant.pendingReviewCount
            : sql`${roomParticipants.pendingReviewCount} + 1`,
        })
        .where(eq(roomParticipants.id, participant.id));

      await db.insert(roomChat).values({
        roomId: room.id,
        userId: ctx.user.id,
        agentId: participant.agentId,
        content: message,
        messageType: "agent",
      });

      return {
        turnId: turnPublicId,
        message,
        reasoning,
        bricks: newBricksWithIds,
        totalBricks: updatedBricks.length,
      };
    }),

  reviewTurn: protectedProcedure
    .input(z.object({
      turnPublicId: z.string(),
      action: z.enum(["approve", "reject"]),
      feedback: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [turn] = await db
        .select()
        .from(roomTurns)
        .where(eq(roomTurns.publicId, input.turnPublicId));

      if (!turn) throw new TRPCError({ code: "NOT_FOUND", message: "Turn not found" });
      if (turn.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the agent owner can review turns" });
      }

      if (input.action === "reject") {
        const [room] = await db
          .select()
          .from(buildRooms)
          .where(eq(buildRooms.id, turn.roomId));

        if (room) {
          const allBricks: PlacedBrick[] = room.brickData ? JSON.parse(room.brickData as string) : [];
          const filteredBricks = allBricks.filter(b => b.turnId !== turn.publicId);
          await db.update(buildRooms)
            .set({
              brickData: JSON.stringify(filteredBricks),
              totalBricks: filteredBricks.length,
            })
            .where(eq(buildRooms.id, room.id));
        }

        await db.insert(roomChat).values({
          roomId: turn.roomId,
          userId: ctx.user.id,
          content: `Turn ${turn.turnNumber} was undone.${input.feedback ? ` Feedback: "${input.feedback}"` : ""}`,
          messageType: "system",
        });
      }

      await db.update(roomTurns)
        .set({
          reviewStatus: input.action === "approve" ? "approved" : "rejected",
          ownerFeedback: input.feedback || null,
          reviewedAt: new Date(),
        })
        .where(eq(roomTurns.id, turn.id));

      const [participant] = await db
        .select()
        .from(roomParticipants)
        .where(eq(roomParticipants.id, turn.participantId));

      if (participant) {
        await db.update(roomParticipants)
          .set({
            pendingReviewCount: sql`GREATEST(${roomParticipants.pendingReviewCount} - 1, 0)`,
          })
          .where(eq(roomParticipants.id, participant.id));
      }

      return { success: true };
    }),

  updateDirective: protectedProcedure
    .input(z.object({
      roomPublicId: z.string(),
      directive: z.string().max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [room] = await db
        .select()
        .from(buildRooms)
        .where(eq(buildRooms.publicId, input.roomPublicId));

      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

      const [participant] = await db
        .select()
        .from(roomParticipants)
        .where(and(
          eq(roomParticipants.roomId, room.id),
          eq(roomParticipants.userId, ctx.user.id),
        ));

      if (!participant) throw new TRPCError({ code: "FORBIDDEN", message: "You're not in this room" });

      await db.update(roomParticipants)
        .set({ agentDirective: input.directive })
        .where(eq(roomParticipants.id, participant.id));

      await db.insert(roomChat).values({
        roomId: room.id,
        userId: ctx.user.id,
        content: `New directive set: "${input.directive}"`,
        messageType: "directive",
      });

      return { success: true };
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      roomPublicId: z.string(),
      content: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [room] = await db
        .select()
        .from(buildRooms)
        .where(eq(buildRooms.publicId, input.roomPublicId));

      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

      await db.insert(roomChat).values({
        roomId: room.id,
        userId: ctx.user.id,
        content: input.content,
        messageType: "chat",
      });

      return { success: true };
    }),

  myRooms: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const participations = await db
      .select({
        participant: roomParticipants,
        room: buildRooms,
      })
      .from(roomParticipants)
      .innerJoin(buildRooms, eq(roomParticipants.roomId, buildRooms.id))
      .where(eq(roomParticipants.userId, ctx.user.id))
      .orderBy(desc(buildRooms.lastActivityAt));

    return participations.map(p => ({
      ...p.room,
      myRole: p.participant.role,
      myBricksPlaced: p.participant.bricksPlaced,
      myPendingReviews: p.participant.pendingReviewCount,
    }));
  }),

  simulateRound: protectedProcedure
    .input(z.object({ roomPublicId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [room] = await db
        .select()
        .from(buildRooms)
        .where(eq(buildRooms.publicId, input.roomPublicId));

      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

      const participants = await db
        .select({
          participant: roomParticipants,
          agent: agents,
        })
        .from(roomParticipants)
        .leftJoin(agents, eq(roomParticipants.agentId, agents.id))
        .where(and(
          eq(roomParticipants.roomId, room.id),
          eq(roomParticipants.agentAutoPlay, true),
        ));

      const results: any[] = [];
      let currentBricks: PlacedBrick[] = room.brickData ? JSON.parse(room.brickData as string) : [];

      for (const p of participants) {
        const agentName = p.agent?.name || "Builder";
        const agentEmoji = p.agent?.emoji || "🧱";

        const recentChat = await db
          .select()
          .from(roomChat)
          .where(eq(roomChat.roomId, room.id))
          .orderBy(desc(roomChat.createdAt))
          .limit(5);

        const result = await generateAgentTurn({
          agentName,
          agentEmoji,
          agentPersonality: p.agent?.personality,
          roomGoal: room.goalDescription || "",
          roomTheme: room.theme || "freestyle",
          directive: p.participant.agentDirective,
          existingBricks: currentBricks,
          recentMessages: recentChat.reverse().map(m => m.content),
          turnNumber: room.totalTurns + results.length + 1,
        });

        const turnPublicId = nanoid(12);
        const newBricks: PlacedBrick[] = result.bricks.map(b => ({
          ...b,
          id: nanoid(8),
          turnId: turnPublicId,
        }));

        await db.insert(roomTurns).values({
          publicId: turnPublicId,
          roomId: room.id,
          participantId: p.participant.id,
          agentId: p.participant.agentId,
          userId: p.participant.userId,
          turnNumber: room.totalTurns + results.length + 1,
          message: result.message,
          reasoning: result.reasoning,
          bricksPlaced: JSON.stringify(newBricks),
          brickCount: newBricks.length,
          reviewStatus: "pending",
          isAutoPlay: true,
        });

        await db.insert(roomChat).values({
          roomId: room.id,
          agentId: p.participant.agentId,
          userId: p.participant.userId,
          content: result.message,
          messageType: "agent",
        });

        await db.update(roomParticipants)
          .set({
            bricksPlaced: sql`${roomParticipants.bricksPlaced} + ${newBricks.length}`,
            turnsCompleted: sql`${roomParticipants.turnsCompleted} + 1`,
            pendingReviewCount: sql`${roomParticipants.pendingReviewCount} + 1`,
          })
          .where(eq(roomParticipants.id, p.participant.id));

        currentBricks = [...currentBricks, ...newBricks];
        results.push({ agentName, message: result.message, brickCount: newBricks.length });
      }

      await db.update(buildRooms)
        .set({
          brickData: JSON.stringify(currentBricks),
          totalBricks: currentBricks.length,
          totalTurns: room.totalTurns + results.length,
          lastActivityAt: new Date(),
          status: "active",
        })
        .where(eq(buildRooms.id, room.id));

      return { turns: results, totalBricks: currentBricks.length };
    }),
});
