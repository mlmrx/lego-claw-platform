/**
 * LegoScene3D Component
 * Full 3D scene for viewing LEGO builds with orbit controls
 */

import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, PerspectiveCamera } from "@react-three/drei";
import { LegoBrick3D, LEGO_COLORS, BrickPlacement } from "./LegoBrick3D";
import * as THREE from "three";

// Baseplate component
function Baseplate({ size = 16, color = "#237841" }: { size?: number; color?: string }) {
  const plateSize = size * 0.8;
  
  return (
    <group position={[0, -0.08, 0]}>
      {/* Main plate */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[plateSize, plateSize]} />
        <meshStandardMaterial color={color} roughness={0.4} />
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
            <cylinderGeometry args={[0.24, 0.24, 0.04, 12]} />
            <meshStandardMaterial color={color} roughness={0.4} />
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
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 8, 10]} fov={45} />
        <AnimatedCamera autoRotate={autoRotate} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
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
        <Baseplate size={16} color={LEGO_COLORS.green} />
        
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

export const BUILD_STRUCTURES = [SPACESHIP_BUILD, CASTLE_BUILD, ROBOT_BUILD, HOUSE_BUILD, CAR_BUILD, DUCK_BUILD];
