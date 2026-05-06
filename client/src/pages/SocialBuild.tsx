/**
 * Social Build Lobby - Browse and Create Collaborative Build Rooms
 * Direction 2: Social Building Game - Async Multiplayer Collaboration
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Users, Blocks, Clock, Plus, Sparkles, Globe,
  Lock, Loader2, Zap, Crown, Bot, Trophy, Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// ROOM CARD
// ============================================

function RoomCard({ room, onJoin }: { room: any; onJoin: (id: string) => void }) {
  const [, navigate] = useLocation();

  const statusColors: Record<string, string> = {
    waiting: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    active: "bg-green-500/20 text-green-300 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    paused: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };

  const statusLabel: Record<string, string> = {
    waiting: "Waiting for builders",
    active: "Building in progress",
    completed: "Completed",
    paused: "Paused",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card/80 backdrop-blur border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                {room.name}
              </CardTitle>
              {room.description && (
                <CardDescription className="mt-1 line-clamp-2 text-sm">
                  {room.description}
                </CardDescription>
              )}
            </div>
            <Badge variant="outline" className={cn("ml-2 text-xs shrink-0", statusColors[room.status] || "")}>
              {statusLabel[room.status] || room.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {room.participantCount}/{room.maxParticipants}
            </span>
            <span className="flex items-center gap-1">
              <Blocks className="w-3.5 h-3.5" />
              {room.totalBricks} bricks
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {room.totalTurns} turns
            </span>
          </div>

          {room.theme && (
            <Badge variant="secondary" className="text-xs mb-3">
              {room.theme}
            </Badge>
          )}

          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/social-build/${room.publicId}`)}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              View
            </Button>
            {room.status !== "completed" && room.participantCount < room.maxParticipants && (
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin(room.publicId);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Join
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// CREATE ROOM DIALOG
// ============================================

function CreateRoomDialog({ onCreated }: { onCreated: (publicId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [goal, setGoal] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [isPublic, setIsPublic] = useState(true);

  const createRoom = trpc.socialBuild.createRoom.useMutation({
    onSuccess: (data) => {
      toast.success("Room created! Invite friends to join.");
      setOpen(false);
      onCreated(data.publicId);
    },
    onError: (err) => toast.error(err.message),
  });

  const themes = [
    "City & Architecture",
    "Space & Sci-Fi",
    "Medieval & Fantasy",
    "Nature & Animals",
    "Vehicles & Transport",
    "Abstract & Art",
    "Freestyle",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create a Build Room
          </DialogTitle>
          <DialogDescription>
            Set up a collaborative space where AI agents build together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Room Name</label>
            <Input
              placeholder="e.g., Epic Castle Collab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description (optional)</label>
            <Textarea
              placeholder="What are we building together?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Theme</label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a theme..." />
              </SelectTrigger>
              <SelectContent>
                {themes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Build Goal (optional)</label>
            <Textarea
              placeholder="e.g., Build a medieval village with at least 3 buildings"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Max Builders</label>
              <Select value={String(maxParticipants)} onValueChange={(v) => setMaxParticipants(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} builders</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Visibility</label>
              <Select value={isPublic ? "public" : "private"} onValueChange={(v) => setIsPublic(v === "public")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Public</span>
                  </SelectItem>
                  <SelectItem value="private">
                    <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Private</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full mt-2"
            disabled={!name.trim() || createRoom.isPending}
            onClick={() => createRoom.mutate({
              name: name.trim(),
              description: description.trim() || undefined,
              theme: theme || undefined,
              goalDescription: goal.trim() || undefined,
              maxParticipants,
              isPublic,
            })}
          >
            {createRoom.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Create Room</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MY ROOMS SECTION
// ============================================

function MyRoomsSection() {
  const [, navigate] = useLocation();
  const myRooms = trpc.socialBuild.myRooms.useQuery();

  if (!myRooms.data || myRooms.data.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-yellow-400" />
        My Rooms
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myRooms.data.map((room) => (
          <Card
            key={room.publicId}
            className="bg-card/80 backdrop-blur border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
            onClick={() => navigate(`/social-build/${room.publicId}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold truncate">{room.name}</h3>
                {(room as any).myPendingReviews > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {(room as any).myPendingReviews} to review
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {room.participantCount}
                </span>
                <span className="flex items-center gap-1">
                  <Blocks className="w-3 h-3" /> {room.totalBricks}
                </span>
                <span className="flex items-center gap-1">
                  <Bot className="w-3 h-3" /> {(room as any).myRole}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SocialBuild() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<"waiting" | "active" | "completed" | undefined>(undefined);

  const roomsQuery = trpc.socialBuild.listRooms.useQuery({
    status: statusFilter,
    limit: 20,
    offset: 0,
  });

  const joinRoom = trpc.socialBuild.joinRoom.useMutation({
    onSuccess: (data, variables) => {
      toast.success(data.alreadyJoined ? "Welcome back!" : "Joined the room!");
      navigate(`/social-build/${variables.roomPublicId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleJoin = (publicId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    joinRoom.mutate({ roomPublicId: publicId });
  };

  const handleCreated = (publicId: string) => {
    navigate(`/social-build/${publicId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="container py-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-primary">Social Build</span> Rooms
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Create or join collaborative rooms where AI agents build together — even while you're away.
              Come back to review, approve, or redirect what your agent built.
            </p>
            <div className="flex gap-3">
              {isAuthenticated ? (
                <CreateRoomDialog onCreated={handleCreated} />
              ) : (
                <Button size="lg" onClick={() => { window.location.href = getLoginUrl(); }}>
                  Sign in to Create a Room
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="container py-8">
        {/* My Rooms */}
        {isAuthenticated && <MyRoomsSection />}

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Public Rooms
          </h2>
          <div className="flex gap-2">
            {[
              { label: "All", value: undefined as undefined },
              { label: "Waiting", value: "waiting" as const },
              { label: "Active", value: "active" as const },
              { label: "Completed", value: "completed" as const },
            ].map((filter) => (
              <Button
                key={filter.label}
                size="sm"
                variant={statusFilter === filter.value ? "default" : "ghost"}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Room Grid */}
        {roomsQuery.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : roomsQuery.data?.rooms.length === 0 ? (
          <div className="text-center py-20">
            <Blocks className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No rooms yet
            </h3>
            <p className="text-sm text-muted-foreground/70 mb-4">
              Be the first to create a collaborative build room!
            </p>
            {isAuthenticated && (
              <CreateRoomDialog onCreated={handleCreated} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomsQuery.data?.rooms.map((room) => (
              <RoomCard key={room.publicId} room={room} onJoin={handleJoin} />
            ))}
          </div>
        )}

        {/* How It Works */}
        <Separator className="my-12" />
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How Social Build Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Plus className="w-8 h-8" />,
                title: "Create or Join",
                desc: "Set up a room with a theme and goal, or join an existing one. Bring your AI agent along.",
              },
              {
                icon: <Bot className="w-8 h-8" />,
                title: "Agents Build Together",
                desc: "Your agent takes turns building alongside others — even when you're offline. Each agent has its own style.",
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Review & Redirect",
                desc: "Come back to see what happened. Approve great moves, undo bad ones, or give new directives.",
              },
            ].map((step, i) => (
              <Card key={i} className="bg-card/50 border-border/30 text-center">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
