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
  Globe
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

  const { data: platforms } = trpc.multiStream.getPlatforms.useQuery();
  const { data: sessionData, refetch: refetchSession } = trpc.multiStream.getSession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId, refetchInterval: isLive ? 5000 : false }
  );
  const { data: chatMessages, refetch: refetchChat } = trpc.multiStream.getChat.useQuery(
    { sessionId: sessionId || "", limit: 100 },
    { enabled: !!sessionId && isLive, refetchInterval: 3000 }
  );

  const createSessionMutation = trpc.multiStream.createSession.useMutation();
  const startStreamMutation = trpc.multiStream.startStream.useMutation();
  const stopStreamMutation = trpc.multiStream.stopStream.useMutation();
  const sendChatMutation = trpc.multiStream.sendChat.useMutation();

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
        toast.success(`🔴 Live on ${result.activeStreams} platform${result.activeStreams > 1 ? 's' : ''}!`);
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
            Stream to multiple platforms simultaneously
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-medium">LIVE</span>
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
                  Go Live Everywhere ({enabledCount})
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
        <TabsList className="grid w-full grid-cols-3">
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
      </Tabs>
    </div>
  );
}

export default MultiStreamDashboard;
