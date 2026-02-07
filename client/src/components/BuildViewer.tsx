/**
 * BuildViewer Component
 * Design: Isometric LEGO Playground
 * Main visualization area showing 3D LEGO builds in progress
 * Fully responsive for mobile devices
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { defaultAgents } from "@/lib/agents";
import { AgentAvatarGroup } from "./AgentAvatar";
import { Progress } from "@/components/ui/progress";
import { LegoScene3D, BUILD_STRUCTURES } from "./LegoScene3D";
import { BrickPlacement } from "./LegoBrick3D";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Puzzle, RotateCcw, Pause, Play, Eye, Hammer, Volume2, VolumeX, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLegoSound } from "@/hooks/useLegoSound";

interface BuildViewerProps {
  className?: string;
  liveBricks?: BrickPlacement[];
}

// Speed presets in milliseconds (base interval)
const SPEED_PRESETS = {
  slow: 4000,
  normal: 2000,
  fast: 800,
  turbo: 300,
};

export function BuildViewer({ className, liveBricks = [] }: BuildViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [placedBricks, setPlacedBricks] = useState<BrickPlacement[]>([]);
  const [nextBrickIndex, setNextBrickIndex] = useState(0);
  const [isBuilding, setIsBuilding] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [buildSpeed, setBuildSpeed] = useState(50); // 0-100 slider value
  
  const { playClick, playThunk, playCelebration, setEnabled: setSoundEnabledHook } = useLegoSound();
  const prevBrickCount = useRef(0);

  const activeStructure = BUILD_STRUCTURES[activeIndex];
  const totalBricks = activeStructure.bricks.length;
  const progress = Math.round((placedBricks.length / totalBricks) * 100);

  // Convert slider value (0-100) to interval in ms
  const getIntervalFromSpeed = useCallback((speed: number) => {
    // Map 0-100 to 4000ms-200ms (slow to turbo)
    const minInterval = 200;
    const maxInterval = 4000;
    return maxInterval - (speed / 100) * (maxInterval - minInterval);
  }, []);

  // Get speed label
  const getSpeedLabel = useCallback((speed: number) => {
    if (speed < 25) return "Slow";
    if (speed < 50) return "Normal";
    if (speed < 75) return "Fast";
    return "Turbo";
  }, []);

  // Get current building agent
  const buildingAgents = useMemo(() => {
    return defaultAgents.filter(a => a.status === 'building' || a.status === 'thinking');
  }, []);

  const currentAgent = buildingAgents[currentAgentIndex % buildingAgents.length];

  // Get next brick to place
  const nextBrick = activeStructure.bricks[nextBrickIndex];

  // Play sound when brick is placed
  useEffect(() => {
    if (placedBricks.length > prevBrickCount.current) {
      const lastBrick = placedBricks[placedBricks.length - 1];
      // Play thunk for larger bricks, click for smaller ones
      if (lastBrick && (lastBrick.width >= 3 || lastBrick.depth >= 3)) {
        playThunk();
      } else {
        playClick();
      }
      
      // Play celebration when build is complete
      if (placedBricks.length === totalBricks) {
        setTimeout(() => playCelebration(), 500);
      }
    }
    prevBrickCount.current = placedBricks.length;
  }, [placedBricks.length, totalBricks, playClick, playThunk, playCelebration]);

  // Update sound hook when toggle changes
  useEffect(() => {
    setSoundEnabledHook(soundEnabled);
  }, [soundEnabled, setSoundEnabledHook]);

  // Place bricks one by one
  useEffect(() => {
    if (!isBuilding || nextBrickIndex >= totalBricks) return;

    const baseInterval = getIntervalFromSpeed(buildSpeed);
    const randomVariation = baseInterval * 0.3 * Math.random(); // Add some randomness
    const interval = baseInterval + randomVariation;

    const timeout = setTimeout(() => {
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
    }, interval);

    return () => clearTimeout(timeout);
  }, [isBuilding, nextBrickIndex, totalBricks, activeIndex, activeStructure, buildSpeed, getIntervalFromSpeed]);

  // Reset when changing structures
  const changeStructure = useCallback((newIndex: number) => {
    setActiveIndex(newIndex);
    setPlacedBricks([]);
    setNextBrickIndex(0);
    prevBrickCount.current = 0;
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
    prevBrickCount.current = 0;
  };

  // Calculate estimated time remaining based on current speed
  const estimatedTimeRemaining = useMemo(() => {
    const remainingBricks = totalBricks - nextBrickIndex;
    const avgInterval = getIntervalFromSpeed(buildSpeed) * 1.15; // Account for random variation
    const totalMs = remainingBricks * avgInterval;
    const totalSeconds = Math.ceil(totalMs / 1000);
    
    if (totalSeconds < 60) return `~${totalSeconds}s remaining`;
    return `~${Math.ceil(totalSeconds / 60)} min remaining`;
  }, [totalBricks, nextBrickIndex, buildSpeed, getIntervalFromSpeed]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-border">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10">
            <Puzzle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm sm:text-lg">3D Build Zone</h2>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>Drag to rotate • Scroll to zoom</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={prevProject} className="w-8 h-8 sm:w-9 sm:h-9">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {activeIndex + 1} / {BUILD_STRUCTURES.length}
          </span>
          <Button variant="ghost" size="icon" onClick={nextProject} className="w-8 h-8 sm:w-9 sm:h-9">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Controls Bar - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 py-2 bg-muted/50 border-b border-border gap-2">
        {/* Primary Controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <Button
            variant={isBuilding ? "default" : "secondary"}
            size="sm"
            onClick={() => setIsBuilding(!isBuilding)}
            className="gap-1 sm:gap-2 h-8 text-xs sm:text-sm px-2 sm:px-3"
          >
            {isBuilding ? (
              <>
                <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Resume</span>
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetBuild}
            className="gap-1 sm:gap-2 h-8 text-xs sm:text-sm px-2 sm:px-3"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Reset</span>
          </Button>
          
          <Button
            variant={autoRotate ? "secondary" : "outline"}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
            className="gap-1 sm:gap-2 h-8 text-xs sm:text-sm px-2 sm:px-3 hidden sm:flex"
          >
            <RotateCcw className={cn("w-3 h-3 sm:w-4 sm:h-4", autoRotate && "animate-spin")} style={{ animationDuration: '3s' }} />
            <span className="hidden md:inline">Auto-Rotate</span>
          </Button>

          <Button
            variant={soundEnabled ? "secondary" : "outline"}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="gap-1 h-8 w-8 sm:w-auto sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="hidden sm:inline">Sound</span>
          </Button>
        </div>

        {/* Speed Control - Hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/80 border border-border">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2 min-w-[140px]">
            <Slider
              value={[buildSpeed]}
              onValueChange={(value) => setBuildSpeed(value[0])}
              min={0}
              max={100}
              step={5}
              className="w-24"
            />
            <span className="text-xs font-medium text-muted-foreground w-12">
              {getSpeedLabel(buildSpeed)}
            </span>
          </div>
        </div>

        {/* Current agent building - Hidden on mobile */}
        {currentAgent && isBuilding && nextBrickIndex < totalBricks && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800"
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
      <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200 min-h-[250px] sm:min-h-[300px]">
        <LegoScene3D
          bricks={[...placedBricks, ...liveBricks]}
          nextBrickPosition={nextBrick?.position}
          nextBrickColor={nextBrick?.color}
          currentAgent={currentAgent ? { name: currentAgent.name, color: currentAgent.color } : undefined}
          totalBricks={totalBricks + liveBricks.length}
          autoRotate={autoRotate}
        />

        {/* Live indicator */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
          <motion.div
            animate={isBuilding ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg",
              isBuilding 
                ? "bg-green-500 text-white" 
                : "bg-gray-400 text-white"
            )}
          >
            <span className={cn(
              "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
              isBuilding ? "bg-white animate-pulse" : "bg-gray-300"
            )} />
            <span className="hidden xs:inline">{isBuilding ? "BUILDING LIVE" : "PAUSED"}</span>
            <span className="xs:hidden">{isBuilding ? "LIVE" : "PAUSED"}</span>
          </motion.div>
        </div>

        {/* Brick counter */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={placedBricks.length}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/95 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-xl shadow-lg"
            >
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-primary">{placedBricks.length}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">bricks</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Contributors - Hidden on very small screens */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 hidden xs:block">
          <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1 sm:py-2 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg">
            <AgentAvatarGroup agents={buildingAgents.slice(0, 4)} max={4} size="sm" />
            <span className="text-xs sm:text-sm font-medium text-foreground">
              {buildingAgents.length} agents
            </span>
          </div>
        </div>

        {/* Sound indicator - Hidden on mobile */}
        {soundEnabled && (
          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 hidden sm:block">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm shadow-lg">
              <Volume2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Sound On</span>
            </div>
          </div>
        )}
      </div>

      {/* Build Info */}
      <div className="p-2 sm:p-4 border-t border-border bg-card">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base sm:text-xl truncate">
              {activeStructure.name}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-none">
              {activeStructure.description}
            </p>
          </div>
          <div className="text-right ml-2 flex-shrink-0">
            <motion.div 
              className="text-xl sm:text-3xl font-bold font-heading text-primary"
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {progress}%
            </motion.div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Progress value={progress} className="h-2 sm:h-3" />
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Puzzle className="w-3 h-3 sm:w-4 sm:h-4" />
              {placedBricks.length} / {totalBricks}
            </span>
            <span className="text-[10px] sm:text-sm">
              {nextBrickIndex < totalBricks 
                ? estimatedTimeRemaining
                : "Complete! 🎉"
              }
            </span>
          </div>
        </div>
      </div>

      {/* Project Thumbnails */}
      <div className="p-2 sm:p-4 border-t border-border">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {BUILD_STRUCTURES.map((structure, index) => (
            <motion.button
              key={structure.name}
              onClick={() => changeStructure(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex-shrink-0 px-2 sm:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all text-left min-w-[100px] sm:min-w-[140px]",
                index === activeIndex 
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30" 
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              <div className="font-heading font-bold text-xs sm:text-sm truncate">{structure.name}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">{structure.bricks.length} bricks</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
