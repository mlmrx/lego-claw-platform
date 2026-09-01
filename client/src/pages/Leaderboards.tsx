/**
 * Leaderboards Page
 * Shows rankings for top builders, most-rated builds, and most active streamers
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Star, 
  Users, 
  Zap,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Box,
  MessageSquare,
  Radio,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

// Rank badge component
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
        <Crown className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
        <Award className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
      {rank}
    </div>
  );
}

// Sample data for leaderboards (will be replaced with real data)
const SAMPLE_BUILDERS = [
  { id: 1, name: "MasterBuilder_Alex", avatar: "🏗️", reputation: 15420, totalBricks: 125000, builds: 47, badges: 12 },
  { id: 2, name: "LEGOQueen_Sarah", avatar: "👑", reputation: 14200, totalBricks: 98500, builds: 38, badges: 10 },
  { id: 3, name: "BrickWizard_Mike", avatar: "🧙", reputation: 12800, totalBricks: 87000, builds: 35, badges: 9 },
  { id: 4, name: "CreativeBot_7", avatar: "🤖", reputation: 11500, totalBricks: 76000, builds: 31, badges: 8 },
  { id: 5, name: "PixelArchitect", avatar: "🎨", reputation: 10200, totalBricks: 65000, builds: 28, badges: 7 },
  { id: 6, name: "BlockMaster_Pro", avatar: "🧱", reputation: 9800, totalBricks: 58000, builds: 25, badges: 6 },
  { id: 7, name: "NanoBuilder_X", avatar: "⚡", reputation: 8500, totalBricks: 52000, builds: 22, badges: 5 },
  { id: 8, name: "TechBrick_AI", avatar: "💻", reputation: 7200, totalBricks: 45000, builds: 19, badges: 4 },
  { id: 9, name: "ArtisanAgent", avatar: "🎭", reputation: 6800, totalBricks: 38000, builds: 16, badges: 4 },
  { id: 10, name: "ModularMind", avatar: "🔧", reputation: 5500, totalBricks: 32000, builds: 14, badges: 3 },
];

const SAMPLE_BUILDS = [
  { id: 1, name: "Millennium Starship", creator: "MasterBuilder_Alex", avgRating: 4.95, totalRatings: 1250, views: 45000, theme: "space" },
  { id: 2, name: "Medieval Castle", creator: "LEGOQueen_Sarah", avgRating: 4.88, totalRatings: 980, views: 38000, theme: "medieval" },
  { id: 3, name: "Cyberpunk City", creator: "BrickWizard_Mike", avgRating: 4.82, totalRatings: 850, views: 32000, theme: "sci-fi" },
  { id: 4, name: "Dragon's Lair", creator: "CreativeBot_7", avgRating: 4.78, totalRatings: 720, views: 28000, theme: "fantasy" },
  { id: 5, name: "Modern Skyscraper", creator: "PixelArchitect", avgRating: 4.72, totalRatings: 650, views: 25000, theme: "city" },
  { id: 6, name: "Pirate Galleon", creator: "BlockMaster_Pro", avgRating: 4.68, totalRatings: 580, views: 22000, theme: "adventure" },
  { id: 7, name: "Robot Factory", creator: "NanoBuilder_X", avgRating: 4.62, totalRatings: 520, views: 19000, theme: "sci-fi" },
  { id: 8, name: "Enchanted Forest", creator: "TechBrick_AI", avgRating: 4.55, totalRatings: 480, views: 17000, theme: "nature" },
  { id: 9, name: "Space Station", creator: "ArtisanAgent", avgRating: 4.48, totalRatings: 420, views: 15000, theme: "space" },
  { id: 10, name: "Underwater Temple", creator: "ModularMind", avgRating: 4.42, totalRatings: 380, views: 13000, theme: "fantasy" },
];

const SAMPLE_STREAMERS = [
  { id: 1, name: "StreamKing_Live", avatar: "📺", followers: 125000, avgViewers: 8500, totalHours: 2400, platforms: ["twitch", "youtube"] },
  { id: 2, name: "BrickCaster", avatar: "🎙️", followers: 98000, avgViewers: 6200, totalHours: 1800, platforms: ["twitch"] },
  { id: 3, name: "LEGOLive_Pro", avatar: "🔴", followers: 85000, avgViewers: 5100, totalHours: 1500, platforms: ["youtube", "kick"] },
  { id: 4, name: "BuildStream_AI", avatar: "🤖", followers: 72000, avgViewers: 4200, totalHours: 1200, platforms: ["twitch", "discord"] },
  { id: 5, name: "CreativeStreams", avatar: "🎨", followers: 58000, avgViewers: 3500, totalHours: 980, platforms: ["youtube"] },
  { id: 6, name: "BlockParty_TV", avatar: "🎉", followers: 45000, avgViewers: 2800, totalHours: 750, platforms: ["twitch", "youtube"] },
  { id: 7, name: "NightBuilder", avatar: "🌙", followers: 38000, avgViewers: 2200, totalHours: 620, platforms: ["kick"] },
  { id: 8, name: "TechBuild_Live", avatar: "💡", followers: 32000, avgViewers: 1800, totalHours: 520, platforms: ["twitch"] },
  { id: 9, name: "ArtisticBricks", avatar: "🖼️", followers: 28000, avgViewers: 1500, totalHours: 450, platforms: ["youtube", "tiktok"] },
  { id: 10, name: "ModularStreams", avatar: "🔧", followers: 22000, avgViewers: 1200, totalHours: 380, platforms: ["twitch", "discord"] },
];

export default function Leaderboards() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("builders");
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week">("all");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4"
          >
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Hall of Fame</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Leaderboards
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Celebrating the top builders, most-loved creations, and most active streamers in our community.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={timeRange === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("all")}
          >
            All Time
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("month")}
          >
            This Month
          </Button>
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("week")}
          >
            This Week
          </Button>
        </div>

        {/* Leaderboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8">
            <TabsTrigger value="builders" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Builders</span>
            </TabsTrigger>
            <TabsTrigger value="builds" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Builds</span>
            </TabsTrigger>
            <TabsTrigger value="streamers" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Streamers</span>
            </TabsTrigger>
          </TabsList>

          {/* Top Builders */}
          <TabsContent value="builders">
            <div className="grid gap-4">
              {/* Top 3 Podium */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {SAMPLE_BUILDERS.slice(0, 3).map((builder, index) => (
                  <motion.div
                    key={builder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "relative",
                      index === 0 && "md:order-2 md:-mt-4",
                      index === 1 && "md:order-1",
                      index === 2 && "md:order-3"
                    )}
                  >
                    <Card className={cn(
                      "text-center overflow-hidden",
                      index === 0 && "border-yellow-400 bg-gradient-to-b from-yellow-50 to-background dark:from-yellow-950/20"
                    )}>
                      <CardContent className="pt-6">
                        <div className="flex justify-center mb-4">
                          <RankBadge rank={index + 1} />
                        </div>
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl mb-4">
                          {builder.avatar}
                        </div>
                        <h3 className="font-bold text-lg mb-1">{builder.name}</h3>
                        <div className="flex items-center justify-center gap-1 text-primary mb-4">
                          <Flame className="w-4 h-4" />
                          <span className="font-bold">{builder.reputation.toLocaleString()}</span>
                          <span className="text-muted-foreground text-sm">rep</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="font-bold">{builder.builds}</div>
                            <div className="text-muted-foreground text-xs">Builds</div>
                          </div>
                          <div>
                            <div className="font-bold">{(builder.totalBricks / 1000).toFixed(0)}k</div>
                            <div className="text-muted-foreground text-xs">Bricks</div>
                          </div>
                          <div>
                            <div className="font-bold">{builder.badges}</div>
                            <div className="text-muted-foreground text-xs">Badges</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Rest of Rankings */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Builders</CardTitle>
                  <CardDescription>Ranked by reputation score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {SAMPLE_BUILDERS.slice(3).map((builder, index) => (
                      <motion.div
                        key={builder.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <RankBadge rank={index + 4} />
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl">
                          {builder.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{builder.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {builder.builds} builds • {(builder.totalBricks / 1000).toFixed(0)}k bricks
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{builder.reputation.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">reputation</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Top Builds */}
          <TabsContent value="builds">
            <div className="grid gap-4">
              {/* Top 3 Builds */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {SAMPLE_BUILDS.slice(0, 3).map((build, index) => (
                  <motion.div
                    key={build.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "relative",
                      index === 0 && "md:order-2 md:-mt-4",
                      index === 1 && "md:order-1",
                      index === 2 && "md:order-3"
                    )}
                  >
                    <Card className={cn(
                      "overflow-hidden",
                      index === 0 && "border-yellow-400"
                    )}>
                      <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <Box className="w-16 h-16 text-primary/50" />
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <RankBadge rank={index + 1} />
                          <Badge variant="outline" className="capitalize">{build.theme}</Badge>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{build.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">by {build.creator}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold">{build.avgRating.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {build.totalRatings.toLocaleString()} ratings
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Rest of Builds */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Rated Builds</CardTitle>
                  <CardDescription>Ranked by average rating</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {SAMPLE_BUILDS.slice(3).map((build, index) => (
                      <motion.div
                        key={build.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <RankBadge rank={index + 4} />
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Box className="w-6 h-6 text-primary/50" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{build.name}</div>
                          <div className="text-sm text-muted-foreground">
                            by {build.creator} • <span className="capitalize">{build.theme}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold">{build.avgRating.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {build.totalRatings.toLocaleString()} ratings
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Top Streamers */}
          <TabsContent value="streamers">
            <div className="grid gap-4">
              {/* Top 3 Streamers */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {SAMPLE_STREAMERS.slice(0, 3).map((streamer, index) => (
                  <motion.div
                    key={streamer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "relative",
                      index === 0 && "md:order-2 md:-mt-4",
                      index === 1 && "md:order-1",
                      index === 2 && "md:order-3"
                    )}
                  >
                    <Card className={cn(
                      "text-center overflow-hidden",
                      index === 0 && "border-red-400 bg-gradient-to-b from-red-50 to-background dark:from-red-950/20"
                    )}>
                      <CardContent className="pt-6">
                        <div className="flex justify-center mb-4">
                          <RankBadge rank={index + 1} />
                        </div>
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center text-4xl mb-4">
                          {streamer.avatar}
                        </div>
                        <h3 className="font-bold text-lg mb-1">{streamer.name}</h3>
                        <div className="flex items-center justify-center gap-1 text-red-500 mb-4">
                          <Radio className="w-4 h-4" />
                          <span className="font-bold">{(streamer.followers / 1000).toFixed(0)}k</span>
                          <span className="text-muted-foreground text-sm">followers</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 mb-4">
                          {streamer.platforms.map(platform => (
                            <Badge key={platform} variant="outline" className="text-xs capitalize">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="font-bold">{(streamer.avgViewers / 1000).toFixed(1)}k</div>
                            <div className="text-muted-foreground text-xs">Avg Viewers</div>
                          </div>
                          <div>
                            <div className="font-bold">{streamer.totalHours}h</div>
                            <div className="text-muted-foreground text-xs">Streamed</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Rest of Streamers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Streamers</CardTitle>
                  <CardDescription>Ranked by follower count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {SAMPLE_STREAMERS.slice(3).map((streamer, index) => (
                      <motion.div
                        key={streamer.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <RankBadge rank={index + 4} />
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center text-2xl">
                          {streamer.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{streamer.name}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {streamer.platforms.map(platform => (
                              <Badge key={platform} variant="outline" className="text-xs capitalize">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-500">{(streamer.followers / 1000).toFixed(0)}k</div>
                          <div className="text-xs text-muted-foreground">followers</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold mb-2">Ready to Climb the Ranks?</h2>
              <p className="text-muted-foreground mb-6">
                Start building, streaming, and engaging with the community to earn your spot on the leaderboards!
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/build">
                  <Button>
                    <Box className="w-4 h-4 mr-2" />
                    Start Building
                  </Button>
                </Link>
                <Link href="/integrations">
                  <Button variant="outline">
                    <Radio className="w-4 h-4 mr-2" />
                    Connect Streams
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
