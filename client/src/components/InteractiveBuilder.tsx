/**
 * InteractiveBuilder Component
 * A full 3D LEGO builder with click-to-place bricks, grid snapping,
 * color/type selection, undo/redo, and delete mode.
 */

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Html } from "@react-three/drei";
import { LegoBrick3D, LEGO_COLORS, BrickPlacement } from "./LegoBrick3D";
import * as THREE from "three";

// ============================================
// TYPES
// ============================================

export interface BuilderBrick {
  id: string;
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number;
  placedAt: number;
}

export interface BrickType {
  name: string;
  width: number;
  depth: number;
  height: number;
  icon: string;
}

export const BRICK_TYPES: BrickType[] = [
  { name: "1x1", width: 1, depth: 1, height: 3, icon: "▪" },
  { name: "2x1", width: 2, depth: 1, height: 3, icon: "▬" },
  { name: "2x2", width: 2, depth: 2, height: 3, icon: "■" },
  { name: "4x2", width: 4, depth: 2, height: 3, icon: "▰" },
  { name: "1x1 Plate", width: 1, depth: 1, height: 1, icon: "·" },
  { name: "2x1 Plate", width: 2, depth: 1, height: 1, icon: "–" },
  { name: "2x2 Plate", width: 2, depth: 2, height: 1, icon: "□" },
  { name: "4x2 Plate", width: 4, depth: 2, height: 1, icon: "▭" },
];

const GRID_SIZE = 16; // 16x16 baseplate
const UNIT = 0.8; // Size of 1 stud in world units
const BRICK_H = 0.96; // Height of a standard brick (3 plates)
const PLATE_H = BRICK_H / 3; // Height of a plate

// ============================================
// GRID BASEPLATE (interactive)
// ============================================

