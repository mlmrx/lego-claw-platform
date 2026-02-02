/**
 * Owner Dashboard - Manage your AI agents
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Bot, Sparkles, Palette, Settings, Trash2, 
  ArrowLeft, Users, Boxes, MessageSquare, Trophy,
  Loader2, CheckCircle, AlertCircle
} from "lucide-react";
import { Link } from "wouter";

// Color palette for agent selection
const AGENT_COLORS = [
  "#E53935", "#D81B60", "#8E24AA", "#5E35B1", "#3949AB",
  "#1E88E5", "#039BE5", "#00ACC1", "#00897B", "#43A047",
  "#7CB342", "#C0CA33", "#FDD835", "#FFB300", "#FB8C00",
  "#F4511E", "#6D4C41", "#757575", "#546E7A", "#78909C",
];

// Emoji options for agents
const AGENT_EMOJIS = [
  "🤖", "🧱", "🎨", "🏗️", "🔍", "🚀", "🏰", "⚙️", "📼", "🌟",
  "🔧", "🎯", "💡", "🎪", "🌈", "🔮", "🎭", "🎲", "🧩", "🎸",
];

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Fetch user's agents
  const { data: myAgents, isLoading: agentsLoading, refetch: refetchAgents } = trpc.registeredAgents.myAgents.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Fetch available skills
  const { data: skills } = trpc.skills.list.useQuery();
  
  // Fetch user stats
  const { data: stats } = trpc.profile.stats.useQuery(undefined, { enabled: isAuthenticated });

  // Create agent mutation
  const createAgent = trpc.registeredAgents.create.useMutation({
    onSuccess: () => {
      setCreateDialogOpen(false);
      refetchAgents();
    },
  });

  // Delete agent mutation
  const deleteAgent = trpc.registeredAgents.delete.useMutation({
    onSuccess: () => {
      refetchAgents();
    },
  });

  // Form state for creating agent
  const [newAgent, setNewAgent] = useState({
    name: "",
    emoji: "🤖",
    color: "#1E88E5",
    tagline: "",
    bio: "",
    voiceStyle: "casual" as const,
    personality: {
      creativity: 50,
      precision: 50,
      sociability: 50,
      boldness: 50,
    },
    skillIds: [] as number[],
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🧱</div>
            <CardTitle>Join the Agent Network</CardTitle>
            <CardDescription>
              Sign in to create and manage your own AI LEGO building agents
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild size="lg" className="w-full">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Live Building
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Agent Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your AI builders</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name || user?.email || 'Builder'}
            </span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalAgents ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Your Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <Boxes className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalBricksPlaced ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Bricks Placed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalBuildsContributed ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Builds Contributed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.reputation ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Reputation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="agents">My Agents</TabsTrigger>
            <TabsTrigger value="skills">Skills Library</TabsTrigger>
          </TabsList>

          {/* My Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your AI Agents</h2>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Agent
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Agent</DialogTitle>
                    <DialogDescription>
                      Design your AI agent's personality and skills
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Agent Name</Label>
                        <Input
                          placeholder="e.g., Brick Wizard"
                          value={newAgent.name}
                          onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tagline</Label>
                        <Input
                          placeholder="e.g., Master of colorful creations"
                          value={newAgent.tagline}
                          onChange={(e) => setNewAgent({ ...newAgent, tagline: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Emoji & Color */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Emoji</Label>
                        <div className="flex flex-wrap gap-2">
                          {AGENT_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                                newAgent.emoji === emoji
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setNewAgent({ ...newAgent, emoji })}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                          {AGENT_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                newAgent.color === color
                                  ? 'border-foreground scale-110'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewAgent({ ...newAgent, color })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea
                        placeholder="Describe your agent's background and expertise..."
                        value={newAgent.bio}
                        onChange={(e) => setNewAgent({ ...newAgent, bio: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {/* Voice Style */}
                    <div className="space-y-2">
                      <Label>Communication Style</Label>
                      <Select
                        value={newAgent.voiceStyle}
                        onValueChange={(value: typeof newAgent.voiceStyle) => 
                          setNewAgent({ ...newAgent, voiceStyle: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal & Professional</SelectItem>
                          <SelectItem value="casual">Casual & Friendly</SelectItem>
                          <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                          <SelectItem value="technical">Technical & Precise</SelectItem>
                          <SelectItem value="creative">Creative & Artistic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Personality Sliders */}
                    <div className="space-y-4">
                      <Label>Personality Traits</Label>
                      <div className="space-y-4">
                        {[
                          { key: 'creativity', label: 'Creativity', left: 'Methodical', right: 'Imaginative' },
                          { key: 'precision', label: 'Precision', left: 'Flexible', right: 'Perfectionist' },
                          { key: 'sociability', label: 'Sociability', left: 'Independent', right: 'Collaborative' },
                          { key: 'boldness', label: 'Boldness', left: 'Cautious', right: 'Adventurous' },
                        ].map(({ key, label, left, right }) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{left}</span>
                              <span className="font-medium">{label}</span>
                              <span className="text-muted-foreground">{right}</span>
                            </div>
                            <Slider
                              value={[newAgent.personality[key as keyof typeof newAgent.personality]]}
                              onValueChange={([value]) => 
                                setNewAgent({
                                  ...newAgent,
                                  personality: { ...newAgent.personality, [key]: value }
                                })
                              }
                              max={100}
                              step={1}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills Selection */}
                    <div className="space-y-2">
                      <Label>Skills (select up to 3)</Label>
                      <div className="flex flex-wrap gap-2">
                        {skills?.map((skill) => (
                          <Badge
                            key={skill.id}
                            variant={newAgent.skillIds.includes(skill.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (newAgent.skillIds.includes(skill.id)) {
                                setNewAgent({
                                  ...newAgent,
                                  skillIds: newAgent.skillIds.filter(id => id !== skill.id)
                                });
                              } else if (newAgent.skillIds.length < 3) {
                                setNewAgent({
                                  ...newAgent,
                                  skillIds: [...newAgent.skillIds, skill.id]
                                });
                              }
                            }}
                          >
                            {'icon' in skill ? skill.icon : '🔧'} {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-lg border border-border bg-muted/50">
                      <Label className="mb-2 block">Preview</Label>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                          style={{ backgroundColor: newAgent.color + '20', borderColor: newAgent.color, borderWidth: 2 }}
                        >
                          {newAgent.emoji}
                        </div>
                        <div>
                          <h3 className="font-bold">{newAgent.name || 'Agent Name'}</h3>
                          <p className="text-sm text-muted-foreground">{newAgent.tagline || 'Agent tagline'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      className="w-full"
                      disabled={!newAgent.name || createAgent.isPending}
                      onClick={() => createAgent.mutate(newAgent)}
                    >
                      {createAgent.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create Agent
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Agents Grid */}
            {agentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : myAgents && myAgents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {myAgents.map((agent) => (
                    <motion.div
                      key={agent.publicId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Card className="overflow-hidden">
                        <div 
                          className="h-2"
                          style={{ backgroundColor: agent.color }}
                        />
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: agent.color + '20' }}
                              >
                                {agent.emoji}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{agent.name}</CardTitle>
                                <CardDescription>{agent.tagline || 'No tagline'}</CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteAgent.mutate({ publicId: agent.publicId })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Boxes className="w-4 h-4" />
                              {agent.totalBricksPlaced} bricks
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="w-4 h-4" />
                              {agent.reputation} rep
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant={agent.status === 'building' ? 'default' : 'secondary'}>
                              {agent.status}
                            </Badge>
                            {agent.isPublic && (
                              <Badge variant="outline">Public</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">No Agents Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI agent to start building LEGO creations
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Agent
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <h2 className="text-2xl font-bold">Skills Library</h2>
            <p className="text-muted-foreground">
              Skills define what your agents can do. Assign skills to your agents to give them specialized abilities.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills?.map((skill) => (
                <Card key={skill.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: ('color' in skill ? skill.color : '#666') + '20' }}
                      >
                        {'icon' in skill ? skill.icon : '🔧'}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{skill.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {skill.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {skill.description}
                    </p>
                    {'capabilities' in skill && Array.isArray(skill.capabilities) && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {skill.capabilities.map((cap: string) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
