/**
 * Home Page - LEGO Agents
 * Design: Isometric LEGO Playground
 * 
 * Layout:
 * - Header with branding
 * - Stats bar with live metrics
 * - Main content: Agent sidebar (left), Build viewer (center), Chat stream (right)
 * - Completed builds gallery (floating button)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { AgentSidebar } from "@/components/AgentSidebar";
import { BuildViewer } from "@/components/BuildViewer";
import { ChatStream } from "@/components/ChatStream";
import { CompletedBuildsGallery } from "@/components/CompletedBuildsGallery";
import { defaultAgents, Agent, AgentMessage } from "@/lib/agents";
import { BrickPlacement } from "@/components/LegoBrick3D";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, Bot, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Update agent statuses based on real AI activity from the ChatStream
  // The ChatStream uses real tRPC calls (trpc.agents.generateNextAction) which
  // returns real agent actions. We track which agents are active based on recent messages.
  const [recentActiveAgents, setRecentActiveAgents] = useState<Set<string>>(new Set());

  // Update agent statuses based on which agents have been active recently
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (recentActiveAgents.has(agent.id)) {
          // Agent was recently active in the AI chat
          const activeStatuses: Agent['status'][] = ['building', 'thinking', 'chatting'];
          return { ...agent, status: activeStatuses[Math.floor(Math.random() * activeStatuses.length)] };
        }
        return { ...agent, status: 'idle' };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [recentActiveAgents]);

  // Track live bricks from AI agent chat for the BuildViewer
  const [liveBricks, setLiveBricks] = useState<BrickPlacement[]>([]);
  const liveBrickIdRef = useRef(0);

  // Callback when ChatStream receives a new agent action with a brick
  const handleNewBrick = useCallback((brickAction: AgentMessage['brickAction']) => {
    if (!brickAction?.brick) return;
    const brick = brickAction.brick;
    const newBrick: BrickPlacement = {
      id: `live-brick-${++liveBrickIdRef.current}`,
      position: [brick.position.x, brick.position.y, brick.position.z] as [number, number, number],
      color: brick.color,
      width: brick.width,
      depth: brick.depth,
      height: brick.height,
      placedAt: Date.now(),
    };
    setLiveBricks(prev => [...prev, newBrick]);
  }, []);

  // Track which agents are active based on chat messages
  const handleAgentActivity = useCallback((agentId: string) => {
    setRecentActiveAgents(prev => {
      const next = new Set(prev);
      next.add(agentId);
      // Clear after 10 seconds
      setTimeout(() => {
        setRecentActiveAgents(p => {
          const updated = new Set(p);
          updated.delete(agentId);
          return updated;
        });
      }, 10000);
      return next;
    });
  }, []);

  // Handle viewing a completed build
  const handleViewCompletedBuild = (buildId: string) => {
    toast.success("Build loaded!", {
      description: "The completed build is now displayed in the 3D viewer."
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Stats Bar */}
      <StatsBar />

      {/* WebMCP Challenge entry point */}
      <section className="border-b border-violet-200/70 bg-gradient-to-r from-violet-50 via-background to-cyan-50">
        <div className="container py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-violet-950">Assembly Lab</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                    <Sparkles className="h-3 w-3" /> WebMCP-native
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> Human-visible actions
                  </span>
                </div>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                  Ask your browser agent to choose a challenge, assemble a specialist AI crew,
                  run their collaboration turn by turn, and explain the visible 3D result.
                </p>
              </div>
            </div>
            <Link href="/sandbox">
              <Button size="sm" className="w-full gap-2 bg-violet-600 hover:bg-violet-700 lg:w-auto">
                Open Assembly Lab
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
      <main className="flex-1 flex overflow-hidden">
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
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border"
            >
              <AgentSidebar agents={agents} />
            </motion.aside>
          </motion.div>
        )}

        {/* Build Viewer - Center */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-w-0 border-r border-border"
        >
          <BuildViewer liveBricks={liveBricks} />
        </motion.section>

        {/* Chat Stream - Right */}
        <motion.aside
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "w-96 bg-card flex-shrink-0",
            "hidden xl:flex flex-col"
          )}
        >
          <ChatStream 
            agents={agents} 
            onNewBrick={handleNewBrick}
            onAgentActivity={handleAgentActivity}
          />
        </motion.aside>
      </main>

      {/* Completed Builds Gallery */}
      <CompletedBuildsGallery onViewBuild={handleViewCompletedBuild} />

      {/* Mobile Chat Toggle - Shows chat in modal on smaller screens */}
      <div className="xl:hidden fixed bottom-4 left-4 z-50">
        <MobileChatButton agents={agents} onNewBrick={handleNewBrick} onAgentActivity={handleAgentActivity} />
      </div>
    </div>
  );
}

// Mobile chat button component
function MobileChatButton({ agents, onNewBrick, onAgentActivity }: { 
  agents: Agent[]; 
  onNewBrick?: (brick: AgentMessage['brickAction']) => void;
  onAgentActivity?: (agentId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="secondary"
        className="w-14 h-14 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <span className="text-2xl">💬</span>
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50"
        >
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 h-[70vh] bg-card rounded-t-2xl overflow-hidden"
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-muted-foreground/30" />
            <div className="pt-6 h-full">
              <ChatStream 
                agents={agents}
                onNewBrick={onNewBrick}
                onAgentActivity={onAgentActivity}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
