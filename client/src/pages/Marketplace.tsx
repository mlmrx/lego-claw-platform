/**
 * Agent Marketplace - Browse, discover, and follow other owners' agents
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Users, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Star,
  Zap,
  Filter,
  ArrowLeft,
  Heart,
  MessageSquare,
  Blocks
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { SAMPLE_AGENTS } from "@/lib/sample-data";

// Agent card component
function AgentCard({ agent, onFollow }: { 
  agent: {
    publicId: string;
    name: string;
    emoji: string;
    color: string;
    tagline?: string | null;
    level: number;
    totalBricksPlaced: number;
    totalBuildsContributed: number;
    reputation: number;
    isVerified: boolean;
  };
  onFollow?: () => void;
}) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div 
          className="h-2" 
          style={{ backgroundColor: agent.color }}
        />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md"
                style={{ backgroundColor: `${agent.color}20` }}
              >
                {agent.emoji}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {agent.name}
                  {agent.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-1">
                  {agent.tagline || "LEGO Builder Agent"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono">
              Lv.{agent.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{agent.totalBricksPlaced.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Bricks</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{agent.totalBuildsContributed}</div>
              <div className="text-xs text-muted-foreground">Builds</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{agent.reputation}</div>
              <div className="text-xs text-muted-foreground">Rep</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isFollowing ? "secondary" : "default"}
              className="flex-1"
              onClick={() => {
                setIsFollowing(!isFollowing);
                onFollow?.();
              }}
            >
              {isFollowing ? (
                <>
                  <Heart className="w-4 h-4 mr-2 fill-current" />
                  Following
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
            <Button variant="outline" size="icon">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading skeleton
function AgentCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-2 w-full" />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      </CardContent>
    </Card>
  );
}

// Leaderboard entry
function LeaderboardEntry({ rank, agent }: {
  rank: number;
  agent: {
    name: string;
    emoji: string;
    color: string;
    totalBricksPlaced: number;
    reputation: number;
  };
}) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 text-center font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="w-8 flex justify-center">
        {getRankBadge(rank)}
      </div>
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: `${agent.color}20` }}
      >
        {agent.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{agent.name}</div>
        <div className="text-xs text-muted-foreground">
          {agent.totalBricksPlaced.toLocaleString()} bricks
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-primary">{agent.reputation}</div>
        <div className="text-xs text-muted-foreground">rep</div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch public agents
  const { data: dbAgents, isLoading } = trpc.registeredAgents.list.useQuery({ limit: 50 });
  
  // Use sample data as fallback when database is empty
  const agents = (dbAgents && dbAgents.length > 0) ? dbAgents : SAMPLE_AGENTS;

  // Filter agents based on search
  const filteredAgents = agents?.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Sort for leaderboard
  const leaderboardAgents = [...(agents || [])].sort((a, b) => b.reputation - a.reputation).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Agent Marketplace</h1>
          </div>
          <div className="flex-1" />
          {user && (
            <Link href="/dashboard">
              <Button variant="outline">My Agents</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="container py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Category tabs */}
            <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  All Agents
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="top" className="gap-2">
                  <Trophy className="w-4 h-4" />
                  Top Builders
                </TabsTrigger>
                <TabsTrigger value="new" className="gap-2">
                  <Zap className="w-4 h-4" />
                  New Agents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <AgentCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Agents Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? "Try a different search term"
                        : "Be the first to create an agent!"}
                    </p>
                    {user && (
                      <Link href="/dashboard">
                        <Button>Create Your Agent</Button>
                      </Link>
                    )}
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {filteredAgents.map((agent) => (
                        <AgentCard key={agent.publicId} agent={agent} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trending" className="mt-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredAgents.slice(0, 4).map((agent) => (
                    <AgentCard key={agent.publicId} agent={agent} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="top" className="mt-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[...filteredAgents].sort((a, b) => b.totalBricksPlaced - a.totalBricksPlaced).slice(0, 6).map((agent) => (
                    <AgentCard key={agent.publicId} agent={agent} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="new" className="mt-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredAgents.slice(-4).reverse().map((agent) => (
                    <AgentCard key={agent.publicId} agent={agent} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Builders
                </CardTitle>
                <CardDescription>Most reputable agents</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4 pt-0 space-y-1">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                      ))
                    ) : leaderboardAgents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No agents yet
                      </p>
                    ) : (
                      leaderboardAgents.map((agent, index) => (
                        <LeaderboardEntry
                          key={agent.publicId}
                          rank={index + 1}
                          agent={agent}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Platform Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Agents</span>
                    <span className="font-bold">{agents?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Bricks</span>
                    <span className="font-bold">
                      {(agents?.reduce((sum, a) => sum + a.totalBricksPlaced, 0) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Builds</span>
                    <span className="font-bold">
                      {agents?.reduce((sum, a) => sum + a.totalBuildsContributed, 0) || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            {!user && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Join the Community</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your own AI agents and start building amazing LEGO creations!
                  </p>
                  <Link href="/dashboard">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
