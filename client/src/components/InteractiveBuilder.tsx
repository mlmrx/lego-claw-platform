/**
 * InteractiveBuilder Component
 * A full 3D LEGO builder with click-to-place bricks, grid snapping,
 * ghost preview, snap sound effects, placement bounce animation,
 * color/type selection, undo/redo, delete mode, and shape support.
 * 
 * Now supports the full brick catalog with specialty shapes rendered
 * via ShapeBrick3D (slopes, arches, cylinders, cones, etc.)
 */

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Html } from "@react-three/drei";
import { LegoBrick3D, LEGO_COLORS } from "./LegoBrick3D";
import ShapeBrick3D from "./ShapeBrick3D";
import { GhostBrick3D } from "./GhostBrick3D";
import { PlacementBounce } from "./PlacementBounce";
import { playSnapSound, playHoverTick, playDeleteSound } from "@/lib/snapSound";
import type { BrickShape } from "@/lib/brickCatalog";
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
  shape?: BrickShape;
  placedAt: number;
}

export interface BrickType {
  name: string;
  width: number;
  depth: number;
  height: number;
  icon: string;
  shape?: BrickShape;
}

// Legacy basic types for backward compatibility
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

const GRID_SIZE = 24; // Larger baseplate for bigger builds
const UNIT = 0.8; // Size of 1 stud in world units
const BRICK_H = 0.96; // Height of a standard brick (3 plates)
const PLATE_H = BRICK_H / 3; // Height of a plate

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

// ============================================
// PLACEMENT EFFECTS MANAGER
// ============================================

interface PlacementEffect {
  id: string;
  position: [number, number, number];
  color: string;
}

// ============================================
// GRID BASEPLATE (interactive with ghost preview)
// ============================================

function InteractiveBaseplate({
  size,
  bricks,
  onCellClick,
  onHoverChange,
  ghostColor,
  ghostWidth,
  ghostDepth,
  ghostHeight,
  deleteMode,
}: {
  size: number;
  bricks: BuilderBrick[];
  onCellClick: (x: number, z: number) => void;
  onHoverChange: (pos: { gx: number; gz: number; worldY: number } | null) => void;
  ghostColor: string;
  ghostWidth: number;
  ghostDepth: number;
  ghostHeight: number;
  deleteMode: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastHoverRef = useRef<string | null>(null);
  const plateSize = size * UNIT;

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!meshRef.current || deleteMode) {
        onHoverChange(null);
        return;
      }
      const point = e.point;
      const gx = Math.round(point.x / UNIT);
      const gz = Math.round(point.z / UNIT);
      const halfGrid = Math.floor(size / 2);

      if (gx >= -halfGrid && gx < halfGrid && gz >= -halfGrid && gz < halfGrid) {
        const topY = findTopY(bricks, gx, gz, ghostWidth, ghostDepth);
        const worldY = topY;

        // Only fire hover tick when grid position actually changes
        const key = `${gx},${gz}`;
        if (lastHoverRef.current !== key) {
          lastHoverRef.current = key;
          playHoverTick();
        }

        onHoverChange({ gx, gz, worldY });
      } else {
        lastHoverRef.current = null;
        onHoverChange(null);
      }
    },
    [size, bricks, ghostWidth, ghostDepth, ghostHeight, deleteMode, onHoverChange]
  );

  const handlePointerLeave = useCallback(() => {
    lastHoverRef.current = null;
    onHoverChange(null);
  }, [onHoverChange]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (deleteMode) return;
      const point = e.point;
      const gx = Math.round(point.x / UNIT);
      const gz = Math.round(point.z / UNIT);
      const halfGrid = Math.floor(size / 2);
      if (gx >= -halfGrid && gx < halfGrid && gz >= -halfGrid && gz < halfGrid) {
        onCellClick(gx, gz);
      }
    },
    [size, deleteMode, onCellClick]
  );

  return (
    <group position={[0, -0.08, 0]}>
      {/* Main plate - clickable */}
      <mesh
        ref={meshRef}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
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

      {/* Studs - only render every other stud for performance on large grid */}
      {Array.from({ length: Math.floor(size / 2) }, (_, x) =>
        Array.from({ length: Math.floor(size / 2) }, (_, z) => (
          <mesh
            key={`stud-${x}-${z}`}
            position={[
              (x * 2 - (size - 2) / 2) * UNIT,
              0.02,
              (z * 2 - (size - 2) / 2) * UNIT,
            ]}
          >
            <cylinderGeometry args={[0.24, 0.24, 0.04, 8]} />
            <meshStandardMaterial color="#237841" roughness={0.4} />
          </mesh>
        ))
      ).flat()}
    </group>
  );
}

// ============================================
// CLICKABLE BRICK (for delete mode) - supports shapes
// ============================================

