/**
 * User Profile Page
 * Displays user's owned agents, created challenges, and personal achievements
 */

import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeDisplay, BadgeGrid } from "@/components/BadgeDisplay";
import { SocialShare } from "@/components/SocialShare";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  ArrowLeft, 
  Trophy, 
  Box, 
  Users, 
  Calendar, 
  Star, 
  Bot,
  Award,
  Target,
  Clock,
  ExternalLink,
  Blocks,
  Radio,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";

// Helper functions for streaming platforms
function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    twitch: '#9146FF',
    youtube: '#FF0000',
    twitter: '#000000',
    discord: '#5865F2',
    kick: '#53FC18',
    tiktok: '#000000',
    facebook: '#1877F2',
    instagram: '#E4405F',
    custom: '#6B7280',
  };
  return colors[platform] || '#6B7280';
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    twitch: '📺',
    youtube: '▶️',
    twitter: '𝕏',
    discord: '💬',
    kick: '🎮',
    tiktok: '🎵',
    facebook: '📘',
    instagram: '📷',
    custom: '🔧',
  };
  return icons[platform] || '🔧';
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const parsedUserId = parseInt(userId || "0");
  const isOwnProfile = currentUser?.id === parsedUserId;
  
  // Fetch user profile data
  const { data: profileData, isLoading } = trpc.userProfile.byId.useQuery(
    { userId: parsedUserId },
    { enabled: !!parsedUserId }
  );
  
  // Fetch user stats
  const { data: stats } = trpc.userProfile.stats.useQuery(
    { userId: parsedUserId },
    { enabled: !!parsedUserId }
  );
  
  // Fetch user's challenges
  const { data: challenges = [] } = trpc.userProfile.challenges.useQuery(
    { userId: parsedUserId },
    { enabled: !!parsedUserId }
  );
  
  // Fetch user's showcase builds (projects)
  const { data: builds = [] } = trpc.projects.byCreator.useQuery(
    { creatorId: parsedUserId },
    { enabled: !!parsedUserId }
  );
  
  // Fetch user's streaming integrations (only if own profile)
  const { data: integrations = [] } = trpc.integrations.myIntegrations.useQuery(
    undefined,
    { enabled: isOwnProfile }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-6xl py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-6xl py-8">
          <Button variant="ghost" className="mb-6" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
            <p className="text-muted-foreground">
              This user profile doesn't exist or has been removed.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const { user, agents, badges } = profileData;

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
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.displayName || user.name || "User"} />
                    ) : null}
                    <AvatarFallback className="text-3xl bg-primary/10">
                      {(user.displayName || user.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {badges.length > 0 && (
                    <BadgeDisplay badges={badges} maxDisplay={4} size="sm" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">
                      {user.displayName || user.name || "Anonymous Builder"}
                    </h1>
                    {isOwnProfile && (
                      <Badge variant="secondary">Your Profile</Badge>
                    )}
                  </div>
                  {user.bio && (
                    <p className="text-muted-foreground mb-4">{user.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Bot className="w-4 h-4" />
                      <strong className="text-foreground">{user.totalAgents}</strong> agents
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <strong className="text-foreground">{user.reputation}</strong> reputation
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <SocialShare
                    type="agent"
                    title={user.displayName || user.name || "Builder"}
                    description={`Check out this builder on LEGO Agents with ${user.totalAgents} agents and ${user.reputation} reputation!`}
                    hashtags={["LEGOAgents", "AIBuilder"]}
                  />
                  {isOwnProfile && (
                    <Button variant="outline" asChild>
                      <Link href="/dashboard">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Agents", value: stats.totalAgents, icon: Bot },
              { label: "Total Bricks", value: stats.totalBricks, icon: Box },
              { label: "Builds Completed", value: stats.totalBuilds, icon: Trophy },
              { label: "Contributions", value: stats.totalContributions, icon: Target },
              { label: "Reputation", value: stats.reputation, icon: Star },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <stat.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{stat.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span> ({agents.length})
            </TabsTrigger>
            <TabsTrigger value="builds" className="gap-2">
              <Blocks className="w-4 h-4" />
              <span className="hidden sm:inline">Builds</span> ({builds.length})
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Challenges</span> ({challenges.length})
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Badges</span> ({badges.length})
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="streaming" className="gap-2">
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">Streaming</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents">
            {agents.length === 0 ? (
              <Card className="p-12 text-center">
                <Bot className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Agents Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {isOwnProfile 
                    ? "Create your first AI agent to start building!"
                    : "This user hasn't created any agents yet."}
                </p>
                {isOwnProfile && (
                  <Button asChild>
                    <Link href="/dashboard">Create Agent</Link>
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent, i) => (
                  <motion.div
                    key={agent.publicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${agent.color}20` }}
                          >
                            {agent.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{agent.name}</h3>
                              {agent.isVerified && (
                                <Badge variant="secondary" className="text-xs">✓</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {agent.tagline || "AI Builder"}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Box className="w-3 h-3" />
                                {agent.totalBricksPlaced.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                {agent.totalBuildsContributed}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Lvl {agent.level}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Builds Tab */}
          <TabsContent value="builds">
            {builds.length === 0 ? (
              <Card className="p-12 text-center">
                <Blocks className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Showcase Builds</h3>
                <p className="text-muted-foreground mb-4">
                  {isOwnProfile 
                    ? "Start a build project to showcase your creations!"
                    : "This user hasn't created any showcase builds yet."}
                </p>
                {isOwnProfile && (
                  <Button asChild>
                    <Link href="/">Start Building</Link>
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {builds.map((build: any, i: number) => (
                  <motion.div
                    key={build.publicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div 
                        className="h-32 flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${build.theme === 'space' ? '#1a1a2e' : build.theme === 'medieval' ? '#4a3728' : build.theme === 'nature' ? '#1a472a' : '#2d3436'} 0%, ${build.theme === 'space' ? '#16213e' : build.theme === 'medieval' ? '#5c4033' : build.theme === 'nature' ? '#2d5a3d' : '#636e72'} 100%)`
                        }}
                      >
                        <Blocks className="w-12 h-12 text-white/30" />
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold line-clamp-1">{build.name}</h3>
                          <Badge 
                            variant={build.status === 'completed' ? 'default' : 'secondary'}
                            className="capitalize text-xs"
                          >
                            {build.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {build.description || "A LEGO creation"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Box className="w-3 h-3" />
                            {build.totalBricks?.toLocaleString() || 0} bricks
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {build.participantCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {build.likes || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            {challenges.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Challenges Created</h3>
                <p className="text-muted-foreground mb-4">
                  {isOwnProfile 
                    ? "Create a challenge for the community!"
                    : "This user hasn't created any challenges yet."}
                </p>
                {isOwnProfile && (
                  <Button asChild>
                    <Link href="/challenges">Create Challenge</Link>
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.map((challenge, i) => (
                  <motion.div
                    key={challenge.publicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{challenge.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {challenge.description || "Building challenge"}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={challenge.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {challenge.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {challenge.participantCount} participants
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {challenge.durationMinutes} min
                          </span>
                          <span className="capitalize">{challenge.challengeType}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Achievements & Badges</CardTitle>
                <CardDescription>
                  Badges earned through building, collaboration, and platform milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeGrid badges={badges} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Streaming Tab (only for own profile) */}
          {isOwnProfile && (
            <TabsContent value="streaming">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Linked Streaming Accounts</CardTitle>
                      <CardDescription>
                        Connect your streaming platforms to share your builds live
                      </CardDescription>
                    </div>
                    <Button asChild>
                      <Link href="/integrations">
                        <Radio className="w-4 h-4 mr-2" />
                        Manage Integrations
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {integrations.length === 0 ? (
                    <div className="text-center py-8">
                      <Radio className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-semibold mb-2">No Streaming Accounts Linked</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your Twitch, YouTube, or other streaming platforms
                      </p>
                      <Button asChild>
                        <Link href="/integrations">Connect Platform</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {integrations.map((integration: any) => (
                        <Card key={integration.publicId} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                                style={{ backgroundColor: getPlatformColor(integration.platform) + '20' }}
                              >
                                {getPlatformIcon(integration.platform)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{integration.platformName}</h4>
                                  {integration.isVerified ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-yellow-500" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {integration.platformUsername || integration.channelUrl || 'Connected'}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Radio className="w-3 h-3" />
                                    {integration.totalStreams || 0} streams
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {integration.totalViewers?.toLocaleString() || 0} viewers
                                  </span>
                                </div>
                              </div>
                              <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                                {integration.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
