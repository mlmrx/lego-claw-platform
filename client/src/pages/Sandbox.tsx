/**
 * Agent Training Sandbox Page
 * Direction 4: Developer-facing playground for testing multi-agent collaboration patterns.
 * Configure agent personalities, choose scenarios, run simulations, and analyze results.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { LegoBrick3D, UNIT, PLATE_HEIGHT, BRICK_HEIGHT } from "@/components/LegoBrick3D";
import ShapeBrick3D from "@/components/ShapeBrick3D";
import type { BrickShape } from "@/lib/brickCatalog";
import { useWebMCPTools } from "@/hooks/useWebMCPTools";
import { usePieceWorld } from "@/contexts/PieceWorldContext";
import { resolvePieceMaterial } from "@/lib/pieceWorlds";
import {
  createAssemblyTools,
  type AssemblyToolActions,
  type MissionConfigurationInput,
  type RunSimulationInput,
} from "@/lib/webmcp/assemblyTools";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

import {
  FlaskConical,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Settings2,
  Users2,
  Zap,
  Brain,
  Target,
  MessageSquare,
  Blocks,
  BarChart3,
  ArrowLeft,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Bot,
  PlugZap,
  ShieldCheck,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  personality: {
    creativity: number;
    precision: number;
    sociability: number;
    boldness: number;
  };
  strategy: "cooperative" | "competitive" | "independent" | "leader" | "follower";
  specialization: string;
}

interface SimulationTurn {
  turnNumber: number;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  action: string;
  message: string;
  reasoning: string;
  bricks?: Array<{
    position: [number, number, number];
    color: string;
    width: number;
    depth: number;
    height: number;
    shape: string;
  }>;
  metrics: {
    cooperationScore: number;
    buildQuality: number;
    communicationClarity: number;
  };
  timestamp: number;
}

interface SimulationResult {
  id: string;
  scenario: string;
  agents: AgentConfig[];
  turns: SimulationTurn[];
  summary: {
    totalTurns: number;
    totalBricksPlaced: number;
    avgCooperation: number;
    avgBuildQuality: number;
    avgCommunication: number;
    conflicts: number;
    resolutions: number;
    dominantAgent: string;
    mostCooperative: string;
    buildDescription: string;
  };
}

interface AnalysisResult {
  overallGrade: string;
  collaborationPattern: string;
  keyInsights: string[];
  agentAnalysis: Array<{
    name: string;
    effectiveness: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  emergentBehaviors: string[];
  recommendations: string[];
  patternClassification: string;
}

// ============================================
// CONSTANTS
// ============================================

const STRATEGY_OPTIONS: { value: AgentConfig["strategy"]; label: string; icon: string }[] = [
  { value: "cooperative", label: "Cooperative", icon: "🤝" },
  { value: "competitive", label: "Competitive", icon: "⚔️" },
  { value: "independent", label: "Independent", icon: "🎯" },
  { value: "leader", label: "Leader", icon: "👑" },
  { value: "follower", label: "Follower", icon: "🐾" },
];

const ACTION_COLORS: Record<string, string> = {
  speak: "bg-blue-100 text-blue-700 border-blue-200",
  place: "bg-green-100 text-green-700 border-green-200",
  remove: "bg-red-100 text-red-700 border-red-200",
  suggest: "bg-purple-100 text-purple-700 border-purple-200",
  agree: "bg-emerald-100 text-emerald-700 border-emerald-200",
  disagree: "bg-orange-100 text-orange-700 border-orange-200",
  negotiate: "bg-amber-100 text-amber-700 border-amber-200",
};

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-600 bg-green-50 border-green-200",
  B: "text-blue-600 bg-blue-50 border-blue-200",
  C: "text-yellow-600 bg-yellow-50 border-yellow-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
  F: "text-red-600 bg-red-50 border-red-200",
};

// ============================================
// SUB-COMPONENTS
// ============================================

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function PersonalitySlider({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={100}
        step={5}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function SimulationBrickViewer({ turns }: { turns: SimulationTurn[] }) {
  const { worldId, world } = usePieceWorld();
  const baseplateStyle = resolvePieceMaterial(worldId, world.scene.baseplate);
  const allBricks = useMemo(() => {
    const bricks: Array<{
      position: [number, number, number];
      color: string;
      width: number;
      depth: number;
      height: number;
      shape: string;
      id: string;
    }> = [];
    turns.forEach((turn, ti) => {
      if (turn.bricks && turn.action === "place") {
        turn.bricks.forEach((brick, bi) => {
          bricks.push({ ...brick, id: `${ti}-${bi}` });
        });
      }
    });
    return bricks;
  }, [turns]);

  return (
    <div
      className="w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-border transition-colors duration-300"
      style={{ background: `linear-gradient(180deg, ${world.scene.background}, ${world.scene.baseplate})` }}
    >
      <Canvas
        camera={{ position: [12, 10, 12], fov: 45 }}
        shadows
      >
        <ambientLight intensity={world.edgeStyle === "neon" ? 0.3 : 0.6} color={world.edgeStyle === "neon" ? "#93C5FD" : "#FFFFFF"} />
        <directionalLight position={[8, 12, 5]} intensity={0.8} castShadow />
        <pointLight position={[-5, 8, -5]} intensity={0.3} />

        {/* Baseplate */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[16, 0.3, 16]} />
          <meshPhysicalMaterial
            color={baseplateStyle.color}
            roughness={baseplateStyle.roughness}
            metalness={baseplateStyle.metalness}
            transparent={baseplateStyle.transparent}
            opacity={baseplateStyle.opacity}
            transmission={baseplateStyle.transmission}
            clearcoat={baseplateStyle.clearcoat}
          />
        </mesh>

        {/* Grid lines on baseplate */}
        <gridHelper args={[16, 16, world.scene.grid, world.scene.grid]} position={[0, 0.16, 0]} />

        {/* Placed bricks */}
        {allBricks.map((brick) => {
          if (brick.shape && brick.shape !== "standard") {
            return (
              <ShapeBrick3D
                key={brick.id}
                position={brick.position}
                color={brick.color}
                width={brick.width}
                depth={brick.depth}
                height={brick.height}
                shape={brick.shape as BrickShape}
              />
            );
          }
          return (
            <LegoBrick3D
              key={brick.id}
              position={brick.position}
              color={brick.color}
              width={brick.width}
              depth={brick.depth}
              height={brick.height}
            />
          );
        })}

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      {/* Brick count overlay */}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
        <Blocks className="w-3 h-3 inline mr-1" />
        {allBricks.length} bricks
      </div>
    </div>
  );
}

