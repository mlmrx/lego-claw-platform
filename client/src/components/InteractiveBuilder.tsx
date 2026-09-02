/**
 * InteractiveBuilder Component
 * A full 3D LEGO builder with click-to-place bricks, grid snapping,
 * ghost preview, snap sound effects, placement bounce animation,
 * color/type selection, undo/redo, delete mode, and shape support.
 *
 * Authentic LEGO dimensions:
 *   1 stud pitch  = 1.0 unit  (UNIT)
 *   Brick height  = 1.2 units (3 × PLATE_H)
 *   Plate height  = 0.4 units (PLATE_H)
 *   Stud radius   = 0.24
 *   Stud height   = 0.2
 *
 * Bricks are placed with ZERO gaps — every brick sits flush on the
 * one below it, just like real LEGO.
 *
 * CLICK-TO-STACK: An invisible catch plane sits above the scene so
 * clicks anywhere (including on top of existing bricks) register
 * as placement actions. The raycaster finds the grid position and
 * findTopY computes the correct stacking height.
 */

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Html } from "@react-three/drei";
import { LegoBrick3D, LEGO_COLORS, UNIT, BRICK_HEIGHT, PLATE_HEIGHT, STUD_RADIUS, STUD_HEIGHT } from "./LegoBrick3D";
import ShapeBrick3D from "./ShapeBrick3D";
import { GhostBrick3D } from "./GhostBrick3D";
import { PlacementBounce } from "./PlacementBounce";
import { playSnapSound, playHoverTick, playDeleteSound } from "@/lib/snapSound";
import type { BrickShape } from "@/lib/brickCatalog";
import { usePieceWorld } from "@/contexts/PieceWorldContext";
import { resolvePieceMaterial, resolveWorldEdgeColor } from "@/lib/pieceWorlds";
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
  height: number;      // in plates (1=plate, 3=brick)
  shape?: BrickShape;
  placedAt: number;
}

export interface BrickType {
  name: string;
  width: number;
  depth: number;
  height: number;      // in plates
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

const GRID_SIZE = 24;

// ============================================
// STACKING: find the Y position for a new brick
// ============================================

/**
 * Given existing bricks and a grid position (gx, gz) in stud units,
 * returns the world-Y for the CENTER of the new brick so it sits
 * flush on top of whatever is below.
 *
 * If nothing is below, the brick sits on the baseplate (y=0 is top of baseplate).
 */
function findTopY(
  bricks: BuilderBrick[],
  gx: number,
  gz: number,
  newWidth: number,
  newDepth: number,
  newHeight: number,  // in plates
): number {
  let highestTop = 0; // top of baseplate = 0

  for (const brick of bricks) {
    const bx = Math.round(brick.position[0] / UNIT);
    const bz = Math.round(brick.position[2] / UNIT);

    // AABB overlap test in stud coordinates
    const overlapX =
      gx - newWidth / 2 < bx + brick.width / 2 &&
      gx + newWidth / 2 > bx - brick.width / 2;
    const overlapZ =
      gz - newDepth / 2 < bz + brick.depth / 2 &&
      gz + newDepth / 2 > bz - brick.depth / 2;

    if (overlapX && overlapZ) {
      // Top of this existing brick = center.y + half its height
      const brickH = brick.height * PLATE_HEIGHT;
      const brickTop = brick.position[1] + brickH / 2;
      highestTop = Math.max(highestTop, brickTop);
    }
  }

  // New brick center = highest top + half of new brick's height
  const newH = newHeight * PLATE_HEIGHT;
  return highestTop + newH / 2;
}

// ============================================
// PLACEMENT EFFECTS
// ============================================

interface PlacementEffect {
  id: string;
  position: [number, number, number];
  color: string;
}

// ============================================
// GRID BASEPLATE
// ============================================

function InteractiveBaseplate({
  size,
}: {
  size: number;
}) {
  const { worldId, world } = usePieceWorld();
  const plateSize = size * UNIT;
  const plateStyle = resolvePieceMaterial(worldId, world.scene.baseplate);

  return (
    <group position={[0, -0.1, 0]}>
      {/* Main plate surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[plateSize, plateSize]} />
        <meshPhysicalMaterial
          color={plateStyle.color}
          roughness={plateStyle.roughness}
          metalness={plateStyle.metalness}
          transparent={plateStyle.transparent}
          opacity={plateStyle.opacity}
          transmission={plateStyle.transmission}
          clearcoat={plateStyle.clearcoat}
        />
      </mesh>

      {/* Baseplate thickness */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[plateSize, 0.2, plateSize]} />
        <meshStandardMaterial
          color={resolveWorldEdgeColor(worldId, world.scene.baseplate)}
          roughness={Math.max(plateStyle.roughness, 0.38)}
        />
      </mesh>

      {/* Grid lines */}
      {Array.from({ length: size + 1 }, (_, i) => {
        const pos = (i - size / 2) * UNIT;
        return (
          <group key={`grid-${i}`}>
            <mesh position={[pos, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.02, plateSize]} />
              <meshBasicMaterial color={world.scene.grid} transparent opacity={world.edgeStyle === "neon" ? 0.68 : 0.25} />
            </mesh>
            <mesh position={[0, 0.005, pos]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[0.02, plateSize]} />
              <meshBasicMaterial color={world.scene.grid} transparent opacity={world.edgeStyle === "neon" ? 0.68 : 0.25} />
            </mesh>
          </group>
        );
      })}

      {/* Studs on baseplate (every stud for authenticity) */}
      {Array.from({ length: size }, (_, x) =>
        Array.from({ length: size }, (_, z) => (
          <mesh
            key={`stud-${x}-${z}`}
            position={[
              (x - (size - 1) / 2) * UNIT,
              0.005,
              (z - (size - 1) / 2) * UNIT,
            ]}
          >
            {world.studStyle === "voxel" ? (
              <boxGeometry args={[STUD_RADIUS * 1.5, 0.018, STUD_RADIUS * 1.5]} />
            ) : (
              <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, 0.018, world.studStyle === "crystal" ? 6 : 12]} />
            )}
            <meshPhysicalMaterial
              color={plateStyle.color}
              roughness={plateStyle.roughness}
              metalness={plateStyle.metalness}
              transparent={plateStyle.transparent}
              opacity={plateStyle.opacity}
              emissive={plateStyle.emissive}
              emissiveIntensity={plateStyle.emissiveIntensity}
            />
          </mesh>
        ))
      ).flat()}
    </group>
  );
}

