import { describe, expect, it } from "vitest";
import {
  DEFAULT_PIECE_WORLD_ID,
  getPieceWorld,
  isPieceWorldId,
  mixPieceColor,
  parseStoredPieceWorld,
  PIECE_WORLD_IDS,
  PIECE_WORLDS,
  resolvePieceMaterial,
  resolveWorldEdgeColor,
} from "../client/src/lib/pieceWorlds";

describe("Piece Worlds", () => {
  it("defines eight unique, trademark-safe construction worlds", () => {
    expect(PIECE_WORLDS).toHaveLength(8);
    expect(new Set(PIECE_WORLDS.map(world => world.id)).size).toBe(8);
    expect(PIECE_WORLDS.map(world => world.name)).toEqual([
      "Classic Click",
      "Prism Glass",
      "Claykin",
      "Voxel Realm",
      "MagnaSnap",
      "Neon Circuit",
      "Candy Lab",
      "Ancient Timber",
    ]);
    expect(PIECE_WORLD_IDS).not.toContain("minecraft");
  });

  it("falls back safely when stored or caller-provided values are invalid", () => {
    expect(parseStoredPieceWorld("voxel-realm")).toBe("voxel-realm");
    expect(parseStoredPieceWorld("unknown-world")).toBe(DEFAULT_PIECE_WORLD_ID);
    expect(parseStoredPieceWorld(null)).toBe(DEFAULT_PIECE_WORLD_ID);
    expect(getPieceWorld("not-real").id).toBe(DEFAULT_PIECE_WORLD_ID);
    expect(isPieceWorldId("prism-glass")).toBe(true);
    expect(isPieceWorldId(42)).toBe(false);
  });

  it("mixes valid colors deterministically and preserves invalid source colors", () => {
    expect(mixPieceColor("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mixPieceColor("#F00", "#000000", 0.5)).toBe("#800000");
    expect(mixPieceColor("red", "#FFFFFF", 0.5)).toBe("red");
  });

  it("gives glass pieces transmission, clarity, and safe transparency", () => {
    const material = resolvePieceMaterial("prism-glass", "#0055BF");
    expect(material.transparent).toBe(true);
    expect(material.transmission).toBeGreaterThan(0.5);
    expect(material.opacity).toBeLessThan(0.8);
    expect(material.depthWrite).toBe(false);
  });

  it("makes clay and wood tactile rather than glossy", () => {
    const clay = resolvePieceMaterial("claykin", "#F2CD37");
    const wood = resolvePieceMaterial("ancient-timber", "#F2CD37");
    expect(clay.roughness).toBeGreaterThan(0.85);
    expect(clay.clearcoat).toBe(0);
    expect(wood.roughness).toBeGreaterThan(0.7);
    expect(resolveWorldEdgeColor("ancient-timber", "#FFFFFF")).toBe("#5E3A20");
  });

  it("makes Voxel Realm visibly faceted", () => {
    const material = resolvePieceMaterial("voxel-realm", "#237841");
    expect(material.flatShading).toBe(true);
    expect(material.roughness).toBeGreaterThan(0.8);
    expect(getPieceWorld("voxel-realm").studStyle).toBe("voxel");
  });

  it("makes magnetic tiles translucent and neon pieces emissive", () => {
    const magnetic = resolvePieceMaterial("magnasnap", "#FE8A18");
    const neon = resolvePieceMaterial("neon-circuit", "#81007B");
    expect(magnetic.transparent).toBe(true);
    expect(magnetic.transmission).toBeGreaterThan(0);
    expect(getPieceWorld("magnasnap").edgeStyle).toBe("frame");
    expect(neon.emissiveIntensity).toBeGreaterThan(0.5);
    expect(neon.emissive).toBe("#81007B");
  });

  it("gives Candy Lab a distinct pastel glossy treatment", () => {
    const classic = resolvePieceMaterial("classic-click", "#C91A09");
    const candy = resolvePieceMaterial("candy-lab", "#C91A09");
    expect(candy.color).not.toBe(classic.color);
    expect(candy.clearcoat).toBe(1);
    expect(candy.roughness).toBeLessThan(classic.roughness);
  });

  it("defines complete scene and selector metadata for every world", () => {
    for (const world of PIECE_WORLDS) {
      expect(world.name.length).toBeGreaterThan(3);
      expect(world.description.length).toBeGreaterThan(20);
      expect(world.previewColors).toHaveLength(3);
      expect(world.scene.background).toMatch(/^#[0-9A-F]{6}$/i);
      expect(world.scene.baseplate).toMatch(/^#[0-9A-F]{6}$/i);
      expect(world.scene.grid).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
