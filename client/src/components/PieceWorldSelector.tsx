import type { ComponentType } from "react";
import {
  Box,
  Candy,
  Check,
  ChevronDown,
  CircuitBoard,
  Gem,
  Layers3,
  Magnet,
  Sparkles,
  Trees,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePieceWorld } from "@/contexts/PieceWorldContext";
import { PIECE_WORLDS, type PieceWorldDefinition, type PieceWorldId } from "@/lib/pieceWorlds";

const WORLD_ICONS: Record<PieceWorldDefinition["icon"], ComponentType<{ className?: string }>> = {
  blocks: Box,
  gem: Gem,
  clay: Layers3,
  voxel: Box,
  magnet: Magnet,
  circuit: CircuitBoard,
  candy: Candy,
  timber: Trees,
};

function WorldPreview({ world, selected }: { world: PieceWorldDefinition; selected: boolean }) {
  const Icon = WORLD_ICONS[world.icon];
  return (
    <span
      className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-sm"
      style={{
        borderColor: selected ? world.accent : `${world.accent}55`,
        background: `linear-gradient(135deg, ${world.previewColors[0]}, ${world.previewColors[1]} 52%, ${world.previewColors[2]})`,
      }}
      aria-hidden="true"
    >
      <span className="absolute inset-0 bg-white/18" />
      <Icon className="relative size-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
    </span>
  );
}

interface PieceWorldSelectorProps {
  className?: string;
  compact?: boolean;
  align?: "start" | "center" | "end";
}

export function PieceWorldSelector({
  className,
  compact = false,
  align = "end",
}: PieceWorldSelectorProps) {
  const { world, worldId, setWorldId } = usePieceWorld();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 gap-2 rounded-xl border-border/70 bg-background/90 px-3 shadow-sm backdrop-blur",
            className,
          )}
          aria-label={`Piece World: ${world.name}`}
        >
          <span
            className="size-3 rounded-full ring-2 ring-white shadow-sm"
            style={{ backgroundColor: world.accent }}
            aria-hidden="true"
          />
          {!compact ? (
            <span className="max-w-20 truncate text-xs font-semibold sm:text-sm">{world.shortName}</span>
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8} className="w-[min(92vw,430px)] rounded-2xl p-2">
        <DropdownMenuLabel className="px-2 pb-2 pt-1">
          <span className="block text-sm font-bold">Piece Worlds</span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            Change the material universe without changing your construction.
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={worldId}
          onValueChange={value => setWorldId(value as PieceWorldId)}
          className="grid gap-1 sm:grid-cols-2"
        >
          {PIECE_WORLDS.map(option => {
            const selected = option.id === worldId;
            return (
              <DropdownMenuRadioItem
                key={option.id}
                value={option.id}
                className="group min-h-[76px] cursor-pointer items-start gap-3 rounded-xl px-2.5 py-2.5 pr-8 focus:bg-accent"
              >
                <WorldPreview world={option} selected={selected} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    {option.name}
                    {selected && <Check className="size-3.5" style={{ color: option.accent }} aria-hidden="true" />}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {option.eyebrow}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
