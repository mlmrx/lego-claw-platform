/**
 * LegoScene3D Component
 * Full 3D scene for viewing LEGO builds with orbit controls
 */

import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, PerspectiveCamera } from "@react-three/drei";
import { LegoBrick3D, LEGO_COLORS, BrickPlacement } from "./LegoBrick3D";
import * as THREE from "three";
import { usePieceWorld } from "@/contexts/PieceWorldContext";
import { resolvePieceMaterial, resolveWorldEdgeColor } from "@/lib/pieceWorlds";

// Baseplate component
function Baseplate({ size = 16, color }: { size?: number; color?: string }) {
  const { worldId, world } = usePieceWorld();
  const plateSize = size * 0.8;
  const plateColor = color ?? world.scene.baseplate;
  const plateStyle = resolvePieceMaterial(worldId, plateColor);
  
  return (
    <group position={[0, -0.08, 0]}>
      {/* Main plate */}
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
      
      {/* Studs on baseplate */}
      {Array.from({ length: size }, (_, x) =>
        Array.from({ length: size }, (_, z) => (
          <mesh
            key={`stud-${x}-${z}`}
            position={[
              (x - (size - 1) / 2) * 0.8,
              0.02,
              (z - (size - 1) / 2) * 0.8,
            ]}
            castShadow
          >
            {world.studStyle === "voxel" ? (
              <boxGeometry args={[0.36, 0.04, 0.36]} />
            ) : (
              <cylinderGeometry args={[0.24, 0.24, 0.04, world.studStyle === "crystal" ? 6 : 12]} />
            )}
            <meshStandardMaterial color={plateStyle.color} roughness={plateStyle.roughness} />
          </mesh>
        ))
      ).flat()}
    </group>
  );
}

// Animated camera that slowly orbits
function AnimatedCamera({ autoRotate }: { autoRotate: boolean }) {
  const controlsRef = useRef<any>(null);
  
  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      enablePan={true}
      enableZoom={true}
      minDistance={5}
      maxDistance={30}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
    />
  );
}

// Placement indicator showing where next brick will go
function PlacementIndicator({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 3) * 0.1 + 0.5;
    }
    if (materialRef.current) {
      materialRef.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.2;
    }
  });
  
  return (
    <mesh ref={meshRef} position={[position[0], position[1] + 0.5, position[2]]}>
      <boxGeometry args={[1.6, 0.96, 0.8]} />
      <meshStandardMaterial ref={materialRef} color={color} transparent opacity={0.5} />
    </mesh>
  );
}

// Agent indicator showing which agent is building
function AgentIndicator({ position, agentName, agentColor }: { 
  position: [number, number, number]; 
  agentName: string;
  agentColor: string;
}) {
  return (
    <Html position={[position[0], position[1] + 2, position[2]]} center>
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-bounce">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: agentColor }}
        />
        <span className="text-xs font-bold text-gray-800">{agentName}</span>
        <span className="text-xs">🧱</span>
      </div>
    </Html>
  );
}

// Build progress indicator
function BuildProgress({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <Html position={[0, 8, 0]} center>
      <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{percentage}%</div>
          <div className="text-xs text-gray-500">{current} / {total} bricks</div>
        </div>
      </div>
    </Html>
  );
}

interface LegoScene3DProps {
  bricks: BrickPlacement[];
  nextBrickPosition?: [number, number, number];
  nextBrickColor?: string;
  currentAgent?: { name: string; color: string };
  totalBricks: number;
  autoRotate?: boolean;
}

