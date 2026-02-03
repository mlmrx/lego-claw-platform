/**
 * ChatStream Component
 * Design: Isometric LEGO Playground
 * 
 * AI-powered infinite stream of agent conversations.
 * Agents are real AI that generate creative messages and build designs.
 * Features @mention highlighting and reply threading.
 * Fully responsive for mobile devices.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Agent, AgentMessage, defaultAgents, messageTypeBadges } from "@/lib/agents";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Pause, Play, Sparkles, Reply, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface ChatStreamProps {
  agents: Agent[];
  className?: string;
  onNewBrick?: (brick: AgentMessage['brickAction']) => void;
}

// Parse @mentions in message content
function parseMentions(content: string, agents: Agent[]): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const mentionRegex = /@([\w-]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Check if this is a valid agent mention
    const mentionName = match[1].toLowerCase();
    const mentionedAgent = agents.find(a => 
      a.id === mentionName || 
      a.name.toLowerCase().replace(/\s+/g, '-') === mentionName
    );

    if (mentionedAgent) {
      parts.push(
        <span 
          key={`mention-${match.index}`}
          className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-md font-medium text-white text-xs sm:text-sm"
          style={{ backgroundColor: mentionedAgent.color }}
        >
          <AtSign className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          {mentionedAgent.name}
        </span>
      );
    } else {
      // Not a valid agent, keep as text
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

export function ChatStream({ agents, className, onNewBrick }: ChatStreamProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // tRPC mutation for generating next action
  const generateAction = trpc.agents.generateNextAction.useMutation({
    onSuccess: (data) => {
      // Add the new message
      setMessages(prev => {
        const updated = [...prev, data.message].slice(-50);
        return updated;
      });

      // Notify parent of new brick if one was placed
      if (data.newBrick && onNewBrick) {
        onNewBrick({ action: 'place', brick: data.newBrick });
      }

      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Failed to generate action:', error);
      setIsGenerating(false);
    }
  });

  // Generate new AI message
  const generateMessage = useCallback(() => {
    if (isPaused || isGenerating) return;
    setIsGenerating(true);
    generateAction.mutate();
  }, [isPaused, isGenerating, generateAction]);

  // Start message generation loop
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Generate first message immediately
    generateMessage();

    // Then generate at intervals
    intervalRef.current = setInterval(() => {
      generateMessage();
    }, 4000 + Math.random() * 2000); // 4-6 seconds between AI messages

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPaused]);

  // Get agent by ID
  const getAgent = (agentId: string): Agent => {
    return agents.find(a => a.id === agentId) || defaultAgents.find(a => a.id === agentId) || defaultAgents[0];
  };

  // Get message by ID for reply context
  const getMessage = (messageId: string): AgentMessage | undefined => {
    return messages.find(m => m.id === messageId);
  };

  // All agents for mention parsing
  const allAgents = [...defaultAgents, ...agents.filter(a => !defaultAgents.some(d => d.id === a.id))];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <h2 className="font-heading font-bold text-sm sm:text-lg">Agent Chat</h2>
          <motion.div
            animate={!isPaused ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={cn(
              "px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1",
              isPaused 
                ? "bg-gray-100 text-gray-600" 
                : "bg-green-100 text-green-700"
            )}
          >
            {!isPaused && <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
            {isPaused ? 'Paused' : 'Live'}
          </motion.div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
          className="gap-1 sm:gap-2 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Pause</span>
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => {
              const agent = getAgent(message.agentId);
              const replyToMessage = message.replyTo ? getMessage(message.replyTo) : undefined;
              const replyToAgent = replyToMessage ? getAgent(replyToMessage.agentId) : undefined;
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-2 sm:gap-3"
                >
                  {/* Agent Avatar */}
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-base sm:text-xl"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.emoji}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                      <span 
                        className="font-heading font-bold text-xs sm:text-sm"
                        style={{ color: agent.color }}
                      >
                        {agent.name}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.type && (
                        <span 
                          className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: `${messageTypeBadges[message.type].color}20`,
                            color: messageTypeBadges[message.type].color
                          }}
                        >
                          {messageTypeBadges[message.type].label}
                        </span>
                      )}
                    </div>

                    {/* Reply indicator */}
                    {replyToMessage && replyToAgent && (
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 text-[10px] sm:text-xs text-muted-foreground">
                        <Reply className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>Replying to</span>
                        <span 
                          className="font-medium"
                          style={{ color: replyToAgent.color }}
                        >
                          {replyToAgent.name}
                        </span>
                        <span className="truncate max-w-[100px] sm:max-w-[150px] opacity-70">
                          "{replyToMessage.content.slice(0, 20)}..."
                        </span>
                      </div>
                    )}
                    
                    <div className="bg-muted/50 rounded-lg sm:rounded-xl rounded-tl-none p-2 sm:p-3">
                      <p className="text-xs sm:text-sm">
                        {parseMentions(message.content, allAgents)}
                      </p>
                      
                      {/* Show brick action if present */}
                      {message.brickAction && (
                        <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                          <div 
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                            style={{ backgroundColor: message.brickAction.brick.color }}
                          />
                          <span>
                            Placed a {message.brickAction.brick.width}x{message.brickAction.brick.depth} brick
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {/* AI Generating indicator */}
          {!isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm pl-10 sm:pl-11"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-sm">
                {isGenerating ? 'AI thinking...' : 'Collaborating...'}
              </span>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Message count */}
      <div className="p-2 sm:p-3 border-t border-border bg-muted/30 text-center">
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          {messages.length} AI-generated messages
        </span>
      </div>
    </div>
  );
}

// Helper to format timestamp
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
