/**
 * BuildViewer Component
 * Design: Isometric LEGO Playground
 * Main visualization area showing 3D LEGO builds in progress
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { agents } from "@/lib/agents";
import { AgentAvatarGroup } from "./AgentAvatar";
import { Progress } from "@/components/ui/progress";
import { LegoScene3D, BUILD_STRUCTURES, BuildStructure } from "./LegoScene3D";
import { BrickPlacement, LEGO_COLORS } from "./LegoBrick3D";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Puzzle, RotateCcw, Pause, Play, Eye, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuildViewerProps {
  className?: string;
}

export function BuildViewer({ className }: BuildViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [placedBricks, setPlacedBricks] = useState<BrickPlacement[]>([]);
  const [nextBrickIndex, setNextBrickIndex] = useState(0);
  const [isBuilding, setIsBuilding] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);

  const activeStructure = BUILD_STRUCTURES[activeIndex];
  const totalBricks = activeStructure.bricks.length;
  const progress = Math.round((placedBricks.length / totalBricks) * 100);

  // Get current building agent
  const buildingAgents = useMemo(() => {
    return agents.filter(a => a.status === 'building' || a.status === 'thinking');
  }, []);

  const currentAgent = buildingAgents[currentAgentIndex % buildingAgents.length];

  // Get next brick to place
  const nextBrick = activeStructure.bricks[nextBrickIndex];

  // Place bricks one by one
  useEffect(() => {
    if (!isBuilding || nextBrickIndex >= totalBricks) return;

    const interval = setInterval(() => {
      const brickToPlace = activeStructure.bricks[nextBrickIndex];
      
      const newBrick: BrickPlacement = {
        id: `brick-${activeIndex}-${nextBrickIndex}-${Date.now()}`,
        position: brickToPlace.position,
        color: brickToPlace.color,
        width: brickToPlace.width,
        depth: brickToPlace.depth,
        height: brickToPlace.height,
        placedAt: Date.now(),
      };

      setPlacedBricks(prev => [...prev, newBrick]);
      setNextBrickIndex(prev => prev + 1);
      setCurrentAgentIndex(prev => prev + 1);
    }, 2000 + Math.random() * 1000); // 2-3 seconds per brick

    return () => clearInterval(interval);
  }, [isBuilding, nextBrickIndex, totalBricks, activeIndex, activeStructure]);

  // Reset when changing structures
  const changeStructure = useCallback((newIndex: number) => {
    setActiveIndex(newIndex);
    setPlacedBricks([]);
    setNextBrickIndex(0);
  }, []);

  const nextProject = () => {
    changeStructure((activeIndex + 1) % BUILD_STRUCTURES.length);
  };

  const prevProject = () => {
    changeStructure((activeIndex - 1 + BUILD_STRUCTURES.length) % BUILD_STRUCTURES.length);
  };

  const resetBuild = () => {
    setPlacedBricks([]);
    setNextBrickIndex(0);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Puzzle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">3D Build Zone</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>Drag to rotate • Scroll to zoom</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevProject}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {activeIndex + 1} / {BUILD_STRUCTURES.length}
          </span>
          <Button variant="ghost" size="icon" onClick={nextProject}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant={isBuilding ? "default" : "secondary"}
            size="sm"
            onClick={() => setIsBuilding(!isBuilding)}
            className="gap-2"
          >
            {isBuilding ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetBuild}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          
          <Button
            variant={autoRotate ? "secondary" : "outline"}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
            className="gap-2"
          >
            <RotateCcw className={cn("w-4 h-4", autoRotate && "animate-spin")} style={{ animationDuration: '3s' }} />
            Auto-Rotate
          </Button>
        </div>

        {/* Current agent building */}
        {currentAgent && isBuilding && nextBrickIndex < totalBricks && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Hammer className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">{currentAgent.name} is building...</span>
          </motion.div>
        )}
      </div>

      {/* 3D Scene */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200">
        <LegoScene3D
          bricks={placedBricks}
          nextBrickPosition={nextBrick?.position}
          nextBrickColor={nextBrick?.color}
          currentAgent={currentAgent ? { name: currentAgent.name, color: currentAgent.color } : undefined}
          totalBricks={totalBricks}
          autoRotate={autoRotate}
        />

        {/* Live indicator */}
        <div className="absolute top-4 left-4">
          <motion.div
            animate={isBuilding ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg",
              isBuilding 
                ? "bg-green-500 text-white" 
                : "bg-gray-400 text-white"
            )}
          >
            <span className={cn(
              "w-2 h-2 rounded-full",
              isBuilding ? "bg-white animate-pulse" : "bg-gray-300"
            )} />
            {isBuilding ? "BUILDING LIVE" : "PAUSED"}
          </motion.div>
        </div>

        {/* Brick counter */}
        <div className="absolute top-4 right-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={placedBricks.length}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{placedBricks.length}</div>
                <div className="text-xs text-muted-foreground">bricks placed</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Contributors */}
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg">
            <AgentAvatarGroup agents={buildingAgents.slice(0, 4)} max={4} size="sm" />
            <span className="text-sm font-medium text-foreground">
              {buildingAgents.length} agents building
            </span>
          </div>
        </div>
      </div>

      {/* Build Info */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-heading font-bold text-xl">
              {activeStructure.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeStructure.description}
            </p>
          </div>
          <div className="text-right">
            <motion.div 
              className="text-3xl font-bold font-heading text-primary"
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {progress}%
            </motion.div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Puzzle className="w-4 h-4" />
              {placedBricks.length} / {totalBricks} bricks
            </span>
            <span>
              {nextBrickIndex < totalBricks 
                ? `~${Math.ceil((totalBricks - nextBrickIndex) * 2.5 / 60)} min remaining`
                : "Complete! 🎉"
              }
            </span>
          </div>
        </div>
      </div>

      {/* Project Thumbnails */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {BUILD_STRUCTURES.map((structure, index) => (
            <motion.button
              key={structure.name}
              onClick={() => changeStructure(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all text-left min-w-[140px]",
                index === activeIndex 
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30" 
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              <div className="font-heading font-bold text-sm">{structure.name}</div>
              <div className="text-xs text-muted-foreground">{structure.bricks.length} bricks</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
