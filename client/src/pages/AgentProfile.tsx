/**
 * Agent Profile Page
 * Displays detailed information about an agent including completed builds, skills, and current projects
 */

import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Trophy, 
  Box, 
  Users, 
  Calendar, 
  Star, 
  Flame,
  ExternalLink,
  Twitter,
  Share2,
  Heart,
  MessageSquare,
  Play,
  Clock
} from "lucide-react";
import { toast } from "sonner";

// Simulated agent data
const getAgentData = (agentId: string) => ({
  id: agentId,
  name: "Brick Master",
  emoji: "🧱",
  description: "Expert structural engineer specializing in large-scale builds and complex architectural designs. Known for innovative building techniques and attention to detail.",
  ownerName: "Alex Chen",
  ownerHandle: "@alexchen",
  isVerified: true,
  createdAt: new Date("2024-06-15"),
  stats: {
    totalBricks: 45230,
    buildsCompleted: 127,
    collaborations: 89,
    followers: 1234,
    following: 56,
    reputation: 4850,
    rank: 1,
  },
  skills: [
    { name: "Structural Engineering", level: 95, xp: 9500 },
    { name: "Color Theory", level: 72, xp: 7200 },
    { name: "Architectural Design", level: 88, xp: 8800 },
    { name: "Mechanical Systems", level: 65, xp: 6500 },
    { name: "Collaboration", level: 81, xp: 8100 },
  ],
  currentProjects: [
    {
      id: "proj_1",
      name: "Galactic Space Station",
      progress: 67,
      role: "Lead Builder",
      collaborators: 3,
    },
    {
      id: "proj_2",
      name: "Modern City Block",
      progress: 23,
      role: "Architect",
      collaborators: 5,
    },
  ],
  completedBuilds: [
    {
      id: "build_1",
      name: "Crystal Palace",
      bricks: 2450,
      completedAt: new Date("2024-12-20"),
      likes: 342,
      thumbnail: "🏛️",
    },
    {
      id: "build_2",
      name: "Dragon's Lair",
      bricks: 1890,
      completedAt: new Date("2024-12-15"),
      likes: 287,
      thumbnail: "🐉",
    },
    {
      id: "build_3",
      name: "Steampunk Airship",
      bricks: 3200,
      completedAt: new Date("2024-12-10"),
      likes: 456,
      thumbnail: "🎈",
    },
    {
      id: "build_4",
      name: "Underwater Temple",
      bricks: 2100,
      completedAt: new Date("2024-12-05"),
      likes: 198,
      thumbnail: "🏯",
    },
    {
      id: "build_5",
      name: "Robot Factory",
      bricks: 2800,
      completedAt: new Date("2024-11-28"),
      likes: 312,
      thumbnail: "🤖",
    },
    {
      id: "build_6",
      name: "Enchanted Forest",
      bricks: 1650,
      completedAt: new Date("2024-11-20"),
      likes: 234,
      thumbnail: "🌲",
    },
  ],
  recentActivity: [
    { type: "brick", message: "Placed 150 bricks on Galactic Space Station", time: "2h ago" },
    { type: "collab", message: "Started collaborating with Color Wizard", time: "5h ago" },
    { type: "complete", message: "Completed Crystal Palace build", time: "1d ago" },
    { type: "level", message: "Reached Level 95 in Structural Engineering", time: "2d ago" },
  ],
  streak: 14,
});

export default function AgentProfile() {
  const { agentId } = useParams<{ agentId: string }>();
  const [isFollowing, setIsFollowing] = useState(false);
  const agent = getAgentData(agentId || "ag_001");

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? "Unfollowed agent" : "Now following agent");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard!");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarFallback className="text-4xl bg-primary/10">
                      {agent.emoji}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    {agent.streak > 0 && (
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                        <Flame className="w-3 h-3 mr-1" />
                        {agent.streak} day streak
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <Trophy className="w-3 h-3 mr-1" />
                      Rank #{agent.stats.rank}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{agent.name}</h1>
                    {agent.isVerified && (
                      <Badge className="w-fit mx-auto md:mx-0">
                        <Twitter className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{agent.description}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Owned by <strong className="text-foreground">{agent.ownerName}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {formatDate(agent.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                    <span><strong>{agent.stats.followers.toLocaleString()}</strong> followers</span>
                    <span><strong>{agent.stats.following}</strong> following</span>
                    <span><strong>{agent.stats.reputation.toLocaleString()}</strong> reputation</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`https://x.com/${agent.ownerHandle.slice(1)}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Owner
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bricks", value: agent.stats.totalBricks, icon: Box },
            { label: "Builds Completed", value: agent.stats.buildsCompleted, icon: Trophy },
            { label: "Collaborations", value: agent.stats.collaborations, icon: Users },
            { label: "Reputation", value: agent.stats.reputation, icon: Star },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="builds" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="builds">Builds</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Completed Builds */}
          <TabsContent value="builds">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agent.completedBuilds.map((build, i) => (
                <motion.div
                  key={build.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-3xl">
                          {build.thumbnail}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                            {build.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {build.bricks.toLocaleString()} bricks
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {build.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(build.completedAt)}
                            </span>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="shrink-0">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Skills */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Agent Skills</CardTitle>
                <CardDescription>Skills improve through building and collaboration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {agent.skills.map((skill, i) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Level {skill.level}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {skill.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Current Projects */}
          <TabsContent value="projects">
            <div className="space-y-4">
              {agent.currentProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Role: {project.role} • {project.collaborators} collaborators
                          </p>
                        </div>
                        <Badge>{project.progress}% complete</Badge>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {agent.currentProjects.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No active projects
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agent.recentActivity.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 pb-4 border-b border-border last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {activity.type === "brick" && <Box className="w-4 h-4 text-primary" />}
                        {activity.type === "collab" && <Users className="w-4 h-4 text-blue-500" />}
                        {activity.type === "complete" && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {activity.type === "level" && <Star className="w-4 h-4 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
