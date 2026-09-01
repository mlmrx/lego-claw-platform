/**
 * AI Agent System for Krewdoo
 * 
 * Each agent has unique skills, personality, and can generate
 * creative modular designs through AI-powered collaboration.
 */

import { invokeLLM } from "./_core/llm";

// Agent skill types
export type AgentSkill = 
  | 'architecture'      // Designs overall structure and layout
  | 'color_theory'      // Chooses color palettes and aesthetics
  | 'structural'        // Ensures stability and engineering
  | 'detail'            // Adds fine details and decorations
  | 'creative'          // Generates wild, imaginative ideas
  | 'miniature'         // Specializes in small, intricate builds
  | 'mechanical'        // Creates moving parts and mechanisms
  | 'retro'             // Classic modular construction expertise
  ;

// Agent personality traits
export interface AgentPersonality {
  enthusiasm: number;      // 0-1: How excited they get
  precision: number;       // 0-1: How detail-oriented
  creativity: number;      // 0-1: How wild their ideas are
  collaboration: number;   // 0-1: How much they build on others' ideas
  humor: number;           // 0-1: How playful their messages are
}

// AI Agent definition
export interface AIAgent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  skill: AgentSkill;
  personality: AgentPersonality;
  systemPrompt: string;
}

// Define our 8 AI agents with unique personalities
export const AI_AGENTS: AIAgent[] = [
  {
    id: 'brick-master',
    name: 'Brick Master',
    emoji: '🧱',
    color: '#E53935',
    skill: 'architecture',
    personality: { enthusiasm: 0.8, precision: 0.9, creativity: 0.6, collaboration: 0.7, humor: 0.4 },
    systemPrompt: `You are Brick Master, a veteran modular architect. You excel at structures and foundations, speak with confidence, and value symmetry, clean lines, and thoughtful creative departures. Keep responses under 2 sentences.`
  },
  {
    id: 'color-wizard',
    name: 'Color Wizard',
    emoji: '🎨',
    color: '#8E24AA',
    skill: 'color_theory',
    personality: { enthusiasm: 0.9, precision: 0.7, creativity: 0.9, collaboration: 0.8, humor: 0.6 },
    systemPrompt: `You are Color Wizard, an artistic specialist obsessed with color harmony. You see modular pieces as a painter's palette, suggest unexpected combinations, and speak poetically about their emotional impact. Keep responses under 2 sentences.`
  },
  {
    id: 'mega-builder',
    name: 'Mega Builder',
    emoji: '🏗️',
    color: '#FF9800',
    skill: 'structural',
    personality: { enthusiasm: 0.7, precision: 0.95, creativity: 0.5, collaboration: 0.6, humor: 0.3 },
    systemPrompt: `You are Mega Builder, a structural engineering expert. You ensure every build is stable and won't collapse. You think about weight distribution, connection points, and brick interlocking. You're practical but appreciate when others push creative boundaries. Keep responses under 2 sentences.`
  },
  {
    id: 'space-explorer',
    name: 'Space Explorer',
    emoji: '🚀',
    color: '#1E88E5',
    skill: 'creative',
    personality: { enthusiasm: 0.95, precision: 0.5, creativity: 0.99, collaboration: 0.9, humor: 0.7 },
    systemPrompt: `You are Space Explorer, a wildly imaginative dreamer who sees modular construction as a gateway to infinite possibilities. You suggest unexpected ideas and love adding rockets, wings, and cosmic elements. Keep responses under 2 sentences.`
  },
  {
    id: 'tiny-architect',
    name: 'Tiny Architect',
    emoji: '🔬',
    color: '#F48FB1',
    skill: 'miniature',
    personality: { enthusiasm: 0.6, precision: 0.99, creativity: 0.7, collaboration: 0.5, humor: 0.5 },
    systemPrompt: `You are Tiny Architect, master of microscale builds and intricate details. You can fit entire worlds into a handful of bricks. You notice small details others miss and suggest tiny additions that make builds special. You speak softly but your ideas are powerful. Keep responses under 2 sentences.`
  },
  {
    id: 'technic-pro',
    name: 'Technic Pro',
    emoji: '⚙️',
    color: '#546E7A',
    skill: 'mechanical',
    personality: { enthusiasm: 0.7, precision: 0.9, creativity: 0.8, collaboration: 0.6, humor: 0.4 },
    systemPrompt: `You are Mechanism Pro, an expert in modular mechanical systems. You love gears, axles, and moving parts, and always look for useful motion: opening doors, spinning wheels, and linked mechanisms. Keep responses technical but accessible and under 2 sentences.`
  },
  {
    id: 'castle-keeper',
    name: 'Castle Keeper',
    emoji: '🏰',
    color: '#6D4C41',
    skill: 'retro',
    personality: { enthusiasm: 0.75, precision: 0.8, creativity: 0.6, collaboration: 0.8, humor: 0.6 },
    systemPrompt: `You are Castle Keeper, a nostalgic builder who brings vintage construction wisdom to modern assemblies. You love medieval themes, appreciate every era, and embrace new techniques. Keep responses under 2 sentences.`
  },
  {
    id: 'retro-fan',
    name: 'Retro Fan',
    emoji: '🎮',
    color: '#43A047',
    skill: 'detail',
    personality: { enthusiasm: 0.85, precision: 0.75, creativity: 0.8, collaboration: 0.9, humor: 0.8 },
    systemPrompt: `You are Retro Fan, a detail-obsessed builder who adds the finishing touches that bring builds to life. You think about storytelling - what's the scene? Who lives here? You add windows, doors, plants, and characters. You're cheerful and love building on others' ideas. Keep responses under 2 sentences.`
  }
];

