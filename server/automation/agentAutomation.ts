/**
 * Agent Automation System
 * Periodically wakes up agents to perform random activities:
 * - Upvote builds and comments
 * - Post comments on builds
 * - Contribute to active builds
 * - Create new build projects
 */

import { getDb } from "../db";
import { 
  agents, 
  buildProjects, 
  buildRatings, 
  buildComments,
  projectParticipants,
  activityFeed
} from "../../drizzle/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// Configuration
const CONFIG = {
  // How often to run the automation (in milliseconds)
  checkInterval: 60 * 1000, // Every minute
  
  // Probability of an agent waking up each cycle (0-1)
  wakeUpProbability: 0.15,
  
  // Maximum agents to wake up per cycle
  maxAgentsPerCycle: 5,
  
  // Activity weights (higher = more likely)
  activityWeights: {
    upvote: 35,
    comment: 25,
    build: 30,
    post: 10,
  },
  
  // Cooldown between activities for same agent (ms)
  agentCooldown: 5 * 60 * 1000, // 5 minutes
  
  // Random delay range for activities (ms)
  activityDelayMin: 1000,
  activityDelayMax: 10000,
};

// Track last activity time per agent
const agentLastActivity = new Map<number, number>();

// Sample comments for agents to post
const SAMPLE_COMMENTS = [
  "Amazing build! Love the attention to detail 🧱",
  "The color scheme is perfect for this theme!",
  "Great structural design, very stable looking",
  "This is inspiring! I want to try something similar",
  "The brick placement here is really clever",
  "Wow, how many bricks did this take?",
  "The proportions are spot on!",
  "Love how you used those pieces creatively",
  "This would look great in my collection",
  "Fantastic work! Keep building! 🎉",
  "The technique used here is impressive",
  "I can see the effort that went into this",
  "Really captures the essence of the theme",
  "Beautiful creation! Well done!",
  "The details on this are incredible",
  "Such a creative use of standard bricks",
  "This deserves more attention!",
  "Masterful building technique",
  "I'm learning so much from this design",
  "Can't wait to see what you build next!",
];

// Sample build names for new projects
const BUILD_NAME_PREFIXES = [
  "Epic", "Majestic", "Tiny", "Giant", "Ancient", "Futuristic",
  "Classic", "Modern", "Mystical", "Legendary", "Hidden", "Grand"
];

const BUILD_NAME_SUBJECTS = [
  "Castle", "Spaceship", "Dragon", "Tower", "Village", "Robot",
  "Temple", "Bridge", "Garden", "Fortress", "Palace", "Ship"
];

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandomChoice(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of entries) {
    random -= weight;
    if (random <= 0) return key;
  }
  
  return entries[0][0];
}

function generateBuildName(): string {
  return `${randomChoice(BUILD_NAME_PREFIXES)} ${randomChoice(BUILD_NAME_SUBJECTS)}`;
}

// Activity implementations
async function performUpvote(agentId: number, agentName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Find a random build to rate
  const builds = await db
    .select()
    .from(buildProjects)
    .where(eq(buildProjects.status, 'building'))
    .limit(20);
  
  if (builds.length === 0) return false;
  
  const targetBuild = randomChoice(builds);
  
  // For ratings, we need a userId - get the agent's owner
  const agentData = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);
  
  if (agentData.length === 0) return false;
  const userId = agentData[0].ownerId;
  
  // Check if already rated
  const existingRating = await db
    .select()
    .from(buildRatings)
    .where(and(
      eq(buildRatings.buildId, targetBuild.id),
      eq(buildRatings.userId, userId)
    ))
    .limit(1);
  
  if (existingRating.length > 0) return false;
  
  // Create rating
  const rating = randomInt(3, 5); // Agents are generally positive
  await db.insert(buildRatings).values({
    publicId: nanoid(12),
    buildId: targetBuild.id,
    userId,
    overallRating: rating,
    creativityRating: randomInt(3, 5),
    technicalRating: randomInt(3, 5),
    aestheticsRating: randomInt(3, 5),
  });
  
  // Log activity
  await db.insert(activityFeed).values({
    publicId: nanoid(12),
    actorType: 'agent',
    actorId: agentId,
    activityType: 'brick_placed', // Using existing enum value
    projectId: targetBuild.id,
    agentId,
    metadata: { action: 'rate', buildId: targetBuild.id, rating },
  });
  
  console.log(`[Automation] Agent ${agentName} rated "${targetBuild.name}" ${rating} stars`);
  return true;
}

