export const PIECE_WORLD_IDS = [
  "classic-click",
  "prism-glass",
  "claykin",
  "voxel-realm",
  "magnasnap",
  "neon-circuit",
  "candy-lab",
  "ancient-timber",
] as const;

export type PieceWorldId = (typeof PIECE_WORLD_IDS)[number];
export type PieceWorldStudStyle =
  | "round"
  | "crystal"
  | "clay"
  | "voxel"
  | "magnet"
  | "neon"
  | "candy"
  | "wood";
export type PieceWorldEdgeStyle = "subtle" | "glass" | "voxel" | "frame" | "neon" | "grain";

export interface PieceWorldMaterial {
  color: string;
  roughness: number;
  metalness: number;
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
  transmission: number;
  thickness: number;
  ior: number;
  clearcoat: number;
  clearcoatRoughness: number;
  emissive: string;
  emissiveIntensity: number;
  flatShading: boolean;
}

export interface PieceWorldDefinition {
  id: PieceWorldId;
  name: string;
  shortName: string;
  eyebrow: string;
  description: string;
  icon: "blocks" | "gem" | "clay" | "voxel" | "magnet" | "circuit" | "candy" | "timber";
  accent: string;
  previewColors: [string, string, string];
  studStyle: PieceWorldStudStyle;
  edgeStyle: PieceWorldEdgeStyle;
  scene: {
    background: string;
    baseplate: string;
    grid: string;
  };
}

export const DEFAULT_PIECE_WORLD_ID: PieceWorldId = "classic-click";
export const PIECE_WORLD_STORAGE_KEY = "lego-claw-piece-world";

export const PIECE_WORLDS: readonly PieceWorldDefinition[] = [
  {
    id: "classic-click",
    name: "Classic Click",
    shortName: "Classic",
    eyebrow: "The original",
    description: "Glossy, colorful interlocking pieces with familiar round studs.",
    icon: "blocks",
    accent: "#D11232",
    previewColors: ["#C91A09", "#0055BF", "#F2CD37"],
    studStyle: "round",
    edgeStyle: "subtle",
    scene: { background: "#EAF6FF", baseplate: "#237841", grid: "#6CA56F" },
  },
  {
    id: "prism-glass",
    name: "Prism Glass",
    shortName: "Prism",
    eyebrow: "Light made buildable",
    description: "Translucent crystal pieces that catch reflections and glow at the edges.",
    icon: "gem",
    accent: "#22D3EE",
    previewColors: ["#67E8F9", "#C4B5FD", "#F9A8D4"],
    studStyle: "crystal",
    edgeStyle: "glass",
    scene: { background: "#ECFEFF", baseplate: "#A5F3FC", grid: "#0891B2" },
  },
  {
    id: "claykin",
    name: "Claykin",
    shortName: "Clay",
    eyebrow: "Softly sculpted",
    description: "Warm hand-shaped pieces with earthy color, matte texture, and rounded pegs.",
    icon: "clay",
    accent: "#C66A45",
    previewColors: ["#C66A45", "#E7A977", "#7A9E7E"],
    studStyle: "clay",
    edgeStyle: "subtle",
    scene: { background: "#FFF7ED", baseplate: "#BFA27A", grid: "#8B7355" },
  },
  {
    id: "voxel-realm",
    name: "Voxel Realm",
    shortName: "Voxel",
    eyebrow: "Pixel-built worlds",
    description: "Chunky matte cubes, square connectors, and crisp game-world geometry.",
    icon: "voxel",
    accent: "#65A30D",
    previewColors: ["#65A30D", "#8B5A2B", "#38BDF8"],
    studStyle: "voxel",
    edgeStyle: "voxel",
    scene: { background: "#DDF4FF", baseplate: "#6AA84F", grid: "#315C2B" },
  },
  {
    id: "magnasnap",
    name: "MagnaSnap",
    shortName: "Magnetic",
    eyebrow: "Snap by attraction",
    description: "Luminous magnetic-tile pieces with framed faces and visible connection rings.",
    icon: "magnet",
    accent: "#F97316",
    previewColors: ["#FB7185", "#FACC15", "#38BDF8"],
    studStyle: "magnet",
    edgeStyle: "frame",
    scene: { background: "#FFF7ED", baseplate: "#FED7AA", grid: "#EA580C" },
  },
  {
    id: "neon-circuit",
    name: "Neon Circuit",
    shortName: "Neon",
    eyebrow: "Build after dark",
    description: "Dark tech pieces energized by electric edges and glowing connection nodes.",
    icon: "circuit",
    accent: "#A855F7",
    previewColors: ["#22D3EE", "#A855F7", "#F43F5E"],
    studStyle: "neon",
    edgeStyle: "neon",
    scene: { background: "#090B1A", baseplate: "#161A33", grid: "#22D3EE" },
  },
  {
    id: "candy-lab",
    name: "Candy Lab",
    shortName: "Candy",
    eyebrow: "Sweet inventions",
    description: "Pastel candy-shell pieces with glossy icing shine and gumdrop connectors.",
    icon: "candy",
    accent: "#EC4899",
    previewColors: ["#FDA4AF", "#C4B5FD", "#86EFAC"],
    studStyle: "candy",
    edgeStyle: "subtle",
    scene: { background: "#FFF1F8", baseplate: "#FBCFE8", grid: "#DB2777" },
  },
  {
    id: "ancient-timber",
    name: "Ancient Timber",
    shortName: "Timber",
    eyebrow: "Carved to connect",
    description: "Wooden construction pieces with carved pegs, warm grain, and workshop character.",
    icon: "timber",
    accent: "#9A6538",
    previewColors: ["#D6A466", "#9A6538", "#6B4423"],
    studStyle: "wood",
    edgeStyle: "grain",
    scene: { background: "#FBF6EC", baseplate: "#CDAA7D", grid: "#7C5738" },
  },
] as const;

