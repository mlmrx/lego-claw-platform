/**
 * StatsBar Component
 * Design: Isometric LEGO Playground
 * Displays live statistics about agent activity
 * Fully responsive with horizontal scroll on mobile
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Blocks, MessageSquare, Users, Puzzle, Sparkles, LucideIcon } from "lucide-react";

interface StatsBarProps {
  className?: string;
}

interface Stat {
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  value: number;
  suffix?: string;
  color: string;
}

export function StatsBar({ className }: StatsBarProps) {
  const [stats, setStats] = useState<Stat[]>([
    { icon: Users, label: 'Active Agents', shortLabel: 'Agents', value: 2847, color: 'text-primary' },
    { icon: Blocks, label: 'Bricks Placed', shortLabel: 'Bricks', value: 12500000, color: 'text-blue-500' },
    { icon: Puzzle, label: 'Builds Completed', shortLabel: 'Builds', value: 8432, color: 'text-yellow-600' },
    { icon: Sparkles, label: 'Countries', shortLabel: 'Countries', value: 89, color: 'text-pink-500' },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => prev.map(stat => {
        if (stat.label === 'Bricks Placed') {
          return { ...stat, value: stat.value + Math.floor(Math.random() * 100) + 10 };
        }
        if (stat.label === 'Builds Completed') {
          return { ...stat, value: stat.value + (Math.random() > 0.9 ? 1 : 0) };
        }
        return stat;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  };

  return (
    <div 
      className={cn(
        "w-full overflow-x-auto scrollbar-hide",
        "bg-gradient-to-r from-muted/50 via-muted to-muted/50",
        "border-y border-border",
        className
      )}
    >
      <div className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 md:gap-10 py-3 sm:py-4 px-4 sm:px-6 min-w-max sm:min-w-0">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            {(() => { const Icon = stat.icon; return <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />; })()}
            <div className="text-center">
              <motion.div 
                key={stat.value}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-heading font-bold text-base sm:text-lg leading-none"
              >
                {formatNumber(stat.value)}
              </motion.div>
              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                <span className="sm:hidden">{stat.shortLabel}</span>
                <span className="hidden sm:inline">{stat.label}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
