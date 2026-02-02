/**
 * BuildViewer Component
 * Design: Isometric LEGO Playground
 * Main visualization area showing LEGO builds in progress with live animations
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { LegoProject, sampleProjects, agents } from "@/lib/agents";
import { AgentAvatarGroup } from "./AgentAvatar";
import { Progress } from "@/components/ui/progress";
import { LiveBuildingAnimation, BuildingActivityIndicator } from "./LiveBuildingAnimation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Puzzle, Zap, Clock, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuildViewerProps {
  className?: string;
}

export function BuildViewer({ className }: BuildViewerProps) {
  const [projects, setProjects] = useState<LegoProject[]>(sampleProjects);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentlyPlaced, setRecentlyPlaced] = useState(0);
  const [buildingPulse, setBuildingPulse] = useState(false);

  const activeProject = projects[activeIndex];
  const contributorAgents = agents.filter(a => 
    activeProject.contributors.includes(a.id)
  );

  // Simulate building progress with visible feedback
  useEffect(() => {
    const interval = setInterval(() => {
      const piecesToAdd = Math.floor(Math.random() * 3) + 1;
      
      setProjects(prev => prev.map((project, idx) => {
        if (idx !== activeIndex) return project;
        
        const newPiecesPlaced = Math.min(
          project.piecesPlaced + piecesToAdd,
          project.totalPieces
        );
        const newProgress = Math.round((newPiecesPlaced / project.totalPieces) * 100);
        
        return {
          ...project,
          piecesPlaced: newPiecesPlaced,
          progress: newProgress
        };
      }));

      // Update recently placed counter
      setRecentlyPlaced(prev => prev + piecesToAdd);
      
      // Trigger pulse animation
      setBuildingPulse(true);
      setTimeout(() => setBuildingPulse(false), 300);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  // Reset recently placed counter periodically
  useEffect(() => {
    const resetInterval = setInterval(() => {
      setRecentlyPlaced(0);
    }, 10000);
    return () => clearInterval(resetInterval);
  }, []);

  const nextProject = () => {
    setActiveIndex((prev) => (prev + 1) % projects.length);
    setRecentlyPlaced(0);
  };

  const prevProject = () => {
    setActiveIndex((prev) => (prev - 1 + projects.length) % projects.length);
    setRecentlyPlaced(0);
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
            <h2 className="font-heading font-bold text-lg">Build Zone</h2>
            <BuildingActivityIndicator isActive={true} />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevProject}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {activeIndex + 1} / {projects.length}
          </span>
          <Button variant="ghost" size="icon" onClick={nextProject}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Build View */}
      <div className="flex-1 p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProject.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full flex flex-col"
          >
            {/* Build Image with Live Animation Overlay */}
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/30 border-2 border-border">
              {/* Base image */}
              <motion.img
                src={activeProject.image}
                alt={activeProject.name}
                className="w-full h-full object-contain p-8"
                animate={buildingPulse ? { 
                  scale: [1, 1.01, 1],
                  filter: ['brightness(1)', 'brightness(1.05)', 'brightness(1)']
                } : {}}
                transition={{ duration: 0.3 }}
              />
              
              {/* Live building animation overlay */}
              <LiveBuildingAnimation />

              {/* Live indicator - top left */}
              <div className="absolute top-4 left-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white text-sm font-bold shadow-lg"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Hammer className="w-4 h-4" />
                  </motion.div>
                  BUILDING LIVE
                </motion.div>
              </div>

              {/* Recently placed indicator - top right */}
              <AnimatePresence>
                {recentlyPlaced > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-4 right-4"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 text-sm font-bold shadow-lg">
                      <Zap className="w-4 h-4" />
                      +{recentlyPlaced} pieces just placed!
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contributors overlay - bottom left */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg">
                <AgentAvatarGroup agents={contributorAgents} max={4} size="sm" />
                <span className="text-sm font-medium text-foreground">
                  {contributorAgents.length} agents building
                </span>
              </div>

              {/* Live progress mini-bar - bottom right */}
              <div className="absolute bottom-4 right-4 w-48">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Progress</span>
                    <motion.span 
                      className="text-sm font-bold text-primary"
                      key={activeProject.progress}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                    >
                      {activeProject.progress}%
                    </motion.span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeProject.progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Build Info */}
            <div className="mt-4 p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading font-bold text-xl">
                    {activeProject.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {activeProject.description}
                  </p>
                </div>
                <div className="text-right">
                  <motion.div 
                    className="text-3xl font-bold font-heading text-primary"
                    key={activeProject.progress}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {activeProject.progress}%
                  </motion.div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={activeProject.progress} className="h-3" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <motion.span 
                    className="flex items-center gap-1"
                    key={activeProject.piecesPlaced}
                    initial={{ color: '#22c55e' }}
                    animate={{ color: '#6b7280' }}
                    transition={{ duration: 1 }}
                  >
                    <Puzzle className="w-4 h-4" />
                    {activeProject.piecesPlaced.toLocaleString()} / {activeProject.totalPieces.toLocaleString()} pieces
                  </motion.span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ~{Math.ceil((activeProject.totalPieces - activeProject.piecesPlaced) / 3)} min remaining
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Project Thumbnails */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {projects.map((project, index) => (
            <motion.button
              key={project.id}
              onClick={() => {
                setActiveIndex(index);
                setRecentlyPlaced(0);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all relative",
                index === activeIndex 
                  ? "border-primary ring-2 ring-primary/30" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <img 
                src={project.image} 
                alt={project.name}
                className="w-full h-full object-contain bg-muted p-1"
              />
              {index === activeIndex && (
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
