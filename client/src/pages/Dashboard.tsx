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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Bot, Sparkles, Palette, Settings, Trash2, 
  ArrowLeft, Users, Boxes, MessageSquare, Trophy,
  Loader2, CheckCircle, AlertCircle, HelpCircle, Wand2,
  Info
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

// Sample agent templates for quick start
const AGENT_TEMPLATES = [
  {
    name: "Brick Master",
    emoji: "🧱",
    color: "#E53935",
    tagline: "Expert in structural foundations",
    bio: "A seasoned builder with years of experience creating stable, well-balanced modular structures. Specializes in foundations, load-bearing walls, and interlocking techniques that make assemblies sturdy and long-lasting.",
    voiceStyle: "technical" as const,
    personality: { creativity: 40, precision: 90, sociability: 60, boldness: 50 },
    suggestedSkills: ["Structural Engineering", "Foundation Design"],
  },
  {
    name: "Color Wizard",
    emoji: "🎨",
    color: "#8E24AA",
    tagline: "Master of vibrant color schemes",
    bio: "An artistic soul who sees modular pieces as a painter sees colors on a palette. Creates vivid compositions using complementary colors, gradients, and unexpected combinations that bring assemblies to life.",
    voiceStyle: "creative" as const,
    personality: { creativity: 95, precision: 50, sociability: 70, boldness: 85 },
    suggestedSkills: ["Color Theory", "Aesthetic Design"],
  },
  {
    name: "Tiny Architect",
    emoji: "🏗️",
    color: "#1E88E5",
    tagline: "Designs intricate miniature worlds",
    bio: "Specializes in micro-scale builds and detailed miniature scenes. Has an incredible eye for tiny details and can pack enormous amounts of character into the smallest spaces. Every stud counts!",
    voiceStyle: "enthusiastic" as const,
    personality: { creativity: 80, precision: 85, sociability: 55, boldness: 60 },
    suggestedSkills: ["Miniature Design", "Detail Work"],
  },
  {
    name: "Retro Fan",
    emoji: "📼",
    color: "#FB8C00",
    tagline: "Nostalgic builds from the classics",
    bio: "A lover of vintage construction sets and classic building techniques. Brings retro charm to modern assemblies through timeless design elements and nostalgic construction patterns.",
    voiceStyle: "casual" as const,
    personality: { creativity: 70, precision: 60, sociability: 80, boldness: 45 },
    suggestedSkills: ["Classic Design", "Retro Styling"],
  },
  {
    name: "Space Explorer",
    emoji: "🚀",
    color: "#039BE5",
    tagline: "Building the future, one brick at a time",
    bio: "Obsessed with spacecraft, space stations, and futuristic vehicles. Combines sleek aerodynamic designs with functional details like engines, cockpits, and landing gear. Dreams of assembling a Mars colony!",
    voiceStyle: "enthusiastic" as const,
    personality: { creativity: 85, precision: 75, sociability: 65, boldness: 90 },
    suggestedSkills: ["Vehicle Design", "Sci-Fi Themes"],
  },
];

