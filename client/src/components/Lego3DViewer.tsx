/**
 * 3D LEGO Viewer Component
 * Renders a realistic 3D LEGO build with proper brick stacking, studs, and animations
 */

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// LEGO brick dimensions (in LEGO units, 1 unit = 8mm)
const STUD_RADIUS = 0.3;
const STUD_HEIGHT = 0.2;
const BRICK_HEIGHT = 1.2; // Standard brick height (3 plates)
const PLATE_HEIGHT = 0.4; // Plate height
const UNIT_SIZE = 1; // 1 unit width/depth

// LEGO Colors palette
const LEGO_COLORS: Record<string, string> = {
  red: "#C4281B",
  blue: "#0055BF",
  yellow: "#F5CD2F",
  green: "#237841",
  white: "#FFFFFF",
  black: "#1B2A34",
  orange: "#FE8A18",
  "light-gray": "#A0A5A9",
  "dark-gray": "#6D6E5C",
  brown: "#583927",
  tan: "#E4CD9E",
  "bright-green": "#4B9F4A",
  "dark-blue": "#0A3463",
  "dark-red": "#720E0F",
  pink: "#FC97AC",
  purple: "#81007B",
  cyan: "#068D9D",
  lime: "#BBE90B",
};

interface BrickData {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number; // in studs (e.g., 2 for 2x4)
  depth: number; // in studs (e.g., 4 for 2x4)
  color: string;
  isPlate?: boolean;
  placedAt?: number;
}

// Single LEGO Stud
function Stud({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 16]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

// Single LEGO Brick with studs
function LegoBrick({ 
  brick, 
  isNew = false 
}: { 
  brick: BrickData; 
  isNew?: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [animationProgress, setAnimationProgress] = useState(isNew ? 0 : 1);
  
  const color = LEGO_COLORS[brick.color] || brick.color || LEGO_COLORS.red;
  const height = brick.isPlate ? PLATE_HEIGHT : BRICK_HEIGHT;
  
  // Animation for new bricks
  useFrame((_, delta) => {
    if (animationProgress < 1) {
      setAnimationProgress(prev => Math.min(prev + delta * 3, 1));
    }
  });

  // Calculate position (convert grid position to 3D coordinates)
  const posX = brick.x * UNIT_SIZE;
  const posY = brick.y * height + height / 2;
  const posZ = brick.z * UNIT_SIZE;

  // Brick dimensions
  const brickWidth = brick.width * UNIT_SIZE;
  const brickDepth = brick.depth * UNIT_SIZE;

  // Generate stud positions
  const studs = useMemo(() => {
    const studPositions: [number, number, number][] = [];
    for (let sx = 0; sx < brick.width; sx++) {
      for (let sz = 0; sz < brick.depth; sz++) {
        const studX = (sx - (brick.width - 1) / 2) * UNIT_SIZE;
        const studZ = (sz - (brick.depth - 1) / 2) * UNIT_SIZE;
        studPositions.push([studX, height / 2 + STUD_HEIGHT / 2, studZ]);
      }
    }
    return studPositions;
  }, [brick.width, brick.depth, height]);

  // Animation scale and position offset
  const scale = isNew ? animationProgress : 1;
  const yOffset = isNew ? (1 - animationProgress) * 3 : 0;

  return (
    <group 
      ref={meshRef} 
      position={[posX, posY + yOffset, posZ]}
      scale={[scale, scale, scale]}
    >
      {/* Main brick body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[brickWidth - 0.02, height - 0.02, brickDepth - 0.02]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Studs on top */}
      {studs.map((pos, i) => (
        <Stud key={i} position={pos} color={color} />
      ))}
      
      {/* Bottom tubes (simplified) */}
      <mesh position={[0, -height / 2 + 0.05, 0]}>
        <boxGeometry args={[brickWidth - 0.1, 0.1, brickDepth - 0.1]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
}

// Baseplate
function Baseplate({ size = 16, color = "#237841" }: { size?: number; color?: string }) {
  const plateColor = LEGO_COLORS[color] || color;
  
  // Generate stud positions for baseplate
  const studs = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const posX = (x - (size - 1) / 2) * UNIT_SIZE;
        const posZ = (z - (size - 1) / 2) * UNIT_SIZE;
        positions.push([posX, PLATE_HEIGHT / 2 + STUD_HEIGHT / 2, posZ]);
      }
    }
    return positions;
  }, [size]);

  return (
    <group position={[0, 0, 0]}>
      {/* Baseplate body */}
      <mesh receiveShadow position={[0, PLATE_HEIGHT / 2, 0]}>
        <boxGeometry args={[size * UNIT_SIZE, PLATE_HEIGHT, size * UNIT_SIZE]} />
        <meshStandardMaterial color={plateColor} roughness={0.4} metalness={0.05} />
      </mesh>
      
      {/* Studs */}
      {studs.map((pos, i) => (
        <Stud key={i} position={pos} color={plateColor} />
      ))}
    </group>
  );
}

