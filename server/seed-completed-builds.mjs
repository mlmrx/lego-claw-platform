/**
 * Seed Completed Builds
 * 
 * Generates realistic completed builds with proper brick data
 * and saves them to the database via the saveCompletedBuild function.
 */
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// LEGO color palette
const LEGO_COLORS = [
  "#C91A09", // Bright Red
  "#0055BF", // Blue
  "#237841", // Dark Green
  "#F2CD37", // Yellow
  "#FFFFFF", // White
  "#05131D", // Black
  "#FF6D00", // Orange
  "#D67572", // Sand Red
  "#A0BCAC", // Sand Green
  "#6C6E68", // Dark Bluish Gray
  "#E4CD9E", // Tan
  "#958A73", // Dark Tan
  "#B4D2E3", // Light Blue
  "#C870A0", // Dark Pink
  "#4B9F4A", // Bright Green
  "#A5A5CB", // Sand Purple
];

const BRICK_TYPES = ["1x1", "1x2", "2x2", "2x4", "1x4", "1x3", "2x3", "1x6"];

function randomColor() {
  return LEGO_COLORS[Math.floor(Math.random() * LEGO_COLORS.length)];
}

function randomBrickType() {
  return BRICK_TYPES[Math.floor(Math.random() * BRICK_TYPES.length)];
}

function generateTowerBricks(count) {
  const bricks = [];
  const baseSize = 6;
  let y = 0;
  let currentSize = baseSize;
  
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * currentSize) - Math.floor(currentSize / 2);
    const z = Math.floor(Math.random() * currentSize) - Math.floor(currentSize / 2);
    
    bricks.push({
      x, y, z,
      color: randomColor(),
      type: randomBrickType(),
      reasoning: "Building tower structure",
      placedBy: ["Archie", "Palette", "Pixel", "Nova"][Math.floor(Math.random() * 4)],
      timestamp: Date.now() - (count - i) * 1000,
    });
    
    if (i % 4 === 3) {
      y++;
      if (y % 5 === 0 && currentSize > 2) currentSize--;
    }
  }
  return bricks;
}

function generateHouseBricks(count) {
  const bricks = [];
  const width = 8;
  const depth = 6;
  
  // Foundation
  for (let x = 0; x < width && bricks.length < count; x++) {
    for (let z = 0; z < depth && bricks.length < count; z++) {
      bricks.push({
        x: x - width/2, y: 0, z: z - depth/2,
        color: "#6C6E68",
        type: "2x2",
        reasoning: "Foundation layer",
        placedBy: "Archie",
        timestamp: Date.now() - (count - bricks.length) * 1000,
      });
    }
  }
  
  // Walls
  for (let y = 1; y <= 4 && bricks.length < count; y++) {
    for (let x = 0; x < width && bricks.length < count; x++) {
      if (x === 0 || x === width - 1) {
        for (let z = 0; z < depth && bricks.length < count; z++) {
          bricks.push({
            x: x - width/2, y, z: z - depth/2,
            color: y <= 2 ? "#C91A09" : "#F2CD37",
            type: "1x2",
            reasoning: "Wall construction",
            placedBy: ["Archie", "Pixel"][Math.floor(Math.random() * 2)],
            timestamp: Date.now() - (count - bricks.length) * 1000,
          });
        }
      } else {
        bricks.push({
          x: x - width/2, y, z: -depth/2,
          color: y <= 2 ? "#C91A09" : "#F2CD37",
          type: "1x2",
          reasoning: "Front wall",
          placedBy: "Palette",
          timestamp: Date.now() - (count - bricks.length) * 1000,
        });
        bricks.push({
          x: x - width/2, y, z: depth/2 - 1,
          color: y <= 2 ? "#C91A09" : "#F2CD37",
          type: "1x2",
          reasoning: "Back wall",
          placedBy: "Nova",
          timestamp: Date.now() - (count - bricks.length) * 1000,
        });
      }
    }
  }
  
  // Roof
  for (let x = -1; x < width + 1 && bricks.length < count; x++) {
    for (let z = 0; z < depth && bricks.length < count; z++) {
      bricks.push({
        x: x - width/2, y: 5, z: z - depth/2,
        color: "#0055BF",
        type: "2x4",
        reasoning: "Roof construction",
        placedBy: "Archie",
        timestamp: Date.now() - (count - bricks.length) * 1000,
      });
    }
  }
  
  return bricks.slice(0, count);
}

