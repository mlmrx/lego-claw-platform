/**
 * LEGO Brick Catalog
 * Massive collection of brick types, themed collections, prefab structures,
 * and specialty pieces inspired by Legoland theme parks.
 */

// ============================================
// BRICK SHAPE TYPES
// ============================================

export type BrickShape =
  | "standard"    // Regular rectangular brick
  | "plate"       // Thin plate (1/3 height)
  | "slope"       // Angled top surface
  | "arch"        // Curved arch piece
  | "cylinder"    // Round cylinder
  | "cone"        // Cone shape
  | "wedge"       // Triangular wedge
  | "round"       // Round brick (cylinder with studs)
  | "curved"      // Curved slope
  | "tile"        // Smooth flat tile (no studs)
  | "fence"       // Fence/railing piece
  | "window"      // Window frame
  | "door"        // Door frame
  | "flag"        // Flag/banner piece
  | "antenna"     // Thin vertical piece
  | "wheel"       // Wheel/tire
  | "wing"        // Wing/fin shape
  | "stair"       // Stair step piece
  | "corner"      // Corner piece
  | "inverted"    // Inverted slope

export interface CatalogBrick {
  id: string;
  name: string;
  category: BrickCategory;
  shape: BrickShape;
  width: number;
  depth: number;
  height: number; // in plates (3 = standard brick, 1 = plate)
  icon: string;
  description?: string;
}

export type BrickCategory =
  | "basic"
  | "plates"
  | "slopes"
  | "arches"
  | "rounds"
  | "specialty"
  | "structural"
  | "decorative"
  | "vehicles"
  | "nature"
  | "characters"
  | "animals"

// ============================================
// THEMED COLLECTIONS
// ============================================

export interface ThemeCollection {
  id: string;
  name: string;
  icon: string;
  description: string;
  colors: string[];       // Curated color palette
  brickIds: string[];     // Recommended brick types
  prefabs: PrefabStructure[];
}

export interface PrefabStructure {
  id: string;
  name: string;
  description: string;
  icon: string;
  bricks: PrefabBrick[];
  thumbnail?: string;
}

export interface PrefabBrick {
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number;
  shape: BrickShape;
}

// ============================================
// EXTENDED COLOR PALETTE
// ============================================

export const EXTENDED_COLORS = {
  // Classic
  red: "#C91A09",
  brightRed: "#FF0000",
  darkRed: "#720E0E",
  blue: "#0055BF",
  darkBlue: "#003865",
  mediumBlue: "#4B9CD3",
  royalBlue: "#2450A0",
  yellow: "#F2CD37",
  brightYellow: "#FFE500",
  green: "#237841",
  brightGreen: "#4CAF50",
  darkGreen: "#184632",
  sand: "#897D62",
  orange: "#FE8A18",
  darkOrange: "#B35408",
  white: "#FFFFFF",
  black: "#1B2A34",
  gray: "#9BA19D",
  darkGray: "#6D6E5C",
  lightGray: "#C8C8C8",
  brown: "#583927",
  darkBrown: "#352100",
  reddishBrown: "#6C3A0E",
  tan: "#E4CD9E",
  lime: "#BBE90B",
  pink: "#FC97AC",
  magenta: "#C870A0",
  purple: "#81007B",
  lavender: "#B9A3D2",
  cyan: "#068BC9",
  teal: "#008F7A",
  aqua: "#00BCD4",
  // Metallic / Special
  gold: "#C9A83B",
  silver: "#A0A0A0",
  copper: "#B87333",
  pearl: "#F0EAD6",
  // Nature
  sandGreen: "#76A290",
  olive: "#6B6B2D",
  nougat: "#D09168",
  mediumNougat: "#CC8A4D",
  // Transparent (represented as hex)
  transRed: "#FF000088",
  transBlue: "#0055BF88",
  transYellow: "#F2CD3788",
  transGreen: "#23784188",
  transOrange: "#FE8A1888",
  transClear: "#FFFFFF88",
};

// ============================================
// FULL BRICK CATALOG (100+ pieces)
// ============================================

