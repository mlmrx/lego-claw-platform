/**
 * LEGO Agents - Agent Data and Types
 * Design: Isometric LEGO Playground
 * Each agent has a unique personality and building specialty
 */

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  color: string;
  specialty: string;
  personality: string;
  status: 'building' | 'thinking' | 'chatting' | 'idle';
}

export interface Message {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  type: 'chat' | 'action' | 'idea' | 'celebration';
}

export interface LegoProject {
  id: string;
  name: string;
  description: string;
  image: string;
  progress: number;
  contributors: string[];
  piecesPlaced: number;
  totalPieces: number;
}

// Agent pool with diverse personalities
export const agents: Agent[] = [
  {
    id: 'brick-master',
    name: 'Brick Master',
    avatar: '🧱',
    color: '#E3000B',
    specialty: 'Structural Engineering',
    personality: 'Methodical and precise, always double-checks connections',
    status: 'building'
  },
  {
    id: 'color-wizard',
    name: 'Color Wizard',
    avatar: '🎨',
    color: '#0055BF',
    specialty: 'Color Theory & Aesthetics',
    personality: 'Creative and expressive, obsessed with perfect color harmony',
    status: 'thinking'
  },
  {
    id: 'tiny-architect',
    name: 'Tiny Architect',
    avatar: '📐',
    color: '#FFD700',
    specialty: 'Miniature Designs',
    personality: 'Detail-oriented, loves intricate small-scale builds',
    status: 'chatting'
  },
  {
    id: 'mega-builder',
    name: 'Mega Builder',
    avatar: '🏗️',
    color: '#00852B',
    specialty: 'Large Scale Constructions',
    personality: 'Bold and ambitious, thinks big',
    status: 'building'
  },
  {
    id: 'retro-fan',
    name: 'Retro Fan',
    avatar: '🕹️',
    color: '#FF6B00',
    specialty: 'Classic Sets Recreation',
    personality: 'Nostalgic, loves recreating vintage designs',
    status: 'idle'
  },
  {
    id: 'technic-pro',
    name: 'Technic Pro',
    avatar: '⚙️',
    color: '#4A4A4A',
    specialty: 'Mechanical Systems',
    personality: 'Engineering-focused, loves moving parts',
    status: 'thinking'
  },
  {
    id: 'space-explorer',
    name: 'Space Explorer',
    avatar: '🚀',
    color: '#1E90FF',
    specialty: 'Spacecraft & Vehicles',
    personality: 'Imaginative, dreams of interstellar adventures',
    status: 'building'
  },
  {
    id: 'castle-keeper',
    name: 'Castle Keeper',
    avatar: '🏰',
    color: '#8B4513',
    specialty: 'Medieval Architecture',
    personality: 'Traditional, loves historical accuracy',
    status: 'chatting'
  }
];

// Conversation templates for natural agent dialogue
export const conversationTemplates = {
  greetings: [
    "Hey team! Ready to build something amazing?",
    "Good to see everyone! What are we creating today?",
    "I've got some great ideas brewing!",
    "Let's make some brick magic happen!"
  ],
  building: [
    "I'm placing the {color} {piece} right here...",
    "This section needs more structural support.",
    "Perfect! That piece fits beautifully.",
    "Let me add some detail to this corner.",
    "The foundation is looking solid!",
    "I think we need a 2x4 brick here."
  ],
  collaboration: [
    "What do you think about adding a tower here?",
    "Great idea! Let me help with that section.",
    "I'll handle the left side, you take the right?",
    "Should we use red or blue for this part?",
    "Let's coordinate on the color scheme.",
    "I love what you did with that detail!"
  ],
  celebration: [
    "🎉 Another piece placed perfectly!",
    "We're making great progress!",
    "This is going to look amazing!",
    "Teamwork makes the dream work!",
    "Look at how far we've come!"
  ],
  thinking: [
    "Hmm, let me think about this...",
    "I'm visualizing the next steps...",
    "What if we tried a different approach?",
    "Let me calculate the piece count...",
    "I'm analyzing the structural integrity..."
  ]
};

// LEGO piece types for building descriptions
export const legoPieces = [
  '2x4 brick', '2x2 brick', '1x4 plate', '2x2 slope',
  '1x1 round', '2x3 tile', '1x2 technic beam', '4x4 baseplate',
  '1x1 stud', '2x2 corner', '1x6 brick', '2x2 round'
];

export const legoColors = [
  'red', 'blue', 'yellow', 'green', 'white', 'black',
  'orange', 'tan', 'gray', 'light blue', 'dark green', 'brown'
];

// Generate a random message for an agent
export function generateAgentMessage(agent: Agent): Message {
  const templates = conversationTemplates;
  let content: string;
  let type: Message['type'] = 'chat';

  const rand = Math.random();
  
  if (rand < 0.3) {
    // Building action
    const piece = legoPieces[Math.floor(Math.random() * legoPieces.length)];
    const color = legoColors[Math.floor(Math.random() * legoColors.length)];
    content = templates.building[Math.floor(Math.random() * templates.building.length)]
      .replace('{piece}', piece)
      .replace('{color}', color);
    type = 'action';
  } else if (rand < 0.5) {
    // Collaboration
    content = templates.collaboration[Math.floor(Math.random() * templates.collaboration.length)];
    type = 'chat';
  } else if (rand < 0.7) {
    // Thinking
    content = templates.thinking[Math.floor(Math.random() * templates.thinking.length)];
    type = 'idea';
  } else if (rand < 0.85) {
    // Celebration
    content = templates.celebration[Math.floor(Math.random() * templates.celebration.length)];
    type = 'celebration';
  } else {
    // Greeting
    content = templates.greetings[Math.floor(Math.random() * templates.greetings.length)];
    type = 'chat';
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    agentId: agent.id,
    content,
    timestamp: new Date(),
    type
  };
}

// Sample projects being built
export const sampleProjects: LegoProject[] = [
  {
    id: 'spaceship-alpha',
    name: 'Spaceship Alpha',
    description: 'An interstellar cruiser with working landing gear',
    image: '/images/lego-build-1.png',
    progress: 67,
    contributors: ['brick-master', 'space-explorer', 'technic-pro'],
    piecesPlaced: 342,
    totalPieces: 512
  },
  {
    id: 'castle-fortress',
    name: 'Medieval Fortress',
    description: 'A grand castle with towers and drawbridge',
    image: '/images/lego-build-2.png',
    progress: 45,
    contributors: ['castle-keeper', 'mega-builder', 'color-wizard'],
    piecesPlaced: 567,
    totalPieces: 1260
  },
  {
    id: 'friendly-robot',
    name: 'Friendly Robot',
    description: 'A cheerful robot companion with articulated limbs',
    image: '/images/lego-build-3.png',
    progress: 82,
    contributors: ['technic-pro', 'tiny-architect', 'retro-fan'],
    piecesPlaced: 189,
    totalPieces: 230
  }
];
