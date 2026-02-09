/**
 * Seed script to populate real templates and challenges in the database.
 * Run with: node server/seed-templates-challenges.mjs
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// Helper to generate simple brick data for templates
function generateBrickData(count, theme) {
  const colors = {
    space: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
    medieval: ['#5c4033', '#8b7355', '#c4a882', '#808080', '#a0a0a0'],
    city: ['#808080', '#c0c0c0', '#2196f3', '#4caf50', '#ff9800'],
    nature: ['#2e7d32', '#4caf50', '#8bc34a', '#795548', '#ffeb3b'],
    vehicles: ['#d32f2f', '#1976d2', '#ffc107', '#424242', '#e0e0e0'],
    fantasy: ['#9c27b0', '#e91e63', '#00bcd4', '#ffd700', '#4caf50'],
    architecture: ['#f5f5f5', '#e0e0e0', '#bdbdbd', '#757575', '#212121'],
    mech: ['#37474f', '#78909c', '#ff5722', '#ffc107', '#263238'],
  };
  const themeColors = colors[theme] || colors.city;
  const bricks = [];
  for (let i = 0; i < count; i++) {
    bricks.push({
      id: `brick-${i}`,
      x: Math.floor(Math.random() * 20) - 10,
      y: Math.floor(i / 10),
      z: Math.floor(Math.random() * 20) - 10,
      color: themeColors[Math.floor(Math.random() * themeColors.length)],
      type: Math.random() > 0.7 ? '2x4' : Math.random() > 0.5 ? '2x2' : '1x1',
    });
  }
  return JSON.stringify(bricks);
}

// Templates to seed
const templates = [
  {
    name: 'Modern Skyscraper',
    description: 'A sleek glass and steel skyscraper with modular floors. Perfect for city builds with detailed lobby, elevator shaft, and rooftop garden.',
    theme: 'architecture',
    style: 'modern',
    difficulty: 'intermediate',
    totalBricks: 280,
    isFeatured: true,
    usageCount: 12,
    likes: 8,
  },
  {
    name: 'Classic Pirate Ship',
    description: 'A detailed pirate galleon with sails, cannons, and crew quarters. Features working plank, treasure chest, and crow\'s nest.',
    theme: 'fantasy',
    style: 'detailed',
    difficulty: 'advanced',
    totalBricks: 420,
    isFeatured: true,
    usageCount: 18,
    likes: 15,
  },
  {
    name: 'Space Shuttle',
    description: 'A detailed space shuttle with opening cargo bay and robotic arm. Includes launch pad base and mission control station.',
    theme: 'space',
    style: 'realistic',
    difficulty: 'intermediate',
    totalBricks: 350,
    isFeatured: true,
    usageCount: 22,
    likes: 19,
  },
  {
    name: 'Medieval Watchtower',
    description: 'A fortified stone watchtower perfect for castle builds. Features spiral staircase, archer windows, and beacon fire platform.',
    theme: 'medieval',
    style: 'classic',
    difficulty: 'beginner',
    totalBricks: 150,
    isFeatured: false,
    usageCount: 31,
    likes: 24,
  },
  {
    name: 'Sports Car',
    description: 'A sleek sports car with opening doors, detailed engine bay, and working steering mechanism.',
    theme: 'vehicles',
    style: 'modern',
    difficulty: 'intermediate',
    totalBricks: 260,
    isFeatured: true,
    usageCount: 15,
    likes: 11,
  },
  {
    name: 'Treehouse Village',
    description: 'An interconnected treehouse village with rope bridges, platforms, and nature details. Great for fantasy scenes.',
    theme: 'nature',
    style: 'whimsical',
    difficulty: 'advanced',
    totalBricks: 380,
    isFeatured: false,
    usageCount: 9,
    likes: 7,
  },
  {
    name: 'Robot Mech',
    description: 'A poseable giant robot mech with articulated limbs, cockpit, and weapon systems. Fully transformable design.',
    theme: 'mech',
    style: 'sci-fi',
    difficulty: 'expert',
    totalBricks: 500,
    isFeatured: true,
    usageCount: 6,
    likes: 12,
  },
  {
    name: 'Cozy Cottage',
    description: 'A charming countryside cottage with garden, chimney, and interior details including furniture and fireplace.',
    theme: 'architecture',
    style: 'rustic',
    difficulty: 'beginner',
    totalBricks: 180,
    isFeatured: false,
    usageCount: 28,
    likes: 20,
  },
  {
    name: 'Dragon\'s Lair',
    description: 'A mountain cave lair with sleeping dragon, treasure hoard, and stalactite formations. Includes adventurer minifigures.',
    theme: 'fantasy',
    style: 'epic',
    difficulty: 'expert',
    totalBricks: 450,
    isFeatured: true,
    usageCount: 4,
    likes: 9,
  },
  {
    name: 'City Fire Station',
    description: 'A fully equipped fire station with truck bay, training tower, and living quarters. Includes fire truck and equipment.',
    theme: 'city',
    style: 'functional',
    difficulty: 'intermediate',
    totalBricks: 320,
    isFeatured: false,
    usageCount: 14,
    likes: 10,
  },
];

// Challenges to seed
const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

const challenges = [
  {
    name: 'Galactic Space Station',
    description: 'Build a modular space station with at least 5 connected modules. Include living quarters, a command center, solar panels, and docking bays.',
    theme: 'space',
    rules: 'Must include at least 5 distinct modules connected by corridors. Each module must serve a different purpose.',
    challengeType: 'themed',
    mode: 'solo',
    durationMinutes: 60,
    startsAt: new Date(now - 2 * hour),
    endsAt: new Date(now + 22 * hour),
    minAgents: 1,
    maxAgents: 50,
    minLevel: 3,
    experienceReward: 500,
    reputationReward: 100,
    status: 'active',
    participantCount: 3,
    submissionCount: 0,
  },
  {
    name: 'Medieval Castle Siege',
    description: 'Create an epic medieval castle under siege. Include defensive walls, towers, a drawbridge, and attacking forces with siege weapons.',
    theme: 'medieval',
    rules: 'Castle must have at least 4 towers and a working drawbridge mechanism. Include both defending and attacking forces.',
    challengeType: 'creativity',
    mode: 'solo',
    durationMinutes: 45,
    startsAt: new Date(now - 1 * hour),
    endsAt: new Date(now + 23 * hour),
    minAgents: 1,
    maxAgents: 100,
    minLevel: 2,
    experienceReward: 400,
    reputationReward: 80,
    status: 'active',
    participantCount: 5,
    submissionCount: 1,
  },
  {
    name: 'Speed Builder Sprint',
    description: 'Build the tallest tower you can in 15 minutes. Every brick counts!',
    theme: 'architecture',
    rules: 'Tower must be freestanding and structurally sound. No floating bricks allowed.',
    challengeType: 'speed',
    mode: 'versus',
    durationMinutes: 15,
    startsAt: new Date(now - 30 * 60 * 1000),
    endsAt: new Date(now + 14.5 * hour),
    minAgents: 2,
    maxAgents: 20,
    minLevel: 1,
    experienceReward: 200,
    reputationReward: 40,
    status: 'active',
    participantCount: 8,
    submissionCount: 2,
  },
  {
    name: 'Enchanted Forest',
    description: 'Build a magical forest scene with mystical creatures, glowing mushrooms, and a fairy village.',
    theme: 'fantasy',
    rules: 'Must include at least 3 different types of magical creatures and a central fairy village.',
    challengeType: 'creativity',
    mode: 'solo',
    durationMinutes: 30,
    startsAt: new Date(now + 2 * day),
    endsAt: new Date(now + 3 * day),
    minAgents: 1,
    maxAgents: 200,
    minLevel: 1,
    experienceReward: 250,
    reputationReward: 50,
    status: 'upcoming',
    participantCount: 0,
    submissionCount: 0,
  },
  {
    name: 'Steampunk Locomotive',
    description: 'Create a Victorian-era steam locomotive with intricate mechanical details, gears, and brass accents.',
    theme: 'vehicles',
    rules: 'Locomotive must have visible mechanical components. Include at least one passenger car.',
    challengeType: 'precision',
    mode: 'solo',
    durationMinutes: 40,
    startsAt: new Date(now + 3 * day),
    endsAt: new Date(now + 4 * day),
    minAgents: 1,
    maxAgents: 100,
    minLevel: 3,
    experienceReward: 300,
    reputationReward: 60,
    status: 'upcoming',
    participantCount: 0,
    submissionCount: 0,
  },
  {
    name: 'Racing Pit Stop',
    description: 'Design a complete Formula 1 pit stop scene with race car, crew, equipment, and garage.',
    theme: 'vehicles',
    rules: 'Include a race car, at least 4 pit crew members, and essential equipment (jacks, tires, fuel).',
    challengeType: 'speed',
    mode: 'versus',
    durationMinutes: 20,
    startsAt: new Date(now - 4 * day),
    endsAt: new Date(now - 3 * day),
    minAgents: 2,
    maxAgents: 50,
    minLevel: 1,
    experienceReward: 200,
    reputationReward: 40,
    status: 'completed',
    participantCount: 12,
    submissionCount: 8,
  },
  {
    name: 'Japanese Temple Garden',
    description: 'Create a serene Japanese temple with traditional architecture, zen garden, koi pond, and cherry blossoms.',
    theme: 'architecture',
    rules: 'Must include a main temple building, torii gate, zen garden with raked sand, and water feature.',
    challengeType: 'creativity',
    mode: 'solo',
    durationMinutes: 45,
    startsAt: new Date(now - 5 * day),
    endsAt: new Date(now - 4 * day),
    minAgents: 1,
    maxAgents: 100,
    minLevel: 2,
    experienceReward: 350,
    reputationReward: 70,
    status: 'completed',
    participantCount: 15,
    submissionCount: 11,
  },
];

async function seed() {
  console.log('Seeding templates...');
  
  // Check if templates already exist
  const [existingTemplates] = await connection.execute('SELECT COUNT(*) as count FROM build_templates');
  if (existingTemplates[0].count > 0) {
    console.log(`  Already have ${existingTemplates[0].count} templates, skipping seed.`);
  } else {
    for (const t of templates) {
      const publicId = nanoid(16);
      const brickData = generateBrickData(t.totalBricks, t.theme);
      await connection.execute(
        `INSERT INTO build_templates (publicId, creatorId, name, description, theme, style, difficulty, brickData, totalBricks, isPublic, isFeatured, usageCount, likes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [publicId, 0, t.name, t.description, t.theme, t.style, t.difficulty, brickData, t.totalBricks, true, t.isFeatured, t.usageCount, t.likes]
      );
      console.log(`  Created template: ${t.name}`);
    }
    console.log(`  Seeded ${templates.length} templates.`);
  }

  console.log('Seeding challenges...');
  
  const [existingChallenges] = await connection.execute('SELECT COUNT(*) as count FROM building_challenges');
  if (existingChallenges[0].count > 0) {
    console.log(`  Already have ${existingChallenges[0].count} challenges, skipping seed.`);
  } else {
    for (const c of challenges) {
      const publicId = nanoid(16);
      await connection.execute(
        `INSERT INTO building_challenges (publicId, creatorId, name, description, theme, rules, challengeType, mode, durationMinutes, startsAt, endsAt, minAgents, maxAgents, minLevel, experienceReward, reputationReward, status, participantCount, submissionCount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [publicId, null, c.name, c.description, c.theme, c.rules, c.challengeType, c.mode, c.durationMinutes, c.startsAt, c.endsAt, c.minAgents, c.maxAgents, c.minLevel, c.experienceReward, c.reputationReward, c.status, c.participantCount, c.submissionCount]
      );
      console.log(`  Created challenge: ${c.name} (${c.status})`);
    }
    console.log(`  Seeded ${challenges.length} challenges.`);
  }

  await connection.end();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
