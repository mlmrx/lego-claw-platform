import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PIECE_WORLD_ID,
  getPieceWorld,
  isPieceWorldId,
  parseStoredPieceWorld,
  PIECE_WORLD_STORAGE_KEY,
  type PieceWorldDefinition,
  type PieceWorldId,
} from "@/lib/pieceWorlds";

interface PieceWorldContextValue {
  worldId: PieceWorldId;
  world: PieceWorldDefinition;
  setWorldId: (worldId: PieceWorldId) => void;
  resetWorld: () => void;
}

const FALLBACK_CONTEXT: PieceWorldContextValue = {
  worldId: DEFAULT_PIECE_WORLD_ID,
  world: getPieceWorld(DEFAULT_PIECE_WORLD_ID),
  setWorldId: () => undefined,
  resetWorld: () => undefined,
};

const PieceWorldContext = createContext<PieceWorldContextValue>(FALLBACK_CONTEXT);

function readStoredWorld(): PieceWorldId {
  if (typeof window === "undefined") return DEFAULT_PIECE_WORLD_ID;
  try {
    const stored = window.localStorage.getItem(PIECE_WORLD_STORAGE_KEY);
    return parseStoredPieceWorld(stored);
  } catch {
    return DEFAULT_PIECE_WORLD_ID;
  }
}

export function PieceWorldProvider({ children }: { children: ReactNode }) {
  const [worldId, setWorldIdState] = useState<PieceWorldId>(readStoredWorld);

  const setWorldId = useCallback((nextWorldId: PieceWorldId) => {
    setWorldIdState(isPieceWorldId(nextWorldId) ? nextWorldId : DEFAULT_PIECE_WORLD_ID);
  }, []);

  const resetWorld = useCallback(() => {
    setWorldIdState(DEFAULT_PIECE_WORLD_ID);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.pieceWorld = worldId;
    try {
      window.localStorage.setItem(PIECE_WORLD_STORAGE_KEY, worldId);
    } catch {
      // Browsers may block storage in privacy modes; the in-memory choice still works.
    }
  }, [worldId]);

  const value = useMemo<PieceWorldContextValue>(() => ({
    worldId,
    world: getPieceWorld(worldId),
    setWorldId,
    resetWorld,
  }), [resetWorld, setWorldId, worldId]);

  return <PieceWorldContext.Provider value={value}>{children}</PieceWorldContext.Provider>;
}

export function usePieceWorld() {
  return useContext(PieceWorldContext);
}