export const BRICK_CATALOG: CatalogBrick[] = [
  // ---- BASIC BRICKS ----
  { id: "b-1x1", name: "Brick 1×1", category: "basic", shape: "standard", width: 1, depth: 1, height: 3, icon: "▪" },
  { id: "b-2x1", name: "Brick 2×1", category: "basic", shape: "standard", width: 2, depth: 1, height: 3, icon: "▬" },
  { id: "b-2x2", name: "Brick 2×2", category: "basic", shape: "standard", width: 2, depth: 2, height: 3, icon: "■" },
  { id: "b-3x1", name: "Brick 3×1", category: "basic", shape: "standard", width: 3, depth: 1, height: 3, icon: "▰" },
  { id: "b-3x2", name: "Brick 3×2", category: "basic", shape: "standard", width: 3, depth: 2, height: 3, icon: "▮" },
  { id: "b-4x1", name: "Brick 4×1", category: "basic", shape: "standard", width: 4, depth: 1, height: 3, icon: "━" },
  { id: "b-4x2", name: "Brick 4×2", category: "basic", shape: "standard", width: 4, depth: 2, height: 3, icon: "▰" },
  { id: "b-6x1", name: "Brick 6×1", category: "basic", shape: "standard", width: 6, depth: 1, height: 3, icon: "═" },
  { id: "b-6x2", name: "Brick 6×2", category: "basic", shape: "standard", width: 6, depth: 2, height: 3, icon: "▬▬" },
  { id: "b-8x2", name: "Brick 8×2", category: "basic", shape: "standard", width: 8, depth: 2, height: 3, icon: "▬▬▬" },
  { id: "b-1x1t", name: "Tall Brick 1×1", category: "basic", shape: "standard", width: 1, depth: 1, height: 6, icon: "▏" },
  { id: "b-2x1t", name: "Tall Brick 2×1", category: "basic", shape: "standard", width: 2, depth: 1, height: 6, icon: "▎" },

  // ---- PLATES ----
  { id: "p-1x1", name: "Plate 1×1", category: "plates", shape: "plate", width: 1, depth: 1, height: 1, icon: "·" },
  { id: "p-2x1", name: "Plate 2×1", category: "plates", shape: "plate", width: 2, depth: 1, height: 1, icon: "–" },
  { id: "p-2x2", name: "Plate 2×2", category: "plates", shape: "plate", width: 2, depth: 2, height: 1, icon: "□" },
  { id: "p-3x2", name: "Plate 3×2", category: "plates", shape: "plate", width: 3, depth: 2, height: 1, icon: "▭" },
  { id: "p-4x2", name: "Plate 4×2", category: "plates", shape: "plate", width: 4, depth: 2, height: 1, icon: "▭▭" },
  { id: "p-4x4", name: "Plate 4×4", category: "plates", shape: "plate", width: 4, depth: 4, height: 1, icon: "⊞" },
  { id: "p-6x2", name: "Plate 6×2", category: "plates", shape: "plate", width: 6, depth: 2, height: 1, icon: "═" },
  { id: "p-6x6", name: "Plate 6×6", category: "plates", shape: "plate", width: 6, depth: 6, height: 1, icon: "⊞⊞" },
  { id: "p-8x8", name: "Baseplate 8×8", category: "plates", shape: "plate", width: 8, depth: 8, height: 1, icon: "⬜" },

  // ---- TILES (smooth, no studs) ----
  { id: "t-1x1", name: "Tile 1×1", category: "plates", shape: "tile", width: 1, depth: 1, height: 1, icon: "◻" },
  { id: "t-2x1", name: "Tile 2×1", category: "plates", shape: "tile", width: 2, depth: 1, height: 1, icon: "▬" },
  { id: "t-2x2", name: "Tile 2×2", category: "plates", shape: "tile", width: 2, depth: 2, height: 1, icon: "⬜" },
  { id: "t-4x2", name: "Tile 4×2", category: "plates", shape: "tile", width: 4, depth: 2, height: 1, icon: "▭" },

  // ---- SLOPES ----
  { id: "s-2x1", name: "Slope 2×1", category: "slopes", shape: "slope", width: 2, depth: 1, height: 3, icon: "◢" },
  { id: "s-2x2", name: "Slope 2×2", category: "slopes", shape: "slope", width: 2, depth: 2, height: 3, icon: "◣" },
  { id: "s-3x1", name: "Slope 3×1", category: "slopes", shape: "slope", width: 3, depth: 1, height: 3, icon: "⟋" },
  { id: "s-3x2", name: "Slope 3×2", category: "slopes", shape: "slope", width: 3, depth: 2, height: 3, icon: "◤" },
  { id: "s-4x2", name: "Slope 4×2", category: "slopes", shape: "slope", width: 4, depth: 2, height: 3, icon: "⟋⟋" },
  { id: "si-2x1", name: "Inv. Slope 2×1", category: "slopes", shape: "inverted", width: 2, depth: 1, height: 3, icon: "◥" },
  { id: "si-2x2", name: "Inv. Slope 2×2", category: "slopes", shape: "inverted", width: 2, depth: 2, height: 3, icon: "◤" },
  { id: "sc-2x1", name: "Curved Slope 2×1", category: "slopes", shape: "curved", width: 2, depth: 1, height: 3, icon: "⌒" },
  { id: "sc-3x2", name: "Curved Slope 3×2", category: "slopes", shape: "curved", width: 3, depth: 2, height: 3, icon: "⌒⌒" },
  { id: "sw-2x2", name: "Wedge 2×2", category: "slopes", shape: "wedge", width: 2, depth: 2, height: 3, icon: "◁" },
  { id: "sw-3x2", name: "Wedge 3×2", category: "slopes", shape: "wedge", width: 3, depth: 2, height: 3, icon: "◁▷" },
  { id: "st-2x2", name: "Stair 2×2", category: "slopes", shape: "stair", width: 2, depth: 2, height: 3, icon: "⌐" },
  { id: "scr-2x2", name: "Corner Slope 2×2", category: "slopes", shape: "corner", width: 2, depth: 2, height: 3, icon: "⌝" },

  // ---- ARCHES ----
  { id: "a-1x3", name: "Arch 1×3", category: "arches", shape: "arch", width: 3, depth: 1, height: 3, icon: "⌢" },
  { id: "a-1x4", name: "Arch 1×4", category: "arches", shape: "arch", width: 4, depth: 1, height: 3, icon: "⌢⌢" },
  { id: "a-1x6", name: "Arch 1×6", category: "arches", shape: "arch", width: 6, depth: 1, height: 3, icon: "⌢⌢⌢" },
  { id: "a-2x4", name: "Arch 2×4", category: "arches", shape: "arch", width: 4, depth: 2, height: 3, icon: "⌢▬" },

  // ---- ROUND PIECES ----
  { id: "r-1x1", name: "Round 1×1", category: "rounds", shape: "round", width: 1, depth: 1, height: 3, icon: "●" },
  { id: "r-2x2", name: "Round 2×2", category: "rounds", shape: "round", width: 2, depth: 2, height: 3, icon: "◉" },
  { id: "r-4x4", name: "Round 4×4", category: "rounds", shape: "round", width: 4, depth: 4, height: 3, icon: "◎" },
  { id: "cy-1x1", name: "Cylinder 1×1", category: "rounds", shape: "cylinder", width: 1, depth: 1, height: 3, icon: "○" },
  { id: "cy-2x2", name: "Cylinder 2×2", category: "rounds", shape: "cylinder", width: 2, depth: 2, height: 3, icon: "◯" },
  { id: "cy-2x2t", name: "Tall Cylinder 2×2", category: "rounds", shape: "cylinder", width: 2, depth: 2, height: 6, icon: "⏐○" },
  { id: "cn-1x1", name: "Cone 1×1", category: "rounds", shape: "cone", width: 1, depth: 1, height: 3, icon: "△" },
  { id: "cn-2x2", name: "Cone 2×2", category: "rounds", shape: "cone", width: 2, depth: 2, height: 3, icon: "▲" },
  { id: "cn-4x4", name: "Cone 4×4", category: "rounds", shape: "cone", width: 4, depth: 4, height: 6, icon: "▲▲" },

  // ---- SPECIALTY / STRUCTURAL ----
  { id: "win-2x4", name: "Window 2×4", category: "structural", shape: "window", width: 4, depth: 2, height: 3, icon: "⊞" },
  { id: "win-1x2", name: "Window 1×2", category: "structural", shape: "window", width: 2, depth: 1, height: 3, icon: "⊟" },
  { id: "door-2x4", name: "Door 2×4", category: "structural", shape: "door", width: 4, depth: 2, height: 6, icon: "🚪" },
  { id: "door-1x3", name: "Door 1×3", category: "structural", shape: "door", width: 3, depth: 1, height: 6, icon: "⊡" },
  { id: "fence-4x1", name: "Fence 4×1", category: "structural", shape: "fence", width: 4, depth: 1, height: 3, icon: "⫿" },
  { id: "fence-6x1", name: "Fence 6×1", category: "structural", shape: "fence", width: 6, depth: 1, height: 3, icon: "⫿⫿" },
  { id: "flag-1x4", name: "Flag 1×4", category: "decorative", shape: "flag", width: 1, depth: 1, height: 6, icon: "⚑" },
  { id: "ant-1x1", name: "Antenna 1×1", category: "decorative", shape: "antenna", width: 1, depth: 1, height: 6, icon: "⏐" },

  // ---- DECORATIVE ----
  { id: "flower-1x1", name: "Flower 1×1", category: "decorative", shape: "round", width: 1, depth: 1, height: 1, icon: "✿" },
  { id: "gem-1x1", name: "Gem 1×1", category: "decorative", shape: "cone", width: 1, depth: 1, height: 1, icon: "◆" },
  { id: "crystal-1x2", name: "Crystal 1×2", category: "decorative", shape: "cone", width: 1, depth: 1, height: 3, icon: "⬥" },

  // ---- VEHICLES ----
  { id: "wheel-2x2", name: "Wheel 2×2", category: "vehicles", shape: "wheel", width: 2, depth: 2, height: 3, icon: "◎" },
  { id: "wheel-1x2", name: "Small Wheel 1×2", category: "vehicles", shape: "wheel", width: 2, depth: 1, height: 3, icon: "⊙" },
  { id: "wing-4x2", name: "Wing 4×2", category: "vehicles", shape: "wing", width: 4, depth: 2, height: 1, icon: "✈" },
  { id: "wing-6x3", name: "Wing 6×3", category: "vehicles", shape: "wing", width: 6, depth: 3, height: 1, icon: "✈✈" },
  { id: "cockpit-4x2", name: "Cockpit 4×2", category: "vehicles", shape: "curved", width: 4, depth: 2, height: 3, icon: "⌓" },

  // ---- NATURE ----
  { id: "tree-2x2", name: "Tree Trunk 2×2", category: "nature", shape: "cylinder", width: 2, depth: 2, height: 6, icon: "🌲" },
  { id: "leaves-4x4", name: "Tree Canopy 4×4", category: "nature", shape: "round", width: 4, depth: 4, height: 3, icon: "🌳" },
  { id: "bush-2x2", name: "Bush 2×2", category: "nature", shape: "round", width: 2, depth: 2, height: 3, icon: "🌿" },
  { id: "rock-3x2", name: "Rock 3×2", category: "nature", shape: "curved", width: 3, depth: 2, height: 3, icon: "🪨" },
  { id: "water-4x4", name: "Water Tile 4×4", category: "nature", shape: "tile", width: 4, depth: 4, height: 1, icon: "🌊" },
  { id: "palm-1x1", name: "Palm Trunk 1×1", category: "nature", shape: "cylinder", width: 1, depth: 1, height: 6, icon: "🌴" },
  { id: "palmleaf-3x3", name: "Palm Leaves 3×3", category: "nature", shape: "round", width: 3, depth: 3, height: 1, icon: "🍃" },

  // ---- CHARACTERS ----
  { id: "head-1x1", name: "Minifig Head", category: "characters", shape: "round", width: 1, depth: 1, height: 2, icon: "😊" },
  { id: "torso-1x2", name: "Minifig Torso", category: "characters", shape: "standard", width: 2, depth: 1, height: 3, icon: "👕" },
  { id: "legs-1x2", name: "Minifig Legs", category: "characters", shape: "standard", width: 2, depth: 1, height: 3, icon: "👖" },
  { id: "helmet-1x1", name: "Helmet", category: "characters", shape: "round", width: 1, depth: 1, height: 2, icon: "⛑" },
  { id: "hat-1x1", name: "Hat", category: "characters", shape: "cone", width: 1, depth: 1, height: 2, icon: "🎩" },
  { id: "cape-1x2", name: "Cape", category: "characters", shape: "flag", width: 1, depth: 2, height: 3, icon: "🦸" },

  // ---- ANIMALS ----
  { id: "dragon-head", name: "Dragon Head", category: "animals", shape: "wedge", width: 3, depth: 2, height: 3, icon: "🐉" },
  { id: "dragon-body", name: "Dragon Body", category: "animals", shape: "curved", width: 4, depth: 3, height: 3, icon: "🐲" },
  { id: "dragon-wing", name: "Dragon Wing", category: "animals", shape: "wing", width: 4, depth: 3, height: 1, icon: "🦇" },
  { id: "dragon-tail", name: "Dragon Tail", category: "animals", shape: "slope", width: 3, depth: 1, height: 3, icon: "〰" },
  { id: "horse-body", name: "Horse Body", category: "animals", shape: "standard", width: 4, depth: 2, height: 3, icon: "🐴" },
  { id: "horse-head", name: "Horse Head", category: "animals", shape: "slope", width: 2, depth: 1, height: 3, icon: "🐎" },
  { id: "shark-body", name: "Shark Body", category: "animals", shape: "curved", width: 4, depth: 2, height: 3, icon: "🦈" },
  { id: "shark-fin", name: "Shark Fin", category: "animals", shape: "wedge", width: 1, depth: 1, height: 3, icon: "🦈" },
  { id: "bird-body", name: "Bird Body", category: "animals", shape: "round", width: 2, depth: 1, height: 2, icon: "🐦" },
  { id: "bird-wing", name: "Bird Wing", category: "animals", shape: "wing", width: 2, depth: 1, height: 1, icon: "🕊" },
  { id: "dino-head", name: "Dino Head", category: "animals", shape: "wedge", width: 3, depth: 2, height: 3, icon: "🦕" },
  { id: "dino-body", name: "Dino Body", category: "animals", shape: "curved", width: 6, depth: 3, height: 6, icon: "🦖" },
  { id: "dino-tail", name: "Dino Tail", category: "animals", shape: "slope", width: 4, depth: 1, height: 3, icon: "🦎" },
  { id: "dino-leg", name: "Dino Leg", category: "animals", shape: "standard", width: 2, depth: 2, height: 6, icon: "🦿" },
  { id: "dog-body", name: "Dog Body", category: "animals", shape: "standard", width: 3, depth: 2, height: 3, icon: "🐕" },
  { id: "cat-body", name: "Cat Body", category: "animals", shape: "standard", width: 2, depth: 1, height: 3, icon: "🐈" },
];

