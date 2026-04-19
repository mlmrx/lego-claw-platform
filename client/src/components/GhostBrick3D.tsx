/**
 * GhostBrick3D Component
 * A transparent, pulsing preview brick that shows where the next brick
 * will be placed. Includes studs, proper dimensions, and a subtle
 * breathing animation to distinguish it from placed bricks.
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const BRICK_HEIGHT = 0.96;
const STUD_HEIGHT = 0.17;
const STUD_RADIUS = 0.24;
const UNIT_SIZE = 0.8;

interface GhostBrick3DProps {
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number; // plates (1=plate, 3=brick)
  valid?: boolean; // Whether placement is valid at this position
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

  const brickWidth = width * UNIT_SIZE;
  const brickDepth = depth * UNIT_SIZE;
  const brickHeight = (height / 3) * BRICK_HEIGHT;

  // Stud positions
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

  // Breathing animation - subtle opacity and scale pulse
  useFrame(({ clock }) => {
    if (!groupRef.current || !materialRef.current) return;

    const t = clock.getElapsedTime();
    // Gentle breathing: opacity oscillates between 0.25 and 0.5
    const breathe = 0.35 + Math.sin(t * 3) * 0.1;
    materialRef.current.opacity = breathe;

    // Very subtle scale pulse
    const scalePulse = 1.0 + Math.sin(t * 3) * 0.008;
    groupRef.current.scale.setScalar(scalePulse);

    // Slight hover float
    groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.02;
  });

  const ghostColor = valid ? color : "#FF3333";

  return (
    <group ref={groupRef} position={position}>
      {/* Main brick body */}
      <mesh castShadow={false} receiveShadow={false}>
        <boxGeometry args={[brickWidth, brickHeight, brickDepth]} />
        <meshStandardMaterial
          ref={materialRef}
          color={ghostColor}
          transparent
          opacity={0.35}
          depthWrite={false}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe outline for clarity */}
      <mesh>
        <boxGeometry args={[brickWidth, brickHeight, brickDepth]} />
        <meshBasicMaterial
          color={valid ? "#FFFFFF" : "#FF0000"}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Ghost studs on top */}
      {studPositions.map(([x, z], index) => (
        <group key={index}>
          <mesh
            position={[x, brickHeight / 2 + STUD_HEIGHT / 2, z]}
            castShadow={false}
          >
            <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 12]} />
            <meshStandardMaterial
              color={ghostColor}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>
          {/* Stud wireframe */}
          <mesh position={[x, brickHeight / 2 + STUD_HEIGHT / 2, z]}>
            <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 12]} />
            <meshBasicMaterial
              color={valid ? "#FFFFFF" : "#FF0000"}
              wireframe
              transparent
              opacity={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Downward placement indicator line */}
      {position[1] > 0.5 && (
        <mesh position={[0, -brickHeight / 2 - position[1] / 2 + 0.04, 0]}>
          <cylinderGeometry args={[0.02, 0.02, position[1] - 0.04, 4]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}
