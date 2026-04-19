/**
 * ShapeBrick3D - Renders specialty LEGO brick shapes in Three.js
 * Supports: standard, plate, slope, arch, cylinder, cone, wedge, round,
 * curved, tile, fence, window, door, flag, antenna, wheel, wing, stair, corner, inverted
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { BrickShape } from "@/lib/brickCatalog";

const STUD_RADIUS = 0.24;
const STUD_HEIGHT = 0.16;
const UNIT = 0.8; // 1 stud = 0.8 units
const PLATE_HEIGHT = 0.32;

interface ShapeBrick3DProps {
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number; // in plates (3 = standard, 1 = plate)
  shape: BrickShape;
  opacity?: number;
  animate?: boolean;
  wireframe?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

function Studs({ width, depth, color, yOffset }: { width: number; depth: number; color: string; yOffset: number }) {
  const studs = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        positions.push([
          (x - (width - 1) / 2) * UNIT,
          yOffset,
          (z - (depth - 1) / 2) * UNIT,
        ]);
      }
    }
    return positions;
  }, [width, depth, yOffset]);

  return (
    <>
      {studs.map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

function StandardBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  return (
    <group>
      <mesh>
        <boxGeometry args={[width * UNIT, h, depth * UNIT]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {opacity >= 1 && <Studs width={width} depth={depth} color={color} yOffset={h / 2 + STUD_HEIGHT / 2} />}
    </group>
  );
}

function SlopeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-width * UNIT / 2, -h / 2);
    s.lineTo(width * UNIT / 2, -h / 2);
    s.lineTo(width * UNIT / 2, h / 2);
    s.lineTo(-width * UNIT / 2, -h / 2);
    return s;
  }, [width, h]);

  const extrudeSettings = useMemo(() => ({
    depth: depth * UNIT,
    bevelEnabled: false,
  }), [depth]);

  return (
    <group>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -depth * UNIT / 2]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

function InvertedSlopeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-width * UNIT / 2, h / 2);
    s.lineTo(width * UNIT / 2, h / 2);
    s.lineTo(width * UNIT / 2, -h / 2);
    s.lineTo(-width * UNIT / 2, h / 2);
    return s;
  }, [width, h]);

  const extrudeSettings = useMemo(() => ({
    depth: depth * UNIT,
    bevelEnabled: false,
  }), [depth]);

  return (
    <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -depth * UNIT / 2]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function ArchBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = width * UNIT;
    // Outer rectangle
    s.moveTo(-w / 2, -h / 2);
    s.lineTo(w / 2, -h / 2);
    s.lineTo(w / 2, h / 2);
    s.lineTo(-w / 2, h / 2);
    s.lineTo(-w / 2, -h / 2);
    // Inner arch cutout
    const hole = new THREE.Path();
    const archW = w * 0.6;
    const archH = h * 0.6;
    hole.moveTo(-archW / 2, -h / 2);
    hole.lineTo(-archW / 2, -h / 2 + archH * 0.3);
    hole.quadraticCurveTo(0, -h / 2 + archH, archW / 2, -h / 2 + archH * 0.3);
    hole.lineTo(archW / 2, -h / 2);
    hole.lineTo(-archW / 2, -h / 2);
    s.holes.push(hole);
    return s;
  }, [width, h]);

  const extrudeSettings = useMemo(() => ({
    depth: depth * UNIT,
    bevelEnabled: false,
  }), [depth]);

  return (
    <group>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -depth * UNIT / 2]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {opacity >= 1 && <Studs width={width} depth={depth} color={color} yOffset={h / 2 + STUD_HEIGHT / 2} />}
    </group>
  );
}

function CylinderBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const radius = Math.max(width, depth) * UNIT / 2;
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[radius, radius, h, 24]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {opacity >= 1 && (
        <mesh position={[0, h / 2 + STUD_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

function ConeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const radius = Math.max(width, depth) * UNIT / 2;
  return (
    <mesh>
      <coneGeometry args={[radius, h, 24]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function WedgeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const w = width * UNIT;
  const d = depth * UNIT;
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Triangle face front
      -w/2, -h/2, d/2,
      w/2, -h/2, d/2,
      0, h/2, 0,
      // Triangle face back
      -w/2, -h/2, -d/2,
      0, h/2, 0,
      w/2, -h/2, -d/2,
      // Bottom
      -w/2, -h/2, -d/2,
      w/2, -h/2, -d/2,
      w/2, -h/2, d/2,
      -w/2, -h/2, -d/2,
      w/2, -h/2, d/2,
      -w/2, -h/2, d/2,
      // Left side
      -w/2, -h/2, -d/2,
      -w/2, -h/2, d/2,
      0, h/2, 0,
      // Right side
      w/2, -h/2, d/2,
      w/2, -h/2, -d/2,
      0, h/2, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, [w, d, h]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CurvedSlopeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = width * UNIT;
    s.moveTo(-w / 2, -h / 2);
    s.lineTo(w / 2, -h / 2);
    s.quadraticCurveTo(w / 2, h / 2, -w / 2, h / 4);
    s.lineTo(-w / 2, -h / 2);
    return s;
  }, [width, h]);

  const extrudeSettings = useMemo(() => ({
    depth: depth * UNIT,
    bevelEnabled: false,
  }), [depth]);

  return (
    <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -depth * UNIT / 2]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function FenceBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const posts = useMemo(() => {
    const p: number[] = [];
    for (let i = 0; i <= width; i++) {
      p.push((i - width / 2) * UNIT);
    }
    return p;
  }, [width]);

  return (
    <group>
      {/* Posts */}
      {posts.map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[UNIT * 0.15, h, depth * UNIT * 0.15]} />
          <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, h * 0.35, 0]}>
        <boxGeometry args={[width * UNIT, h * 0.1, depth * UNIT * 0.15]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* Bottom rail */}
      <mesh position={[0, -h * 0.15, 0]}>
        <boxGeometry args={[width * UNIT, h * 0.1, depth * UNIT * 0.15]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

function WindowBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  return (
    <group>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[width * UNIT, h, depth * UNIT]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* Glass pane */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width * UNIT * 0.7, h * 0.7, depth * UNIT * 0.3]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function DoorBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  return (
    <group>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[width * UNIT, h, depth * UNIT]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* Door panel */}
      <mesh position={[0, -h * 0.05, depth * UNIT * 0.3]}>
        <boxGeometry args={[width * UNIT * 0.7, h * 0.85, depth * UNIT * 0.1]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={Math.min(opacity, 0.9)} />
      </mesh>
      {/* Handle */}
      <mesh position={[width * UNIT * 0.2, 0, depth * UNIT * 0.4]}>
        <sphereGeometry args={[UNIT * 0.08, 8, 8]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function FlagBrick({ width: _w, depth: _d, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  return (
    <group>
      {/* Pole */}
      <mesh>
        <cylinderGeometry args={[UNIT * 0.05, UNIT * 0.05, h, 8]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      {/* Flag fabric */}
      <mesh position={[UNIT * 0.4, h * 0.25, 0]}>
        <boxGeometry args={[UNIT * 0.8, h * 0.4, UNIT * 0.05]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AntennaBrick({ width: _w, depth: _d, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[UNIT * 0.04, UNIT * 0.06, h, 8]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* Tip */}
      <mesh position={[0, h / 2, 0]}>
        <sphereGeometry args={[UNIT * 0.08, 8, 8]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

function WheelBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const radius = Math.max(width, depth) * UNIT / 2;
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Tire */}
      <mesh>
        <torusGeometry args={[radius * 0.7, radius * 0.3, 12, 24]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* Hub */}
      <mesh>
        <cylinderGeometry args={[radius * 0.35, radius * 0.35, h * 0.3, 16]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function WingBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = Math.max(height * PLATE_HEIGHT, 0.16);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = width * UNIT;
    const d = depth * UNIT;
    s.moveTo(0, 0);
    s.lineTo(w, 0);
    s.lineTo(w * 0.7, d);
    s.lineTo(0, d * 0.3);
    s.lineTo(0, 0);
    return s;
  }, [width, depth]);

  const extrudeSettings = useMemo(() => ({
    depth: h,
    bevelEnabled: false,
  }), [h]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-width * UNIT / 2, h / 2, -depth * UNIT / 2]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function StairBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const stepH = h / 2;
  return (
    <group>
      {/* Bottom step */}
      <mesh position={[width * UNIT * 0.125, -stepH / 2, 0]}>
        <boxGeometry args={[width * UNIT * 0.75, stepH, depth * UNIT]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* Top step */}
      <mesh position={[-width * UNIT * 0.25, stepH / 2, 0]}>
        <boxGeometry args={[width * UNIT * 0.5, stepH, depth * UNIT]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

function CornerBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  return (
    <group>
      <mesh position={[0, 0, -depth * UNIT / 4]}>
        <boxGeometry args={[width * UNIT, h, depth * UNIT / 2]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[-width * UNIT / 4, 0, depth * UNIT / 4]}>
        <boxGeometry args={[width * UNIT / 2, h, depth * UNIT / 2]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

function RoundBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  const radius = Math.max(width, depth) * UNIT / 2;
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[radius, radius, h, 24]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {opacity >= 1 && <Studs width={Math.min(width, 2)} depth={Math.min(depth, 2)} color={color} yOffset={h / 2 + STUD_HEIGHT / 2} />}
    </group>
  );
}

function TileBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_HEIGHT;
  return (
    <mesh>
      <boxGeometry args={[width * UNIT, h, depth * UNIT]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ShapeBrick3D({
  position,
  color,
  width,
  depth,
  height,
  shape,
  opacity = 1,
  animate = false,
  wireframe = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: ShapeBrick3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (animate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  const shapeComponent = useMemo(() => {
    const props = { width, depth, height, color, opacity };
    switch (shape) {
      case "slope": return <SlopeBrick {...props} />;
      case "inverted": return <InvertedSlopeBrick {...props} />;
      case "arch": return <ArchBrick {...props} />;
      case "cylinder": return <CylinderBrick {...props} />;
      case "cone": return <ConeBrick {...props} />;
      case "wedge": return <WedgeBrick {...props} />;
      case "curved": return <CurvedSlopeBrick {...props} />;
      case "round": return <RoundBrick {...props} />;
      case "tile": return <TileBrick {...props} />;
      case "fence": return <FenceBrick {...props} />;
      case "window": return <WindowBrick {...props} />;
      case "door": return <DoorBrick {...props} />;
      case "flag": return <FlagBrick {...props} />;
      case "antenna": return <AntennaBrick {...props} />;
      case "wheel": return <WheelBrick {...props} />;
      case "wing": return <WingBrick {...props} />;
      case "stair": return <StairBrick {...props} />;
      case "corner": return <CornerBrick {...props} />;
      case "plate": return <StandardBrick {...props} height={Math.max(height, 1)} />;
      case "standard":
      default:
        return <StandardBrick {...props} />;
    }
  }, [width, depth, height, color, opacity, shape]);

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {shapeComponent}
      {wireframe && (
        <mesh>
          <boxGeometry args={[width * UNIT, height * PLATE_HEIGHT, depth * UNIT]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
