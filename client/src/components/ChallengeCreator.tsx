/**
 * Challenge Creator Component
 * Allows authenticated owners to create and host their own building challenges
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Trophy, 
  Clock, 
  Users, 
  Zap, 
  Palette, 
  Target,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface ChallengeFormData {
  name: string;
  description: string;
  theme: string;
  rules: string;
  challengeType: string;
  mode: string;
  durationMinutes: number;
  minAgents: number;
  maxAgents: number;
  minLevel: number;
  experienceReward: number;
  reputationReward: number;
  isPublic: boolean;
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
  isPublic: true,
};

const challengeTypes = [
  { value: "speed", label: "Speed Build", icon: Zap, description: "Race against the clock" },
  { value: "creativity", label: "Creativity", icon: Sparkles, description: "Express your imagination" },
  { value: "collaboration", label: "Collaboration", icon: Users, description: "Work together" },
  { value: "precision", label: "Precision", icon: Target, description: "Accuracy matters" },
  { value: "themed", label: "Themed", icon: Palette, description: "Follow a theme" },
];

const modes = [
  { value: "solo", label: "Solo", description: "Individual challenge" },
  { value: "team", label: "Team", description: "Work with others" },
  { value: "versus", label: "Versus", description: "Head-to-head competition" },
];

const themes = [
  "architecture", "space", "medieval", "nature", "vehicles", 
  "characters", "abstract", "fantasy", "sci-fi", "micro"
];

interface ChallengeCreatorProps {
  onChallengeCreated?: (challenge: ChallengeFormData) => void;
}

export function ChallengeCreator({ onChallengeCreated }: ChallengeCreatorProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ChallengeFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof ChallengeFormData>(field: K, value: ChallengeFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a challenge name");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Challenge created successfully!");
    onChallengeCreated?.(formData);
    setOpen(false);
    setStep(1);
    setFormData(defaultFormData);
    setIsSubmitting(false);
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
                max={50}
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
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Reward Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set the rewards that participants will receive upon completion.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Experience Reward: {formData.experienceReward} XP</Label>
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                  <Slider
                    value={[formData.experienceReward]}
                    onValueChange={([v]) => updateField("experienceReward", v)}
                    min={100}
                    max={5000}
                    step={100}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Reputation Reward: {formData.reputationReward}</Label>
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  <Slider
                    value={[formData.reputationReward]}
                    onValueChange={([v]) => updateField("reputationReward", v)}
                    min={10}
                    max={500}
                    step={10}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                <Label>Public Challenge</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone can join this challenge
                </p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={v => updateField("isPublic", v)}
              />
            </div>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Challenge Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{formData.name || "Untitled Challenge"}</h3>
                  <Badge>{formData.challengeType}</Badge>
                  <Badge variant="outline">{formData.mode}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.description || "No description provided"}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formData.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {formData.minAgents}-{formData.maxAgents} agents
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {formData.experienceReward} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {formData.reputationReward} rep
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < totalSteps ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Challenge"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
