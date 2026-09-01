/**
 * Cross-Platform Chat Aggregation
 * 
 * Aggregates chat messages from multiple streaming platforms
 * (YouTube, Twitch, TikTok, etc.) into a unified feed
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Send, 
  Heart, 
  ThumbsUp,
  Star,
  Sparkles,
  Filter,
  Volume2,
  VolumeX
} from "lucide-react";

// Platform icons/colors
const PLATFORM_CONFIG: Record<string, { color: string; icon: string; name: string }> = {
  youtube: { color: "#FF0000", icon: "▶️", name: "YouTube" },
  twitch: { color: "#9146FF", icon: "📺", name: "Twitch" },
  tiktok: { color: "#000000", icon: "🎵", name: "TikTok" },
  twitter: { color: "#1DA1F2", icon: "𝕏", name: "X" },
  facebook: { color: "#1877F2", icon: "📘", name: "Facebook" },
  kick: { color: "#53FC18", icon: "🦵", name: "Kick" },
  internal: { color: "#6366F1", icon: "🧩", name: "Krewdoo" },
};

interface ChatMessage {
  id: string;
  platform: string;
  username: string;
  message: string;
  timestamp: Date;
  badges?: string[];
  isModerator?: boolean;
  isSubscriber?: boolean;
  isHighlighted?: boolean;
}

interface CrossPlatformChatProps {
  sessionId: string;
  activePlatforms?: string[];
  onSendMessage?: (message: string) => void;
  className?: string;
}

export function CrossPlatformChat({
  sessionId,
  activePlatforms = ["youtube", "twitch", "tiktok", "internal"],
  onSendMessage,
  className,
}: CrossPlatformChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // External messages arrive through connected relays. Do not fabricate audience activity.
  useEffect(() => {
    setMessages([]);
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      platform: "internal",
      username: "You",
      message: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    onSendMessage?.(inputMessage);
    setInputMessage("");
  };

  const filteredMessages = filter 
    ? messages.filter(m => m.platform === filter)
    : messages;

  const platformCounts = activePlatforms.reduce((acc, platform) => {
    acc[platform] = messages.filter(m => m.platform === platform).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-lg border", className)}>
      {/* Header with platform filters */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Live Chat</h3>
            <Badge variant="secondary" className="text-xs">
              {messages.length} messages
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Platform filter buttons */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant={filter === null ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          {activePlatforms.map(platform => {
            const config = PLATFORM_CONFIG[platform];
            return (
              <Button
                key={platform}
                variant={filter === platform ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1"
                style={filter === platform ? { backgroundColor: config.color } : {}}
                onClick={() => setFilter(filter === platform ? null : platform)}
              >
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{config.name}</span>
                <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                  {platformCounts[platform] || 0}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredMessages.map((msg) => {
              const config = PLATFORM_CONFIG[msg.platform] || PLATFORM_CONFIG.internal;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg",
                    msg.isHighlighted && "bg-yellow-500/10 border border-yellow-500/30",
                    msg.username === "You" && "bg-primary/10"
                  )}
                >
                  {/* Platform indicator */}
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    {config.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Badges */}
                      {msg.isModerator && (
                        <Badge variant="outline" className="h-4 text-[10px] px-1 border-green-500 text-green-500">
                          MOD
                        </Badge>
                      )}
                      {msg.isSubscriber && (
                        <Star className="w-3 h-3 text-yellow-500" />
                      )}
                      
                      {/* Username */}
                      <span 
                        className="font-semibold text-sm"
                        style={{ color: config.color }}
                      >
                        {msg.username}
                      </span>
                      
                      {/* Timestamp */}
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Message content */}
                    <p className="text-sm text-foreground/90 break-words">
                      {msg.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Send a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Messages appear on all connected platforms
        </p>
      </div>

      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQIBXqTi6qVhAQBWpOTspmEAAFak5OymYQAAVqTk7KZhAABWpOTspmEAAFak5OymYQ==" type="audio/wav" />
      </audio>
    </div>
  );
}

export default CrossPlatformChat;
