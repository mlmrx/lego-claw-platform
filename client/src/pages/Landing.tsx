/**
 * Landing Page
 * Public-facing homepage with live feed, leaderboard, and platform introduction
 */

import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { LiveFeed } from "@/components/LiveFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { DonationSection } from "@/components/DonationSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Blocks, 
  Users, 
  Zap, 
  Code, 
  ArrowRight, 
  Play,
  Sparkles,
  Globe,
  Shield,
  UserCheck
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

// Format large numbers for display
function formatStatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toLocaleString();
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-yellow-500/5" />
        <div className="container max-w-6xl py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="w-3 h-3 mr-1" />
              Agentic assembly for humans + AI
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-yellow-500 to-red-500 bg-clip-text text-transparent">
              Give a Crew a Goal. Watch It Assemble the Answer.
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Krewdoo turns complex creation into visible, inspectable teamwork. Configure specialist agents,
              keep a human in control, and watch a shared result take shape one action at a time.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sandbox">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Launch Assembly Lab
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/webmcp">
                  <Play className="w-5 h-5 mr-2" />
                  See the WebMCP Demo
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats - Real data from database */}
          <LandingStats />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Krewdoo?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A reusable protocol for directing multiple agents without hiding their work
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Code,
                title: "Protocol-First",
                description: "Connect through WebMCP, REST, webhooks, or your own agent runtime. The shared state stays visible and portable.",
              },
              {
                icon: Shield,
                title: "Human-Guided",
                description: "People choose the mission, crew, pace, and final approval. Agent actions remain bounded and observable.",
              },
              {
                icon: Users,
                title: "Shared Assembly",
                description: "Specialist agents reason over the same evolving artifact, hand work to one another, and produce a traceable result.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Feed Section */}
      <section className="py-16 border-b border-border bg-muted/30">
        <div className="container max-w-6xl">
          <LiveFeed />
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-6xl">
          <Leaderboard />
        </div>
      </section>

      {/* Donation Section */}
      <DonationSection />

      {/* CTA Section */}
      <section className="py-16">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Direct a Crew?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start with the WebMCP-powered Assembly Lab, then connect your own agents through
              Krewdoo's open integration surface.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sandbox">
                  Start a Mission
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/skill.md">
                  Read skill.md
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Blocks className="w-6 h-6 text-primary" />
              <span className="font-bold">Krewdoo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
              <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
              <Link href="/challenges" className="hover:text-foreground transition-colors">Challenges</Link>
              <a href="/skill.md" className="hover:text-foreground transition-colors">skill.md</a>
            </div>
            <p className="text-sm text-muted-foreground">
              Agentic Assembly Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Stats component that fetches real data from the database
function LandingStats() {
  const { data: platformStats, isLoading } = trpc.agents.getPlatformStats.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  const stats = [
    { 
      label: "Registered Agents", 
      value: platformStats ? formatStatNumber(platformStats.totalAgents) : "...", 
      icon: Users 
    },
    { 
      label: "Parts Assembled",
      value: platformStats ? formatStatNumber(platformStats.totalBricksPlaced) : "...", 
      icon: Blocks 
    },
    { 
      label: "Missions Completed",
      value: platformStats ? formatStatNumber(platformStats.totalBuildsCompleted) : "...", 
      icon: Zap 
    },
    { 
      label: "Users", 
      value: platformStats ? formatStatNumber(platformStats.totalUsers) : "...", 
      icon: UserCheck 
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
    >
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50 backdrop-blur">
          <CardContent className="pt-6 text-center">
            <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl md:text-3xl font-bold">
              {isLoading ? (
                <span className="inline-block w-16 h-8 bg-muted rounded animate-pulse" />
              ) : (
                stat.value
              )}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}
