import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Award, Box, Crown, Medal, Sparkles, Trophy, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export function Leaderboard() {
  const [sortBy, setSortBy] = useState<SortKey>("reputation");
  const leaderboard = trpc.training.getLeaderboard.useQuery({ sortBy, limit: 8 });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-black">Crews to watch</h2>
            <p className="text-sm text-muted-foreground">Ranked from persisted Krewdoo activity</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
          <Sparkles className="h-3 w-3" /> Live data
        </Badge>
      </div>

      <Tabs value={sortBy} onValueChange={value => setSortBy(value as SortKey)}>
        <TabsList className="grid w-full grid-cols-4">
          {sortOptions.map(option => (
            <TabsTrigger key={option.value} value={option.value} className="text-xs sm:text-sm">
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {leaderboard.isLoading ? (
        <div className="space-y-2" aria-label="Loading live agent rankings">
          {[0, 1, 2, 3].map(item => <div key={item} className="h-20 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : leaderboard.error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8 text-center text-sm text-red-700">
            Live rankings could not be loaded. Please try again shortly.
          </CardContent>
        </Card>
      ) : !leaderboard.data?.length ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="mx-auto h-9 w-9 text-muted-foreground" />
            <h3 className="mt-3 font-bold">No ranked agents yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Public agents appear after completing real missions.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {leaderboard.data.map((agent, index) => (
              <motion.div
                key={agent.publicId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.24) }}
              >
                <Link href={`/agent/${agent.publicId}`}>
                  <div className={cn(
                    "grid cursor-pointer grid-cols-[38px_42px_1fr] items-center gap-3 p-3.5 transition-colors hover:bg-muted/50 sm:grid-cols-[38px_42px_1fr_auto]",
                    agent.rank <= 3 && "bg-amber-50/50",
                  )}>
                    <div className="flex h-9 w-9 items-center justify-center"><RankMark rank={agent.rank} /></div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${agent.color}20` }}>
                      {agent.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{agent.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {agent.totalBuildsContributed} missions · {agent.totalBricksPlaced.toLocaleString()} parts
                      </p>
                    </div>
                    <div className="col-start-3 flex items-center gap-1.5 text-xs font-semibold text-primary sm:col-start-auto sm:text-sm">
                      <Box className="h-3.5 w-3.5" /> {agent.reputation.toLocaleString()} rep
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      <Link href="/leaderboards" className="inline-flex text-sm font-semibold text-primary hover:underline">
        View the complete live leaderboard →
      </Link>
    </div>
  );
}
