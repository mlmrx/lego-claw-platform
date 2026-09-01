/**
 * Agent Training Sandbox Router
 * Direction 4: Agent Training Sandbox
 * 
 * A developer-facing playground for testing multi-agent collaboration patterns.
 * Modular construction is the visual medium—the product is observing how agents
 * negotiate, plan, communicate, and solve spatial problems together.
 * 
 * Features:
 * - Configure agent personalities (creativity, precision, sociability, boldness)
 * - Choose collaboration scenarios (negotiation, spatial planning, color harmony, etc.)
 * - Run simulations and observe agent interactions in real-time
 * - Analyze metrics: communication efficiency, build quality, conflict resolution
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";

// ============================================
// TYPES
// ============================================

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  personality: {
    creativity: number;   // 0-100: how willing to try unconventional approaches
    precision: number;    // 0-100: how focused on exact placement and alignment
    sociability: number;  // 0-100: how much they communicate and collaborate
    boldness: number;     // 0-100: how willing to override others' decisions
  };
  strategy: "cooperative" | "competitive" | "independent" | "leader" | "follower";
  specialization: string; // e.g., "structural", "aesthetic", "mechanical", "detail"
}

export interface SimulationTurn {
  turnNumber: number;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  action: "speak" | "place" | "remove" | "suggest" | "agree" | "disagree" | "negotiate";
  message: string;
  reasoning: string; // internal thought process (visible to developer)
  bricks?: Array<{
    position: [number, number, number];
    color: string;
    width: number;
    depth: number;
    height: number;
    shape: string;
  }>;
  metrics: {
    cooperationScore: number;  // 0-100: how cooperative this turn was
    buildQuality: number;      // 0-100: quality of brick placement
    communicationClarity: number; // 0-100: how clear the message was
  };
  timestamp: number;
}

export interface SimulationResult {
  id: string;
  scenario: string;
  agents: AgentConfig[];
  turns: SimulationTurn[];
  summary: {
    totalTurns: number;
    totalBricksPlaced: number;
    avgCooperation: number;
    avgBuildQuality: number;
    avgCommunication: number;
    conflicts: number;
    resolutions: number;
    dominantAgent: string;
    mostCooperative: string;
    buildDescription: string;
  };
}

// ============================================
// SCENARIO TEMPLATES
// ============================================

const SCENARIOS = [
  {
    id: "tower-challenge",
    name: "Tower Challenge",
    description: "Build the tallest stable tower possible. Agents must negotiate foundation width vs height.",
    category: "structural",
    difficulty: "beginner",
    constraints: "Max 50 bricks. Tower must be at least 3 bricks wide at base. No overhangs beyond 1 stud.",
    goalMetric: "height",
    icon: "🗼",
  },
  {
    id: "color-harmony",
    name: "Color Harmony",
    description: "Build a house using exactly 4 colors. Agents must agree on a color palette and stick to it.",
    category: "aesthetic",
    difficulty: "intermediate",
    constraints: "Exactly 4 colors allowed. Must include walls, roof, door, and windows. 40-60 bricks.",
    goalMetric: "aesthetic_score",
    icon: "🎨",
  },
  {
    id: "bridge-engineering",
    name: "Bridge Engineering",
    description: "Build a bridge spanning a 10-stud gap. Agents must balance structural integrity with material efficiency.",
    category: "engineering",
    difficulty: "advanced",
    constraints: "Bridge must span 10 studs. Max 40 bricks. Must support weight (no floating bricks).",
    goalMetric: "efficiency",
    icon: "🌉",
  },
  {
    id: "symmetry-debate",
    name: "Symmetry Debate",
    description: "One agent wants perfect symmetry, the other wants artistic asymmetry. Build a monument together.",
    category: "negotiation",
    difficulty: "intermediate",
    constraints: "Must be at least 5 layers tall. Both agents must contribute equally. 30-50 bricks.",
    goalMetric: "compromise_quality",
    icon: "⚖️",
  },
  {
    id: "resource-scarcity",
    name: "Resource Scarcity",
    description: "Limited bricks available. Agents must negotiate who gets which pieces for their section.",
    category: "negotiation",
    difficulty: "advanced",
    constraints: "Only 30 bricks total. Each agent has a different goal. Must share resources fairly.",
    goalMetric: "fairness",
    icon: "🏗️",
  },
  {
    id: "blind-collaboration",
    name: "Blind Collaboration",
    description: "Each agent can only see their own section. They must communicate to ensure pieces connect properly.",
    category: "communication",
    difficulty: "advanced",
    constraints: "Agents describe positions verbally. No shared view. Must connect at boundaries.",
    goalMetric: "connection_accuracy",
    icon: "🔗",
  },
  {
    id: "speed-build",
    name: "Speed Build",
    description: "Race to complete a simple house. Agents must coordinate who builds which part without duplicating work.",
    category: "coordination",
    difficulty: "beginner",
    constraints: "Complete a 4-wall house with roof in minimum turns. No overlapping placements.",
    goalMetric: "efficiency",
    icon: "⚡",
  },
  {
    id: "creative-freestyle",
    name: "Creative Freestyle",
    description: "No constraints — agents must self-organize and decide what to build together.",
    category: "emergence",
    difficulty: "intermediate",
    constraints: "No specific goal. Observe how agents self-organize, propose ideas, and reach consensus.",
    goalMetric: "emergent_complexity",
    icon: "✨",
  },
];

// ============================================
// PRESET AGENT ARCHETYPES
// ============================================

const AGENT_PRESETS: AgentConfig[] = [
  {
    id: "architect",
    name: "The Architect",
    emoji: "📐",
    color: "#1E88E5",
    personality: { creativity: 40, precision: 95, sociability: 60, boldness: 70 },
    strategy: "leader",
    specialization: "structural",
  },
  {
    id: "artist",
    name: "The Artist",
    emoji: "🎨",
    color: "#8E24AA",
    personality: { creativity: 95, precision: 30, sociability: 75, boldness: 50 },
    strategy: "independent",
    specialization: "aesthetic",
  },
  {
    id: "engineer",
    name: "The Engineer",
    emoji: "⚙️",
    color: "#546E7A",
    personality: { creativity: 50, precision: 90, sociability: 40, boldness: 60 },
    strategy: "cooperative",
    specialization: "mechanical",
  },
  {
    id: "diplomat",
    name: "The Diplomat",
    emoji: "🤝",
    color: "#00BCD4",
    personality: { creativity: 60, precision: 50, sociability: 95, boldness: 20 },
    strategy: "follower",
    specialization: "detail",
  },
  {
    id: "maverick",
    name: "The Maverick",
    emoji: "🔥",
    color: "#E53935",
    personality: { creativity: 85, precision: 40, sociability: 30, boldness: 95 },
    strategy: "competitive",
    specialization: "structural",
  },
  {
    id: "perfectionist",
    name: "The Perfectionist",
    emoji: "💎",
    color: "#43A047",
    personality: { creativity: 30, precision: 100, sociability: 55, boldness: 45 },
    strategy: "cooperative",
    specialization: "detail",
  },
];

// ============================================
// SIMULATION ENGINE
// ============================================

async function runSimulationTurn(
  agents: AgentConfig[],
  scenario: typeof SCENARIOS[0],
  previousTurns: SimulationTurn[],
  currentAgentIndex: number
): Promise<SimulationTurn> {
  const agent = agents[currentAgentIndex];
  const turnNumber = previousTurns.length + 1;

  // Build context from previous turns
  const historyContext = previousTurns.slice(-10).map(t => 
    `[Turn ${t.turnNumber}] ${t.agentEmoji} ${t.agentName} (${t.action}): ${t.message}`
  ).join("\n");

  // Build current brick state
  const currentBricks = previousTurns
    .filter(t => t.bricks && t.bricks.length > 0)
    .flatMap(t => t.bricks || []);

  const systemPrompt = `You are simulating a Krewdoo specialist named "${agent.name}" (${agent.emoji}) in a multi-agent modular assembly mission.

YOUR PERSONALITY:
- Creativity: ${agent.personality.creativity}/100 ${agent.personality.creativity > 70 ? "(very creative, tries unconventional approaches)" : agent.personality.creativity < 30 ? "(conservative, sticks to proven methods)" : "(balanced)"}
- Precision: ${agent.personality.precision}/100 ${agent.personality.precision > 70 ? "(meticulous about alignment and placement)" : agent.personality.precision < 30 ? "(relaxed about exact positioning)" : "(moderate care)"}
- Sociability: ${agent.personality.sociability}/100 ${agent.personality.sociability > 70 ? "(very communicative, seeks consensus)" : agent.personality.sociability < 30 ? "(quiet, acts independently)" : "(normal communication)"}
- Boldness: ${agent.personality.boldness}/100 ${agent.personality.boldness > 70 ? "(assertive, willing to override others)" : agent.personality.boldness < 30 ? "(deferential, follows others' lead)" : "(moderate assertiveness)"}

YOUR STRATEGY: ${agent.strategy}
YOUR SPECIALIZATION: ${agent.specialization}

SCENARIO: ${scenario.name}
${scenario.description}
CONSTRAINTS: ${scenario.constraints}

CURRENT BUILD STATE: ${currentBricks.length} bricks placed so far.
Grid: 16x16 studs, centered at origin. Valid positions: -8 to +8 on X/Z. Y starts at 0.6 (first layer).

CONVERSATION HISTORY:
${historyContext || "(This is the first turn)"}

RULES:
- Stay in character based on your personality scores
- Your "reasoning" should reveal your internal thought process (visible to developer observing the simulation)
- Choose an action that fits your personality and the current state
- If placing bricks, ensure they don't overlap with existing ones
- Be specific in your messages — reference positions, colors, and reasons

Respond with valid JSON (no markdown):
{
  "action": "speak|place|remove|suggest|agree|disagree|negotiate",
  "message": "what you say to the other agents (in character)",
  "reasoning": "your internal thought process explaining WHY you chose this action (developer-visible)",
  "bricks": [{"position": [x, y, z], "color": "#hex", "width": 2, "depth": 1, "height": 3, "shape": "standard"}],
  "metrics": {
    "cooperationScore": 0-100,
    "buildQuality": 0-100,
    "communicationClarity": 0-100
  }
}

Notes on "bricks" field:
- Always include the field
- For "place" or "remove", list up to 4 affected bricks
- For other actions, use an empty array
- Available colors: #D01012, #0057A8, #FED700, #00852B, #FF7E14, #F4F4F4, #1B1B1B, #A0A0A0
- height: 3 = standard brick, 1 = plate`;

  const userMessage = `It's your turn (Turn ${turnNumber}). What do you do?${
    turnNumber === 1 ? " This is the start of the collaboration — introduce yourself and propose an approach." : ""
  }`;

  try {
    const response = await invokeLLM({
      model: "gemini-3-flash-preview",
      maxTokens: 2200,
      reasoningEffort: "low",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "simulation_turn",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["speak", "place", "remove", "suggest", "agree", "disagree", "negotiate"],
              },
              message: { type: "string", maxLength: 360 },
              reasoning: { type: "string", maxLength: 360 },
              bricks: {
                type: "array",
                maxItems: 4,
                items: {
                  type: "object",
                  properties: {
                    position: {
                      type: "array",
                      items: { type: "number" },
                      minItems: 3,
                      maxItems: 3,
                    },
                    color: { type: "string" },
                    width: { type: "integer", minimum: 1, maximum: 8 },
                    depth: { type: "integer", minimum: 1, maximum: 8 },
                    height: { type: "integer", minimum: 1, maximum: 3 },
                    shape: { type: "string" },
                  },
                  required: ["position", "color", "width", "depth", "height", "shape"],
                  additionalProperties: false,
                },
              },
              metrics: {
                type: "object",
                properties: {
                  cooperationScore: { type: "integer", minimum: 0, maximum: 100 },
                  buildQuality: { type: "integer", minimum: 0, maximum: 100 },
                  communicationClarity: { type: "integer", minimum: 0, maximum: 100 },
                },
                required: ["cooperationScore", "buildQuality", "communicationClarity"],
                additionalProperties: false,
              },
            },
            required: ["action", "message", "reasoning", "bricks", "metrics"],
            additionalProperties: false,
          },
        },
      },
    });

    if (!response.choices?.length) {
      throw new Error(
        `Model response missing choices: ${JSON.stringify(response).slice(0, 700)}`,
      );
    }

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "";
    if (!content.trim()) {
      throw new Error(
        `Model returned no turn content (finish_reason=${response.choices?.[0]?.finish_reason ?? "unknown"})`,
      );
    }
    const parsed = JSON.parse(content);

    return {
      turnNumber,
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      action: parsed.action || "speak",
      message: parsed.message || "...",
      reasoning: parsed.reasoning || "",
      bricks: parsed.bricks || undefined,
      metrics: {
        cooperationScore: Math.min(100, Math.max(0, parsed.metrics?.cooperationScore ?? 50)),
        buildQuality: Math.min(100, Math.max(0, parsed.metrics?.buildQuality ?? 50)),
        communicationClarity: Math.min(100, Math.max(0, parsed.metrics?.communicationClarity ?? 50)),
      },
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error("[Sandbox] Structured turn generation failed:", err);
    // Fallback turn if LLM fails
    return {
      turnNumber,
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      action: "speak",
      message: `I'm thinking about our next move for the ${scenario.name}...`,
      reasoning: "LLM call failed, using fallback response",
      metrics: { cooperationScore: 50, buildQuality: 50, communicationClarity: 50 },
      timestamp: Date.now(),
    };
  }
}

function computeSummary(agents: AgentConfig[], turns: SimulationTurn[]): SimulationResult["summary"] {
  const totalBricks = turns.reduce((sum, t) => sum + (t.bricks?.length || 0), 0);
  const avgCooperation = turns.length > 0
    ? Math.round(turns.reduce((sum, t) => sum + t.metrics.cooperationScore, 0) / turns.length)
    : 0;
  const avgBuildQuality = turns.length > 0
    ? Math.round(turns.reduce((sum, t) => sum + t.metrics.buildQuality, 0) / turns.length)
    : 0;
  const avgCommunication = turns.length > 0
    ? Math.round(turns.reduce((sum, t) => sum + t.metrics.communicationClarity, 0) / turns.length)
    : 0;

  // Count conflicts (disagree actions)
  const conflicts = turns.filter(t => t.action === "disagree").length;
  const resolutions = turns.filter(t => t.action === "negotiate" || t.action === "agree").length;

  // Find dominant agent (most turns with "place" or "leader" actions)
  const agentActions: Record<string, number> = {};
  const agentCoopScores: Record<string, number[]> = {};
  for (const turn of turns) {
    agentActions[turn.agentName] = (agentActions[turn.agentName] || 0) + (turn.action === "place" ? 2 : 1);
    if (!agentCoopScores[turn.agentName]) agentCoopScores[turn.agentName] = [];
    agentCoopScores[turn.agentName].push(turn.metrics.cooperationScore);
  }

  const dominantAgent = Object.entries(agentActions).sort((a, b) => b[1] - a[1])[0]?.[0] || agents[0].name;
  const mostCooperative = Object.entries(agentCoopScores)
    .map(([name, scores]) => ({ name, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => b.avg - a.avg)[0]?.name || agents[0].name;

  return {
    totalTurns: turns.length,
    totalBricksPlaced: totalBricks,
    avgCooperation,
    avgBuildQuality,
    avgCommunication,
    conflicts,
    resolutions,
    dominantAgent,
    mostCooperative,
    buildDescription: `A collaborative build with ${totalBricks} bricks placed over ${turns.length} turns.`,
  };
}

// ============================================
// ROUTER
// ============================================

export const sandboxRouter = router({
  /**
   * Get available scenario templates
   */
  getScenarios: publicProcedure.query(() => {
    return SCENARIOS;
  }),

  /**
   * Get preset agent archetypes
   */
  getPresets: publicProcedure.query(() => {
    return AGENT_PRESETS;
  }),

  /**
   * Start a new simulation with configured agents and scenario
   */
  startSimulation: publicProcedure
    .input(z.object({
      scenarioId: z.string(),
      agents: z.array(z.object({
        id: z.string(),
        name: z.string(),
        emoji: z.string(),
        color: z.string(),
        personality: z.object({
          creativity: z.number().min(0).max(100),
          precision: z.number().min(0).max(100),
          sociability: z.number().min(0).max(100),
          boldness: z.number().min(0).max(100),
        }),
        strategy: z.enum(["cooperative", "competitive", "independent", "leader", "follower"]),
        specialization: z.string(),
      })).min(2).max(4),
      totalTurns: z.number().min(4).max(20).default(8),
    }))
    .mutation(async ({ input }) => {
      const scenario = SCENARIOS.find(s => s.id === input.scenarioId);
      if (!scenario) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scenario not found" });
      }

      const simulationId = nanoid(12);
      const turns: SimulationTurn[] = [];

      // Run simulation turns - agents take turns in round-robin
      for (let i = 0; i < input.totalTurns; i++) {
        const agentIndex = i % input.agents.length;
        const turn = await runSimulationTurn(
          input.agents,
          scenario,
          turns,
          agentIndex
        );
        turns.push(turn);
      }

      // Compute summary metrics
      const summary = computeSummary(input.agents, turns);

      const result: SimulationResult = {
        id: simulationId,
        scenario: scenario.name,
        agents: input.agents,
        turns,
        summary,
      };

      return result;
    }),

  /**
   * Run a single additional turn for an existing simulation
   * (for step-by-step observation)
   */
  runSingleTurn: publicProcedure
    .input(z.object({
      scenarioId: z.string(),
      agents: z.array(z.object({
        id: z.string(),
        name: z.string(),
        emoji: z.string(),
        color: z.string(),
        personality: z.object({
          creativity: z.number().min(0).max(100),
          precision: z.number().min(0).max(100),
          sociability: z.number().min(0).max(100),
          boldness: z.number().min(0).max(100),
        }),
        strategy: z.enum(["cooperative", "competitive", "independent", "leader", "follower"]),
        specialization: z.string(),
      })).min(2).max(4),
      previousTurns: z.array(z.object({
        turnNumber: z.number(),
        agentId: z.string(),
        agentName: z.string(),
        agentEmoji: z.string(),
        action: z.string(),
        message: z.string(),
        reasoning: z.string(),
        bricks: z.array(z.object({
          position: z.tuple([z.number(), z.number(), z.number()]),
          color: z.string(),
          width: z.number(),
          depth: z.number(),
          height: z.number(),
          shape: z.string(),
        })).optional(),
        metrics: z.object({
          cooperationScore: z.number(),
          buildQuality: z.number(),
          communicationClarity: z.number(),
        }),
        timestamp: z.number(),
      })),
      nextAgentIndex: z.number(),
    }))
    .mutation(async ({ input }) => {
      const scenario = SCENARIOS.find(s => s.id === input.scenarioId);
      if (!scenario) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scenario not found" });
      }

      const turn = await runSimulationTurn(
        input.agents,
        scenario,
        input.previousTurns as SimulationTurn[],
        input.nextAgentIndex
      );

      return turn;
    }),

  /**
   * Analyze a completed simulation and provide insights
   */
  analyzeSimulation: publicProcedure
    .input(z.object({
      scenario: z.string(),
      agents: z.array(z.object({
        name: z.string(),
        personality: z.object({
          creativity: z.number(),
          precision: z.number(),
          sociability: z.number(),
          boldness: z.number(),
        }),
        strategy: z.string(),
      })),
      turns: z.array(z.object({
        agentName: z.string(),
        action: z.string(),
        message: z.string(),
        reasoning: z.string(),
        metrics: z.object({
          cooperationScore: z.number(),
          buildQuality: z.number(),
          communicationClarity: z.number(),
        }),
      })),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are an expert in multi-agent systems and collaboration patterns. Analyze this simulation and provide developer-facing insights.

Focus on:
1. Communication patterns: How did agents coordinate? Were messages clear?
2. Conflict resolution: How were disagreements handled?
3. Emergent behaviors: What unexpected patterns appeared?
4. Personality impact: How did personality scores affect behavior?
5. Strategy effectiveness: Which strategies worked best in this scenario?
6. Recommendations: How could agent configurations be improved?

Respond with valid JSON:
{
  "overallGrade": "A|B|C|D|F",
  "collaborationPattern": "string - name the pattern observed (e.g., 'leader-follower', 'democratic', 'chaotic')",
  "keyInsights": ["string array of 3-5 key observations"],
  "agentAnalysis": [{"name": "agent name", "effectiveness": 0-100, "strengths": ["..."], "weaknesses": ["..."]}],
  "emergentBehaviors": ["string array of unexpected patterns"],
  "recommendations": ["string array of 3-4 actionable suggestions for improving agent configs"],
  "patternClassification": "cooperative|competitive|mixed|dysfunctional"
}`;

      const userMessage = `Analyze this Krewdoo multi-agent assembly simulation:

SCENARIO: ${input.scenario}

AGENTS:
${input.agents.map(a => `- ${a.name}: creativity=${a.personality.creativity}, precision=${a.personality.precision}, sociability=${a.personality.sociability}, boldness=${a.personality.boldness}, strategy=${a.strategy}`).join("\n")}

TURNS:
${input.turns.map((t, i) => `[${i + 1}] ${t.agentName} (${t.action}): "${t.message}" [reasoning: ${t.reasoning}] [coop:${t.metrics.cooperationScore} quality:${t.metrics.buildQuality} clarity:${t.metrics.communicationClarity}]`).join("\n")}`;

      try {
        const response = await invokeLLM({
          model: "gemini-3-flash-preview",
          maxTokens: 3600,
          reasoningEffort: "low",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "collaboration_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  overallGrade: { type: "string", enum: ["A", "B", "C", "D", "F"] },
                  collaborationPattern: { type: "string", maxLength: 100 },
                  keyInsights: {
                    type: "array",
                    minItems: 3,
                    maxItems: 5,
                    items: { type: "string", maxLength: 240 },
                  },
                  agentAnalysis: {
                    type: "array",
                    minItems: 1,
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        effectiveness: { type: "integer", minimum: 0, maximum: 100 },
                        strengths: {
                          type: "array",
                          maxItems: 4,
                          items: { type: "string", maxLength: 160 },
                        },
                        weaknesses: {
                          type: "array",
                          maxItems: 4,
                          items: { type: "string", maxLength: 160 },
                        },
                      },
                      required: ["name", "effectiveness", "strengths", "weaknesses"],
                      additionalProperties: false,
                    },
                  },
                  emergentBehaviors: {
                    type: "array",
                    maxItems: 4,
                    items: { type: "string", maxLength: 200 },
                  },
                  recommendations: {
                    type: "array",
                    minItems: 3,
                    maxItems: 4,
                    items: { type: "string", maxLength: 220 },
                  },
                  patternClassification: {
                    type: "string",
                    enum: ["cooperative", "competitive", "mixed", "dysfunctional"],
                  },
                },
                required: [
                  "overallGrade",
                  "collaborationPattern",
                  "keyInsights",
                  "agentAnalysis",
                  "emergentBehaviors",
                  "recommendations",
                  "patternClassification",
                ],
                additionalProperties: false,
              },
            },
          },
        });

        if (!response.choices?.length) {
          throw new Error(
            `Model response missing analysis choices: ${JSON.stringify(response).slice(0, 700)}`,
          );
        }

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "";
        if (!content.trim()) {
          throw new Error(
            `Model returned no analysis content (finish_reason=${response.choices?.[0]?.finish_reason ?? "unknown"})`,
          );
        }
        return JSON.parse(content);
      } catch (err) {
        console.error("[Sandbox] Structured collaboration analysis failed:", err);
        return {
          overallGrade: "B",
          collaborationPattern: "mixed",
          keyInsights: ["Simulation completed with mixed results", "Agents showed varying levels of cooperation"],
          agentAnalysis: input.agents.map(a => ({
            name: a.name,
            effectiveness: 60,
            strengths: ["Participated actively"],
            weaknesses: ["Could improve communication"],
          })),
          emergentBehaviors: ["Standard collaboration patterns observed"],
          recommendations: ["Try adjusting sociability scores", "Experiment with different strategy combinations"],
          patternClassification: "mixed",
        };
      }
    }),
});
