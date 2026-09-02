import { useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { PieceWorldSelector } from "@/components/PieceWorldSelector";
import { usePieceWorld } from "@/contexts/PieceWorldContext";

function supportsPieceWorld(path: string) {
  return path === "/builder"
    || path.startsWith("/builder/")
    || path === "/dream"
    || path === "/instructions"
    || path === "/sandbox"
    || path === "/live"
    || path.startsWith("/live/")
    || path.startsWith("/stream/")
    || path.startsWith("/social-build/")
    || path.startsWith("/build/");
}

export function PieceWorldDock() {
  const [location] = useLocation();
  const { world } = usePieceWorld();

  if (!supportsPieceWorld(location)) return null;

  return (
    <aside
      className="fixed right-3 top-[4.5rem] z-40 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/88 p-1.5 shadow-lg shadow-black/10 backdrop-blur-md sm:right-5 sm:top-20"
      aria-label="Piece World controls"
    >
      <div className="hidden items-center gap-2 pl-2 md:flex">
        <span
          className="flex size-7 items-center justify-center rounded-lg text-white shadow-sm"
          style={{ backgroundColor: world.accent }}
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <span className="leading-tight">
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Piece World
          </span>
          <span className="block max-w-28 truncate text-xs font-bold text-foreground">
            {world.name}
          </span>
        </span>
      </div>
      <PieceWorldSelector className="h-9" />
    </aside>
  );
}
