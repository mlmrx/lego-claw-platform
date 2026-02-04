/**
 * Live Build Page - Autonomous AI Agent Collaboration
 * Watch AI agents collaborate, discuss, and build LEGO creations in real-time
 */

import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Users, 
  Puzzle, 
  Clock,
  ArrowLeft,
  Sparkles,
  Bot,
  MessageCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  Hammer,
  PartyPopper,
  Brain,
  Zap,
  Video,
  Copy,
  ExternalLink,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lego3DViewer, convertToBrickData } from "@/components/Lego3DViewer";

// Action type icons
const ACTION_ICONS: Record<string, React.ReactNode> = {
  think: <Brain className="w-4 h-4 text-purple-500" />,
  speak: <MessageCircle className="w-4 h-4 text-blue-500" />,
  propose: <Lightbulb className="w-4 h-4 text-yellow-500" />,
  agree: <CheckCircle className="w-4 h-4 text-green-500" />,
  disagree: <XCircle className="w-4 h-4 text-red-500" />,
  build: <Hammer className="w-4 h-4 text-orange-500" />,
  react: <Zap className="w-4 h-4 text-cyan-500" />,
  celebrate: <PartyPopper className="w-4 h-4 text-pink-500" />,
};

// Action type labels
const ACTION_LABELS: Record<string, string> = {
  think: "Thinking",
  speak: "Speaking",
  propose: "Proposing",
  agree: "Agrees",
  disagree: "Disagrees",
  build: "Building",
  react: "Reacting",
  celebrate: "Celebrating",
};

interface AgentAction {
  type: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  content: string;
  timestamp: number;
  brickData?: {
    x: number;
    y: number;
    z: number;
    color: string;
    type: string;
    reasoning: string;
  };
  targetAgentName?: string;
}

interface BrickPlacement {
  x: number;
  y: number;
  z: number;
  color: string;
  type: string;
  placedBy: string;
  timestamp: number;
}

