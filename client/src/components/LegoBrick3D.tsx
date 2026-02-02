/**
 * LegoBrick3D Component
 * A 3D LEGO brick with studs rendered using Three.js
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// LEGO brick dimensions (in LEGO units, 1 unit = 8mm in real life)
const BRICK_HEIGHT = 0.96; // Standard brick height
const STUD_HEIGHT = 0.17;
const STUD_RADIUS = 0.24;
const UNIT_SIZE = 0.8; // Width/depth of 1x1 brick

interface LegoBrick3DProps {
  position: [number, number, number];
  color: string;
  width?: number; // Number of studs wide (x)
  depth?: number; // Number of studs deep (z)
  height?: number; // Number of plates high (1 = plate, 3 = brick)
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

  // Calculate brick dimensions
  const brickWidth = width * UNIT_SIZE;
  const brickDepth = depth * UNIT_SIZE;
  const brickHeight = (height / 3) * BRICK_HEIGHT;

  // Create stud positions
  const studPositions = useMemo(() => {
    const positions: [number, number][] = [];
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        positions.push([
          (x - (width - 1) / 2) * UNIT_SIZE,
          (z - (depth - 1) / 2) * UNIT_SIZE,
        ]);
      }
    }
    return positions;
  }, [width, depth]);

  // Animation for placing brick
  useFrame(() => {
    if (!groupRef.current || !isAnimating) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    
    if (elapsed < 0) {
      // Not started yet
      groupRef.current.position.y = position[1] + 5;
      groupRef.current.visible = false;
    } else if (elapsed < 0.5) {
      // Falling animation
      groupRef.current.visible = true;
      const progress = elapsed / 0.5;
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      groupRef.current.position.y = position[1] + 5 * (1 - eased);
      groupRef.current.rotation.y = (1 - progress) * Math.PI * 0.5;
    } else if (elapsed < 0.6) {
      // Bounce effect
      const bounceProgress = (elapsed - 0.5) / 0.1;
      groupRef.current.position.y = position[1] + Math.sin(bounceProgress * Math.PI) * 0.1;
    } else {
      // Settled
      groupRef.current.position.y = position[1];
      groupRef.current.rotation.y = 0;
    }
  });

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.3,
        metalness: 0.1,
      }),
    [color]
  );

  return (
    <group
      ref={groupRef}
      position={isAnimating ? [position[0], position[1] + 5, position[2]] : position}
    >
      {/* Main brick body */}
      <mesh material={material} castShadow receiveShadow>
        <boxGeometry args={[brickWidth, brickHeight, brickDepth]} />
      </mesh>

      {/* Studs on top */}
      {studPositions.map(([x, z], index) => (
        <mesh
          key={index}
          position={[x, brickHeight / 2 + STUD_HEIGHT / 2, z]}
          material={material}
          castShadow
        >
          <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 16]} />
        </mesh>
      ))}

      {/* Inner tube (for 2+ wide bricks) */}
      {width >= 2 && depth >= 1 && (
        <mesh position={[0, -brickHeight / 2 + 0.1, 0]}>
          <cylinderGeometry args={[0.3, 0.3, brickHeight - 0.2, 16]} />
          <meshStandardMaterial color={color} side={THREE.BackSide} />
        </mesh>
      )}
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
  placedAt: number; // Timestamp when placed
}
