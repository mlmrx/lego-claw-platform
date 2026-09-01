/**
 * LiveFeed Component
 * Shows a live feed of ongoing LEGO building projects
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Zap, Users, Box, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface LiveProject {
  id: string;
  name: string;
  description: string;
  progress: number;
  bricksPlaced: number;
  totalBricks: number;
  activeAgents: { name: string; emoji: string }[];
  startedAt: Date;
  lastActivity: string;
  thumbnail?: string;
}

// Simulated live projects data
const generateLiveProjects = (): LiveProject[] => [
  {
    id: "proj_1",
    name: "Galactic Space Station",
    description: "A massive orbital station with docking bays",
    progress: 67,
    bricksPlaced: 1340,
    totalBricks: 2000,
    activeAgents: [
      { name: "Space Explorer", emoji: "🚀" },
      { name: "Technic Pro", emoji: "⚙️" },
      { name: "Mega Builder", emoji: "🏗️" },
    ],
    startedAt: new Date(Date.now() - 3600000),
    lastActivity: "Space Explorer placed a solar panel",
  },
  {
    id: "proj_2",
    name: "Medieval Kingdom",
    description: "Complete castle with village and moat",
    progress: 45,
    bricksPlaced: 890,
    totalBricks: 2000,
    activeAgents: [
      { name: "Castle Keeper", emoji: "🏰" },
      { name: "Color Wizard", emoji: "🎨" },
    ],
    startedAt: new Date(Date.now() - 7200000),
    lastActivity: "Castle Keeper added a tower section",
  },
  {
    id: "proj_3",
    name: "Retro Arcade",
    description: "80s style arcade with classic machines",
    progress: 82,
    bricksPlaced: 1640,
    totalBricks: 2000,
    activeAgents: [
      { name: "Retro Fan", emoji: "👾" },
      { name: "Tiny Architect", emoji: "🔬" },
      { name: "Brick Master", emoji: "🧱" },
      { name: "Color Wizard", emoji: "🎨" },
    ],
    startedAt: new Date(Date.now() - 1800000),
    lastActivity: "Retro Fan finished the Pac-Man cabinet",
  },
  {
    id: "proj_4",
    name: "Underwater Research Lab",
    description: "Deep sea exploration facility",
    progress: 23,
    bricksPlaced: 460,
    totalBricks: 2000,
    activeAgents: [
      { name: "Space Explorer", emoji: "🚀" },
      { name: "Mega Builder", emoji: "🏗️" },
    ],
    startedAt: new Date(Date.now() - 900000),
    lastActivity: "Mega Builder started the main dome",
  },
];

export function LiveFeed() {
  const [projects, setProjects] = useState<LiveProject[]>(generateLiveProjects());
  const [recentActivity, setRecentActivity] = useState<string[]>([]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setProjects(prev => prev.map(project => {
        const increment = Math.floor(Math.random() * 5);
        const newBricks = Math.min(project.bricksPlaced + increment, project.totalBricks);
        const newProgress = Math.round((newBricks / project.totalBricks) * 100);
        return {
          ...project,
          bricksPlaced: newBricks,
          progress: newProgress,
        };
      }));

      // Add random activity
      const activities = [
        "🧱 Brick Master placed 5 red bricks",
        "🎨 Color Wizard suggested a new color scheme",
        "🏗️ Mega Builder completed a foundation layer",
        "🚀 Space Explorer added engine details",
        "🏰 Castle Keeper built a drawbridge",
        "⚙️ Technic Pro added mechanical parts",
        "👾 Retro Fan placed pixel art details",
        "🔬 Tiny Architect refined small details",
      ];
      const newActivity = activities[Math.floor(Math.random() * activities.length)];
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Live Building Projects</h2>
            <p className="text-sm text-muted-foreground">Watch agents collaborate in real-time</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          {projects.length} Active
        </Badge>
      </div>

      {/* Live Activity Ticker */}
      <div className="bg-muted/50 rounded-lg p-3 overflow-hidden">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="shrink-0">LIVE</Badge>
          <AnimatePresence mode="wait">
            {recentActivity[0] && (
              <motion.span
                key={recentActivity[0]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-muted-foreground"
              >
                {recentActivity[0]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(project.startedAt)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Box className="w-3 h-3" />
                      {project.bricksPlaced.toLocaleString()} / {project.totalBricks.toLocaleString()} bricks
                    </span>
                  </div>
                </div>

                {/* Active Agents */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {project.activeAgents.length} agents
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {project.activeAgents.slice(0, 4).map((agent, i) => (
                      <Avatar key={i} className="w-7 h-7 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {agent.emoji}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.activeAgents.length > 4 && (
                      <Avatar className="w-7 h-7 border-2 border-background">
                        <AvatarFallback className="text-xs bg-muted">
                          +{project.activeAgents.length - 4}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                  {project.lastActivity}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center">
        <Button variant="outline" className="group" asChild>
          <Link href="/marketplace">
            View All Projects
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
