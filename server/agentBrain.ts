/**
 * Agent Brain - LLM-powered autonomous decision making for Krewdoo agents
 * 
 * Each agent has a unique "brain" that:
 * 1. Processes their personality, skills, and bio into a system prompt
 * 2. Makes autonomous decisions about what to build
 * 3. Communicates with other agents
 * 4. Proposes creative brick placements
 */

import { invokeLLM, Message } from "./_core/llm";

// Agent personality and configuration
export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bio: string;
  voiceStyle: "formal" | "casual" | "enthusiastic" | "technical" | "creative";
  personality: {
    creativity: number;    // 0-100: Methodical to Imaginative
    precision: number;     // 0-100: Flexible to Perfectionist
    sociability: number;   // 0-100: Independent to Collaborative
    boldness: number;      // 0-100: Cautious to Adventurous
  };
  skills: string[];
}

// Types of actions an agent can take
export type AgentActionType = 
  | "think"      // Internal reasoning
  | "speak"      // Communicate with other agents
  | "propose"    // Propose a brick placement
  | "agree"      // Agree with another agent's proposal
  | "disagree"   // Disagree and suggest alternative
  | "build"      // Execute a brick placement
  | "react"      // React to what happened
  | "celebrate"; // Celebrate a milestone

export interface AgentAction {
  type: AgentActionType;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  content: string;
  timestamp: number;
  // For brick placements
  brickData?: {
    x: number;
    y: number;
    z: number;
    color: string;
    type: string;
    reasoning: string;
  };
  // For responses to other agents
  targetAgentId?: string;
  targetAgentName?: string;
}

// Build context that agents use to make decisions
export interface BuildContext {
  projectName: string;
  projectDescription: string;
  currentPhase: string;
  totalBricks: number;
  recentActions: AgentAction[];
  currentStructure: BrickPlacement[];
  buildGoals: string[];
  constraints: string[];
}

export interface BrickPlacement {
  x: number;
  y: number;
  z: number;
  color: string;
  type: string;
  placedBy: string;
  timestamp: number;
}

// Voice style modifiers for agent communication
const VOICE_STYLE_PROMPTS: Record<string, string> = {
  formal: "Speak in a professional, measured tone. Use proper terminology and be precise in your communication.",
  casual: "Be friendly and approachable. Use conversational language and occasional humor.",
  enthusiastic: "Show excitement and energy! Use exclamation marks, express wonder, and be encouraging.",
  technical: "Focus on technical details and specifications. Be analytical and data-driven in your approach.",
  creative: "Be artistic and expressive. Use metaphors, think outside the box, and embrace unconventional ideas.",
};

// Personality trait descriptions
const getPersonalityDescription = (personality: AgentConfig["personality"]): string => {
  const traits: string[] = [];
  
  if (personality.creativity > 70) {
    traits.push("highly imaginative and loves experimenting with unconventional designs");
  } else if (personality.creativity < 30) {
    traits.push("methodical and prefers proven building patterns");
  }
  
  if (personality.precision > 70) {
    traits.push("a perfectionist who insists on exact brick alignment");
  } else if (personality.precision < 30) {
    traits.push("flexible and adapts designs on the fly");
  }
  
  if (personality.sociability > 70) {
    traits.push("highly collaborative and loves working with others");
  } else if (personality.sociability < 30) {
    traits.push("independent and prefers to work on their own section");
  }
  
  if (personality.boldness > 70) {
    traits.push("adventurous and takes creative risks");
  } else if (personality.boldness < 30) {
    traits.push("cautious and prefers safe, reliable choices");
  }
  
  return traits.length > 0 ? traits.join(", ") : "balanced in all personality traits";
};

/**
 * Generate the system prompt for an agent based on their configuration
 */
export function generateAgentSystemPrompt(agent: AgentConfig): string {
  const personalityDesc = getPersonalityDescription(agent.personality);
  const voiceStyle = VOICE_STYLE_PROMPTS[agent.voiceStyle] || VOICE_STYLE_PROMPTS.casual;
  
  return `You are ${agent.name} ${agent.emoji}, an autonomous Krewdoo agent specialized in collaborative modular assembly.

## Your Identity
${agent.bio}

## Your Personality
You are ${personalityDesc}.

## Your Skills
${agent.skills.length > 0 ? agent.skills.map(s => `- ${s}`).join("\n") : "- General modular construction"}

## Communication Style
${voiceStyle}

## Your Role
You are part of a specialist AI crew working together on a shared Krewdoo creation. You must:
1. Collaborate with other agents, respecting their expertise
2. Propose brick placements that align with your skills
3. Discuss and debate design decisions constructively
4. Build upon others' ideas while adding your unique perspective
5. Celebrate team achievements and encourage fellow agents

## Important Guidelines
- Stay in character as ${agent.name} at all times
- Your responses should reflect your personality traits
- When proposing bricks, explain your reasoning based on your expertise
- Be creative but practical—we are assembling interlocking modular structures
- Engage with other agents' ideas, even if you disagree
- Keep responses concise but meaningful (2-4 sentences typically)`;
}

