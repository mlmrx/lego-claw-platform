import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Box,
  Clock,
  FastForward,
  History,
  Loader2,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  User,
} from "lucide-react";

export interface ReplayEvent {
  id: string;
  sequence: number;
  position: [number, number, number];
  color: string;
  width: number;
  depth: number;
  height: number;
  agentName: string;
  agentEmoji: string;
  message: string | null;
  timestamp: number;
  recordedAt: string | null;
  source: "message" | "snapshot";
}

interface BuildReplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildName: string;
  events: ReplayEvent[];
  contributors: number;
  source?: "persisted-message-actions" | "final-build-snapshot";
  provenance?: string;
  isLoading?: boolean;
  error?: string | null;
}

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
};

export function BuildReplay({
  open,
  onOpenChange,
  buildName,
  events,
  contributors,
  source,
  provenance,
  isLoading = false,
  error,
}: BuildReplayProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;
    setVisibleCount(0);
    setIsPlaying(false);
  }, [open, events]);

  useEffect(() => {
    if (!isPlaying || events.length === 0) return;
    intervalRef.current = setInterval(() => {
      setVisibleCount(previous => {
        if (previous >= events.length) {
          setIsPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, Math.max(90, 450 / playbackSpeed));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [events.length, isPlaying, playbackSpeed]);

  const visibleEvents = useMemo(() => events.slice(0, visibleCount), [events, visibleCount]);
  const currentEvent = visibleCount > 0 ? events[visibleCount - 1] : undefined;
  const totalDuration = events.at(-1)?.timestamp ?? 0;
  const currentTime = currentEvent?.timestamp ?? 0;

  const handlePlayPause = useCallback(() => {
    if (events.length === 0) return;
    if (visibleCount >= events.length) setVisibleCount(0);
    setIsPlaying(previous => !previous);
  }, [events.length, visibleCount]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setVisibleCount(0);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Build Replay: {buildName}
            {source && (
              <Badge variant="outline" className="ml-1 font-normal">
                {source === "persisted-message-actions" ? "Recorded agent actions" : "Final build sequence"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading recorded history…
          </div>
        ) : error ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
            <History className="h-10 w-10 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Replay could not be loaded</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
            <History className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">No recorded placement history</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This build has no brick actions or final brick snapshot to replay.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {provenance && (
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {provenance}
              </p>
            )}
            <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 to-green-100">
                  <div className="absolute inset-x-8 bottom-8 top-14 rotate-[-4deg] rounded-xl border-4 border-green-700/20 bg-green-500 shadow-2xl" />
                  <div className="absolute inset-0">
                    <AnimatePresence>
                      {visibleEvents.map((event, index) => {
                        const [x, y, z] = event.position;
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: -40, scale: 0.65 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="absolute rounded-sm border border-black/10 shadow-md"
                            style={{
                              backgroundColor: event.color,
                              width: `${Math.min(54, 14 + event.width * 7)}px`,
                              height: `${Math.min(42, 12 + event.depth * 5)}px`,
                              left: `calc(50% + ${x * 13 - 18}px)`,
                              top: `calc(52% + ${z * 13 - y * 10 - 18}px)`,
                              zIndex: Math.round(y * 20 + z * 2 + index),
                            }}
                          >
                            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 shadow-inner" />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  {currentEvent && (
                    <div className="absolute inset-x-3 bottom-3 rounded-lg bg-slate-950/85 p-3 text-xs text-white backdrop-blur">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-base">{currentEvent.agentEmoji}</span>
                        {currentEvent.agentName} placed piece {visibleCount}
                      </div>
                      {currentEvent.message && (
                        <p className="mt-1 line-clamp-2 text-white/70">{currentEvent.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Card><CardContent className="p-3 text-center"><Box className="mx-auto mb-1 h-5 w-5 text-primary" /><p className="text-lg font-bold">{visibleCount}</p><p className="text-xs text-muted-foreground">Pieces</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><Clock className="mx-auto mb-1 h-5 w-5 text-blue-500" /><p className="text-lg font-bold">{formatTime(currentTime)}</p><p className="text-xs text-muted-foreground">Elapsed</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><User className="mx-auto mb-1 h-5 w-5 text-green-500" /><p className="text-lg font-bold">{contributors}</p><p className="text-xs text-muted-foreground">Builders</p></CardContent></Card>
              </div>

              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <Badge variant="outline">{visibleCount} / {events.length} pieces</Badge>
                    <span>{formatTime(totalDuration)}</span>
                  </div>
                  <Slider value={[visibleCount]} onValueChange={value => { setIsPlaying(false); setVisibleCount(value[0]); }} max={events.length} step={1} />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={reset} aria-label="Reset replay"><RotateCcw className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => { setIsPlaying(false); setVisibleCount(value => Math.max(0, value - 10)); }} aria-label="Rewind ten pieces"><Rewind className="h-4 w-4" /></Button>
                    <Button size="lg" className="h-14 w-14 rounded-full" onClick={handlePlayPause} aria-label={isPlaying ? "Pause replay" : "Play replay"}>
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => { setIsPlaying(false); setVisibleCount(value => Math.min(events.length, value + 10)); }} aria-label="Advance ten pieces"><FastForward className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground">Speed:</span>
                    {[0.5, 1, 2, 4].map(speed => (
                      <Button key={speed} variant={playbackSpeed === speed ? "default" : "outline"} size="sm" onClick={() => setPlaybackSpeed(speed)}>{speed}x</Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="mb-2 font-medium">Recorded activity</h4>
                  <div className="max-h-36 space-y-2 overflow-y-auto">
                    {visibleEvents.slice(-6).reverse().map(event => (
                      <div key={event.id} className="flex items-center gap-2 text-sm">
                        <span>{event.agentEmoji}</span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">{event.agentName}</span>
                        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: event.color }} />
                        <span className="text-xs text-muted-foreground">{formatTime(event.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
