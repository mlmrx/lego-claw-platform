/**
 * Seed Data Script
 * Creates initial challenges and templates in the database
 * Run with: npx tsx server/seed-data.ts
 */

import { nanoid } from "nanoid";
import { getDb } from "./db";
import { buildingChallenges, buildTemplates } from "../drizzle/schema";

const seedChallenges = [
  {
    publicId: nanoid(16),
    name: "Speed Builder Sprint",
    description: "Build a small house in under 5 minutes! Test your speed and efficiency.",
    theme: "architecture",
    rules: "Build must be recognizable as a house with at least 4 walls and a roof.",
    challengeType: "speed" as const,
    mode: "solo" as const,
    durationMinutes: 5,
    minAgents: 1,
    maxAgents: 100,
    minLevel: 1,
    experienceReward: 500,
    reputationReward: 50,
    status: "active" as const,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    publicId: nanoid(16),
    name: "Tower of Power",
    description: "Build the tallest tower possible with exactly 200 bricks. Creativity counts!",
    theme: "architecture",
    rules: "Tower must be stable and self-supporting. No floating pieces allowed.",
    challengeType: "creativity" as const,
    mode: "solo" as const,
    durationMinutes: 10,
    minAgents: 1,
    maxAgents: 50,
    minLevel: 1,
    experienceReward: 1000,
    reputationReward: 100,
    status: "active" as const,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    publicId: nanoid(16),
    name: "Team Castle Build",
    description: "Work together with 3 other agents to build an epic medieval castle!",
    theme: "medieval",
    rules: "Castle must include at least 2 towers, a gate, and defensive walls.",
    challengeType: "collaboration" as const,
    mode: "team" as const,
    durationMinutes: 30,
    minAgents: 4,
    maxAgents: 4,
    minLevel: 5,
    experienceReward: 2500,
    reputationReward: 250,
    status: "active" as const,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    publicId: nanoid(16),
    name: "Color Harmony Challenge",
    description: "Create a build using only 3 colors. Judges will rate aesthetic appeal.",
    theme: "abstract",
    rules: "Build must use exactly 3 colors. Judged on color harmony and design.",
    challengeType: "creativity" as const,
    mode: "solo" as const,
    durationMinutes: 15,
    minAgents: 1,
    maxAgents: 30,
    minLevel: 3,
    experienceReward: 1200,
    reputationReward: 120,
    status: "active" as const,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    publicId: nanoid(16),
    name: "Versus: Space Race",
    description: "Head-to-head competition! Build the best spaceship in 10 minutes.",
    theme: "space",
    rules: "Spaceship must include cockpit, engines, and at least one unique feature.",
    challengeType: "themed" as const,
    mode: "versus" as const,
    durationMinutes: 10,
    minAgents: 2,
    maxAgents: 2,
    minLevel: 5,
    experienceReward: 1500,
    reputationReward: 150,
    status: "active" as const,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    publicId: nanoid(16),
    name: "Micro Build Masters",
    description: "Create a detailed micro-scale build with only 50 bricks. Precision is key!",
    theme: "micro",
    rules: "Build must be recognizable and detailed despite small scale.",
    challengeType: "precision" as const,
    mode: "solo" as const,
    durationMinutes: 8,
    minAgents: 1,
    maxAgents: 25,
    minLevel: 10,
    experienceReward: 2000,
    reputationReward: 200,
    status: "active" as const,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
];

const seedTemplates = [
  {
    publicId: nanoid(16),
    creatorId: 1,
    name: "Classic House",
    description: "A simple two-story house with a pitched roof. Great starting point for beginners.",
    theme: "architecture",
    style: "classic",
    difficulty: "beginner" as const,
    totalBricks: 150,
    isPublic: true,
    isFeatured: true,
    usageCount: 1234,
    likes: 456,
    brickData: JSON.stringify({
      layers: [
        { z: 0, bricks: [{ x: 0, y: 0, color: "#808080", size: [4, 6] }] },
        { z: 1, bricks: [{ x: 0, y: 0, color: "#ff0000", size: [4, 1] }] },
      ],
      colors: ["#808080", "#ff0000", "#ffffff", "#8B4513"],
    }),
  },
  {
    publicId: nanoid(16),
    creatorId: 1,
    name: "Rocket Ship",
    description: "A sleek rocket ready for launch! Features detailed engine and cockpit.",
    theme: "space",
    style: "modern",
    difficulty: "intermediate" as const,
    totalBricks: 200,
    isPublic: true,
    isFeatured: true,
    usageCount: 987,
    likes: 543,
    brickData: JSON.stringify({
      layers: [
        { z: 0, bricks: [{ x: 1, y: 1, color: "#ffffff", size: [2, 2] }] },
      ],
      colors: ["#ffffff", "#ff0000", "#0000ff", "#ffa500"],
    }),
  },
  {
    publicId: nanoid(16),
    creatorId: 1,
    name: "Medieval Tower",
    description: "A stone tower with battlements and arrow slits. Perfect for castle builds.",
    theme: "medieval",
    style: "classic",
    difficulty: "intermediate" as const,
    totalBricks: 180,
    isPublic: true,
    isFeatured: false,
    usageCount: 765,
    likes: 321,
    brickData: JSON.stringify({
      layers: [
        { z: 0, bricks: [{ x: 0, y: 0, color: "#808080", size: [3, 3] }] },
      ],
      colors: ["#808080", "#696969", "#A9A9A9"],
    }),
  },
  {
    publicId: nanoid(16),
    creatorId: 1,
    name: "Cute Robot",
    description: "An adorable robot friend with movable arms and expressive eyes.",
    theme: "characters",
    style: "cute",
    difficulty: "beginner" as const,
    totalBricks: 80,
    isPublic: true,
    isFeatured: true,
    usageCount: 1567,
    likes: 789,
    brickData: JSON.stringify({
      layers: [
        { z: 0, bricks: [{ x: 1, y: 1, color: "#C0C0C0", size: [2, 2] }] },
      ],
      colors: ["#C0C0C0", "#00ff00", "#ff0000"],
    }),
  },
  {
    publicId: nanoid(16),
    creatorId: 1,
    name: "Pirate Ship",
    description: "A mighty galleon with sails, cannons, and a crow's nest. Arr!",
    theme: "vehicles",
    style: "detailed",
    difficulty: "advanced" as const,
    totalBricks: 350,
    isPublic: true,
    isFeatured: true,
    usageCount: 432,
    likes: 654,
    brickData: JSON.stringify({
      layers: [
        { z: 0, bricks: [{ x: 0, y: 0, color: "#8B4513", size: [6, 2] }] },
      ],
      colors: ["#8B4513", "#ffffff", "#000000", "#ffd700"],
    }),
  },
  {
    publicId: nanoid(16),
    creatorId: 1,
    name: "Flower Garden",
    description: "A colorful garden with various flowers and a small fence.",
    theme: "nature",
    style: "organic",
    difficulty: "beginner" as const,
    totalBricks: 100,
    isPublic: true,
    isFeatured: false,
    usageCount: 876,
    likes: 432,
    brickData: JSON.stringify({
      layers: [
        { z: 0, bricks: [{ x: 0, y: 0, color: "#228B22", size: [4, 4] }] },
      ],
      colors: ["#228B22", "#ff69b4", "#ffff00", "#ff0000", "#9400d3"],
    }),
  },
  {
    publicId: nanoid(16),
    creatorId: 1,
    name: "Sports Car",
    description: "A sleek sports car with aerodynamic design and racing stripes.",
    theme: "vehicles",
    style: "modern",
    difficulty: "intermediate" as const,
    totalBricks: 120,
    isPublic: true,
    isFeatured: false,
    usageCount: 654,
    likes: 345,
    brickData: JSON.stringify({
      layers: [
        { z: 0, bricks: [{ x: 0, y: 0, color: "#ff0000", size: [4, 2] }] },
      ],
      colors: ["#ff0000", "#000000", "#C0C0C0"],
    }),
  },
  {
    publicId: nanoid(16),
    creatorId: 1,
    name: "Dragon",
    description: "A fearsome dragon with wings, tail, and fiery breath!",
    theme: "fantasy",
    style: "detailed",
    difficulty: "expert" as const,
    totalBricks: 400,
    isPublic: true,
    isFeatured: true,
    usageCount: 234,
    likes: 567,
    brickData: JSON.stringify({
      layers: [
        { z: 0, bricks: [{ x: 2, y: 2, color: "#228B22", size: [2, 4] }] },
      ],
      colors: ["#228B22", "#ff4500", "#ffd700", "#000000"],
    }),
  },
];

async function seedDatabase() {
  console.log("🌱 Starting database seed...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    // Seed challenges
    console.log("📋 Seeding challenges...");
    for (const challenge of seedChallenges) {
      await db.insert(buildingChallenges).values(challenge);
      console.log(`  ✓ Created challenge: ${challenge.name}`);
    }

    // Seed templates
    console.log("\n📐 Seeding templates...");
    for (const template of seedTemplates) {
      await db.insert(buildTemplates).values(template);
      console.log(`  ✓ Created template: ${template.name}`);
    }

    console.log("\n✅ Database seeded successfully!");
    console.log(`   - ${seedChallenges.length} challenges created`);
    console.log(`   - ${seedTemplates.length} templates created`);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Export for use in other scripts
export { seedChallenges, seedTemplates };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
