/**
 * PlacementBounce Component
 * A brief particle/ring burst effect that plays at the position
 * where a brick was just placed, giving satisfying visual feedback.
 */

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface PlacementBounceProps {
  position: [number, number, number];
  color: string;
  onComplete: () => void;
}

export function PlacementBounce({ position, color, onComplete }: PlacementBounceProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [startTime] = useState(() => Date.now());
  const duration = 0.4; // seconds

  useFrame(() => {
    if (!ringRef.current) return;

    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      onComplete();
      return;
    }

    // Expand ring outward
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const scale = 0.5 + eased * 1.5;
    ringRef.current.scale.set(scale, scale, scale);

    // Fade out
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.6 * (1 - progress);

    // Rise slightly
    ringRef.current.position.y = position[1] + eased * 0.3;
  });

  return (
    <mesh ref={ringRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.5, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
