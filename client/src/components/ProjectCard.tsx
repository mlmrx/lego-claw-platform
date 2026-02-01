/**
 * ProjectCard Component
 * Design: Isometric LEGO Playground
 * Displays current LEGO project with progress and contributors
 */

import { cn } from "@/lib/utils";
import { LegoProject, agents } from "@/lib/agents";
import { AgentAvatarGroup } from "./AgentAvatar";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Puzzle, Users } from "lucide-react";

interface ProjectCardProps {
  project: LegoProject;
  isActive?: boolean;
  className?: string;
}

export function ProjectCard({ project, isActive = false, className }: ProjectCardProps) {
  const contributorAgents = agents.filter(a => project.contributors.includes(a.id));

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
            className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            LIVE
          </motion.div>
        </div>
      )}

      {/* Project Image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        <img 
          src={project.image} 
          alt={project.name}
          className="w-full h-full object-contain p-4"
        />
        
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
            <span>{contributorAgents.length} agents</span>
          </div>
          <AgentAvatarGroup agents={contributorAgents} max={3} size="sm" />
        </div>
      </div>
    </motion.div>
  );
}