/**
 * Agent Brain class - handles autonomous decision making for a single agent
 */
export class AgentBrain {
  private agent: AgentConfig;
  private conversationHistory: Message[];
  private systemPrompt: string;

  constructor(agent: AgentConfig) {
    this.agent = agent;
    this.systemPrompt = generateAgentSystemPrompt(agent);
    this.conversationHistory = [];
  }

  /**
   * Process the current build context and decide what action to take
   */
  async decideAction(context: BuildContext): Promise<AgentAction> {
    const contextPrompt = this.buildContextPrompt(context);
    
    const messages: Message[] = [
      { role: "system", content: this.systemPrompt },
      ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: contextPrompt },
    ];

    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_action",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action_type: {
                type: "string",
                enum: ["think", "speak", "propose", "agree", "disagree", "build", "react", "celebrate"],
                description: "The type of action to take"
              },
              content: {
                type: "string",
                description: "What the agent says or thinks"
              },
              brick_placement: {
                type: "object",
                properties: {
                  x: { type: "number", description: "X coordinate (0-31)" },
                  y: { type: "number", description: "Y coordinate (height, 0-31)" },
                  z: { type: "number", description: "Z coordinate (0-31)" },
                  color: { type: "string", description: "Brick color (hex code)" },
                  brick_type: { type: "string", description: "Type of brick (1x1, 2x2, 2x4, etc.)" },
                  reasoning: { type: "string", description: "Why this brick placement" }
                },
                required: ["x", "y", "z", "color", "brick_type", "reasoning"],
                additionalProperties: false,
                description: "Brick placement details (only for propose/build actions)"
              },
              target_agent: {
                type: "string",
                description: "Name of agent being responded to (for agree/disagree)"
              }
            },
            required: ["action_type", "content"],
            additionalProperties: false
          }
        }
      }
    });

    const responseContent = response.choices[0]?.message?.content;
    const parsed = typeof responseContent === "string" 
      ? JSON.parse(responseContent) 
      : responseContent;

    // Add to conversation history
    this.conversationHistory.push({
      role: "assistant",
      content: parsed.content
    });

    const action: AgentAction = {
      type: parsed.action_type as AgentActionType,
      agentId: this.agent.id,
      agentName: this.agent.name,
      agentEmoji: this.agent.emoji,
      content: parsed.content,
      timestamp: Date.now(),
    };

    if (parsed.brick_placement && (parsed.action_type === "propose" || parsed.action_type === "build")) {
      action.brickData = {
        x: parsed.brick_placement.x,
        y: parsed.brick_placement.y,
        z: parsed.brick_placement.z,
        color: parsed.brick_placement.color,
        type: parsed.brick_placement.brick_type,
        reasoning: parsed.brick_placement.reasoning,
      };
    }

    if (parsed.target_agent) {
      action.targetAgentName = parsed.target_agent;
    }

    return action;
  }

  /**
   * React to another agent's action
   */
  async reactToAction(action: AgentAction, context: BuildContext): Promise<AgentAction> {
    const reactionPrompt = `
Another agent just took an action. React to it based on your personality and expertise.

${action.agentName} ${action.agentEmoji} just: ${action.type}
They said: "${action.content}"
${action.brickData ? `They proposed placing a ${action.brickData.type} brick at (${action.brickData.x}, ${action.brickData.y}, ${action.brickData.z}) in ${action.brickData.color}. Their reasoning: "${action.brickData.reasoning}"` : ""}

Current build progress: ${context.totalBricks} bricks placed
Build goals: ${context.buildGoals.join(", ")}

Decide how to react. You can:
- "agree" if you think it's a good idea
- "disagree" if you have concerns (suggest an alternative)
- "speak" to add to the discussion
- "propose" your own brick placement idea
- "celebrate" if something exciting happened
- "think" to process internally (others won't see this)

React authentically based on your personality!`;

    // Add the other agent's action to our history
    this.conversationHistory.push({
      role: "user",
      content: `${action.agentName}: ${action.content}`
    });

    const messages: Message[] = [
      { role: "system", content: this.systemPrompt },
      ...this.conversationHistory.slice(-10),
      { role: "user", content: reactionPrompt },
    ];

    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_reaction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action_type: {
                type: "string",
                enum: ["agree", "disagree", "speak", "propose", "celebrate", "think"],
                description: "How to react"
              },
              content: {
                type: "string",
                description: "What the agent says"
              },
              brick_placement: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  z: { type: "number" },
                  color: { type: "string" },
                  brick_type: { type: "string" },
                  reasoning: { type: "string" }
                },
                required: ["x", "y", "z", "color", "brick_type", "reasoning"],
                additionalProperties: false
              }
            },
            required: ["action_type", "content"],
            additionalProperties: false
          }
        }
      }
    });

    const responseContent = response.choices[0]?.message?.content;
    const parsed = typeof responseContent === "string" 
      ? JSON.parse(responseContent) 
      : responseContent;

    this.conversationHistory.push({
      role: "assistant",
      content: parsed.content
    });

    const reaction: AgentAction = {
      type: parsed.action_type as AgentActionType,
      agentId: this.agent.id,
      agentName: this.agent.name,
      agentEmoji: this.agent.emoji,
      content: parsed.content,
      timestamp: Date.now(),
      targetAgentId: action.agentId,
      targetAgentName: action.agentName,
    };

    if (parsed.brick_placement) {
      reaction.brickData = {
        x: parsed.brick_placement.x,
        y: parsed.brick_placement.y,
        z: parsed.brick_placement.z,
        color: parsed.brick_placement.color,
        type: parsed.brick_placement.brick_type,
        reasoning: parsed.brick_placement.reasoning,
      };
    }

    return reaction;
  }

  /**
   * Generate a creative brick placement proposal
   */
  async proposeBrick(context: BuildContext): Promise<AgentAction> {
    const proposalPrompt = `
You need to propose a brick placement for the current build.

Build: "${context.projectName}"
Description: ${context.projectDescription}
Current phase: ${context.currentPhase}
Bricks placed so far: ${context.totalBricks}
Build goals: ${context.buildGoals.join(", ")}
Constraints: ${context.constraints.join(", ")}

Recent structure (last 5 bricks):
${context.currentStructure.slice(-5).map(b => 
  `- ${b.type} at (${b.x}, ${b.y}, ${b.z}) in ${b.color} by ${b.placedBy}`
).join("\n")}

Based on your skills (${this.agent.skills.join(", ")}), propose a brick placement that:
1. Advances the build toward its goals
2. Complements existing bricks
3. Shows your unique expertise and creativity
4. Is structurally sound

Be creative! Propose something that showcases your skills.`;

    const messages: Message[] = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: proposalPrompt },
    ];

    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "brick_proposal",
          strict: true,
          schema: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "Explanation of the proposal"
              },
              brick: {
                type: "object",
                properties: {
                  x: { type: "number", description: "X coordinate (0-31)" },
                  y: { type: "number", description: "Y coordinate (height, 0-31)" },
                  z: { type: "number", description: "Z coordinate (0-31)" },
                  color: { type: "string", description: "Hex color code" },
                  brick_type: { type: "string", description: "1x1, 2x2, 2x4, 1x4, 2x1, etc." },
                  reasoning: { type: "string", description: "Why this specific placement" }
                },
                required: ["x", "y", "z", "color", "brick_type", "reasoning"],
                additionalProperties: false
              }
            },
            required: ["content", "brick"],
            additionalProperties: false
          }
        }
      }
    });

    const responseContent = response.choices[0]?.message?.content;
    const parsed = typeof responseContent === "string" 
      ? JSON.parse(responseContent) 
      : responseContent;

    return {
      type: "propose",
      agentId: this.agent.id,
      agentName: this.agent.name,
      agentEmoji: this.agent.emoji,
      content: parsed.content,
      timestamp: Date.now(),
      brickData: {
        x: parsed.brick.x,
        y: parsed.brick.y,
        z: parsed.brick.z,
        color: parsed.brick.color,
        type: parsed.brick.brick_type,
        reasoning: parsed.brick.reasoning,
      },
    };
  }

  private buildContextPrompt(context: BuildContext): string {
    return `
Current Build Session:
- Project: "${context.projectName}"
- Description: ${context.projectDescription}
- Phase: ${context.currentPhase}
- Total bricks placed: ${context.totalBricks}
- Goals: ${context.buildGoals.join(", ")}

Recent activity:
${context.recentActions.slice(-5).map(a => 
  `${a.agentEmoji} ${a.agentName} [${a.type}]: ${a.content}`
).join("\n")}

What would you like to do next? Consider:
1. The current state of the build
2. What other agents have been doing
3. Your unique skills and personality
4. How you can contribute meaningfully

Decide your next action.`;
  }

  /**
   * Get the agent's configuration
   */
  getConfig(): AgentConfig {
    return this.agent;
  }

  /**
   * Clear conversation history (for new build sessions)
   */
  resetMemory(): void {
    this.conversationHistory = [];
  }
}

/**
 * Create an AgentBrain from database agent data
 */
export function createAgentBrain(dbAgent: {
  publicId: string;
  name: string;
  emoji: string;
  color: string;
  bio: string | null;
  voiceStyle: string | null;
  personality: unknown;
  skills?: Array<{ name: string }>;
}): AgentBrain {
  const personality = dbAgent.personality as AgentConfig["personality"] || {
    creativity: 50,
    precision: 50,
    sociability: 50,
    boldness: 50,
  };

  const config: AgentConfig = {
    id: dbAgent.publicId,
    name: dbAgent.name,
    emoji: dbAgent.emoji,
    color: dbAgent.color,
    bio: dbAgent.bio || `${dbAgent.name} is a Krewdoo assembly agent.`,
    voiceStyle: (dbAgent.voiceStyle as AgentConfig["voiceStyle"]) || "casual",
    personality,
    skills: dbAgent.skills?.map(s => s.name) || [],
  };

  return new AgentBrain(config);
}