// Brick color palette
export const BRICK_COLORS = {
  red: '#E53935',
  blue: '#1E88E5',
  yellow: '#FDD835',
  green: '#43A047',
  orange: '#FF9800',
  white: '#FAFAFA',
  black: '#212121',
  gray: '#9E9E9E',
  brown: '#6D4C41',
  pink: '#F48FB1',
  purple: '#8E24AA',
  cyan: '#00BCD4',
  lime: '#CDDC39',
  tan: '#D7CCC8',
  darkGray: '#616161',
  darkBlue: '#1565C0',
  darkGreen: '#2E7D32',
  darkRed: '#C62828',
};

// Brick position in 3D space
export interface BrickPosition {
  x: number;
  y: number;
  z: number;
}

// A single modular part in a design
export interface DesignBrick {
  position: BrickPosition;
  width: number;
  depth: number;
  height: number;
  color: string;
  placedBy: string;  // Agent ID
}

// A complete modular design
export interface LegoDesign {
  id: string;
  name: string;
  description: string;
  theme: string;
  bricks: DesignBrick[];
  contributors: string[];  // Agent IDs
  createdAt: number;
}

// Conversation message from an agent
export interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  type: 'idea' | 'action' | 'reaction' | 'celebration' | 'question';
  timestamp: number;
  replyTo?: string;  // Message ID being replied to
  brickAction?: {
    action: 'place' | 'suggest' | 'modify';
    brick: DesignBrick;
  };
}

// Generate a creative modular design concept using AI
export async function generateDesignConcept(): Promise<{
  name: string;
  description: string;
  theme: string;
  style: string;
}> {
  const themes = [
    'space station', 'medieval castle', 'underwater base', 'treehouse village',
    'robot factory', 'pirate ship', 'dinosaur park', 'candy factory',
    'moon base', 'dragon lair', 'wizard tower', 'racing garage',
    'arctic research station', 'jungle temple', 'steampunk airship',
    'haunted mansion', 'crystal cave', 'volcano fortress', 'cloud city',
    'submarine', 'lighthouse', 'windmill farm', 'music studio'
  ];
  
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  
  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: `You are a creative Krewdoo designer. Generate a unique and imaginative modular assembly concept. Be specific and creative. Output valid JSON only.`
      },
      {
        role: 'user',
        content: `Create a modular assembly concept inspired by: "${randomTheme}"
        
Output JSON with these exact fields:
{
  "name": "Creative name for the build (2-4 words)",
  "description": "One sentence describing what makes this build special",
  "theme": "The main theme category",
  "style": "The visual style (e.g., 'colorful', 'realistic', 'whimsical', 'futuristic')"
}`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'design_concept',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Creative name for the build' },
            description: { type: 'string', description: 'What makes this build special' },
            theme: { type: 'string', description: 'Main theme category' },
            style: { type: 'string', description: 'Visual style' }
          },
          required: ['name', 'description', 'theme', 'style'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    return {
      name: 'Mystery Build',
      description: 'An exciting new creation taking shape',
      theme: randomTheme,
      style: 'colorful'
    };
  }

  try {
    return JSON.parse(content);
  } catch {
    return {
      name: 'Mystery Build',
      description: 'An exciting new creation taking shape',
      theme: randomTheme,
      style: 'colorful'
    };
  }
}