async function performComment(agentId: number, agentName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Find a random build to comment on
  const builds = await db
    .select()
    .from(buildProjects)
    .orderBy(desc(buildProjects.createdAt))
    .limit(30);
  
  if (builds.length === 0) return false;
  
  const targetBuild = randomChoice(builds);
  const comment = randomChoice(SAMPLE_COMMENTS);
  
  // For comments, we need a userId - get the agent's owner
  const agentData = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);
  
  if (agentData.length === 0) return false;
  const userId = agentData[0].ownerId;
  
  await db.insert(buildComments).values({
    publicId: nanoid(12),
    buildId: targetBuild.id,
    userId,
    content: comment,
  });
  
  // Log activity
  await db.insert(activityFeed).values({
    publicId: nanoid(12),
    actorType: 'agent',
    actorId: agentId,
    activityType: 'message_sent',
    projectId: targetBuild.id,
    agentId,
    metadata: { action: 'comment', buildId: targetBuild.id },
  });
  
  console.log(`[Automation] Agent ${agentName} commented on "${targetBuild.name}"`);
  return true;
}

async function performBuild(agentId: number, agentName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Find an active build to contribute to
  const activeBuilds = await db
    .select()
    .from(buildProjects)
    .where(eq(buildProjects.status, 'building'))
    .limit(20);
  
  if (activeBuilds.length === 0) return false;
  
  const targetBuild = randomChoice(activeBuilds);
  const bricksPlaced = randomInt(5, 50);
  
  // Check if already participating
  const existing = await db
    .select()
    .from(projectParticipants)
    .where(and(
      eq(projectParticipants.projectId, targetBuild.id),
      eq(projectParticipants.agentId, agentId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing contribution
    await db
      .update(projectParticipants)
      .set({
        bricksPlaced: sql`${projectParticipants.bricksPlaced} + ${bricksPlaced}`,
        lastContributedAt: new Date(),
      })
      .where(eq(projectParticipants.id, existing[0].id));
  } else {
    // Create new contribution
    await db.insert(projectParticipants).values({
      projectId: targetBuild.id,
      agentId,
      bricksPlaced,
      role: 'contributor',
    });
  }
  
  // Update build total bricks
  await db
    .update(buildProjects)
    .set({
      currentBricks: sql`${buildProjects.currentBricks} + ${bricksPlaced}`,
      updatedAt: new Date(),
    })
    .where(eq(buildProjects.id, targetBuild.id));
  
  // Update agent stats
  await db
    .update(agents)
    .set({
      totalBricksPlaced: sql`${agents.totalBricksPlaced} + ${bricksPlaced}`,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));
  
  // Log activity
  await db.insert(activityFeed).values({
    publicId: nanoid(12),
    actorType: 'agent',
    actorId: agentId,
    activityType: 'brick_placed',
    projectId: targetBuild.id,
    agentId,
    metadata: { action: 'build', buildId: targetBuild.id, bricksPlaced },
  });
  
  console.log(`[Automation] Agent ${agentName} placed ${bricksPlaced} bricks on "${targetBuild.name}"`);
  return true;
}

async function performPost(agentId: number, agentName: string, ownerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Create a new build project
  const buildName = generateBuildName();
  const themes = ['space', 'medieval', 'city', 'nature', 'fantasy', 'sci-fi'];
  const theme = randomChoice(themes);
  
  const initialBricks = randomInt(10, 30);
  const result = await db.insert(buildProjects).values({
    publicId: nanoid(12),
    name: buildName,
    description: `A ${theme}-themed creation by ${agentName}`,
    creatorId: ownerId,
    theme,
    style: randomChoice(['realistic', 'stylized', 'minimalist', 'detailed']),
    status: 'building',
    targetBricks: randomInt(50, 500),
    maxAgents: randomInt(4, 12),
    isOpenToJoin: true,
    currentBricks: initialBricks,
  }).$returningId();
  
  const newBuildId = result[0].id;
  const newBuild = { id: newBuildId, currentBricks: initialBricks };
  
  // Add the agent as first contributor
  await db.insert(projectParticipants).values({
    projectId: newBuild.id,
    agentId,
    bricksPlaced: newBuild.currentBricks,
    role: 'lead',
  });
  
  // Update agent stats
  await db
    .update(agents)
    .set({
      totalBuildsContributed: sql`${agents.totalBuildsContributed} + 1`,
      totalBricksPlaced: sql`${agents.totalBricksPlaced} + ${newBuild.currentBricks}`,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));
  
  // Log activity
  await db.insert(activityFeed).values({
    publicId: nanoid(12),
    actorType: 'agent',
    actorId: agentId,
    activityType: 'project_created',
    projectId: newBuild.id,
    agentId,
    metadata: { action: 'post', buildId: newBuild.id, theme },
  });
  
  console.log(`[Automation] Agent ${agentName} created new build: "${buildName}"`);
  return true;
}

// Main automation function
async function runAutomationCycle(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.log('[Automation] Database not available');
      return;
    }
    
    // Get all agents (status active means currently building/chatting, we want all agents)
    const allAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.isPublic, true))
      .limit(100);
    
    if (allAgents.length === 0) {
      console.log('[Automation] No agents found');
      return;
    }
    
    const now = Date.now();
    let wokenAgents = 0;
    
    // Shuffle agents for randomness
    const shuffledAgents = [...allAgents].sort(() => Math.random() - 0.5);
    
    for (const agent of shuffledAgents) {
      if (wokenAgents >= CONFIG.maxAgentsPerCycle) break;
      
      // Check cooldown
      const lastActivity = agentLastActivity.get(agent.id) || 0;
      if (now - lastActivity < CONFIG.agentCooldown) continue;
      
      // Random wake-up check
      if (Math.random() > CONFIG.wakeUpProbability) continue;
      
      // Select random activity
      const activity = weightedRandomChoice(CONFIG.activityWeights);
      
      // Add random delay for realism
      const delay = randomInt(CONFIG.activityDelayMin, CONFIG.activityDelayMax);
      
      setTimeout(async () => {
        try {
          let success = false;
          
          switch (activity) {
            case 'upvote':
              success = await performUpvote(agent.id, agent.name);
              break;
            case 'comment':
              success = await performComment(agent.id, agent.name);
              break;
            case 'build':
              success = await performBuild(agent.id, agent.name);
              break;
            case 'post':
              success = await performPost(agent.id, agent.name, agent.ownerId);
              break;
          }
          
          if (success) {
            agentLastActivity.set(agent.id, Date.now());
            
            // Update agent's last active time
            const dbInner = await getDb();
            if (dbInner) {
              await dbInner
                .update(agents)
                .set({ lastActiveAt: new Date() })
                .where(eq(agents.id, agent.id));
            }
          }
        } catch (error) {
          console.error(`[Automation] Error performing ${activity} for agent ${agent.name}:`, error);
        }
      }, delay);
      
      wokenAgents++;
    }
    
    if (wokenAgents > 0) {
      console.log(`[Automation] Woke up ${wokenAgents} agents for activities`);
    }
  } catch (error) {
    console.error('[Automation] Error in automation cycle:', error);
  }
}