// Streaming Controls Component
function StreamingControls({ sessionId }: { sessionId: string }) {
  const [showStreamDialog, setShowStreamDialog] = useState(false);
  const [streamData, setStreamData] = useState<{
    streamKey: string;
    viewToken: string;
    embedUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const createStream = trpc.youtubeStreaming.createStream.useMutation({
    onSuccess: (data) => {
      setStreamData({
        streamKey: data.streamKey,
        viewToken: data.viewToken,
        embedUrl: data.embedUrl,
      });
    },
  });

  const handleCreateStream = async () => {
    await createStream.mutateAsync({
      buildSessionId: sessionId,
      title: "LEGO Claw - Live AI Agent Build",
      description: "Watch AI agents collaborate to build amazing LEGO creations!",
    });
    setShowStreamDialog(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullEmbedUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${streamData?.embedUrl}` 
    : streamData?.embedUrl;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateStream}
        disabled={createStream.isPending}
      >
        <Video className="w-4 h-4 mr-2" />
        {createStream.isPending ? "Setting up..." : "Stream to YouTube"}
      </Button>

      {showStreamDialog && streamData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-red-500" />
                Stream to YouTube Live
              </CardTitle>
              <CardDescription>
                Use OBS or other streaming software to capture this build session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Browser Source URL (for OBS)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullEmbedUrl || ''}
                    className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(fullEmbedUrl || '')}
                  >
                    {copied ? "Copied!" : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">Setup Instructions:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Open OBS Studio</li>
                  <li>Add a "Browser Source" to your scene</li>
                  <li>Paste the URL above and set size to 1920x1080</li>
                  <li>Configure YouTube as your stream destination</li>
                  <li>Start streaming!</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(fullEmbedUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview Stream View
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => setShowStreamDialog(false)}
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default function LiveBuild() {
  const [, params] = useRoute("/live/:sessionId");
  const sessionIdFromUrl = params?.sessionId;
  
  const [sessionId, setSessionId] = useState<string | null>(sessionIdFromUrl || null);
  const [lastPollTime, setLastPollTime] = useState(0);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [bricks, setBricks] = useState<BrickPlacement[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const actionsEndRef = useRef<HTMLDivElement>(null);

  // Start demo session mutation
  const startDemo = trpc.liveBuild.startDemoSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setLastPollTime(Date.now());
      setActions([]);
      setBricks([]);
    },
  });

  // Get session state
  const { data: sessionState, refetch: refetchState } = trpc.liveBuild.getSessionState.useQuery(
    { sessionId: sessionId || "" },
    { 
      enabled: !!sessionId,
      refetchInterval: false,
    }
  );

  // Poll for new actions
  const { data: pollData } = trpc.liveBuild.pollActions.useQuery(
    { sessionId: sessionId || "", afterTimestamp: lastPollTime },
    { 
      enabled: !!sessionId && lastPollTime > 0,
      refetchInterval: 1500,
    }
  );

  // Process poll data
  useEffect(() => {
    if (pollData && pollData.actions.length > 0) {
      setActions(prev => [...prev, ...pollData.actions]);
      setLastPollTime(Date.now());
    }
    if (pollData && pollData.bricks.length > 0) {
      setBricks(prev => [...prev, ...pollData.bricks]);
    }
  }, [pollData]);

  // Auto-scroll to bottom of actions
  useEffect(() => {
    actionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [actions]);

  // Load initial session state
  useEffect(() => {
    if (sessionState && actions.length === 0) {
      setActions(sessionState.recentActions || []);
      setBricks(sessionState.bricks || []);
      setLastPollTime(Date.now());
    }
  }, [sessionState]);

  const handleStartDemo = async () => {
    setIsStarting(true);
    try {
      await startDemo.mutateAsync();
    } finally {
      setIsStarting(false);
    }
  };

  const totalBricks = pollData?.totalBricks || sessionState?.totalBricks || bricks.length;
  const currentPhase = pollData?.phase || sessionState?.phase || "planning";
  const isActive = pollData?.isActive ?? sessionState?.isActive ?? false;

  // Phase progress
  const phaseProgress: Record<string, number> = {
    planning: 10,
    foundation: 30,
    structure: 60,
    details: 85,
    finishing: 100,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-4 sm:py-6">
        {/* No active session - show start screen */}
        {!sessionId && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Bot className="w-12 h-12 text-primary" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-4">
                Autonomous AI Agent Collaboration
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                Watch AI agents with unique personalities collaborate, discuss design decisions, 
                and build amazing LEGO creations together. Each agent brings their own skills 
                and creative perspective to the build.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <Card className="p-4 text-center">
                  <div className="text-2xl mb-1">🏗️</div>
                  <div className="text-sm font-medium">Archie</div>
                  <div className="text-xs text-muted-foreground">Architect</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl mb-1">🎨</div>
                  <div className="text-sm font-medium">Palette</div>
                  <div className="text-xs text-muted-foreground">Artist</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl mb-1">🔍</div>
                  <div className="text-sm font-medium">Pixel</div>
                  <div className="text-xs text-muted-foreground">Detailer</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl mb-1">🚀</div>
                  <div className="text-sm font-medium">Nova</div>
                  <div className="text-xs text-muted-foreground">Innovator</div>
                </Card>
              </div>

              <Button 
                size="lg" 
                onClick={handleStartDemo}
                disabled={isStarting}
                className="px-8"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Starting Session...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Live Build Session
                  </>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground mt-4">
                The agents will autonomously collaborate and build without human intervention
              </p>
            </motion.div>
          </div>
        )}

        {/* Active session */}
        {sessionId && (
          <div className="space-y-4">
            {/* Session Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-heading font-bold">
                    {sessionState?.projectName || "Community LEGO Build"}
                  </h1>
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Live" : "Completed"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {sessionState?.projectDescription || "AI agents collaborating to create something amazing"}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <StreamingControls sessionId={sessionId} />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleStartDemo}
                  disabled={isStarting}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Session
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {currentPhase}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Phase {Object.keys(phaseProgress).indexOf(currentPhase) + 1} of 5
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Puzzle className="w-4 h-4 text-primary" />
                    <span className="font-medium">{totalBricks}</span>
                    <span className="text-muted-foreground">bricks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">{sessionState?.agents?.length || 4}</span>
                    <span className="text-muted-foreground">agents</span>
                  </div>
                </div>
              </div>
              <Progress value={phaseProgress[currentPhase] || 0} className="h-2" />
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Agent Activity Feed */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Agent Collaboration
                  </CardTitle>
                  <CardDescription>
                    Watch AI agents discuss, debate, and build together in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] sm:h-[500px] pr-4">
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {actions.map((action, index) => (
                          <motion.div
                            key={`${action.timestamp}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={cn(
                              "p-3 rounded-lg border",
                              action.type === "think" && "bg-purple-500/5 border-purple-500/20",
                              action.type === "speak" && "bg-blue-500/5 border-blue-500/20",
                              action.type === "propose" && "bg-yellow-500/5 border-yellow-500/20",
                              action.type === "agree" && "bg-green-500/5 border-green-500/20",
                              action.type === "disagree" && "bg-red-500/5 border-red-500/20",
                              action.type === "build" && "bg-orange-500/5 border-orange-500/20",
                              action.type === "react" && "bg-cyan-500/5 border-cyan-500/20",
                              action.type === "celebrate" && "bg-pink-500/5 border-pink-500/20",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl flex-shrink-0">
                                {action.agentEmoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-medium">{action.agentName}</span>
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    {ACTION_ICONS[action.type]}
                                    {ACTION_LABELS[action.type] || action.type}
                                  </Badge>
                                  {action.targetAgentName && (
                                    <span className="text-xs text-muted-foreground">
                                      → {action.targetAgentName}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm">{action.content}</p>
                                
                                {/* Brick placement details */}
                                {action.brickData && (
                                  <div className="mt-2 p-2 rounded bg-background/50 text-xs">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span 
                                        className="w-4 h-4 rounded border"
                                        style={{ backgroundColor: action.brickData.color }}
                                      />
                                      <span className="font-mono">
                                        {action.brickData.type} at ({action.brickData.x}, {action.brickData.y}, {action.brickData.z})
                                      </span>
                                    </div>
                                    <p className="text-muted-foreground mt-1 italic">
                                      "{action.brickData.reasoning}"
                                    </p>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {new Date(action.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {actions.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Waiting for agents to start collaborating...</p>
                          <p className="text-sm mt-1">This may take a few seconds</p>
                        </div>
                      )}
                      
                      {isActive && actions.length > 0 && (
                        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm">Agents are collaborating...</span>
                        </div>
                      )}
                      
                      <div ref={actionsEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Agents Panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Active Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(sessionState?.agents || []).map((agent) => (
                      <div 
                        key={agent.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${agent.color}20` }}
                          >
                            {agent.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {getAgentRole(agent.id)}
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                      </div>
                    ))}
                    
                    {(!sessionState?.agents || sessionState.agents.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Loading agents...</p>
                      </div>
                    )}
                  </div>

                  {/* Build Stats */}
                  <div className="mt-6 pt-4 border-t space-y-3">
                    <h4 className="font-medium text-sm">Build Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground text-xs">Total Bricks</div>
                        <div className="font-bold text-lg">{totalBricks}</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground text-xs">Actions</div>
                        <div className="font-bold text-lg">{actions.length}</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground text-xs">Proposals</div>
                        <div className="font-bold text-lg">
                          {actions.filter(a => a.type === "propose").length}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground text-xs">Agreements</div>
                        <div className="font-bold text-lg">
                          {actions.filter(a => a.type === "agree").length}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3D LEGO Build Visualization */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-primary" />
                  3D Build View
                </CardTitle>
                <CardDescription>
                  Watch the LEGO structure being built in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] sm:h-[500px] rounded-lg overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
                  <Lego3DViewer
                    bricks={convertToBrickData(bricks)}
                    showBaseplate={true}
                    baseplateSize={16}
                    autoRotate={true}
                  />
                </div>
                {bricks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="text-sm text-muted-foreground">
                      Recent placements:
                    </div>
                    {bricks.slice(-5).map((brick, index) => (
                      <motion.div
                        key={`${brick.timestamp}-${index}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 rounded border bg-card text-xs flex items-center gap-2"
                      >
                        <span 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: brick.color }}
                        />
                        <span className="font-mono">{brick.type}</span>
                        <span className="text-muted-foreground">by {brick.placedBy}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper to get agent role description
function getAgentRole(agentId: string): string {
  const roles: Record<string, string> = {
    system_architect: "Structural Expert",
    system_artist: "Color & Aesthetics",
    system_detailer: "Fine Details",
    system_innovator: "Creative Ideas",
  };
  return roles[agentId] || "LEGO Builder";
}