export function LegoScene3D({
  bricks,
  nextBrickPosition,
  nextBrickColor = LEGO_COLORS.red,
  currentAgent,
  totalBricks,
  autoRotate = true,
}: LegoScene3DProps) {
  const { world } = usePieceWorld();
  return (
    <div className="w-full h-full transition-colors duration-300" style={{ backgroundColor: world.scene.background }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 8, 10]} fov={45} />
        <AnimatedCamera autoRotate={autoRotate} />
        
        {/* Lighting */}
        <ambientLight intensity={world.edgeStyle === "neon" ? 0.25 : 0.4} color={world.edgeStyle === "neon" ? "#93C5FD" : "#FFFFFF"} />
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
        
        {/* Environment */}
        <Environment preset="studio" />
        
        {/* Baseplate */}
        <Baseplate size={16} />
        
        {/* Contact shadows */}
        <ContactShadows
          position={[0, -0.05, 0]}
          opacity={0.4}
          scale={20}
          blur={2}
          far={10}
        />
        
        {/* Placed bricks */}
        <Suspense fallback={null}>
          {bricks.map((brick) => {
            const isRecent = Date.now() - brick.placedAt < 2000;
            return (
              <LegoBrick3D
                key={brick.id}
                position={brick.position}
                color={brick.color}
                width={brick.width}
                depth={brick.depth}
                height={brick.height}
                isAnimating={isRecent}
                animationDelay={0}
              />
            );
          })}
        </Suspense>
        
        {/* Next brick indicator */}
        {nextBrickPosition && (
          <PlacementIndicator position={nextBrickPosition} color={nextBrickColor} />
        )}
        
        {/* Agent indicator */}
        {currentAgent && nextBrickPosition && (
          <AgentIndicator
            position={nextBrickPosition}
            agentName={currentAgent.name}
            agentColor={currentAgent.color}
          />
        )}
        
        {/* Build progress */}
        <BuildProgress current={bricks.length} total={totalBricks} />
      </Canvas>
    </div>
  );
}

// Pre-built structure definitions
export interface BuildStructure {
  name: string;
  description: string;
  totalBricks: number;
  bricks: Omit<BrickPlacement, "id" | "placedAt">[];
}

