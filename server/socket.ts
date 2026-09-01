import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

// Types for real-time events
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

// Socket.io server instance
let io: Server | null = null;

// Connected clients tracking
const connectedClients = new Map<string, Socket>();

export function initializeSocket(httpServer: HttpServer): Server {
  // Determine allowed origins based on environment
  const allowedOrigins = process.env.NODE_ENV === "production"
    ? [process.env.VITE_APP_URL || "https://legoclaw.com"].filter(Boolean)
    : true; // Allow all origins in development
  
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
    // Connection rate limiting
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    connectedClients.set(socket.id, socket);

    // Join project room for targeted updates
    socket.on("join-project", (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`[Socket.io] Client ${socket.id} joined project:${projectId}`);
    });

    // Leave project room
    socket.on("leave-project", (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`[Socket.io] Client ${socket.id} left project:${projectId}`);
    });

    // Join global feed for all updates
    socket.on("join-global-feed", () => {
      socket.join("global-feed");
      console.log(`[Socket.io] Client ${socket.id} joined global-feed`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });
  });

  console.log("[Socket.io] WebSocket server initialized");
  return io;
}

export function getIO(): Server | null {
  return io;
}

// Emit functions for different event types
export function emitBrickPlaced(event: BrickPlacedEvent): void {
  if (!io) return;
  
  // Emit to project room
  io.to(`project:${event.projectId}`).emit("brick-placed", event);
  
  // Emit to global feed
  io.to("global-feed").emit("brick-placed", event);
}

export function emitAgentMessage(event: AgentMessageEvent): void {
  if (!io) return;
  
  // Emit to project room
  io.to(`project:${event.projectId}`).emit("agent-message", event);
  
  // Emit to global feed
  io.to("global-feed").emit("agent-message", event);
}

export function emitAgentStatus(event: AgentStatusEvent): void {
  if (!io) return;
  
  // Emit to all connected clients
  io.emit("agent-status", event);
}

export function emitBuildCompleted(event: BuildCompletedEvent): void {
  if (!io) return;
  
  // Emit to project room
  io.to(`project:${event.projectId}`).emit("build-completed", event);
  
  // Emit to global feed
  io.to("global-feed").emit("build-completed", event);
}

export function emitTrainingProgress(event: TrainingProgressEvent): void {
  if (!io) return;
  
  // Emit to all connected clients (owner will filter by their agents)
  io.emit("training-progress", event);
}

// Get connection stats
export function getConnectionStats(): { totalConnections: number; rooms: string[] } {
  if (!io) return { totalConnections: 0, rooms: [] };
  
  const rooms = Array.from(io.sockets.adapter.rooms.keys()).filter(
    (room) => room.startsWith("project:") || room === "global-feed"
  );
  
  return {
    totalConnections: connectedClients.size,
    rooms,
  };
}
