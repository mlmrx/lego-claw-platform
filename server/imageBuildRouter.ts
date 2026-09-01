/**
 * Image Build Router
 * Handles construction-model image uploads, AI vision analysis, and project creation
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import * as db from "./db";

// Type for modular model information extracted from an image
export interface LegoSetInfo {
  setName: string;
  setNumber: string | null;
  pieceCount: number | null;
  estimatedDifficulty: "easy" | "medium" | "hard" | "expert";
  theme: string;
  style: string;
  colors: string[];
  features: string[];
  description: string;
  buildingTips: string[];
}

// Analyze a modular construction image using AI vision
async function analyzeLegoSetImage(imageUrl: string): Promise<LegoSetInfo> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are Krewdoo's modular construction analyst. When shown a construction-set box, instruction page, or completed interlocking-brick model, extract detailed information without claiming an official brand identity.

Your task is to identify:
1. The set name (or create a descriptive name if not visible)
2. The set number (if visible on the box)
3. Estimated piece count
4. Difficulty level (easy, medium, hard, expert)
5. Theme (space, medieval, city, technic, nature, vehicles, etc.)
6. Style (realistic, abstract, miniature, large-scale, etc.)
7. Main colors used
8. Key features and elements
9. A description of what the build represents
10. Building tips for AI agents

Always provide your best estimate even if some information isn't directly visible.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this modular construction image and return detailed model information as JSON.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "modular_model_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            setName: {
              type: "string",
              description: "Visible model name or a concise descriptive name",
            },
            setNumber: {
              type: ["string", "null"],
              description: "Visible construction-set number, if any",
            },
            pieceCount: {
              type: ["integer", "null"],
              description: "Estimated or actual piece count",
            },
            estimatedDifficulty: {
              type: "string",
              enum: ["easy", "medium", "hard", "expert"],
              description: "Difficulty level for building",
            },
            theme: {
              type: "string",
              description: "Theme category (space, medieval, city, etc.)",
            },
            style: {
              type: "string",
              description: "Build style (realistic, abstract, miniature, etc.)",
            },
            colors: {
              type: "array",
              items: { type: "string" },
              description: "Main colors used in the build",
            },
            features: {
              type: "array",
              items: { type: "string" },
              description: "Key features and elements of the build",
            },
            description: {
              type: "string",
              description: "Detailed description of what the build represents",
            },
            buildingTips: {
              type: "array",
              items: { type: "string" },
              description: "Tips for AI agents building this set",
            },
          },
          required: [
            "setName",
            "setNumber",
            "pieceCount",
            "estimatedDifficulty",
            "theme",
            "style",
            "colors",
            "features",
            "description",
            "buildingTips",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to analyze image");
  }

  return JSON.parse(content) as LegoSetInfo;
}

export const imageBuildRouter = router({
  // Upload and analyze a modular construction image
  analyzeImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string(), // Base64 encoded image data
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode base64 and upload to S3
      const imageBuffer = Buffer.from(input.imageBase64, "base64");
      const fileKey = `lego-uploads/${ctx.user.id}/${nanoid()}.${input.mimeType.split("/")[1] || "jpg"}`;

      const { url: imageUrl } = await storagePut(
        fileKey,
        imageBuffer,
        input.mimeType
      );

      // Analyze the image with AI vision
      const setInfo = await analyzeLegoSetImage(imageUrl);

      return {
        imageUrl,
        setInfo,
      };
    }),

  // Create a build project from analyzed image
  createBuildFromImage: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string(),
        setInfo: z.object({
          setName: z.string(),
          setNumber: z.string().nullable(),
          pieceCount: z.number().nullable(),
          estimatedDifficulty: z.enum(["easy", "medium", "hard", "expert"]),
          theme: z.string(),
          style: z.string(),
          colors: z.array(z.string()),
          features: z.array(z.string()),
          description: z.string(),
          buildingTips: z.array(z.string()),
        }),
        customName: z.string().optional(),
        customDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { imageUrl, setInfo, customName, customDescription } = input;

      // Calculate target bricks based on piece count or difficulty
      let targetBricks = 100;
      if (setInfo.pieceCount) {
        targetBricks = Math.min(500, Math.max(50, Math.round(setInfo.pieceCount / 10)));
      } else {
        switch (setInfo.estimatedDifficulty) {
          case "easy":
            targetBricks = 50;
            break;
          case "medium":
            targetBricks = 100;
            break;
          case "hard":
            targetBricks = 200;
            break;
          case "expert":
            targetBricks = 300;
            break;
        }
      }

      // Create the build project
      const projectName = customName || setInfo.setName;
      const projectDescription = customDescription || setInfo.description;
      
      const project = await db.createBuildProject({
        creatorId: ctx.user.id,
        name: projectName,
        description: projectDescription,
        theme: setInfo.theme,
        style: setInfo.style,
        sourceImageUrl: imageUrl,
        legoSetInfo: setInfo,
        targetBricks,
        maxAgents: 8,
        isOpenToJoin: true,
        status: "building",
      });

      return {
        projectId: project.publicId,
        name: projectName,
        description: projectDescription,
        theme: setInfo.theme,
        style: setInfo.style,
        targetBricks,
        imageUrl,
        setInfo,
      };
    }),

  // Get builds created from images
  getImageBuilds: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      // Get projects that have source images
      const projects = await db.getProjectsWithImages(input.limit, input.offset);
      return projects;
    }),

  // Get user's image builds
  myImageBuilds: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.getUserImageBuilds(ctx.user.id);
    return projects;
  }),
});
