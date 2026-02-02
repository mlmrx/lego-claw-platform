import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Event types matching server
export interface BrickPlacedEvent {
  projectId: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  brick: {
    x: number;
    y: number;
    z: number;
    color: string;
    width: number;
    depth: number;
  };
  totalBricks: number;
  progress: number;
}

export interface AgentMessageEvent {
  projectId: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  message: string;
  messageType: "idea" | "action" | "reaction" | "celebration" | "question";
  replyTo?: {
    agentName: string;
    agentEmoji: string;
  };
  timestamp: number;
}

export interface AgentStatusEvent {
  agentId: string;
  agentName: string;
  status: "building" | "thinking" | "chatting" | "idle";
}

export interface BuildCompletedEvent {
  projectId: string;
  projectName: string;
  totalBricks: number;
  contributors: Array<{
    agentId: string;
    agentName: string;
    agentEmoji: string;
    bricksPlaced: number;
  }>;
  completedAt: number;
}

export interface TrainingProgressEvent {
  agentId: string;
  skillId: string;
  skillName: string;
  oldLevel: number;
  newLevel: number;
  xpGained: number;
}

interface UseSocketOptions {
  projectId?: string;
  joinGlobalFeed?: boolean;
  onBrickPlaced?: (event: BrickPlacedEvent) => void;
  onAgentMessage?: (event: AgentMessageEvent) => void;
  onAgentStatus?: (event: AgentStatusEvent) => void;
  onBuildCompleted?: (event: BuildCompletedEvent) => void;
  onTrainingProgress?: (event: TrainingProgressEvent) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  
  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    // Connect to Socket.io server
    const socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket.io] Connected:", socket.id);
      setIsConnected(true);
      setConnectionError(null);

      // Join project room if specified
      if (optionsRef.current.projectId) {
        socket.emit("join-project", optionsRef.current.projectId);
      }

      // Join global feed if specified
      if (optionsRef.current.joinGlobalFeed) {
        socket.emit("join-global-feed");
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket.io] Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket.io] Connection error:", error.message);
      setConnectionError(error.message);
    });

    // Event listeners
    socket.on("brick-placed", (event: BrickPlacedEvent) => {
      optionsRef.current.onBrickPlaced?.(event);
    });

    socket.on("agent-message", (event: AgentMessageEvent) => {
      optionsRef.current.onAgentMessage?.(event);
    });

    socket.on("agent-status", (event: AgentStatusEvent) => {
      optionsRef.current.onAgentStatus?.(event);
    });

    socket.on("build-completed", (event: BuildCompletedEvent) => {
      optionsRef.current.onBuildCompleted?.(event);
    });

    socket.on("training-progress", (event: TrainingProgressEvent) => {
      optionsRef.current.onTrainingProgress?.(event);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join/leave project room
  const joinProject = useCallback((projectId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-project", projectId);
    }
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave-project", projectId);
    }
  }, []);

  const joinGlobalFeed = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-global-feed");
    }
  }, []);

  return {
    isConnected,
    connectionError,
    joinProject,
    leaveProject,
    joinGlobalFeed,
    socket: socketRef.current,
  };
}

// Hook for real-time brick updates
export function useRealtimeBricks(projectId?: string) {
  const [bricks, setBricks] = useState<BrickPlacedEvent[]>([]);
  const [latestBrick, setLatestBrick] = useState<BrickPlacedEvent | null>(null);

  const handleBrickPlaced = useCallback((event: BrickPlacedEvent) => {
    if (!projectId || event.projectId === projectId) {
      setLatestBrick(event);
      setBricks((prev) => [...prev.slice(-99), event]); // Keep last 100 bricks
    }
  }, [projectId]);

  const { isConnected } = useSocket({
    projectId,
    onBrickPlaced: handleBrickPlaced,
  });

  return { bricks, latestBrick, isConnected };
}

// Hook for real-time messages
export function useRealtimeMessages(projectId?: string) {
  const [messages, setMessages] = useState<AgentMessageEvent[]>([]);
  const [latestMessage, setLatestMessage] = useState<AgentMessageEvent | null>(null);

  const handleAgentMessage = useCallback((event: AgentMessageEvent) => {
    if (!projectId || event.projectId === projectId) {
      setLatestMessage(event);
      setMessages((prev) => [...prev.slice(-199), event]); // Keep last 200 messages
    }
  }, [projectId]);

  const { isConnected } = useSocket({
    projectId,
    onAgentMessage: handleAgentMessage,
  });

  return { messages, latestMessage, isConnected };
}

// Hook for agent status updates
export function useAgentStatuses() {
  const [statuses, setStatuses] = useState<Map<string, AgentStatusEvent>>(new Map());

  const handleAgentStatus = useCallback((event: AgentStatusEvent) => {
    setStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(event.agentId, event);
      return newMap;
    });
  }, []);

  const { isConnected } = useSocket({
    joinGlobalFeed: true,
    onAgentStatus: handleAgentStatus,
  });

  return { statuses, isConnected };
}
