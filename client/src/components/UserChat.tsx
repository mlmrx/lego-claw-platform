/**
 * User Chat Component
 * Real-time chat for users watching live builds
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { 
  Send, 
  MessageCircle, 
  Users, 
  LogIn,
  Smile,
  Heart,
  ThumbsUp,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserChatProps {
  projectId?: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number }[];
  isSupporter?: boolean;
}

// Simulated chat messages for demo
const demoMessages: ChatMessage[] = [
  {
    id: "1",
    userId: "user1",
    userName: "BrickMaster42",
    message: "This build is looking amazing! 🧱",
    timestamp: new Date(Date.now() - 300000),
    reactions: [{ emoji: "❤️", count: 3 }],
    isSupporter: true,
  },
  {
    id: "2",
    userId: "user2",
    userName: "LEGOFan2024",
    message: "I love how the agents collaborate on the design",
    timestamp: new Date(Date.now() - 240000),
    reactions: [{ emoji: "👍", count: 2 }],
  },
  {
    id: "3",
    userId: "user3",
    userName: "CreativBuilder",
    message: "Can't wait to see the finished result!",
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: "4",
    userId: "user4",
    userName: "TechnicPro",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TechnicPro",
    message: "The color choices are perfect 🎨",
    timestamp: new Date(Date.now() - 120000),
    reactions: [{ emoji: "✨", count: 5 }],
    isSupporter: true,
  },
  {
    id: "5",
    userId: "user5",
    userName: "BlockBuilder99",
    message: "How do I start my own build?",
    timestamp: new Date(Date.now() - 60000),
  },
];

const quickReactions = ["❤️", "👍", "🔥", "✨", "🧱"];

export function UserChat({ projectId, className }: UserChatProps) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(demoMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulate other users typing
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Simulate incoming messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const randomMessages = [
          "This is so cool! 🎉",
          "Love watching the agents work together",
          "The structural design is impressive",
          "Can't believe AI can do this!",
          "What LEGO set is this based on?",
          "Amazing collaboration! 🤖",
          "The colors are perfect",
          "How long until it's done?",
        ];
        const randomNames = ["Builder123", "LEGOLover", "BrickFan", "CreativeKid", "MasterBuilder"];
        
        const newMsg: ChatMessage = {
          id: `sim-${Date.now()}`,
          userId: `sim-${Math.random()}`,
          userName: randomNames[Math.floor(Math.random() * randomNames.length)],
          message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
          timestamp: new Date(),
          isSupporter: Math.random() > 0.7,
        };
        
        setMessages(prev => [...prev.slice(-50), newMsg]);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isAuthenticated) return;

    const msg: ChatMessage = {
      id: `user-${Date.now()}`,
      userId: String(user?.id || "unknown"),
      userName: user?.name || "Anonymous",
      userAvatar: user?.avatarUrl || undefined,
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions?.map(r => 
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            ),
          };
        } else {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, count: 1 }],
          };
        }
      }
      return msg;
    }));
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Live Chat</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          {messages.length > 10 ? "10+" : messages.length} watching
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="group"
              >
                <div className="flex gap-2">
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarImage src={msg.userAvatar} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {msg.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium truncate max-w-[120px]">
                        {msg.userName}
                      </span>
                      {msg.isSupporter && (
                        <Badge variant="outline" className="h-4 px-1 text-[10px] text-yellow-600 border-yellow-300">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          Supporter
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">
                      {msg.message}
                    </p>
                    
                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {msg.reactions.map((reaction, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleReaction(msg.id, reaction.emoji)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-xs transition-colors"
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-muted-foreground">{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick reaction buttons (on hover) */}
                    <div className="hidden group-hover:flex items-center gap-1 mt-1">
                      {quickReactions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-xs transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>Someone is typing...</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        {isAuthenticated ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Say something..."
              className="flex-1 h-9 text-sm"
              maxLength={200}
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={!newMessage.trim()}
              className="h-9 px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <Button asChild variant="outline" className="w-full h-9" size="sm">
            <a href={getLoginUrl()}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign in to chat
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
