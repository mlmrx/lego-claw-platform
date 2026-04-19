/**
 * Builder Router
 * Handles interactive LEGO builder operations:
 * - Save/load user builds
 * - AI assistant suggestions for brick placement
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";

// Brick schema for validation
const brickSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  color: z.string(),
  width: z.number().int().min(1).max(8),
  depth: z.number().int().min(1).max(8),
  height: z.number().int().min(1).max(6),
});

const builderBrickSchema = brickSchema.extend({
  id: z.string(),
  placedAt: z.number(),
});

export const builderRouter = router({
  /**
   * Save a build (create or update)
   */
  saveBuild: protectedProcedure
    .input(
      z.object({
        publicId: z.string().optional(), // If provided, update existing
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        brickData: z.array(builderBrickSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (input.publicId) {
        // Update existing project
        const existing = await db.getBuildProjectByPublicId(input.publicId);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Build not found" });
        }
        if (existing.creatorId !== userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your build" });
        }

        await db.updateBuildProject(existing.id, {
          name: input.name,
          description: input.description || null,
        });
        await db.updateProjectBricks(
          existing.id,
          JSON.stringify(input.brickData),
          input.brickData.length
        );

        return { publicId: existing.publicId, updated: true };
      } else {
        // Create new project
        const result = await db.createBuildProject({
          creatorId: userId,
          name: input.name,
          description: input.description || null,
          theme: "custom",
          style: "freeform",
          targetBricks: 500,
          maxAgents: 1,
          status: "building",
        });

        await db.updateProjectBricks(
          result.id,
          JSON.stringify(input.brickData),
          input.brickData.length
        );

        return { publicId: result.publicId, updated: false };
      }
    }),

  /**
   * Load a build by publicId
   */
  loadBuild: protectedProcedure
    .input(z.object({ publicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await db.getBuildProjectByPublicId(input.publicId);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Build not found" });
      }
      if (project.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your build" });
      }
      return {
        publicId: project.publicId,
        name: project.name,
        description: project.description,
        brickData: project.brickData,
        currentBricks: project.currentBricks,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    }),

  /**
   * List user's builds
   */
  myBuilds: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.getProjectsByCreator(ctx.user.id);
    return projects.map((p) => ({
      publicId: p.publicId,
      name: p.name,
      description: p.description,
      currentBricks: p.currentBricks,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }),

  /**
   * AI assistant - analyze current build and suggest next bricks
   */
  aiSuggest: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        currentBricks: z.array(brickSchema),
        projectName: z.string().optional(),
        chatHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { message, currentBricks, projectName, chatHistory } = input;

      // Build a description of the current state
      const brickSummary = currentBricks.length === 0
        ? "The build is empty - no bricks have been placed yet."
        : `The build has ${currentBricks.length} bricks. Here are the current bricks (position [x,y,z], color, size WxD):\n${currentBricks
            .slice(-30) // Last 30 bricks for context
            .map(
              (b) =>
                `  [${b.position.map((p) => p.toFixed(1)).join(",")}] ${b.color} ${b.width}x${b.depth} h=${b.height}`
            )
            .join("\n")}`;

      const systemPrompt = `You are a LEGO building assistant. You help users build LEGO creations by suggesting brick placements and offering creative advice.

IMPORTANT RULES:
- The build grid is 16x16 studs, centered at origin. Grid positions range from -6.4 to 6.4 in X and Z (each stud is 0.8 units).
- Standard brick height is 0.96 units (height=3). Plates are 0.32 units (height=1).
- Bricks stack on top of each other. Y=0.48 is ground level for standard bricks. Next layer up is Y=1.44, then Y=2.40, etc.
- Available colors: #D01012 (red), #0057A8 (blue), #FED700 (yellow), #00852B (green), #FF7E14 (orange), #F4F4F4 (white), #1B1B1B (black), #A0A0A0 (gray), #595959 (dark gray), #583927 (brown), #DEC69C (tan), #A5CA18 (lime), #FF87A0 (pink), #8B4789 (purple), #00BCD4 (cyan)
- When suggesting bricks, provide EXACT positions that snap to the 0.8 unit grid.
- Keep suggestions practical (5-15 bricks at a time).

Current build name: "${projectName || "Untitled Build"}"

${brickSummary}

When the user asks for suggestions, respond with:
1. A helpful text explanation of what you're suggesting
2. If appropriate, include a JSON block with suggested bricks in this exact format:
\`\`\`bricks
[{"position":[x,y,z],"color":"#hex","width":w,"depth":d,"height":h}]
\`\`\`

Only include the bricks JSON block when you have specific placement suggestions. For general advice or color recommendations, just provide text.`;

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
      ];

      // Add chat history for context
      if (chatHistory && chatHistory.length > 0) {
        for (const msg of chatHistory) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          });
        }
      }

      messages.push({ role: "user", content: message });

      try {
        const response = await invokeLLM({ messages });
        const rawContent = response.choices?.[0]?.message?.content;
        const content: string = typeof rawContent === "string" ? rawContent : "I couldn't generate a suggestion. Please try again.";

        // Parse suggested bricks from the response
        let suggestedBricks: Array<{
          position: [number, number, number];
          color: string;
          width: number;
          depth: number;
          height: number;
        }> = [];

        const bricksMatch = content.match(/```bricks\s*\n([\s\S]*?)\n```/);
        if (bricksMatch) {
          try {
            const parsed = JSON.parse(bricksMatch[1]);
            if (Array.isArray(parsed)) {
              suggestedBricks = parsed
                .filter(
                  (b: any) =>
                    Array.isArray(b.position) &&
                    b.position.length === 3 &&
                    typeof b.color === "string" &&
                    typeof b.width === "number" &&
                    typeof b.depth === "number"
                )
                .map((b: any) => ({
                  position: [
                    Number(b.position[0]),
                    Number(b.position[1]),
                    Number(b.position[2]),
                  ] as [number, number, number],
                  color: b.color,
                  width: Math.max(1, Math.min(8, Math.round(b.width))),
                  depth: Math.max(1, Math.min(8, Math.round(b.depth))),
                  height: b.height || 3,
                }));
            }
          } catch {
            // Failed to parse bricks JSON - that's ok, just return the text
          }
        }

        // Clean the message (remove the bricks block for display)
        const cleanMessage = content.replace(/```bricks\s*\n[\s\S]*?\n```/g, "").trim();

        return {
          message: cleanMessage || "Here are my suggestions!",
          suggestedBricks,
        };
      } catch (error) {
        console.error("[Builder AI] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI suggestion failed. Please try again.",
        });
      }
    }),
});
