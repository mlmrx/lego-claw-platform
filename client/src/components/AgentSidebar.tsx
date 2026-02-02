/**
 * AgentSidebar Component
 * Design: Isometric LEGO Playground
 * Shows all active agents with their status and specialty
 */

import { cn } from "@/lib/utils";
import { Agent, skillDescriptions } from "@/lib/agents";
import { AgentAvatar } from "./AgentAvatar";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentSidebarProps {
  agents: Agent[];
  className?: string;
}

const statusLabels = {
  building: '🔨 Building',
  thinking: '💭 Thinking',
  chatting: '💬 Chatting',
  idle: '😴 Idle'
};

export function AgentSidebar({ agents, className }: AgentSidebarProps) {
  // Sort agents by status: building first, then chatting, thinking, idle
  const sortedAgents = [...agents].sort((a, b) => {
    const order = { building: 0, chatting: 1, thinking: 2, idle: 3 };
    return order[a.status || 'idle'] - order[b.status || 'idle'];
  });

  const activeCount = agents.filter(a => a.status && a.status !== 'idle').length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg">Agents</h2>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
            <span className="text-sm text-muted-foreground">
              {activeCount} active
            </span>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sortedAgents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold font-heading text-primary">
              {agents.length}
            </div>
            <div className="text-xs text-muted-foreground">Total Agents</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-green-600">
              {agents.filter(a => a.status === 'building').length}
            </div>
            <div className="text-xs text-muted-foreground">Building Now</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const status = agent.status || 'idle';
  const specialty = skillDescriptions[agent.skill] || agent.skill;
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-card border border-border",
        "hover:border-primary/30 hover:shadow-sm",
        "transition-all duration-200",
        status === 'idle' && "opacity-60"
      )}
    >
      <AgentAvatar agent={agent} size="md" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className="font-heading font-bold text-sm truncate"
            style={{ color: agent.color }}
          >
            {agent.name}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {specialty}
        </div>
        <div className="text-xs mt-1">
          {statusLabels[status]}
        </div>
      </div>
    </motion.div>
  );
}