function InteractiveBaseplate({
  size,
  onCellClick,
  ghostPosition,
  ghostColor,
  ghostWidth,
  ghostDepth,
  ghostHeight,
  deleteMode,
}: {
  size: number;
  onCellClick: (x: number, z: number) => void;
  ghostPosition: [number, number, number] | null;
  ghostColor: string;
  ghostWidth: number;
  ghostDepth: number;
  ghostHeight: number;
  deleteMode: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null);
  const plateSize = size * UNIT;

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!meshRef.current) return;
      const point = e.point;
      // Snap to grid
      const gx = Math.round(point.x / UNIT);
      const gz = Math.round(point.z / UNIT);
      const halfGrid = Math.floor(size / 2);
      if (gx >= -halfGrid && gx < halfGrid && gz >= -halfGrid && gz < halfGrid) {
        setHoverPos([gx, gz]);
      }
    },
    [size]
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (hoverPos) {
        onCellClick(hoverPos[0], hoverPos[1]);
      }
    },
    [hoverPos, onCellClick]
  );

  return (
    <group position={[0, -0.08, 0]}>
      {/* Main plate - clickable */}
      <mesh
        ref={meshRef}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverPos(null)}
        onClick={handleClick}
      >
        <planeGeometry args={[plateSize, plateSize]} />
        <meshStandardMaterial color="#237841" roughness={0.4} />
      </mesh>

      {/* Grid lines */}
      {Array.from({ length: size + 1 }, (_, i) => {
        const pos = (i - size / 2) * UNIT;
        return (
          <group key={`grid-${i}`}>
            <mesh position={[pos, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.02, plateSize]} />
              <meshBasicMaterial color="#1a5c30" transparent opacity={0.3} />
            </mesh>
            <mesh position={[0, 0.01, pos]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[0.02, plateSize]} />
              <meshBasicMaterial color="#1a5c30" transparent opacity={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Studs */}
      {Array.from({ length: size }, (_, x) =>
        Array.from({ length: size }, (_, z) => (
          <mesh
            key={`stud-${x}-${z}`}
            position={[
              (x - (size - 1) / 2) * UNIT,
              0.02,
              (z - (size - 1) / 2) * UNIT,
            ]}
          >
            <cylinderGeometry args={[0.24, 0.24, 0.04, 12]} />
            <meshStandardMaterial color="#237841" roughness={0.4} />
          </mesh>
        ))
      ).flat()}

      {/* Hover indicator */}
      {hoverPos && !deleteMode && (
        <mesh
          position={[hoverPos[0] * UNIT, 0.05, hoverPos[1] * UNIT]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[ghostWidth * UNIT, ghostDepth * UNIT]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Ghost brick preview */}
      {ghostPosition && !deleteMode && (
        <group position={ghostPosition}>
          <mesh>
            <boxGeometry
              args={[
                ghostWidth * UNIT,
                (ghostHeight / 3) * BRICK_H,
                ghostDepth * UNIT,
              ]}
            />
            <meshStandardMaterial
              color={ghostColor}
              transparent
              opacity={0.4}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ============================================
// CLICKABLE BRICK (for delete mode)
// ============================================

function ClickableBrick({
  brick,
  deleteMode,
  onDelete,
  isHighlighted,
}: {
  brick: BuilderBrick;
  deleteMode: boolean;
  onDelete: (id: string) => void;
  isHighlighted: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      onPointerEnter={(e) => {
        if (deleteMode) {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerLeave={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        if (deleteMode) {
          e.stopPropagation();
          onDelete(brick.id);
          document.body.style.cursor = "default";
        }
      }}
    >
      <LegoBrick3D
        position={brick.position}
        color={hovered && deleteMode ? "#FF0000" : isHighlighted ? "#FFD700" : brick.color}
        width={brick.width}
        depth={brick.depth}
        height={brick.height}
        isAnimating={Date.now() - brick.placedAt < 1500}
        animationDelay={0}
      />
      {hovered && deleteMode && (
        <Html position={[brick.position[0], brick.position[1] + 1.5, brick.position[2]]} center>
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Click to delete
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================
// BRICK ON TOP DETECTION (for stacking)
// ============================================

function findTopY(
  bricks: BuilderBrick[],
  gx: number,
  gz: number,
  newWidth: number,
  newDepth: number
): number {
  let maxY = 0;
  for (const brick of bricks) {
    // Calculate brick grid bounds
    const bx = Math.round(brick.position[0] / UNIT);
    const bz = Math.round(brick.position[2] / UNIT);
    const brickTop = brick.position[1] + (brick.height / 3) * BRICK_H / 2;

    // Check overlap in x and z
    const halfW1 = newWidth / 2;
    const halfD1 = newDepth / 2;
    const halfW2 = brick.width / 2;
    const halfD2 = brick.depth / 2;

    const overlapX = gx - halfW1 < bx + halfW2 && gx + halfW1 > bx - halfW2;
    const overlapZ = gz - halfD1 < bz + halfD2 && gz + halfD1 > bz - halfD2;

    if (overlapX && overlapZ) {
      maxY = Math.max(maxY, brickTop + (3 / 3) * BRICK_H / 2); // next brick sits on top
    }
  }
  // If no bricks below, place at ground level
  if (maxY === 0) {
    return BRICK_H / 2; // half brick height above baseplate
  }
  return maxY;
}

// ============================================
// SCENE CONTROLS
// ============================================

function SceneControls({ deleteMode }: { deleteMode: boolean }) {
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      minDistance={5}
      maxDistance={40}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 2.1}
      mouseButtons={{
        LEFT: deleteMode ? THREE.MOUSE.LEFT : THREE.MOUSE.LEFT,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
      // When not in delete mode, left click goes to baseplate; orbit with right
      // When in delete mode, left click deletes bricks; orbit with right
    />
  );
}

// ============================================
// MAIN INTERACTIVE BUILDER COMPONENT
// ============================================

export interface InteractiveBuilderProps {
  bricks: BuilderBrick[];
  onPlaceBrick: (brick: Omit<BuilderBrick, "id" | "placedAt">) => void;
  onDeleteBrick: (id: string) => void;
  selectedColor: string;
  selectedBrickType: BrickType;
  deleteMode: boolean;
  highlightedBrickIds?: string[];
  className?: string;
}

export function InteractiveBuilder({
  bricks,
  onPlaceBrick,
  onDeleteBrick,
  selectedColor,
  selectedBrickType,
  deleteMode,
  highlightedBrickIds = [],
  className = "",
}: InteractiveBuilderProps) {
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);

  const handleCellClick = useCallback(
    (gx: number, gz: number) => {
      if (deleteMode) return;

      const worldX = gx * UNIT;
      const worldZ = gz * UNIT;
      const brickH = (selectedBrickType.height / 3) * BRICK_H;
      const topY = findTopY(bricks, gx, gz, selectedBrickType.width, selectedBrickType.depth);

      onPlaceBrick({
        position: [worldX, topY, worldZ],
        color: selectedColor,
        width: selectedBrickType.width,
        depth: selectedBrickType.depth,
        height: selectedBrickType.height,
      });
    },
    [bricks, selectedColor, selectedBrickType, deleteMode, onPlaceBrick]
  );

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 10, 12]} fov={45} />
        <SceneControls deleteMode={deleteMode} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        <Environment preset="studio" />

        {/* Interactive baseplate */}
        <InteractiveBaseplate
          size={GRID_SIZE}
          onCellClick={handleCellClick}
          ghostPosition={ghostPos}
          ghostColor={selectedColor}
          ghostWidth={selectedBrickType.width}
          ghostDepth={selectedBrickType.depth}
          ghostHeight={selectedBrickType.height}
          deleteMode={deleteMode}
        />

        <ContactShadows
          position={[0, -0.05, 0]}
          opacity={0.4}
          scale={20}
          blur={2}
          far={10}
        />

        {/* Placed bricks */}
        <Suspense fallback={null}>
          {bricks.map((brick) => (
            <ClickableBrick
              key={brick.id}
              brick={brick}
              deleteMode={deleteMode}
              onDelete={onDeleteBrick}
              isHighlighted={highlightedBrickIds.includes(brick.id)}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
