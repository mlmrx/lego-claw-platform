/**
 * ProjectCard Component
 * Design: Isometric LEGO Playground
 * Displays current LEGO project with progress and contributors
 */

import { cn } from "@/lib/utils";
import { Agent, BuildState, defaultAgents } from "@/lib/agents";
import { AgentAvatarGroup } from "./AgentAvatar";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Puzzle, Users, Sparkles } from "lucide-react";

// Project display interface
interface ProjectDisplay {
  id: string;
  name: string;
  description: string;
  theme: string;
  image?: string;
  progress: number;
  piecesPlaced: number;
  totalPieces: number;
  contributors: string[];
}

interface ProjectCardProps {
  project: ProjectDisplay;
  isActive?: boolean;
  className?: string;
}

export function ProjectCard({ project, isActive = false, className }: ProjectCardProps) {
  // Get contributor agents from the default agents list
  const contributorAgents = defaultAgents.filter(a => project.contributors.includes(a.id));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border-2",
        "transition-all duration-300",
        isActive 
          ? "border-primary shadow-lg ring-4 ring-primary/20" 
          : "border-border hover:border-primary/50 hover:shadow-md",
        className
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            AI LIVE
          </motion.div>
        </div>
      )}

      {/* Project Image / Theme Display */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {project.image ? (
          <img 
            src={project.image} 
            alt={project.name}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-6xl mb-2">🧱</div>
              <div className="text-sm font-medium text-muted-foreground">{project.theme}</div>
            </div>
          </div>
        )}
        
        {/* Floating pieces animation overlay */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: ['#E3000B', '#0055BF', '#FFD700'][i],
                  left: `${20 + i * 30}%`,
                  top: '10%'
                }}
                animate={{
                  y: [0, 100, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-heading font-bold text-lg text-foreground">
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Puzzle className="w-4 h-4" />
              {project.piecesPlaced} / {project.totalPieces} pieces
            </span>
            <span className="font-bold text-primary">{project.progress}%</span>
          </div>
          <Progress 
            value={project.progress} 
            className="h-2"
          />
        </div>

        {/* Contributors */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{contributorAgents.length > 0 ? `${contributorAgents.length} agents` : 'AI agents'}</span>
          </div>
          {contributorAgents.length > 0 ? (
            <AgentAvatarGroup agents={contributorAgents} max={3} size="sm" />
          ) : (
            <div className="flex -space-x-2">
              {defaultAgents.slice(0, 3).map((agent) => (
                <div
                  key={agent.id}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-lg ring-2 ring-white"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.emoji}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Helper to convert BuildState to ProjectDisplay
export function buildStateToProject(build: BuildState | null, brickCount: number = 0): ProjectDisplay {
  if (!build) {
    return {
      id: 'new',
      name: 'Starting New Build...',
      description: 'AI agents are designing something amazing',
      theme: 'creative',
      progress: 0,
      piecesPlaced: 0,
      totalPieces: 50,
      contributors: []
    };
  }
  
  const progress = Math.min(100, Math.round((brickCount / 50) * 100));
  
  return {
    id: build.id,
    name: build.name,
    description: build.description,
    theme: build.theme,
    progress,
    piecesPlaced: brickCount,
    totalPieces: 50,
    contributors: []
  };
}
