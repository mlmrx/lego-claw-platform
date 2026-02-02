/**
 * Build Replay Component
 * Allows users to watch a time-lapse replay of how builds were constructed brick-by-brick
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  FastForward,
  Rewind,
  RotateCcw,
  Box,
  Clock,
  User
} from "lucide-react";

// Simulated brick placement data for replay
interface BrickPlacement {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
  agentName: string;
  agentEmoji: string;
  timestamp: number; // ms from start
}

interface BuildReplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildName: string;
  buildId: string;
  totalBricks: number;
}

// Generate simulated replay data
const generateReplayData = (totalBricks: number): BrickPlacement[] => {
  const colors = ["#ff0000", "#0000ff", "#00ff00", "#ffff00", "#ff8800", "#ffffff", "#808080"];
  const agents = [
    { name: "Brick Master", emoji: "🧱" },
    { name: "Color Wizard", emoji: "🎨" },
    { name: "Mega Builder", emoji: "🏗️" },
    { name: "Space Explorer", emoji: "🚀" },
  ];
  
  const bricks: BrickPlacement[] = [];
  let currentZ = 0;
  let bricksInLayer = 0;
  const maxBricksPerLayer = 16;
  
  for (let i = 0; i < totalBricks; i++) {
    const layerX = bricksInLayer % 4;
    const layerY = Math.floor(bricksInLayer / 4) % 4;
    
    bricks.push({
      id: i,
      x: layerX,
      y: layerY,
      z: currentZ,
      color: colors[Math.floor(Math.random() * colors.length)],
      agentName: agents[i % agents.length].name,
      agentEmoji: agents[i % agents.length].emoji,
      timestamp: i * 200 + Math.random() * 100, // ~200ms per brick
    });
    
    bricksInLayer++;
    if (bricksInLayer >= maxBricksPerLayer) {
      bricksInLayer = 0;
      currentZ++;
    }
  }
  
  return bricks;
};

export function BuildReplay({ open, onOpenChange, buildName, buildId, totalBricks }: BuildReplayProps) {
  const [replayData] = useState(() => generateReplayData(Math.min(totalBricks, 100)));
  const [currentBrickIndex, setCurrentBrickIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [visibleBricks, setVisibleBricks] = useState<BrickPlacement[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = replayData.length > 0 ? replayData[replayData.length - 1].timestamp : 0;
  const currentTime = currentBrickIndex < replayData.length ? replayData[currentBrickIndex].timestamp : totalDuration;

  // Update visible bricks based on current index
  useEffect(() => {
    setVisibleBricks(replayData.slice(0, currentBrickIndex + 1));
  }, [currentBrickIndex, replayData]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && currentBrickIndex < replayData.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentBrickIndex(prev => {
          if (prev >= replayData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200 / playbackSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, replayData.length, currentBrickIndex]);

  const handlePlayPause = useCallback(() => {
    if (currentBrickIndex >= replayData.length - 1) {
      setCurrentBrickIndex(0);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentBrickIndex, replayData.length]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentBrickIndex(0);
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    setCurrentBrickIndex(value[0]);
  }, []);

  const handleSkipBack = useCallback(() => {
    setCurrentBrickIndex(prev => Math.max(0, prev - 10));
  }, []);

  const handleSkipForward = useCallback(() => {
    setCurrentBrickIndex(prev => Math.min(replayData.length - 1, prev + 10));
  }, [replayData.length]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const currentBrick = replayData[currentBrickIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Build Replay: {buildName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 3D-ish Visualization */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div 
                className="relative w-full aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-lg overflow-hidden"
                style={{ perspective: "500px" }}
              >
                {/* Base plate */}
                <div 
                  className="absolute inset-4 bg-green-500 rounded"
                  style={{ 
                    transform: "rotateX(60deg) rotateZ(-45deg)",
                    transformOrigin: "center center"
                  }}
                />
                
                {/* Bricks */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="relative w-32 h-32"
                    style={{ 
                      transform: "rotateX(60deg) rotateZ(-45deg)",
                      transformOrigin: "center center"
                    }}
                  >
                    <AnimatePresence>
                      {visibleBricks.map((brick, index) => (
                        <motion.div
                          key={brick.id}
                          initial={{ opacity: 0, y: -50, scale: 0.5 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute w-6 h-6 rounded-sm shadow-md"
                          style={{
                            backgroundColor: brick.color,
                            left: `${brick.x * 28}px`,
                            top: `${brick.y * 28}px`,
                            transform: `translateZ(${brick.z * 8}px)`,
                            zIndex: brick.z * 10 + index,
                            boxShadow: `0 ${2 + brick.z}px ${4 + brick.z * 2}px rgba(0,0,0,0.2)`,
                          }}
                        >
                          {/* Stud */}
                          <div 
                            className="absolute w-2 h-2 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{ 
                              backgroundColor: brick.color,
                              filter: "brightness(1.2)",
                              boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.3)"
                            }}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Current brick indicator */}
                {currentBrick && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-2 left-2 right-2 bg-black/70 text-white p-2 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currentBrick.agentEmoji}</span>
                      <span>{currentBrick.agentName} placed brick #{currentBrick.id + 1}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls & Info */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <Box className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{visibleBricks.length}</p>
                  <p className="text-xs text-muted-foreground">Bricks Placed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-bold">{formatTime(currentTime)}</p>
                  <p className="text-xs text-muted-foreground">Elapsed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <User className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">4</p>
                  <p className="text-xs text-muted-foreground">Builders</p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <Badge variant="outline">{visibleBricks.length} / {replayData.length} bricks</Badge>
                  <span>{formatTime(totalDuration)}</span>
                </div>
                <Slider
                  value={[currentBrickIndex]}
                  onValueChange={handleSeek}
                  max={replayData.length - 1}
                  step={1}
                  className="cursor-pointer"
                />
              </CardContent>
            </Card>

            {/* Playback Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleSkipBack}>
                    <Rewind className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    className="w-14 h-14 rounded-full"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleSkipForward}>
                    <FastForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-sm text-muted-foreground">Speed:</span>
                  {[0.5, 1, 2, 4].map(speed => (
                    <Button
                      key={speed}
                      variant={playbackSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Recent Activity</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {visibleBricks.slice(-5).reverse().map(brick => (
                    <div key={brick.id} className="flex items-center gap-2 text-sm">
                      <span>{brick.agentEmoji}</span>
                      <span className="text-muted-foreground">{brick.agentName}</span>
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: brick.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        @ {formatTime(brick.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
