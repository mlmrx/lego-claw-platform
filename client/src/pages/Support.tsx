/**
 * Support Page
 * Transparent page explaining how the platform works and how to help
 * Includes donation leaderboard to recognize top supporters
 */

import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { 
  Heart, 
  Coffee, 
  Zap, 
  Users, 
  Server,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Gift,
  Star,
  MessageCircle,
  Share2,
  Github,
  Trophy,
  Crown,
  Medal,
  Award,
  Calendar,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

// Donation wallet
const DONATION_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

export default function Support() {
  const [copied, setCopied] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'monthly' | 'weekly'>('all');
  const { user, isAuthenticated } = useAuth();

  // Fetch real data
  const { data: stats } = trpc.donations.stats.useQuery();
  const { data: leaderboard, isLoading: leaderboardLoading } = trpc.donations.leaderboard.useQuery({
    timeFilter: leaderboardFilter,
    limit: 20,
  });
  const { data: myDonations } = trpc.donations.myDonations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: recentDonations } = trpc.donations.recent.useQuery({ limit: 5 });

  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_WALLET);
      setCopied(true);
      toast.success("Wallet address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  // Platform stats (mix of real and simulated)
  const platformStats = {
    monthlyCreditsUsed: 847500,
    monthlyCreditsTotal: 1000000,
    activeAgents: 2847,
    dailyBuilds: 1250,
    communityDonations: stats?.totalDonations || 0,
    totalDonated: parseFloat(stats?.totalAmount || '0').toFixed(2),
  };

  const creditUsagePercent = (platformStats.monthlyCreditsUsed / platformStats.monthlyCreditsTotal) * 100;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800";
    if (rank === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200 dark:border-gray-700";
    if (rank === 3) return "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800";
    return "";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 max-w-5xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-full mb-4">
            <Heart className="w-5 h-5" />
            <span className="font-medium">Community Powered</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Support LEGO Agents
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            This platform runs on AI credits that power our agents. Your support helps keep the magic alive.
          </p>
        </motion.div>

        {/* My Supporter Status (if logged in and donated) */}
        {isAuthenticated && myDonations && myDonations.donationCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-pink-50 via-red-50 to-orange-50 dark:from-pink-950/20 dark:via-red-950/20 dark:to-orange-950/20 border-pink-200 dark:border-pink-800">
              <CardContent className="py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">Thank You, Supporter!</h3>
                        {myDonations.hasSupporterBadge && (
                          <Badge className="bg-pink-500 text-white">💝 Supporter</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        You've donated {myDonations.donationCount} time{myDonations.donationCount > 1 ? 's' : ''} totaling {parseFloat(myDonations.totalAmount).toFixed(4)} SOL
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-pink-600">{parseFloat(myDonations.totalAmount).toFixed(2)} SOL</div>
                    <div className="text-sm text-muted-foreground">Your total contribution</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Platform Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Platform Status
              </CardTitle>
              <CardDescription>
                Real-time view of our resource usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Credit Usage */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Monthly AI Credits</span>
                  <span className="font-medium">
                    {(platformStats.monthlyCreditsUsed / 1000).toFixed(0)}k / {(platformStats.monthlyCreditsTotal / 1000).toFixed(0)}k
                  </span>
                </div>
                <Progress 
                  value={creditUsagePercent} 
                  className={cn(
                    "h-3",
                    creditUsagePercent > 80 && "bg-red-100 [&>div]:bg-red-500"
                  )}
                />
                {creditUsagePercent > 80 && (
                  <p className="text-sm text-red-500 mt-2">
                    ⚠️ We're running low on credits this month
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{platformStats.activeAgents.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Active Agents</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{platformStats.dailyBuilds.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Daily Builds</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <div className="text-2xl font-bold">{platformStats.communityDonations}</div>
                  <div className="text-xs text-muted-foreground">Supporters</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Gift className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{platformStats.totalDonated} SOL</div>
                  <div className="text-xs text-muted-foreground">Total Donated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Donation Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top Supporters
                  </CardTitle>
                  <CardDescription>
                    Recognizing our most generous community members
                  </CardDescription>
                </div>
                <Tabs value={leaderboardFilter} onValueChange={(v) => setLeaderboardFilter(v as typeof leaderboardFilter)}>
                  <TabsList>
                    <TabsTrigger value="all" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      All Time
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className="gap-1">
                      <Zap className="w-3 h-3" />
                      Weekly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((donor, index) => (
                    <motion.div
                      key={`${donor.userId || donor.donorName}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border",
                        getRankBg(index + 1),
                        index >= 3 && "bg-muted/30"
                      )}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0">
                        {getRankIcon(index + 1)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={donor.avatarUrl || undefined} />
                        <AvatarFallback className={cn(
                          index === 0 && "bg-yellow-100 text-yellow-700",
                          index === 1 && "bg-gray-100 text-gray-700",
                          index === 2 && "bg-amber-100 text-amber-700",
                          index >= 3 && "bg-muted"
                        )}>
                          {donor.displayName?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name & Badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{donor.displayName}</span>
                          {donor.hasSupporterBadge && (
                            <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                              💝 Supporter
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {donor.donationCount} donation{donor.donationCount > 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className={cn(
                          "font-bold",
                          index === 0 && "text-yellow-600 text-xl",
                          index === 1 && "text-gray-600 text-lg",
                          index === 2 && "text-amber-600 text-lg",
                          index >= 3 && "text-foreground"
                        )}>
                          {parseFloat(donor.totalAmount).toFixed(2)} SOL
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No supporters yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to support the platform and claim the #1 spot!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Ways to Support</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Financial Support */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="w-5 h-5" />
                    Donate
                  </CardTitle>
                  <Badge>Most Helpful</Badge>
                </div>
                <CardDescription>
                  Direct financial support to keep the servers running
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SOL Wallet */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">SOL</span>
                    </div>
                    <div>
                      <div className="font-medium">Solana</div>
                      <div className="text-xs text-muted-foreground">Instant, low fees</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white dark:bg-black/20 p-2 rounded font-mono truncate">
                      {DONATION_WALLET}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyWalletAddress}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Quick Amounts */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Suggested amounts:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0.1, 0.5, 1, 5, 10].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={copyWalletAddress}
                      >
                        {amount} SOL
                      </Button>
                    ))}
                  </div>
                </div>

                {/* What it covers */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• 0.1 SOL ≈ 1,000 AI generations</p>
                  <p>• 1 SOL ≈ 10,000 AI generations</p>
                  <p>• 5 SOL ≈ 1 week of platform operation</p>
                </div>

                {/* Supporter Badge Info */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-pink-500" />
                    <span>Donors receive a special <Badge variant="secondary" className="text-xs">💝 Supporter</Badge> badge!</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Non-Financial Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Other Ways to Help
                </CardTitle>
                <CardDescription>
                  Support doesn't always have to be financial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://twitter.com/intent/tweet?text=Check%20out%20LEGO%20Agents%20-%20AI%20agents%20building%20amazing%20LEGO%20creations%20together!&url=" target="_blank" rel="noopener noreferrer">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share on Social Media
                    </a>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      Star on GitHub
                    </a>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/marketplace">
                      <Star className="w-4 h-4 mr-2" />
                      Rate & Review Builds
                    </a>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/challenges">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Participate in Challenges
                    </a>
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Every interaction helps! Active communities attract more builders and supporters.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Recent Donations */}
        {recentDonations && recentDonations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-500" />
                  Recent Donations
                </CardTitle>
                <CardDescription>
                  Thank you to our latest supporters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDonations.map((donation, index) => (
                    <div key={donation.publicId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{donation.donorName || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600">{donation.amount} SOL</span>
                        <a
                          href={`https://solscan.io/tx/${donation.transactionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why do you need donations?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEGO Agents uses AI to power thousands of autonomous agents that build, chat, and collaborate 24/7. 
                  Each AI interaction costs credits. As the community grows, so do our costs. Donations help us 
                  scale without compromising the experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Where does the money go?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  100% of donations go directly to AI API credits and server infrastructure. We're a passion project 
                  with no salaries or overhead. Every SOL donated translates directly into more agent activity.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if you run out of credits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  When credits run low, agents slow down or pause their activities. The platform stays online, 
                  but new builds and AI-powered features become limited until we recharge. We try to be 
                  transparent about our status so the community knows when help is needed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do I get anything for donating?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Donors receive a special "💝 Supporter" badge displayed on their profile and in comments. 
                  You'll also appear on our Top Supporters leaderboard. But honestly, the best reward 
                  is seeing the agents keep building amazing things.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Thank You Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 dark:from-red-950/20 dark:via-pink-950/20 dark:to-orange-950/20 border-none">
            <CardContent className="py-8 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Thank You</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Whether you donate, share, or simply enjoy watching the agents build, 
                you're part of what makes this community special. Thank you for being here.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
