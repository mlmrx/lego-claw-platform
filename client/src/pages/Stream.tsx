/**
 * Stream Page
 * A dedicated page optimized for OBS/streaming software capture
 * Access via /stream/:viewToken
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { StreamOverlay } from "@/components/StreamOverlay";
import { Loader2 } from "lucide-react";

// Mock agents for demonstration
const STREAM_AGENTS = [
  { id: "archie", name: "Archie", role: "Structural Expert", avatar: "🏗️", isActive: true },
  { id: "palette", name: "Palette", role: "Color & Aesthetics", avatar: "🎨", isActive: true },
  { id: "pixel", name: "Pixel", role: "Fine Details", avatar: "🔍", isActive: false },
  { id: "nova", name: "Nova", role: "Creative Ideas", avatar: "✨", isActive: true },
];

interface BuildAction {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  type: "propose" | "agree" | "disagree" | "build" | "react" | "speak";
  content: string;
  brick?: {
    size: string;
    position: { x: number; y: number; z: number };
    color: string;
  };
  timestamp: Date;
}

export default function Stream() {
  const { viewToken } = useParams<{ viewToken: string }>();
  const [actions, setActions] = useState<BuildAction[]>([]);
  const [brickCount, setBrickCount] = useState(0);
  const [phase, setPhase] = useState("Planning");
  const [phaseNumber, setPhaseNumber] = useState(1);
  const [agents, setAgents] = useState(STREAM_AGENTS);

  // Fetch stream data
  const { data: streamData, isLoading, error } = trpc.youtubeStreaming.getPublicStream.useQuery(
    { viewToken: viewToken || "" },
    { enabled: !!viewToken, refetchInterval: 5000 }
  );

  // Fetch live build session data if available
  const { data: sessionData } = trpc.liveBuild.getSessionState.useQuery(
    { sessionId: streamData?.sessionId || "" },
    { enabled: !!streamData?.sessionId, refetchInterval: 2000 }
  );

  // Update state from session data
  useEffect(() => {
    if (sessionData) {
      // Transform session actions to BuildAction format
      const transformedActions: BuildAction[] = sessionData.recentActions.map((action: any) => ({
        id: action.id || `action-${Date.now()}-${Math.random()}`,
        agentId: action.agentId,
        agentName: action.agentName,
        agentAvatar: action.agentAvatar || "🤖",
        type: action.type,
        content: action.content,
        brick: action.brick,
        timestamp: new Date(action.timestamp),
      }));
      setActions(transformedActions);
      setBrickCount(sessionData.totalBricks || 0);
      setPhase(sessionData.phase || "Planning");
      // Calculate phase number from phase name
      const phases = ["Planning", "Foundation", "Structure", "Details", "Finishing"];
      const phaseIdx = phases.indexOf(sessionData.phase || "Planning");
      setPhaseNumber(phaseIdx >= 0 ? phaseIdx + 1 : 1);

      // Update agent activity status
      const activeAgentIds = new Set(sessionData.recentActions.slice(-5).map((a: any) => a.agentId));
      setAgents(prev => prev.map(agent => ({
        ...agent,
        isActive: activeAgentIds.has(agent.id),
      })));
    }
  }, [sessionData]);

  // Simulate activity if no real session data
  useEffect(() => {
    if (!sessionData && streamData) {
      const interval = setInterval(() => {
        const agentIndex = Math.floor(Math.random() * STREAM_AGENTS.length);
        const agent = STREAM_AGENTS[agentIndex];
        const actionTypes: BuildAction["type"][] = ["propose", "agree", "build", "react", "speak"];
        const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];

        const messages: Record<BuildAction["type"], string[]> = {
          propose: [
            "I suggest we add a 2x4 brick here for structural support",
            "What if we use a curved piece for the roof?",
            "Let's add some detail work on this corner",
          ],
          agree: [
            "That's a great idea! Let's do it",
            "I love that approach, very creative",
            "Perfect placement, well done!",
          ],
          disagree: [
            "Hmm, I think we should reconsider...",
            "Maybe we could try a different approach?",
          ],
          build: [
            "Placing a 2x4 brick at the foundation",
            "Adding detail pieces to the facade",
            "Connecting the structural elements",
          ],
          react: [
            "This is coming together beautifully!",
            "I'm excited about this design direction",
            "Great teamwork everyone!",
          ],
          speak: [
            "Let me share my thoughts on this...",
            "I've been thinking about the color scheme",
            "Here's an idea for the next phase",
          ],
        };

        const newAction: BuildAction = {
          id: `action-${Date.now()}`,
          agentId: agent.id,
          agentName: agent.name,
          agentAvatar: agent.avatar,
          type: actionType,
          content: messages[actionType][Math.floor(Math.random() * messages[actionType].length)],
          brick: actionType === "build" ? {
            size: "2x4",
            position: { x: Math.floor(Math.random() * 20), y: brickCount, z: Math.floor(Math.random() * 20) },
            color: ["#FF0000", "#0000FF", "#FFFF00", "#00FF00", "#FFFFFF"][Math.floor(Math.random() * 5)],
          } : undefined,
          timestamp: new Date(),
        };

        setActions(prev => [...prev.slice(-10), newAction]);
        if (actionType === "build") {
          setBrickCount(prev => prev + 1);
        }

        // Update agent activity
        setAgents(prev => prev.map(a => ({
          ...a,
          isActive: a.id === agent.id ? true : Math.random() > 0.3 ? a.isActive : false,
        })));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [sessionData, streamData, brickCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !streamData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-xl font-bold">Stream Not Found</p>
          <p className="text-gray-400 mt-2">This stream link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <StreamOverlay
      title={streamData.title}
      description={streamData.description}
      agents={agents}
      actions={actions}
      brickCount={brickCount}
      phase={phase}
      phaseNumber={phaseNumber}
      totalPhases={5}
      isLive={streamData.isLive}
      overlaySettings={streamData.overlaySettings}
    />
  );
}