// Example placeholders for form fields
const EXAMPLES = {
  name: ["Brick Ninja", "Castle King", "Pixel Artist", "Gear Head", "Nature Builder"],
  tagline: [
    "Swift and precise brick placement",
    "Medieval architecture specialist",
    "Creating art one stud at a time",
    "Mechanical marvels and moving parts",
    "Organic shapes and natural designs",
  ],
  bio: [
    "A master of speed building who can construct complex structures in record time. Known for efficient brick placement and minimizing waste while maximizing creativity.",
    "Specializes in medieval castles, fortresses, and fantasy architecture. Every tower has a story, every wall tells a tale of epic battles and noble knights.",
    "Transforms modular pieces into pixel-art compositions. Creates mosaics, portraits, and retro gaming tributes using carefully selected colors and precise placement.",
  ],
};

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdAgentName, setCreatedAgentName] = useState("");
  const [showTemplates, setShowTemplates] = useState(true);
  
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
    onSuccess: (data) => {
      setCreatedAgentName(newAgent.name);
      setShowSuccess(true);
      refetchAgents();
      // Reset form
      setNewAgent({
        name: "",
        emoji: "🤖",
        color: "#1E88E5",
        tagline: "",
        bio: "",
        voiceStyle: "casual",
        personality: {
          creativity: 50,
          precision: 50,
          sociability: 50,
          boldness: 50,
        },
        skillIds: [],
      });
      setShowTemplates(true);
    },
  });

  // Delete agent mutation
  const deleteAgent = trpc.registeredAgents.delete.useMutation({
    onSuccess: () => {
      refetchAgents();
    },
  });

  // Voice style type
  type VoiceStyle = "formal" | "casual" | "enthusiastic" | "technical" | "creative";

  // Form state for creating agent
  const [newAgent, setNewAgent] = useState<{
    name: string;
    emoji: string;
    color: string;
    tagline: string;
    bio: string;
    voiceStyle: VoiceStyle;
    personality: {
      creativity: number;
      precision: number;
      sociability: number;
      boldness: number;
    };
    skillIds: number[];
  }>({
    name: "",
    emoji: "🤖",
    color: "#1E88E5",
    tagline: "",
    bio: "",
    voiceStyle: "casual",
    personality: {
      creativity: 50,
      precision: 50,
      sociability: 50,
      boldness: 50,
    },
    skillIds: [],
  });

  // Apply a template
  const applyTemplate = (template: typeof AGENT_TEMPLATES[0]) => {
    setNewAgent({
      name: template.name,
      emoji: template.emoji,
      color: template.color,
      tagline: template.tagline,
      bio: template.bio,
      voiceStyle: template.voiceStyle,
      personality: template.personality,
      skillIds: [], // User will select skills
    });
    setShowTemplates(false);
  };

  // Get random example
  const getRandomExample = (field: keyof typeof EXAMPLES) => {
    const examples = EXAMPLES[field];
    return examples[Math.floor(Math.random() * examples.length)];
  };

  // Close success dialog and main dialog
  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setCreateDialogOpen(false);
  };

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
              Sign in to create and manage your own Krewdoo agent crew
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
              <Dialog open={createDialogOpen} onOpenChange={(open) => {
                setCreateDialogOpen(open);
                if (open) {
                  setShowSuccess(false);
                  setShowTemplates(true);
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Agent
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  {showSuccess ? (
                    // Success State
                    <div className="py-8 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
                      >
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </motion.div>
                      <h2 className="text-2xl font-bold mb-2">Agent Created!</h2>
                      <p className="text-muted-foreground mb-6">
                        <span className="font-semibold text-foreground">{createdAgentName}</span> is ready to join your next Krewdoo mission!
                      </p>
                      <div className="space-y-3">
                        <Button onClick={handleCloseSuccess} className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          View My Agents
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowSuccess(false);
                            setShowTemplates(true);
                          }}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Another Agent
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Create Form
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Bot className="w-5 h-5" />
                          Create New Agent
                        </DialogTitle>
                        <DialogDescription>
                          Design your AI agent's personality and skills. Your agent will collaborate with others on shared modular creations.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        {/* Quick Start Templates */}
                        {showTemplates && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-primary" />
                                Quick Start Templates
                              </Label>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowTemplates(false)}
                              >
                                Skip, start from scratch
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Choose a template to get started quickly, then customize it to make it your own!
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {AGENT_TEMPLATES.map((template) => (
                                <button
                                  key={template.name}
                                  type="button"
                                  onClick={() => applyTemplate(template)}
                                  className="p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                      style={{ backgroundColor: template.color + '20' }}
                                    >
                                      {template.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium group-hover:text-primary transition-colors">
                                        {template.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {template.tagline}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="border-t border-border pt-4 mt-4">
                              <p className="text-sm text-center text-muted-foreground">
                                Or fill out the form below to create a custom agent
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label>Agent Name</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Give your agent a memorable name that reflects their personality or specialty. This is how other builders will identify your agent.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              placeholder={`e.g., ${getRandomExample('name')}`}
                              value={newAgent.name}
                              onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label>Tagline</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>A short phrase that describes what your agent does best. This appears under their name in the marketplace.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              placeholder={`e.g., ${getRandomExample('tagline')}`}
                              value={newAgent.tagline}
                              onChange={(e) => setNewAgent({ ...newAgent, tagline: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Emoji & Color */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label>Emoji Avatar</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Choose an emoji that represents your agent's character. This is their visual identity in chats and builds.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
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
                            <div className="flex items-center gap-2">
                              <Label>Theme Color</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Pick a signature color for your agent. This color will be used in their profile and chat messages.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
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
                          <div className="flex items-center gap-2">
                            <Label>Bio / Background Story</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Write a backstory for your agent! Describe their building experience, what they're passionate about, and what makes them unique. This helps define their personality in conversations.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Textarea
                            placeholder={getRandomExample('bio')}
                            value={newAgent.bio}
                            onChange={(e) => setNewAgent({ ...newAgent, bio: e.target.value })}
                            rows={4}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            💡 Tip: Include details like their assembly style, favorite creative themes, and unique quirks!
                          </p>
                        </div>

                        {/* Voice Style */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label>Communication Style</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>How does your agent talk? This affects how they communicate with other agents and users during builds.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
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
                              <SelectItem value="formal">
                                <span className="flex items-center gap-2">
                                  📋 Formal & Professional
                                </span>
                              </SelectItem>
                              <SelectItem value="casual">
                                <span className="flex items-center gap-2">
                                  😊 Casual & Friendly
                                </span>
                              </SelectItem>
                              <SelectItem value="enthusiastic">
                                <span className="flex items-center gap-2">
                                  🎉 Enthusiastic & Energetic
                                </span>
                              </SelectItem>
                              <SelectItem value="technical">
                                <span className="flex items-center gap-2">
                                  🔬 Technical & Precise
                                </span>
                              </SelectItem>
                              <SelectItem value="creative">
                                <span className="flex items-center gap-2">
                                  🎨 Creative & Artistic
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Personality Sliders */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Label>Personality Traits</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>These sliders define your agent's personality. They affect how your agent approaches building tasks and collaborates with others.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/50 space-y-5">
                            {[
                              { 
                                key: 'creativity', 
                                label: 'Creativity', 
                                left: 'Methodical', 
                                right: 'Imaginative',
                                leftDesc: 'Follows proven patterns',
                                rightDesc: 'Invents new designs'
                              },
                              { 
                                key: 'precision', 
                                label: 'Precision', 
                                left: 'Flexible', 
                                right: 'Perfectionist',
                                leftDesc: 'Adapts on the fly',
                                rightDesc: 'Every brick must be perfect'
                              },
                              { 
                                key: 'sociability', 
                                label: 'Sociability', 
                                left: 'Independent', 
                                right: 'Collaborative',
                                leftDesc: 'Works best alone',
                                rightDesc: 'Loves teamwork'
                              },
                              { 
                                key: 'boldness', 
                                label: 'Boldness', 
                                left: 'Cautious', 
                                right: 'Adventurous',
                                leftDesc: 'Safe, reliable choices',
                                rightDesc: 'Takes creative risks'
                              },
                            ].map(({ key, label, left, right, leftDesc, rightDesc }) => (
                              <div key={key} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-muted-foreground cursor-help hover:text-foreground transition-colors">
                                        {left}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{leftDesc}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <span className="font-medium">{label}: {newAgent.personality[key as keyof typeof newAgent.personality]}%</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-muted-foreground cursor-help hover:text-foreground transition-colors">
                                        {right}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{rightDesc}</p>
                                    </TooltipContent>
                                  </Tooltip>
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
                          <div className="flex items-center gap-2">
                            <Label>Skills (select up to 3)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Skills determine what your agent is good at. Choose skills that match your agent's personality and the types of builds they'll excel at.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Click to select skills that match your agent's expertise:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {skills?.map((skill) => (
                              <Badge
                                key={skill.id}
                                variant={newAgent.skillIds.includes(skill.id) ? "default" : "outline"}
                                className="cursor-pointer transition-all hover:scale-105"
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
                          {newAgent.skillIds.length === 0 && (
                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                              <Info className="w-3 h-3" />
                              Select at least one skill to help your agent specialize
                            </p>
                          )}
                        </div>

                        {/* Preview */}
                        <div className="p-4 rounded-lg border border-border bg-muted/50">
                          <Label className="mb-3 block">Live Preview</Label>
                          <div className="flex items-center gap-4">
                            <div
                              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl border-2"
                              style={{ backgroundColor: newAgent.color + '20', borderColor: newAgent.color }}
                            >
                              {newAgent.emoji}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{newAgent.name || 'Your Agent Name'}</h3>
                              <p className="text-sm text-muted-foreground">{newAgent.tagline || 'Your agent tagline will appear here'}</p>
                              {newAgent.skillIds.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {newAgent.skillIds.map(id => {
                                    const skill = skills?.find(s => s.id === id);
                                    return skill ? (
                                      <Badge key={id} variant="secondary" className="text-xs">
                                        {'icon' in skill ? skill.icon : '🔧'} {skill.name}
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Submit */}
                        <Button
                          className="w-full"
                          size="lg"
                          disabled={!newAgent.name || createAgent.isPending}
                          onClick={() => createAgent.mutate(newAgent)}
                        >
                          {createAgent.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating Your Agent...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Create Agent
                            </>
                          )}
                        </Button>
                        
                        {!newAgent.name && (
                          <p className="text-xs text-center text-muted-foreground">
                            Enter an agent name to enable creation
                          </p>
                        )}
                      </div>
                    </>
                  )}
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
                  Create your first specialist agent and assemble a Krewdoo crew
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
