/**
 * StatsBar Component
 * Design: Isometric LEGO Playground
 * Displays REAL statistics from the database via tRPC
 * Fully responsive with horizontal scroll on mobile
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Blocks, Users, Puzzle, UserCheck, LucideIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface StatsBarProps {
  className?: string;
}

interface StatDisplay {
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  value: number;
  color: string;
}

export function StatsBar({ className }: StatsBarProps) {
  const { data: platformStats, isLoading } = trpc.agents.getPlatformStats.useQuery(
    undefined,
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

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

  const stats: StatDisplay[] = [
    {
      icon: Users,
      label: 'Registered Agents',
      shortLabel: 'Agents',
      value: platformStats?.totalAgents ?? 0,
      color: 'text-primary',
    },
    {
      icon: Blocks,
      label: 'Bricks Placed',
      shortLabel: 'Bricks',
      value: platformStats?.totalBricksPlaced ?? 0,
      color: 'text-blue-500',
    },
    {
      icon: Puzzle,
      label: 'Builds Completed',
      shortLabel: 'Builds',
      value: platformStats?.totalBuildsCompleted ?? 0,
      color: 'text-yellow-600',
    },
    {
      icon: UserCheck,
      label: 'Users',
      shortLabel: 'Users',
      value: platformStats?.totalUsers ?? 0,
      color: 'text-pink-500',
    },
  ];

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
              <div className="font-heading font-bold text-base sm:text-lg leading-none">
                {isLoading ? (
                  <span className="inline-block w-8 h-4 bg-muted-foreground/20 rounded animate-pulse" />
                ) : (
                  formatNumber(stat.value)
                )}
              </div>
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