// ============================================
// CATCH PLANE — invisible plane for click/hover detection
// Sits at y=0 (baseplate surface level) and catches all pointer events.
// We use the intersection point's x/z to determine grid position,
// then findTopY to determine stacking height.
// ============================================

function CatchPlane({
  size,
  bricks,
  onCellClick,
  onHoverChange,
  ghostWidth,
  ghostDepth,
  ghostHeight,
  deleteMode,
}: {
  size: number;
  bricks: BuilderBrick[];
  onCellClick: (x: number, z: number) => void;
  onHoverChange: (pos: { gx: number; gz: number; worldY: number } | null) => void;
  ghostWidth: number;
  ghostDepth: number;
  ghostHeight: number;
  deleteMode: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastHoverRef = useRef<string | null>(null);
  const plateSize = size * UNIT;
  const halfGrid = Math.floor(size / 2);

  const toGrid = useCallback(
    (point: THREE.Vector3) => {
      const gx = Math.round(point.x / UNIT);
      const gz = Math.round(point.z / UNIT);
      if (gx >= -halfGrid && gx < halfGrid && gz >= -halfGrid && gz < halfGrid) {
        return { gx, gz };
      }
      return null;
    },
    [halfGrid]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (deleteMode) {
        onHoverChange(null);
        return;
      }
      const grid = toGrid(e.point);
      if (!grid) {
        lastHoverRef.current = null;
        onHoverChange(null);
        return;
      }

      const worldY = findTopY(bricks, grid.gx, grid.gz, ghostWidth, ghostDepth, ghostHeight);
      const key = `${grid.gx},${grid.gz}`;
      if (lastHoverRef.current !== key) {
        lastHoverRef.current = key;
        playHoverTick();
      }
      onHoverChange({ gx: grid.gx, gz: grid.gz, worldY });
    },
    [bricks, ghostWidth, ghostDepth, ghostHeight, deleteMode, onHoverChange, toGrid]
  );

  const handlePointerLeave = useCallback(() => {
    lastHoverRef.current = null;
    onHoverChange(null);
  }, [onHoverChange]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (deleteMode) return;
      const grid = toGrid(e.point);
      if (grid) {
        onCellClick(grid.gx, grid.gz);
      }
    },
    [deleteMode, onCellClick, toGrid]
  );

  return (
    <mesh
      ref={meshRef}
      position={[0, -0.05, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <planeGeometry args={[plateSize, plateSize]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

// ============================================
// CLICKABLE BRICK (for delete mode) - supports shapes
// When NOT in delete mode, clicks pass through to the CatchPlane
// behind the bricks, enabling click-to-stack.
// ============================================

function ClickableBrick({
  brick,
  deleteMode,
  onDelete,
  onPlaceOnTop,
  isHighlighted,
  isNew,
  selectedColor,
  selectedBrickType,
  allBricks,
}: {
  brick: BuilderBrick;
  deleteMode: boolean;
  onDelete: (id: string) => void;
  onPlaceOnTop: (gx: number, gz: number) => void;
  isHighlighted: boolean;
  isNew: boolean;
  selectedColor: string;
  selectedBrickType: BrickType;
  allBricks: BuilderBrick[];
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(1);

  // Placement bounce animation
  useFrame(() => {
    if (!groupRef.current || !isNew) return;
    const elapsed = (Date.now() - brick.placedAt) / 1000;
    if (elapsed < 0.3) {
      const t = elapsed / 0.3;
      const bounce = 1 + Math.sin(t * Math.PI) * 0.1;
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
        } else {
          // In build mode: place a new brick on top of this one
          e.stopPropagation();
          const point = e.point;
          const gx = Math.round(point.x / UNIT);
          const gz = Math.round(point.z / UNIT);
          onPlaceOnTop(gx, gz);
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
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
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

  useFrame(() => {
    if (groupRef.current) {
      const t = Date.now() * 0.003;
      groupRef.current.scale.setScalar(1 + Math.sin(t) * 0.02);
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
        opacity={0.45}
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
  const { world } = usePieceWorld();
  const [hoverInfo, setHoverInfo] = useState<{ gx: number; gz: number; worldY: number } | null>(null);
  const [placementEffects, setPlacementEffects] = useState<PlacementEffect[]>([]);
  const [recentBrickIds, setRecentBrickIds] = useState<Set<string>>(new Set());

  // Ghost position from hover
  const ghostPosition = useMemo<[number, number, number] | null>(() => {
    if (!hoverInfo || deleteMode) return null;
    const worldX = hoverInfo.gx * UNIT;
    const worldZ = hoverInfo.gz * UNIT;
    return [worldX, hoverInfo.worldY, worldZ];
  }, [hoverInfo, deleteMode]);

  const placeBrickAt = useCallback(
    (gx: number, gz: number) => {
      if (deleteMode) return;

      const worldX = gx * UNIT;
      const worldZ = gz * UNIT;
      const topY = findTopY(
        bricks, gx, gz,
        selectedBrickType.width,
        selectedBrickType.depth,
        selectedBrickType.height,
      );

      playSnapSound();

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
    <div className={`w-full h-full transition-colors duration-300 ${className}`} style={{ backgroundColor: world.scene.background }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={45} />
        <SceneControls deleteMode={deleteMode} />

        {/* Lighting — warm key + cool fill for LEGO plastic look */}
        <ambientLight intensity={world.edgeStyle === "neon" ? 0.26 : 0.4} color={world.edgeStyle === "neon" ? "#93C5FD" : "#f5f0e8"} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          color={world.edgeStyle === "neon" ? "#C4B5FD" : "#fff8f0"}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#e0e8ff" />
        <hemisphereLight args={["#f0f0ff", "#404040", 0.3]} />

        <Environment preset="studio" />

        {/* Visual baseplate (studs, grid lines, green surface) */}
        <InteractiveBaseplate size={GRID_SIZE} />

        {/* Invisible catch plane for click/hover — sits at baseplate level */}
        <CatchPlane
          size={GRID_SIZE}
          bricks={bricks}
          onCellClick={placeBrickAt}
          onHoverChange={setHoverInfo}
          ghostWidth={selectedBrickType.width}
          ghostDepth={selectedBrickType.depth}
          ghostHeight={selectedBrickType.height}
          deleteMode={deleteMode}
        />

        {/* Ghost brick preview */}
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
          position={[0, -0.09, 0]}
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
              onPlaceOnTop={placeBrickAt}
              isHighlighted={highlightedBrickIds.includes(brick.id)}
              isNew={recentBrickIds.has(brick.id)}
              selectedColor={selectedColor}
              selectedBrickType={selectedBrickType}
              allBricks={bricks}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