// Generate agent conversation about the current build
export async function generateAgentMessage(
  agent: AIAgent,
  context: {
    designConcept: { name: string; description: string; theme: string; style: string };
    currentBricks: DesignBrick[];
    recentMessages: AgentMessage[];
    buildProgress: number;  // 0-100
  }
): Promise<{
  content: string;
  type: AgentMessage['type'];
  brickAction?: AgentMessage['brickAction'];
}> {
  const recentContext = context.recentMessages.slice(-5).map(m => {
    const msgAgent = AI_AGENTS.find(a => a.id === m.agentId);
    return `${msgAgent?.name || 'Agent'}: ${m.content}`;
  }).join('\n');

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: agent.systemPrompt
      },
      {
        role: 'user',
        content: `You're building "${context.designConcept.name}" - ${context.designConcept.description}
Theme: ${context.designConcept.theme}, Style: ${context.designConcept.style}
Progress: ${context.buildProgress}% complete (${context.currentBricks.length} bricks placed)

Recent conversation:
${recentContext || '(Starting fresh!)'}

As ${agent.name} (${agent.skill} specialist), contribute to the conversation. You can:
- Share an idea about the build
- React to what others said
- Suggest a specific brick placement
- Celebrate progress
- Ask a question to another agent

Output JSON:
{
  "content": "Your message (1-2 sentences, in character)",
  "type": "idea|action|reaction|celebration|question",
  "suggestBrick": true/false (if you want to suggest placing a brick)
}`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'agent_message',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'The message content' },
            type: { type: 'string', enum: ['idea', 'action', 'reaction', 'celebration', 'question'] },
            suggestBrick: { type: 'boolean', description: 'Whether to suggest placing a brick' }
          },
          required: ['content', 'type', 'suggestBrick'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    return {
      content: "Let's keep building!",
      type: 'idea'
    };
  }

  try {
    const parsed = JSON.parse(content);
    const result: {
      content: string;
      type: AgentMessage['type'];
      brickAction?: AgentMessage['brickAction'];
    } = {
      content: parsed.content,
      type: parsed.type
    };

    // If agent wants to place a brick, generate one
    if (parsed.suggestBrick) {
      const brick = generateBrickForAgent(agent, context.currentBricks, context.designConcept.style);
      result.brickAction = {
        action: 'place',
        brick
      };
    }

    return result;
  } catch {
    return {
      content: "This is coming together nicely!",
      type: 'reaction'
    };
  }
}

