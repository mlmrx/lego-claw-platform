/**
 * CompletedBuildsGallery Component
 * Design: Isometric LEGO Playground
 * 
 * Showcases finished AI-generated LEGO creations with
 * timestamps, contributor credits, and the ability to view in 3D.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { defaultAgents } from "@/lib/agents";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Clock, 
  Users, 
  Puzzle, 
  MessageSquare, 
  ChevronRight,
  X,
  Eye,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";

interface CompletedBuild {
  id: string;
  name: string;
  description: string;
  theme: string;
  style: string;
  brickCount: number;
  contributors: string[];
  completedAt: number;
  messageCount: number;
}

interface CompletedBuildsGalleryProps {
  className?: string;
  onViewBuild?: (buildId: string) => void;
}

export function CompletedBuildsGallery({ className, onViewBuild }: CompletedBuildsGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);

  // Fetch completed builds
  const { data: builds, isLoading } = trpc.agents.getCompletedBuilds.useQuery(
    { limit: 20 },
    { refetchInterval: 10000 } // Refresh every 10 seconds
  );

  // Get agent by ID
  const getAgent = (agentId: string) => {
    return defaultAgents.find(a => a.id === agentId);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Theme colors
  const themeColors: Record<string, string> = {
    space: '#1E88E5',
    medieval: '#8D6E63',
    nature: '#43A047',
    city: '#546E7A',
    fantasy: '#8E24AA',
    vehicles: '#FF9800',
    animals: '#F48FB1',
    architecture: '#E53935',
  };

  const handleViewBuild = (buildId: string) => {
    setSelectedBuild(buildId);
    if (onViewBuild) {
      onViewBuild(buildId);
    }
  };

  return (
    <>
      {/* Gallery Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-40",
          "flex items-center gap-2 px-4 py-3 rounded-xl",
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
          "shadow-lg hover:shadow-xl transition-shadow",
          "font-heading font-bold",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Trophy className="w-5 h-5" />
        <span>Gallery</span>
        {builds && builds.length > 0 && (
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {builds.length}
          </span>
        )}
      </motion.button>

      {/* Gallery Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[80vh] bg-card rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl">Completed Builds Gallery</h2>
                    <p className="text-sm text-muted-foreground">
                      AI-generated LEGO creations by our agents
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="h-[60vh]">
                <div className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-3 h-3 rounded-full bg-amber-500"
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.6,
                              delay: i * 0.1
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : !builds || builds.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-heading font-bold text-lg mb-2">No Completed Builds Yet</h3>
                      <p className="text-muted-foreground">
                        Watch the agents build! Completed creations will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {builds.map((build, index) => (
                        <motion.div
                          key={build.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "relative overflow-hidden rounded-xl border-2 transition-all",
                            selectedBuild === build.id
                              ? "border-amber-500 ring-4 ring-amber-500/20"
                              : "border-border hover:border-amber-500/50"
                          )}
                        >
                          {/* Theme Banner */}
                          <div 
                            className="h-2"
                            style={{ 
                              backgroundColor: themeColors[build.theme] || '#9E9E9E' 
                            }}
                          />

                          <div className="p-4">
                            {/* Title & Description */}
                            <div className="mb-3">
                              <h3 className="font-heading font-bold text-lg">
                                {build.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {build.description}
                              </p>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-3 mb-4 text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Puzzle className="w-4 h-4" />
                                <span>{build.brickCount} bricks</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MessageSquare className="w-4 h-4" />
                                <span>{build.messageCount} messages</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(build.completedAt)}</span>
                              </div>
                            </div>

                            {/* Contributors */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <div className="flex -space-x-2">
                                  {build.contributors.slice(0, 5).map((agentId) => {
                                    const agent = getAgent(agentId);
                                    if (!agent) return null;
                                    return (
                                      <div
                                        key={agentId}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm ring-2 ring-white"
                                        style={{ backgroundColor: agent.color }}
                                        title={agent.name}
                                      >
                                        {agent.emoji}
                                      </div>
                                    );
                                  })}
                                  {build.contributors.length > 5 && (
                                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-white">
                                      +{build.contributors.length - 5}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5"
                                onClick={() => handleViewBuild(build.id)}
                              >
                                <Eye className="w-4 h-4" />
                                View
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Theme Tag */}
                          <div 
                            className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ 
                              backgroundColor: themeColors[build.theme] || '#9E9E9E' 
                            }}
                          >
                            {build.theme}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">
                  Builds are automatically saved when agents complete 50+ bricks
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
