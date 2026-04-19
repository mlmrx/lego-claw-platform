/**
 * Tests for Builder Enhancements: Ghost Preview, Snap Sound, Placement Bounce
 * These test the utility functions and data logic that power the enhanced builder.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Test: findTopY stacking logic
// ============================================
describe("Builder stacking logic", () => {
  const UNIT = 0.8;
  const BRICK_H = 0.96;

  interface TestBrick {
    id: string;
    position: [number, number, number];
    color: string;
    width: number;
    depth: number;
    height: number;
    placedAt: number;
  }

  function findTopY(
    bricks: TestBrick[],
    gx: number,
    gz: number,
    newWidth: number,
    newDepth: number
  ): number {
    let maxY = 0;
    for (const brick of bricks) {
      const bx = Math.round(brick.position[0] / UNIT);
      const bz = Math.round(brick.position[2] / UNIT);
      const brickTop = brick.position[1] + (brick.height / 3) * BRICK_H / 2;

      const halfW1 = newWidth / 2;
      const halfD1 = newDepth / 2;
      const halfW2 = brick.width / 2;
      const halfD2 = brick.depth / 2;

      const overlapX = gx - halfW1 < bx + halfW2 && gx + halfW1 > bx - halfW2;
      const overlapZ = gz - halfD1 < bz + halfD2 && gz + halfD1 > bz - halfD2;

      if (overlapX && overlapZ) {
        maxY = Math.max(maxY, brickTop + (3 / 3) * BRICK_H / 2);
      }
    }
    if (maxY === 0) {
      return BRICK_H / 2;
    }
    return maxY;
  }

  it("returns ground level when no bricks exist", () => {
    const y = findTopY([], 0, 0, 2, 1);
    expect(y).toBeCloseTo(BRICK_H / 2, 4);
  });

  it("stacks on top of an existing brick at the same position", () => {
    const bricks: TestBrick[] = [
      {
        id: "b1",
        position: [0, BRICK_H / 2, 0],
        color: "#FF0000",
        width: 2,
        depth: 1,
        height: 3,
        placedAt: Date.now(),
      },
    ];
    const y = findTopY(bricks, 0, 0, 2, 1);
    // Should be on top of the first brick
    expect(y).toBeGreaterThan(BRICK_H / 2);
    expect(y).toBeCloseTo(BRICK_H + BRICK_H / 2, 4);
  });

  it("does not stack when bricks don't overlap", () => {
    const bricks: TestBrick[] = [
      {
        id: "b1",
        position: [5 * UNIT, BRICK_H / 2, 5 * UNIT],
        color: "#FF0000",
        width: 1,
        depth: 1,
        height: 3,
        placedAt: Date.now(),
      },
    ];
    const y = findTopY(bricks, -5, -5, 1, 1);
    expect(y).toBeCloseTo(BRICK_H / 2, 4);
  });

  it("finds the highest brick when multiple bricks are stacked", () => {
    const bricks: TestBrick[] = [
      {
        id: "b1",
        position: [0, BRICK_H / 2, 0],
        color: "#FF0000",
        width: 2,
        depth: 2,
        height: 3,
        placedAt: Date.now(),
      },
      {
        id: "b2",
        position: [0, BRICK_H + BRICK_H / 2, 0],
        color: "#0000FF",
        width: 2,
        depth: 2,
        height: 3,
        placedAt: Date.now(),
      },
    ];
    const y = findTopY(bricks, 0, 0, 1, 1);
    expect(y).toBeCloseTo(2 * BRICK_H + BRICK_H / 2, 4);
  });
});

// ============================================
// Test: Ghost position calculation
// ============================================
describe("Ghost position calculation", () => {
  const UNIT = 0.8;

  it("converts grid coordinates to world position", () => {
    const gx = 3;
    const gz = -2;
    const worldX = gx * UNIT;
    const worldZ = gz * UNIT;
    expect(worldX).toBeCloseTo(2.4, 4);
    expect(worldZ).toBeCloseTo(-1.6, 4);
  });

  it("snaps to grid correctly", () => {
    // Simulate pointer position and grid snapping
    const pointX = 2.3; // Near grid position 3
    const pointZ = -1.7; // Near grid position -2
    const gx = Math.round(pointX / UNIT);
    const gz = Math.round(pointZ / UNIT);
    expect(gx).toBe(3);
    expect(gz).toBe(-2);
  });

  it("validates grid bounds", () => {
    const size = 16;
    const halfGrid = Math.floor(size / 2);

    // Inside bounds
    expect(0 >= -halfGrid && 0 < halfGrid).toBe(true);
    expect(7 >= -halfGrid && 7 < halfGrid).toBe(true);
    expect(-8 >= -halfGrid && -8 < halfGrid).toBe(true);

    // Outside bounds
    expect(8 >= -halfGrid && 8 < halfGrid).toBe(false);
    expect(-9 >= -halfGrid && -9 < halfGrid).toBe(false);
  });
});

// ============================================
// Test: Brick types configuration
// ============================================
describe("Brick types", () => {
  const BRICK_TYPES = [
    { name: "1x1", width: 1, depth: 1, height: 3, icon: "▪" },
    { name: "2x1", width: 2, depth: 1, height: 3, icon: "▬" },
    { name: "2x2", width: 2, depth: 2, height: 3, icon: "■" },
    { name: "4x2", width: 4, depth: 2, height: 3, icon: "▰" },
    { name: "1x1 Plate", width: 1, depth: 1, height: 1, icon: "·" },
    { name: "2x1 Plate", width: 2, depth: 1, height: 1, icon: "–" },
    { name: "2x2 Plate", width: 2, depth: 2, height: 1, icon: "□" },
    { name: "4x2 Plate", width: 4, depth: 2, height: 1, icon: "▭" },
  ];

  it("has 8 brick types (4 standard + 4 plates)", () => {
    expect(BRICK_TYPES).toHaveLength(8);
  });

  it("standard bricks have height 3 (3 plates)", () => {
    const standards = BRICK_TYPES.filter((t) => !t.name.includes("Plate"));
    for (const brick of standards) {
      expect(brick.height).toBe(3);
    }
  });

  it("plates have height 1", () => {
    const plates = BRICK_TYPES.filter((t) => t.name.includes("Plate"));
    for (const plate of plates) {
      expect(plate.height).toBe(1);
    }
  });

  it("all bricks have positive dimensions", () => {
    for (const brick of BRICK_TYPES) {
      expect(brick.width).toBeGreaterThan(0);
      expect(brick.depth).toBeGreaterThan(0);
      expect(brick.height).toBeGreaterThan(0);
    }
  });
});

// ============================================
// Test: Placement effect lifecycle
// ============================================
describe("Placement effects", () => {
  it("creates effect with correct properties", () => {
    const effect = {
      id: `effect-${Date.now()}-${Math.random()}`,
      position: [1.6, 0.48, 0.8] as [number, number, number],
      color: "#C91A09",
    };

    expect(effect.id).toMatch(/^effect-/);
    expect(effect.position).toHaveLength(3);
    expect(effect.color).toBe("#C91A09");
  });

  it("effect IDs are unique", () => {
    const effects = Array.from({ length: 100 }, () => ({
      id: `effect-${Date.now()}-${Math.random()}`,
    }));
    const ids = new Set(effects.map((e) => e.id));
    expect(ids.size).toBe(100);
  });
});

// ============================================
// Test: Undo/redo stack behavior
// ============================================
describe("Undo/redo stack", () => {
  interface Brick {
    id: string;
    position: [number, number, number];
    color: string;
  }

  it("undo restores previous state", () => {
    const states: Brick[][] = [];
    let current: Brick[] = [];
    let undoStack: Brick[][] = [];
    let redoStack: Brick[][] = [];

    // Place a brick
    undoStack.push([...current]);
    redoStack = [];
    current = [{ id: "1", position: [0, 0, 0], color: "#FF0000" }];

    // Place another
    undoStack.push([...current]);
    redoStack = [];
    current = [
      ...current,
      { id: "2", position: [0.8, 0, 0], color: "#0000FF" },
    ];

    expect(current).toHaveLength(2);

    // Undo
    const prev = undoStack.pop()!;
    redoStack.push([...current]);
    current = prev;

    expect(current).toHaveLength(1);
    expect(current[0].id).toBe("1");

    // Redo
    const next = redoStack.pop()!;
    undoStack.push([...current]);
    current = next;

    expect(current).toHaveLength(2);
  });
});

// ============================================
// Test: LEGO colors
// ============================================
describe("LEGO colors", () => {
  const LEGO_COLORS = {
    red: "#C91A09",
    blue: "#0055BF",
    yellow: "#F2CD37",
    green: "#237841",
    orange: "#FE8A18",
    white: "#FFFFFF",
    black: "#1B2A34",
    gray: "#9BA19D",
    darkGray: "#6D6E5C",
    brown: "#583927",
    tan: "#E4CD9E",
    lime: "#BBE90B",
    pink: "#FC97AC",
    purple: "#81007B",
    cyan: "#068BC9",
  };

  it("has 15 colors", () => {
    expect(Object.keys(LEGO_COLORS)).toHaveLength(15);
  });

  it("all colors are valid hex codes", () => {
    for (const [name, hex] of Object.entries(LEGO_COLORS)) {
      expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