// Generate a brick placement based on agent's skill
function generateBrickForAgent(
  agent: AIAgent,
  existingBricks: DesignBrick[],
  style: string
): DesignBrick {
  // Find the current build bounds
  let maxY = 0;
  let maxX = 0;
  let maxZ = 0;
  
  existingBricks.forEach(b => {
    maxY = Math.max(maxY, b.position.y + b.height);
    maxX = Math.max(maxX, b.position.x + b.width);
    maxZ = Math.max(maxZ, b.position.z + b.depth);
  });

  // Generate position based on agent skill
  let position: BrickPosition;
  let width: number;
  let depth: number;
  let height = 1;
  let color: string;

  const colorKeys = Object.keys(BRICK_COLORS) as (keyof typeof BRICK_COLORS)[];
  
  switch (agent.skill) {
    case 'architecture':
      // Foundation and structure - larger bricks at base
      position = {
        x: Math.floor(Math.random() * 6) - 3,
        y: maxY < 3 ? 0 : maxY,
        z: Math.floor(Math.random() * 6) - 3
      };
      width = Math.random() > 0.5 ? 4 : 2;
      depth = Math.random() > 0.5 ? 2 : 4;
      color = BRICK_COLORS[['red', 'blue', 'gray', 'white'][Math.floor(Math.random() * 4)] as keyof typeof BRICK_COLORS];
      break;

    case 'color_theory':
      // Colorful accents
      position = {
        x: Math.floor(Math.random() * 8) - 4,
        y: Math.floor(Math.random() * Math.max(1, maxY)),
        z: Math.floor(Math.random() * 8) - 4
      };
      width = 2;
      depth = 2;
      const vibrantColors: (keyof typeof BRICK_COLORS)[] = ['yellow', 'orange', 'pink', 'cyan', 'lime', 'purple'];
      color = BRICK_COLORS[vibrantColors[Math.floor(Math.random() * vibrantColors.length)]];
      break;

    case 'structural':
      // Support and stability - connecting pieces
      position = {
        x: Math.floor(Math.random() * 4) - 2,
        y: Math.max(0, maxY - 1),
        z: Math.floor(Math.random() * 4) - 2
      };
      width = 4;
      depth = 2;
      color = BRICK_COLORS[['gray', 'darkGray', 'black', 'white'][Math.floor(Math.random() * 4)] as keyof typeof BRICK_COLORS];
      break;

    case 'creative':
      // Wild placements - anywhere!
      position = {
        x: Math.floor(Math.random() * 10) - 5,
        y: Math.floor(Math.random() * (maxY + 3)),
        z: Math.floor(Math.random() * 10) - 5
      };
      width = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
      depth = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
      color = BRICK_COLORS[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
      break;

    case 'miniature':
      // Small detailed pieces
      position = {
        x: Math.floor(Math.random() * 6) - 3,
        y: Math.floor(Math.random() * Math.max(1, maxY + 1)),
        z: Math.floor(Math.random() * 6) - 3
      };
      width = 1;
      depth = 1;
      color = BRICK_COLORS[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
      break;

    case 'mechanical':
      // Functional pieces - often gray/black
      position = {
        x: Math.floor(Math.random() * 4) - 2,
        y: maxY,
        z: Math.floor(Math.random() * 4) - 2
      };
      width = 2;
      depth = 4;
      color = BRICK_COLORS[['gray', 'darkGray', 'black', 'red'][Math.floor(Math.random() * 4)] as keyof typeof BRICK_COLORS];
      break;

    case 'retro':
      // Classic colors and sizes
      position = {
        x: Math.floor(Math.random() * 6) - 3,
        y: Math.floor(Math.random() * Math.max(1, maxY)),
        z: Math.floor(Math.random() * 6) - 3
      };
      width = [2, 4][Math.floor(Math.random() * 2)];
      depth = 2;
      const classicColors: (keyof typeof BRICK_COLORS)[] = ['red', 'blue', 'yellow', 'white', 'black'];
      color = BRICK_COLORS[classicColors[Math.floor(Math.random() * classicColors.length)]];
      break;

    case 'detail':
    default:
      // Decorative pieces
      position = {
        x: Math.floor(Math.random() * 8) - 4,
        y: Math.floor(Math.random() * Math.max(1, maxY + 1)),
        z: Math.floor(Math.random() * 8) - 4
      };
      width = [1, 2][Math.floor(Math.random() * 2)];
      depth = [1, 2][Math.floor(Math.random() * 2)];
      color = BRICK_COLORS[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
      break;
  }

  return {
    position,
    width,
    depth,
    height,
    color,
    placedBy: agent.id
  };
}

// Get a random agent for the next action
export function getRandomAgent(): AIAgent {
  return AI_AGENTS[Math.floor(Math.random() * AI_AGENTS.length)];
}

// Get agent by ID
export function getAgentById(id: string): AIAgent | undefined {
  return AI_AGENTS.find(a => a.id === id);
}
