/**
 * Instruction Generator Router
 * Direction 3: LEGO Instruction Generator
 * 
 * Upload any image (building, animal, character, vehicle) and get
 * step-by-step modular building instructions with a parts list —
 * like official LEGO manuals.
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ============================================
// TYPES
// ============================================

export interface InstructionBrick {
  position: [number, number, number];
  color: string;
  colorName: string;
  width: number;
  depth: number;
  height: number; // in plates (3 = standard brick, 1 = plate)
  shape: string;
  partId: string; // e.g., "3001" for 2x4 brick
}

export interface InstructionStep {
  stepNumber: number;
  title: string;
  description: string;
  bricks: InstructionBrick[];
  subAssembly?: boolean; // if this step builds a separate piece to attach later
  attachTo?: string; // which previous step's assembly this attaches to
  tip?: string; // builder tip for this step
}

export interface PartListItem {
  partId: string;
  name: string;
  color: string;
  colorName: string;
  quantity: number;
  shape: string;
  dimensions: string; // e.g., "2x4", "1x2"
}

export interface InstructionSet {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  estimatedMinutes: number;
  totalPieces: number;
  dimensions: { width: number; height: number; depth: number }; // final model size in studs
  steps: InstructionStep[];
  partsList: PartListItem[];
  buildTips: string[];
  imageUrl?: string; // original uploaded image
}

// ============================================
// LEGO PART DATABASE (common parts)
// ============================================

const LEGO_PARTS: Record<string, { name: string; width: number; depth: number; height: number; shape: string }> = {
  "3001": { name: "Brick 2x4", width: 2, depth: 4, height: 3, shape: "standard" },
  "3002": { name: "Brick 2x3", width: 2, depth: 3, height: 3, shape: "standard" },
  "3003": { name: "Brick 2x2", width: 2, depth: 2, height: 3, shape: "standard" },
  "3004": { name: "Brick 1x2", width: 1, depth: 2, height: 3, shape: "standard" },
  "3005": { name: "Brick 1x1", width: 1, depth: 1, height: 3, shape: "standard" },
  "3010": { name: "Brick 1x4", width: 1, depth: 4, height: 3, shape: "standard" },
  "3008": { name: "Brick 1x8", width: 1, depth: 8, height: 3, shape: "standard" },
  "3009": { name: "Brick 1x6", width: 1, depth: 6, height: 3, shape: "standard" },
  "3020": { name: "Plate 2x4", width: 2, depth: 4, height: 1, shape: "plate" },
  "3021": { name: "Plate 2x3", width: 2, depth: 3, height: 1, shape: "plate" },
  "3022": { name: "Plate 2x2", width: 2, depth: 2, height: 1, shape: "plate" },
  "3023": { name: "Plate 1x2", width: 1, depth: 2, height: 1, shape: "plate" },
  "3024": { name: "Plate 1x1", width: 1, depth: 1, height: 1, shape: "plate" },
  "3034": { name: "Plate 2x8", width: 2, depth: 8, height: 1, shape: "plate" },
  "3795": { name: "Plate 2x6", width: 2, depth: 6, height: 1, shape: "plate" },
  "3040": { name: "Slope 2x1 45°", width: 2, depth: 1, height: 3, shape: "slope" },
  "3039": { name: "Slope 2x2 45°", width: 2, depth: 2, height: 3, shape: "slope" },
  "3037": { name: "Slope 2x4 45°", width: 2, depth: 4, height: 3, shape: "slope" },
  "3298": { name: "Slope 2x3 33°", width: 2, depth: 3, height: 3, shape: "slope" },
  "3659": { name: "Arch 1x4", width: 1, depth: 4, height: 3, shape: "arch" },
  "6005": { name: "Arch 1x3", width: 1, depth: 3, height: 3, shape: "arch" },
  "3062": { name: "Round Brick 1x1", width: 1, depth: 1, height: 3, shape: "cylinder" },
  "6143": { name: "Round Brick 2x2", width: 2, depth: 2, height: 3, shape: "cylinder" },
  "3942": { name: "Cone 2x2", width: 2, depth: 2, height: 3, shape: "cone" },
  "6091": { name: "Curved Slope 2x1", width: 2, depth: 1, height: 3, shape: "curved" },
  "54200": { name: "Slope Curved 1x1", width: 1, depth: 1, height: 2, shape: "curved" },
  "2357": { name: "Corner Brick 2x2", width: 2, depth: 2, height: 3, shape: "standard" },
  "3660": { name: "Inverted Slope 2x2 45°", width: 2, depth: 2, height: 3, shape: "slope" },
  "4070": { name: "Brick 1x1 with Headlight", width: 1, depth: 1, height: 3, shape: "standard" },
  "87087": { name: "Brick 1x1 with Stud on Side", width: 1, depth: 1, height: 3, shape: "standard" },
};

const LEGO_COLORS: Record<string, string> = {
  "#D01012": "Red",
  "#0057A8": "Blue",
  "#FED700": "Yellow",
  "#00852B": "Green",
  "#FF7E14": "Orange",
  "#F4F4F4": "White",
  "#1B1B1B": "Black",
  "#A0A0A0": "Light Gray",
  "#595959": "Dark Gray",
  "#583927": "Brown",
  "#DEC69C": "Tan",
  "#A5CA18": "Lime",
  "#FF87A0": "Pink",
  "#8B4789": "Purple",
  "#00BCD4": "Cyan",
  "#05131D": "Dark Blue",
  "#069D9F": "Teal",
  "#B40000": "Dark Red",
  "#F5CD2F": "Bright Light Yellow",
  "#A95500": "Dark Orange",
};

// ============================================
// ROUTER
// ============================================

export const instructionRouter = router({
  /**
   * Analyze an uploaded image and generate modular building instructions.
   * Accepts a base64 image or image URL.
   */
  generateFromImage: publicProcedure
    .input(
      z.object({
        imageBase64: z.string().optional(), // base64 encoded image data
        imageUrl: z.string().url().optional(), // or a URL to the image
        complexity: z.enum(["simple", "detailed", "expert"]).default("detailed"),
        maxPieces: z.number().int().min(20).max(500).default(100),
        style: z.string().max(200).optional(), // e.g., "realistic", "cute", "blocky"
      })
    )
    .mutation(async ({ input }) => {
      const { imageBase64, imageUrl, complexity, maxPieces, style } = input;

      if (!imageBase64 && !imageUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide an image (either base64 or URL)",
        });
      }

      // Upload image to storage if base64
      let finalImageUrl = imageUrl || "";
      if (imageBase64) {
        try {
          const buffer = Buffer.from(imageBase64, "base64");
          const key = `instructions/${nanoid(12)}.jpg`;
          const { url } = await storagePut(key, buffer, "image/jpeg");
          finalImageUrl = url;
        } catch (e) {
          console.error("[Instructions] Image upload failed:", e);
          // Continue without storing - we can still analyze the base64
        }
      }

      const complexityGuide = {
        simple: `Use ${Math.min(maxPieces, 40)} pieces max, 4-6 steps. Large bricks only (2x4, 2x3, 2x2). Very blocky, simplified representation.`,
        detailed: `Use ${Math.min(maxPieces, 100)} pieces max, 8-14 steps. Mix of standard bricks, plates, and slopes. Good detail while remaining buildable.`,
        expert: `Use up to ${maxPieces} pieces, 15-25 steps. Full range of parts including SNOT techniques, sub-assemblies, and fine detail work.`,
      };

      const systemPrompt = `You are Krewdoo's expert modular model designer. Create clear, original building instructions from reference images using interlocking construction pieces, without presenting the result as an official branded set.

DESIGN PRINCIPLES:
- Study the image carefully: identify the main shape, proportions, key features, and colors
- Design from the ground up: start with the base, build structural core, then add details
- Use proven interlocking-brick techniques: offset layers for strength, side-stud construction for detail, and sub-assemblies for complex parts
- Choose colors that best match the reference image from the available palette
- Every brick must have a valid, non-overlapping position

GRID & DIMENSIONS:
- Grid is 32x32 studs max, centered at origin. X/Z range: -16 to +16
- Standard brick height = 1.2 units (height=3 in plates). Plate = 0.4 units (height=1)
- Y=0 is baseplate top. First brick Y = 0.6 (center of first standard brick)
- Layers: Y=0.6, 1.8, 3.0, 4.2, 5.4, 6.6, etc. (each +1.2 for standard bricks)
- For plates: Y=0.2, 0.6, 1.0, etc. (each +0.4)

AVAILABLE PARTS (use partId in your response):
${Object.entries(LEGO_PARTS).map(([id, p]) => `  ${id}: ${p.name} (${p.width}x${p.depth}, h=${p.height})`).join("\n")}

AVAILABLE COLORS (use hex in your response):
${Object.entries(LEGO_COLORS).map(([hex, name]) => `  ${hex}: ${name}`).join("\n")}

COMPLEXITY: ${complexityGuide[complexity]}
${style ? `STYLE: ${style}` : ""}

INSTRUCTION QUALITY:
- Each step should add a logical group of bricks (3-12 pieces per step)
- Steps should be ordered so the model is structurally stable at each point
- Include builder tips for tricky techniques
- Sub-assemblies (built separately then attached) should be marked
- Part list must be accurate — count every brick used

Respond with valid JSON matching this schema (no markdown, no code blocks):
{
  "title": "string - descriptive name for this LEGO model",
  "description": "string - what this model represents and key features",
  "difficulty": "easy|medium|hard|expert",
  "estimatedMinutes": number,
  "totalPieces": number,
  "dimensions": { "width": number, "height": number, "depth": number },
  "buildTips": ["string - general building tips for this model"],
  "steps": [
    {
      "stepNumber": number,
      "title": "string - what this step builds",
      "description": "string - detailed instruction for this step",
      "subAssembly": boolean,
      "attachTo": "string or null - which step to attach sub-assembly to",
      "tip": "string or null - optional builder tip",
      "bricks": [
        {
          "position": [x, y, z],
          "color": "#hex",
          "colorName": "string",
          "width": number,
          "depth": number,
          "height": number,
          "shape": "standard|plate|slope|arch|cylinder|cone|curved",
          "partId": "string"
        }
      ]
    }
  ],
  "partsList": [
    {
      "partId": "string",
      "name": "string",
      "color": "#hex",
      "colorName": "string",
      "quantity": number,
      "shape": "string",
      "dimensions": "WxD string"
    }
  ]
}`;

      const userContent: any[] = [
        {
          type: "text",
          text: `Analyze this image and create detailed modular building instructions. Capture the main shape, proportions, and colors while keeping the model buildable and structurally sound.`,
        },
      ];

      // Add image to the message
      if (imageBase64) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high",
          },
        });
      } else if (finalImageUrl) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: finalImageUrl,
            detail: "high",
          },
        });
      }

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "";

        let instructions: InstructionSet;
        try {
          const parsed = JSON.parse(content);

          if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
            throw new Error("No steps in instructions");
          }

          instructions = {
            id: nanoid(12),
            title: parsed.title || "LEGO Model",
            description: parsed.description || "A custom modular creation",
            difficulty: parsed.difficulty || "medium",
            estimatedMinutes: parsed.estimatedMinutes || 30,
            totalPieces: parsed.totalPieces || 0,
            dimensions: parsed.dimensions || { width: 16, height: 10, depth: 16 },
            imageUrl: finalImageUrl || undefined,
            buildTips: parsed.buildTips || [],
            steps: parsed.steps.map((step: any, i: number) => ({
              stepNumber: step.stepNumber || i + 1,
              title: step.title || `Step ${i + 1}`,
              description: step.description || "",
              subAssembly: step.subAssembly || false,
              attachTo: step.attachTo || undefined,
              tip: step.tip || undefined,
              bricks: (step.bricks || []).map((b: any) => ({
                position: [
                  Number(b.position?.[0]) || 0,
                  Number(b.position?.[1]) || 0.6,
                  Number(b.position?.[2]) || 0,
                ] as [number, number, number],
                color: b.color || "#D01012",
                colorName: b.colorName || LEGO_COLORS[b.color] || "Red",
                width: Math.max(1, Math.min(8, Math.round(b.width || 2))),
                depth: Math.max(1, Math.min(8, Math.round(b.depth || 2))),
                height: Math.max(1, Math.min(9, Math.round(b.height || 3))),
                shape: b.shape || "standard",
                partId: b.partId || "3003",
              })),
            })),
            partsList: (parsed.partsList || []).map((p: any) => ({
              partId: p.partId || "3003",
              name: p.name || LEGO_PARTS[p.partId]?.name || "Brick",
              color: p.color || "#D01012",
              colorName: p.colorName || LEGO_COLORS[p.color] || "Red",
              quantity: Math.max(1, Math.round(p.quantity || 1)),
              shape: p.shape || "standard",
              dimensions: p.dimensions || "2x2",
            })),
          };

          // Calculate total pieces if not provided
          if (!instructions.totalPieces) {
            instructions.totalPieces = instructions.steps.reduce(
              (sum, step) => sum + step.bricks.length,
              0
            );
          }

          // Generate parts list if empty
          if (instructions.partsList.length === 0) {
            const partsMap = new Map<string, PartListItem>();
            for (const step of instructions.steps) {
              for (const brick of step.bricks) {
                const key = `${brick.partId}-${brick.color}`;
                const existing = partsMap.get(key);
                if (existing) {
                  existing.quantity++;
                } else {
                  partsMap.set(key, {
                    partId: brick.partId,
                    name: LEGO_PARTS[brick.partId]?.name || `Brick ${brick.width}x${brick.depth}`,
                    color: brick.color,
                    colorName: brick.colorName,
                    quantity: 1,
                    shape: brick.shape,
                    dimensions: `${brick.width}x${brick.depth}`,
                  });
                }
              }
            }
            instructions.partsList = Array.from(partsMap.values()).sort(
              (a, b) => b.quantity - a.quantity
            );
          }
        } catch (parseError) {
          console.error("[Instructions] JSON parse error:", parseError, "Raw:", content.substring(0, 300));
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate instructions. Please try again with a clearer image.",
          });
        }

        return instructions;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Instructions] LLM error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI is processing. Please try again in a moment!",
        });
      }
    }),

  /**
   * Generate instructions from a text description (no image needed).
   * Useful for when users want to build something specific but don't have a reference image.
   */
  generateFromText: publicProcedure
    .input(
      z.object({
        description: z.string().min(5).max(500),
        complexity: z.enum(["simple", "detailed", "expert"]).default("detailed"),
        maxPieces: z.number().int().min(20).max(500).default(100),
      })
    )
    .mutation(async ({ input }) => {
      const { description, complexity, maxPieces } = input;

      const complexityGuide = {
        simple: `Use ${Math.min(maxPieces, 40)} pieces max, 4-6 steps. Large bricks only.`,
        detailed: `Use ${Math.min(maxPieces, 100)} pieces max, 8-14 steps. Mix of parts.`,
        expert: `Use up to ${maxPieces} pieces, 15-25 steps. Full range of techniques.`,
      };

      const systemPrompt = `You are Krewdoo's expert modular model designer. Create professional, original building instructions for the described subject.

GRID: 32x32 studs, centered. X/Z: -16 to +16. Y=0 is baseplate.
Standard brick: height=3 (1.2 units). Plate: height=1 (0.4 units).
Layers: Y=0.6, 1.8, 3.0, 4.2... (standard bricks), Y=0.2, 0.6, 1.0... (plates)

AVAILABLE PARTS:
${Object.entries(LEGO_PARTS).map(([id, p]) => `  ${id}: ${p.name} (${p.width}x${p.depth})`).join("\n")}

COLORS: ${Object.entries(LEGO_COLORS).map(([hex, name]) => `${hex}=${name}`).join(", ")}

COMPLEXITY: ${complexityGuide[complexity]}

Respond with valid JSON (same schema as image-based instructions):
{
  "title": "string",
  "description": "string",
  "difficulty": "easy|medium|hard|expert",
  "estimatedMinutes": number,
  "totalPieces": number,
  "dimensions": { "width": number, "height": number, "depth": number },
  "buildTips": ["string"],
  "steps": [{ "stepNumber": number, "title": "string", "description": "string", "subAssembly": boolean, "tip": "string|null", "bricks": [{ "position": [x,y,z], "color": "#hex", "colorName": "string", "width": number, "depth": number, "height": number, "shape": "string", "partId": "string" }] }],
  "partsList": [{ "partId": "string", "name": "string", "color": "#hex", "colorName": "string", "quantity": number, "shape": "string", "dimensions": "WxD" }]
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Design modular interlocking-brick instructions for: "${description}". Make the model visually clear and structurally sound.` },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "";

        const parsed = JSON.parse(content);

        if (!parsed.steps || parsed.steps.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate instructions. Please try a different description.",
          });
        }

        const instructions: InstructionSet = {
          id: nanoid(12),
          title: parsed.title || "LEGO Model",
          description: parsed.description || description,
          difficulty: parsed.difficulty || "medium",
          estimatedMinutes: parsed.estimatedMinutes || 30,
          totalPieces: parsed.totalPieces || 0,
          dimensions: parsed.dimensions || { width: 16, height: 10, depth: 16 },
          buildTips: parsed.buildTips || [],
          steps: parsed.steps.map((step: any, i: number) => ({
            stepNumber: step.stepNumber || i + 1,
            title: step.title || `Step ${i + 1}`,
            description: step.description || "",
            subAssembly: step.subAssembly || false,
            attachTo: step.attachTo || undefined,
            tip: step.tip || undefined,
            bricks: (step.bricks || []).map((b: any) => ({
              position: [
                Number(b.position?.[0]) || 0,
                Number(b.position?.[1]) || 0.6,
                Number(b.position?.[2]) || 0,
              ] as [number, number, number],
              color: b.color || "#D01012",
              colorName: b.colorName || LEGO_COLORS[b.color] || "Red",
              width: Math.max(1, Math.min(8, Math.round(b.width || 2))),
              depth: Math.max(1, Math.min(8, Math.round(b.depth || 2))),
              height: Math.max(1, Math.min(9, Math.round(b.height || 3))),
              shape: b.shape || "standard",
              partId: b.partId || "3003",
            })),
          })),
          partsList: (parsed.partsList || []).map((p: any) => ({
            partId: p.partId || "3003",
            name: p.name || "Brick",
            color: p.color || "#D01012",
            colorName: p.colorName || "Red",
            quantity: Math.max(1, Math.round(p.quantity || 1)),
            shape: p.shape || "standard",
            dimensions: p.dimensions || "2x2",
          })),
        };

        if (!instructions.totalPieces) {
          instructions.totalPieces = instructions.steps.reduce((sum, s) => sum + s.bricks.length, 0);
        }

        if (instructions.partsList.length === 0) {
          const partsMap = new Map<string, PartListItem>();
          for (const step of instructions.steps) {
            for (const brick of step.bricks) {
              const key = `${brick.partId}-${brick.color}`;
              const existing = partsMap.get(key);
              if (existing) existing.quantity++;
              else partsMap.set(key, {
                partId: brick.partId,
                name: LEGO_PARTS[brick.partId]?.name || `Brick ${brick.width}x${brick.depth}`,
                color: brick.color,
                colorName: brick.colorName,
                quantity: 1,
                shape: brick.shape,
                dimensions: `${brick.width}x${brick.depth}`,
              });
            }
          }
          instructions.partsList = Array.from(partsMap.values()).sort((a, b) => b.quantity - a.quantity);
        }

        return instructions;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Instructions] Text generation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate instructions. Please try again.",
        });
      }
    }),

  /**
   * Get the available LEGO parts catalog for reference.
   */
  getPartsCatalog: publicProcedure.query(() => {
    return {
      parts: Object.entries(LEGO_PARTS).map(([id, part]) => ({
        partId: id,
        ...part,
      })),
      colors: Object.entries(LEGO_COLORS).map(([hex, name]) => ({
        hex,
        name,
      })),
    };
  }),
});
