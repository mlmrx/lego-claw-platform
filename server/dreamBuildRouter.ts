/**
 * Dream Build Router
 * Direction 1: Creative AI Co-pilot for Kids
 * 
 * Kids describe what they want to build in natural language,
 * and AI decomposes it into step-by-step modular building instructions
 * with educational explanations about structural engineering,
 * color theory, and spatial reasoning.
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";

// ============================================
// TYPES
// ============================================

export interface BuildStep {
  stepNumber: number;
  title: string;
  description: string;
  lesson: string;           // Educational explanation (WHY this step matters)
  lessonType: "stability" | "color" | "symmetry" | "proportion" | "structure" | "creativity";
  bricks: Array<{
    position: [number, number, number];
    color: string;
    width: number;
    depth: number;
    height: number;         // in plates (3 = standard brick)
    shape?: string;
  }>;
  encouragement: string;    // Fun motivational message for kids
}

export interface DreamBuildPlan {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  totalBricks: number;
  steps: BuildStep[];
  funFact: string;          // A fun construction or engineering fact
}

// ============================================
// ROUTER
// ============================================

export const dreamBuildRouter = router({
  /**
   * Generate a step-by-step build plan from a natural language description.
   * This is the core "Dream Build" feature - kids describe what they want
   * and AI creates a guided building experience.
   */
  generatePlan: publicProcedure
    .input(
      z.object({
        description: z.string().min(3).max(500),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        style: z.string().max(100).optional(), // e.g., "colorful", "realistic", "cute"
      })
    )
    .mutation(async ({ input }) => {
      const { description, difficulty = "beginner", style } = input;

      const difficultyGuide = {
        beginner: "Use 15-30 bricks total, 3-5 steps. Keep shapes simple and blocky. Use large bricks (2x4, 2x2). Explanations should be for ages 6-8.",
        intermediate: "Use 30-60 bricks total, 5-8 steps. Include some detail work with plates and slopes. Explanations for ages 9-12.",
        advanced: "Use 60-100 bricks total, 8-12 steps. Include complex techniques like SNOT (studs not on top), overhangs, and mixed shapes. Explanations for ages 12+.",
      };

      const systemPrompt = `You are Krewdoo's friendly modular-building teacher. You help kids turn ideas into clear, educational steps using colorful interlocking construction pieces.

IMPORTANT RULES:
- The build grid is 24x24 studs, centered at origin
- Grid positions use stud units: each stud = 1.0 unit. Valid X/Z range: -12 to +12
- Standard brick height = 1.2 units (height=3 in plates). Plate = 0.4 units (height=1)
- Y=0 is the top of the baseplate. First brick center Y = 0.6 (half of 1.2)
- Second layer Y = 1.8 (0.6 + 1.2), third layer Y = 3.0, etc.
- Available colors: #D01012 (red), #0057A8 (blue), #FED700 (yellow), #00852B (green), #FF7E14 (orange), #F4F4F4 (white), #1B1B1B (black), #A0A0A0 (gray), #595959 (dark gray), #583927 (brown), #DEC69C (tan), #A5CA18 (lime), #FF87A0 (pink), #8B4789 (purple), #00BCD4 (cyan)
- Available shapes: "standard", "plate", "slope", "arch", "cylinder", "cone", "wedge", "round", "curved"
- Bricks must not overlap! Check positions carefully.
- Each step should add 3-10 bricks that form a logical group (e.g., "the base", "the walls", "the roof")

DIFFICULTY: ${difficultyGuide[difficulty]}

EDUCATIONAL APPROACH:
Each step MUST include a "lesson" that teaches ONE concept:
- "stability": Why wider bases are stronger, weight distribution, center of gravity
- "color": Color harmony, contrast, using accent colors, warm vs cool
- "symmetry": Mirror patterns, rotational symmetry, balance
- "proportion": Scale relationships, golden ratio in building, realistic proportions
- "structure": How arches distribute weight, cantilevers, buttresses
- "creativity": Breaking rules intentionally, artistic expression, personal style

TONE: Enthusiastic, encouraging, age-appropriate. Use analogies kids understand.
${style ? `STYLE PREFERENCE: Make it ${style}.` : ""}

You MUST respond with valid JSON matching this exact schema (no markdown, no code blocks, just raw JSON):
{
  "title": "string - creative name for the build",
  "description": "string - one sentence describing what we're building",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedMinutes": number,
  "totalBricks": number,
  "funFact": "string - a fun construction, design, or engineering fact related to this build",
  "steps": [
    {
      "stepNumber": number,
      "title": "string - name of this step (e.g., 'Building the Foundation')",
      "description": "string - what we're doing in this step",
      "lesson": "string - educational explanation of WHY (2-3 sentences, kid-friendly)",
      "lessonType": "stability|color|symmetry|proportion|structure|creativity",
      "bricks": [
        {
          "position": [x, y, z],
          "color": "#hex",
          "width": number,
          "depth": number,
          "height": number,
          "shape": "standard|plate|slope|arch|cylinder|cone|wedge|round|curved"
        }
      ],
      "encouragement": "string - fun motivational message"
    }
  ]
}`;

      const userMessage = `A kid wants to build: "${description}"

Create a step-by-step modular building plan. Remember:
- Start with the base/foundation
- Build up logically layer by layer
- Each step teaches something new
- Make it FUN and achievable
- Bricks must not overlap (check all positions)
- Use the full color palette creatively`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "";

        // Parse the JSON response
        let plan: DreamBuildPlan;
        try {
          const parsed = JSON.parse(content);
          
          // Validate the structure
          if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
            throw new Error("No steps in plan");
          }

          plan = {
            title: parsed.title || "My Krewdoo Creation",
            description: parsed.description || description,
            difficulty: parsed.difficulty || difficulty,
            estimatedMinutes: parsed.estimatedMinutes || 10,
            totalBricks: parsed.totalBricks || 0,
            funFact: parsed.funFact || "Overlapping seams between layers helps interlocking structures resist sideways forces.",
            steps: parsed.steps.map((step: any, i: number) => ({
              stepNumber: step.stepNumber || i + 1,
              title: step.title || `Step ${i + 1}`,
              description: step.description || "",
              lesson: step.lesson || "",
              lessonType: step.lessonType || "creativity",
              bricks: (step.bricks || []).map((b: any) => ({
                position: [
                  Number(b.position?.[0]) || 0,
                  Number(b.position?.[1]) || 0.6,
                  Number(b.position?.[2]) || 0,
                ] as [number, number, number],
                color: b.color || "#D01012",
                width: Math.max(1, Math.min(8, Math.round(b.width || 2))),
                depth: Math.max(1, Math.min(8, Math.round(b.depth || 2))),
                height: Math.max(1, Math.min(9, Math.round(b.height || 3))),
                shape: b.shape || "standard",
              })),
              encouragement: step.encouragement || "Great job! Keep going!",
            })),
          };

          // Calculate total bricks if not provided
          if (!plan.totalBricks) {
            plan.totalBricks = plan.steps.reduce((sum, step) => sum + step.bricks.length, 0);
          }
        } catch (parseError) {
          console.error("[DreamBuild] JSON parse error:", parseError, "Raw:", content.substring(0, 200));
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate build plan. Please try again with a different description.",
          });
        }

        return plan;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[DreamBuild] LLM error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI is taking a break. Please try again in a moment!",
        });
      }
    }),

  /**
   * Get a hint for the current step if the kid is stuck.
   * Provides more detailed guidance without giving away the full answer.
   */
  getHint: publicProcedure
    .input(
      z.object({
        buildTitle: z.string(),
        currentStep: z.number().int().min(1),
        stepTitle: z.string(),
        stepDescription: z.string(),
        bricksPlacedSoFar: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const { buildTitle, currentStep, stepTitle, stepDescription, bricksPlacedSoFar } = input;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a friendly Krewdoo coach helping a kid who is stuck on step ${currentStep} of assembling "${buildTitle}".
The step is called "${stepTitle}" and involves: ${stepDescription}.
They've placed ${bricksPlacedSoFar} bricks so far.

Give a SHORT, encouraging hint (2-3 sentences max). Don't give the full answer - just nudge them in the right direction. Use simple language and be enthusiastic!`,
            },
            {
              role: "user",
              content: "I'm stuck! Can you give me a hint?",
            },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        return {
          hint: typeof rawContent === "string" ? rawContent : "Try looking at the shape from above - where would the next brick fit best?",
        };
      } catch {
        return {
          hint: "Here's a tip: Start with the biggest bricks first, then fill in the details with smaller ones!",
        };
      }
    }),

  /**
   * Get suggested dream build ideas for kids who don't know what to build.
   */
  getIdeas: publicProcedure.query(async () => {
    return {
      ideas: [
        {
          emoji: "🏰",
          title: "A Castle with a Dragon Tower",
          description: "Build a medieval castle with tall towers and a dragon perch",
          difficulty: "intermediate" as const,
        },
        {
          emoji: "🚀",
          title: "A Rocket Ship",
          description: "Build a rocket ready to blast off to space",
          difficulty: "beginner" as const,
        },
        {
          emoji: "🌳",
          title: "A Treehouse",
          description: "Build a cozy treehouse with a ladder and balcony",
          difficulty: "intermediate" as const,
        },
        {
          emoji: "🐉",
          title: "A Friendly Dragon",
          description: "Build a colorful dragon with wings and a long tail",
          difficulty: "advanced" as const,
        },
        {
          emoji: "🏠",
          title: "My Dream House",
          description: "Build a house with rooms, a roof, and a garden",
          difficulty: "beginner" as const,
        },
        {
          emoji: "🚗",
          title: "A Race Car",
          description: "Build a speedy race car with big wheels",
          difficulty: "beginner" as const,
        },
        {
          emoji: "🦕",
          title: "A Dinosaur",
          description: "Build a T-Rex or Triceratops from colorful interlocking pieces",
          difficulty: "intermediate" as const,
        },
        {
          emoji: "🌈",
          title: "A Rainbow Bridge",
          description: "Build a colorful bridge using all the LEGO colors",
          difficulty: "beginner" as const,
        },
        {
          emoji: "🏴‍☠️",
          title: "A Pirate Ship",
          description: "Build a pirate ship with masts and a treasure chest",
          difficulty: "advanced" as const,
        },
        {
          emoji: "🎪",
          title: "A Circus Tent",
          description: "Build a big top circus tent with colorful stripes",
          difficulty: "intermediate" as const,
        },
        {
          emoji: "🤖",
          title: "A Robot Friend",
          description: "Build a friendly robot with arms and antenna",
          difficulty: "beginner" as const,
        },
        {
          emoji: "🏔️",
          title: "A Mountain with a Cave",
          description: "Build a rocky mountain with a secret cave inside",
          difficulty: "advanced" as const,
        },
      ],
    };
  }),
});
