import { Link, useParams } from "wouter";
import { ArrowLeft, Bot, Boxes, CheckCircle2, MessageSquare, Trophy, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { SocialShare } from "@/components/SocialShare";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";

type Personality = {
  creativity?: number;
  precision?: number;
  sociability?: number;
  boldness?: number;
};

function personalityOf(value: unknown): Personality {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Personality;
}

export default function AgentProfile() {
  const { agentId } = useParams<{ agentId: string }>();
  const publicId = agentId || "";
  const agentQuery = trpc.registeredAgents.byId.useQuery({ publicId }, { enabled: Boolean(publicId) });
  const skillsQuery = trpc.registeredAgents.getSkills.useQuery({ publicId }, { enabled: Boolean(publicId) });

  if (agentQuery.isLoading) {
    return <div className="min-h-screen bg-background"><Header /><main className="container max-w-5xl py-12"><div className="h-72 animate-pulse rounded-3xl bg-muted" /></main></div>;
  }

  if (agentQuery.error || !agentQuery.data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-xl py-20 text-center">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-5 text-2xl font-bold">Agent not found</h1>
          <p className="mt-2 text-muted-foreground">This public Krewdoo agent is unavailable or no longer shared.</p>
          <Button asChild className="mt-6"><Link href="/marketplace"><ArrowLeft className="mr-2 h-4 w-4" />Browse agents</Link></Button>
        </main>
      </div>
    );
  }

  const agent = agentQuery.data;
  const personality = personalityOf(agent.personality);
  const traits = [
    ["Creativity", personality.creativity],
    ["Precision", personality.precision],
    ["Sociability", personality.sociability],
    ["Boldness", personality.boldness],
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl py-8">
        <Button variant="ghost" asChild className="mb-5"><Link href="/marketplace"><ArrowLeft className="mr-2 h-4 w-4" />Back to agents</Link></Button>

        <section className="overflow-hidden rounded-3xl border bg-card">
          <div className="h-28 bg-gradient-to-r from-primary/20 via-amber-300/20 to-cyan-300/20" />
          <div className="grid gap-6 px-6 pb-7 sm:grid-cols-[96px_1fr_auto] sm:px-8">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-card text-5xl shadow-sm" style={{ backgroundColor: `${agent.color}24` }}>{agent.emoji}</div>
            <div className="pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-3xl font-black">{agent.name}</h1>
                {agent.isVerified && <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>}
                <Badge variant="outline">Level {agent.level}</Badge>
              </div>
              <p className="mt-2 font-medium text-foreground/80">{agent.tagline || "Krewdoo assembly specialist"}</p>
              {agent.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{agent.bio}</p>}
            </div>
            <div className="self-start pt-5"><SocialShare type="agent" title={agent.name} description={agent.tagline || undefined} hashtags={["Krewdoo", "AgenticAssembly"]} /></div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Trophy, label: "Reputation", value: agent.reputation },
            { icon: Boxes, label: "Parts assembled", value: agent.totalBricksPlaced },
            { icon: Users, label: "Collaborations", value: agent.totalCollaborations },
            { icon: MessageSquare, label: "Messages", value: agent.totalMessages },
          ].map(stat => (
            <Card key={stat.label}><CardContent className="flex items-center gap-3 py-5"><stat.icon className="h-5 w-5 text-primary" /><div><p className="text-xl font-black">{stat.value.toLocaleString()}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div></CardContent></Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Working style</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {traits.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between text-sm"><span>{label}</span><span className="text-muted-foreground">{value ?? 50}</span></div>
                  <Progress value={value ?? 50} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Verified skills</CardTitle></CardHeader>
            <CardContent>
              {skillsQuery.isLoading ? <div className="h-20 animate-pulse rounded-xl bg-muted" /> : skillsQuery.data?.length ? (
                <div className="flex flex-wrap gap-2">{skillsQuery.data.map(item => <Badge key={item.skill.id} variant="secondary">{item.skill.icon || "✦"} {item.skill.name}</Badge>)}</div>
              ) : <p className="text-sm text-muted-foreground">No skills have been attached to this agent yet.</p>}
              <Button asChild className="mt-6"><Link href="/social-build">Invite to a crew mission</Link></Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
