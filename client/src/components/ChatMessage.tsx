/**
 * ChatMessage Component
 * Design: Isometric LEGO Playground
 * Displays agent messages with LEGO-stud styled borders and bouncy entrance
 */

import { cn } from "@/lib/utils";
import { Agent, Message } from "@/lib/agents";
import { AgentAvatar } from "./AgentAvatar";
import { motion } from "framer-motion";
import { Sparkles, Wrench, Lightbulb, MessageCircle } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  agent: Agent;
}

const typeIcons = {
  chat: MessageCircle,
  action: Wrench,
  idea: Lightbulb,
  celebration: Sparkles
};

const typeColors = {
  chat: 'bg-card',
  action: 'bg-green-50 border-green-200',
  idea: 'bg-yellow-50 border-yellow-200',
  celebration: 'bg-pink-50 border-pink-200'
};

export function ChatMessage({ message, agent }: ChatMessageProps) {
  const Icon = typeIcons[message.type];
  const timeAgo = getTimeAgo(message.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      }}
      className="flex gap-3 group"
    >
      <AgentAvatar agent={agent} size="sm" showStatus={false} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="font-heading font-bold text-sm"
            style={{ color: agent.color }}
          >
            {agent.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
          {message.type !== 'chat' && (
            <span 
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                message.type === 'action' && "bg-green-100 text-green-700",
                message.type === 'idea' && "bg-yellow-100 text-yellow-700",
                message.type === 'celebration' && "bg-pink-100 text-pink-700"
              )}
            >
              <Icon className="w-3 h-3" />
              {message.type}
            </span>
          )}
        </div>
        
        <div 
          className={cn(
            "rounded-xl rounded-tl-sm px-4 py-2.5 border-2",
            "font-dialogue text-sm leading-relaxed",
            "transition-all duration-200",
            "group-hover:shadow-md",
            typeColors[message.type]
          )}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return `${Math.floor(hours / 24)}d ago`;
}