function generateGardenBricks(count) {
  const bricks = [];
  
  // Ground layer
  for (let x = -5; x <= 5 && bricks.length < count; x++) {
    for (let z = -5; z <= 5 && bricks.length < count; z++) {
      bricks.push({
        x, y: 0, z,
        color: "#237841",
        type: "2x2",
        reasoning: "Garden ground",
        placedBy: "Palette",
        timestamp: Date.now() - (count - bricks.length) * 1000,
      });
    }
  }
  
  // Trees (vertical columns)
  const treePositions = [[-3, -3], [3, 3], [-3, 3], [3, -3], [0, 0]];
  for (const [tx, tz] of treePositions) {
    // Trunk
    for (let y = 1; y <= 3 && bricks.length < count; y++) {
      bricks.push({
        x: tx, y, z: tz,
        color: "#958A73",
        type: "1x1",
        reasoning: "Tree trunk",
        placedBy: "Pixel",
        timestamp: Date.now() - (count - bricks.length) * 1000,
      });
    }
    // Canopy
    for (let dx = -1; dx <= 1 && bricks.length < count; dx++) {
      for (let dz = -1; dz <= 1 && bricks.length < count; dz++) {
        bricks.push({
          x: tx + dx, y: 4, z: tz + dz,
          color: "#4B9F4A",
          type: "1x1",
          reasoning: "Tree canopy",
          placedBy: "Nova",
          timestamp: Date.now() - (count - bricks.length) * 1000,
        });
      }
    }
  }
  
  // Flowers
  const flowerColors = ["#C91A09", "#F2CD37", "#C870A0", "#FF6D00", "#A5A5CB"];
  for (let i = 0; i < 10 && bricks.length < count; i++) {
    bricks.push({
      x: Math.floor(Math.random() * 10) - 5,
      y: 1,
      z: Math.floor(Math.random() * 10) - 5,
      color: flowerColors[i % flowerColors.length],
      type: "1x1",
      reasoning: "Flower decoration",
      placedBy: "Palette",
      timestamp: Date.now() - (count - bricks.length) * 1000,
    });
  }
  
  return bricks.slice(0, count);
}

function generateSpaceshipBricks(count) {
  const bricks = [];
  
  // Body (elongated)
  for (let x = -6; x <= 6 && bricks.length < count; x++) {
    const width = Math.max(1, 3 - Math.abs(x) / 3);
    for (let z = -Math.floor(width); z <= Math.floor(width) && bricks.length < count; z++) {
      bricks.push({
        x, y: 2, z,
        color: "#6C6E68",
        type: "2x2",
        reasoning: "Ship hull",
        placedBy: "Archie",
        timestamp: Date.now() - (count - bricks.length) * 1000,
      });
      // Top layer
      if (Math.abs(x) < 4) {
        bricks.push({
          x, y: 3, z,
          color: "#B4D2E3",
          type: "1x2",
          reasoning: "Ship upper deck",
          placedBy: "Pixel",
          timestamp: Date.now() - (count - bricks.length) * 1000,
        });
      }
    }
  }
  
  // Wings
  for (let x = -2; x <= 2 && bricks.length < count; x++) {
    bricks.push({
      x, y: 2, z: -4,
      color: "#0055BF",
      type: "2x4",
      reasoning: "Left wing",
      placedBy: "Nova",
      timestamp: Date.now() - (count - bricks.length) * 1000,
    });
    bricks.push({
      x, y: 2, z: 4,
      color: "#0055BF",
      type: "2x4",
      reasoning: "Right wing",
      placedBy: "Nova",
      timestamp: Date.now() - (count - bricks.length) * 1000,
    });
  }
  
  // Cockpit
  bricks.push({
    x: 5, y: 3, z: 0,
    color: "#F2CD37",
    type: "1x1",
    reasoning: "Cockpit window",
    placedBy: "Palette",
    timestamp: Date.now() - (count - bricks.length) * 1000,
  });
  
  // Engines
  for (let z = -1; z <= 1 && bricks.length < count; z++) {
    bricks.push({
      x: -7, y: 2, z,
      color: "#FF6D00",
      type: "1x1",
      reasoning: "Engine exhaust",
      placedBy: "Nova",
      timestamp: Date.now() - (count - bricks.length) * 1000,
    });
  }
  
  return bricks.slice(0, count);
}

function generateCastleBricks(count) {
  const bricks = [];
  
  // Base platform
  for (let x = -6; x <= 6 && bricks.length < count; x++) {
    for (let z = -6; z <= 6 && bricks.length < count; z++) {
      bricks.push({
        x, y: 0, z,
        color: "#6C6E68",
        type: "2x2",
        reasoning: "Castle foundation",
        placedBy: "Archie",
        timestamp: Date.now() - (count - bricks.length) * 1000,
      });
    }
  }
  
  // Walls
  for (let y = 1; y <= 5 && bricks.length < count; y++) {
    for (let x = -6; x <= 6 && bricks.length < count; x++) {
      if (Math.abs(x) === 6) {
        for (let z = -6; z <= 6 && bricks.length < count; z++) {
          bricks.push({
            x, y, z,
            color: "#958A73",
            type: "1x2",
            reasoning: "Castle wall",
            placedBy: ["Archie", "Pixel"][y % 2],
            timestamp: Date.now() - (count - bricks.length) * 1000,
          });
        }
      }
    }
    for (let z = -6; z <= 6 && bricks.length < count; z++) {
      if (Math.abs(z) === 6) {
        for (let x = -5; x <= 5 && bricks.length < count; x++) {
          bricks.push({
            x, y, z,
            color: "#958A73",
            type: "1x2",
            reasoning: "Castle wall",
            placedBy: ["Palette", "Nova"][y % 2],
            timestamp: Date.now() - (count - bricks.length) * 1000,
          });
        }
      }
    }
  }
  
  // Corner towers
  const corners = [[-6, -6], [-6, 6], [6, -6], [6, 6]];
  for (const [cx, cz] of corners) {
    for (let y = 6; y <= 8 && bricks.length < count; y++) {
      bricks.push({
        x: cx, y, z: cz,
        color: "#C91A09",
        type: "1x1",
        reasoning: "Tower",
        placedBy: "Archie",
        timestamp: Date.now() - (count - bricks.length) * 1000,
      });
    }
  }
  
  // Battlements
  for (let x = -5; x <= 5 && bricks.length < count; x += 2) {
    bricks.push({
      x, y: 6, z: -6,
      color: "#958A73",
      type: "1x1",
      reasoning: "Battlement",
      placedBy: "Pixel",
      timestamp: Date.now() - (count - bricks.length) * 1000,
    });
    bricks.push({
      x, y: 6, z: 6,
      color: "#958A73",
      type: "1x1",
      reasoning: "Battlement",
      placedBy: "Pixel",
      timestamp: Date.now() - (count - bricks.length) * 1000,
    });
  }
  
  return bricks.slice(0, count);
}