function ClickableBrick({
  brick,
  deleteMode,
  onDelete,
  isHighlighted,
  isNew,
}: {
  brick: BuilderBrick;
  deleteMode: boolean;
  onDelete: (id: string) => void;
  isHighlighted: boolean;
  isNew: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(1);

  // Placement bounce animation for newly placed bricks
  useFrame(() => {
    if (!groupRef.current || !isNew) return;
    const elapsed = (Date.now() - brick.placedAt) / 1000;
    if (elapsed < 0.3) {
      const t = elapsed / 0.3;
      const bounce = 1 + Math.sin(t * Math.PI) * 0.12;
      scaleRef.current = bounce;
      groupRef.current.scale.setScalar(bounce);
    } else if (scaleRef.current !== 1) {
      scaleRef.current = 1;
      groupRef.current.scale.setScalar(1);
    }
  });

  const displayColor = hovered && deleteMode ? "#FF0000" : isHighlighted ? "#FFD700" : brick.color;
  const shape = brick.shape || "standard";
  const isSpecialShape = shape !== "standard" && shape !== "plate";

  return (
    <group
      ref={groupRef}
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
          playDeleteSound();
          onDelete(brick.id);
          document.body.style.cursor = "default";
        }
      }}
    >
      {isSpecialShape ? (
        <ShapeBrick3D
          position={brick.position}
          color={displayColor}
          width={brick.width}
          depth={brick.depth}
          height={brick.height}
          shape={shape}
        />
      ) : (
        <LegoBrick3D
          position={brick.position}
          color={displayColor}
          width={brick.width}
          depth={brick.depth}
          height={brick.height}
          isAnimating={false}
          animationDelay={0}
        />
      )}
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
// SCENE CONTROLS
// ============================================

function SceneControls({ deleteMode }: { deleteMode: boolean }) {
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      minDistance={5}
      maxDistance={60}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 2.1}
      mouseButtons={{
        LEFT: THREE.MOUSE.LEFT,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.RIGHT,
      }}
    />
  );
}

// ============================================
// GHOST SHAPE PREVIEW
// ============================================

function GhostShapeBrick({
  position,
  color,
  width,
  depth,
  height,
  shape,
}: {
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number;
  shape: BrickShape;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Gentle pulse
      const t = Date.now() * 0.003;
      groupRef.current.scale.setScalar(1 + Math.sin(t) * 0.03);
    }
  });

  return (
    <group ref={groupRef}>
      <ShapeBrick3D
        position={position}
        color={color}
        width={width}
        depth={depth}
        height={height}
        shape={shape}
        opacity={0.5}
        wireframe
      />
    </group>
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
  const [hoverInfo, setHoverInfo] = useState<{ gx: number; gz: number; worldY: number } | null>(null);
  const [placementEffects, setPlacementEffects] = useState<PlacementEffect[]>([]);
  const [recentBrickIds, setRecentBrickIds] = useState<Set<string>>(new Set());

  // Compute ghost position from hover info
  const ghostPosition = useMemo<[number, number, number] | null>(() => {
    if (!hoverInfo || deleteMode) return null;
    const worldX = hoverInfo.gx * UNIT;
    const worldZ = hoverInfo.gz * UNIT;
    return [worldX, hoverInfo.worldY, worldZ];
  }, [hoverInfo, deleteMode]);

  const handleCellClick = useCallback(
    (gx: number, gz: number) => {
      if (deleteMode) return;

      const worldX = gx * UNIT;
      const worldZ = gz * UNIT;
      const topY = findTopY(bricks, gx, gz, selectedBrickType.width, selectedBrickType.depth);

      // Play snap sound
      playSnapSound();

      // Add placement effect
      const effectId = `effect-${Date.now()}-${Math.random()}`;
      setPlacementEffects((prev) => [
        ...prev,
        {
          id: effectId,
          position: [worldX, topY, worldZ] as [number, number, number],
          color: selectedColor,
        },
      ]);

      onPlaceBrick({
        position: [worldX, topY, worldZ],
        color: selectedColor,
        width: selectedBrickType.width,
        depth: selectedBrickType.depth,
        height: selectedBrickType.height,
        shape: selectedBrickType.shape || "standard",
      });
    },
    [bricks, selectedColor, selectedBrickType, deleteMode, onPlaceBrick]
  );

  // Track recently placed bricks for bounce animation
  useEffect(() => {
    const newIds = new Set<string>();
    const now = Date.now();
    for (const brick of bricks) {
      if (now - brick.placedAt < 500) {
        newIds.add(brick.id);
      }
    }
    setRecentBrickIds(newIds);
  }, [bricks]);

  const removeEffect = useCallback((id: string) => {
    setPlacementEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const ghostShape = selectedBrickType.shape || "standard";
  const isSpecialGhost = ghostShape !== "standard" && ghostShape !== "plate";

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={45} />
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
          bricks={bricks}
          onCellClick={handleCellClick}
          onHoverChange={setHoverInfo}
          ghostColor={selectedColor}
          ghostWidth={selectedBrickType.width}
          ghostDepth={selectedBrickType.depth}
          ghostHeight={selectedBrickType.height}
          deleteMode={deleteMode}
        />

        {/* Ghost brick preview - use shape-aware version for specialty shapes */}
        {ghostPosition && !deleteMode && (
          isSpecialGhost ? (
            <GhostShapeBrick
              position={ghostPosition}
              color={selectedColor}
              width={selectedBrickType.width}
              depth={selectedBrickType.depth}
              height={selectedBrickType.height}
              shape={ghostShape}
            />
          ) : (
            <GhostBrick3D
              position={ghostPosition}
              color={selectedColor}
              width={selectedBrickType.width}
              depth={selectedBrickType.depth}
              height={selectedBrickType.height}
              valid={true}
            />
          )
        )}

        {/* Placement bounce effects */}
        {placementEffects.map((effect) => (
          <PlacementBounce
            key={effect.id}
            position={effect.position}
            color={effect.color}
            onComplete={() => removeEffect(effect.id)}
          />
        ))}

        <ContactShadows
          position={[0, -0.05, 0]}
          opacity={0.4}
          scale={30}
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
              isNew={recentBrickIds.has(brick.id)}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