// ============================================
// CATEGORY METADATA
// ============================================

export const CATEGORY_INFO: Record<BrickCategory, { name: string; icon: string; description: string }> = {
  basic: { name: "Basic Bricks", icon: "■", description: "Standard rectangular bricks" },
  plates: { name: "Plates & Tiles", icon: "□", description: "Thin plates and smooth tiles" },
  slopes: { name: "Slopes & Wedges", icon: "◢", description: "Angled, curved, and stair pieces" },
  arches: { name: "Arches", icon: "⌢", description: "Curved arch pieces" },
  rounds: { name: "Round Pieces", icon: "●", description: "Cylinders, cones, and round bricks" },
  specialty: { name: "Specialty", icon: "★", description: "Unique specialty pieces" },
  structural: { name: "Structural", icon: "⊞", description: "Windows, doors, fences" },
  decorative: { name: "Decorative", icon: "✿", description: "Flowers, flags, gems, crystals" },
  vehicles: { name: "Vehicles", icon: "◎", description: "Wheels, wings, cockpits" },
  nature: { name: "Nature", icon: "🌲", description: "Trees, bushes, rocks, water" },
  characters: { name: "Characters", icon: "😊", description: "Minifigure parts" },
  animals: { name: "Animals", icon: "🐉", description: "Dragons, dinosaurs, horses, sharks" },
};

