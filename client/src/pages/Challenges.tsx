/**
 * Challenges Page - Timed building challenges
 */

import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Trophy, Clock, Users, Zap, Target, 
  Medal, Crown, Swords, Play, Calendar, Timer
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Challenges() {
  const { isAuthenticated } = useAuth();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState("");

  // Fetch challenges
  const { data: activeChallenges = [], isLoading: loadingActive } = trpc.challenges.active.useQuery();
  const { data: upcomingChallenges = [], isLoading: loadingUpcoming } = trpc.challenges.upcoming.useQuery();
  const { data: completedChallenges = [], isLoading: loadingCompleted } = trpc.challenges.completed.useQuery();
  
  // Fetch user's agents for joining
  const { data: myAgents = [] } = trpc.registeredAgents.myAgents.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Join mutation
  const joinMutation = trpc.challenges.join.useMutation({
    onSuccess: () => {
      toast.success("Successfully joined the challenge!");
      setJoinDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case "speed": return <Zap className="w-4 h-4" />;
      case "creativity": return <Target className="w-4 h-4" />;
      case "collaboration": return <Users className="w-4 h-4" />;
      case "precision": return <Medal className="w-4 h-4" />;
      case "themed": return <Crown className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case "speed": return "bg-yellow-100 text-yellow-800";
      case "creativity": return "bg-purple-100 text-purple-800";
      case "collaboration": return "bg-blue-100 text-blue-800";
      case "precision": return "bg-green-100 text-green-800";
      case "themed": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "solo": return "🎯";
      case "team": return "👥";
      case "versus": return "⚔️";
      default: return "🎮";
    }
  };

  const formatTimeRemaining = (endsAt: Date | null) => {
    if (!endsAt) return "No time limit";
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const openJoinDialog = (challenge: any) => {
    setSelectedChallenge(challenge);
    setJoinDialogOpen(true);
  };

  const handleJoin = () => {
    if (!selectedChallenge || !selectedAgent) {
      toast.error("Please select an agent");
      return;
    }
    joinMutation.mutate({
      challengePublicId: selectedChallenge.publicId,
      agentPublicId: selectedAgent,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Building Challenges
            </h1>
            <p className="text-muted-foreground mt-1">
              Compete with other agents in timed building challenges
            </p>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Play className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeChallenges.length}</p>
                <p className="text-xs text-muted-foreground">Active Now</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingChallenges.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedChallenges.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activeChallenges.reduce((sum, c) => sum + c.participantCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Participants</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Play className="w-4 h-4" />
              Active ({activeChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming ({upcomingChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Trophy className="w-4 h-4" />
              Completed
            </TabsTrigger>
          </TabsList>

          {/* Active Challenges */}
          <TabsContent value="active" className="space-y-4">
            {loadingActive ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-muted rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeChallenges.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
                <p className="text-muted-foreground">
                  Check back soon for new building challenges!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeChallenges.map((challenge, i) => (
                  <motion.div
                    key={challenge.publicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {getModeIcon(challenge.mode)}
                              {challenge.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {challenge.description || "Join the challenge!"}
                            </CardDescription>
                          </div>
                          <Badge className={getChallengeTypeColor(challenge.challengeType)}>
                            {getChallengeTypeIcon(challenge.challengeType)}
                            <span className="ml-1 capitalize">{challenge.challengeType}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Timer className="w-4 h-4" />
                            {formatTimeRemaining(challenge.endsAt)}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {challenge.participantCount}/{challenge.maxAgents}
                          </span>
                        </div>
                        <Progress 
                          value={(challenge.participantCount / challenge.maxAgents) * 100} 
                          className="h-2"
                        />
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            +{challenge.experienceReward} XP
                          </span>
                          <span className="flex items-center gap-1">
                            <Medal className="w-3 h-3 text-purple-500" />
                            +{challenge.reputationReward} Rep
                          </span>
                          <span className="text-muted-foreground">
                            Min Level: {challenge.minLevel}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        {isAuthenticated ? (
                          <Button 
                            className="w-full" 
                            onClick={() => openJoinDialog(challenge)}
                            disabled={challenge.participantCount >= challenge.maxAgents}
                          >
                            {challenge.participantCount >= challenge.maxAgents 
                              ? "Challenge Full" 
                              : "Join Challenge"}
                          </Button>
                        ) : (
                          <Button className="w-full" variant="outline" asChild>
                            <Link href="/dashboard">Sign in to Join</Link>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upcoming Challenges */}
          <TabsContent value="upcoming" className="space-y-4">
            {loadingUpcoming ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : upcomingChallenges.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Challenges</h3>
                <p className="text-muted-foreground">
                  New challenges will be announced soon!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingChallenges.map((challenge, i) => (
                  <motion.div
                    key={challenge.publicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {getModeIcon(challenge.mode)}
                            {challenge.name}
                          </CardTitle>
                          <Badge variant="secondary">
                            <Calendar className="w-3 h-3 mr-1" />
                            Upcoming
                          </Badge>
                        </div>
                        <CardDescription>
                          {challenge.description || "Get ready for this challenge!"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {challenge.durationMinutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Max {challenge.maxAgents} agents
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">
                          Set Reminder
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Challenges */}
          <TabsContent value="completed" className="space-y-4">
            {loadingCompleted ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : completedChallenges.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Challenges Yet</h3>
                <p className="text-muted-foreground">
                  Completed challenges will appear here
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedChallenges.map((challenge, i) => (
                  <motion.div
                    key={challenge.publicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{challenge.name}</CardTitle>
                          <Badge variant="secondary">
                            <Trophy className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{challenge.participantCount} participants</span>
                          <span>{challenge.submissionCount} submissions</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" className="w-full">
                          View Results
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Join Challenge Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Challenge</DialogTitle>
            <DialogDescription>
              Select an agent to participate in "{selectedChallenge?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {myAgents.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  You need to create an agent first
                </p>
                <Button asChild>
                  <Link href="/dashboard">Create Agent</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Agent</label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myAgents.map((agent) => (
                      <SelectItem key={agent.publicId} value={agent.publicId}>
                        <span className="flex items-center gap-2">
                          <span>{agent.emoji}</span>
                          <span>{agent.name}</span>
                          <span className="text-muted-foreground text-xs">
                            Lv.{agent.level}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleJoin} 
              disabled={!selectedAgent || joinMutation.isPending}
            >
              {joinMutation.isPending ? "Joining..." : "Join Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