const WORLD_BY_ID = new Map(PIECE_WORLDS.map(world => [world.id, world]));

export function isPieceWorldId(value: unknown): value is PieceWorldId {
  return typeof value === "string" && WORLD_BY_ID.has(value as PieceWorldId);
}

export function parseStoredPieceWorld(value: string | null | undefined): PieceWorldId {
  return isPieceWorldId(value) ? value : DEFAULT_PIECE_WORLD_ID;
}

export function getPieceWorld(value: unknown): PieceWorldDefinition {
  return isPieceWorldId(value)
    ? WORLD_BY_ID.get(value) ?? PIECE_WORLDS[0]
    : PIECE_WORLDS[0];
}

function parseHexColor(value: string): [number, number, number] | null {
  const normalized = value.trim().replace(/^#/, "");
  const expanded = normalized.length === 3
    ? normalized.split("").map(char => `${char}${char}`).join("")
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ];
}

export function mixPieceColor(source: string, target: string, amount: number): string {
  const from = parseHexColor(source);
  const to = parseHexColor(target);
  if (!from || !to) return source;
  const ratio = Math.min(1, Math.max(0, amount));
  const mixed = from.map((channel, index) =>
    Math.round(channel + (to[index] - channel) * ratio)
  );
  return `#${mixed.map(channel => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function resolvePieceMaterial(
  worldId: PieceWorldId,
  sourceColor: string,
  opacity = 1,
): PieceWorldMaterial {
  const boundedOpacity = Math.min(1, Math.max(0, opacity));
  const base: PieceWorldMaterial = {
    color: sourceColor,
    roughness: 0.35,
    metalness: 0,
    transparent: boundedOpacity < 1,
    opacity: boundedOpacity,
    depthWrite: boundedOpacity >= 0.9,
    transmission: 0,
    thickness: 0,
    ior: 1.45,
    clearcoat: 0.12,
    clearcoatRoughness: 0.28,
    emissive: "#000000",
    emissiveIntensity: 0,
    flatShading: false,
  };

  switch (worldId) {
    case "prism-glass":
      return {
        ...base,
        color: mixPieceColor(sourceColor, "#E6FBFF", 0.34),
        roughness: 0.08,
        metalness: 0.04,
        transparent: true,
        opacity: Math.min(boundedOpacity, 0.72),
        depthWrite: false,
        transmission: 0.56,
        thickness: 0.28,
        ior: 1.34,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      };
    case "claykin":
      return {
        ...base,
        color: mixPieceColor(sourceColor, "#C97550", 0.38),
        roughness: 0.91,
        clearcoat: 0,
      };
    case "voxel-realm":
      return {
        ...base,
        color: mixPieceColor(sourceColor, "#6C8E3D", 0.12),
        roughness: 0.86,
        clearcoat: 0,
        flatShading: true,
      };
    case "magnasnap":
      return {
        ...base,
        color: mixPieceColor(sourceColor, "#FFFFFF", 0.2),
        roughness: 0.18,
        metalness: 0.03,
        transparent: true,
        opacity: Math.min(boundedOpacity, 0.82),
        depthWrite: false,
        transmission: 0.18,
        thickness: 0.12,
        clearcoat: 0.75,
        clearcoatRoughness: 0.12,
      };
    case "neon-circuit":
      return {
        ...base,
        color: mixPieceColor(sourceColor, "#080A18", 0.44),
        roughness: 0.28,
        metalness: 0.22,
        clearcoat: 0.7,
        clearcoatRoughness: 0.14,
        emissive: sourceColor,
        emissiveIntensity: 0.52,
      };
    case "candy-lab":
      return {
        ...base,
        color: mixPieceColor(sourceColor, "#FFFFFF", 0.42),
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      };
    case "ancient-timber":
      return {
        ...base,
        color: mixPieceColor(sourceColor, "#A66A3F", 0.62),
        roughness: 0.76,
        clearcoat: 0.04,
        clearcoatRoughness: 0.72,
      };
    case "classic-click":
    default:
      return base;
  }
}

export function resolveWorldEdgeColor(worldId: PieceWorldId, sourceColor: string): string {
  switch (worldId) {
    case "prism-glass": return mixPieceColor(sourceColor, "#FFFFFF", 0.68);
    case "claykin": return mixPieceColor(sourceColor, "#713F2A", 0.34);
    case "voxel-realm": return mixPieceColor(sourceColor, "#17240D", 0.58);
    case "magnasnap": return mixPieceColor(sourceColor, "#FFFFFF", 0.52);
    case "neon-circuit": return mixPieceColor(sourceColor, "#67E8F9", 0.36);
    case "candy-lab": return mixPieceColor(sourceColor, "#FFFFFF", 0.72);
    case "ancient-timber": return "#5E3A20";
    case "classic-click":
    default: return mixPieceColor(sourceColor, "#000000", 0.12);
  }
}