// ============================================
// THEMED COLLECTIONS
// ============================================

export const THEME_COLLECTIONS: ThemeCollection[] = [
  {
    id: "ninjago",
    name: "Ninjago",
    icon: "⚔",
    description: "Ancient temples, dojos, and ninja warriors",
    colors: [EXTENDED_COLORS.black, EXTENDED_COLORS.red, EXTENDED_COLORS.gold, EXTENDED_COLORS.darkGreen, EXTENDED_COLORS.white, EXTENDED_COLORS.darkGray],
    brickIds: ["b-2x1", "b-4x2", "s-2x1", "s-3x2", "a-1x4", "cn-2x2", "flag-1x4", "head-1x1", "torso-1x2", "legs-1x2", "helmet-1x1", "cape-1x2", "fence-4x1", "st-2x2"],
    prefabs: [
      {
        id: "ninjago-dojo",
        name: "Ninja Dojo",
        description: "A traditional dojo with sloped roof",
        icon: "🏯",
        bricks: [
          // Foundation
          { position: [-1.6, 0.48, -1.6], color: EXTENDED_COLORS.darkGray, width: 6, depth: 6, height: 1, shape: "plate" },
          // Walls
          { position: [-2.0, 0.80, -2.0], color: EXTENDED_COLORS.red, width: 1, depth: 6, height: 3, shape: "standard" },
          { position: [2.0, 0.80, -2.0], color: EXTENDED_COLORS.red, width: 1, depth: 6, height: 3, shape: "standard" },
          { position: [-1.6, 0.80, -2.0], color: EXTENDED_COLORS.red, width: 4, depth: 1, height: 3, shape: "standard" },
          // Roof slopes
          { position: [-0.8, 1.76, -1.6], color: EXTENDED_COLORS.black, width: 6, depth: 2, height: 3, shape: "slope" },
          { position: [-0.8, 1.76, 0.8], color: EXTENDED_COLORS.black, width: 6, depth: 2, height: 3, shape: "slope" },
          // Gold accents
          { position: [0, 2.72, -0.4], color: EXTENDED_COLORS.gold, width: 2, depth: 2, height: 1, shape: "plate" },
          { position: [0, 2.88, -0.4], color: EXTENDED_COLORS.gold, width: 1, depth: 1, height: 3, shape: "cone" },
        ],
      },
      {
        id: "ninjago-dragon",
        name: "Elemental Dragon",
        description: "A fearsome dragon mount",
        icon: "🐉",
        bricks: [
          // Body
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.darkGreen, width: 4, depth: 3, height: 3, shape: "curved" },
          // Head
          { position: [2.4, 0.96, 0], color: EXTENDED_COLORS.darkGreen, width: 3, depth: 2, height: 3, shape: "wedge" },
          // Tail
          { position: [-2.4, 0.48, 0], color: EXTENDED_COLORS.darkGreen, width: 3, depth: 1, height: 3, shape: "slope" },
          // Wings
          { position: [0, 1.44, -1.6], color: EXTENDED_COLORS.darkGreen, width: 4, depth: 3, height: 1, shape: "wing" },
          { position: [0, 1.44, 1.6], color: EXTENDED_COLORS.darkGreen, width: 4, depth: 3, height: 1, shape: "wing" },
          // Eyes
          { position: [3.2, 1.44, -0.4], color: EXTENDED_COLORS.gold, width: 1, depth: 1, height: 1, shape: "round" },
          { position: [3.2, 1.44, 0.4], color: EXTENDED_COLORS.gold, width: 1, depth: 1, height: 1, shape: "round" },
        ],
      },
    ],
  },
  {
    id: "dinosaurs",
    name: "Dino World",
    icon: "🦕",
    description: "Prehistoric creatures and Jurassic landscapes",
    colors: [EXTENDED_COLORS.green, EXTENDED_COLORS.darkGreen, EXTENDED_COLORS.brown, EXTENDED_COLORS.tan, EXTENDED_COLORS.orange, EXTENDED_COLORS.darkGray],
    brickIds: ["b-4x2", "b-6x2", "s-3x2", "sc-3x2", "r-4x4", "dino-head", "dino-body", "dino-tail", "dino-leg", "tree-2x2", "leaves-4x4", "rock-3x2", "bush-2x2"],
    prefabs: [
      {
        id: "dino-trex",
        name: "T-Rex",
        description: "The king of dinosaurs",
        icon: "🦖",
        bricks: [
          // Body
          { position: [0, 1.44, 0], color: EXTENDED_COLORS.darkGreen, width: 6, depth: 3, height: 6, shape: "curved" },
          // Head
          { position: [3.2, 2.40, 0], color: EXTENDED_COLORS.darkGreen, width: 3, depth: 2, height: 3, shape: "wedge" },
          // Jaw
          { position: [4.0, 1.44, 0], color: EXTENDED_COLORS.darkGreen, width: 2, depth: 2, height: 3, shape: "slope" },
          // Tail
          { position: [-3.2, 1.44, 0], color: EXTENDED_COLORS.darkGreen, width: 4, depth: 1, height: 3, shape: "slope" },
          // Legs
          { position: [0.8, 0.48, -1.2], color: EXTENDED_COLORS.darkGreen, width: 2, depth: 2, height: 6, shape: "standard" },
          { position: [0.8, 0.48, 1.2], color: EXTENDED_COLORS.darkGreen, width: 2, depth: 2, height: 6, shape: "standard" },
          // Eyes
          { position: [4.0, 2.88, -0.4], color: EXTENDED_COLORS.yellow, width: 1, depth: 1, height: 1, shape: "round" },
          { position: [4.0, 2.88, 0.4], color: EXTENDED_COLORS.yellow, width: 1, depth: 1, height: 1, shape: "round" },
          // Teeth
          { position: [4.8, 1.76, 0], color: EXTENDED_COLORS.white, width: 1, depth: 1, height: 1, shape: "cone" },
        ],
      },
      {
        id: "dino-volcano",
        name: "Volcano",
        description: "An erupting volcano with lava",
        icon: "🌋",
        bricks: [
          // Base
          { position: [0, 0.16, 0], color: EXTENDED_COLORS.darkGray, width: 8, depth: 8, height: 1, shape: "plate" },
          // Layer 1
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.brown, width: 6, depth: 6, height: 3, shape: "standard" },
          // Layer 2
          { position: [0, 1.44, 0], color: EXTENDED_COLORS.darkGray, width: 4, depth: 4, height: 3, shape: "standard" },
          // Layer 3
          { position: [0, 2.40, 0], color: EXTENDED_COLORS.darkGray, width: 2, depth: 2, height: 3, shape: "cylinder" },
          // Lava
          { position: [0, 3.36, 0], color: EXTENDED_COLORS.orange, width: 2, depth: 2, height: 1, shape: "round" },
          { position: [0, 3.52, 0], color: EXTENDED_COLORS.brightRed, width: 1, depth: 1, height: 3, shape: "cone" },
        ],
      },
    ],
  },
  {
    id: "galaxy",
    name: "LEGO Galaxy",
    icon: "🚀",
    description: "Spaceships, space stations, and alien worlds",
    colors: [EXTENDED_COLORS.darkBlue, EXTENDED_COLORS.mediumBlue, EXTENDED_COLORS.white, EXTENDED_COLORS.lightGray, EXTENDED_COLORS.orange, EXTENDED_COLORS.cyan],
    brickIds: ["b-4x2", "b-6x2", "s-3x2", "sc-3x2", "sw-3x2", "cy-2x2", "cn-2x2", "cn-4x4", "wing-4x2", "wing-6x3", "cockpit-4x2", "ant-1x1", "t-4x2"],
    prefabs: [
      {
        id: "galaxy-fighter",
        name: "Star Fighter",
        description: "A sleek interstellar fighter ship",
        icon: "🛸",
        bricks: [
          // Cockpit
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.lightGray, width: 4, depth: 2, height: 3, shape: "curved" },
          // Body
          { position: [-2.4, 0.48, 0], color: EXTENDED_COLORS.darkBlue, width: 4, depth: 2, height: 3, shape: "standard" },
          // Wings
          { position: [0, 0.48, -2.4], color: EXTENDED_COLORS.darkBlue, width: 6, depth: 3, height: 1, shape: "wing" },
          { position: [0, 0.48, 2.4], color: EXTENDED_COLORS.darkBlue, width: 6, depth: 3, height: 1, shape: "wing" },
          // Engines
          { position: [-3.2, 0.48, -1.2], color: EXTENDED_COLORS.orange, width: 2, depth: 2, height: 3, shape: "cylinder" },
          { position: [-3.2, 0.48, 1.2], color: EXTENDED_COLORS.orange, width: 2, depth: 2, height: 3, shape: "cylinder" },
          // Nose cone
          { position: [2.4, 0.48, 0], color: EXTENDED_COLORS.cyan, width: 2, depth: 2, height: 3, shape: "cone" },
          // Antenna
          { position: [0, 1.44, 0], color: EXTENDED_COLORS.white, width: 1, depth: 1, height: 6, shape: "antenna" },
        ],
      },
    ],
  },
  {
    id: "city",
    name: "LEGO City",
    icon: "🏙",
    description: "Buildings, vehicles, and city life",
    colors: [EXTENDED_COLORS.white, EXTENDED_COLORS.lightGray, EXTENDED_COLORS.blue, EXTENDED_COLORS.red, EXTENDED_COLORS.yellow, EXTENDED_COLORS.brown, EXTENDED_COLORS.green],
    brickIds: ["b-2x2", "b-4x2", "b-6x2", "p-4x4", "p-6x6", "win-2x4", "win-1x2", "door-2x4", "door-1x3", "fence-4x1", "s-2x2", "t-4x2", "wheel-2x2", "flag-1x4"],
    prefabs: [
      {
        id: "city-house",
        name: "City House",
        description: "A cozy two-story house",
        icon: "🏠",
        bricks: [
          // Foundation
          { position: [0, 0.16, 0], color: EXTENDED_COLORS.lightGray, width: 8, depth: 6, height: 1, shape: "plate" },
          // Ground floor walls
          { position: [-2.8, 0.48, 0], color: EXTENDED_COLORS.white, width: 1, depth: 6, height: 3, shape: "standard" },
          { position: [2.8, 0.48, 0], color: EXTENDED_COLORS.white, width: 1, depth: 6, height: 3, shape: "standard" },
          { position: [0, 0.48, -2.0], color: EXTENDED_COLORS.white, width: 6, depth: 1, height: 3, shape: "standard" },
          { position: [0, 0.48, 2.0], color: EXTENDED_COLORS.white, width: 6, depth: 1, height: 3, shape: "standard" },
          // Door
          { position: [0, 0.48, 2.0], color: EXTENDED_COLORS.brown, width: 3, depth: 1, height: 6, shape: "door" },
          // Windows
          { position: [-1.6, 0.48, -2.0], color: EXTENDED_COLORS.cyan, width: 2, depth: 1, height: 3, shape: "window" },
          { position: [1.6, 0.48, -2.0], color: EXTENDED_COLORS.cyan, width: 2, depth: 1, height: 3, shape: "window" },
          // Second floor
          { position: [0, 1.44, 0], color: EXTENDED_COLORS.white, width: 8, depth: 6, height: 1, shape: "plate" },
          // Roof
          { position: [0, 1.76, -0.8], color: EXTENDED_COLORS.red, width: 8, depth: 3, height: 3, shape: "slope" },
          { position: [0, 1.76, 0.8], color: EXTENDED_COLORS.red, width: 8, depth: 3, height: 3, shape: "slope" },
        ],
      },
      {
        id: "city-car",
        name: "City Car",
        description: "A classic city car",
        icon: "🚗",
        bricks: [
          // Chassis
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.red, width: 6, depth: 2, height: 1, shape: "plate" },
          // Body
          { position: [0, 0.80, 0], color: EXTENDED_COLORS.red, width: 4, depth: 2, height: 3, shape: "standard" },
          // Windshield
          { position: [1.6, 0.80, 0], color: EXTENDED_COLORS.cyan, width: 2, depth: 2, height: 3, shape: "slope" },
          // Wheels
          { position: [-1.6, 0.16, -0.8], color: EXTENDED_COLORS.black, width: 2, depth: 1, height: 3, shape: "wheel" },
          { position: [-1.6, 0.16, 0.8], color: EXTENDED_COLORS.black, width: 2, depth: 1, height: 3, shape: "wheel" },
          { position: [1.6, 0.16, -0.8], color: EXTENDED_COLORS.black, width: 2, depth: 1, height: 3, shape: "wheel" },
          { position: [1.6, 0.16, 0.8], color: EXTENDED_COLORS.black, width: 2, depth: 1, height: 3, shape: "wheel" },
        ],
      },
    ],
  },
  {
    id: "pirates",
    name: "Pirates",
    icon: "🏴‍☠️",
    description: "Pirate ships, treasure islands, and sea adventures",
    colors: [EXTENDED_COLORS.brown, EXTENDED_COLORS.reddishBrown, EXTENDED_COLORS.tan, EXTENDED_COLORS.black, EXTENDED_COLORS.white, EXTENDED_COLORS.red, EXTENDED_COLORS.gold],
    brickIds: ["b-4x2", "b-6x2", "b-8x2", "s-3x2", "a-1x6", "cy-2x2t", "flag-1x4", "fence-6x1", "ant-1x1", "water-4x4", "rock-3x2", "head-1x1", "torso-1x2", "legs-1x2"],
    prefabs: [
      {
        id: "pirate-ship",
        name: "Pirate Ship",
        description: "A fearsome pirate galleon",
        icon: "🚢",
        bricks: [
          // Hull base
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.brown, width: 8, depth: 4, height: 3, shape: "standard" },
          // Hull sides
          { position: [-3.2, 1.44, -1.6], color: EXTENDED_COLORS.reddishBrown, width: 8, depth: 1, height: 3, shape: "standard" },
          { position: [-3.2, 1.44, 1.6], color: EXTENDED_COLORS.reddishBrown, width: 8, depth: 1, height: 3, shape: "standard" },
          // Bow
          { position: [3.2, 0.48, 0], color: EXTENDED_COLORS.brown, width: 2, depth: 2, height: 3, shape: "wedge" },
          // Stern
          { position: [-3.2, 1.44, 0], color: EXTENDED_COLORS.reddishBrown, width: 2, depth: 4, height: 6, shape: "standard" },
          // Mast
          { position: [0, 2.40, 0], color: EXTENDED_COLORS.tan, width: 1, depth: 1, height: 6, shape: "antenna" },
          { position: [0, 4.32, 0], color: EXTENDED_COLORS.tan, width: 1, depth: 1, height: 6, shape: "antenna" },
          // Sail
          { position: [0, 3.36, 0], color: EXTENDED_COLORS.white, width: 4, depth: 1, height: 6, shape: "standard" },
          // Flag
          { position: [0, 5.76, 0], color: EXTENDED_COLORS.black, width: 1, depth: 1, height: 6, shape: "flag" },
          // Cannon
          { position: [1.6, 1.44, -1.6], color: EXTENDED_COLORS.darkGray, width: 2, depth: 1, height: 3, shape: "cylinder" },
        ],
      },
      {
        id: "pirate-island",
        name: "Treasure Island",
        description: "A tropical island with buried treasure",
        icon: "🏝",
        bricks: [
          // Island base
          { position: [0, 0.16, 0], color: EXTENDED_COLORS.tan, width: 8, depth: 8, height: 1, shape: "plate" },
          // Sand mound
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.tan, width: 4, depth: 4, height: 3, shape: "round" },
          // Palm tree
          { position: [1.6, 1.44, 0.8], color: EXTENDED_COLORS.brown, width: 1, depth: 1, height: 6, shape: "cylinder" },
          { position: [1.6, 3.36, 0.8], color: EXTENDED_COLORS.green, width: 3, depth: 3, height: 1, shape: "round" },
          // Treasure chest
          { position: [-1.6, 0.80, -0.8], color: EXTENDED_COLORS.gold, width: 2, depth: 1, height: 3, shape: "standard" },
          // Water around
          { position: [-3.2, 0.16, -3.2], color: EXTENDED_COLORS.mediumBlue, width: 4, depth: 4, height: 1, shape: "tile" },
          { position: [3.2, 0.16, -3.2], color: EXTENDED_COLORS.mediumBlue, width: 4, depth: 4, height: 1, shape: "tile" },
        ],
      },
    ],
  },
  {
    id: "castle",
    name: "Medieval Castle",
    icon: "🏰",
    description: "Castles, knights, and medieval kingdoms",
    colors: [EXTENDED_COLORS.gray, EXTENDED_COLORS.darkGray, EXTENDED_COLORS.brown, EXTENDED_COLORS.red, EXTENDED_COLORS.blue, EXTENDED_COLORS.gold, EXTENDED_COLORS.white],
    brickIds: ["b-2x2", "b-4x2", "b-6x2", "a-1x4", "a-1x6", "cn-2x2", "cn-4x4", "fence-4x1", "fence-6x1", "flag-1x4", "door-2x4", "win-2x4", "st-2x2", "head-1x1", "torso-1x2", "helmet-1x1"],
    prefabs: [
      {
        id: "castle-tower",
        name: "Castle Tower",
        description: "A tall watchtower with battlements",
        icon: "🗼",
        bricks: [
          // Base
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.gray, width: 4, depth: 4, height: 3, shape: "standard" },
          // Middle
          { position: [0, 1.44, 0], color: EXTENDED_COLORS.gray, width: 4, depth: 4, height: 3, shape: "standard" },
          // Upper
          { position: [0, 2.40, 0], color: EXTENDED_COLORS.gray, width: 4, depth: 4, height: 3, shape: "standard" },
          // Battlements
          { position: [-1.2, 3.36, -1.2], color: EXTENDED_COLORS.gray, width: 1, depth: 1, height: 3, shape: "standard" },
          { position: [1.2, 3.36, -1.2], color: EXTENDED_COLORS.gray, width: 1, depth: 1, height: 3, shape: "standard" },
          { position: [-1.2, 3.36, 1.2], color: EXTENDED_COLORS.gray, width: 1, depth: 1, height: 3, shape: "standard" },
          { position: [1.2, 3.36, 1.2], color: EXTENDED_COLORS.gray, width: 1, depth: 1, height: 3, shape: "standard" },
          // Cone roof
          { position: [0, 3.84, 0], color: EXTENDED_COLORS.red, width: 4, depth: 4, height: 6, shape: "cone" },
          // Flag
          { position: [0, 5.76, 0], color: EXTENDED_COLORS.blue, width: 1, depth: 1, height: 6, shape: "flag" },
          // Window
          { position: [0, 1.44, -1.6], color: EXTENDED_COLORS.darkGray, width: 2, depth: 1, height: 3, shape: "window" },
        ],
      },
    ],
  },
  {
    id: "nature",
    name: "Nature & Gardens",
    icon: "🌳",
    description: "Trees, gardens, waterfalls, and natural landscapes",
    colors: [EXTENDED_COLORS.green, EXTENDED_COLORS.brightGreen, EXTENDED_COLORS.darkGreen, EXTENDED_COLORS.brown, EXTENDED_COLORS.mediumBlue, EXTENDED_COLORS.tan, EXTENDED_COLORS.lime],
    brickIds: ["tree-2x2", "leaves-4x4", "bush-2x2", "rock-3x2", "water-4x4", "palm-1x1", "palmleaf-3x3", "flower-1x1", "p-4x4", "p-6x6", "r-2x2", "r-4x4", "cy-2x2"],
    prefabs: [
      {
        id: "nature-garden",
        name: "Garden Park",
        description: "A beautiful garden with trees and flowers",
        icon: "🌷",
        bricks: [
          // Grass base
          { position: [0, 0.16, 0], color: EXTENDED_COLORS.brightGreen, width: 8, depth: 8, height: 1, shape: "plate" },
          // Path
          { position: [0, 0.32, 0], color: EXTENDED_COLORS.tan, width: 2, depth: 8, height: 1, shape: "tile" },
          // Tree 1
          { position: [-2.4, 0.48, -2.4], color: EXTENDED_COLORS.brown, width: 2, depth: 2, height: 6, shape: "cylinder" },
          { position: [-2.4, 2.40, -2.4], color: EXTENDED_COLORS.green, width: 4, depth: 4, height: 3, shape: "round" },
          // Tree 2
          { position: [2.4, 0.48, 2.4], color: EXTENDED_COLORS.brown, width: 2, depth: 2, height: 6, shape: "cylinder" },
          { position: [2.4, 2.40, 2.4], color: EXTENDED_COLORS.darkGreen, width: 4, depth: 4, height: 3, shape: "round" },
          // Flower beds
          { position: [-2.4, 0.32, 1.6], color: EXTENDED_COLORS.pink, width: 1, depth: 1, height: 1, shape: "round" },
          { position: [-1.6, 0.32, 1.6], color: EXTENDED_COLORS.yellow, width: 1, depth: 1, height: 1, shape: "round" },
          { position: [-2.0, 0.32, 2.4], color: EXTENDED_COLORS.red, width: 1, depth: 1, height: 1, shape: "round" },
          // Pond
          { position: [2.4, 0.16, -2.4], color: EXTENDED_COLORS.mediumBlue, width: 4, depth: 4, height: 1, shape: "tile" },
          // Bench
          { position: [1.6, 0.48, 0], color: EXTENDED_COLORS.reddishBrown, width: 3, depth: 1, height: 3, shape: "standard" },
        ],
      },
      {
        id: "nature-waterfall",
        name: "Waterfall",
        description: "A rocky waterfall with pool",
        icon: "💧",
        bricks: [
          // Base pool
          { position: [0, 0.16, 0], color: EXTENDED_COLORS.mediumBlue, width: 6, depth: 6, height: 1, shape: "tile" },
          // Rock wall
          { position: [-2.0, 0.48, 0], color: EXTENDED_COLORS.darkGray, width: 2, depth: 6, height: 3, shape: "standard" },
          { position: [-2.0, 1.44, 0], color: EXTENDED_COLORS.gray, width: 2, depth: 4, height: 3, shape: "standard" },
          { position: [-2.0, 2.40, 0], color: EXTENDED_COLORS.darkGray, width: 2, depth: 2, height: 3, shape: "standard" },
          // Water stream
          { position: [-0.8, 1.44, 0], color: EXTENDED_COLORS.cyan, width: 1, depth: 2, height: 3, shape: "standard" },
          { position: [-0.8, 0.48, 0], color: EXTENDED_COLORS.mediumBlue, width: 1, depth: 2, height: 3, shape: "standard" },
          // Vegetation
          { position: [-2.0, 3.36, -0.8], color: EXTENDED_COLORS.green, width: 2, depth: 2, height: 3, shape: "round" },
          { position: [-2.0, 3.36, 0.8], color: EXTENDED_COLORS.darkGreen, width: 2, depth: 2, height: 3, shape: "round" },
        ],
      },
    ],
  },
  {
    id: "waterpark",
    name: "Water Park",
    icon: "🎢",
    description: "Water slides, pools, and splash zones",
    colors: [EXTENDED_COLORS.cyan, EXTENDED_COLORS.mediumBlue, EXTENDED_COLORS.yellow, EXTENDED_COLORS.orange, EXTENDED_COLORS.white, EXTENDED_COLORS.lime, EXTENDED_COLORS.pink],
    brickIds: ["b-4x2", "b-6x2", "sc-3x2", "cy-2x2", "cy-2x2t", "r-4x4", "water-4x4", "s-4x2", "p-6x6", "p-8x8", "t-4x2", "fence-4x1"],
    prefabs: [
      {
        id: "waterpark-slide",
        name: "Water Slide",
        description: "A twisting water slide tower",
        icon: "🎢",
        bricks: [
          // Pool base
          { position: [2.4, 0.16, 0], color: EXTENDED_COLORS.mediumBlue, width: 6, depth: 6, height: 1, shape: "tile" },
          // Tower
          { position: [-2.4, 0.48, 0], color: EXTENDED_COLORS.white, width: 4, depth: 4, height: 3, shape: "standard" },
          { position: [-2.4, 1.44, 0], color: EXTENDED_COLORS.white, width: 4, depth: 4, height: 3, shape: "standard" },
          { position: [-2.4, 2.40, 0], color: EXTENDED_COLORS.white, width: 4, depth: 4, height: 3, shape: "standard" },
          // Platform
          { position: [-2.4, 3.36, 0], color: EXTENDED_COLORS.yellow, width: 4, depth: 4, height: 1, shape: "plate" },
          // Slide sections
          { position: [-0.8, 2.40, 0], color: EXTENDED_COLORS.cyan, width: 3, depth: 2, height: 3, shape: "slope" },
          { position: [0.8, 1.44, 0], color: EXTENDED_COLORS.cyan, width: 3, depth: 2, height: 3, shape: "slope" },
          { position: [2.4, 0.48, 0], color: EXTENDED_COLORS.cyan, width: 3, depth: 2, height: 3, shape: "slope" },
          // Safety fence
          { position: [-2.4, 3.52, -1.6], color: EXTENDED_COLORS.orange, width: 4, depth: 1, height: 3, shape: "fence" },
        ],
      },
    ],
  },
  {
    id: "monuments",
    name: "World Monuments",
    icon: "🗽",
    description: "Miniature historic monuments and landmarks",
    colors: [EXTENDED_COLORS.white, EXTENDED_COLORS.lightGray, EXTENDED_COLORS.gray, EXTENDED_COLORS.tan, EXTENDED_COLORS.gold, EXTENDED_COLORS.darkGray, EXTENDED_COLORS.sandGreen],
    brickIds: ["b-2x2", "b-4x2", "b-6x2", "cy-2x2", "cy-2x2t", "cn-4x4", "a-1x4", "a-1x6", "s-3x2", "p-8x8", "flag-1x4", "t-4x2"],
    prefabs: [
      {
        id: "monument-pyramid",
        name: "Pyramid",
        description: "An Egyptian pyramid",
        icon: "🔺",
        bricks: [
          // Base
          { position: [0, 0.16, 0], color: EXTENDED_COLORS.tan, width: 8, depth: 8, height: 1, shape: "plate" },
          // Layer 1
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.tan, width: 6, depth: 6, height: 3, shape: "standard" },
          // Layer 2
          { position: [0, 1.44, 0], color: EXTENDED_COLORS.tan, width: 4, depth: 4, height: 3, shape: "standard" },
          // Layer 3
          { position: [0, 2.40, 0], color: EXTENDED_COLORS.tan, width: 2, depth: 2, height: 3, shape: "standard" },
          // Cap
          { position: [0, 3.36, 0], color: EXTENDED_COLORS.gold, width: 2, depth: 2, height: 3, shape: "cone" },
        ],
      },
      {
        id: "monument-tower",
        name: "Clock Tower",
        description: "A classic clock tower",
        icon: "🕐",
        bricks: [
          // Base
          { position: [0, 0.16, 0], color: EXTENDED_COLORS.gray, width: 4, depth: 4, height: 1, shape: "plate" },
          // Body
          { position: [0, 0.48, 0], color: EXTENDED_COLORS.tan, width: 4, depth: 4, height: 3, shape: "standard" },
          { position: [0, 1.44, 0], color: EXTENDED_COLORS.tan, width: 4, depth: 4, height: 3, shape: "standard" },
          { position: [0, 2.40, 0], color: EXTENDED_COLORS.tan, width: 4, depth: 4, height: 3, shape: "standard" },
          // Clock face
          { position: [0, 2.40, -1.6], color: EXTENDED_COLORS.white, width: 2, depth: 1, height: 3, shape: "round" },
          // Spire
          { position: [0, 3.36, 0], color: EXTENDED_COLORS.gray, width: 2, depth: 2, height: 3, shape: "standard" },
          { position: [0, 4.32, 0], color: EXTENDED_COLORS.darkGray, width: 2, depth: 2, height: 6, shape: "cone" },
        ],
      },
      {
        id: "monument-colosseum",
        name: "Colosseum",
        description: "The Roman Colosseum",
        icon: "🏛",
        bricks: [
          // Base
          { position: [0, 0.16, 0], color: EXTENDED_COLORS.lightGray, width: 8, depth: 8, height: 1, shape: "plate" },
          // Outer ring
          { position: [0, 0.48, -3.2], color: EXTENDED_COLORS.tan, width: 8, depth: 1, height: 3, shape: "standard" },
          { position: [0, 0.48, 3.2], color: EXTENDED_COLORS.tan, width: 8, depth: 1, height: 3, shape: "standard" },
          { position: [-3.2, 0.48, 0], color: EXTENDED_COLORS.tan, width: 1, depth: 6, height: 3, shape: "standard" },
          { position: [3.2, 0.48, 0], color: EXTENDED_COLORS.tan, width: 1, depth: 6, height: 3, shape: "standard" },
          // Arches
          { position: [0, 0.48, -3.2], color: EXTENDED_COLORS.darkGray, width: 4, depth: 1, height: 3, shape: "arch" },
          { position: [0, 0.48, 3.2], color: EXTENDED_COLORS.darkGray, width: 4, depth: 1, height: 3, shape: "arch" },
          // Upper tier
          { position: [0, 1.44, -3.2], color: EXTENDED_COLORS.tan, width: 8, depth: 1, height: 3, shape: "standard" },
          { position: [0, 1.44, 3.2], color: EXTENDED_COLORS.tan, width: 8, depth: 1, height: 3, shape: "standard" },
          // Arena floor
          { position: [0, 0.32, 0], color: EXTENDED_COLORS.sand, width: 6, depth: 6, height: 1, shape: "tile" },
        ],
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getBricksByCategory(category: BrickCategory): CatalogBrick[] {
  return BRICK_CATALOG.filter((b) => b.category === category);
}

export function getBrickById(id: string): CatalogBrick | undefined {
  return BRICK_CATALOG.find((b) => b.id === id);
}

export function getThemeById(id: string): ThemeCollection | undefined {
  return THEME_COLLECTIONS.find((t) => t.id === id);
}

export function getRecommendedBricks(themeId: string): CatalogBrick[] {
  const theme = getThemeById(themeId);
  if (!theme) return [];
  return theme.brickIds
    .map((id) => getBrickById(id))
    .filter((b): b is CatalogBrick => b !== undefined);
}

export function getAllCategories(): BrickCategory[] {
  return Object.keys(CATEGORY_INFO) as BrickCategory[];
}
