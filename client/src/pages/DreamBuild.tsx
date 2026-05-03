/**
 * Dream Build Page
 * Direction 1: Creative AI Co-pilot for Kids
 * 
 * Kids describe what they want to build, AI creates a step-by-step plan,
 * and they follow along in the 3D builder with educational explanations.
 */

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { InteractiveBuilder, type BuilderBrick, type BrickType } from "@/components/InteractiveBuilder";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  Trophy,
  BookOpen,
  Wand2,
  Loader2,
  HelpCircle,
  Star,
  Blocks,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";

// ============================================
// TYPES
// ============================================

interface BuildStep {
  stepNumber: number;
  title: string;
  description: string;
  lesson: string;
  lessonType: "stability" | "color" | "symmetry" | "proportion" | "structure" | "creativity";
  bricks: Array<{
    position: [number, number, number];
    color: string;
    width: number;
    depth: number;
    height: number;
    shape?: string;
  }>;
  encouragement: string;
}

interface DreamBuildPlan {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  totalBricks: number;
  steps: BuildStep[];
  funFact: string;
}

// ============================================
// LESSON TYPE ICONS & COLORS
// ============================================

const LESSON_META: Record<string, { icon: string; color: string; label: string }> = {
  stability: { icon: "⚖️", color: "bg-blue-100 text-blue-700 border-blue-200", label: "Stability" },
  color: { icon: "🎨", color: "bg-pink-100 text-pink-700 border-pink-200", label: "Color Theory" },
  symmetry: { icon: "🪞", color: "bg-purple-100 text-purple-700 border-purple-200", label: "Symmetry" },
  proportion: { icon: "📐", color: "bg-amber-100 text-amber-700 border-amber-200", label: "Proportion" },
  structure: { icon: "🏗️", color: "bg-green-100 text-green-700 border-green-200", label: "Structure" },
  creativity: { icon: "✨", color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Creativity" },
};

const DIFFICULTY_META = {
  beginner: { label: "Beginner", color: "bg-green-100 text-green-700", emoji: "🌱" },
  intermediate: { label: "Intermediate", color: "bg-amber-100 text-amber-700", emoji: "🌿" },
  advanced: { label: "Advanced", color: "bg-red-100 text-red-700", emoji: "🌳" },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function DreamBuild() {
  const [phase, setPhase] = useState<"input" | "building" | "complete">("input");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [plan, setPlan] = useState<DreamBuildPlan | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [bricks, setBricks] = useState<BuilderBrick[]>([]);
  const [showLesson, setShowLesson] = useState(true);
  const [stepsCompleted, setStepsCompleted] = useState<Set<number>>(new Set());

  // Fetch ideas for inspiration
  const { data: ideasData } = trpc.dreamBuild.getIdeas.useQuery();

  // Generate plan mutation
  const generatePlan = trpc.dreamBuild.generatePlan.useMutation({
    onSuccess: (data) => {
      setPlan(data);
      setPhase("building");
      setCurrentStepIndex(0);
      setBricks([]);
      setStepsCompleted(new Set());
      toast.success(`Let's build "${data.title}"!`);
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong. Try again!");
    },
  });

  // Get hint mutation
  const getHint = trpc.dreamBuild.getHint.useMutation({
    onSuccess: (data) => {
      toast(data.hint, { icon: "💡", duration: 8000 });
    },
  });

  // Current step
  const currentStep = plan?.steps[currentStepIndex] ?? null;

  // Calculate bricks that should be highlighted for the current step
  const highlightedBrickIds = useMemo(() => {
    if (!currentStep) return [];
    // Highlight bricks placed in the current step
    const stepStartIndex = plan!.steps
      .slice(0, currentStepIndex)
      .reduce((sum, s) => sum + s.bricks.length, 0);
    const stepEndIndex = stepStartIndex + currentStep.bricks.length;
    return bricks.slice(stepStartIndex, stepEndIndex).map(b => b.id);
  }, [currentStep, currentStepIndex, bricks, plan]);

  // Selected brick type for the current step (use the first brick in the step as default)
  const selectedBrickType: BrickType = useMemo(() => {
    if (currentStep && currentStep.bricks.length > 0) {
      const firstBrick = currentStep.bricks[0];
      return {
        name: `${firstBrick.width}x${firstBrick.depth}`,
        width: firstBrick.width,
        depth: firstBrick.depth,
        height: firstBrick.height,
        icon: "▬",
        shape: (firstBrick.shape as any) || "standard",
      };
    }
    return { name: "2x1", width: 2, depth: 1, height: 3, icon: "▬" };
  }, [currentStep]);

  // Selected color for the current step
  const selectedColor = useMemo(() => {
    if (currentStep && currentStep.bricks.length > 0) {
      return currentStep.bricks[0].color;
    }
    return "#D01012";
  }, [currentStep]);

  // Handle "Place All" for current step
  const handlePlaceStepBricks = () => {
    if (!currentStep) return;
    
    const newBricks: BuilderBrick[] = currentStep.bricks.map((b) => ({
      id: nanoid(8),
      position: b.position,
      color: b.color,
      width: b.width,
      depth: b.depth,
      height: b.height,
      shape: (b.shape as any) || "standard",
      placedAt: Date.now(),
    }));

    setBricks(prev => [...prev, ...newBricks]);
    setStepsCompleted(prev => new Set(Array.from(prev).concat(currentStepIndex)));
    toast.success(currentStep.encouragement, { icon: "🎉" });
  };

  // Handle next step
  const handleNextStep = () => {
    if (!plan) return;
    if (currentStepIndex < plan.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setShowLesson(true);
    } else {
      setPhase("complete");
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Handle manual brick placement
  const handlePlaceBrick = (brick: Omit<BuilderBrick, "id" | "placedAt">) => {
    const newBrick: BuilderBrick = {
      ...brick,
      id: nanoid(8),
      placedAt: Date.now(),
    };
    setBricks(prev => [...prev, newBrick]);
  };

  // Handle brick deletion
  const handleDeleteBrick = (id: string) => {
    setBricks(prev => prev.filter(b => b.id !== id));
  };

  // Handle start over
  const handleStartOver = () => {
    setPhase("input");
    setPlan(null);
    setBricks([]);
    setCurrentStepIndex(0);
    setStepsCompleted(new Set());
    setDescription("");
  };

  // Progress percentage
  const progressPercent = plan
    ? Math.round((stepsCompleted.size / plan.steps.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {phase === "input" && (
        <DreamInput
          description={description}
          setDescription={setDescription}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          ideas={ideasData?.ideas || []}
          isGenerating={generatePlan.isPending}
          onGenerate={() => {
            if (!description.trim()) {
              toast.error("Tell me what you want to build!");
              return;
            }
            generatePlan.mutate({ description: description.trim(), difficulty });
          }}
        />
      )}

      {phase === "building" && plan && currentStep && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel: Step Guide */}
          <div className="w-full lg:w-96 border-r border-border bg-card flex flex-col overflow-y-auto">
            {/* Build Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={DIFFICULTY_META[plan.difficulty].color}>
                  {DIFFICULTY_META[plan.difficulty].emoji} {DIFFICULTY_META[plan.difficulty].label}
                </Badge>
                <Badge variant="outline">~{plan.estimatedMinutes} min</Badge>
              </div>
              <h2 className="text-xl font-bold font-heading">{plan.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              
              {/* Progress */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Step {currentStepIndex + 1} of {plan.steps.length}</span>
                  <span>{progressPercent}% complete</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>

            {/* Current Step */}
            <div className="flex-1 p-4 space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Step Title */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {currentStep.stepNumber}
                    </div>
                    <h3 className="text-lg font-semibold font-heading">{currentStep.title}</h3>
                  </div>

                  {/* Step Description */}
                  <p className="text-sm text-foreground mb-4">{currentStep.description}</p>

                  {/* Educational Lesson */}
                  {showLesson && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg border p-3 mb-4 ${LESSON_META[currentStep.lessonType]?.color || "bg-muted"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{LESSON_META[currentStep.lessonType]?.icon}</span>
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {LESSON_META[currentStep.lessonType]?.label || "Lesson"}
                        </span>
                        <BookOpen className="w-3 h-3 ml-auto opacity-50" />
                      </div>
                      <p className="text-sm leading-relaxed">{currentStep.lesson}</p>
                    </motion.div>
                  )}

                  {/* Brick Preview */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Blocks className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {currentStep.bricks.length} brick{currentStep.bricks.length !== 1 ? "s" : ""} in this step
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentStep.bricks.slice(0, 12).map((b, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded border border-border/50"
                          style={{ backgroundColor: b.color }}
                          title={`${b.width}x${b.depth} ${b.shape || "standard"}`}
                        />
                      ))}
                      {currentStep.bricks.length > 12 && (
                        <div className="w-6 h-6 rounded border border-border/50 flex items-center justify-center text-[10px] text-muted-foreground">
                          +{currentStep.bricks.length - 12}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {!stepsCompleted.has(currentStepIndex) ? (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePlaceStepBricks}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Place Bricks for This Step
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleNextStep}
                      >
                        {currentStepIndex < plan.steps.length - 1 ? (
                          <>
                            Next Step
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4 mr-2" />
                            Complete Build!
                          </>
                        )}
                      </Button>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handlePrevStep}
                        disabled={currentStepIndex === 0}
                      >
                        <ChevronLeft className="w-3 h-3 mr-1" />
                        Back
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (!plan || !currentStep) return;
                          getHint.mutate({
                            buildTitle: plan.title,
                            currentStep: currentStep.stepNumber,
                            stepTitle: currentStep.title,
                            stepDescription: currentStep.description,
                            bricksPlacedSoFar: bricks.length,
                          });
                        }}
                        disabled={getHint.isPending}
                      >
                        <HelpCircle className="w-3 h-3 mr-1" />
                        Hint
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowLesson(!showLesson)}
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        {showLesson ? "Hide" : "Show"} Lesson
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fun Fact */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground italic">{plan.funFact}</p>
              </div>
            </div>
          </div>

          {/* Right Panel: 3D Builder */}
          <div className="flex-1 relative">
            <InteractiveBuilder
              bricks={bricks}
              onPlaceBrick={handlePlaceBrick}
              onDeleteBrick={handleDeleteBrick}
              selectedColor={selectedColor}
              selectedBrickType={selectedBrickType}
              deleteMode={false}
              highlightedBrickIds={highlightedBrickIds}
              className="h-full"
            />

            {/* Step indicator overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
              <div className="bg-card/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg border border-border">
                <span className="text-sm font-medium">
                  Step {currentStepIndex + 1}: {currentStep.title}
                </span>
              </div>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card/90 backdrop-blur"
                  onClick={handleStartOver}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Start Over
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "complete" && plan && (
        <CompletionScreen
          plan={plan}
          totalBricksPlaced={bricks.length}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}

// ============================================
// DREAM INPUT PHASE
// ============================================

function DreamInput({
  description,
  setDescription,
  difficulty,
  setDifficulty,
  ideas,
  isGenerating,
  onGenerate,
}: {
  description: string;
  setDescription: (v: string) => void;
  difficulty: "beginner" | "intermediate" | "advanced";
  setDifficulty: (v: "beginner" | "intermediate" | "advanced") => void;
  ideas: Array<{ emoji: string; title: string; description: string; difficulty: "beginner" | "intermediate" | "advanced" }>;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block mb-4"
          >
            <span className="text-6xl">🧱</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-3 bg-gradient-to-r from-primary via-yellow-500 to-blue-500 bg-clip-text text-transparent">
            What do you want to build?
          </h1>
          <p className="text-lg text-muted-foreground">
            Describe anything and I'll teach you how to build it step by step!
          </p>
        </div>

        {/* Input */}
        <div className="relative mb-6">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A dragon castle with towers and a moat..."
            className="w-full h-32 p-4 pr-12 rounded-xl border-2 border-input bg-card text-lg font-body resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onGenerate();
              }
            }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
            {description.length}/500
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-sm text-muted-foreground">Difficulty:</span>
          {(["beginner", "intermediate", "advanced"] as const).map((d) => (
            <Button
              key={d}
              variant={difficulty === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty(d)}
              className="capitalize"
            >
              {DIFFICULTY_META[d].emoji} {DIFFICULTY_META[d].label}
            </Button>
          ))}
        </div>

        {/* Generate Button */}
        <Button
          size="lg"
          className="w-full text-lg h-14"
          onClick={onGenerate}
          disabled={isGenerating || !description.trim()}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating your build plan...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Create My Build Plan
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        {/* Ideas Section */}
        {ideas.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Need inspiration? Try one of these:</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ideas.map((idea) => (
                <button
                  key={idea.title}
                  onClick={() => {
                    setDescription(idea.description);
                    setDifficulty(idea.difficulty);
                  }}
                  className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all group"
                >
                  <span className="text-2xl mb-1 block">{idea.emoji}</span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {idea.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// COMPLETION SCREEN
// ============================================

function CompletionScreen({
  plan,
  totalBricksPlaced,
  onStartOver,
}: {
  plan: DreamBuildPlan;
  totalBricksPlaced: number;
  onStartOver: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-7xl mb-6"
        >
          🏆
        </motion.div>
        <h1 className="text-4xl font-bold font-heading mb-3">
          Amazing Build!
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          You completed <span className="font-semibold text-foreground">"{plan.title}"</span>!
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 text-center">
              <Blocks className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{totalBricksPlaced}</p>
              <p className="text-xs text-muted-foreground">Bricks Placed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{plan.steps.length}</p>
              <p className="text-xs text-muted-foreground">Lessons Learned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Star className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">
                {plan.difficulty === "beginner" ? "⭐" : plan.difficulty === "intermediate" ? "⭐⭐" : "⭐⭐⭐"}
              </p>
              <p className="text-xs text-muted-foreground">{DIFFICULTY_META[plan.difficulty].label}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lessons Summary */}
        <Card className="mb-6 text-left">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              What you learned:
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(plan.steps.map(s => s.lessonType))).map((type) => (
                <Badge key={type} variant="outline" className={LESSON_META[type]?.color}>
                  {LESSON_META[type]?.icon} {LESSON_META[type]?.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={onStartOver}>
            <Sparkles className="w-4 h-4 mr-2" />
            Build Something New
          </Button>
          <Button size="lg" variant="outline" onClick={onStartOver}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Build Again
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
