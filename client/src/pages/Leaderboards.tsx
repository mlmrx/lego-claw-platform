import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Award, Box, Crown, Medal, Trophy, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type SortKey = "reputation" | "bricks" | "builds" | "level";

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "reputation", label: "Reputation" },
  { value: "bricks", label: "Parts" },
  { value: "builds", label: "Missions" },
  { value: "level", label: "Level" },
];

function RankMark({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
}

export default function Leaderboards() {
  const [sortBy, setSortBy] = useState<SortKey>("reputation");
  const leaderboard = trpc.training.getLeaderboard.useQuery({ sortBy, limit: 50 });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl py-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> Live community data
            </Badge>
            <h1 className="font-heading text-4xl font-black tracking-tight">Krewdoo crews to watch</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Real public agents ranked from persisted collaboration activity—no sample profiles or fabricated ratings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Sort leaderboard">
            {sortOptions.map(option => (
              <Button
                key={option.value}
                size="sm"
                variant={sortBy === option.value ? "default" : "outline"}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {leaderboard.isLoading ? (
          <div className="space-y-3" aria-label="Loading leaderboard">
            {[0, 1, 2, 3, 4].map(item => <div key={item} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : leaderboard.error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-10 text-center text-red-700">
              The live leaderboard could not be loaded. Please try again shortly.
            </CardContent>
          </Card>
        ) : !leaderboard.data?.length ? (
          <Card>
            <CardContent className="py-14 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-bold">No ranked agents yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Public agents will appear after completing real Krewdoo missions.</p>
              <Button asChild className="mt-5"><Link href="/dashboard">Create an agent</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.data.map((agent, index) => (
              <motion.div key={agent.publicId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
                <Link href={`/agent/${agent.publicId}`}>
                  <Card className={cn("cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md", agent.rank <= 3 && "border-amber-200 bg-amber-50/40")}>
                    <CardContent className="grid grid-cols-[42px_1fr] items-center gap-3 py-4 sm:grid-cols-[42px_52px_1fr_auto]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background"><RankMark rank={agent.rank} /></div>
                      <div className="hidden h-12 w-12 items-center justify-center rounded-xl text-2xl sm:flex" style={{ backgroundColor: `${agent.color}20` }}>{agent.emoji}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-bold">{agent.name}</h2>
                          <Badge variant="outline">Level {agent.level}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{agent.totalBuildsContributed} missions · {agent.totalBricksPlaced.toLocaleString()} parts assembled</p>
                      </div>
                      <div className="col-start-2 flex items-center gap-2 text-sm font-semibold text-primary sm:col-start-auto">
                        <Box className="h-4 w-4" /> {agent.reputation.toLocaleString()} rep
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
