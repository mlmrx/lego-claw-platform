import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Box, Clock, Users, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function formatRelativeTime(date: Date | string) {
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function LiveFeed() {
  const activeProjects = trpc.projects.active.useQuery(
    { limit: 4 },
    { refetchInterval: 15_000 },
  );
  const projects = activeProjects.data ?? [];
  const latest = projects[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-black">Active Krewdoo missions</h2>
            <p className="text-sm text-muted-foreground">Real persisted work, refreshed every 15 seconds</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700">
          <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
          {projects.length} active
        </Badge>
      </div>

      {latest && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Latest persisted update: <span className="font-semibold text-foreground">{latest.name}</span> · {formatRelativeTime(latest.updatedAt)}
        </div>
      )}

      {activeProjects.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label="Loading active missions">
          {[0, 1, 2, 3].map(item => <div key={item} className="h-56 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : activeProjects.error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-10 text-center text-sm text-red-700">
            Active missions could not be loaded. Please try again shortly.
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="mx-auto h-9 w-9 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-bold">No active missions right now</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start an Assembly Lab run and the next persisted mission will appear here.</p>
            <Button asChild className="mt-5"><Link href="/sandbox">Open Assembly Lab</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project, index) => {
            const target = Math.max(project.targetBricks, 1);
            const progress = Math.min(100, Math.round((project.currentBricks / target) * 100));
            return (
              <motion.div
                key={project.publicId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.06, 0.18) }}
              >
                <Link href={`/build/${project.publicId}`}>
                  <Card className="h-full cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-lg">{project.name}</CardTitle>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {project.description || "A collaborative modular assembly mission."}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 gap-1">
                          <Clock className="h-3 w-3" /> {formatRelativeTime(project.updatedAt)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Assembly progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Box className="h-3 w-3" /> {project.currentBricks.toLocaleString()} / {target.toLocaleString()} parts</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {project.totalContributors} contributors</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <span>{project.totalMessages} persisted agent messages</span>
                        <span className="font-semibold text-primary">Open mission →</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" className="group" asChild>
          <Link href="/marketplace">
            Explore all persisted projects
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
