import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  Eye,
  GitBranch,
  Layers3,
  MousePointerClick,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { Link } from "wouter";

const stages = [
  {
    icon: Eye,
    label: "Discover",
    tools: "list_scenarios · list_agent_presets",
    copy: "The browser agent learns the site's real capabilities instead of guessing at buttons.",
  },
  {
    icon: Users,
    label: "Configure",
    tools: "configure_mission · preview_mission",
    copy: "It selects a complementary specialist crew and a bounded mission that the human can review.",
  },
  {
    icon: Play,
    label: "Execute",
    tools: "run_next_turn · run_simulation",
    copy: "Each agent decision becomes a visible message, metric update, and change to the shared 3D artifact.",
  },
  {
    icon: GitBranch,
    label: "Understand",
    tools: "inspect_collaboration · analyze_collaboration",
    copy: "The browser agent explains the crew's emergent collaboration pattern and proposes a better next run.",
  },
];

const safeguards = [
  "Two-to-four agents and four-to-twelve turns per mission",
  "Read-only and mutating tools are annotated accurately",
  "Model-generated output is marked as untrusted content",
  "Tool registration is same-origin and removed on page teardown",
  "Long-running handlers receive the browser cancellation signal",
  "Every configuration, turn, and artifact change stays visible",
];

export default function WebMCPShowcase() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fbfaf6]/90 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/webmcp" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Workflow className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold leading-none">Krewdoo</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Assembly Lab · WebMCP
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href="#architecture">
                Architecture
              </a>
            </Button>
            <Button size="sm" asChild className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Link href="/sandbox">
                Launch lab <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.13),transparent_27%),radial-gradient(circle_at_82%_30%,rgba(6,182,212,0.12),transparent_25%)]" />
        <div className="container relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5 bg-violet-600 text-white hover:bg-violet-600">
                <Sparkles className="h-3.5 w-3.5" /> WebMCP-native
              </Badge>
              <Badge variant="outline" className="gap-1.5 bg-white/60">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Human in the loop
              </Badge>
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              One browser agent.
              <span className="block text-violet-600">A whole creative crew.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Krewdoo is an agentic assembly protocol made tangible through Assembly Lab. A browser
              agent discovers specialists, assigns a bounded mission, watches them negotiate over a
              shared artifact, and explains the collaboration pattern behind the visible result.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="gap-2 bg-violet-600 px-7 hover:bg-violet-700">
                <Link href="/sandbox">
                  Run the 60-second demo <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 bg-white/70">
                <a href="#architecture">
                  <Braces className="h-5 w-5" /> See the tool chain
                </a>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-violet-300/20 blur-3xl" />
            <Card className="relative overflow-hidden border-white/80 bg-white/85 shadow-2xl shadow-violet-950/10 backdrop-blur">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-3 text-white">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Bot className="h-4 w-4 text-cyan-300" /> Browser-agent request
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                    9 tools available
                  </span>
                </div>
                <div className="space-y-5 p-6">
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 font-mono text-sm leading-relaxed text-violet-950">
                    “Choose the bridge challenge, pair an architect with a diplomat, run four
                    observable turns, then explain whether they collaborated well.”
                  </div>
                  <div className="space-y-3">
                    {[
                      ["list_scenarios", "Bridge Engineering selected"],
                      ["configure_mission", "3-agent crew prepared"],
                      ["run_next_turn × 4", "8 pieces assembled visibly"],
                      ["analyze_collaboration", "Cooperative leader–specialist pattern"],
                    ].map(([tool, result], index) => (
                      <div key={tool} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-slate-900">{tool}</p>
                          <p className="text-xs text-slate-500">{result}</p>
                        </div>
                        <span className="ml-auto text-[10px] font-semibold text-slate-400">0{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="architecture" className="border-b border-slate-200 py-16 lg:py-20">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-600">The protocol</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Not another chatbot. A structured collaboration loop.
            </h2>
            <p className="mt-4 text-slate-600">
              Krewdoo uses WebMCP to turn a complex sequence of UI guesses into a typed, observable
              workflow that the person and browser agent can operate together—and later reuse across
              other modular creative domains.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stages.map((stage, index) => (
              <Card key={stage.label} className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <stage.icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{stage.label}</h3>
                  <p className="mt-2 font-mono text-[11px] leading-relaxed text-violet-700">{stage.tools}</p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{stage.copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-950 py-16 text-white lg:py-20">
        <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Badge className="bg-cyan-300 text-slate-950 hover:bg-cyan-300">Designed for trust</Badge>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Useful autonomy without invisible automation.
            </h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              A mission can be advanced one turn at a time. The human sees which specialist acted,
              what changed, why it changed, and how the shared artifact evolved before the next step.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {safeguards.map(item => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <p className="text-sm leading-relaxed text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-br from-violet-100 via-white to-cyan-100 p-8 text-center shadow-xl shadow-violet-950/5 sm:p-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg">
              <Layers3 className="h-7 w-7" />
            </span>
            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
              Watch a browser agent assemble intelligence, not just click a page.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Load the prepared bridge mission, run four observable turns, and inspect the live 3D
              result plus collaboration analysis in about one minute.
            </p>
            <Button size="lg" asChild className="mt-8 gap-2 bg-violet-600 px-8 hover:bg-violet-700">
              <Link href="/sandbox">
                <MousePointerClick className="h-5 w-5" /> Launch the judge demo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
