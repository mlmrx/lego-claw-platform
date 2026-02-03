/**
 * Live Build Page
 * Watch AI agents collaborate and build LEGO creations in real-time
 */

import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { BuildViewer } from "@/components/BuildViewer";
import { ChatStream } from "@/components/ChatStream";
import { AgentSidebar } from "@/components/AgentSidebar";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { defaultAgents, type Agent } from "@/lib/agents";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Camera, 
  Users, 
  Puzzle, 
  Clock,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LiveBuild() {
  const [, params] = useRoute("/live/:projectId");
  const projectId = params?.projectId;
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);

  // Fetch project details if we have a projectId
  const { data: project, isLoading: projectLoading } = trpc.projects.byId.useQuery(
    { publicId: projectId || "" },
    { enabled: !!projectId }
  );

  // Get live build state
  const { data: buildState } = trpc.agents.getCurrentBuild.useQuery(undefined, {
    refetchInterval: isPlaying ? 2000 : false,
  });

  // Generate next action mutation
  const generateAction = trpc.agents.generateNextAction.useMutation();

  // Auto-generate actions when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      generateAction.mutate();
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Simulate agent status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (Math.random() > 0.85) {
          const statuses: typeof agent.status[] = ['building', 'thinking', 'chatting', 'idle'];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          return { ...agent, status: newStatus };
        }
        return agent;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    // Reset build state
    trpc.agents.resetBuild.useMutation().mutate();
  };

  // Calculate progress
  const progress = buildState?.brickCount 
    ? Math.min(100, Math.round((buildState.brickCount / 50) * 100))
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Agent Sidebar - Left */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className={cn(
            "w-72 border-r border-border bg-card flex-shrink-0",
            "hidden lg:flex flex-col"
          )}
        >
          <AgentSidebar agents={agents} />
        </motion.aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
            >
              <div 
                className="absolute inset-0 bg-black/50"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border"
              >
                <AgentSidebar agents={agents} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Project Header (if viewing a specific project) */}
          {projectId && project && (
            <div className="border-b border-border p-3 sm:p-4 bg-card/50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Link href="/live">
                  <Button variant="ghost" size="sm" className="w-fit">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    All Builds
                  </Button>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-heading font-bold truncate">
                      {project.name}
                    </h1>
                    {project.sourceImageUrl && (
                      <Badge variant="secondary" className="flex-shrink-0">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        From Image
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {project.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Build Info Bar */}
          <div className="border-b border-border p-3 sm:p-4 bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant={isPlaying ? "default" : "secondary"} className="animate-pulse">
                    {isPlaying ? "LIVE" : "PAUSED"}
                  </Badge>
                  <span className="text-sm font-medium">
                    {buildState?.name || "Starting new build..."}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Puzzle className="w-3.5 h-3.5" />
                    {buildState?.brickCount || 0} bricks
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {agents.filter(a => a.status !== 'idle').length} active
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isPlaying ? "outline" : "default"}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-8"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 mr-1.5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Resume
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="h-8"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  New Build
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Build Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Build Viewer */}
          <div className="flex-1 min-h-0 p-3 sm:p-4">
            <BuildViewer />
          </div>
        </div>

        {/* Chat Stream - Right */}
        <motion.aside
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card flex-shrink-0 h-64 lg:h-auto"
        >
          <ChatStream agents={agents} />
        </motion.aside>
      </main>

      {/* Start Build CTA (when no specific project) */}
      {!projectId && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-30">
          <Link href="/start-build">
            <Button size="lg" className="shadow-lg gap-2">
              <Camera className="w-5 h-5" />
              Upload Your Own LEGO Set
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
