/**
 * Community Support Component
 * A tasteful, non-intrusive donation prompt that appears contextually
 * when the platform needs community help (e.g., credit issues)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Coffee, 
  Sparkles, 
  X, 
  ExternalLink,
  Clock,
  Users,
  Zap,
  Copy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Solana wallet address for donations
const DONATION_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

interface CommunitySupportProps {
  // When to show the prompt
  trigger?: "error" | "manual" | "contextual";
  // Custom message for the situation
  customMessage?: string;
  // Whether to show as a banner or dialog
  variant?: "banner" | "dialog" | "inline";
  // Callback when dismissed
  onDismiss?: () => void;
  // Whether the prompt is visible
  isOpen?: boolean;
}

// Storage key for tracking dismissals
const DISMISS_KEY = "lego-agents-support-dismissed";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getDismissedUntil(): number | null {
  try {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored) {
      const until = parseInt(stored, 10);
      if (until > Date.now()) return until;
    }
  } catch {}
  return null;
}

function setDismissedUntil(hours: number) {
  try {
    const until = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, until.toString());
  } catch {}
}

export function CommunitySupport({
  trigger = "contextual",
  customMessage,
  variant = "dialog",
  onDismiss,
  isOpen: controlledOpen,
}: CommunitySupportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Check if we should show based on dismissal
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen);
    } else if (trigger === "contextual") {
      const dismissedUntil = getDismissedUntil();
      if (!dismissedUntil) {
        // Only show contextually after some interaction
        const timer = setTimeout(() => setIsOpen(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [controlledOpen, trigger]);

  const handleDismiss = (remindLater?: number) => {
    if (remindLater) {
      setDismissedUntil(remindLater);
      toast.info(`We'll check back in ${remindLater} hours. Thank you for considering!`);
    }
    setIsOpen(false);
    onDismiss?.();
  };

  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_WALLET);
      setCopied(true);
      toast.success("Wallet address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const handleDonationClick = () => {
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 3000);
  };

  const defaultMessage = customMessage || 
    "Our AI agents run on credits that help keep the platform alive. When we run low, the magic slows down. Your support helps keep the agents building!";

  // Inline variant - subtle banner
  if (variant === "inline") {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {defaultMessage}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 hover:bg-amber-100"
                      onClick={copyWalletAddress}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                      <span className="hidden sm:inline ml-1">Support</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(24)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Banner variant - top of page
  if (variant === "banner") {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 p-4"
          >
            <Card className="max-w-4xl mx-auto border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-red-950/40 shadow-lg">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Help Keep the Agents Building!</h3>
                    <p className="text-sm text-muted-foreground">
                      {defaultMessage}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      onClick={() => setIsOpen(true)}
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      Support
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(24)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Dialog variant - full modal (default)
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Community Support</DialogTitle>
              <DialogDescription>Help keep LEGO Agents running</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* The Story */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {defaultMessage}
            </p>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-primary/5">
              <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-lg font-bold">24/7</div>
              <div className="text-xs text-muted-foreground">Agent Activity</div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-lg font-bold">2,847</div>
              <div className="text-xs text-muted-foreground">Active Agents</div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5">
              <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-lg font-bold">∞</div>
              <div className="text-xs text-muted-foreground">Builds Possible</div>
            </div>
          </div>

          {/* Donation Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Ways to Help</h4>
            
            {/* SOL Wallet */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">SOL</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Solana</div>
                    <div className="text-xs text-muted-foreground">Send any amount</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">Preferred</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono truncate">
                  {DONATION_WALLET}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyWalletAddress}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2">
              {[0.1, 0.5, 1, 5].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    copyWalletAddress();
                    handleDonationClick();
                  }}
                >
                  {amount} SOL
                </Button>
              ))}
            </div>
          </div>

          {/* Thank You Animation */}
          <AnimatePresence>
            {showThankYou && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Heart className="w-16 h-16 mx-auto text-red-500 fill-red-500" />
                  </motion.div>
                  <p className="mt-4 font-bold text-lg">Thank You!</p>
                  <p className="text-sm text-muted-foreground">Your support means everything</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => handleDismiss(24)}
            >
              <Clock className="w-4 h-4 mr-1" />
              Remind me later
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => handleDismiss(168)} // 1 week
            >
              Don't show for a week
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to trigger community support prompt on errors
 */
export function useCommunitySupportOnError() {
  const [showSupport, setShowSupport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const triggerOnError = (error: Error | string) => {
    const message = typeof error === "string" ? error : error.message;
    
    // Check if it's a credit-related error
    const creditKeywords = ["credit", "quota", "limit", "insufficient", "exceeded", "rate limit"];
    const isCreditError = creditKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (isCreditError) {
      setErrorMessage("We've hit our AI credit limit. The agents need a little help to keep building!");
      setShowSupport(true);
    }
  };

  return {
    showSupport,
    errorMessage,
    triggerOnError,
    closeSupport: () => setShowSupport(false),
  };
}

/**
 * Error boundary wrapper that shows donation prompt on credit errors
 */
export function CreditErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { showSupport, errorMessage, closeSupport } = useCommunitySupportOnError();

  return (
    <>
      {children}
      <CommunitySupport
        isOpen={showSupport}
        customMessage={errorMessage}
        onDismiss={closeSupport}
        trigger="error"
      />
    </>
  );
}

export default CommunitySupport;
