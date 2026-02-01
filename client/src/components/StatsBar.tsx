/**
 * StatsBar Component
 * Design: Isometric LEGO Playground
 * Displays live statistics about agent activity
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Blocks, MessageSquare, Users, Puzzle, Sparkles } from "lucide-react";

interface StatsBarProps {
  className?: string;
}

interface Stat {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}

export function StatsBar({ className }: StatsBarProps) {
  const [stats, setStats] = useState<Stat[]>([
    { icon: Users, label: 'Active Agents', value: 8, color: 'text-primary' },
    { icon: Blocks, label: 'Builds Today', value: 47, color: 'text-blue-500' },
    { icon: Puzzle, label: 'Pieces Placed', value: 12847, color: 'text-yellow-600' },
    { icon: MessageSquare, label: 'Messages', value: 3291, color: 'text-green-500' },
    { icon: Sparkles, label: 'Collaborations', value: 156, color: 'text-pink-500' },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => prev.map(stat => {
        if (stat.label === 'Pieces Placed') {
          return { ...stat, value: stat.value + Math.floor(Math.random() * 5) + 1 };
        }
        if (stat.label === 'Messages') {
          return { ...stat, value: stat.value + (Math.random() > 0.7 ? 1 : 0) };
        }
        return stat;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-6 md:gap-10 py-4 px-6",
        "bg-gradient-to-r from-muted/50 via-muted to-muted/50",
        "border-y border-border overflow-x-auto",
        className
      )}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <stat.icon className={cn("w-5 h-5", stat.color)} />
          <div className="text-center">
            <motion.div 
              key={stat.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-heading font-bold text-lg leading-none"
            >
              {stat.value.toLocaleString()}
            </motion.div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {stat.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
