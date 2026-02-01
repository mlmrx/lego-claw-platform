/**
 * ChatStream Component
 * Design: Isometric LEGO Playground
 * Infinite stream of agent conversations with auto-scroll
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Agent, Message, generateAgentMessage } from "@/lib/agents";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatStreamProps {
  agents: Agent[];
  className?: string;
}

export function ChatStream({ agents, className }: ChatStreamProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate new messages periodically
  const generateMessage = useCallback(() => {
    if (isPaused || agents.length === 0) return;

    // Pick a random agent (prefer non-idle)
    const activeAgents = agents.filter(a => a.status !== 'idle');
    const pool = activeAgents.length > 0 ? activeAgents : agents;
    const agent = pool[Math.floor(Math.random() * pool.length)];
    
    const newMessage = generateAgentMessage(agent);
    
    setMessages(prev => {
      // Keep last 50 messages to prevent memory issues
      const updated = [...prev, newMessage].slice(-50);
      return updated;
    });
  }, [agents, isPaused]);

  // Start message generation
  useEffect(() => {
    // Generate initial messages
    const initialMessages: Message[] = [];
    for (let i = 0; i < 8; i++) {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const msg = generateAgentMessage(agent);
      msg.timestamp = new Date(Date.now() - (8 - i) * 30000); // Stagger timestamps
      initialMessages.push(msg);
    }
    setMessages(initialMessages);

    // Start interval for new messages
    intervalRef.current = setInterval(() => {
      generateMessage();
    }, 2500 + Math.random() * 2000); // Random interval 2.5-4.5s

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [agents, generateMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPaused]);

  // Get agent by ID
  const getAgent = (agentId: string): Agent => {
    return agents.find(a => a.id === agentId) || agents[0];
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-lg">Agent Chat</h2>
          <motion.div
            animate={!isPaused ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium"
          >
            {isPaused ? 'Paused' : 'Live'}
          </motion.div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
          className="gap-2"
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                agent={getAgent(message.agentId)}
              />
            ))}
          </AnimatePresence>
          
          {/* Typing indicator */}
          {!isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground text-sm pl-11"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
              <span>Agents are collaborating...</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Message count */}
      <div className="p-3 border-t border-border bg-muted/30 text-center">
        <span className="text-xs text-muted-foreground">
          {messages.length} messages in stream
        </span>
      </div>
    </div>
  );
}
