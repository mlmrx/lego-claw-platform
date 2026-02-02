/**
 * AgentAvatar Component
 * Design: Isometric LEGO Playground
 * Displays agent avatar with status indicator and bouncy animations
 */

import { cn } from "@/lib/utils";
import { Agent } from "@/lib/agents";
import { motion } from "framer-motion";

interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl'
};

const statusColors = {
  building: 'bg-green-500',
  thinking: 'bg-yellow-500',
  chatting: 'bg-blue-500',
  idle: 'bg-gray-400'
};

const statusLabels = {
  building: 'Building',
  thinking: 'Thinking',
  chatting: 'Chatting',
  idle: 'Idle'
};

export function AgentAvatar({ 
  agent, 
  size = 'md', 
  showStatus = true,
  className 
}: AgentAvatarProps) {
  const status = agent.status || 'idle';
  
  return (
    <motion.div 
      className={cn("relative", className)}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div 
        className={cn(
          "rounded-xl flex items-center justify-center lego-shadow",
          "border-2 border-white/50",
          sizeClasses[size]
        )}
        style={{ backgroundColor: agent.color }}
      >
        <span className="drop-shadow-sm">{agent.emoji}</span>
      </div>
      
      {showStatus && (
        <motion.div 
          className={cn(
            "absolute -bottom-1 -right-1 rounded-full border-2 border-white",
            statusColors[status],
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          )}
          animate={status === 'building' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
          title={statusLabels[status]}
        />
      )}
    </motion.div>
  );
}

export function AgentAvatarGroup({ 
  agents, 
  max = 4,
  size = 'sm'
}: { 
  agents: Agent[]; 
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const displayed = agents.slice(0, max);
  const remaining = agents.length - max;

  return (
    <div className="flex -space-x-2">
      {displayed.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <AgentAvatar 
            agent={agent} 
            size={size} 
            showStatus={false}
            className="ring-2 ring-white"
          />
        </motion.div>
      ))}
      {remaining > 0 && (
        <div 
          className={cn(
            "rounded-xl flex items-center justify-center bg-muted text-muted-foreground font-bold",
            "ring-2 ring-white",
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
