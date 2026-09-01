/**
 * Vertical Stream Overlay
 * 
 * Optimized for TikTok, Instagram Reels, YouTube Shorts (9:16 aspect ratio)
 * Features:
 * - Vertical layout with 3D viewer at top
 * - Compact agent activity feed
 * - Mobile-friendly design
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lego3DViewer } from "./Lego3DViewer";

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isActive: boolean;
}

interface BuildAction {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  type: "propose" | "agree" | "disagree" | "build" | "react" | "speak";
  content: string;
  brick?: {
    size: string;
    position: { x: number; y: number; z: number };
    color: string;
  };
  timestamp: Date;
}

interface VerticalStreamOverlayProps {
  title?: string;
  agents: Agent[];
  actions: BuildAction[];
  brickCount: number;
  phase: string;
  phaseNumber: number;
  totalPhases: number;
  isLive?: boolean;
}

export function VerticalStreamOverlay({
  title = "Krewdoo",
  agents,
  actions,
  brickCount,
  phase,
  phaseNumber,
  totalPhases,
  isLive = true,
}: VerticalStreamOverlayProps) {
  const [bricks, setBricks] = useState<Array<{
    id: string;
    x: number;
    y: number;
    z: number;
    width: number;
    depth: number;
    color: string;
  }>>([]);

  // Convert actions to 3D bricks
  useEffect(() => {
    const buildActions = actions.filter(a => a.type === "build" && a.brick);
    const newBricks = buildActions.map((action, index) => ({
      id: action.id,
      x: action.brick!.position.x,
      y: action.brick!.position.y,
      z: action.brick!.position.z,
      width: 2,
      depth: 4,
      color: action.brick!.color
    }));
    setBricks(newBricks);
  }, [actions]);

  const recentActions = actions.slice(-5);
  const activeAgents = agents.filter(a => a.isActive);

  return (
    <div className="w-[1080px] h-[1920px] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🧱</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{title}</h1>
              <p className="text-lg text-gray-400">AI Crews Assembling Together</p>
            </div>
          </div>
          
          {/* Live Badge */}
          {isLive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white font-bold text-lg">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* 3D Viewer - Takes up top half */}
      <div className="absolute top-28 left-0 right-0 h-[800px]">
        <Lego3DViewer
          bricks={bricks}
          autoRotate={true}
          className="w-full h-full"
        />
        
        {/* Stats overlay on 3D viewer */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-3xl font-bold text-yellow-400">{brickCount}</div>
            <div className="text-sm text-gray-300">Bricks</div>
          </div>
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 text-right">
            <div className="text-xl font-bold text-white">{phase}</div>
            <div className="text-sm text-gray-300">Phase {phaseNumber}/{totalPhases}</div>
          </div>
        </div>
      </div>

      {/* Active Agents Bar */}
      <div className="absolute top-[940px] left-0 right-0 px-6">
        <div className="flex items-center justify-center gap-4">
          {activeAgents.slice(0, 4).map(agent => (
            <motion.div
              key={agent.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-3xl border-2 border-primary/50">
                {agent.avatar}
              </div>
              <span className="text-sm text-white mt-1 font-medium">{agent.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Activity Feed - Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 h-[800px] bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-20">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {recentActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-2xl",
                  action.type === "build" && "bg-green-500/20 border border-green-500/30",
                  action.type === "propose" && "bg-blue-500/20 border border-blue-500/30",
                  action.type === "agree" && "bg-purple-500/20 border border-purple-500/30",
                  action.type === "disagree" && "bg-orange-500/20 border border-orange-500/30",
                  action.type === "react" && "bg-pink-500/20 border border-pink-500/30",
                  action.type === "speak" && "bg-gray-500/20 border border-gray-500/30"
                )}
              >
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
                  {action.agentAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-lg">{action.agentName}</span>
                    <span className={cn(
                      "text-sm px-2 py-0.5 rounded-full",
                      action.type === "build" && "bg-green-500/30 text-green-300",
                      action.type === "propose" && "bg-blue-500/30 text-blue-300",
                      action.type === "agree" && "bg-purple-500/30 text-purple-300",
                      action.type === "disagree" && "bg-orange-500/30 text-orange-300",
                      action.type === "react" && "bg-pink-500/30 text-pink-300",
                      action.type === "speak" && "bg-gray-500/30 text-gray-300"
                    )}>
                      {action.type}
                    </span>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed line-clamp-2">
                    {action.content}
                  </p>
                  {action.brick && (
                    <div className="flex items-center gap-2 mt-2">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: action.brick.color }}
                      />
                      <span className="text-sm text-gray-400">
                        {action.brick.size} at ({action.brick.position.x}, {action.brick.position.y}, {action.brick.position.z})
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
          <span className="text-2xl">🧱</span>
          <span className="text-white font-medium">Krewdoo · Assembly Lab</span>
        </div>
      </div>
    </div>
  );
}

export default VerticalStreamOverlay;
