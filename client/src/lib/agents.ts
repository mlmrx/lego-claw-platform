/**
 * LEGO Agents - Agent Data and Types
 * Design: Isometric LEGO Playground
 * 
 * This file provides types and utilities for the AI-powered agent system.
 * Agents are now powered by real AI that generates creative designs and conversations.
 */

// Agent skill types (matches server)
export type AgentSkill = 
  | 'architecture'
  | 'color_theory'
  | 'structural'
  | 'detail'
  | 'creative'
  | 'miniature'
  | 'mechanical'
  | 'retro';

// Agent personality traits
export interface AgentPersonality {
  enthusiasm: number;
  precision: number;
  creativity: number;
  collaboration: number;
  humor: number;
}

// Agent definition from API
export interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  skill: AgentSkill;
  personality: AgentPersonality;
  status?: 'building' | 'thinking' | 'chatting' | 'idle';
}

// Legacy compatibility - map emoji to avatar
export interface LegacyAgent {
  id: string;
  name: string;
  avatar: string;
  color: string;
  specialty: string;
  personality: string;
  status: 'building' | 'thinking' | 'chatting' | 'idle';
}

// Brick position in 3D space
export interface BrickPosition {
  x: number;
  y: number;
  z: number;
}

// A single LEGO brick
export interface DesignBrick {
  position: BrickPosition;
  width: number;
  depth: number;
  height: number;
  color: string;
  placedBy: string;
}

// Message from an agent
export interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  type: 'idea' | 'action' | 'reaction' | 'celebration' | 'question';
  timestamp: number;
  replyTo?: string;
  brickAction?: {
    action: 'place' | 'suggest' | 'modify';
    brick: DesignBrick;
  };
}

// Current build state
export interface BuildState {
  id: string;
  name: string;
  description: string;
  theme: string;
  style: string;
  brickCount: number;
  messageCount: number;
  startedAt: number;
}

// Build stats
export interface BuildStats {
  activeAgents: number;
  totalBricks: number;
  totalMessages: number;
  currentBuild: {
    name: string;
    theme: string;
  } | null;
}

// Skill descriptions for display
export const skillDescriptions: Record<AgentSkill, string> = {
  architecture: 'Structural Engineering',
  color_theory: 'Color Theory & Aesthetics',
  structural: 'Large Scale Constructions',
  detail: 'Finishing Details',
  creative: 'Spacecraft & Vehicles',
  miniature: 'Miniature Designs',
  mechanical: 'Mechanical Systems',
  retro: 'Medieval Architecture',
};

// Convert API agent to legacy format for existing components
export function toLegacyAgent(agent: Agent): LegacyAgent {
  return {
    id: agent.id,
    name: agent.name,
    avatar: agent.emoji,
    color: agent.color,
    specialty: skillDescriptions[agent.skill] || agent.skill,
    personality: `${agent.personality.creativity > 0.7 ? 'Creative' : 'Methodical'}, ${agent.personality.enthusiasm > 0.7 ? 'enthusiastic' : 'focused'}`,
    status: agent.status || 'idle',
  };
}

// Default agents for initial render (before API loads)
export const defaultAgents: Agent[] = [
  {
    id: 'brick-master',
    name: 'Brick Master',
    emoji: '🧱',
    color: '#E53935',
    skill: 'architecture',
    personality: { enthusiasm: 0.8, precision: 0.9, creativity: 0.6, collaboration: 0.7, humor: 0.4 },
    status: 'building'
  },
  {
    id: 'color-wizard',
    name: 'Color Wizard',
    emoji: '🎨',
    color: '#8E24AA',
    skill: 'color_theory',
    personality: { enthusiasm: 0.9, precision: 0.7, creativity: 0.9, collaboration: 0.8, humor: 0.6 },
    status: 'thinking'
  },
  {
    id: 'mega-builder',
    name: 'Mega Builder',
    emoji: '🏗️',
    color: '#FF9800',
    skill: 'structural',
    personality: { enthusiasm: 0.7, precision: 0.95, creativity: 0.5, collaboration: 0.6, humor: 0.3 },
    status: 'building'
  },
  {
    id: 'space-explorer',
    name: 'Space Explorer',
    emoji: '🚀',
    color: '#1E88E5',
    skill: 'creative',
    personality: { enthusiasm: 0.95, precision: 0.5, creativity: 0.99, collaboration: 0.9, humor: 0.7 },
    status: 'chatting'
  },
  {
    id: 'tiny-architect',
    name: 'Tiny Architect',
    emoji: '🔬',
    color: '#F48FB1',
    skill: 'miniature',
    personality: { enthusiasm: 0.6, precision: 0.99, creativity: 0.7, collaboration: 0.5, humor: 0.5 },
    status: 'thinking'
  },
  {
    id: 'technic-pro',
    name: 'Technic Pro',
    emoji: '⚙️',
    color: '#546E7A',
    skill: 'mechanical',
    personality: { enthusiasm: 0.7, precision: 0.9, creativity: 0.8, collaboration: 0.6, humor: 0.4 },
    status: 'idle'
  },
  {
    id: 'castle-keeper',
    name: 'Castle Keeper',
    emoji: '🏰',
    color: '#6D4C41',
    skill: 'retro',
    personality: { enthusiasm: 0.75, precision: 0.8, creativity: 0.6, collaboration: 0.8, humor: 0.6 },
    status: 'chatting'
  },
  {
    id: 'retro-fan',
    name: 'Retro Fan',
    emoji: '🎮',
    color: '#43A047',
    skill: 'detail',
    personality: { enthusiasm: 0.85, precision: 0.75, creativity: 0.8, collaboration: 0.9, humor: 0.8 },
    status: 'building'
  }
];

// Legacy exports for backward compatibility
export const agents = defaultAgents.map(toLegacyAgent);

// Message type badge colors
export const messageTypeBadges: Record<AgentMessage['type'], { label: string; color: string }> = {
  idea: { label: '💡 idea', color: '#FDD835' },
  action: { label: '🔧 action', color: '#43A047' },
  reaction: { label: '💬 reaction', color: '#1E88E5' },
  celebration: { label: '🎉 celebration', color: '#E53935' },
  question: { label: '❓ question', color: '#8E24AA' },
};
