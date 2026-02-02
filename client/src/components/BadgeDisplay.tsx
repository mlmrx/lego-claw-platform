import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BadgeData {
  badge: {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    category: string;
    rarity: string;
    threshold: number;
    earnedCount: number;
  };
  earnedAt: Date;
  progress: number;
}

interface BadgeDisplayProps {
  badges: BadgeData[];
  showAll?: boolean;
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const rarityColors: Record<string, string> = {
  common: "from-gray-400 to-gray-500",
  uncommon: "from-green-400 to-green-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-orange-500",
};

const rarityBorders: Record<string, string> = {
  common: "border-gray-300",
  uncommon: "border-green-400",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-yellow-400",
};

export function BadgeDisplay({
  badges,
  showAll = false,
  maxDisplay = 5,
  size = "md",
  className,
}: BadgeDisplayProps) {
  const displayBadges = showAll ? badges : badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-10 h-10 text-xl",
    lg: "w-14 h-14 text-2xl",
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayBadges.map((badgeData, index) => (
        <Tooltip key={badgeData.badge.id}>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-full flex items-center justify-center border-2 cursor-pointer",
                "bg-gradient-to-br shadow-md hover:shadow-lg transition-shadow",
                sizeClasses[size],
                rarityColors[badgeData.badge.rarity],
                rarityBorders[badgeData.badge.rarity]
              )}
            >
              <span>{badgeData.badge.icon}</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{badgeData.badge.icon}</span>
                <span className="font-semibold">{badgeData.badge.name}</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {badgeData.badge.rarity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {badgeData.badge.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Earned {new Date(badgeData.earnedAt).toLocaleDateString()}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
      {!showAll && remaining > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center border-2 border-dashed border-muted-foreground/30",
            "bg-muted/50 text-muted-foreground text-xs font-medium",
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

// Single badge component for inline use
export function SingleBadge({
  badge,
  size = "sm",
  showLabel = false,
}: {
  badge: BadgeData["badge"];
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const sizeClasses = {
    sm: "w-6 h-6 text-sm",
    md: "w-8 h-8 text-base",
    lg: "w-10 h-10 text-lg",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1.5">
          <div
            className={cn(
              "rounded-full flex items-center justify-center border",
              "bg-gradient-to-br shadow-sm",
              sizeClasses[size],
              rarityColors[badge.rarity],
              rarityBorders[badge.rarity]
            )}
          >
            <span>{badge.icon}</span>
          </div>
          {showLabel && (
            <span className="text-sm font-medium">{badge.name}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <div className="font-semibold">{badge.name}</div>
          <p className="text-sm text-muted-foreground">{badge.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Badge grid for profile pages
export function BadgeGrid({ badges }: { badges: BadgeData[] }) {
  const groupedBadges = badges.reduce((acc, badge) => {
    const category = badge.badge.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, BadgeData[]>);

  const categoryLabels: Record<string, string> = {
    building: "🏗️ Building",
    collaboration: "🤝 Collaboration",
    creativity: "✨ Creativity",
    milestone: "🏆 Milestones",
    special: "⭐ Special",
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {categoryLabels[category] || category}
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {categoryBadges.map((badgeData) => (
              <Tooltip key={badgeData.badge.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center p-2",
                      "border-2 cursor-pointer transition-colors",
                      "bg-gradient-to-br",
                      rarityColors[badgeData.badge.rarity],
                      rarityBorders[badgeData.badge.rarity]
                    )}
                  >
                    <span className="text-2xl">{badgeData.badge.icon}</span>
                    <span className="text-[10px] text-white font-medium mt-1 text-center line-clamp-1">
                      {badgeData.badge.name}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{badgeData.badge.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {badgeData.badge.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {badgeData.badge.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Earned {new Date(badgeData.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
      {badges.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <span className="text-4xl mb-2 block">🏅</span>
          <p>No badges earned yet</p>
          <p className="text-sm">Start building to earn your first badge!</p>
        </div>
      )}
    </div>
  );
}
