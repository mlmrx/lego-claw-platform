/**
 * Build Detail Page
 * Shows full 3D model viewer, build info, ratings, and comments
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck,
  Share2, 
  Star, 
  MessageSquare,
  Users,
  Box,
  Clock,
  Eye,
  Heart,
  Send,
  ThumbsUp,
  Loader2,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SocialShare } from "@/components/SocialShare";
import { BuildRatingsComments } from "@/components/BuildRatingsComments";
import { BuildReplay } from "@/components/BuildReplay";

// Simple 3D-like build visualization
function Build3DViewer({ buildData, theme }: { buildData?: any; theme?: string }) {
  const [rotation, setRotation] = useState(0);
  
  // Generate a visual representation based on theme
  const themeColors: Record<string, string[]> = {
    space: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
    medieval: ['#5c4033', '#8b4513', '#a0522d', '#daa520'],
    city: ['#2c3e50', '#34495e', '#7f8c8d', '#3498db'],
    nature: ['#228b22', '#32cd32', '#90ee90', '#8b4513'],
    fantasy: ['#9b59b6', '#8e44ad', '#e74c3c', '#f1c40f'],
    'sci-fi': ['#00d4ff', '#0099cc', '#006699', '#003366'],
  };
  
  const colors = themeColors[theme || 'city'] || themeColors.city;
  
  return (
    <div className="relative w-full aspect-square bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
      {/* 3D-like visualization */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        <div 
          className="relative w-48 h-48 transition-transform duration-500"
          style={{ 
            transform: `rotateY(${rotation}deg) rotateX(15deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Generate brick layers */}
          {[0, 1, 2, 3, 4].map((layer) => (
            <div
              key={layer}
              className="absolute w-full h-8 rounded-sm shadow-lg"
              style={{
                backgroundColor: colors[layer % colors.length],
                bottom: `${layer * 32}px`,
                transform: `translateZ(${layer * 5}px)`,
                opacity: 0.9,
              }}
            >
              {/* Brick studs */}
              <div className="flex justify-around pt-1">
                {[0, 1, 2, 3].map((stud) => (
                  <div
                    key={stud}
                    className="w-4 h-4 rounded-full bg-black/20"
                    style={{ boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Rotation controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setRotation(r => r - 45)}
        >
          ← Rotate
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setRotation(r => r + 45)}
        >
          Rotate →
        </Button>
      </div>
      
      {/* Theme badge */}
      <Badge className="absolute top-4 left-4 capitalize">
        {theme || 'Unknown'} Theme
      </Badge>
    </div>
  );
}

export default function BuildDetail() {
  const { publicId } = useParams<{ publicId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [replayOpen, setReplayOpen] = useState(false);
  
  // Fetch build data
  const { data: build, isLoading } = trpc.projects.byId.useQuery(
    { publicId: publicId || '' },
    { enabled: !!publicId }
  );
  
  // Check if bookmarked
  const { data: isBookmarked, refetch: refetchBookmark } = trpc.bookmarks.isBookmarked.useQuery(
    { buildId: build?.id || 0 },
    { enabled: !!build?.id && isAuthenticated }
  );
  
  // Get participants
  const { data: participants } = trpc.projects.participants.useQuery(
    { publicId: publicId || '' },
    { enabled: !!publicId }
  );

  const { data: messageHistory, isLoading: isHistoryLoading, error: historyError } = trpc.projects.messageHistory.useQuery(
    { publicId: publicId || "", limit: 100 },
    { enabled: !!publicId && activeTab === "history" }
  );

  const { data: replay, isLoading: isReplayLoading, error: replayError } = trpc.projects.replay.useQuery(
    { publicId: publicId || "" },
    { enabled: !!publicId && replayOpen }
  );
  
  // Bookmark mutations
  const addBookmark = trpc.bookmarks.add.useMutation({
    onSuccess: () => {
      toast.success("Build saved to bookmarks!");
      refetchBookmark();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const removeBookmark = trpc.bookmarks.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from bookmarks");
      refetchBookmark();
    },
  });
  
  const handleBookmarkToggle = () => {
    if (!build?.id) return;
    
    if (isBookmarked) {
      removeBookmark.mutate({ buildId: build.id });
    } else {
      addBookmark.mutate({ buildId: build.id });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!build) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Build Not Found</h1>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }
  
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/build/${publicId}` 
    : '';
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{build.name}</h1>
              <p className="text-sm text-muted-foreground">
                {build.theme && <span className="capitalize">{build.theme}</span>}
                {build.style && <span className="ml-2 capitalize">• {build.style}</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplayOpen(true)}>
              <History className="w-4 h-4 mr-2" />
              Replay
            </Button>
            {isAuthenticated && (
              <Button
                variant={isBookmarked ? "default" : "outline"}
                size="sm"
                onClick={handleBookmarkToggle}
                disabled={addBookmark.isPending || removeBookmark.isPending}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            )}
            
            <SocialShare
              type="build"
              title={build.name}
              description={build.description || `Check out this Krewdoo crew creation!`}
              url={shareUrl}
              hashtags={['Krewdoo', 'AgenticAssembly', build.theme || 'creation']}
            />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - 3D Viewer */}
          <div className="lg:col-span-2 space-y-6">
            <Build3DViewer buildData={build.brickData} theme={build.theme || undefined} />
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="ratings" className="flex-1">Ratings & Reviews</TabsTrigger>
                <TabsTrigger value="participants" className="flex-1">Builders</TabsTrigger>
                <TabsTrigger value="history" className="flex-1">Agent Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Build</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {build.description || "No description provided for this build."}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <Box className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{build.currentBricks || 0}</div>
                        <div className="text-xs text-muted-foreground">Bricks Placed</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{build.totalContributors || 0}</div>
                        <div className="text-xs text-muted-foreground">Contributors</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <Eye className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{build.views || 0}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <Heart className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{build.likes || 0}</div>
                        <div className="text-xs text-muted-foreground">Likes</div>
                      </div>
                    </div>
                    
                    {/* Progress */}
                    {build.targetBricks && build.targetBricks > 0 && (
                      <div className="pt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Build Progress</span>
                          <span>{Math.round(((build.currentBricks || 0) / build.targetBricks) * 100)}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min(100, ((build.currentBricks || 0) / build.targetBricks) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {build.currentBricks || 0} / {build.targetBricks} bricks
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="ratings" className="mt-6">
                <BuildRatingsComments buildPublicId={publicId || ''} />
              </TabsContent>
              
              <TabsContent value="participants" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Build Contributors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {participants && participants.length > 0 ? (
                      <div className="space-y-4">
                        {participants.map((p: any) => (
                          <div 
                            key={p.participant.id}
                            className="flex items-center justify-between p-4 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                                {p.agent?.emoji || '🤖'}
                              </div>
                              <div>
                                <div className="font-medium">{p.agent?.name || 'Unknown Agent'}</div>
                                <div className="text-sm text-muted-foreground capitalize">
                                  {p.participant.role}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{p.participant.bricksPlaced}</div>
                              <div className="text-xs text-muted-foreground">bricks placed</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No contributors yet. Be the first to join!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" /> Persisted Agent Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isHistoryLoading ? (
                      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading recorded messages…
                      </div>
                    ) : historyError ? (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                        <p className="font-semibold text-destructive">Agent history could not be loaded</p>
                        <p className="mt-1 text-sm text-muted-foreground">{historyError.message}</p>
                      </div>
                    ) : messageHistory && messageHistory.length > 0 ? (
                      <div className="space-y-3">
                        {messageHistory.map(({ message, agent }) => (
                          <div key={message.publicId} className="rounded-xl border bg-muted/30 p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-lg shadow-sm">
                                {agent.emoji}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold">{agent.name}</span>
                                  <Badge variant="outline" className="capitalize">{message.messageType}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(message.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{message.content}</p>
                                {Boolean(message.brickAction) && (
                                  <p className="mt-2 text-xs font-medium text-emerald-700">Includes a recorded build action</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-10 text-center text-muted-foreground">No persisted agent messages were recorded for this build.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column - Info Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Build Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={build.status === 'completed' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {build.status}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Created {new Date(build.createdAt).toLocaleDateString()}
                </p>
                {build.completedAt && (
                  <p className="text-sm text-muted-foreground">
                    Completed {new Date(build.completedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {build.status === 'building' && build.isOpenToJoin && (
                  <Button className="w-full" onClick={() => toast.info("Join feature coming soon!")}>
                    <Users className="w-4 h-4 mr-2" />
                    Join This Build
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.info("Like feature coming soon!")}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Like Build
                </Button>
              </CardContent>
            </Card>
            
            {/* Tags */}
            {(build.theme || build.style) && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {build.theme && (
                    <Badge variant="outline" className="capitalize">
                      {build.theme}
                    </Badge>
                  )}
                  {build.style && (
                    <Badge variant="outline" className="capitalize">
                      {build.style}
                    </Badge>
                  )}
                  <Badge variant="outline">Modular</Badge>
                  <Badge variant="outline">Collaborative</Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <BuildReplay
        open={replayOpen}
        onOpenChange={setReplayOpen}
        buildName={build.name}
        events={replay?.events ?? []}
        contributors={replay?.contributors ?? 0}
        source={replay?.source}
        provenance={replay?.provenance}
        isLoading={isReplayLoading}
        error={replayError?.message}
      />
    </div>
  );
}
