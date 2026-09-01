/**
 * LEGO Instruction Generator Page
 * Direction 3: Upload any image and get step-by-step LEGO building instructions
 * with a parts list — like official LEGO manuals.
 */

import { useState, useRef, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { LegoBrick3D, UNIT, PLATE_HEIGHT, BRICK_HEIGHT, LEGO_COLORS } from "@/components/LegoBrick3D";
import ShapeBrick3D from "@/components/ShapeBrick3D";

import {
  Upload,
  Image as ImageIcon,
  Camera,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  Puzzle,
  Ruler,
  Lightbulb,
  Download,
  RotateCcw,
  Type,
  Layers,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

const PLATE_H = PLATE_HEIGHT;
const BRICK_H = BRICK_HEIGHT;

// ============================================
// TYPES
// ============================================

interface InstructionBrick {
  position: [number, number, number];
  color: string;
  colorName: string;
  width: number;
  depth: number;
  height: number;
  shape: string;
  partId: string;
}

interface InstructionStep {
  stepNumber: number;
  title: string;
  description: string;
  bricks: InstructionBrick[];
  subAssembly?: boolean;
  attachTo?: string;
  tip?: string;
}

interface PartListItem {
  partId: string;
  name: string;
  color: string;
  colorName: string;
  quantity: number;
  shape: string;
  dimensions: string;
}

interface InstructionSet {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  estimatedMinutes: number;
  totalPieces: number;
  dimensions: { width: number; height: number; depth: number };
  steps: InstructionStep[];
  partsList: PartListItem[];
  buildTips: string[];
  imageUrl?: string;
}

// ============================================
// 3D INSTRUCTION VIEWER
// ============================================

function InstructionBrick3D({ brick }: { brick: InstructionBrick }) {
  const isSpecialShape = brick.shape && brick.shape !== "standard" && brick.shape !== "plate";

  if (isSpecialShape) {
    return (
      <group position={[
        brick.position[0] * UNIT,
        brick.position[1],
        brick.position[2] * UNIT,
      ]}>
        <ShapeBrick3D
          position={[0, 0, 0]}
          shape={brick.shape as any}
          width={brick.width}
          depth={brick.depth}
          height={brick.height}
          color={brick.color}
        />
      </group>
    );
  }

  return (
    <group position={[
      brick.position[0] * UNIT,
      brick.position[1],
      brick.position[2] * UNIT,
    ]}>
      <LegoBrick3D
        position={[0, 0, 0]}
        color={brick.color}
        width={brick.width}
        depth={brick.depth}
        height={brick.height}
      />
    </group>
  );
}

function InstructionViewer3D({
  steps,
  currentStep,
  showAllPrevious,
}: {
  steps: InstructionStep[];
  currentStep: number;
  showAllPrevious: boolean;
}) {
  const visibleBricks = useMemo(() => {
    const bricks: (InstructionBrick & { isCurrentStep: boolean })[] = [];

    for (let i = 0; i < steps.length; i++) {
      if (i > currentStep) break;
      if (i < currentStep && !showAllPrevious) continue;

      for (const brick of steps[i].bricks) {
        bricks.push({ ...brick, isCurrentStep: i === currentStep });
      }
    }
    return bricks;
  }, [steps, currentStep, showAllPrevious]);

  return (
    <Canvas
      camera={{ position: [18, 14, 18], fov: 45 }}
      style={{ background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {/* Baseplate */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[32 * UNIT, 0.1, 32 * UNIT]} />
        <meshStandardMaterial color="#4a8c3f" roughness={0.8} />
      </mesh>

      {/* Grid lines on baseplate */}
      <gridHelper
        args={[32 * UNIT, 32, "#3d7a34", "#3d7a34"]}
        position={[0, 0.01, 0]}
      />

      {/* Bricks */}
      {visibleBricks.map((brick, i) => (
        <group key={i} >
          <InstructionBrick3D brick={brick} />
          {/* Highlight current step bricks with a subtle glow */}
          {brick.isCurrentStep && (
            <mesh position={[
              brick.position[0] * UNIT,
              brick.position[1],
              brick.position[2] * UNIT,
            ]}>
              <boxGeometry args={[
                brick.width * UNIT + 0.1,
                (brick.height / 3) * BRICK_H + 0.1,
                brick.depth * UNIT + 0.1,
              ]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} />
            </mesh>
          )}
        </group>
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}

// ============================================
// PARTS LIST COMPONENT
// ============================================

function PartsList({ parts }: { parts: PartListItem[] }) {
  const totalPieces = parts.reduce((sum, p) => sum + p.quantity, 0);
  const uniqueParts = parts.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Parts List</h3>
        <span className="text-sm text-muted-foreground">
          {totalPieces} pieces, {uniqueParts} unique parts
        </span>
      </div>

      <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
        {parts.map((part, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            {/* Color swatch */}
            <div
              className="w-8 h-8 rounded border border-border shadow-sm flex-shrink-0"
              style={{ backgroundColor: part.color }}
            />

            {/* Part info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{part.name}</div>
              <div className="text-xs text-muted-foreground">
                {part.colorName} · {part.dimensions} · #{part.partId}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex-shrink-0 bg-primary/10 text-primary font-bold text-sm px-2 py-1 rounded">
              ×{part.quantity}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// STEP NAVIGATION
// ============================================

function StepNavigator({
  steps,
  currentStep,
  onStepChange,
}: {
  steps: InstructionStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Step counter */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>

        <span className="text-sm font-medium">
          Step {currentStep + 1} of {steps.length}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onStepChange(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Progress bar */}
      <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />

      {/* Step details */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {currentStep + 1}
            </div>
            <h4 className="font-semibold">{steps[currentStep].title}</h4>
            {steps[currentStep].subAssembly && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Sub-assembly
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {steps[currentStep].description}
          </p>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Package className="w-3 h-3" />
            {steps[currentStep].bricks.length} pieces in this step
          </div>

          {steps[currentStep].tip && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {steps[currentStep].tip}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step thumbnails */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => onStepChange(i)}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded text-xs font-medium transition-all",
              i === currentStep
                ? "bg-primary text-primary-foreground shadow-md scale-110"
                : i < currentStep
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {i < currentStep ? (
              <CheckCircle2 className="w-4 h-4 mx-auto" />
            ) : (
              i + 1
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

type Mode = "upload" | "text" | "viewing";
type Tab = "steps" | "parts" | "tips";

export default function Instructions() {
  const [mode, setMode] = useState<Mode>("upload");
  const [tab, setTab] = useState<Tab>("steps");
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllPrevious, setShowAllPrevious] = useState(true);
  const [instructions, setInstructions] = useState<InstructionSet | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState("");
  const [complexity, setComplexity] = useState<"simple" | "detailed" | "expert">("detailed");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFromImage = trpc.instructions.generateFromImage.useMutation({
    onSuccess: (data) => {
      setInstructions(data as InstructionSet);
      setMode("viewing");
      setCurrentStep(0);
    },
  });

  const generateFromText = trpc.instructions.generateFromText.useMutation({
    onSuccess: (data) => {
      setInstructions(data as InstructionSet);
      setMode("viewing");
      setCurrentStep(0);
    },
  });

  const isGenerating = generateFromImage.isPending || generateFromText.isPending;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreviewImage(dataUrl);

      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = dataUrl.split(",")[1];
      generateFromImage.mutate({
        imageBase64: base64,
        complexity,
      });
    };
    reader.readAsDataURL(file);
  }, [complexity, generateFromImage]);

  const handleTextGenerate = useCallback(() => {
    if (!textDescription.trim()) return;
    generateFromText.mutate({
      description: textDescription.trim(),
      complexity,
    });
  }, [textDescription, complexity, generateFromText]);

  const handleReset = useCallback(() => {
    setMode("upload");
    setInstructions(null);
    setPreviewImage(null);
    setTextDescription("");
    setCurrentStep(0);
    generateFromImage.reset();
    generateFromText.reset();
  }, [generateFromImage, generateFromText]);

  // ============================================
  // UPLOAD / INPUT MODE
  // ============================================

  if (mode !== "viewing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container py-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">LEGO Instruction Generator</h1>
                <p className="text-sm text-muted-foreground">
                  Upload an image or describe what you want to build
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-4xl mx-auto">
          {/* Mode tabs */}
          <div className="flex gap-2 mb-8 justify-center">
            <Button
              variant={mode === "upload" ? "default" : "outline"}
              onClick={() => setMode("upload")}
              className="gap-2"
            >
              <Camera className="w-4 h-4" /> From Image
            </Button>
            <Button
              variant={mode === "text" ? "default" : "outline"}
              onClick={() => setMode("text")}
              className="gap-2"
            >
              <Type className="w-4 h-4" /> From Description
            </Button>
          </div>

          {/* Complexity selector */}
          <div className="flex gap-2 mb-6 justify-center">
            {(["simple", "detailed", "expert"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setComplexity(level)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  complexity === level
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {level === "simple" && "🧱 Simple (20-40 pcs)"}
                {level === "detailed" && "🏗️ Detailed (40-100 pcs)"}
                {level === "expert" && "🎯 Expert (100-500 pcs)"}
              </button>
            ))}
          </div>

          {/* Upload mode */}
          {mode === "upload" && (
            <div className="space-y-6">
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  isGenerating
                    ? "border-primary bg-primary/5 pointer-events-none"
                    : "border-muted-foreground/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isGenerating ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <Wand2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Analyzing your image...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our AI is designing your LEGO instructions. This takes 15-30 seconds.
                      </p>
                    </div>
                    <Progress value={65} className="max-w-xs mx-auto" />
                  </div>
                ) : previewImage ? (
                  <div className="space-y-4">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                    <p className="text-sm text-muted-foreground">
                      Click to choose a different image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Drop an image here</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload a photo of anything — a building, animal, vehicle, character — and
                        we'll create LEGO building instructions for it
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP · Max 10MB
                    </p>
                  </div>
                )}
              </div>

              {/* Example ideas */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Try with these ideas:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["A red sports car", "The Eiffel Tower", "A cute cat", "A medieval castle", "A space shuttle"].map(
                    (idea) => (
                      <button
                        key={idea}
                        onClick={() => {
                          setMode("text");
                          setTextDescription(idea);
                        }}
                        className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                      >
                        {idea}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Text mode */}
          {mode === "text" && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      What do you want to build?
                    </label>
                    <textarea
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                      placeholder="Describe what you want to build as a LEGO model... e.g., 'A Japanese pagoda with 5 tiers' or 'A realistic German Shepherd dog'"
                      className="w-full h-32 p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isGenerating}
                    />
                  </div>

                  <Button
                    onClick={handleTextGenerate}
                    disabled={!textDescription.trim() || isGenerating}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Wand2 className="w-4 h-4 animate-spin" />
                        Designing Instructions...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Building Instructions
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="text-center">
                      <Progress value={50} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Designing your model and calculating brick positions... (15-30s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick ideas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { emoji: "🏎️", text: "A Formula 1 race car" },
                  { emoji: "🦖", text: "A T-Rex dinosaur" },
                  { emoji: "🏰", text: "A fairy tale castle" },
                  { emoji: "🚀", text: "The Space Shuttle" },
                  { emoji: "🐕", text: "A golden retriever" },
                  { emoji: "🗼", text: "The Eiffel Tower" },
                  { emoji: "🏠", text: "A cozy cottage" },
                  { emoji: "🦁", text: "A lion's head" },
                  { emoji: "✈️", text: "A passenger airplane" },
                ].map((idea) => (
                  <button
                    key={idea.text}
                    onClick={() => setTextDescription(idea.text)}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-2xl">{idea.emoji}</span>
                    <p className="text-sm mt-1">{idea.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error display */}
          {(generateFromImage.error || generateFromText.error) && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {generateFromImage.error?.message || generateFromText.error?.message}
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleReset}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // VIEWING MODE - INSTRUCTION VIEWER
  // ============================================

  if (!instructions) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <ArrowLeft className="w-4 h-4 mr-1" /> New
              </Button>
              <div>
                <h1 className="text-lg font-bold">{instructions.title}</h1>
                <p className="text-xs text-muted-foreground">{instructions.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Puzzle className="w-4 h-4" /> {instructions.totalPieces} pieces
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> ~{instructions.estimatedMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-4 h-4" /> {instructions.steps.length} steps
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                instructions.difficulty === "easy" && "bg-green-100 text-green-800",
                instructions.difficulty === "medium" && "bg-blue-100 text-blue-800",
                instructions.difficulty === "hard" && "bg-orange-100 text-orange-800",
                instructions.difficulty === "expert" && "bg-red-100 text-red-800",
              )}>
                {instructions.difficulty}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <InstructionViewer3D
            steps={instructions.steps}
            currentStep={currentStep}
            showAllPrevious={showAllPrevious}
          />

          {/* Overlay controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllPrevious(!showAllPrevious)}
              className="bg-background/80 backdrop-blur-sm"
            >
              {showAllPrevious ? "Current Step Only" : "Show All Steps"}
            </Button>
          </div>

          {/* Reference image thumbnail */}
          {previewImage && (
            <div className="absolute bottom-4 left-4">
              <img
                src={previewImage}
                alt="Reference"
                className="w-24 h-24 object-cover rounded-lg border-2 border-background shadow-lg"
              />
              <p className="text-[10px] text-center mt-1 text-muted-foreground">Reference</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-[380px] border-l bg-card flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            {([
              { id: "steps" as Tab, label: "Steps", icon: Layers },
              { id: "parts" as Tab, label: "Parts", icon: Package },
              { id: "tips" as Tab, label: "Tips", icon: Lightbulb },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors",
                  tab === id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {tab === "steps" && (
              <StepNavigator
                steps={instructions.steps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
            )}

            {tab === "parts" && (
              <PartsList parts={instructions.partsList} />
            )}

            {tab === "tips" && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Building Tips</h3>
                {instructions.buildTips.length > 0 ? (
                  instructions.buildTips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{tip}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No specific tips for this build. Follow the steps carefully and take your time!
                  </p>
                )}

                {/* Model dimensions */}
                <div className="mt-6 p-4 rounded-lg border">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Ruler className="w-4 h-4" /> Model Dimensions
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 rounded bg-muted">
                      <div className="font-bold">{instructions.dimensions.width}</div>
                      <div className="text-xs text-muted-foreground">Width (studs)</div>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <div className="font-bold">{instructions.dimensions.height}</div>
                      <div className="text-xs text-muted-foreground">Height (bricks)</div>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <div className="font-bold">{instructions.dimensions.depth}</div>
                      <div className="text-xs text-muted-foreground">Depth (studs)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
