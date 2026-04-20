/**
 * ShapeBrick3D - Renders specialty LEGO brick shapes in Three.js
 *
 * Uses the same authentic LEGO proportions as LegoBrick3D:
 *   1 stud pitch = 1.0 unit, brick height = 1.2 (3 plates), plate = 0.4
 *   Stud radius = 0.24, stud height = 0.2
 *
 * Every shape is positioned so its geometric center sits at (0,0,0)
 * within the group, and the group is placed at the brick's world position.
 * This ensures zero-gap stacking with the grid system.
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { BrickShape } from "@/lib/brickCatalog";

// ── Shared constants (must match LegoBrick3D) ──
const UNIT = 1.0;
const PLATE_H = 0.4;
const STUD_RADIUS = 0.24;
const STUD_HEIGHT = 0.2;

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

// ── Reusable stud grid ──
function Studs({ width, depth, color, yOffset, opacity = 1 }: {
  width: number; depth: number; color: string; yOffset: number; opacity?: number;
}) {
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
          <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 16]} />
          <meshStandardMaterial
            color={color}
            roughness={0.35}
            metalness={0.0}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      ))}
    </>
  );
}

// ── ABS plastic material helper ──
function useBrickMaterial(color: string, opacity: number) {
  return useMemo(
    () => new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.35,
      metalness: 0.0,
      transparent: opacity < 1,
      opacity,
      ...(opacity < 1 ? { depthWrite: false } : {}),
    }),
    [color, opacity]
  );
}

// ════════════════════════════════════════════
// SHAPE COMPONENTS
// ════════════════════════════════════════════

function StandardBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;
  return (
    <group>
      <mesh material={mat} castShadow receiveShadow>
        <boxGeometry args={[w - 0.02, h - 0.02, d - 0.02]} />
      </mesh>
      {opacity >= 0.9 && (
        <Studs width={width} depth={depth} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

function SlopeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;

  // Slope: full height on one side, plate-height lip on the other
  const geo = useMemo(() => {
    const lip = PLATE_H; // thin lip at the low end
    // 8 vertices forming the slope shape
    const vertices = new Float32Array([
      // Front face (z = +d/2): full rectangle
      -w/2, -h/2, d/2,   w/2, -h/2, d/2,   w/2, h/2, d/2,   -w/2, h/2, d/2,
      // Back face (z = -d/2): shorter (lip height)
      -w/2, -h/2, -d/2,  w/2, -h/2, -d/2,  w/2, -h/2+lip, -d/2, -w/2, -h/2+lip, -d/2,
    ]);
    const indices = [
      // Front
      0,1,2, 0,2,3,
      // Back
      4,6,5, 4,7,6,
      // Bottom
      0,5,1, 0,4,5,
      // Top (slope surface)
      3,2,6, 3,6,7,
      // Left
      0,3,7, 0,7,4,
      // Right
      1,5,6, 1,6,2,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [w, d, h]);

  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      {/* Single row of studs at the high end */}
      {opacity >= 0.9 && (
        <Studs width={width} depth={1} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

function InvertedSlopeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;

  const geo = useMemo(() => {
    const lip = PLATE_H;
    const vertices = new Float32Array([
      // Front face (z = +d/2): full rectangle
      -w/2, -h/2, d/2,   w/2, -h/2, d/2,   w/2, h/2, d/2,   -w/2, h/2, d/2,
      // Back face (z = -d/2): full top, narrower bottom
      -w/2, h/2-lip, -d/2,  w/2, h/2-lip, -d/2,  w/2, h/2, -d/2, -w/2, h/2, -d/2,
    ]);
    const indices = [
      0,1,2, 0,2,3,
      4,6,5, 4,7,6,
      0,5,1, 0,4,5,
      3,2,6, 3,6,7,
      0,3,7, 0,7,4,
      1,5,6, 1,6,2,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [w, d, h]);

  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      {opacity >= 0.9 && (
        <Studs width={width} depth={depth} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

function ArchBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Outer rectangle
    s.moveTo(-w / 2, -h / 2);
    s.lineTo(w / 2, -h / 2);
    s.lineTo(w / 2, h / 2);
    s.lineTo(-w / 2, h / 2);
    s.lineTo(-w / 2, -h / 2);
    // Arch cutout from bottom center
    const archW = w * 0.6;
    const archH = h * 0.55;
    const hole = new THREE.Path();
    hole.moveTo(-archW / 2, -h / 2);
    hole.lineTo(-archW / 2, -h / 2 + archH * 0.4);
    hole.quadraticCurveTo(0, -h / 2 + archH, archW / 2, -h / 2 + archH * 0.4);
    hole.lineTo(archW / 2, -h / 2);
    hole.lineTo(-archW / 2, -h / 2);
    s.holes.push(hole);
    return s;
  }, [w, h]);

  return (
    <group>
      <mesh position={[0, 0, -d / 2]}
            material={mat} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: d, bevelEnabled: false }]} />
      </mesh>
      {opacity >= 0.9 && (
        <Studs width={width} depth={depth} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

function CylinderBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const radius = Math.max(width, depth) * UNIT / 2;
  return (
    <group>
      <mesh material={mat} castShadow receiveShadow>
        <cylinderGeometry args={[radius - 0.01, radius - 0.01, h - 0.02, 24]} />
      </mesh>
      {/* Single stud on top */}
      {opacity >= 0.9 && (
        <mesh position={[0, h / 2 + STUD_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 16]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0}
            transparent={opacity < 1} opacity={opacity} />
        </mesh>
      )}
    </group>
  );
}

function ConeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const radius = Math.max(width, depth) * UNIT / 2;
  return (
    <mesh material={mat} castShadow receiveShadow>
      <coneGeometry args={[radius - 0.01, h - 0.02, 24]} />
    </mesh>
  );
}

function WedgeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;

  const geo = useMemo(() => {
    // Wedge: full rectangle at front, narrows to a ridge at back
    const vertices = new Float32Array([
      // Front face (z = +d/2) - full rectangle
      -w/2, -h/2, d/2,   w/2, -h/2, d/2,   w/2, h/2, d/2,   -w/2, h/2, d/2,
      // Back ridge (z = -d/2) - narrow line at top
      0, h/2, -d/2,   0, -h/2, -d/2,
    ]);
    const indices = [
      // Front
      0,1,2, 0,2,3,
      // Bottom
      0,5,1, // triangle
      // Left
      0,3,4, 0,4,5,
      // Right
      1,5,4, 1,4,2,
      // Top
      3,2,4,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [w, d, h]);

  return (
    <mesh geometry={geo} material={mat} castShadow receiveShadow />
  );
}

function CurvedSlopeBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2);
    s.lineTo(w / 2, -h / 2);
    // Curved slope from right-bottom to left-top
    s.quadraticCurveTo(w / 2, h / 3, 0, h / 2);
    s.lineTo(-w / 2, h / 4);
    s.lineTo(-w / 2, -h / 2);
    return s;
  }, [w, h]);

  return (
    <group>
      <mesh position={[0, 0, -d / 2]}
            material={mat} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: d, bevelEnabled: false }]} />
      </mesh>
    </group>
  );
}

function RoundBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const radius = Math.max(width, depth) * UNIT / 2;
  const studCount = Math.min(width, 2);
  return (
    <group>
      <mesh material={mat} castShadow receiveShadow>
        <cylinderGeometry args={[radius - 0.01, radius - 0.01, h - 0.02, 24]} />
      </mesh>
      {opacity >= 0.9 && (
        <Studs width={studCount} depth={studCount} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

function TileBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = Math.max(height, 1) * PLATE_H;
  return (
    <mesh material={mat} castShadow receiveShadow>
      <boxGeometry args={[width * UNIT - 0.02, h - 0.02, depth * UNIT - 0.02]} />
    </mesh>
  );
}

function FenceBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const postCount = width + 1;
  const postSpacing = width > 1 ? (width * UNIT - 0.1) / (postCount - 1) : 0;
  const startX = -(width * UNIT - 0.1) / 2;

  return (
    <group>
      {/* Posts */}
      {Array.from({ length: postCount }, (_, i) => (
        <mesh key={i} position={[startX + i * postSpacing, 0, 0]} material={mat}>
          <boxGeometry args={[0.12, h - 0.02, 0.12]} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, h * 0.35, 0]} material={mat}>
        <boxGeometry args={[width * UNIT - 0.04, 0.08, 0.08]} />
      </mesh>
      {/* Bottom rail */}
      <mesh position={[0, -h * 0.15, 0]} material={mat}>
        <boxGeometry args={[width * UNIT - 0.04, 0.08, 0.08]} />
      </mesh>
      {/* Bottom studs for connection */}
      {opacity >= 0.9 && (
        <Studs width={width} depth={1} color={color}
          yOffset={-h / 2 - STUD_HEIGHT / 2 + 0.02} opacity={opacity} />
      )}
    </group>
  );
}

function WindowBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;
  const frameT = 0.15; // frame thickness

  return (
    <group>
      {/* Frame - hollow box */}
      {/* Top */}
      <mesh position={[0, h / 2 - frameT / 2, 0]} material={mat} castShadow>
        <boxGeometry args={[w - 0.02, frameT, d - 0.02]} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -h / 2 + frameT / 2, 0]} material={mat} castShadow>
        <boxGeometry args={[w - 0.02, frameT, d - 0.02]} />
      </mesh>
      {/* Left */}
      <mesh position={[-w / 2 + frameT / 2, 0, 0]} material={mat} castShadow>
        <boxGeometry args={[frameT, h - 0.02, d - 0.02]} />
      </mesh>
      {/* Right */}
      <mesh position={[w / 2 - frameT / 2, 0, 0]} material={mat} castShadow>
        <boxGeometry args={[frameT, h - 0.02, d - 0.02]} />
      </mesh>
      {/* Glass pane */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w - frameT * 2 - 0.04, h - frameT * 2 - 0.04, 0.04]} />
        <meshStandardMaterial
          color="#88CCEE"
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      {/* Studs on top */}
      {opacity >= 0.9 && (
        <Studs width={width} depth={depth} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

function DoorBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;
  const frameT = 0.15;

  return (
    <group>
      {/* Frame */}
      <mesh position={[0, h / 2 - frameT / 2, 0]} material={mat} castShadow>
        <boxGeometry args={[w - 0.02, frameT, d - 0.02]} />
      </mesh>
      <mesh position={[-w / 2 + frameT / 2, 0, 0]} material={mat} castShadow>
        <boxGeometry args={[frameT, h - 0.02, d - 0.02]} />
      </mesh>
      <mesh position={[w / 2 - frameT / 2, 0, 0]} material={mat} castShadow>
        <boxGeometry args={[frameT, h - 0.02, d - 0.02]} />
      </mesh>
      {/* Door panel */}
      <mesh position={[0, -0.04, d * 0.2]}>
        <boxGeometry args={[w - frameT * 2 - 0.06, h - frameT - 0.06, 0.08]} />
        <meshStandardMaterial
          color={new THREE.Color(color).multiplyScalar(0.9)}
          roughness={0.4}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[w * 0.2, -0.04, d * 0.2 + 0.06]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Studs on top */}
      {opacity >= 0.9 && (
        <Studs width={width} depth={depth} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

function FlagBrick({ width: _w, depth: _d, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_H;
  return (
    <group>
      {/* Pole */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, h, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.3} />
      </mesh>
      {/* Flag fabric */}
      <mesh position={[UNIT * 0.35, h * 0.25, 0]}>
        <boxGeometry args={[UNIT * 0.6, h * 0.35, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.5}
          transparent={opacity < 1} opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AntennaBrick({ width: _w, depth: _d, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_H;
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.03, 0.05, h, 8]} />
        <meshStandardMaterial color={color} roughness={0.35}
          transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.35}
          transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

function WheelBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const h = height * PLATE_H;
  const radius = Math.max(width, depth) * UNIT / 2;
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Tire */}
      <mesh>
        <torusGeometry args={[radius * 0.65, radius * 0.3, 16, 24]} />
        <meshStandardMaterial color="#1B1B1B" roughness={0.7}
          transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* Hub */}
      <mesh>
        <cylinderGeometry args={[radius * 0.35, radius * 0.35, h * 0.25, 16]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.6} roughness={0.3}
          transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

function WingBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = Math.max(height * PLATE_H, 0.15);
  const w = width * UNIT;
  const d = depth * UNIT;

  const geo = useMemo(() => {
    // Flat wing: trapezoid shape
    const vertices = new Float32Array([
      // Top
      -w/2, h/2, -d/2,    w/2, h/2, -d/2,
      w*0.35, h/2, d/2,   -w/2, h/2, d*0.15,
      // Bottom
      -w/2, -h/2, -d/2,   w/2, -h/2, -d/2,
      w*0.35, -h/2, d/2,  -w/2, -h/2, d*0.15,
    ]);
    const indices = [
      // Top
      0,1,2, 0,2,3,
      // Bottom
      4,6,5, 4,7,6,
      // Front
      0,4,5, 0,5,1,
      // Back
      2,6,7, 2,7,3,
      // Left
      0,3,7, 0,7,4,
      // Right
      1,5,6, 1,6,2,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [w, d, h]);

  return (
    <mesh geometry={geo} material={mat} castShadow receiveShadow />
  );
}

function StairBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;
  const stepH = h / 2;

  return (
    <group>
      {/* Bottom step (full width, half height) */}
      <mesh position={[0, -stepH / 2, d / 4]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[w - 0.02, stepH - 0.01, d / 2 - 0.01]} />
      </mesh>
      {/* Top step */}
      <mesh position={[0, stepH / 2, -d / 4]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[w - 0.02, stepH - 0.01, d / 2 - 0.01]} />
      </mesh>
      {/* Studs on top step */}
      {opacity >= 0.9 && (
        <Studs width={width} depth={Math.max(1, Math.floor(depth / 2))} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

function CornerBrick({ width, depth, height, color, opacity }: {
  width: number; depth: number; height: number; color: string; opacity: number;
}) {
  const mat = useBrickMaterial(color, opacity);
  const h = height * PLATE_H;
  const w = width * UNIT;
  const d = depth * UNIT;

  return (
    <group>
      {/* L-shape: horizontal bar */}
      <mesh position={[0, 0, -d / 4]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[w - 0.02, h - 0.02, d / 2 - 0.01]} />
      </mesh>
      {/* L-shape: vertical bar */}
      <mesh position={[-w / 4, 0, d / 4]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[w / 2 - 0.01, h - 0.02, d / 2 - 0.01]} />
      </mesh>
      {/* Studs */}
      {opacity >= 0.9 && (
        <Studs width={width} depth={depth} color={color}
          yOffset={h / 2 + STUD_HEIGHT / 2} opacity={opacity} />
      )}
    </group>
  );
}

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════

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
      case "slope":    return <SlopeBrick {...props} />;
      case "inverted": return <InvertedSlopeBrick {...props} />;
      case "arch":     return <ArchBrick {...props} />;
      case "cylinder": return <CylinderBrick {...props} />;
      case "cone":     return <ConeBrick {...props} />;
      case "wedge":    return <WedgeBrick {...props} />;
      case "curved":   return <CurvedSlopeBrick {...props} />;
      case "round":    return <RoundBrick {...props} />;
      case "tile":     return <TileBrick {...props} />;
      case "fence":    return <FenceBrick {...props} />;
      case "window":   return <WindowBrick {...props} />;
      case "door":     return <DoorBrick {...props} />;
      case "flag":     return <FlagBrick {...props} />;
      case "antenna":  return <AntennaBrick {...props} />;
      case "wheel":    return <WheelBrick {...props} />;
      case "wing":     return <WingBrick {...props} />;
      case "stair":    return <StairBrick {...props} />;
      case "corner":   return <CornerBrick {...props} />;
      case "plate":    return <StandardBrick {...props} height={Math.max(height, 1)} />;
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
          <boxGeometry args={[width * UNIT, height * PLATE_H, depth * UNIT]} />
          <meshBasicMaterial color="#FFFFFF" wireframe transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}
