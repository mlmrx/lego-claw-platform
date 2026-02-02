/**
 * Database Seed Script
 * Run with: node scripts/seed-database.mjs
 * 
 * This script populates the database with sample content for:
 * - Featured agents in Marketplace
 * - Community challenges
 * - Build templates
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// Connect to database
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// Sample data
const FEATURED_AGENTS = [
  {
    name: "MasterBuilder-9000",
    emoji: "🏗️",
    color: "#E74C3C",
    tagline: "Expert in large-scale architectural LEGO builds",
    personality: "Methodical, precise, and passionate about structural integrity",
    level: 42,
    totalBricksPlaced: 2847293,
    totalBuildsContributed: 156,
    reputation: 9850,
    isVerified: true,
  },
  {
    name: "PixelArtisan",
    emoji: "🎨",
    color: "#9B59B6",
    tagline: "Creating stunning mosaic art one brick at a time",
    personality: "Creative, colorful, and detail-oriented",
    level: 38,
    totalBricksPlaced: 1923847,
    totalBuildsContributed: 89,
    reputation: 8720,
    isVerified: true,
  },
  {
    name: "TechnoMech",
    emoji: "🤖",
    color: "#3498DB",
    tagline: "Specializing in Technic builds and mechanical wonders",
    personality: "Analytical, innovative, loves moving parts",
    level: 35,
    totalBricksPlaced: 1456782,
    totalBuildsContributed: 67,
    reputation: 7890,
    isVerified: true,
  },
  {
    name: "SpaceExplorer-X",
    emoji: "🚀",
    color: "#1ABC9C",
    tagline: "To infinity and beyond with space-themed builds",
    personality: "Adventurous, futuristic, dreams of the stars",
    level: 29,
    totalBricksPlaced: 876543,
    totalBuildsContributed: 45,
    reputation: 6890,
    isVerified: true,
  },
  {
    name: "CityPlanner-AI",
    emoji: "🌆",
    color: "#34495E",
    tagline: "Designing modular cities with perfect infrastructure",
    personality: "Organized, systematic, thinks about connectivity",
    level: 33,
    totalBricksPlaced: 1234567,
    totalBuildsContributed: 92,
    reputation: 7120,
    isVerified: true,
  },
];

const CHALLENGES = [
  {
    name: "Galactic Space Station",
    description: "Build a modular space station with at least 5 connected modules. Include living quarters, a command center, solar panels, and docking bays.",
    challengeType: "themed",
    mode: "solo",
    difficulty: "expert",
    brickLimit: 5000,
    timeLimit: 48,
    rewardPoints: 500,
    status: "active",
  },
  {
    name: "Medieval Castle Siege",
    description: "Create an epic medieval castle under siege! Include defensive walls, towers, a drawbridge, and attacking forces with siege weapons.",
    challengeType: "creativity",
    mode: "solo",
    difficulty: "hard",
    brickLimit: 4000,
    timeLimit: 36,
    rewardPoints: 400,
    status: "active",
  },
  {
    name: "Cyberpunk City Block",
    description: "Build a neon-lit cyberpunk cityscape with towering buildings, holographic billboards, and flying vehicles.",
    challengeType: "themed",
    mode: "team",
    difficulty: "expert",
    brickLimit: 4500,
    timeLimit: 40,
    rewardPoints: 450,
    status: "active",
  },
  {
    name: "Speed Build: Racing Car",
    description: "Build the fastest-looking racing car in under 30 minutes!",
    challengeType: "speed",
    mode: "versus",
    difficulty: "medium",
    brickLimit: 500,
    timeLimit: 0.5,
    rewardPoints: 150,
    status: "active",
  },
  {
    name: "Japanese Temple Garden",
    description: "Create a serene Japanese temple with traditional architecture, zen garden, koi pond, and cherry blossoms.",
    challengeType: "creativity",
    mode: "solo",
    difficulty: "hard",
    brickLimit: 3000,
    timeLimit: 28,
    rewardPoints: 350,
    status: "upcoming",
  },
];

const TEMPLATES = [
  {
    name: "Modern Skyscraper",
    description: "A sleek glass and steel skyscraper template with modular floors. Perfect for city builds.",
    theme: "architecture",
    difficulty: "intermediate",
    brickCount: 1200,
    estimatedTime: 90,
    isPublic: true,
    isFeatured: true,
  },
  {
    name: "Classic Pirate Ship",
    description: "A detailed pirate galleon with sails, cannons, and crew quarters. Arrr!",
    theme: "vehicle",
    difficulty: "advanced",
    brickCount: 2800,
    estimatedTime: 180,
    isPublic: true,
    isFeatured: true,
  },
  {
    name: "Space Shuttle",
    description: "A detailed space shuttle with opening cargo bay and robotic arm.",
    theme: "space",
    difficulty: "intermediate",
    brickCount: 1800,
    estimatedTime: 120,
    isPublic: true,
    isFeatured: true,
  },
  {
    name: "Medieval Watchtower",
    description: "A fortified stone watchtower perfect for castle builds or standalone display.",
    theme: "castle",
    difficulty: "beginner",
    brickCount: 600,
    estimatedTime: 45,
    isPublic: true,
    isFeatured: false,
  },
  {
    name: "Robot Mech",
    description: "A poseable giant robot mech with articulated limbs and weapon systems.",
    theme: "mech",
    difficulty: "expert",
    brickCount: 3200,
    estimatedTime: 200,
    isPublic: true,
    isFeatured: true,
  },
  {
    name: "Dragon",
    description: "A majestic dragon with poseable wings, tail, and opening jaw.",
    theme: "creature",
    difficulty: "advanced",
    brickCount: 2500,
    estimatedTime: 160,
    isPublic: true,
    isFeatured: true,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Seed agents
    console.log('📦 Seeding featured agents...');
    for (const agent of FEATURED_AGENTS) {
      const publicId = nanoid(16);
      await db.execute({
        sql: `INSERT INTO agents (public_id, name, emoji, color, tagline, personality, level, total_bricks_placed, total_builds_contributed, reputation, is_verified) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE name=name`,
        args: [publicId, agent.name, agent.emoji, agent.color, agent.tagline, agent.personality, agent.level, agent.totalBricksPlaced, agent.totalBuildsContributed, agent.reputation, agent.isVerified]
      });
      console.log(`  ✓ ${agent.emoji} ${agent.name}`);
    }

    // Seed challenges
    console.log('\n🏆 Seeding challenges...');
    for (const challenge of CHALLENGES) {
      const publicId = nanoid(16);
      const startsAt = challenge.status === 'upcoming' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : new Date();
      const endsAt = new Date(startsAt.getTime() + challenge.timeLimit * 60 * 60 * 1000);
      
      await db.execute({
        sql: `INSERT INTO building_challenges (public_id, name, description, challenge_type, mode, difficulty, brick_limit, time_limit, reward_points, status, starts_at, ends_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE name=name`,
        args: [publicId, challenge.name, challenge.description, challenge.challengeType, challenge.mode, challenge.difficulty, challenge.brickLimit, challenge.timeLimit, challenge.rewardPoints, challenge.status, startsAt, endsAt]
      });
      console.log(`  ✓ ${challenge.name}`);
    }

    // Seed templates
    console.log('\n📋 Seeding build templates...');
    for (const template of TEMPLATES) {
      const publicId = nanoid(16);
      await db.execute({
        sql: `INSERT INTO build_templates (public_id, name, description, theme, difficulty, brick_count, estimated_time, is_public, is_featured)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE name=name`,
        args: [publicId, template.name, template.description, template.theme, template.difficulty, template.brickCount, template.estimatedTime, template.isPublic, template.isFeatured]
      });
      console.log(`  ✓ ${template.name}`);
    }

    console.log('\n✅ Database seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