function TurnCard({
  turn,
  showReasoning,
}: {
  turn: SimulationTurn;
  showReasoning: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-3">
        {/* Agent avatar */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${turn.agentId === "architect" ? "#1E88E5" : turn.agentId === "artist" ? "#8E24AA" : turn.agentId === "engineer" ? "#546E7A" : turn.agentId === "diplomat" ? "#00BCD4" : turn.agentId === "maverick" ? "#E53935" : "#43A047"}20` }}
        >
          {turn.agentEmoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{turn.agentName}</span>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0", ACTION_COLORS[turn.action] || "bg-gray-100 text-gray-700")}
            >
              {turn.action}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">
              Turn {turn.turnNumber}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
            {turn.message}
          </p>

          {/* Reasoning (developer view) */}
          {showReasoning && turn.reasoning && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Brain className="w-3 h-3" />
                <span>Internal Reasoning</span>
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 mt-1 border-l-2 border-primary/30 italic">
                      {turn.reasoning}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Metrics mini-bars */}
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users2 className="w-3 h-3" />
              <span>{turn.metrics.cooperationScore}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Target className="w-3 h-3" />
              <span>{turn.metrics.buildQuality}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span>{turn.metrics.communicationClarity}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function Sandbox() {
  // Data queries
  const { data: scenarios } = trpc.sandbox.getScenarios.useQuery();
  const { data: presets } = trpc.sandbox.getPresets.useQuery();

  // Mutations
  const startSimulation = trpc.sandbox.startSimulation.useMutation();
  const runSingleTurn = trpc.sandbox.runSingleTurn.useMutation();
  const analyzeSimulation = trpc.sandbox.analyzeSimulation.useMutation();

  // State
  const [phase, setPhase] = useState<"configure" | "running" | "results">("configure");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [totalTurns, setTotalTurns] = useState(8);
  const [showReasoning, setShowReasoning] = useState(true);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [stepByStep, setStepByStep] = useState(false);
  const [stepTurns, setStepTurns] = useState<SimulationTurn[]>([]);
  const [isRunningStep, setIsRunningStep] = useState(false);
  const [lastWebMCPAction, setLastWebMCPAction] = useState(
    "Waiting for a browser agent",
  );
  const webMCPActionsRef = useRef<AssemblyToolActions | null>(null);

  // Add agent from preset
  const addAgent = useCallback((preset: AgentConfig) => {
    if (agents.length >= 4) return;
    // Give it a unique id suffix if already exists
    const existingIds = agents.map(a => a.id);
    let id = preset.id;
    if (existingIds.includes(id)) {
      id = `${preset.id}-${Date.now()}`;
    }
    setAgents(prev => [...prev, { ...preset, id }]);
  }, [agents]);

  // Remove agent
  const removeAgent = useCallback((id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
  }, []);

  // Update agent personality
  const updateAgentPersonality = useCallback((id: string, key: keyof AgentConfig["personality"], value: number) => {
    setAgents(prev => prev.map(a =>
      a.id === id ? { ...a, personality: { ...a.personality, [key]: value } } : a
    ));
  }, []);

  // Update agent strategy
  const updateAgentStrategy = useCallback((id: string, strategy: AgentConfig["strategy"]) => {
    setAgents(prev => prev.map(a =>
      a.id === id ? { ...a, strategy } : a
    ));
  }, []);

  // Run full simulation
  const handleRunSimulation = useCallback(async () => {
    if (!selectedScenario || agents.length < 2) return;
    setPhase("running");
    setSimulationResult(null);
    setAnalysis(null);

    try {
      const result = await startSimulation.mutateAsync({
        scenarioId: selectedScenario,
        agents,
        totalTurns,
      });
      setSimulationResult(result as SimulationResult);
      setPhase("results");
    } catch (err) {
      console.error("Simulation failed:", err);
      setPhase("configure");
    }
  }, [selectedScenario, agents, totalTurns, startSimulation]);

  // Run step-by-step
  const handleRunNextStep = useCallback(async () => {
    if (!selectedScenario || agents.length < 2 || isRunningStep) return;
    setIsRunningStep(true);

    try {
      const nextAgentIndex = stepTurns.length % agents.length;
      const turn = await runSingleTurn.mutateAsync({
        scenarioId: selectedScenario,
        agents,
        previousTurns: stepTurns,
        nextAgentIndex,
      });
      setStepTurns(prev => [...prev, turn as SimulationTurn]);
    } catch (err) {
      console.error("Step failed:", err);
    } finally {
      setIsRunningStep(false);
    }
  }, [selectedScenario, agents, stepTurns, isRunningStep, runSingleTurn]);

  // Start step-by-step mode
  const handleStartStepByStep = useCallback(() => {
    if (!selectedScenario || agents.length < 2) return;
    setPhase("running");
    setStepByStep(true);
    setStepTurns([]);
    setSimulationResult(null);
    setAnalysis(null);
  }, [selectedScenario, agents]);

  // Finish step-by-step and get analysis
  const handleFinishStepByStep = useCallback(() => {
    if (stepTurns.length === 0) return;
    const summary = {
      totalTurns: stepTurns.length,
      totalBricksPlaced: stepTurns.reduce((sum, t) => sum + (t.bricks?.length || 0), 0),
      avgCooperation: Math.round(stepTurns.reduce((s, t) => s + t.metrics.cooperationScore, 0) / stepTurns.length),
      avgBuildQuality: Math.round(stepTurns.reduce((s, t) => s + t.metrics.buildQuality, 0) / stepTurns.length),
      avgCommunication: Math.round(stepTurns.reduce((s, t) => s + t.metrics.communicationClarity, 0) / stepTurns.length),
      conflicts: stepTurns.filter(t => t.action === "disagree").length,
      resolutions: stepTurns.filter(t => t.action === "negotiate" || t.action === "agree").length,
      dominantAgent: agents[0]?.name || "",
      mostCooperative: agents[0]?.name || "",
      buildDescription: `Step-by-step build with ${stepTurns.length} turns.`,
    };
    setSimulationResult({
      id: `step-${Date.now()}`,
      scenario: scenarios?.find(s => s.id === selectedScenario)?.name || "",
      agents,
      turns: stepTurns,
      summary,
    });
    setPhase("results");
    setStepByStep(false);
  }, [stepTurns, agents, scenarios, selectedScenario]);

  // Run analysis
  const handleAnalyze = useCallback(async () => {
    if (!simulationResult) return;
    try {
      const result = await analyzeSimulation.mutateAsync({
        scenario: simulationResult.scenario,
        agents: simulationResult.agents.map(a => ({
          name: a.name,
          personality: a.personality,
          strategy: a.strategy,
        })),
        turns: simulationResult.turns.map(t => ({
          agentName: t.agentName,
          action: t.action,
          message: t.message,
          reasoning: t.reasoning,
          metrics: t.metrics,
        })),
      });
      setAnalysis(result as AnalysisResult);
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  }, [simulationResult, analyzeSimulation]);

  // Reset everything
  const handleReset = useCallback(() => {
    setPhase("configure");
    setSimulationResult(null);
    setAnalysis(null);
    setStepByStep(false);
    setStepTurns([]);
  }, []);

  const handleLoadDemoMission = useCallback(() => {
    if (!scenarios || !presets) return;
    const demoAgents = ["architect", "diplomat", "engineer"]
      .map(id => presets.find(preset => preset.id === id))
      .filter((agent): agent is AgentConfig => Boolean(agent));
    setSelectedScenario("bridge-engineering");
    setAgents(demoAgents.map(agent => ({ ...agent })));
    setTotalTurns(4);
    setPhase("configure");
    setSimulationResult(null);
    setAnalysis(null);
    setStepByStep(false);
    setStepTurns([]);
    setLastWebMCPAction("Demo mission loaded — ready for a browser agent");
  }, [presets, scenarios]);

  const resetMissionFromAgent = useCallback(() => {
    setSelectedScenario(null);
    setAgents([]);
    setTotalTurns(8);
    setPhase("configure");
    setSimulationResult(null);
    setAnalysis(null);
    setStepByStep(false);
    setStepTurns([]);
    setLastWebMCPAction("Mission reset by browser agent");
    return { ok: true, state: "configure", message: "Mission cleared." };
  }, []);

  webMCPActionsRef.current = {
    listScenarios: () => {
      setLastWebMCPAction("Browser agent inspected scenarios");
      return {
        status: scenarios ? "ready" : "loading",
        scenarios: (scenarios ?? []).map(scenario => ({
          id: scenario.id,
          name: scenario.name,
          difficulty: scenario.difficulty,
          category: scenario.category,
          constraints: scenario.constraints,
        })),
      };
    },
    listAgentPresets: () => {
      setLastWebMCPAction("Browser agent inspected specialist agents");
      return {
        status: presets ? "ready" : "loading",
        agents: (presets ?? []).map(preset => ({
          id: preset.id,
          name: preset.name,
          specialization: preset.specialization,
          strategy: preset.strategy,
          personality: preset.personality,
        })),
      };
    },
    configureMission: (input: MissionConfigurationInput) => {
      if (!scenarios || !presets) {
        throw new Error("Assembly Lab is still loading. Retry in a moment.");
      }
      const scenario = scenarios.find(item => item.id === input.scenario_id);
      if (!scenario) {
        throw new Error(
          `Unknown scenario_id: ${input.scenario_id}. Call list_scenarios first.`,
        );
      }
      const uniqueAgentIds = [...new Set(input.agent_ids)];
      const selectedAgents = uniqueAgentIds
        .map(id => presets.find(preset => preset.id === id))
        .filter((agent): agent is AgentConfig => Boolean(agent));
      if (selectedAgents.length !== uniqueAgentIds.length) {
        throw new Error(
          "One or more agent IDs are invalid. Call list_agent_presets first.",
        );
      }
      if (selectedAgents.length < 2 || selectedAgents.length > 4) {
        throw new Error("Choose between two and four specialist agents.");
      }

      const boundedTurns = Math.max(4, Math.min(12, input.total_turns));
      setSelectedScenario(scenario.id);
      setAgents(selectedAgents.map(agent => ({ ...agent })));
      setTotalTurns(boundedTurns);
      setPhase("configure");
      setSimulationResult(null);
      setAnalysis(null);
      setStepByStep(input.mode !== "full_run");
      setStepTurns([]);
      setLastWebMCPAction(
        `Mission configured: ${scenario.name} with ${selectedAgents.length} agents`,
      );
      return {
        ok: true,
        scenario: scenario.name,
        crew: selectedAgents.map(agent => agent.name),
        total_turns: boundedTurns,
        mode: input.mode ?? "step_by_step",
        next: input.mode === "full_run" ? "run_simulation" : "run_next_turn",
      };
    },
    previewMission: () => {
      const scenario = scenarios?.find(item => item.id === selectedScenario);
      setLastWebMCPAction("Browser agent previewed the mission");
      return {
        configured: Boolean(scenario && agents.length >= 2),
        scenario: scenario
          ? { id: scenario.id, name: scenario.name, constraints: scenario.constraints }
          : null,
        crew: agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          specialization: agent.specialization,
          strategy: agent.strategy,
        })),
        total_turns: totalTurns,
        phase,
        completed_turns: stepByStep
          ? stepTurns.length
          : simulationResult?.turns.length ?? 0,
      };
    },
    runNextTurn: async signal => {
      if (!selectedScenario || agents.length < 2) {
        throw new Error("Configure a scenario and at least two agents first.");
      }
      if (stepTurns.length >= totalTurns) {
        return {
          ok: true,
          complete: true,
          message: "The configured turn budget is already complete.",
        };
      }
      signal.throwIfAborted();
      setPhase("running");
      setStepByStep(true);
      setIsRunningStep(true);
      setLastWebMCPAction(`Running turn ${stepTurns.length + 1}`);
      try {
        const turn = (await runSingleTurn.mutateAsync({
          scenarioId: selectedScenario,
          agents,
          previousTurns: stepTurns,
          nextAgentIndex: stepTurns.length % agents.length,
        })) as SimulationTurn;
        signal.throwIfAborted();
        setStepTurns(previous => [...previous, turn]);
        setLastWebMCPAction(
          `Turn ${turn.turnNumber}: ${turn.agentName} chose ${turn.action}`,
        );
        return {
          ok: true,
          complete: turn.turnNumber >= totalTurns,
          turn: {
            number: turn.turnNumber,
            agent: turn.agentName,
            action: turn.action,
            message: turn.message.slice(0, 360),
            bricks_added: turn.bricks?.length ?? 0,
            metrics: turn.metrics,
          },
        };
      } finally {
        setIsRunningStep(false);
      }
    },
    runSimulation: async (input: RunSimulationInput, signal: AbortSignal) => {
      if (!selectedScenario || agents.length < 2) {
        throw new Error("Configure a scenario and at least two agents first.");
      }
      const turnBudget = Math.max(
        4,
        Math.min(12, input.total_turns ?? totalTurns),
      );
      signal.throwIfAborted();
      setTotalTurns(turnBudget);
      setPhase("running");
      setStepByStep(false);
      setSimulationResult(null);
      setAnalysis(null);
      setLastWebMCPAction(`Running ${turnBudget}-turn mission`);
      const result = (await startSimulation.mutateAsync({
        scenarioId: selectedScenario,
        agents,
        totalTurns: turnBudget,
      })) as SimulationResult;
      signal.throwIfAborted();
      setSimulationResult(result);
      setPhase("results");
      setLastWebMCPAction(
        `Mission complete: ${result.summary.totalBricksPlaced} bricks assembled`,
      );
      return {
        ok: true,
        mission_id: result.id,
        scenario: result.scenario,
        summary: result.summary,
      };
    },
    inspectCollaboration: () => {
      const turns = stepByStep ? stepTurns : simulationResult?.turns ?? [];
      const latest = turns.at(-1);
      const average = (selector: (turn: SimulationTurn) => number) =>
        turns.length
          ? Math.round(turns.reduce((sum, turn) => sum + selector(turn), 0) / turns.length)
          : 0;
      const payload = {
        phase,
        completed_turns: turns.length,
        turn_budget: totalTurns,
        bricks: turns.reduce((sum, turn) => sum + (turn.bricks?.length ?? 0), 0),
        conflicts: turns.filter(turn => turn.action === "disagree").length,
        resolutions: turns.filter(turn =>
          turn.action === "agree" || turn.action === "negotiate",
        ).length,
        averages: {
          cooperation: average(turn => turn.metrics.cooperationScore),
          build_quality: average(turn => turn.metrics.buildQuality),
          communication: average(turn => turn.metrics.communicationClarity),
        },
        latest_action: latest
          ? {
              agent: latest.agentName,
              action: latest.action,
              message: latest.message.slice(0, 360),
            }
          : null,
      };
      setLastWebMCPAction("Browser agent inspected collaboration progress");
      return payload;
    },
    analyzeCollaboration: async signal => {
      const result = simulationResult;
      const turns = result?.turns ?? stepTurns;
      if (turns.length === 0) {
        throw new Error("Run at least one collaboration turn before analysis.");
      }
      const scenarioName =
        result?.scenario ??
        scenarios?.find(item => item.id === selectedScenario)?.name ??
        "Assembly mission";
      signal.throwIfAborted();
      setLastWebMCPAction("Analyzing collaboration patterns");
      const analysisResult = (await analyzeSimulation.mutateAsync({
        scenario: scenarioName,
        agents: agents.map(agent => ({
          name: agent.name,
          personality: agent.personality,
          strategy: agent.strategy,
        })),
        turns: turns.map(turn => ({
          agentName: turn.agentName,
          action: turn.action,
          message: turn.message,
          reasoning: turn.reasoning,
          metrics: turn.metrics,
        })),
      })) as AnalysisResult;
      signal.throwIfAborted();
      setAnalysis(analysisResult);
      setLastWebMCPAction(
        `Analysis ready: ${analysisResult.collaborationPattern}`,
      );
      return {
        ok: true,
        grade: analysisResult.overallGrade,
        pattern: analysisResult.collaborationPattern,
        classification: analysisResult.patternClassification,
        insights: analysisResult.keyInsights.slice(0, 5),
        recommendations: analysisResult.recommendations.slice(0, 4),
      };
    },
    resetMission: resetMissionFromAgent,
  };

  const assemblyTools = useMemo(
    () =>
      createAssemblyTools({
        listScenarios: () => webMCPActionsRef.current?.listScenarios(),
        listAgentPresets: () => webMCPActionsRef.current?.listAgentPresets(),
        configureMission: input => {
          if (!webMCPActionsRef.current) throw new Error("Assembly Lab is not ready.");
          return webMCPActionsRef.current.configureMission(input);
        },
        previewMission: () => webMCPActionsRef.current?.previewMission(),
        runNextTurn: signal => {
          if (!webMCPActionsRef.current) return Promise.reject(new Error("Assembly Lab is not ready."));
          return webMCPActionsRef.current.runNextTurn(signal);
        },
        runSimulation: (input, signal) => {
          if (!webMCPActionsRef.current) return Promise.reject(new Error("Assembly Lab is not ready."));
          return webMCPActionsRef.current.runSimulation(input, signal);
        },
        inspectCollaboration: () =>
          webMCPActionsRef.current?.inspectCollaboration(),
        analyzeCollaboration: signal => {
          if (!webMCPActionsRef.current) return Promise.reject(new Error("Assembly Lab is not ready."));
          return webMCPActionsRef.current.analyzeCollaboration(signal);
        },
        resetMission: () => webMCPActionsRef.current?.resetMission(),
      }),
    [],
  );
  const webMCP = useWebMCPTools(assemblyTools);

  const currentTurns = stepByStep ? stepTurns : (simulationResult?.turns || []);
  const currentScenario = scenarios?.find(s => s.id === selectedScenario);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm">Assembly Lab</h1>
                <p className="text-[10px] text-muted-foreground">Human-guided agent orchestration</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setShowReasoning(!showReasoning)}
            >
              {showReasoning ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span className="hidden sm:inline">Dev View</span>
            </Button>
            {phase !== "configure" && (
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleReset}>
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* ============================================ */}
        {/* CONFIGURE PHASE */}
        {/* ============================================ */}
        {phase === "configure" && (
          <div className="space-y-6">
            <Card className="overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50 via-background to-cyan-50">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="gap-1.5 bg-violet-600 text-white hover:bg-violet-600">
                        <Bot className="h-3 w-3" />
                        WebMCP-native
                      </Badge>
                      <Badge variant="outline" className="gap-1.5 bg-white/70">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Human in the loop
                      </Badge>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold md:text-2xl">
                        Let your browser agent assemble an AI crew
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Your agent can discover scenarios, configure specialist teammates,
                        advance their collaboration one turn at a time, inspect the visible
                        3D result, and explain how the crew worked together.
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-200/70 bg-white/75 px-4 py-3 font-mono text-xs leading-relaxed text-violet-950">
                      “Choose a bridge challenge, pair an architect with a diplomat,
                      run four observable turns, then explain whether they collaborated well.”
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="gap-2 bg-violet-600 hover:bg-violet-700"
                        onClick={handleLoadDemoMission}
                        disabled={!scenarios || !presets}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Load judge demo
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Prepares a four-turn bridge mission; nothing runs until you or your agent starts it.
                      </span>
                    </div>
                  </div>

                  <div className="min-w-[230px] rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          webMCP.status === "ready"
                            ? "bg-emerald-100 text-emerald-700"
                            : webMCP.status === "unsupported"
                              ? "bg-amber-100 text-amber-700"
                              : webMCP.status === "error"
                                ? "bg-red-100 text-red-700"
                                : "bg-violet-100 text-violet-700",
                        )}
                      >
                        <PlugZap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" aria-live="polite">
                          {webMCP.status === "ready"
                            ? `${webMCP.registeredToolCount} tools ready`
                            : webMCP.status === "unsupported"
                              ? "WebMCP browser needed"
                              : webMCP.status === "error"
                                ? "Registration needs attention"
                                : "Registering tools…"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {webMCP.status === "unsupported"
                            ? "Use ChatGPT browser or Chrome 149+"
                            : "Actions stay visible on this page"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg bg-muted/70 px-3 py-2 text-[11px] text-muted-foreground" aria-live="polite">
                      {lastWebMCPAction}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Selection */}
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Choose Scenario
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {scenarios?.map((scenario) => (
                  <motion.div
                    key={scenario.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-all h-full",
                        selectedScenario === scenario.id
                          ? "ring-2 ring-primary border-primary shadow-md"
                          : "hover:shadow-sm"
                      )}
                      onClick={() => setSelectedScenario(scenario.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{scenario.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{scenario.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {scenario.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-[10px]">
                                {scenario.category}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  scenario.difficulty === "beginner" && "border-green-300 text-green-700",
                                  scenario.difficulty === "intermediate" && "border-yellow-300 text-yellow-700",
                                  scenario.difficulty === "advanced" && "border-red-300 text-red-700"
                                )}
                              >
                                {scenario.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Agent Configuration */}
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Users2 className="w-5 h-5 text-primary" />
                Configure Agents
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  ({agents.length}/4 selected)
                </span>
              </h2>

              {/* Preset selection */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Add from presets:</p>
                <div className="flex flex-wrap gap-2">
                  {presets?.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-lg"
                      onClick={() => addAgent(preset)}
                      disabled={agents.length >= 4}
                    >
                      <span>{preset.emoji}</span>
                      <span className="text-xs">{preset.name}</span>
                      <Plus className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selected agents with personality sliders */}
              {agents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => (
                    <Card key={agent.id} className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-red-50 hover:text-red-500"
                        onClick={() => removeAgent(agent.id)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                            style={{ backgroundColor: `${agent.color}20` }}
                          >
                            {agent.emoji}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{agent.name}</h4>
                            <p className="text-[10px] text-muted-foreground">{agent.specialization}</p>
                          </div>
                        </div>

                        {/* Strategy selector */}
                        <div className="mb-3">
                          <label className="text-xs text-muted-foreground mb-1 block">Strategy</label>
                          <div className="flex flex-wrap gap-1">
                            {STRATEGY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                                  agent.strategy === opt.value
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted border-border hover:border-primary/50"
                                )}
                                onClick={() => updateAgentStrategy(agent.id, opt.value)}
                              >
                                {opt.icon} {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Personality sliders */}
                        <div className="space-y-3">
                          <PersonalitySlider
                            label="Creativity"
                            value={agent.personality.creativity}
                            onChange={(v) => updateAgentPersonality(agent.id, "creativity", v)}
                            lowLabel="Conservative"
                            highLabel="Experimental"
                          />
                          <PersonalitySlider
                            label="Precision"
                            value={agent.personality.precision}
                            onChange={(v) => updateAgentPersonality(agent.id, "precision", v)}
                            lowLabel="Relaxed"
                            highLabel="Meticulous"
                          />
                          <PersonalitySlider
                            label="Sociability"
                            value={agent.personality.sociability}
                            onChange={(v) => updateAgentPersonality(agent.id, "sociability", v)}
                            lowLabel="Quiet"
                            highLabel="Talkative"
                          />
                          <PersonalitySlider
                            label="Boldness"
                            value={agent.personality.boldness}
                            onChange={(v) => updateAgentPersonality(agent.id, "boldness", v)}
                            lowLabel="Deferential"
                            highLabel="Assertive"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {agents.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Users2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Select at least 2 agent presets above to begin
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Simulation Controls */}
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Simulation Settings
              </h2>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Total Turns</label>
                      <p className="text-xs text-muted-foreground">
                        Each agent takes turns in round-robin. More turns = longer simulation.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => setTotalTurns(Math.max(4, totalTurns - 2))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-mono text-lg font-bold w-8 text-center">{totalTurns}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => setTotalTurns(Math.min(20, totalTurns + 2))}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90"
                onClick={handleRunSimulation}
                disabled={!selectedScenario || agents.length < 2 || startSimulation.isPending}
              >
                {startSimulation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Full Simulation ({totalTurns} turns)
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleStartStepByStep}
                disabled={!selectedScenario || agents.length < 2}
              >
                <SkipForward className="w-4 h-4" />
                Step-by-Step Mode
              </Button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* RUNNING PHASE (step-by-step) */}
        {/* ============================================ */}
        {phase === "running" && stepByStep && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Turn timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Step-by-Step Mode
                </h2>
                <Badge variant="secondary">
                  Turn {stepTurns.length} / {totalTurns}
                </Badge>
              </div>

              {/* Scenario info */}
              {currentScenario && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currentScenario.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{currentScenario.name}</p>
                        <p className="text-xs text-muted-foreground">{currentScenario.constraints}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Turn cards */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {stepTurns.map((turn) => (
                  <TurnCard key={turn.turnNumber} turn={turn} showReasoning={showReasoning} />
                ))}
                {stepTurns.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Sparkles className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click "Run Next Turn" to start the simulation
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Step controls */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={handleRunNextStep}
                  disabled={isRunningStep || stepTurns.length >= totalTurns}
                >
                  {isRunningStep ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <SkipForward className="w-4 h-4" />
                      Run Next Turn
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleFinishStepByStep}
                  disabled={stepTurns.length === 0}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finish & Analyze
                </Button>
              </div>
            </div>

            {/* Right: 3D viewer */}
            <div className="relative">
              <SimulationBrickViewer turns={stepTurns} />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* RUNNING PHASE (auto-run loading) */}
        {/* ============================================ */}
        {phase === "running" && !stepByStep && (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6"
            >
              <FlaskConical className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Running Simulation</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {agents.length} agents collaborating on "{currentScenario?.name}"
            </p>
            <p className="text-xs text-muted-foreground">
              This may take 20-60 seconds for {totalTurns} turns...
            </p>
            <Progress value={undefined} className="w-64 mt-4" />
          </div>
        )}

        {/* ============================================ */}
        {/* RESULTS PHASE */}
        {/* ============================================ */}
        {phase === "results" && simulationResult && (
          <div className="space-y-6">
            {/* Summary Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Simulation Results
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {simulationResult.scenario} — {simulationResult.summary.totalTurns} turns completed
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleAnalyze}
                  disabled={analyzeSimulation.isPending}
                >
                  {analyzeSimulation.isPending ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Deep Analysis
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                  New Simulation
                </Button>
              </div>
            </div>

            {/* Metrics Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Blocks className="w-5 h-5 mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-bold">{simulationResult.summary.totalBricksPlaced}</p>
                  <p className="text-[10px] text-muted-foreground">Bricks Placed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users2 className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold">{simulationResult.summary.avgCooperation}%</p>
                  <p className="text-[10px] text-muted-foreground">Cooperation</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                  <p className="text-2xl font-bold">{simulationResult.summary.conflicts}</p>
                  <p className="text-[10px] text-muted-foreground">Conflicts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                  <p className="text-2xl font-bold">{simulationResult.summary.resolutions}</p>
                  <p className="text-[10px] text-muted-foreground">Resolutions</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cooperation Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricBar label="Average" value={simulationResult.summary.avgCooperation} color="bg-blue-500" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Build Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricBar label="Average" value={simulationResult.summary.avgBuildQuality} color="bg-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricBar label="Average" value={simulationResult.summary.avgCommunication} color="bg-purple-500" />
                </CardContent>
              </Card>
            </div>

            {/* Main content: Timeline + 3D */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Turn Timeline */}
              <div>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Turn Timeline
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {simulationResult.turns.map((turn) => (
                    <TurnCard key={turn.turnNumber} turn={turn} showReasoning={showReasoning} />
                  ))}
                </div>
              </div>

              {/* 3D Build Viewer */}
              <div>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Blocks className="w-4 h-4" />
                  Build Result
                </h3>
                <SimulationBrickViewer turns={simulationResult.turns} />
              </div>
            </div>

            {/* Analysis Panel */}
            {analysis && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Deep Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Grade */}
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Overall Grade</p>
                      <div className={cn(
                        "inline-flex items-center justify-center w-14 h-14 rounded-xl text-2xl font-bold border",
                        GRADE_COLORS[analysis.overallGrade] || GRADE_COLORS.C
                      )}>
                        {analysis.overallGrade}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Pattern */}
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Collaboration Pattern</p>
                      <p className="font-bold text-sm capitalize">{analysis.collaborationPattern}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {analysis.patternClassification}
                      </Badge>
                    </CardContent>
                  </Card>
                  {/* Dominant */}
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Most Effective</p>
                      <p className="font-bold text-sm">
                        {analysis.agentAnalysis.sort((a, b) => b.effectiveness - a.effectiveness)[0]?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analysis.agentAnalysis.sort((a, b) => b.effectiveness - a.effectiveness)[0]?.effectiveness}% effective
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Insights */}
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.keyInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Agent Analysis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {analysis.agentAnalysis.map((agent) => (
                    <Card key={agent.name}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{agent.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {agent.effectiveness}%
                          </Badge>
                        </div>
                        <MetricBar label="Effectiveness" value={agent.effectiveness} color="bg-primary" />
                        <div className="mt-2 flex flex-wrap gap-1">
                          {agent.strengths.slice(0, 2).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] text-green-600 border-green-200">
                              {s}
                            </Badge>
                          ))}
                          {agent.weaknesses.slice(0, 1).map((w, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] text-orange-600 border-orange-200">
                              {w}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recommendations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
