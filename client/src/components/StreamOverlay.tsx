/**
 * StreamOverlay Component
 * Provides a streaming-optimized view of the Live Build session
 * Designed to be captured by OBS or other streaming software
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Box } from "lucide-react";
import { Lego3DViewer, convertToBrickData } from "@/components/Lego3DViewer";

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

interface StreamOverlayProps {
  title: string;
  description?: string;
  agents: Agent[];
  actions: BuildAction[];
  brickCount: number;
  phase: string;
  phaseNumber: number;
  totalPhases: number;
  isLive: boolean;
  overlaySettings: {
    showAgentNames: boolean;
    showBrickCount: boolean;
    showPhase: boolean;
    showChat: boolean;
    brandingPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    customLogo?: string;
  };
}

export function StreamOverlay({
  title,
  description,
  agents,
  actions,
  brickCount,
  phase,
  phaseNumber,
  totalPhases,
  isLive,
  overlaySettings,
}: StreamOverlayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const brandingPositionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const getActionIcon = (type: BuildAction["type"]) => {
    switch (type) {
      case "propose":
        return "💡";
      case "agree":
        return "👍";
      case "disagree":
        return "🤔";
      case "build":
        return "🧱";
      case "react":
        return "💬";
      case "speak":
        return "🗣️";
      default:
        return "📝";
    }
  };

  const getActionColor = (type: BuildAction["type"]) => {
    switch (type) {
      case "propose":
        return "border-yellow-500 bg-yellow-500/10";
      case "agree":
        return "border-green-500 bg-green-500/10";
      case "disagree":
        return "border-orange-500 bg-orange-500/10";
      case "build":
        return "border-blue-500 bg-blue-500/10";
      case "react":
        return "border-purple-500 bg-purple-500/10";
      case "speak":
        return "border-cyan-500 bg-cyan-500/10";
      default:
        return "border-gray-500 bg-gray-500/10";
    }
  };

  // Get the last 5 actions for display
  const recentActions = actions.slice(-5).reverse();

  return (
    <div className="relative w-full h-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Branding / Logo */}
      <div className={cn(
        "absolute z-50",
        brandingPositionClasses[overlaySettings.brandingPosition]
      )}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
        >
          {overlaySettings.customLogo ? (
            <img src={overlaySettings.customLogo} alt="Logo" className="w-10 h-10 rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
              <Box className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg leading-tight">Krewdoo</h1>
            <p className="text-xs text-gray-400">Visible Agent Assembly</p>
          </div>
          {isLive && (
            <div className="ml-2 flex items-center gap-1.5 bg-red-600 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Title Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10 text-center"
        >
          <h2 className="text-xl font-bold">{title}</h2>
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </motion.div>
      </div>

      {/* Stats Bar */}
      {(overlaySettings.showBrickCount || overlaySettings.showPhase) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10"
          >
            {overlaySettings.showBrickCount && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧱</span>
                <div>
                  <p className="text-xs text-gray-400">Bricks</p>
                  <p className="font-bold text-lg leading-tight">{brickCount}</p>
                </div>
              </div>
            )}
            {overlaySettings.showBrickCount && overlaySettings.showPhase && (
              <div className="w-px h-8 bg-white/20" />
            )}
            {overlaySettings.showPhase && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-xs text-gray-400">Phase {phaseNumber}/{totalPhases}</p>
                  <p className="font-bold text-lg leading-tight">{phase}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Active Agents */}
      {overlaySettings.showAgentNames && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Active Agents</h3>
            <div className="space-y-3">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-all",
                    agent.isActive ? "bg-white/10" : "opacity-50"
                  )}
                  animate={{
                    scale: agent.isActive ? 1.02 : 1,
                  }}
                >
                  <div className="relative">
                    <span className="text-2xl">{agent.avatar}</span>
                    {agent.isActive && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Chat / Activity Feed */}
      {overlaySettings.showChat && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-96">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Agent Activity</h3>
            <div className="space-y-3 max-h-80 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {recentActions.map((action) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={cn(
                      "p-3 rounded-lg border-l-4",
                      getActionColor(action.type)
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{action.agentAvatar}</span>
                      <span className="font-semibold text-sm">{action.agentName}</span>
                      <span className="text-xs">{getActionIcon(action.type)}</span>
                      <span className="text-xs text-gray-400 capitalize">{action.type}</span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{action.content}</p>
                    {action.brick && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <span>🧱</span>
                        <span>{action.brick.size} at ({action.brick.position.x}, {action.brick.position.y}, {action.brick.position.z})</span>
                        <span
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: action.brick.color }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}

      {/* Center 3D Build Visualization */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[400px] bg-black/30 rounded-2xl border border-white/10 overflow-hidden">
          {actions.filter(a => a.brick).length > 0 ? (
            <Lego3DViewer
              bricks={convertToBrickData(
                actions
                  .filter(a => a.brick)
                  .map(a => ({
                    x: a.brick!.position.x,
                    y: a.brick!.position.y,
                    z: a.brick!.position.z,
                    color: a.brick!.color,
                    type: a.brick!.size,
                    placedBy: a.agentName,
                    timestamp: a.timestamp.getTime(),
                  }))
              )}
              showBaseplate={true}
              baseplateSize={16}
              autoRotate={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-8xl mb-4"
                >
                  🧱
                </motion.div>
                <p className="text-xl font-bold">Building in Progress</p>
                <p className="text-gray-400">{brickCount} bricks placed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Display */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10"
        >
          <p className="text-sm text-gray-400">
            {currentTime.toLocaleTimeString()} • Krewdoo Agent Assembly
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default StreamOverlay;