// Sample spaceship build
export const SPACESHIP_BUILD: BuildStructure = {
  name: "Spaceship Alpha",
  description: "An interstellar cruiser",
  totalBricks: 45,
  bricks: [
    // Base layer
    { position: [0, 0.48, 0], color: LEGO_COLORS.gray, width: 4, depth: 2, height: 3 },
    { position: [-2.4, 0.48, 0], color: LEGO_COLORS.gray, width: 2, depth: 2, height: 3 },
    { position: [2.4, 0.48, 0], color: LEGO_COLORS.gray, width: 2, depth: 2, height: 3 },
    // Red accents
    { position: [0, 1.44, 0], color: LEGO_COLORS.red, width: 4, depth: 2, height: 3 },
    { position: [-2.4, 1.44, 0], color: LEGO_COLORS.red, width: 2, depth: 1, height: 3 },
    { position: [2.4, 1.44, 0], color: LEGO_COLORS.red, width: 2, depth: 1, height: 3 },
    // Cockpit
    { position: [0, 2.4, 0], color: LEGO_COLORS.blue, width: 2, depth: 1, height: 3 },
    { position: [0, 3.36, 0], color: LEGO_COLORS.cyan, width: 2, depth: 1, height: 3 },
    // Wings
    { position: [-3.2, 0.48, -0.8], color: LEGO_COLORS.white, width: 2, depth: 1, height: 1 },
    { position: [3.2, 0.48, -0.8], color: LEGO_COLORS.white, width: 2, depth: 1, height: 1 },
    { position: [-4, 0.48, -1.6], color: LEGO_COLORS.white, width: 2, depth: 1, height: 1 },
    { position: [4, 0.48, -1.6], color: LEGO_COLORS.white, width: 2, depth: 1, height: 1 },
    // Engines
    { position: [-1.6, 0.48, 1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 3 },
    { position: [1.6, 0.48, 1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 3 },
    { position: [-1.6, 0.48, 2.4], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 1 },
    { position: [1.6, 0.48, 2.4], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 1 },
  ],
};

// Sample castle build
export const CASTLE_BUILD: BuildStructure = {
  name: "Medieval Fortress",
  description: "A grand castle with towers",
  totalBricks: 50,
  bricks: [
    // Base walls
    { position: [-3, 0.48, -3], color: LEGO_COLORS.gray, width: 2, depth: 2, height: 3 },
    { position: [3, 0.48, -3], color: LEGO_COLORS.gray, width: 2, depth: 2, height: 3 },
    { position: [-3, 0.48, 3], color: LEGO_COLORS.gray, width: 2, depth: 2, height: 3 },
    { position: [3, 0.48, 3], color: LEGO_COLORS.gray, width: 2, depth: 2, height: 3 },
    // Connecting walls
    { position: [0, 0.48, -3], color: LEGO_COLORS.gray, width: 4, depth: 1, height: 3 },
    { position: [0, 0.48, 3], color: LEGO_COLORS.gray, width: 4, depth: 1, height: 3 },
    { position: [-3, 0.48, 0], color: LEGO_COLORS.gray, width: 1, depth: 4, height: 3 },
    { position: [3, 0.48, 0], color: LEGO_COLORS.gray, width: 1, depth: 4, height: 3 },
    // Tower bases
    { position: [-3, 1.44, -3], color: LEGO_COLORS.darkGray, width: 2, depth: 2, height: 3 },
    { position: [3, 1.44, -3], color: LEGO_COLORS.darkGray, width: 2, depth: 2, height: 3 },
    { position: [-3, 1.44, 3], color: LEGO_COLORS.darkGray, width: 2, depth: 2, height: 3 },
    { position: [3, 1.44, 3], color: LEGO_COLORS.darkGray, width: 2, depth: 2, height: 3 },
    // Tower tops
    { position: [-3, 2.4, -3], color: LEGO_COLORS.red, width: 2, depth: 2, height: 1 },
    { position: [3, 2.4, -3], color: LEGO_COLORS.red, width: 2, depth: 2, height: 1 },
    { position: [-3, 2.4, 3], color: LEGO_COLORS.red, width: 2, depth: 2, height: 1 },
    { position: [3, 2.4, 3], color: LEGO_COLORS.red, width: 2, depth: 2, height: 1 },
    // Gate
    { position: [0, 1.44, -3], color: LEGO_COLORS.brown, width: 2, depth: 1, height: 3 },
  ],
};

// Sample robot build
export const ROBOT_BUILD: BuildStructure = {
  name: "Friendly Robot",
  description: "A cheerful robot companion",
  totalBricks: 35,
  bricks: [
    // Legs
    { position: [-0.8, 0.48, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    { position: [0.8, 0.48, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    // Body
    { position: [0, 1.44, 0], color: LEGO_COLORS.yellow, width: 3, depth: 2, height: 3 },
    { position: [0, 2.4, 0], color: LEGO_COLORS.yellow, width: 3, depth: 2, height: 3 },
    // Chest detail
    { position: [0, 1.92, -0.8], color: LEGO_COLORS.red, width: 1, depth: 1, height: 1 },
    // Arms
    { position: [-1.6, 2.4, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    { position: [1.6, 2.4, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    { position: [-2.4, 2.4, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    { position: [2.4, 2.4, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    // Head
    { position: [0, 3.36, 0], color: LEGO_COLORS.yellow, width: 2, depth: 2, height: 3 },
    // Eyes
    { position: [-0.4, 3.84, -0.8], color: LEGO_COLORS.blue, width: 1, depth: 1, height: 1 },
    { position: [0.4, 3.84, -0.8], color: LEGO_COLORS.blue, width: 1, depth: 1, height: 1 },
    // Antenna
    { position: [0, 4.32, 0], color: LEGO_COLORS.red, width: 1, depth: 1, height: 1 },
  ],
};

// Cozy House build
export const HOUSE_BUILD: BuildStructure = {
  name: "Cozy House",
  description: "A charming family home",
  totalBricks: 28,
  bricks: [
    // Foundation
    { position: [0, 0.48, 0], color: LEGO_COLORS.gray, width: 6, depth: 4, height: 1 },
    // Front wall left
    { position: [-2, 0.8, -1.6], color: LEGO_COLORS.white, width: 2, depth: 1, height: 3 },
    // Front wall right
    { position: [2, 0.8, -1.6], color: LEGO_COLORS.white, width: 2, depth: 1, height: 3 },
    // Door frame
    { position: [0, 0.8, -1.6], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    // Back wall
    { position: [0, 0.8, 1.6], color: LEGO_COLORS.white, width: 6, depth: 1, height: 3 },
    // Left wall
    { position: [-2.4, 0.8, 0], color: LEGO_COLORS.white, width: 1, depth: 3, height: 3 },
    // Right wall
    { position: [2.4, 0.8, 0], color: LEGO_COLORS.white, width: 1, depth: 3, height: 3 },
    // Second floor front
    { position: [0, 1.76, -1.6], color: LEGO_COLORS.white, width: 6, depth: 1, height: 3 },
    // Window left
    { position: [-1.6, 1.76, -1.6], color: LEGO_COLORS.cyan, width: 1, depth: 1, height: 1 },
    // Window right
    { position: [1.6, 1.76, -1.6], color: LEGO_COLORS.cyan, width: 1, depth: 1, height: 1 },
    // Roof base
    { position: [0, 2.72, 0], color: LEGO_COLORS.red, width: 6, depth: 4, height: 1 },
    // Roof peak left
    { position: [-0.8, 3.04, 0], color: LEGO_COLORS.red, width: 4, depth: 3, height: 1 },
    // Roof peak center
    { position: [0, 3.36, 0], color: LEGO_COLORS.red, width: 2, depth: 2, height: 1 },
    // Chimney
    { position: [1.6, 3.36, 0.8], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 3 },
  ],
};

// Race Car build
export const CAR_BUILD: BuildStructure = {
  name: "Race Car",
  description: "A speedy racing machine",
  totalBricks: 22,
  bricks: [
    // Chassis base
    { position: [0, 0.48, 0], color: LEGO_COLORS.red, width: 6, depth: 2, height: 1 },
    // Front bumper
    { position: [-2.4, 0.48, 0], color: LEGO_COLORS.black, width: 1, depth: 2, height: 1 },
    // Rear bumper
    { position: [2.4, 0.48, 0], color: LEGO_COLORS.black, width: 1, depth: 2, height: 1 },
    // Front wheels left
    { position: [-1.6, 0.32, -1.2], color: LEGO_COLORS.black, width: 1, depth: 1, height: 1 },
    // Front wheels right
    { position: [-1.6, 0.32, 1.2], color: LEGO_COLORS.black, width: 1, depth: 1, height: 1 },
    // Rear wheels left
    { position: [1.6, 0.32, -1.2], color: LEGO_COLORS.black, width: 1, depth: 1, height: 1 },
    // Rear wheels right
    { position: [1.6, 0.32, 1.2], color: LEGO_COLORS.black, width: 1, depth: 1, height: 1 },
    // Hood
    { position: [-1.2, 0.8, 0], color: LEGO_COLORS.red, width: 3, depth: 2, height: 1 },
    // Cockpit base
    { position: [0.4, 0.8, 0], color: LEGO_COLORS.red, width: 2, depth: 2, height: 1 },
    // Windshield
    { position: [-0.4, 1.12, 0], color: LEGO_COLORS.cyan, width: 1, depth: 2, height: 1 },
    // Driver seat
    { position: [0.4, 1.12, 0], color: LEGO_COLORS.black, width: 1, depth: 1, height: 1 },
    // Rear spoiler base
    { position: [2, 0.8, 0], color: LEGO_COLORS.red, width: 1, depth: 2, height: 1 },
    // Spoiler wing
    { position: [2, 1.44, 0], color: LEGO_COLORS.yellow, width: 1, depth: 3, height: 1 },
    // Racing stripe
    { position: [0, 1.12, 0], color: LEGO_COLORS.white, width: 4, depth: 1, height: 1 },
    // Headlights
    { position: [-2.4, 0.8, -0.4], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    { position: [-2.4, 0.8, 0.4], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
  ],
};

// Cute Duck build
export const DUCK_BUILD: BuildStructure = {
  name: "Rubber Duck",
  description: "An adorable yellow duck",
  totalBricks: 18,
  bricks: [
    // Body base
    { position: [0, 0.48, 0], color: LEGO_COLORS.yellow, width: 3, depth: 3, height: 3 },
    // Body middle
    { position: [0, 1.44, 0], color: LEGO_COLORS.yellow, width: 3, depth: 3, height: 3 },
    // Body top
    { position: [0, 2.4, 0], color: LEGO_COLORS.yellow, width: 2, depth: 2, height: 3 },
    // Tail
    { position: [1.2, 1.44, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 3 },
    { position: [1.6, 1.92, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    // Head
    { position: [-0.8, 3.36, 0], color: LEGO_COLORS.yellow, width: 2, depth: 2, height: 3 },
    // Beak top
    { position: [-1.6, 3.36, 0], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 1 },
    // Beak bottom
    { position: [-1.6, 3.04, 0], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 1 },
    // Left eye
    { position: [-1.2, 3.84, -0.4], color: LEGO_COLORS.black, width: 1, depth: 1, height: 1 },
    // Right eye
    { position: [-1.2, 3.84, 0.4], color: LEGO_COLORS.black, width: 1, depth: 1, height: 1 },
    // Wing left
    { position: [0, 1.44, -1.2], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    // Wing right
    { position: [0, 1.44, 1.2], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
  ],
};

// Millennium Falcon inspired build
export const STARSHIP_BUILD: BuildStructure = {
  name: "Millennium Starship",
  description: "An iconic smuggler's vessel",
  totalBricks: 85,
  bricks: [
    // Main disc body - layer 1
    { position: [0, 0.48, 0], color: LEGO_COLORS.gray, width: 8, depth: 6, height: 1 },
    { position: [-3.2, 0.48, 0], color: LEGO_COLORS.gray, width: 2, depth: 4, height: 1 },
    { position: [3.2, 0.48, 0], color: LEGO_COLORS.gray, width: 2, depth: 4, height: 1 },
    // Main disc body - layer 2
    { position: [0, 0.8, 0], color: LEGO_COLORS.darkGray, width: 6, depth: 4, height: 1 },
    { position: [-2.4, 0.8, 0], color: LEGO_COLORS.darkGray, width: 2, depth: 3, height: 1 },
    { position: [2.4, 0.8, 0], color: LEGO_COLORS.darkGray, width: 2, depth: 3, height: 1 },
    // Cockpit arm
    { position: [4.8, 0.48, 0], color: LEGO_COLORS.gray, width: 3, depth: 2, height: 1 },
    { position: [5.6, 0.8, 0], color: LEGO_COLORS.gray, width: 2, depth: 2, height: 1 },
    // Cockpit
    { position: [6.4, 1.12, 0], color: LEGO_COLORS.cyan, width: 1, depth: 1, height: 1 },
    // Mandibles (front forks)
    { position: [-4.8, 0.48, -1.2], color: LEGO_COLORS.gray, width: 3, depth: 1, height: 1 },
    { position: [-4.8, 0.48, 1.2], color: LEGO_COLORS.gray, width: 3, depth: 1, height: 1 },
    { position: [-6.4, 0.48, -1.2], color: LEGO_COLORS.darkGray, width: 2, depth: 1, height: 1 },
    { position: [-6.4, 0.48, 1.2], color: LEGO_COLORS.darkGray, width: 2, depth: 1, height: 1 },
    // Top details
    { position: [0, 1.12, 0], color: LEGO_COLORS.white, width: 4, depth: 3, height: 1 },
    { position: [1.6, 1.44, 0], color: LEGO_COLORS.white, width: 2, depth: 2, height: 1 },
    // Radar dish
    { position: [1.6, 1.76, 0], color: LEGO_COLORS.white, width: 1, depth: 1, height: 1 },
    // Engine exhausts
    { position: [3.2, 0.48, -1.6], color: LEGO_COLORS.blue, width: 1, depth: 1, height: 1 },
    { position: [3.2, 0.48, 1.6], color: LEGO_COLORS.blue, width: 1, depth: 1, height: 1 },
    { position: [3.2, 0.48, 0], color: LEGO_COLORS.blue, width: 1, depth: 1, height: 1 },
    // Landing gear
    { position: [-1.6, 0.16, -1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [-1.6, 0.16, 1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [1.6, 0.16, 0], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
  ],
};

// Dragon build
export const DRAGON_BUILD: BuildStructure = {
  name: "Fire Dragon",
  description: "A majestic fire-breathing dragon",
  totalBricks: 72,
  bricks: [
    // Body base
    { position: [0, 0.48, 0], color: LEGO_COLORS.red, width: 4, depth: 3, height: 3 },
    { position: [0, 1.44, 0], color: LEGO_COLORS.red, width: 4, depth: 3, height: 3 },
    { position: [0, 2.4, 0], color: LEGO_COLORS.red, width: 3, depth: 2, height: 3 },
    // Neck
    { position: [-2.4, 2.4, 0], color: LEGO_COLORS.red, width: 2, depth: 2, height: 3 },
    { position: [-3.2, 3.36, 0], color: LEGO_COLORS.red, width: 2, depth: 2, height: 3 },
    { position: [-4, 4.32, 0], color: LEGO_COLORS.red, width: 2, depth: 2, height: 3 },
    // Head
    { position: [-4.8, 5.28, 0], color: LEGO_COLORS.red, width: 3, depth: 2, height: 3 },
    { position: [-5.6, 5.28, 0], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 1 },
    // Eyes
    { position: [-5.2, 5.76, -0.4], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    { position: [-5.2, 5.76, 0.4], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    // Horns
    { position: [-4.4, 6.24, -0.4], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [-4.4, 6.24, 0.4], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    // Tail
    { position: [2.4, 1.44, 0], color: LEGO_COLORS.red, width: 2, depth: 2, height: 3 },
    { position: [3.2, 0.96, 0], color: LEGO_COLORS.red, width: 2, depth: 1, height: 3 },
    { position: [4, 0.48, 0], color: LEGO_COLORS.red, width: 2, depth: 1, height: 1 },
    { position: [4.8, 0.48, 0], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 1 },
    // Wings left
    { position: [0, 3.36, -2], color: LEGO_COLORS.red, width: 2, depth: 1, height: 3 },
    { position: [-0.8, 4.32, -2.8], color: LEGO_COLORS.red, width: 3, depth: 1, height: 1 },
    { position: [-1.6, 4.8, -3.6], color: LEGO_COLORS.red, width: 4, depth: 1, height: 1 },
    { position: [-2.4, 5.28, -4.4], color: LEGO_COLORS.orange, width: 3, depth: 1, height: 1 },
    // Wings right
    { position: [0, 3.36, 2], color: LEGO_COLORS.red, width: 2, depth: 1, height: 3 },
    { position: [-0.8, 4.32, 2.8], color: LEGO_COLORS.red, width: 3, depth: 1, height: 1 },
    { position: [-1.6, 4.8, 3.6], color: LEGO_COLORS.red, width: 4, depth: 1, height: 1 },
    { position: [-2.4, 5.28, 4.4], color: LEGO_COLORS.orange, width: 3, depth: 1, height: 1 },
    // Legs
    { position: [-0.8, 0.16, -1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [-0.8, 0.16, 1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [1.6, 0.16, -1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [1.6, 0.16, 1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    // Belly scales
    { position: [0, 0.48, 0], color: LEGO_COLORS.orange, width: 2, depth: 1, height: 1 },
    { position: [0, 1.44, 0], color: LEGO_COLORS.orange, width: 2, depth: 1, height: 1 },
  ],
};

// Pirate Ship build
export const PIRATE_SHIP_BUILD: BuildStructure = {
  name: "Black Pearl",
  description: "A fearsome pirate galleon",
  totalBricks: 90,
  bricks: [
    // Hull base
    { position: [0, 0.48, 0], color: LEGO_COLORS.brown, width: 8, depth: 3, height: 3 },
    { position: [-3.2, 0.48, 0], color: LEGO_COLORS.brown, width: 2, depth: 2, height: 3 },
    { position: [3.2, 0.48, 0], color: LEGO_COLORS.brown, width: 2, depth: 2, height: 3 },
    // Hull sides
    { position: [0, 1.44, -1.2], color: LEGO_COLORS.brown, width: 8, depth: 1, height: 3 },
    { position: [0, 1.44, 1.2], color: LEGO_COLORS.brown, width: 8, depth: 1, height: 3 },
    // Deck
    { position: [0, 2.4, 0], color: LEGO_COLORS.tan, width: 6, depth: 2, height: 1 },
    // Bow (front)
    { position: [-4, 1.44, 0], color: LEGO_COLORS.brown, width: 2, depth: 2, height: 3 },
    { position: [-4.8, 2.4, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    { position: [-5.6, 2.88, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    // Stern (back)
    { position: [4, 1.44, 0], color: LEGO_COLORS.brown, width: 2, depth: 2, height: 3 },
    { position: [4, 2.4, 0], color: LEGO_COLORS.brown, width: 2, depth: 2, height: 3 },
    { position: [4, 3.36, 0], color: LEGO_COLORS.brown, width: 2, depth: 2, height: 1 },
    // Captain's cabin
    { position: [4, 3.68, 0], color: LEGO_COLORS.tan, width: 2, depth: 2, height: 1 },
    { position: [4, 4, 0], color: LEGO_COLORS.red, width: 2, depth: 2, height: 1 },
    // Main mast
    { position: [0, 2.72, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    { position: [0, 3.68, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    { position: [0, 4.64, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    { position: [0, 5.6, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    // Main sail
    { position: [0, 4.64, 0], color: LEGO_COLORS.white, width: 1, depth: 4, height: 3 },
    { position: [0, 5.6, 0], color: LEGO_COLORS.white, width: 1, depth: 3, height: 3 },
    // Front mast
    { position: [-2.4, 2.72, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    { position: [-2.4, 3.68, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    { position: [-2.4, 4.64, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 3 },
    // Front sail
    { position: [-2.4, 3.68, 0], color: LEGO_COLORS.white, width: 1, depth: 3, height: 3 },
    { position: [-2.4, 4.64, 0], color: LEGO_COLORS.white, width: 1, depth: 2, height: 3 },
    // Crow's nest
    { position: [0, 6.56, 0], color: LEGO_COLORS.brown, width: 1, depth: 1, height: 1 },
    // Jolly Roger flag
    { position: [0, 7.04, 0], color: LEGO_COLORS.black, width: 1, depth: 2, height: 1 },
    // Cannons
    { position: [-1.6, 1.76, -1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [0, 1.76, -1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [1.6, 1.76, -1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [-1.6, 1.76, 1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [0, 1.76, 1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
    { position: [1.6, 1.76, 1.6], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 1 },
  ],
};

// Mech Warrior build
export const MECH_BUILD: BuildStructure = {
  name: "Titan Mech",
  description: "A towering battle mech",
  totalBricks: 78,
  bricks: [
    // Feet
    { position: [-1.6, 0.48, 0], color: LEGO_COLORS.darkGray, width: 2, depth: 3, height: 1 },
    { position: [1.6, 0.48, 0], color: LEGO_COLORS.darkGray, width: 2, depth: 3, height: 1 },
    // Lower legs
    { position: [-1.6, 0.8, 0], color: LEGO_COLORS.gray, width: 1, depth: 2, height: 3 },
    { position: [1.6, 0.8, 0], color: LEGO_COLORS.gray, width: 1, depth: 2, height: 3 },
    { position: [-1.6, 1.76, 0], color: LEGO_COLORS.gray, width: 1, depth: 2, height: 3 },
    { position: [1.6, 1.76, 0], color: LEGO_COLORS.gray, width: 1, depth: 2, height: 3 },
    // Knee joints
    { position: [-1.6, 2.72, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    { position: [1.6, 2.72, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    // Upper legs
    { position: [-1.6, 3.04, 0], color: LEGO_COLORS.gray, width: 1, depth: 2, height: 3 },
    { position: [1.6, 3.04, 0], color: LEGO_COLORS.gray, width: 1, depth: 2, height: 3 },
    // Hip joints
    { position: [-1.6, 4, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    { position: [1.6, 4, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    // Torso base
    { position: [0, 4.32, 0], color: LEGO_COLORS.blue, width: 4, depth: 3, height: 3 },
    { position: [0, 5.28, 0], color: LEGO_COLORS.blue, width: 4, depth: 3, height: 3 },
    // Chest plate
    { position: [0, 5.28, -1.2], color: LEGO_COLORS.red, width: 2, depth: 1, height: 3 },
    // Reactor core
    { position: [0, 5.76, -1.2], color: LEGO_COLORS.cyan, width: 1, depth: 1, height: 1 },
    // Shoulders
    { position: [-2.4, 5.28, 0], color: LEGO_COLORS.gray, width: 1, depth: 2, height: 3 },
    { position: [2.4, 5.28, 0], color: LEGO_COLORS.gray, width: 1, depth: 2, height: 3 },
    // Shoulder armor
    { position: [-2.8, 5.76, 0], color: LEGO_COLORS.blue, width: 1, depth: 3, height: 1 },
    { position: [2.8, 5.76, 0], color: LEGO_COLORS.blue, width: 1, depth: 3, height: 1 },
    // Upper arms
    { position: [-3.2, 4.8, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    { position: [3.2, 4.8, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    // Elbow joints
    { position: [-3.2, 4.32, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    { position: [3.2, 4.32, 0], color: LEGO_COLORS.yellow, width: 1, depth: 1, height: 1 },
    // Lower arms
    { position: [-3.2, 3.84, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    { position: [3.2, 3.84, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    // Left hand - cannon
    { position: [-3.2, 2.88, 0], color: LEGO_COLORS.darkGray, width: 1, depth: 2, height: 3 },
    { position: [-3.2, 2.4, -0.8], color: LEGO_COLORS.red, width: 1, depth: 1, height: 1 },
    // Right hand - blade
    { position: [3.2, 2.88, 0], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 3 },
    { position: [3.2, 2.4, 0], color: LEGO_COLORS.cyan, width: 1, depth: 3, height: 1 },
    // Head
    { position: [0, 6.24, 0], color: LEGO_COLORS.gray, width: 2, depth: 2, height: 3 },
    // Visor
    { position: [0, 6.72, -0.8], color: LEGO_COLORS.cyan, width: 2, depth: 1, height: 1 },
    // Antenna
    { position: [-0.4, 7.2, 0], color: LEGO_COLORS.red, width: 1, depth: 1, height: 1 },
    { position: [0.4, 7.2, 0], color: LEGO_COLORS.red, width: 1, depth: 1, height: 1 },
    // Back thrusters
    { position: [-0.8, 5.28, 1.2], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 3 },
    { position: [0.8, 5.28, 1.2], color: LEGO_COLORS.darkGray, width: 1, depth: 1, height: 3 },
    { position: [-0.8, 4.8, 1.6], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 1 },
    { position: [0.8, 4.8, 1.6], color: LEGO_COLORS.orange, width: 1, depth: 1, height: 1 },
  ],
};

// Tower/Skyscraper build
export const TOWER_BUILD: BuildStructure = {
  name: "Sky Tower",
  description: "A gleaming modern skyscraper",
  totalBricks: 65,
  bricks: [
    // Foundation
    { position: [0, 0.48, 0], color: LEGO_COLORS.gray, width: 6, depth: 6, height: 1 },
    // Ground floor
    { position: [0, 0.8, 0], color: LEGO_COLORS.white, width: 5, depth: 5, height: 3 },
    { position: [0, 0.8, -2], color: LEGO_COLORS.cyan, width: 3, depth: 1, height: 3 },
    // Floor 2
    { position: [0, 1.76, 0], color: LEGO_COLORS.white, width: 5, depth: 5, height: 3 },
    { position: [-2, 1.76, 0], color: LEGO_COLORS.cyan, width: 1, depth: 3, height: 3 },
    { position: [2, 1.76, 0], color: LEGO_COLORS.cyan, width: 1, depth: 3, height: 3 },
    // Floor 3
    { position: [0, 2.72, 0], color: LEGO_COLORS.white, width: 4, depth: 4, height: 3 },
    { position: [0, 2.72, -1.6], color: LEGO_COLORS.cyan, width: 2, depth: 1, height: 3 },
    // Floor 4
    { position: [0, 3.68, 0], color: LEGO_COLORS.white, width: 4, depth: 4, height: 3 },
    { position: [-1.6, 3.68, 0], color: LEGO_COLORS.cyan, width: 1, depth: 2, height: 3 },
    { position: [1.6, 3.68, 0], color: LEGO_COLORS.cyan, width: 1, depth: 2, height: 3 },
    // Floor 5
    { position: [0, 4.64, 0], color: LEGO_COLORS.white, width: 3, depth: 3, height: 3 },
    { position: [0, 4.64, -1.2], color: LEGO_COLORS.cyan, width: 2, depth: 1, height: 3 },
    // Floor 6
    { position: [0, 5.6, 0], color: LEGO_COLORS.white, width: 3, depth: 3, height: 3 },
    // Floor 7
    { position: [0, 6.56, 0], color: LEGO_COLORS.white, width: 2, depth: 2, height: 3 },
    { position: [0, 6.56, -0.8], color: LEGO_COLORS.cyan, width: 1, depth: 1, height: 3 },
    // Floor 8
    { position: [0, 7.52, 0], color: LEGO_COLORS.white, width: 2, depth: 2, height: 3 },
    // Spire base
    { position: [0, 8.48, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    // Spire
    { position: [0, 9.44, 0], color: LEGO_COLORS.gray, width: 1, depth: 1, height: 3 },
    { position: [0, 10.4, 0], color: LEGO_COLORS.red, width: 1, depth: 1, height: 1 },
    // Helipad
    { position: [0, 8.16, 0], color: LEGO_COLORS.darkGray, width: 2, depth: 2, height: 1 },
  ],
};

export const BUILD_STRUCTURES = [
  SPACESHIP_BUILD, 
  CASTLE_BUILD, 
  ROBOT_BUILD, 
  HOUSE_BUILD, 
  CAR_BUILD, 
  DUCK_BUILD,
  STARSHIP_BUILD,
  DRAGON_BUILD,
  PIRATE_SHIP_BUILD,
  MECH_BUILD,
  TOWER_BUILD,
];
