/**
 * Start Build Page
 * Upload a LEGO set image and let AI agents build it
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  Palette,
  Puzzle,
  Target,
  Zap,
  AlertCircle,
  Edit3
} from "lucide-react";

type Step = "upload" | "analyzing" | "preview" | "customizing" | "creating";

interface LegoSetInfo {
  setName: string;
  setNumber: string | null;
  pieceCount: number | null;
  estimatedDifficulty: "easy" | "medium" | "hard" | "expert";
  theme: string;
  style: string;
  colors: string[];
  features: string[];
  description: string;
  buildingTips: string[];
}

export default function StartBuild() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  
  const [step, setStep] = useState<Step>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [setInfo, setSetInfo] = useState<LegoSetInfo | null>(null);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = trpc.imageBuild.analyzeImage.useMutation({
    onSuccess: (data) => {
      setImageUrl(data.imageUrl);
      setSetInfo(data.setInfo);
      setCustomName(data.setInfo.setName);
      setCustomDescription(data.setInfo.description);
      setStep("preview");
    },
    onError: (err) => {
      setError(err.message || "Failed to analyze image");
      setStep("upload");
    },
  });

  const createBuildMutation = trpc.imageBuild.createBuildFromImage.useMutation({
    onSuccess: (data) => {
      // Navigate to the live build page
      navigate(`/live/${data.projectId}`);
    },
    onError: (err) => {
      setError(err.message || "Failed to create build");
      setStep("preview");
    },
  });

  const handleImageSelected = async (file: File, previewUrl: string) => {
    setImageFile(file);
    setImagePreview(previewUrl);
    setError(null);
    setStep("analyzing");

    // Convert to base64 and analyze
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      analyzeMutation.mutate({
        imageBase64: base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemoved = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    setSetInfo(null);
    setStep("upload");
    setError(null);
  };

  const handleStartBuild = () => {
    if (!imageUrl || !setInfo) return;
    
    setStep("creating");
    createBuildMutation.mutate({
      imageUrl,
      setInfo,
      customName: customName !== setInfo.setName ? customName : undefined,
      customDescription: customDescription !== setInfo.description ? customDescription : undefined,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "hard": return "bg-orange-100 text-orange-700";
      case "expert": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign In to Start Building</CardTitle>
              <CardDescription>
                Upload a LEGO set image and watch AI agents build it together
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>Sign In to Continue</a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-6 sm:py-8 px-4">
        <div className="container max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-6 sm:mb-8">
            <Badge variant="secondary" className="mb-3">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Building
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-2">
              Start a New Build
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Upload a photo of your LEGO set box or completed build, and our AI agents will collaborate to recreate it
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className={`flex items-center gap-1.5 ${step === "upload" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs ${step === "upload" ? "bg-primary text-white" : "bg-green-500 text-white"}`}>
                  {step === "upload" ? "1" : <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>
                <span className="hidden sm:inline">Upload</span>
              </div>
              <div className="w-6 sm:w-12 h-0.5 bg-muted" />
              <div className={`flex items-center gap-1.5 ${step === "analyzing" ? "text-primary font-medium" : ["preview", "customizing", "creating"].includes(step) ? "text-muted-foreground" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs ${step === "analyzing" ? "bg-primary text-white" : ["preview", "customizing", "creating"].includes(step) ? "bg-green-500 text-white" : "bg-muted"}`}>
                  {step === "preview" || step === "customizing" || step === "creating" ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : "2"}
                </div>
                <span className="hidden sm:inline">Analyze</span>
              </div>
              <div className="w-6 sm:w-12 h-0.5 bg-muted" />
              <div className={`flex items-center gap-1.5 ${step === "preview" || step === "customizing" ? "text-primary font-medium" : step === "creating" ? "text-muted-foreground" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs ${step === "preview" || step === "customizing" ? "bg-primary text-white" : step === "creating" ? "bg-green-500 text-white" : "bg-muted"}`}>
                  {step === "creating" ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : "3"}
                </div>
                <span className="hidden sm:inline">Preview</span>
              </div>
              <div className="w-6 sm:w-12 h-0.5 bg-muted" />
              <div className={`flex items-center gap-1.5 ${step === "creating" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs ${step === "creating" ? "bg-primary text-white" : "bg-muted"}`}>
                  4
                </div>
                <span className="hidden sm:inline">Build</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Something went wrong</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <ImageUpload
                      onImageSelected={handleImageSelected}
                      onImageRemoved={handleImageRemoved}
                      maxSizeMB={10}
                    />
                  </CardContent>
                </Card>

                {/* Tips */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Clear Photo</p>
                      <p className="text-xs text-muted-foreground">Take a clear photo of the box front or completed build</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Good Lighting</p>
                      <p className="text-xs text-muted-foreground">Ensure good lighting for better AI analysis</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <Puzzle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Any LEGO Set</p>
                      <p className="text-xs text-muted-foreground">Works with official sets or custom builds</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analyzing Step */}
            {step === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="py-12 sm:py-16">
                    <div className="flex flex-col items-center text-center">
                      {imagePreview && (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden mb-6 shadow-lg">
                          <img src={imagePreview} alt="Uploaded" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin mb-4" />
                      <h3 className="text-lg sm:text-xl font-heading font-bold mb-2">Analyzing Your Image</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Our AI is identifying the LEGO set, counting pieces, and preparing build instructions...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Preview Step */}
            {(step === "preview" || step === "customizing") && setInfo && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image Preview */}
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      {imageUrl && (
                        <div className="rounded-xl overflow-hidden">
                          <img src={imageUrl} alt="LEGO Set" className="w-full h-auto" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Set Info */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl sm:text-2xl">{setInfo.setName}</CardTitle>
                            {setInfo.setNumber && (
                              <CardDescription>Set #{setInfo.setNumber}</CardDescription>
                            )}
                          </div>
                          <Badge className={getDifficultyColor(setInfo.estimatedDifficulty)}>
                            {setInfo.estimatedDifficulty}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{setInfo.description}</p>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 text-primary mb-1">
                              <Puzzle className="w-4 h-4" />
                              <span className="text-xs font-medium">Pieces</span>
                            </div>
                            <p className="text-lg font-bold">{setInfo.pieceCount || "~100"}</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 text-primary mb-1">
                              <Target className="w-4 h-4" />
                              <span className="text-xs font-medium">Theme</span>
                            </div>
                            <p className="text-lg font-bold capitalize">{setInfo.theme}</p>
                          </div>
                        </div>

                        {/* Colors */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Palette className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Colors</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {setInfo.colors.slice(0, 6).map((color, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {color}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Features */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Key Features</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {setInfo.features.slice(0, 4).map((feature, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customization */}
                    {step === "customizing" && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            Customize Build
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="name">Build Name</Label>
                            <Input
                              id="name"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              placeholder="Enter a custom name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={customDescription}
                              onChange={(e) => setCustomDescription(e.target.value)}
                              placeholder="Enter a custom description"
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {step === "preview" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setStep("customizing")}
                            className="flex-1"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Customize
                          </Button>
                          <Button
                            onClick={handleStartBuild}
                            className="flex-1"
                          >
                            Start Building
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </>
                      )}
                      {step === "customizing" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setStep("preview")}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleStartBuild}
                            className="flex-1"
                          >
                            Start Building
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Change Image */}
                    <Button
                      variant="ghost"
                      onClick={handleImageRemoved}
                      className="w-full text-muted-foreground"
                    >
                      Upload a Different Image
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Creating Step */}
            {step === "creating" && (
              <motion.div
                key="creating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="py-12 sm:py-16">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-heading font-bold mb-2">Creating Your Build</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Setting up the project and assigning AI agents to start building...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
