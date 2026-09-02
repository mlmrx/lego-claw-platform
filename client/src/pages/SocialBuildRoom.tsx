/**
 * Social Build Room - Collaborative Build Viewer
 * Direction 2: Async Multiplayer Collaboration
 * 
 * View the collaborative build, see agent activity timeline,
 * review pending turns, and redirect your agent.
 */

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import {
  Users, Blocks, Clock, ArrowLeft, Play, Check, X, MessageSquare,
  Send, Loader2, RotateCcw, Compass, Eye, Sparkles, Bot, AlertCircle, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { LegoBrick3D, UNIT, PLATE_HEIGHT, BRICK_HEIGHT, LEGO_COLORS } from "@/components/LegoBrick3D";
import ShapeBrick3D from "@/components/ShapeBrick3D";
import { usePieceWorld } from "@/contexts/PieceWorldContext";
import { resolvePieceMaterial } from "@/lib/pieceWorlds";

// ============================================
// 3D BUILD VIEWER
// ============================================

function BuildCanvas({ bricks }: { bricks: any[] }) {
  const { worldId, world } = usePieceWorld();
  const baseplateStyle = resolvePieceMaterial(worldId, world.scene.baseplate);
  return (
    <Canvas
      camera={{ position: [15, 12, 15], fov: 50 }}
      style={{ background: `linear-gradient(180deg, ${world.scene.background} 0%, ${world.scene.baseplate} 145%)` }}
    >
      <ambientLight intensity={world.edgeStyle === "neon" ? 0.3 : 0.6} color={world.edgeStyle === "neon" ? "#93C5FD" : "#FFFFFF"} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} />

      {/* Baseplate */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[24, 0.1, 24]} />
        <meshPhysicalMaterial
          color={baseplateStyle.color}
          roughness={baseplateStyle.roughness}
          metalness={baseplateStyle.metalness}
          transparent={baseplateStyle.transparent}
          opacity={baseplateStyle.opacity}
          transmission={baseplateStyle.transmission}
          clearcoat={baseplateStyle.clearcoat}
        />
      </mesh>

      {/* Grid lines on baseplate */}
      <gridHelper args={[24, 24, world.scene.grid, world.scene.grid]} position={[0, 0.01, 0]} />

      {/* Render all bricks */}
      {bricks.map((brick, i) => {
        const isSpecialShape = brick.shape && brick.shape !== "standard" && brick.shape !== "plate";
        if (isSpecialShape) {
          return (
            <group key={brick.id || i} position={brick.position}>
              <ShapeBrick3D
                position={[0, 0, 0]}
                shape={brick.shape}
                color={brick.color}
                width={brick.width}
                depth={brick.depth}
                height={brick.height}
              />
            </group>
          );
        }
        return (
          <group key={brick.id || i} position={brick.position}>
            <LegoBrick3D
              position={[0, 0, 0]}
              color={brick.color}
              width={brick.width}
              depth={brick.depth}
              height={brick.height}
            />
          </group>
        );
      })}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}

// ============================================
// ACTIVITY TIMELINE
// ============================================

function TurnItem({
  turn,
  isOwner,
  onApprove,
  onReject,
}: {
  turn: any;
  isOwner: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusColors: Record<string, string> = {
    pending: "border-l-yellow-400",
    approved: "border-l-green-400",
    rejected: "border-l-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-3 rounded-lg border-l-4 bg-card",
        statusColors[turn.reviewStatus] || "border-l-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              Turn {turn.turnNumber}
            </Badge>
            {turn.isAutoPlay && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Bot className="w-3 h-3" /> Auto
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {turn.brickCount} bricks
            </span>
          </div>
          <p className="text-sm">{turn.message}</p>
          {turn.reasoning && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              💭 {turn.reasoning}
            </p>
          )}
        </div>
      </div>

      {/* Review buttons for pending turns owned by this user */}
      {isOwner && turn.reviewStatus === "pending" && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
          <Button size="sm" variant="outline" className="gap-1 text-green-600 hover:bg-green-50" onClick={onApprove}>
            <Check className="w-3 h-3" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-red-600 hover:bg-red-50" onClick={onReject}>
            <X className="w-3 h-3" /> Undo
          </Button>
        </div>
      )}

      {turn.reviewStatus === "rejected" && turn.ownerFeedback && (
        <p className="text-xs text-red-600 mt-1">Feedback: {turn.ownerFeedback}</p>
      )}
    </motion.div>
  );
}

function ChatMessage({ msg }: { msg: any }) {
  const typeStyles: Record<string, string> = {
    system: "text-muted-foreground italic text-center",
    agent: "text-foreground",
    chat: "text-foreground",
    directive: "text-primary font-medium",
  };

  return (
    <div className={cn("text-sm py-1", typeStyles[msg.messageType] || "")}>
      {msg.messageType === "system" ? (
        <span className="text-xs">{msg.content}</span>
      ) : msg.messageType === "directive" ? (
        <span className="text-xs">🎯 {msg.content}</span>
      ) : (
        <span>{msg.content}</span>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SocialBuildRoom() {
  const { user, isAuthenticated } = useAuth();
  const [, params] = useRoute("/social-build/:roomId");
  const [, navigate] = useLocation();
  const roomId = params?.roomId;

  const [directiveInput, setDirectiveInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [showTimeline, setShowTimeline] = useState(true);

  const utils = trpc.useUtils();

  const roomQuery = trpc.socialBuild.getRoom.useQuery(
    { publicId: roomId || "" },
    { enabled: !!roomId, refetchInterval: 10000 }
  );

  const joinRoom = trpc.socialBuild.joinRoom.useMutation({
    onSuccess: () => {
      toast.success("Joined the room!");
      utils.socialBuild.getRoom.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const takeTurn = trpc.socialBuild.takeTurn.useMutation({
    onSuccess: (data) => {
      toast.success(`Your agent placed ${data.bricks.length} bricks!`);
      utils.socialBuild.getRoom.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const simulateRound = trpc.socialBuild.simulateRound.useMutation({
    onSuccess: (data) => {
      toast.success(`Round complete! ${data.turns.length} agents built ${data.totalBricks} total bricks.`);
      utils.socialBuild.getRoom.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reviewTurn = trpc.socialBuild.reviewTurn.useMutation({
    onSuccess: () => {
      toast.success("Turn reviewed!");
      utils.socialBuild.getRoom.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateDirective = trpc.socialBuild.updateDirective.useMutation({
    onSuccess: () => {
      toast.success("Directive updated! Your agent will follow this guidance.");
      setDirectiveInput("");
      utils.socialBuild.getRoom.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendMessage = trpc.socialBuild.sendMessage.useMutation({
    onSuccess: () => {
      setChatInput("");
      utils.socialBuild.getRoom.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const room = roomQuery.data?.room;
  const participants = roomQuery.data?.participants || [];
  const turns = roomQuery.data?.turns || [];
  const chat = roomQuery.data?.chat || [];

  const bricks = useMemo(() => {
    if (!room?.brickData) return [];
    try {
      return JSON.parse(room.brickData as string);
    } catch {
      return [];
    }
  }, [room?.brickData]);

  const isParticipant = useMemo(() => {
    return participants.some((p: any) => p.userId === user?.id);
  }, [participants, user]);

  const isCreator = useMemo(() => {
    return room?.creatorId === user?.id;
  }, [room, user]);

  const myPendingTurns = useMemo(() => {
    return turns.filter((t: any) => t.userId === user?.id && t.reviewStatus === "pending");
  }, [turns, user]);

  if (!roomId) {
    navigate("/social-build");
    return null;
  }

  if (roomQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-3xl py-12 text-center">
          <h2 className="text-xl font-bold mb-2">Room not found</h2>
          <Button variant="outline" onClick={() => navigate("/social-build")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Room Header */}
      <div className="border-b bg-card/50 px-4 py-3">
        <div className="container max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/social-build")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">{room.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {participants.length}/{room.maxParticipants} builders
                <span className="mx-1">·</span>
                <Blocks className="w-3 h-3" />
                {room.totalBricks} bricks
                <span className="mx-1">·</span>
                Turn {room.totalTurns}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isParticipant && isAuthenticated && (
              <Button
                size="sm"
                onClick={() => joinRoom.mutate({ roomPublicId: roomId })}
                disabled={joinRoom.isPending}
              >
                {joinRoom.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Join Room
              </Button>
            )}
            {isParticipant && (
              <Button
                size="sm"
                onClick={() => takeTurn.mutate({ roomPublicId: roomId })}
                disabled={takeTurn.isPending}
              >
                {takeTurn.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                Take Turn
              </Button>
            )}
            {isCreator && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => simulateRound.mutate({ roomPublicId: roomId })}
                disabled={simulateRound.isPending}
              >
                {simulateRound.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                Simulate Round
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <BuildCanvas bricks={bricks} />

          {/* Participants overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {participants.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/90 backdrop-blur-sm border text-xs"
              >
                <span>{p.agent?.emoji || "🧱"}</span>
                <span className="font-medium">{p.agent?.name || "Builder"}</span>
                <span className="text-muted-foreground">({p.bricksPlaced})</span>
              </div>
            ))}
          </div>

          {/* Pending reviews notification */}
          {myPendingTurns.length > 0 && (
            <div className="absolute top-3 right-3">
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" />
                {myPendingTurns.length} turns to review
              </Badge>
            </div>
          )}
        </div>

        {/* Timeline Sidebar */}
        <AnimatePresence>
          {showTimeline && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-card flex flex-col overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex border-b">
                <button className="flex-1 px-3 py-2 text-sm font-medium border-b-2 border-primary text-primary">
                  Activity
                </button>
              </div>

              {/* Turns Timeline */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {turns.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No turns yet. Take the first turn!
                    </p>
                  ) : (
                    turns.map((turn: any) => (
                      <TurnItem
                        key={turn.publicId}
                        turn={turn}
                        isOwner={turn.userId === user?.id}
                        onApprove={() => reviewTurn.mutate({ turnPublicId: turn.publicId, action: "approve" })}
                        onReject={() => reviewTurn.mutate({ turnPublicId: turn.publicId, action: "reject" })}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>

              <Separator />

              {/* Directive Input */}
              {isParticipant && (
                <div className="p-3 border-t">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    🎯 Agent Directive
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Focus on building walls..."
                      value={directiveInput}
                      onChange={(e) => setDirectiveInput(e.target.value)}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && directiveInput.trim()) {
                          updateDirective.mutate({ roomPublicId: roomId, directive: directiveInput });
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (directiveInput.trim()) {
                          updateDirective.mutate({ roomPublicId: roomId, directive: directiveInput });
                        }
                      }}
                      disabled={!directiveInput.trim() || updateDirective.isPending}
                    >
                      <Compass className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Chat Input */}
              {isParticipant && (
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Say something..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && chatInput.trim()) {
                          sendMessage.mutate({ roomPublicId: roomId, content: chatInput });
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (chatInput.trim()) {
                          sendMessage.mutate({ roomPublicId: roomId, content: chatInput });
                        }
                      }}
                      disabled={!chatInput.trim() || sendMessage.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