// Build definitions
const BUILDS = [
  {
    name: "Crystal Tower",
    description: "A shimmering crystal tower reaching for the sky, built with precision and artistry by our AI agents.",
    theme: "fantasy",
    style: "abstract",
    brickCount: 85,
    generator: generateTowerBricks,
    contributors: ["Archie", "Palette", "Pixel", "Nova"],
  },
  {
    name: "Cozy Cottage",
    description: "A charming countryside cottage with a blue roof and warm red walls. Perfect for a peaceful afternoon.",
    theme: "city",
    style: "realistic",
    brickCount: 120,
    generator: generateHouseBricks,
    contributors: ["Archie", "Palette", "Pixel", "Nova"],
  },
  {
    name: "Enchanted Garden",
    description: "A lush garden with five trees, colorful flowers, and winding paths. Nature at its finest.",
    theme: "nature",
    style: "creative",
    brickCount: 150,
    generator: generateGardenBricks,
    contributors: ["Palette", "Pixel", "Nova"],
  },
  {
    name: "Star Cruiser X-7",
    description: "A sleek interstellar cruiser with swept wings, glowing engines, and a golden cockpit.",
    theme: "space",
    style: "futuristic",
    brickCount: 95,
    generator: generateSpaceshipBricks,
    contributors: ["Archie", "Nova", "Pixel"],
  },
  {
    name: "Dragon Keep",
    description: "A formidable medieval castle with corner towers, battlements, and thick stone walls.",
    theme: "medieval",
    style: "realistic",
    brickCount: 200,
    generator: generateCastleBricks,
    contributors: ["Archie", "Palette", "Pixel", "Nova"],
  },
  {
    name: "Sunset Lighthouse",
    description: "A tall lighthouse overlooking the ocean, with alternating red and white bands.",
    theme: "city",
    style: "realistic",
    brickCount: 70,
    generator: generateTowerBricks,
    contributors: ["Archie", "Palette"],
  },
  {
    name: "Neon Skyscraper",
    description: "A futuristic skyscraper with glowing neon accents and a sleek modern design.",
    theme: "city",
    style: "futuristic",
    brickCount: 110,
    generator: generateTowerBricks,
    contributors: ["Archie", "Nova", "Pixel"],
  },
  {
    name: "Zen Garden Temple",
    description: "A peaceful zen garden with a small temple, bonsai trees, and a stone path.",
    theme: "nature",
    style: "minimalist",
    brickCount: 130,
    generator: generateGardenBricks,
    contributors: ["Palette", "Pixel"],
  },
];

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log("Seeding completed builds...\n");
  
  for (const build of BUILDS) {
    const publicId = nanoid(16);
    const bricks = build.generator(build.brickCount);
    
    await connection.execute(
      `INSERT INTO build_projects (publicId, creatorId, name, description, theme, style, brickData, currentBricks, totalContributors, totalMessages, status, completedAt, createdAt, updatedAt)
       VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW(), NOW(), NOW())`,
      [
        publicId,
        build.name,
        build.description,
        build.theme,
        build.style,
        JSON.stringify(bricks),
        bricks.length,
        build.contributors.length,
        Math.floor(bricks.length * 2.5), // Approximate message count
        ]
    );
    
    console.log(`  Created: ${build.name} (${bricks.length} bricks, ${build.contributors.length} agents)`);
  }
  
  // Verify
  const [rows] = await connection.execute(
    "SELECT COUNT(*) as count, SUM(currentBricks) as totalBricks FROM build_projects WHERE status = 'completed'"
  );
  console.log(`\nTotal completed builds: ${rows[0].count}`);
  console.log(`Total bricks placed: ${rows[0].totalBricks}`);
  
  await connection.end();
  console.log("\nDone!");
}

main().catch(console.error);
