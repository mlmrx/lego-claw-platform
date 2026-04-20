/**
 * LegoBrick3D Component
 * Authentic LEGO brick with proper proportions, studs, bottom tubes,
 * and realistic ABS plastic material.
 *
 * Real LEGO dimensions (scaled to Three.js units):
 *   1 stud pitch  = 8mm  → 1.0 unit
 *   Brick height  = 9.6mm → 1.2 units  (plate = 3.2mm → 0.4 units)
 *   Stud diameter = 4.8mm → 0.6 units  (radius 0.3)
 *   Stud height   = 1.8mm → 0.225 units
 *   Wall thickness ≈ 1.5mm → 0.1875 units
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// ── Authentic LEGO dimensions ──────────────────────────────
export const UNIT = 1.0;          // 1 stud pitch = 1.0 Three.js unit
export const BRICK_HEIGHT = 1.2;  // Full brick = 1.2 units (3 plates)
export const PLATE_HEIGHT = 0.4;  // 1 plate = 0.4 units
export const STUD_RADIUS = 0.24;  // Stud outer radius
export const STUD_HEIGHT = 0.2;   // Stud height
const WALL = 0.16;                // Wall thickness
const TUBE_OUTER = 0.326;        // Bottom tube outer radius (for 2+ wide)
const TUBE_INNER = 0.24;         // Bottom tube inner radius

interface LegoBrick3DProps {
  position: [number, number, number];
  color: string;
  width?: number;   // studs wide (x-axis)
  depth?: number;   // studs deep (z-axis)
  height?: number;  // in plates (1 = plate, 3 = standard brick)
  isAnimating?: boolean;
  animationDelay?: number;
}

export function LegoBrick3D({
  position,
  color,
  width = 2,
  depth = 1,
  height = 3,
  isAnimating = false,
  animationDelay = 0,
}: LegoBrick3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now() + animationDelay * 1000);

  // Physical dimensions
  const brickW = width * UNIT;
  const brickD = depth * UNIT;
  const brickH = height * PLATE_HEIGHT;

  // Stud grid positions
  const studPositions = useMemo(() => {
    const pos: [number, number][] = [];
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        pos.push([
          (x - (width - 1) / 2) * UNIT,
          (z - (depth - 1) / 2) * UNIT,
        ]);
      }
    }
    return pos;
  }, [width, depth]);

  // Bottom tube positions (between every 2×2 group of studs)
  const tubePositions = useMemo(() => {
    if (width < 2 || depth < 2) return [];
    const pos: [number, number][] = [];
    for (let x = 0; x < width - 1; x++) {
      for (let z = 0; z < depth - 1; z++) {
        pos.push([
          (x - (width - 2) / 2) * UNIT,
          (z - (depth - 2) / 2) * UNIT,
        ]);
      }
    }
    return pos;
  }, [width, depth]);

  // ABS plastic material — slightly glossy, no metalness
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.35,
        metalness: 0.0,
      }),
    [color]
  );

  const darkerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(0.85),
        roughness: 0.4,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    [color]
  );

  // Drop animation
  useFrame(() => {
    if (!groupRef.current || !isAnimating) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed < 0) {
      groupRef.current.position.y = position[1] + 5;
      groupRef.current.visible = false;
    } else if (elapsed < 0.5) {
      groupRef.current.visible = true;
      const t = elapsed / 0.5;
      const eased = 1 - Math.pow(1 - t, 3);
      groupRef.current.position.y = position[1] + 5 * (1 - eased);
      groupRef.current.rotation.y = (1 - t) * Math.PI * 0.5;
    } else if (elapsed < 0.6) {
      const bt = (elapsed - 0.5) / 0.1;
      groupRef.current.position.y = position[1] + Math.sin(bt * Math.PI) * 0.08;
    } else {
      groupRef.current.position.y = position[1];
      groupRef.current.rotation.y = 0;
    }
  });

  return (
    <group
      ref={groupRef}
      position={isAnimating ? [position[0], position[1] + 5, position[2]] : position}
    >
      {/* Main brick body */}
      <mesh material={material} castShadow receiveShadow>
        <boxGeometry args={[brickW - 0.02, brickH - 0.02, brickD - 0.02]} />
      </mesh>

      {/* Studs on top */}
      {studPositions.map(([x, z], i) => (
        <mesh
          key={`stud-${i}`}
          position={[x, brickH / 2 + STUD_HEIGHT / 2, z]}
          material={material}
          castShadow
        >
          <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 16]} />
        </mesh>
      ))}

      {/* Bottom tubes (visible from below, adds realism) */}
      {tubePositions.map(([x, z], i) => (
        <mesh
          key={`tube-${i}`}
          position={[x, -brickH / 2 + (brickH - 0.04) / 2, z]}
          material={darkerMaterial}
        >
          <cylinderGeometry args={[TUBE_OUTER, TUBE_OUTER, brickH - 0.04, 16, 1, true]} />
        </mesh>
      ))}

      {/* Subtle bottom edge line for definition */}
      <mesh position={[0, -brickH / 2 + 0.01, 0]}>
        <boxGeometry args={[brickW - 0.04, 0.02, brickD - 0.04]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.9)} />
      </mesh>
    </group>
  );
}

// Pre-defined LEGO colors
export const LEGO_COLORS = {
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

// Brick type definitions for building
export interface BrickPlacement {
  id: string;
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number;
  placedAt: number;
}
