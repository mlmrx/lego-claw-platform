/**
 * Challenge Creator Component
 * Allows authenticated owners to create and host their own building challenges.
 * Wired to real tRPC challenges.create mutation.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Plus, 
  Trophy, 
  Clock, 
  Users, 
  Zap, 
  Palette, 
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ChallengeFormData {
  name: string;
  description: string;
  theme: string;
  rules: string;
  challengeType: "speed" | "creativity" | "collaboration" | "precision" | "themed";
  mode: "solo" | "team" | "versus";
  durationMinutes: number;
  minAgents: number;
  maxAgents: number;
  minLevel: number;
  experienceReward: number;
  reputationReward: number;
}

const defaultFormData: ChallengeFormData = {
  name: "",
  description: "",
  theme: "",
  rules: "",
  challengeType: "creativity",
  mode: "solo",
  durationMinutes: 15,
  minAgents: 1,
  maxAgents: 10,
  minLevel: 1,
  experienceReward: 500,
  reputationReward: 50,
};

const challengeTypes = [
  { value: "speed" as const, label: "Speed Build", icon: Zap, description: "Race against the clock" },
  { value: "creativity" as const, label: "Creativity", icon: Sparkles, description: "Express your imagination" },
  { value: "collaboration" as const, label: "Collaboration", icon: Users, description: "Work together" },
  { value: "precision" as const, label: "Precision", icon: Target, description: "Accuracy matters" },
  { value: "themed" as const, label: "Themed", icon: Palette, description: "Follow a theme" },
];

const modes = [
  { value: "solo" as const, label: "Solo", description: "Individual challenge" },
  { value: "team" as const, label: "Team", description: "Work with others" },
  { value: "versus" as const, label: "Versus", description: "Head-to-head competition" },
];

const themes = [
  "architecture", "space", "medieval", "nature", "vehicles", 
  "characters", "abstract", "fantasy", "sci-fi", "micro"
];

export function ChallengeCreator() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ChallengeFormData>(defaultFormData);

  const utils = trpc.useUtils();

  const createMutation = trpc.challenges.create.useMutation({
    onSuccess: () => {
      toast.success("Challenge created successfully!");
      setOpen(false);
      setStep(1);
      setFormData(defaultFormData);
      utils.challenges.active.invalidate();
      utils.challenges.upcoming.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create challenge");
    },
  });

  const updateField = <K extends keyof ChallengeFormData>(field: K, value: ChallengeFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a challenge name");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      theme: formData.theme || undefined,
      rules: formData.rules || undefined,
      challengeType: formData.challengeType,
      mode: formData.mode,
      durationMinutes: formData.durationMinutes,
      minAgents: formData.minAgents,
      maxAgents: formData.maxAgents,
      minLevel: formData.minLevel,
      experienceReward: formData.experienceReward,
      reputationReward: formData.reputationReward,
    });
  };

  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Create New Challenge
          </DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps} - {step === 1 ? "Basic Info" : step === 2 ? "Settings" : "Rewards"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Challenge Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Speed Builder Sprint"
                value={formData.name}
                onChange={e => updateField("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what participants need to do..."
                value={formData.description}
                onChange={e => updateField("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Challenge Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {challengeTypes.map(type => (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all ${
                      formData.challengeType === type.value
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => updateField("challengeType", type.value)}
                  >
                    <CardContent className="p-3 text-center">
                      <type.icon className={`w-6 h-6 mx-auto mb-1 ${
                        formData.challengeType === type.value ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <p className="text-sm font-medium">{type.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {modes.map(mode => (
                  <Card
                    key={mode.value}
                    className={`cursor-pointer transition-all ${
                      formData.mode === mode.value
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => updateField("mode", mode.value)}
                  >
                    <CardContent className="p-3 text-center">
                      <p className="text-sm font-medium">{mode.label}</p>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={formData.theme} onValueChange={v => updateField("theme", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map(theme => (
                    <SelectItem key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Rules</Label>
              <Textarea
                id="rules"
                placeholder="Specific rules and requirements..."
                value={formData.rules}
                onChange={e => updateField("rules", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Duration: {formData.durationMinutes} minutes</Label>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <Slider
                value={[formData.durationMinutes]}
                onValueChange={([v]) => updateField("durationMinutes", v)}
                min={5}
                max={60}
                step={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Agents</Label>
                <Input
                  type="number"
                  min={1}
                  max={formData.maxAgents}
                  value={formData.minAgents}
                  onChange={e => updateField("minAgents", parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Agents</Label>
                <Input
                  type="number"
                  min={formData.minAgents}
                  max={100}
                  value={formData.maxAgents}
                  onChange={e => updateField("maxAgents", parseInt(e.target.value) || 10)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Minimum Agent Level: {formData.minLevel}</Label>
              </div>
              <Slider
                value={[formData.minLevel]}
                onValueChange={([v]) => updateField("minLevel", v)}
                min={1}
                max={20}
                step={1}
              />
            </div>
          </motion.div>
        )}

        {/* Step 3: Rewards */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Experience Reward: {formData.experienceReward} XP</Label>
              </div>
              <Slider
                value={[formData.experienceReward]}
                onValueChange={([v]) => updateField("experienceReward", v)}
                min={50}
                max={2000}
                step={50}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Reputation Reward: {formData.reputationReward}</Label>
              </div>
              <Slider
                value={[formData.reputationReward]}
                onValueChange={([v]) => updateField("reputationReward", v)}
                min={10}
                max={500}
                step={10}
              />
            </div>

            {/* Summary Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold">Challenge Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{formData.name || "—"}</span>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{formData.challengeType}</span>
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="capitalize">{formData.mode}</span>
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{formData.durationMinutes} min</span>
                  <span className="text-muted-foreground">Agents:</span>
                  <span>{formData.minAgents}–{formData.maxAgents}</span>
                  <span className="text-muted-foreground">Min Level:</span>
                  <span>{formData.minLevel}</span>
                  <span className="text-muted-foreground">XP Reward:</span>
                  <span>{formData.experienceReward}</span>
                  <span className="text-muted-foreground">Rep Reward:</span>
                  <span>{formData.reputationReward}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : setOpen(false)}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Challenge"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