// Automation state
let automationInterval: NodeJS.Timeout | null = null;
let isRunning = false;

// Start automation
export function startAgentAutomation(): void {
  if (isRunning) {
    console.log('[Automation] Already running');
    return;
  }
  
  console.log('[Automation] Starting agent automation system...');
  isRunning = true;
  
  // Run immediately once
  runAutomationCycle();
  
  // Then run periodically
  automationInterval = setInterval(runAutomationCycle, CONFIG.checkInterval);
  
  console.log(`[Automation] Running every ${CONFIG.checkInterval / 1000} seconds`);
}

// Stop automation
export function stopAgentAutomation(): void {
  if (!isRunning) {
    console.log('[Automation] Not running');
    return;
  }
  
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
  }
  
  isRunning = false;
  console.log('[Automation] Stopped agent automation system');
}

// Get automation status
export function getAutomationStatus(): {
  isRunning: boolean;
  config: typeof CONFIG;
  activeAgentCount: number;
} {
  return {
    isRunning,
    config: CONFIG,
    activeAgentCount: agentLastActivity.size,
  };
}

// Update configuration
export function updateAutomationConfig(updates: Partial<typeof CONFIG>): void {
  Object.assign(CONFIG, updates);
  console.log('[Automation] Configuration updated:', updates);
}

export default {
  start: startAgentAutomation,
  stop: stopAgentAutomation,
  status: getAutomationStatus,
  updateConfig: updateAutomationConfig,
};
