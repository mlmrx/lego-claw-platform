/**
 * LiveBuildingAnimation Component
 * Design: Isometric LEGO Playground
 * Shows visible LEGO pieces being placed in real-time with animations
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FallingPiece {
  id: string;
  color: string;
  x: number;
  delay: number;
  size: 'small' | 'medium' | 'large';
}

const LEGO_COLORS = [
  '#E3000B', // Red
  '#0055BF', // Blue
  '#FFD700', // Yellow
  '#00852B', // Green
  '#FF6B00', // Orange
  '#FFFFFF', // White
  '#4A4A4A', // Gray
];

const PIECE_SIZES = {
  small: { width: 16, height: 12 },
  medium: { width: 24, height: 16 },
  large: { width: 32, height: 20 },
};

export function LiveBuildingAnimation() {
  const [pieces, setPieces] = useState<FallingPiece[]>([]);
  const [placedCount, setPlacedCount] = useState(0);

  // Generate new falling pieces continuously
  useEffect(() => {
    const interval = setInterval(() => {
      const newPiece: FallingPiece = {
        id: `piece-${Date.now()}-${Math.random()}`,
        color: LEGO_COLORS[Math.floor(Math.random() * LEGO_COLORS.length)],
        x: 15 + Math.random() * 70, // 15-85% from left
        delay: Math.random() * 0.3,
        size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large',
      };

      setPieces(prev => [...prev.slice(-8), newPiece]); // Keep last 8 pieces
      setPlacedCount(prev => prev + 1);
    }, 800 + Math.random() * 400); // Every 0.8-1.2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            style={{
              left: `${piece.x}%`,
              top: 0,
            }}
            initial={{ 
              y: -50, 
              opacity: 0, 
              rotate: -20 + Math.random() * 40,
              scale: 0.5
            }}
            animate={{ 
              y: ['0%', '70%'],
              opacity: [0, 1, 1, 0.8],
              rotate: [null, 0],
              scale: [0.5, 1, 1]
            }}
            exit={{ 
              opacity: 0,
              scale: 0.8
            }}
            transition={{
              duration: 1.5,
              delay: piece.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
              times: [0, 0.6, 0.8, 1]
            }}
          >
            <LegoBrick color={piece.color} size={piece.size} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Snap effect at bottom */}
      <AnimatePresence>
        {pieces.slice(-3).map((piece, index) => (
          <motion.div
            key={`snap-${piece.id}`}
            className="absolute bottom-[25%]"
            style={{ left: `${piece.x}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.4, delay: 1.2 + piece.delay }}
          >
            <div 
              className="w-8 h-8 rounded-full"
              style={{ 
                backgroundColor: piece.color,
                filter: 'blur(4px)'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Piece counter */}
      <motion.div
        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.3 }}
        key={placedCount}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-3 h-3 rounded-sm bg-primary"
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-sm font-bold text-foreground">
            +{placedCount} pieces placed
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// Individual LEGO brick component
function LegoBrick({ color, size }: { color: string; size: 'small' | 'medium' | 'large' }) {
  const { width, height } = PIECE_SIZES[size];
  const studSize = size === 'small' ? 4 : size === 'medium' ? 5 : 6;
  const studCount = size === 'small' ? 2 : size === 'medium' ? 4 : 6;

  return (
    <div 
      className="relative"
      style={{ width, height }}
    >
      {/* Main brick body */}
      <div
        className="absolute inset-0 rounded-sm"
        style={{
          backgroundColor: color,
          boxShadow: `
            0 2px 0 0 rgba(0,0,0,0.2),
            inset 0 -2px 0 0 rgba(0,0,0,0.15),
            inset 0 2px 0 0 rgba(255,255,255,0.2)
          `
        }}
      />
      
      {/* Studs on top */}
      <div 
        className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-0.5"
      >
        {[...Array(Math.min(studCount, 4))].map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: studSize,
              height: studSize,
              backgroundColor: color,
              boxShadow: `
                0 -1px 0 0 rgba(255,255,255,0.3),
                0 1px 0 0 rgba(0,0,0,0.2)
              `
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Building activity indicator
export function BuildingActivityIndicator({ isActive }: { isActive: boolean }) {
  return (
    <motion.div
      className="flex items-center gap-2"
      animate={isActive ? { opacity: 1 } : { opacity: 0.5 }}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-green-500"
            animate={isActive ? {
              y: [0, -6, 0],
              opacity: [0.5, 1, 0.5]
            } : {}}
            transition={{
              duration: 0.6,
              delay: i * 0.15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-green-600">
        {isActive ? 'Building in progress...' : 'Paused'}
      </span>
    </motion.div>
  );
}
