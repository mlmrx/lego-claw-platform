/**
 * Builder Page - Legoland-Scale Advanced Builder
 * Full brick catalog with 100+ pieces, themed collections, prefab structures,
 * specialty shapes, and AI assistant.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { nanoid } from "nanoid";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  InteractiveBuilder,
  BuilderBrick,
  BrickType,
} from "@/components/InteractiveBuilder";
import {
  BRICK_CATALOG,
  THEME_COLLECTIONS,
  EXTENDED_COLORS,
  CATEGORY_INFO,
  getBricksByCategory,
  getThemeById,
  getRecommendedBricks,
  getAllCategories,
  type CatalogBrick,
  type BrickCategory,
  type ThemeCollection,
  type PrefabStructure,
  type BrickShape,
} from "@/lib/brickCatalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Undo2,
  Redo2,
  Trash2,
  Save,
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
  ChevronLeft,
  ChevronRight,
  Wand2,
  Layers,
  Stamp,
  Search,
  X,
  Grid3X3,
  Castle,
  Flame,
  TreePine,
  Anchor,
  Rocket,
  Car,
  Building2,
  Waves,
  Landmark,
  Sword,
  Bug,
} from "lucide-react";

// ============================================
// COLOR GROUPS
// ============================================

const COLOR_GROUPS = [
  {
    name: "Classic",
    colors: [
      { name: "Red", value: EXTENDED_COLORS.red },
      { name: "Bright Red", value: EXTENDED_COLORS.brightRed },
      { name: "Dark Red", value: EXTENDED_COLORS.darkRed },
      { name: "Blue", value: EXTENDED_COLORS.blue },
      { name: "Dark Blue", value: EXTENDED_COLORS.darkBlue },
      { name: "Medium Blue", value: EXTENDED_COLORS.mediumBlue },
      { name: "Royal Blue", value: EXTENDED_COLORS.royalBlue },
      { name: "Yellow", value: EXTENDED_COLORS.yellow },
      { name: "Bright Yellow", value: EXTENDED_COLORS.brightYellow },
      { name: "Orange", value: EXTENDED_COLORS.orange },
      { name: "Dark Orange", value: EXTENDED_COLORS.darkOrange },
    ],
  },
  {
    name: "Green & Nature",
    colors: [
      { name: "Green", value: EXTENDED_COLORS.green },
      { name: "Bright Green", value: EXTENDED_COLORS.brightGreen },
      { name: "Dark Green", value: EXTENDED_COLORS.darkGreen },
      { name: "Lime", value: EXTENDED_COLORS.lime },
      { name: "Sand Green", value: EXTENDED_COLORS.sandGreen },
      { name: "Olive", value: EXTENDED_COLORS.olive },
      { name: "Teal", value: EXTENDED_COLORS.teal },
      { name: "Aqua", value: EXTENDED_COLORS.aqua },
      { name: "Cyan", value: EXTENDED_COLORS.cyan },
    ],
  },
  {
    name: "Neutral",
    colors: [
      { name: "White", value: EXTENDED_COLORS.white },
      { name: "Black", value: EXTENDED_COLORS.black },
      { name: "Gray", value: EXTENDED_COLORS.gray },
      { name: "Dark Gray", value: EXTENDED_COLORS.darkGray },
      { name: "Light Gray", value: EXTENDED_COLORS.lightGray },
      { name: "Brown", value: EXTENDED_COLORS.brown },
      { name: "Dark Brown", value: EXTENDED_COLORS.darkBrown },
      { name: "Reddish Brown", value: EXTENDED_COLORS.reddishBrown },
      { name: "Tan", value: EXTENDED_COLORS.tan },
      { name: "Sand", value: EXTENDED_COLORS.sand },
      { name: "Nougat", value: EXTENDED_COLORS.nougat },
    ],
  },
  {
    name: "Warm & Cool",
    colors: [
      { name: "Pink", value: EXTENDED_COLORS.pink },
      { name: "Magenta", value: EXTENDED_COLORS.magenta },
      { name: "Purple", value: EXTENDED_COLORS.purple },
      { name: "Lavender", value: EXTENDED_COLORS.lavender },
    ],
  },
  {
    name: "Metallic",
    colors: [
      { name: "Gold", value: EXTENDED_COLORS.gold },
      { name: "Silver", value: EXTENDED_COLORS.silver },
      { name: "Copper", value: EXTENDED_COLORS.copper },
      { name: "Pearl", value: EXTENDED_COLORS.pearl },
    ],
  },
  {
    name: "Transparent",
    colors: [
      { name: "Trans Red", value: EXTENDED_COLORS.transRed },
      { name: "Trans Blue", value: EXTENDED_COLORS.transBlue },
      { name: "Trans Yellow", value: EXTENDED_COLORS.transYellow },
      { name: "Trans Green", value: EXTENDED_COLORS.transGreen },
      { name: "Trans Orange", value: EXTENDED_COLORS.transOrange },
      { name: "Trans Clear", value: EXTENDED_COLORS.transClear },
    ],
  },
];

// Theme icons mapping
const THEME_ICONS: Record<string, React.ReactNode> = {
  ninjago: <Sword className="w-4 h-4" />,
  dinosaurs: <Bug className="w-4 h-4" />,
  galaxy: <Rocket className="w-4 h-4" />,
  city: <Building2 className="w-4 h-4" />,
  pirates: <Anchor className="w-4 h-4" />,
  castle: <Castle className="w-4 h-4" />,
  nature: <TreePine className="w-4 h-4" />,
  waterpark: <Waves className="w-4 h-4" />,
  monuments: <Landmark className="w-4 h-4" />,
};

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
  const [selectedColor, setSelectedColor] = useState(EXTENDED_COLORS.red);
  const [selectedCatalogBrick, setSelectedCatalogBrick] = useState<CatalogBrick>(BRICK_CATALOG[1]); // 2x1
  const [deleteMode, setDeleteMode] = useState(false);
  const [highlightedBrickIds, setHighlightedBrickIds] = useState<string[]>([]);

  // Catalog browsing state
  const [activeCategory, setActiveCategory] = useState<BrickCategory>("basic");
  const [activeTheme, setActiveTheme] = useState<ThemeCollection | null>(null);
  const [brickSearch, setBrickSearch] = useState("");
  const [leftTab, setLeftTab] = useState<"bricks" | "themes" | "colors">("bricks");

  // Project state
  const [projectName, setProjectName] = useState("My Krewdoo Model");
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
        "Hi! I'm your modular building assistant. I can help you with:\n\n- **Suggest next pieces** based on what you've assembled\n- **Complete a pattern** you've started\n- **Design ideas** for any theme\n- **Color recommendations**\n\nTry selecting a theme from the left panel, or start creating!",
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Panel state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Convert CatalogBrick to BrickType for InteractiveBuilder
  const selectedBrickType: BrickType = useMemo(
    () => ({
      name: selectedCatalogBrick.name,
      width: selectedCatalogBrick.width,
      depth: selectedCatalogBrick.depth,
      height: selectedCatalogBrick.height,
      icon: selectedCatalogBrick.icon,
      shape: selectedCatalogBrick.shape,
    }),
    [selectedCatalogBrick]
  );

  // Filtered bricks based on category and search
  const filteredBricks = useMemo(() => {
    let results: CatalogBrick[];
    if (activeTheme) {
      results = getRecommendedBricks(activeTheme.id);
      if (results.length === 0) results = getBricksByCategory(activeCategory);
    } else {
      results = getBricksByCategory(activeCategory);
    }
    if (brickSearch.trim()) {
      const q = brickSearch.toLowerCase();
      results = BRICK_CATALOG.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.shape.toLowerCase().includes(q)
      );
    }
    return results;
  }, [activeCategory, activeTheme, brickSearch]);

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
                shape: b.shape || "standard",
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

  // Stamp prefab structure
  const handleStampPrefab = useCallback(
    (prefab: PrefabStructure) => {
      setUndoStack((prev) => [...prev, bricks]);
      setRedoStack([]);
      const newBricks: BuilderBrick[] = prefab.bricks.map((pb) => ({
        id: nanoid(),
        position: pb.position,
        color: pb.color,
        width: pb.width,
        depth: pb.depth,
        height: pb.height,
        shape: pb.shape,
        placedAt: Date.now(),
      }));
      setBricks((prev) => [...prev, ...newBricks]);
      setHasUnsavedChanges(true);
      toast.success(`Stamped "${prefab.name}" (${newBricks.length} bricks)`);
    },
    [bricks]
  );

  // Apply theme
  const handleApplyTheme = useCallback(
    (theme: ThemeCollection) => {
      setActiveTheme(theme);
      // Set first theme color as selected
      if (theme.colors.length > 0) {
        setSelectedColor(theme.colors[0]);
      }
      // Switch to recommended bricks
      const recommended = getRecommendedBricks(theme.id);
      if (recommended.length > 0) {
        setSelectedCatalogBrick(recommended[0]);
      }
      toast.success(`Theme: ${theme.name} activated`);
    },
    []
  );

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

    const themeContext = activeTheme ? ` The user is building with the "${activeTheme.name}" theme.` : "";

    aiSuggestMutation.mutate({
      message: aiInput.trim() + themeContext,
      currentBricks: bricks.map((b) => ({
        position: b.position,
        color: b.color,
        width: b.width,
        depth: b.depth,
        height: b.height,
      })),
      projectName,
      theme: activeTheme?.id,
      chatHistory: aiMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  }, [aiInput, aiLoading, bricks, projectName, aiMessages, aiSuggestMutation, activeTheme]);

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
              Create and save modular models with an AI crew beside you
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

  const categories = getAllCategories();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ============ TOP TOOLBAR ============ */}
      <div className="h-12 border-b border-border bg-card flex items-center px-3 gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/build")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm font-medium truncate">{projectName}</span>
          {activeTheme && (
            <Badge variant="secondary" className="text-[10px] gap-1 flex-shrink-0">
              {THEME_ICONS[activeTheme.id] || <Layers className="w-3 h-3" />}
              {activeTheme.name}
            </Badge>
          )}
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs flex-shrink-0">
              Unsaved
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={undoStack.length === 0}>
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={redoStack.length === 0}>
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={deleteMode ? "destructive" : "ghost"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setDeleteMode(!deleteMode)}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{deleteMode ? "Deleting" : "Delete"}</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={handleClear}>
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
                <DialogDescription>Give your build a name and description to save it.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="build-name">Build Name</Label>
                  <Input
                    id="build-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My awesome modular model"
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

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============ LEFT PANEL ============ */}
        <div
          className={`${leftPanelOpen ? "w-72" : "w-0"} transition-all duration-200 border-r border-border bg-card flex-shrink-0 overflow-hidden`}
        >
          <div className="w-72 h-full flex flex-col">
            {/* Tabs: Bricks | Themes | Colors */}
            <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as any)} className="flex flex-col h-full">
              <TabsList className="w-full rounded-none border-b border-border h-9 bg-transparent p-0">
                <TabsTrigger value="bricks" className="flex-1 rounded-none h-9 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                  <Grid3X3 className="w-3.5 h-3.5 mr-1" />
                  Bricks
                </TabsTrigger>
                <TabsTrigger value="themes" className="flex-1 rounded-none h-9 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Themes
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex-1 rounded-none h-9 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                  <Palette className="w-3.5 h-3.5 mr-1" />
                  Colors
                </TabsTrigger>
              </TabsList>

              {/* ---- BRICKS TAB ---- */}
              <TabsContent value="bricks" className="flex-1 flex flex-col mt-0 overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={brickSearch}
                      onChange={(e) => setBrickSearch(e.target.value)}
                      placeholder="Search bricks..."
                      className="h-8 text-xs pl-8 pr-8"
                    />
                    {brickSearch && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setBrickSearch("")}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category tabs */}
                {!brickSearch && (
                  <ScrollArea className="border-b border-border">
                    <div className="flex gap-1 p-2 pb-1.5">
                      {categories.map((cat) => {
                        const info = CATEGORY_INFO[cat];
                        return (
                          <Tooltip key={cat}>
                            <TooltipTrigger asChild>
                              <button
                                className={`flex-shrink-0 px-2 py-1 rounded-md text-xs transition-colors ${
                                  activeCategory === cat && !activeTheme
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                }`}
                                onClick={() => {
                                  setActiveCategory(cat);
                                  setActiveTheme(null);
                                  setBrickSearch("");
                                }}
                              >
                                <span className="text-sm">{info.icon}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {info.name}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Category header */}
                {!brickSearch && !activeTheme && (
                  <div className="px-3 py-1.5 border-b border-border">
                    <h3 className="text-xs font-semibold">{CATEGORY_INFO[activeCategory].name}</h3>
                    <p className="text-[10px] text-muted-foreground">{CATEGORY_INFO[activeCategory].description}</p>
                  </div>
                )}

                {activeTheme && !brickSearch && (
                  <div className="px-3 py-1.5 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold flex items-center gap-1">
                        {THEME_ICONS[activeTheme.id]}
                        {activeTheme.name} Bricks
                      </h3>
                      <p className="text-[10px] text-muted-foreground">Recommended pieces for this theme</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setActiveTheme(null)}>
                      Clear
                    </Button>
                  </div>
                )}

                {brickSearch && (
                  <div className="px-3 py-1.5 border-b border-border">
                    <h3 className="text-xs font-semibold">Search Results</h3>
                    <p className="text-[10px] text-muted-foreground">{filteredBricks.length} bricks found</p>
                  </div>
                )}

                {/* Brick list */}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-0.5">
                    {filteredBricks.map((brick) => (
                      <button
                        key={brick.id}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors group ${
                          selectedCatalogBrick.id === brick.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedCatalogBrick(brick)}
                      >
                        <span className="text-base w-5 text-center flex-shrink-0">{brick.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{brick.name}</div>
                          <div className={`text-[10px] ${selectedCatalogBrick.id === brick.id ? "opacity-70" : "text-muted-foreground"}`}>
                            {brick.width}x{brick.depth} {brick.shape !== "standard" ? `(${brick.shape})` : ""}
                          </div>
                        </div>
                        {/* Color preview dot */}
                        <div
                          className="w-4 h-4 rounded-sm flex-shrink-0 border border-white/20"
                          style={{ backgroundColor: selectedColor }}
                        />
                      </button>
                    ))}
                    {filteredBricks.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground text-xs">
                        No bricks found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* ---- THEMES TAB ---- */}
              <TabsContent value="themes" className="flex-1 flex flex-col mt-0 overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {THEME_COLLECTIONS.map((theme) => (
                      <div key={theme.id} className="space-y-1.5">
                        {/* Theme header */}
                        <button
                          className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                            activeTheme?.id === theme.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                          onClick={() => handleApplyTheme(theme)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{theme.icon}</span>
                            <span className="text-sm font-semibold">{theme.name}</span>
                            {activeTheme?.id === theme.id && (
                              <Badge variant="default" className="text-[9px] h-4 ml-auto">Active</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{theme.description}</p>
                          {/* Color palette preview */}
                          <div className="flex gap-1 mt-1.5">
                            {theme.colors.slice(0, 6).map((c, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-sm border border-white/20"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>

                        {/* Prefab structures (shown when theme is active) */}
                        {activeTheme?.id === theme.id && theme.prefabs.length > 0 && (
                          <div className="pl-2 space-y-1">
                            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 px-1">
                              <Stamp className="w-3 h-3" />
                              Prefab Structures
                            </h4>
                            {theme.prefabs.map((prefab) => (
                              <button
                                key={prefab.id}
                                className="w-full text-left px-2.5 py-2 rounded-md text-xs hover:bg-muted transition-colors border border-dashed border-border hover:border-primary/50 group"
                                onClick={() => handleStampPrefab(prefab)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{prefab.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{prefab.name}</div>
                                    <div className="text-[10px] text-muted-foreground">{prefab.description}</div>
                                  </div>
                                  <Badge variant="outline" className="text-[9px] h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {prefab.bricks.length} bricks
                                  </Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* ---- COLORS TAB ---- */}
              <TabsContent value="colors" className="flex-1 flex flex-col mt-0 overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-4">
                    {/* Theme colors (if active) */}
                    {activeTheme && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                          {THEME_ICONS[activeTheme.id]}
                          {activeTheme.name} Palette
                        </h3>
                        <div className="grid grid-cols-6 gap-1.5">
                          {activeTheme.colors.map((c, i) => (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <button
                                  className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                                    selectedColor === c
                                      ? "border-foreground ring-2 ring-primary/30 scale-110"
                                      : "border-transparent"
                                  }`}
                                  style={{ backgroundColor: c }}
                                  onClick={() => setSelectedColor(c)}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">{c}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                        <Separator className="mt-3" />
                      </div>
                    )}

                    {/* All color groups */}
                    {COLOR_GROUPS.map((group) => (
                      <div key={group.name}>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {group.name}
                        </h3>
                        <div className="grid grid-cols-6 gap-1.5">
                          {group.colors.map((c) => (
                            <Tooltip key={c.value}>
                              <TooltipTrigger asChild>
                                <button
                                  className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                                    selectedColor === c.value
                                      ? "border-foreground ring-2 ring-primary/30 scale-110"
                                      : "border-transparent"
                                  }`}
                                  style={{ backgroundColor: c.value }}
                                  onClick={() => setSelectedColor(c.value)}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">{c.name}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
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

        {/* ============ 3D CANVAS ============ */}
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

          {/* Empty state overlay */}
          {bricks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-card/80 backdrop-blur-sm px-6 py-4 rounded-xl border border-border text-center max-w-sm">
                <Box className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Click on the green baseplate to place bricks</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Browse 100+ brick types, 9 themed collections, and prefab structures in the left panel
                </p>
              </div>
            </div>
          )}

          {/* Mode indicator floating badge */}
          <div className="absolute bottom-3 left-3">
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm ${
                deleteMode
                  ? "bg-red-500/90 text-white"
                  : "bg-green-500/90 text-white"
              }`}
            >
              {deleteMode ? (
                <span className="flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Mode (D)
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5" /> Build Mode
                </span>
              )}
            </div>
          </div>

          {/* Selected brick info floating */}
          <div className="absolute top-3 left-3">
            <div className="bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border shadow-sm flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded border border-white/20" style={{ backgroundColor: selectedColor }} />
              <span className="font-medium">{selectedCatalogBrick.name}</span>
              <span className="text-muted-foreground">
                {selectedCatalogBrick.width}x{selectedCatalogBrick.depth}
              </span>
              {selectedCatalogBrick.shape !== "standard" && (
                <Badge variant="outline" className="text-[9px] h-4">
                  {selectedCatalogBrick.shape}
                </Badge>
              )}
            </div>
          </div>

          {/* Keyboard shortcuts floating */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-border shadow-sm text-[10px] text-muted-foreground space-y-0.5">
              <div className="flex gap-3">
                <span><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Z</kbd> Undo</span>
                <span><kbd className="px-1 py-0.5 bg-muted rounded">D</kbd> Delete</span>
                <span><kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Exit</span>
              </div>
            </div>
          </div>
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

        {/* ============ RIGHT PANEL: AI ASSISTANT ============ */}
        <div
          className={`${rightPanelOpen ? "w-72" : "w-0"} transition-all duration-200 border-l border-border bg-card flex-shrink-0 overflow-hidden`}
        >
          <div className="w-72 h-full flex flex-col">
            {/* AI header */}
            <div className="p-3 border-b border-border flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">AI Assistant</h3>
                <p className="text-[10px] text-muted-foreground">
                  {activeTheme ? `${activeTheme.name} mode` : "Ask for building help"}
                </p>
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
                Suggest
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
              {activeTheme && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    setAiInput(`Help me build a ${activeTheme.name} themed creation`);
                    setTimeout(() => handleAiSend(), 100);
                  }}
                  disabled={aiLoading}
                >
                  <Flame className="w-3 h-3" />
                  {activeTheme.name}
                </Button>
              )}
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiMessages.map((msg) => (
                <div key={msg.id} className={`${msg.role === "user" ? "ml-6" : "mr-2"}`}>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
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
                <Button type="submit" size="icon" className="h-8 w-8 flex-shrink-0" disabled={!aiInput.trim() || aiLoading}>
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
