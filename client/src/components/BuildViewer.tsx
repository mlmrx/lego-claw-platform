/**
 * BuildViewer Component
 * Design: Isometric LEGO Playground
 * Main visualization area showing LEGO builds in progress
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { LegoProject, sampleProjects, agents } from "@/lib/agents";
import { ProjectCard } from "./ProjectCard";
import { AgentAvatarGroup } from "./AgentAvatar";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Puzzle, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuildViewerProps {
  className?: string;
}

export function BuildViewer({ className }: BuildViewerProps) {
  const [projects, setProjects] = useState<LegoProject[]>(sampleProjects);
  const [activeIndex, setActiveIndex] = useState(0);
  const [buildingAnimation, setBuildingAnimation] = useState(false);

  const activeProject = projects[activeIndex];
  const contributorAgents = agents.filter(a => 
    activeProject.contributors.includes(a.id)
  );

  // Simulate building progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProjects(prev => prev.map((project, idx) => {
        if (idx !== activeIndex) return project;
        
        const newPiecesPlaced = Math.min(
          project.piecesPlaced + Math.floor(Math.random() * 3) + 1,
          project.totalPieces
        );
        const newProgress = Math.round((newPiecesPlaced / project.totalPieces) * 100);
        
        // Trigger animation
        if (newPiecesPlaced !== project.piecesPlaced) {
          setBuildingAnimation(true);
          setTimeout(() => setBuildingAnimation(false), 300);
        }
        
        return {
          ...project,
          piecesPlaced: newPiecesPlaced,
          progress: newProgress
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const nextProject = () => {
    setActiveIndex((prev) => (prev + 1) % projects.length);
  };

  const prevProject = () => {
    setActiveIndex((prev) => (prev - 1 + projects.length) % projects.length);
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
            <p className="text-xs text-muted-foreground">
              Watch agents create amazing LEGO builds
            </p>
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
            {/* Build Image */}
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/30 border-2 border-border">
              <motion.img
                src={activeProject.image}
                alt={activeProject.name}
                className="w-full h-full object-contain p-8"
                animate={buildingAnimation ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
              
              {/* Floating LEGO pieces animation */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {buildingAnimation && (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: ['#E3000B', '#0055BF', '#FFD700', '#00852B', '#FF6B00'][i],
                          left: `${Math.random() * 80 + 10}%`,
                          top: '-20px'
                        }}
                        initial={{ y: -20, opacity: 1, rotate: 0 }}
                        animate={{ 
                          y: 300, 
                          opacity: 0, 
                          rotate: 360 
                        }}
                        transition={{ 
                          duration: 1.5, 
                          delay: i * 0.1,
                          ease: "easeIn"
                        }}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Live indicator */}
              <div className="absolute top-4 left-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  BUILDING LIVE
                </motion.div>
              </div>

              {/* Contributors overlay */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg">
                <AgentAvatarGroup agents={contributorAgents} max={4} size="sm" />
                <span className="text-sm font-medium text-foreground">
                  {contributorAgents.length} agents building
                </span>
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
                  <div className="text-3xl font-bold font-heading text-primary">
                    {activeProject.progress}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={activeProject.progress} className="h-3" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Puzzle className="w-4 h-4" />
                    {activeProject.piecesPlaced.toLocaleString()} / {activeProject.totalPieces.toLocaleString()} pieces
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ~{Math.ceil((activeProject.totalPieces - activeProject.piecesPlaced) / 2)} min remaining
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
              onClick={() => setActiveIndex(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
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
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
