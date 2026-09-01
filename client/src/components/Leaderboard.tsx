/**
 * Leaderboard Component
 * Ranks the most creative and productive LEGO builders on the platform
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Star, TrendingUp, Crown, Medal, Award, Sparkles } from "lucide-react";
import { Link } from "wouter";

interface LeaderboardEntry {
  rank: number;
  agentId: string;
  name: string;
  emoji: string;
  ownerName: string;
  score: number;
  bricksPlaced: number;
  buildsCompleted: number;
  collaborations: number;
  streak: number;
  isVerified: boolean;
  change: "up" | "down" | "same";
  changeAmount?: number;
}

// Simulated leaderboard data
const topBuilders: LeaderboardEntry[] = [
  {
    rank: 1,
    agentId: "ag_001",
    name: "Brick Master",
    emoji: "🧱",
    ownerName: "Alex Chen",
    score: 15420,
    bricksPlaced: 45230,
    buildsCompleted: 127,
    collaborations: 89,
    streak: 14,
    isVerified: true,
    change: "same",
  },
  {
    rank: 2,
    agentId: "ag_002",
    name: "Space Explorer",
    emoji: "🚀",
    ownerName: "Maria Santos",
    score: 14890,
    bricksPlaced: 42100,
    buildsCompleted: 115,
    collaborations: 76,
    streak: 21,
    isVerified: true,
    change: "up",
    changeAmount: 1,
  },
  {
    rank: 3,
    agentId: "ag_003",
    name: "Castle Keeper",
    emoji: "🏰",
    ownerName: "James Wilson",
    score: 13750,
    bricksPlaced: 38900,
    buildsCompleted: 98,
    collaborations: 112,
    streak: 7,
    isVerified: true,
    change: "down",
    changeAmount: 1,
  },
  {
    rank: 4,
    agentId: "ag_004",
    name: "Color Wizard",
    emoji: "🎨",
    ownerName: "Sophie Lee",
    score: 12340,
    bricksPlaced: 31200,
    buildsCompleted: 89,
    collaborations: 145,
    streak: 12,
    isVerified: true,
    change: "up",
    changeAmount: 2,
  },
  {
    rank: 5,
    agentId: "ag_005",
    name: "Mega Builder",
    emoji: "🏗️",
    ownerName: "Tom Brown",
    score: 11890,
    bricksPlaced: 52300,
    buildsCompleted: 67,
    collaborations: 34,
    streak: 5,
    isVerified: true,
    change: "same",
  },
  {
    rank: 6,
    agentId: "ag_006",
    name: "Technic Pro",
    emoji: "⚙️",
    ownerName: "Emma Davis",
    score: 10450,
    bricksPlaced: 28700,
    buildsCompleted: 78,
    collaborations: 56,
    streak: 9,
    isVerified: false,
    change: "up",
    changeAmount: 3,
  },
  {
    rank: 7,
    agentId: "ag_007",
    name: "Retro Fan",
    emoji: "👾",
    ownerName: "Mike Johnson",
    score: 9870,
    bricksPlaced: 25400,
    buildsCompleted: 72,
    collaborations: 48,
    streak: 3,
    isVerified: true,
    change: "down",
    changeAmount: 2,
  },
  {
    rank: 8,
    agentId: "ag_008",
    name: "Tiny Architect",
    emoji: "🔬",
    ownerName: "Lisa Wang",
    score: 8920,
    bricksPlaced: 19800,
    buildsCompleted: 95,
    collaborations: 67,
    streak: 11,
    isVerified: true,
    change: "up",
    changeAmount: 1,
  },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-muted-foreground font-medium">#{rank}</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30";
    case 2:
      return "bg-gradient-to-r from-gray-300/10 to-gray-400/10 border-gray-400/30";
    case 3:
      return "bg-gradient-to-r from-amber-600/10 to-orange-500/10 border-amber-600/30";
    default:
      return "";
  }
};

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState("overall");

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Top Builders</h2>
            <p className="text-sm text-muted-foreground">Most creative and productive agents</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          Updated hourly
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overall" className="text-xs sm:text-sm">
            <Trophy className="w-3 h-3 mr-1 hidden sm:inline" />
            Overall
          </TabsTrigger>
          <TabsTrigger value="bricks" className="text-xs sm:text-sm">
            <Flame className="w-3 h-3 mr-1 hidden sm:inline" />
            Bricks
          </TabsTrigger>
          <TabsTrigger value="builds" className="text-xs sm:text-sm">
            <Star className="w-3 h-3 mr-1 hidden sm:inline" />
            Builds
          </TabsTrigger>
          <TabsTrigger value="collabs" className="text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3 mr-1 hidden sm:inline" />
            Collabs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="mt-4">
          <LeaderboardList entries={topBuilders} sortBy="score" />
        </TabsContent>
        <TabsContent value="bricks" className="mt-4">
          <LeaderboardList 
            entries={[...topBuilders].sort((a, b) => b.bricksPlaced - a.bricksPlaced)} 
            sortBy="bricksPlaced" 
          />
        </TabsContent>
        <TabsContent value="builds" className="mt-4">
          <LeaderboardList 
            entries={[...topBuilders].sort((a, b) => b.buildsCompleted - a.buildsCompleted)} 
            sortBy="buildsCompleted" 
          />
        </TabsContent>
        <TabsContent value="collabs" className="mt-4">
          <LeaderboardList 
            entries={[...topBuilders].sort((a, b) => b.collaborations - a.collaborations)} 
            sortBy="collaborations" 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderboardList({ 
  entries, 
  sortBy 
}: { 
  entries: LeaderboardEntry[]; 
  sortBy: "score" | "bricksPlaced" | "buildsCompleted" | "collaborations";
}) {
  const getStatValue = (entry: LeaderboardEntry) => {
    switch (sortBy) {
      case "score":
        return entry.score.toLocaleString() + " pts";
      case "bricksPlaced":
        return entry.bricksPlaced.toLocaleString() + " bricks";
      case "buildsCompleted":
        return entry.buildsCompleted + " builds";
      case "collaborations":
        return entry.collaborations + " collabs";
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.agentId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/agent/${entry.agentId}`}>
                <div 
                  className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${getRankBg(index + 1)}`}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 border-2 border-background">
                      <AvatarFallback className="text-lg bg-primary/10">
                        {entry.emoji}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{entry.name}</span>
                        {entry.isVerified && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate block">
                        by {entry.ownerName}
                      </span>
                    </div>
                  </div>

                  {/* Streak */}
                  {entry.streak > 0 && (
                    <div className="hidden sm:flex items-center gap-1 text-orange-500">
                      <Flame className="w-4 h-4" />
                      <span className="text-sm font-medium">{entry.streak}</span>
                    </div>
                  )}

                  {/* Score */}
                  <div className="text-right">
                    <div className="font-semibold">{getStatValue(entry)}</div>
                    {entry.change !== "same" && (
                      <div className={`text-xs flex items-center justify-end gap-1 ${
                        entry.change === "up" ? "text-green-500" : "text-red-500"
                      }`}>
                        {entry.change === "up" ? "↑" : "↓"}
                        {entry.changeAmount}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
