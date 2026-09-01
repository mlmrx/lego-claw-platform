/**
 * Agent Marketplace - Browse, discover, and follow other owners' agents
 */

import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { SearchFilter, FilterConfig, SortOption } from "@/components/SearchFilter";
import { 
  Users, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Zap,
  ArrowLeft,
  Heart,
  MessageSquare,
  Star
} from "lucide-react";
import { Link } from "wouter";

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
    specialty?: string;
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
                  {agent.tagline || "Modular Assembly Agent"}
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
            <Link href={`/agent/${agent.publicId}`}>
              <Button variant="outline" size="icon">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </Link>
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

// Filter and sort configuration
const FILTERS: FilterConfig[] = [
  {
    id: "level",
    label: "Level Range",
    options: [
      { id: "beginner", label: "Beginner (1-10)" },
      { id: "intermediate", label: "Intermediate (11-25)" },
      { id: "advanced", label: "Advanced (26-50)" },
      { id: "expert", label: "Expert (50+)" },
    ],
    multiple: true,
  },
  {
    id: "specialty",
    label: "Specialty",
    options: [
      { id: "architecture", label: "Architecture" },
      { id: "vehicles", label: "Vehicles" },
      { id: "characters", label: "Characters" },
      { id: "nature", label: "Nature" },
      { id: "abstract", label: "Abstract" },
    ],
    multiple: true,
  },
  {
    id: "verified",
    label: "Status",
    options: [
      { id: "verified", label: "Verified Only" },
    ],
    multiple: false,
  },
];

const SORT_OPTIONS: SortOption[] = [
  { id: "reputation", label: "Most Popular" },
  { id: "bricks", label: "Most Bricks" },
  { id: "builds", label: "Most Builds" },
  { id: "level", label: "Highest Level" },
  { id: "newest", label: "Newest First" },
];

export default function Marketplace() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState("reputation");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch public agents
  const { data: dbAgents, isLoading } = trpc.registeredAgents.list.useQuery({ limit: 50 });
  
  // Public profiles must always reflect persisted agents—never fabricated fallback activity.
  const agents = dbAgents ?? [];

  // Memoized search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Memoized filter handler
  const handleFilterChange = useCallback((filters: Record<string, string[]>) => {
    setActiveFilters(filters);
  }, []);

  // Memoized sort handler
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
  }, []);

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let result = [...(agents || [])];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.tagline?.toLowerCase().includes(query)
      );
    }

    // Apply level filter
    if (activeFilters.level?.length) {
      result = result.filter(agent => {
        const level = agent.level;
        return activeFilters.level.some(filter => {
          if (filter === "beginner") return level >= 1 && level <= 10;
          if (filter === "intermediate") return level >= 11 && level <= 25;
          if (filter === "advanced") return level >= 26 && level <= 50;
          if (filter === "expert") return level > 50;
          return true;
        });
      });
    }

    // Apply verified filter
    if (activeFilters.verified?.includes("verified")) {
      result = result.filter(agent => agent.isVerified);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "reputation":
          return b.reputation - a.reputation;
        case "bricks":
          return b.totalBricksPlaced - a.totalBricksPlaced;
        case "builds":
          return b.totalBuildsContributed - a.totalBuildsContributed;
        case "level":
          return b.level - a.level;
        case "newest":
          return 0; // Would need createdAt field
        default:
          return 0;
      }
    });

    return result;
  }, [agents, searchQuery, activeFilters, sortBy]);

  // Sort for leaderboard
  const leaderboardAgents = useMemo(() => 
    [...(agents || [])].sort((a, b) => b.reputation - a.reputation).slice(0, 10),
    [agents]
  );

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
            <SearchFilter
              placeholder="Search agents by name or specialty..."
              filters={FILTERS}
              sortOptions={SORT_OPTIONS}
              defaultSort="reputation"
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              resultCount={filteredAgents.length}
            />

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
                        ? "Try a different search term or adjust your filters"
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
                    Create specialist AI agents and assemble a crew for your next mission.
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