// Camera controller with auto-rotation option
function CameraController({ autoRotate = true }: { autoRotate?: boolean }) {
  const controlsRef = useRef<any>(null);
  
  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      enablePan={true}
      enableZoom={true}
      minDistance={5}
      maxDistance={50}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
    />
  );
}

// Main 3D Scene
function LegoScene({ 
  bricks, 
  showBaseplate = true,
  baseplateSize = 16,
  autoRotate = true,
}: { 
  bricks: BrickData[];
  showBaseplate?: boolean;
  baseplateSize?: number;
  autoRotate?: boolean;
}) {
  const [newBrickIds, setNewBrickIds] = useState<Set<string>>(new Set());
  const prevBrickCount = useRef(0);

  // Track new bricks for animation
  useEffect(() => {
    if (bricks.length > prevBrickCount.current) {
      const newIds = new Set<string>();
      bricks.slice(prevBrickCount.current).forEach(b => newIds.add(b.id));
      setNewBrickIds(newIds);
      
      // Clear new status after animation
      setTimeout(() => setNewBrickIds(new Set()), 1000);
    }
    prevBrickCount.current = bricks.length;
  }, [bricks.length]);

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} />
      <CameraController autoRotate={autoRotate} />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      
      {/* Environment for reflections */}
      <Environment preset="studio" />
      
      {/* Ground shadow */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={40}
        blur={2}
        far={10}
      />
      
      {/* Baseplate */}
      {showBaseplate && <Baseplate size={baseplateSize} />}
      
      {/* Bricks */}
      {bricks.map((brick) => (
        <LegoBrick
          key={brick.id}
          brick={brick}
          isNew={newBrickIds.has(brick.id)}
        />
      ))}
    </>
  );
}

// Main exported component
interface Lego3DViewerProps {
  bricks: BrickData[];
  showBaseplate?: boolean;
  baseplateSize?: number;
  autoRotate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Lego3DViewer({
  bricks,
  showBaseplate = true,
  baseplateSize = 16,
  autoRotate = true,
  className = "",
  style,
}: Lego3DViewerProps) {
  return (
    <div className={`w-full h-full ${className}`} style={style}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <LegoScene
          bricks={bricks}
          showBaseplate={showBaseplate}
          baseplateSize={baseplateSize}
          autoRotate={autoRotate}
        />
      </Canvas>
    </div>
  );
}

// Helper to convert agent brick placements to 3D brick data
export function convertToBrickData(placements: Array<{
  x: number;
  y: number;
  z: number;
  color: string;
  type: string;
  placedBy?: string;
  timestamp?: number;
}>): BrickData[] {
  return placements.map((p, i) => {
    // Parse brick type (e.g., "2x4", "1x2", "2x2")
    const typeMatch = p.type?.match(/(\d+)x(\d+)/);
    const width = typeMatch ? parseInt(typeMatch[1]) : 2;
    const depth = typeMatch ? parseInt(typeMatch[2]) : 4;
    const isPlate = p.type?.toLowerCase().includes("plate");
    
    // Normalize color
    let color = p.color?.toLowerCase().replace(/[^a-z-]/g, "") || "red";
    if (!LEGO_COLORS[color] && p.color?.startsWith("#")) {
      color = p.color;
    }
    
    return {
      id: `brick-${i}-${p.timestamp || Date.now()}`,
      x: p.x,
      y: p.y,
      z: p.z,
      width,
      depth,
      color,
      isPlate,
      placedAt: p.timestamp,
    };
  });
}

// Export types
export type { BrickData };
