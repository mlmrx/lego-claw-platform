/**
 * GhostBrick3D Component
 * Transparent, pulsing preview brick showing where the next brick
 * will be placed. Uses authentic LEGO proportions.
 *
 * Dimensions match LegoBrick3D:
 *   UNIT = 1.0, PLATE_HEIGHT = 0.4, STUD_RADIUS = 0.24, STUD_HEIGHT = 0.2
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Must match LegoBrick3D constants
const UNIT = 1.0;
const PLATE_HEIGHT = 0.4;
const STUD_HEIGHT = 0.2;
const STUD_RADIUS = 0.24;

interface GhostBrick3DProps {
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number; // plates (1=plate, 3=brick)
  valid?: boolean;
}

export function GhostBrick3D({
  position,
  color,
  width,
  depth,
  height,
  valid = true,
}: GhostBrick3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const brickW = width * UNIT;
  const brickD = depth * UNIT;
  const brickH = height * PLATE_HEIGHT;

  // Stud positions
  const studPositions = useMemo(() => {
    const positions: [number, number][] = [];
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        positions.push([
          (x - (width - 1) / 2) * UNIT,
          (z - (depth - 1) / 2) * UNIT,
        ]);
      }
    }
    return positions;
  }, [width, depth]);

  // Breathing animation
  useFrame(({ clock }) => {
    if (!groupRef.current || !materialRef.current) return;
    const t = clock.getElapsedTime();
    const breathe = 0.35 + Math.sin(t * 3) * 0.1;
    materialRef.current.opacity = breathe;
    const scalePulse = 1.0 + Math.sin(t * 3) * 0.006;
    groupRef.current.scale.setScalar(scalePulse);
    groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.015;
  });

  const ghostColor = valid ? color : "#FF3333";

  return (
    <group ref={groupRef} position={position}>
      {/* Main brick body */}
      <mesh castShadow={false} receiveShadow={false}>
        <boxGeometry args={[brickW - 0.02, brickH - 0.02, brickD - 0.02]} />
        <meshStandardMaterial
          ref={materialRef}
          color={ghostColor}
          transparent
          opacity={0.35}
          depthWrite={false}
          roughness={0.3}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe outline */}
      <mesh>
        <boxGeometry args={[brickW - 0.02, brickH - 0.02, brickD - 0.02]} />
        <meshBasicMaterial
          color={valid ? "#FFFFFF" : "#FF0000"}
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Ghost studs */}
      {studPositions.map(([x, z], index) => (
        <group key={index}>
          <mesh
            position={[x, brickH / 2 + STUD_HEIGHT / 2, z]}
            castShadow={false}
          >
            <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 12]} />
            <meshStandardMaterial
              color={ghostColor}
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[x, brickH / 2 + STUD_HEIGHT / 2, z]}>
            <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 12]} />
            <meshBasicMaterial
              color={valid ? "#FFFFFF" : "#FF0000"}
              wireframe
              transparent
              opacity={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* Downward placement indicator */}
      {position[1] > 0.5 && (
        <mesh position={[0, -brickH / 2 - position[1] / 2 + 0.04, 0]}>
          <cylinderGeometry args={[0.015, 0.015, position[1] - 0.04, 4]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  );
}
