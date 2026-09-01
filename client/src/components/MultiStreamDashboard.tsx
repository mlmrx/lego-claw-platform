/**
 * Multi-Platform Stream Dashboard
 * 
 * Unified dashboard for managing streams across multiple platforms:
 * - YouTube, Twitch, X/Twitter, TikTok, Facebook Gaming, Kick
 * - One-click "Go Live Everywhere" button
 * - Real-time viewer count aggregation
 * - Cross-platform chat view
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Radio,
  Play,
  Square,
  Users,
  MessageSquare,
  Settings,
  Eye,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
  Zap,
  Globe,
  CalendarClock,
  BarChart3,
  Scissors,
  Trash2,
  PauseCircle,
  PlayCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Platform icons and colors
const PLATFORM_STYLES: Record<string, { icon: string; color: string; bgColor: string }> = {
  youtube: { icon: "🔴", color: "#FF0000", bgColor: "bg-red-500/10" },
  twitch: { icon: "💜", color: "#9146FF", bgColor: "bg-purple-500/10" },
  twitter: { icon: "🐦", color: "#000000", bgColor: "bg-gray-500/10" },
  tiktok: { icon: "🎵", color: "#000000", bgColor: "bg-pink-500/10" },
  facebook: { icon: "📘", color: "#1877F2", bgColor: "bg-blue-500/10" },
  kick: { icon: "💚", color: "#53FC18", bgColor: "bg-green-500/10" },
  custom: { icon: "⚙️", color: "#666666", bgColor: "bg-gray-500/10" }
};

interface StreamDestination {
  id: string;
  platform: string;
  streamKey: string;
  customRtmpUrl?: string;
  enabled: boolean;
  title?: string;
}

interface MultiStreamDashboardProps {
  buildSessionId: string;
  onClose?: () => void;
}

export function MultiStreamDashboard({ buildSessionId, onClose }: MultiStreamDashboardProps) {
  const [destinations, setDestinations] = useState<StreamDestination[]>([
    { id: "yt1", platform: "youtube", streamKey: "", enabled: false },
    { id: "tw1", platform: "twitch", streamKey: "", enabled: false },
    { id: "x1", platform: "twitter", streamKey: "", enabled: false },
    { id: "tt1", platform: "tiktok", streamKey: "", enabled: false },
    { id: "fb1", platform: "facebook", streamKey: "", enabled: false },
    { id: "ki1", platform: "kick", streamKey: "", enabled: false }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scheduleName, setScheduleName] = useState("Weekly build broadcast");
  const [cronExpression, setCronExpression] = useState("0 0 18 * * 5");
  const [selectedIntegrationIds, setSelectedIntegrationIds] = useState<string[]>([]);
  const [clipTitle, setClipTitle] = useState("Build highlight");
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const utils = trpc.useUtils();

  const { data: platforms } = trpc.multiStream.getPlatforms.useQuery();
  const { data: sessionData, refetch: refetchSession } = trpc.multiStream.getSession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId, refetchInterval: isLive ? 5000 : false }
  );
  const { data: chatMessages, refetch: refetchChat } = trpc.multiStream.getChat.useQuery(
    { sessionId: sessionId || "", limit: 100 },
    { enabled: !!sessionId && isLive, refetchInterval: 3000 }
  );
  const { data: integrations } = trpc.integrations.myIntegrations.useQuery();
  const { data: schedules, isLoading: schedulesLoading, error: schedulesError } = trpc.multiStream.listSchedules.useQuery();
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = trpc.multiStream.getAnalytics.useQuery({ limit: 30 });
  const { data: clips, isLoading: clipsLoading, error: clipsError } = trpc.multiStream.getClips.useQuery({ limit: 30 });

  const createSessionMutation = trpc.multiStream.createSession.useMutation();
  const startStreamMutation = trpc.multiStream.startStream.useMutation();
  const stopStreamMutation = trpc.multiStream.stopStream.useMutation();
  const sendChatMutation = trpc.multiStream.sendChat.useMutation();
  const createScheduleMutation = trpc.multiStream.createSchedule.useMutation({
    onSuccess: () => {
      toast.success("Broadcast schedule created");
      utils.multiStream.listSchedules.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const setScheduleEnabledMutation = trpc.multiStream.setScheduleEnabled.useMutation({
    onSuccess: () => utils.multiStream.listSchedules.invalidate(),
    onError: error => toast.error(error.message),
  });
  const deleteScheduleMutation = trpc.multiStream.deleteSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted");
      utils.multiStream.listSchedules.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const createClipMutation = trpc.multiStream.createClip.useMutation({
    onSuccess: result => {
      toast.success(result.message);
      utils.multiStream.getClips.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const enabledCount = destinations.filter(d => d.enabled && d.streamKey).length;
  const totalViewers = sessionData?.totalViewers || 0;

  const handleTogglePlatform = (id: string) => {
    setDestinations(prev => prev.map(d => 
      d.id === id ? { ...d, enabled: !d.enabled } : d
    ));
  };

  const handleUpdateStreamKey = (id: string, key: string) => {
    setDestinations(prev => prev.map(d => 
      d.id === id ? { ...d, streamKey: key } : d
    ));
  };

  const handleGoLive = async () => {
    const activeDestinations = destinations.filter(d => d.enabled && d.streamKey).map(d => ({
      ...d,
      platform: d.platform as "youtube" | "twitch" | "twitter" | "tiktok" | "facebook" | "kick" | "custom"
    }));
    
    if (activeDestinations.length === 0) {
      toast.error("Please enable at least one platform and add a stream key");
      return;
    }

    setIsStarting(true);

    try {
      // Create session
      const session = await createSessionMutation.mutateAsync({
        buildSessionId,
        destinations: activeDestinations
      });

      setSessionId(session.sessionId);

      // Start streaming
      const result = await startStreamMutation.mutateAsync({
        sessionId: session.sessionId
      });

      if (result.success) {
        setIsLive(true);
        toast.success(`${result.activeStreams} destination${result.activeStreams > 1 ? "s" : ""} configured. Connect an encoder or relay to send video.`);
      } else {
        toast.error("Failed to start some streams");
      }
    } catch (error) {
      toast.error("Failed to start streaming");
      console.error(error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopStream = async () => {
    if (!sessionId) return;

    try {
      await stopStreamMutation.mutateAsync({ sessionId });
      setIsLive(false);
      toast.success("Stream ended");
    } catch (error) {
      toast.error("Failed to stop stream");
    }
  };

  const copyOverlayUrl = (platform: string) => {
    const url = `${window.location.origin}/stream/${buildSessionId}?platform=${platform}&layout=${platform === 'tiktok' ? 'vertical' : 'horizontal'}`;
    navigator.clipboard.writeText(url);
    toast.success("Overlay URL copied!");
  };

  return (
    <div className="space-y-6">
      {/* Header with Go Live button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Multi-Platform Streaming
          </h2>
          <p className="text-muted-foreground">
            Configure overlays, destinations, schedules, telemetry, and highlights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-medium">{sessionData?.capabilities.videoStreaming ? "LIVE" : "SESSION ACTIVE"}</span>
              <Users className="w-4 h-4 text-red-500" />
              <span className="text-red-500 font-bold">{totalViewers.toLocaleString()}</span>
            </div>
          )}
          
          {!isLive ? (
            <Button
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white gap-2"
              onClick={handleGoLive}
              disabled={isStarting || enabledCount === 0}
            >
              {isStarting ? (
                <>
                  <Radio className="w-5 h-5 animate-pulse" />
                  Starting...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Configure Everywhere ({enabledCount})
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              className="gap-2"
              onClick={handleStopStream}
            >
              <Square className="w-5 h-5" />
              End All Streams
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 lg:grid-cols-6">
          <TabsTrigger value="platforms" className="gap-2">
            <Settings className="w-4 h-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="viewers" className="gap-2">
            <Eye className="w-4 h-4" />
            Viewers
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarClock className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="clips" className="gap-2">
            <Scissors className="w-4 h-4" />
            Highlights
          </TabsTrigger>
        </TabsList>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {destinations.map(dest => {
              const style = PLATFORM_STYLES[dest.platform];
              const platformInfo = platforms?.find(p => p.id === dest.platform);
              
              return (
                <Card 
                  key={dest.id} 
                  className={cn(
                    "transition-all",
                    dest.enabled && dest.streamKey ? "ring-2 ring-primary" : "",
                    style.bgColor
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{style.icon}</span>
                        <CardTitle className="text-lg">
                          {platformInfo?.name || dest.platform}
                        </CardTitle>
                      </div>
                      <Switch
                        checked={dest.enabled}
                        onCheckedChange={() => handleTogglePlatform(dest.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`key-${dest.id}`} className="text-xs text-muted-foreground">
                        Stream Key
                      </Label>
                      <Input
                        id={`key-${dest.id}`}
                        type="password"
                        placeholder="Enter stream key..."
                        value={dest.streamKey}
                        onChange={(e) => handleUpdateStreamKey(dest.id, e.target.value)}
                        disabled={!dest.enabled}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    {dest.enabled && dest.streamKey && (
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="gap-1">
                          <Wifi className="w-3 h-3" />
                          Ready
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => copyOverlayUrl(dest.platform)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Overlay URL
                        </Button>
                      </div>
                    )}
                    
                    {isLive && sessionData?.destinations.find(d => d.platform === dest.platform) && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-red-500 font-medium">LIVE</span>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {sessionData.destinations.find(d => d.platform === dest.platform)?.viewerCount || 0} viewers
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">How to get stream keys</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Each platform provides a unique stream key in their creator dashboard. 
                    Visit your platform's live streaming settings to find your key.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <a href="https://studio.youtube.com" target="_blank" rel="noopener" className="text-xs text-primary hover:underline">YouTube Studio →</a>
                    <a href="https://dashboard.twitch.tv" target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Twitch Dashboard →</a>
                    <a href="https://twitter.com/i/live" target="_blank" rel="noopener" className="text-xs text-primary hover:underline">X Live →</a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Viewers Tab */}
        <TabsContent value="viewers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Live Viewer Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLive && sessionData ? (
                <div className="space-y-6">
                  {/* Total viewers */}
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                    <div className="text-5xl font-bold text-primary">
                      {totalViewers.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground mt-2">Total Viewers Across All Platforms</div>
                  </div>

                  {/* Per-platform breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sessionData.destinations.map(dest => {
                      const style = PLATFORM_STYLES[dest.platform];
                      return (
                        <div 
                          key={dest.id}
                          className={cn("p-4 rounded-lg text-center", style.bgColor)}
                        >
                          <span className="text-2xl">{style.icon}</span>
                          <div className="text-2xl font-bold mt-2">
                            {dest.viewerCount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dest.platformName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <WifiOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start streaming to see viewer analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Aggregated Chat
                <Badge variant="secondary" className="ml-auto">
                  All Platforms
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {isLive ? (
                <>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                      {chatMessages && chatMessages.length > 0 ? (
                        chatMessages.map((msg: any) => (
                          <div key={msg.id} className="flex items-start gap-2">
                            <span 
                              className="text-lg flex-shrink-0"
                              title={msg.platform}
                            >
                              {msg.platformIcon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-medium text-sm"
                                  style={{ color: msg.platformColor }}
                                >
                                  {msg.username}
                                </span>
                                {msg.isModerator && (
                                  <Badge variant="outline" className="text-xs h-4">MOD</Badge>
                                )}
                                {msg.isSubscriber && (
                                  <Badge variant="secondary" className="text-xs h-4">SUB</Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground break-words">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Chat messages will appear here</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  {/* Chat input */}
                  <div className="pt-4 border-t mt-4">
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const input = form.elements.namedItem('message') as HTMLInputElement;
                        if (input.value.trim() && sessionId) {
                          await sendChatMutation.mutateAsync({
                            sessionId,
                            message: input.value
                          });
                          input.value = '';
                          refetchChat();
                        }
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        name="message"
                        placeholder="Send a message to all platforms..."
                        className="flex-1"
                      />
                      <Button type="submit" size="sm">
                        Send
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <WifiOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Start streaming to see chat from all platforms</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Durable Broadcast Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-name">Schedule name</Label>
                  <Input id="schedule-name" value={scheduleName} onChange={event => setScheduleName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-cron">Six-field UTC cron</Label>
                  <Input id="schedule-cron" className="font-mono" value={cronExpression} onChange={event => setCronExpression(event.target.value)} />
                  <p className="text-xs text-muted-foreground">Example: <code>0 0 18 * * 5</code> runs Fridays at 18:00 UTC.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Saved streaming integrations</Label>
                {integrations && integrations.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {integrations.filter(integration => integration.isActive).map(integration => {
                      const selected = selectedIntegrationIds.includes(integration.publicId);
                      const style = PLATFORM_STYLES[integration.platform] || PLATFORM_STYLES.custom;
                      return (
                        <button
                          type="button"
                          key={integration.publicId}
                          onClick={() => setSelectedIntegrationIds(previous => selected
                            ? previous.filter(id => id !== integration.publicId)
                            : [...previous, integration.publicId])}
                          className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition", selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50")}
                        >
                          <span className="text-xl">{style.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium capitalize">{integration.platformName || integration.platform}</span>
                            <span className="block truncate text-xs text-muted-foreground">Key ending {integration.keyHint || "not set"}</span>
                          </span>
                          {selected && <Badge>Selected</Badge>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Add and verify a streaming integration before creating a schedule. Raw stream keys are never stored in the schedule.</p>
                )}
              </div>

              <Button
                onClick={() => createScheduleMutation.mutate({
                  name: scheduleName,
                  buildSessionId,
                  cronExpression,
                  integrationPublicIds: selectedIntegrationIds,
                })}
                disabled={!scheduleName.trim() || selectedIntegrationIds.length === 0 || createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarClock className="mr-2 h-4 w-4" />}
                Create schedule
              </Button>
              <p className="text-xs text-muted-foreground">Schedules configure destinations through Manus Heartbeat. Actual video delivery still requires an encoder or RTMP relay.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>My schedules</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {schedulesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading schedules…</div>
              ) : schedulesError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Schedules could not be loaded: {schedulesError.message}</p>
              ) : schedules && schedules.length > 0 ? schedules.map(schedule => (
                <div key={schedule.publicId} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{schedule.name}</span><Badge variant={schedule.isEnabled ? "default" : "secondary"}>{schedule.isEnabled ? "Enabled" : "Paused"}</Badge></div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{schedule.cronExpression}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Last run: {schedule.lastRunAt ? new Date(schedule.lastRunAt).toLocaleString() : "Never"} · {schedule.lastRunStatus}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setScheduleEnabledMutation.mutate({ publicId: schedule.publicId, enabled: !schedule.isEnabled })}>
                    {schedule.isEnabled ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}{schedule.isEnabled ? "Pause" : "Resume"}
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${schedule.name}`} onClick={() => deleteScheduleMutation.mutate({ publicId: schedule.publicId })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              )) : <p className="py-6 text-center text-muted-foreground">No schedules created yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-4">
          {analyticsLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading telemetry…</div>
          ) : analyticsError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Telemetry could not be loaded: {analyticsError.message}</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Snapshots</p><p className="mt-1 text-2xl font-bold">{analytics?.summary.snapshots || 0}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Configured sessions</p><p className="mt-1 text-2xl font-bold">{analytics?.summary.configuredSessions || 0}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Peak tracked viewers</p><p className="mt-1 text-2xl font-bold">{analytics?.summary.peakViewers || 0}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">In-app chat messages</p><p className="mt-1 text-2xl font-bold">{analytics?.summary.totalChatMessages || 0}</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Session telemetry history</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{analytics?.summary.telemetryScope}</p>
                  {analytics?.records.length ? analytics.records.map(record => (
                    <div key={record.publicId} className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-5">
                      <span className="font-medium capitalize">{record.status}</span>
                      <span>{record.destinationCount} destinations</span>
                      <span>{record.totalViewers} viewers</span>
                      <span>{record.chatMessageCount} messages</span>
                      <span className="text-muted-foreground sm:text-right">{new Date(record.createdAt).toLocaleString()}</span>
                    </div>
                  )) : <p className="py-6 text-center text-muted-foreground">No session snapshots yet.</p>}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="clips" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Scissors className="h-5 w-5" /> Save a cross-platform highlight marker</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="clip-title">Title</Label><Input id="clip-title" value={clipTitle} onChange={event => setClipTitle(event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="clip-start">Start (seconds)</Label><Input id="clip-start" type="number" min={0} value={clipStart} onChange={event => setClipStart(Number(event.target.value))} /></div>
                <div className="space-y-2"><Label htmlFor="clip-end">End (seconds)</Label><Input id="clip-end" type="number" min={1} value={clipEnd} onChange={event => setClipEnd(Number(event.target.value))} /></div>
              </div>
              <Button onClick={() => sessionId && createClipMutation.mutate({ sessionId, title: clipTitle, startSeconds: clipStart, endSeconds: clipEnd })} disabled={!sessionId || clipEnd <= clipStart || createClipMutation.isPending}>
                <Scissors className="mr-2 h-4 w-4" /> Save highlight
              </Button>
              <p className="text-xs text-muted-foreground">This preserves timestamps and platform context. Video export becomes available only when an encoder or relay is connected.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Saved highlights</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {clipsLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading highlights…</div> : clipsError ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Highlights could not be loaded: {clipsError.message}</p> : clips && clips.length > 0 ? clips.map(clip => (
                <div key={clip.publicId} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                  <div><p className="font-semibold">{clip.title}</p><p className="text-xs text-muted-foreground">{clip.startSeconds}s–{clip.endSeconds}s · {(clip.platforms as string[]).join(", ")}</p></div>
                  <Badge variant="outline">Marker</Badge>
                </div>
              )) : <p className="py-6 text-center text-muted-foreground">No highlights saved yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MultiStreamDashboard;
