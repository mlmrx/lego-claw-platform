/**
 * Builder Page
 * Interactive LEGO builder with drag-and-drop brick placement and AI assistant.
 * Users can manually build, and AI agents suggest next placements.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { nanoid } from "nanoid";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  InteractiveBuilder,
  BuilderBrick,
  BRICK_TYPES,
  BrickType,
} from "@/components/InteractiveBuilder";
import { LEGO_COLORS } from "@/components/LegoBrick3D";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Undo2,
  Redo2,
  Trash2,
  Save,
  FolderOpen,
  Sparkles,
  Loader2,
  MousePointer,
  Send,
  Lightbulb,
  ArrowLeft,
  Download,
  RotateCcw,
  Palette,
  Box,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Wand2,
} from "lucide-react";

const COLOR_OPTIONS = [
  { name: "Red", value: LEGO_COLORS.red },
  { name: "Blue", value: LEGO_COLORS.blue },
  { name: "Yellow", value: LEGO_COLORS.yellow },
  { name: "Green", value: LEGO_COLORS.green },
  { name: "Orange", value: LEGO_COLORS.orange },
  { name: "White", value: LEGO_COLORS.white },
  { name: "Black", value: LEGO_COLORS.black },
  { name: "Gray", value: LEGO_COLORS.gray },
  { name: "Dark Gray", value: LEGO_COLORS.darkGray },
  { name: "Brown", value: LEGO_COLORS.brown },
  { name: "Tan", value: LEGO_COLORS.tan },
  { name: "Lime", value: LEGO_COLORS.lime },
  { name: "Pink", value: LEGO_COLORS.pink },
  { name: "Purple", value: LEGO_COLORS.purple },
  { name: "Cyan", value: LEGO_COLORS.cyan },
];

interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedBricks?: Array<{
    position: [number, number, number];
    color: string;
    width: number;
    depth: number;
    height: number;
  }>;
}

export default function Builder() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ projectId?: string }>();

  // Build state
  const [bricks, setBricks] = useState<BuilderBrick[]>([]);
  const [undoStack, setUndoStack] = useState<BuilderBrick[][]>([]);
  const [redoStack, setRedoStack] = useState<BuilderBrick[][]>([]);
  const [selectedColor, setSelectedColor] = useState(LEGO_COLORS.red);
  const [selectedBrickType, setSelectedBrickType] = useState<BrickType>(BRICK_TYPES[1]); // 2x1
  const [deleteMode, setDeleteMode] = useState(false);
  const [highlightedBrickIds, setHighlightedBrickIds] = useState<string[]>([]);

  // Project state
  const [projectName, setProjectName] = useState("My LEGO Build");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectId, setProjectId] = useState<string | null>(params.projectId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // AI assistant state
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your LEGO building assistant. I can help you with:\n\n- **Suggest next bricks** based on what you've built\n- **Complete a pattern** you've started\n- **Design ideas** for your build\n- **Color recommendations**\n\nJust describe what you want to build or ask for help!",
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Panel state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // tRPC mutations
  const saveBuildMutation = trpc.builder.saveBuild.useMutation({
    onSuccess: (data) => {
      setProjectId(data.publicId);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      setSaveDialogOpen(false);
      toast.success("Build saved successfully!");
    },
    onError: (err) => {
      setIsSaving(false);
      toast.error(err.message || "Failed to save build");
    },
  });

  const aiSuggestMutation = trpc.builder.aiSuggest.useMutation({
    onSuccess: (data) => {
      const assistantMsg: AIChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: data.message,
        suggestedBricks: data.suggestedBricks,
      };
      setAiMessages((prev) => [...prev, assistantMsg]);
      if (data.suggestedBricks && data.suggestedBricks.length > 0) {
        // Highlight suggested positions
        setHighlightedBrickIds([]);
      }
      setAiLoading(false);
    },
    onError: (err) => {
      setAiMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        },
      ]);
      setAiLoading(false);
    },
  });

  // Load existing project
  const loadBuildQuery = trpc.builder.loadBuild.useQuery(
    { publicId: projectId! },
    {
      enabled: !!projectId && !!isAuthenticated,
      retry: false,
    }
  );

  useEffect(() => {
    if (loadBuildQuery.data) {
      setProjectName(loadBuildQuery.data.name);
      setProjectDescription(loadBuildQuery.data.description || "");
      if (loadBuildQuery.data.brickData) {
        try {
          const loaded = JSON.parse(loadBuildQuery.data.brickData as string);
          if (Array.isArray(loaded)) {
            setBricks(
              loaded.map((b: any) => ({
                id: b.id || nanoid(),
                position: b.position as [number, number, number],
                color: b.color,
                width: b.width || 2,
                depth: b.depth || 1,
                height: b.height || 3,
                placedAt: b.placedAt || Date.now() - 10000,
              }))
            );
          }
        } catch {
          // Invalid brick data
        }
      }
    }
  }, [loadBuildQuery.data]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // Place brick
  const handlePlaceBrick = useCallback(
    (brick: Omit<BuilderBrick, "id" | "placedAt">) => {
      setUndoStack((prev) => [...prev, bricks]);
      setRedoStack([]);
      const newBrick: BuilderBrick = {
        ...brick,
        id: nanoid(),
        placedAt: Date.now(),
      };
      setBricks((prev) => [...prev, newBrick]);
      setHasUnsavedChanges(true);
    },
    [bricks]
  );

  // Delete brick
  const handleDeleteBrick = useCallback(
    (id: string) => {
      setUndoStack((prev) => [...prev, bricks]);
      setRedoStack([]);
      setBricks((prev) => prev.filter((b) => b.id !== id));
      setHasUnsavedChanges(true);
    },
    [bricks]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, bricks]);
    setUndoStack((u) => u.slice(0, -1));
    setBricks(prev);
    setHasUnsavedChanges(true);
  }, [undoStack, bricks]);

  // Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, bricks]);
    setRedoStack((r) => r.slice(0, -1));
    setBricks(next);
    setHasUnsavedChanges(true);
  }, [redoStack, bricks]);

  // Clear all
  const handleClear = useCallback(() => {
    if (bricks.length === 0) return;
    setUndoStack((prev) => [...prev, bricks]);
    setRedoStack([]);
    setBricks([]);
    setHasUnsavedChanges(true);
    toast.info("Build cleared");
  }, [bricks]);

  // Save build
  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save your build");
      return;
    }
    setIsSaving(true);
    saveBuildMutation.mutate({
      publicId: projectId || undefined,
      name: projectName,
      description: projectDescription,
      brickData: bricks,
    });
  }, [isAuthenticated, projectId, projectName, projectDescription, bricks, saveBuildMutation]);

  // AI chat send
  const handleAiSend = useCallback(() => {
    if (!aiInput.trim() || aiLoading) return;

    const userMsg: AIChatMessage = {
      id: nanoid(),
      role: "user",
      content: aiInput.trim(),
    };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);

    aiSuggestMutation.mutate({
      message: aiInput.trim(),
      currentBricks: bricks.map((b) => ({
        position: b.position,
        color: b.color,
        width: b.width,
        depth: b.depth,
        height: b.height,
      })),
      projectName,
      chatHistory: aiMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  }, [aiInput, aiLoading, bricks, projectName, aiMessages, aiSuggestMutation]);

  // Apply AI suggested bricks
  const handleApplySuggestion = useCallback(
    (suggestedBricks: AIChatMessage["suggestedBricks"]) => {
      if (!suggestedBricks || suggestedBricks.length === 0) return;
      setUndoStack((prev) => [...prev, bricks]);
      setRedoStack([]);
      const newBricks = suggestedBricks.map((sb) => ({
        id: nanoid(),
        position: sb.position as [number, number, number],
        color: sb.color,
        width: sb.width,
        depth: sb.depth,
        height: sb.height,
        placedAt: Date.now(),
      }));
      setBricks((prev) => [...prev, ...newBricks]);
      setHasUnsavedChanges(true);
      toast.success(`Applied ${newBricks.length} suggested brick(s)`);
    },
    [bricks]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if (e.key === "d" || e.key === "D") {
        setDeleteMode((prev) => !prev);
      }
      if (e.key === "Escape") {
        setDeleteMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Auth check
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Box className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Sign In to Build</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Create and save your own LEGO builds with AI assistance
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top toolbar */}
      <div className="h-12 border-b border-border bg-card flex items-center px-3 gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/build")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm font-medium truncate">{projectName}</span>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs flex-shrink-0">
              Unsaved
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={deleteMode ? "destructive" : "ghost"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setDeleteMode(!deleteMode)}
            title="Delete mode (D)"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{deleteMode ? "Deleting" : "Delete"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={handleClear}
            title="Clear all"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="h-8 gap-1.5">
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Build</DialogTitle>
                <DialogDescription>
                  Give your build a name and description to save it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="build-name">Build Name</Label>
                  <Input
                    id="build-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My awesome LEGO build"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="build-desc">Description (optional)</Label>
                  <Textarea
                    id="build-desc"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe what you're building..."
                    rows={3}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {bricks.length} brick{bricks.length !== 1 ? "s" : ""} placed
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !projectName.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Badge variant="secondary" className="text-xs">
            {bricks.length} bricks
          </Badge>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Brick palette */}
        <div
          className={`${
            leftPanelOpen ? "w-56" : "w-0"
          } transition-all duration-200 border-r border-border bg-card flex-shrink-0 overflow-hidden`}
        >
          <div className="w-56 h-full flex flex-col overflow-y-auto p-3 gap-4">
            {/* Colors */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Colors
              </h3>
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                      selectedColor === c.value
                        ? "border-foreground ring-2 ring-primary/30 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setSelectedColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Brick types */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" />
                Brick Types
              </h3>
              <div className="space-y-1">
                {BRICK_TYPES.map((bt) => (
                  <button
                    key={bt.name}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                      selectedBrickType.name === bt.name
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedBrickType(bt)}
                  >
                    <span className="text-lg w-5 text-center">{bt.icon}</span>
                    <span>{bt.name}</span>
                    <span className="text-xs opacity-60 ml-auto">
                      {bt.width}x{bt.depth}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Mode indicator */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Current Mode
              </h3>
              <div
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  deleteMode
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                {deleteMode ? (
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Mode
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4" /> Build Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {deleteMode
                  ? "Click bricks to remove them. Press D or Esc to exit."
                  : "Click on the grid to place bricks. Right-click to orbit. Press D to delete."}
              </p>
            </div>

            {/* Keyboard shortcuts */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Shortcuts
              </h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Undo</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Z</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Redo</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Shift+Z</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Delete mode</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">D</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Exit delete</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle left panel */}
        <button
          className="w-5 flex items-center justify-center border-r border-border bg-card hover:bg-muted transition-colors flex-shrink-0"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        >
          {leftPanelOpen ? (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <InteractiveBuilder
            bricks={bricks}
            onPlaceBrick={handlePlaceBrick}
            onDeleteBrick={handleDeleteBrick}
            selectedColor={selectedColor}
            selectedBrickType={selectedBrickType}
            deleteMode={deleteMode}
            highlightedBrickIds={highlightedBrickIds}
          />

          {/* Floating brick count */}
          {bricks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-card/80 backdrop-blur-sm px-6 py-4 rounded-xl border border-border text-center">
                <Box className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Click on the green baseplate to place bricks</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose colors and brick types from the left panel
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Toggle right panel */}
        <button
          className="w-5 flex items-center justify-center border-l border-border bg-card hover:bg-muted transition-colors flex-shrink-0"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
        >
          {rightPanelOpen ? (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {/* Right panel: AI Assistant */}
        <div
          className={`${
            rightPanelOpen ? "w-72" : "w-0"
          } transition-all duration-200 border-l border-border bg-card flex-shrink-0 overflow-hidden`}
        >
          <div className="w-72 h-full flex flex-col">
            {/* AI header */}
            <div className="p-3 border-b border-border flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">AI Assistant</h3>
                <p className="text-[10px] text-muted-foreground">Ask for building help</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-2 border-b border-border flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  setAiInput("Suggest what I should build next based on what I have so far");
                  setTimeout(() => handleAiSend(), 100);
                }}
                disabled={aiLoading}
              >
                <Lightbulb className="w-3 h-3" />
                Suggest next
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  setAiInput("Complete the pattern I've started and add more bricks");
                  setTimeout(() => handleAiSend(), 100);
                }}
                disabled={aiLoading}
              >
                <Wand2 className="w-3 h-3" />
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  setAiInput("Suggest better colors for my current build");
                  setTimeout(() => handleAiSend(), 100);
                }}
                disabled={aiLoading}
              >
                <Palette className="w-3 h-3" />
                Colors
              </Button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${
                    msg.role === "user" ? "ml-6" : "mr-2"
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                  {msg.suggestedBricks && msg.suggestedBricks.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1.5 h-7 text-xs gap-1 w-full"
                      onClick={() => handleApplySuggestion(msg.suggestedBricks)}
                    >
                      <Download className="w-3 h-3" />
                      Apply {msg.suggestedBricks.length} suggested brick
                      {msg.suggestedBricks.length !== 1 ? "s" : ""}
                    </Button>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div className="mr-2">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-2 border-t border-border">
              <form
                className="flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAiSend();
                }}
              >
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask for help..."
                  className="h-8 text-sm"
                  disabled={aiLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  disabled={!aiInput.trim() || aiLoading}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
