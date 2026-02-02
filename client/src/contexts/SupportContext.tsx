/**
 * Support Context
 * Manages community support prompts across the application
 * Detects credit/resource errors and shows appropriate prompts
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { CommunitySupport } from "@/components/CommunitySupport";

interface SupportContextType {
  // Show the support dialog manually
  showSupportDialog: (message?: string) => void;
  // Trigger support prompt based on an error
  handleError: (error: Error | string) => boolean;
  // Check if an error is credit-related
  isCreditError: (error: Error | string) => boolean;
  // Dismiss the current prompt
  dismiss: () => void;
}

const SupportContext = createContext<SupportContextType | null>(null);

// Keywords that indicate credit/resource issues
const CREDIT_ERROR_KEYWORDS = [
  "credit",
  "credits",
  "quota",
  "limit exceeded",
  "rate limit",
  "insufficient",
  "out of",
  "exhausted",
  "capacity",
  "throttle",
  "too many requests",
  "resource unavailable",
];

export function SupportProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>();

  // Listen for credit-error events from main.tsx
  useEffect(() => {
    const handleCreditError = (event: CustomEvent<{ message: string }>) => {
      const friendlyMessages = [
        "Our AI agents have been working hard and need a little boost to keep going!",
        "We've reached our current capacity. Your support helps us scale up!",
        "The agents are taking a short break while we recharge. Want to help speed things up?",
        "High demand! Community support helps us serve everyone better.",
      ];
      
      const randomMessage = friendlyMessages[Math.floor(Math.random() * friendlyMessages.length)];
      setCustomMessage(randomMessage);
      setIsOpen(true);
    };

    window.addEventListener('credit-error', handleCreditError as EventListener);
    return () => window.removeEventListener('credit-error', handleCreditError as EventListener);
  }, []);

  const isCreditError = useCallback((error: Error | string): boolean => {
    const message = typeof error === "string" ? error : error.message;
    const lowerMessage = message.toLowerCase();
    
    return CREDIT_ERROR_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }, []);

  const showSupportDialog = useCallback((message?: string) => {
    setCustomMessage(message);
    setIsOpen(true);
  }, []);

  const handleError = useCallback((error: Error | string): boolean => {
    if (isCreditError(error)) {
      const friendlyMessages = [
        "Our AI agents have been working hard and need a little boost to keep going!",
        "We've reached our current capacity. Your support helps us scale up!",
        "The agents are taking a short break while we recharge. Want to help speed things up?",
        "High demand! Community support helps us serve everyone better.",
      ];
      
      const randomMessage = friendlyMessages[Math.floor(Math.random() * friendlyMessages.length)];
      setCustomMessage(randomMessage);
      setIsOpen(true);
      return true;
    }
    return false;
  }, [isCreditError]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    setCustomMessage(undefined);
  }, []);

  return (
    <SupportContext.Provider value={{ showSupportDialog, handleError, isCreditError, dismiss }}>
      {children}
      <CommunitySupport
        isOpen={isOpen}
        customMessage={customMessage}
        onDismiss={dismiss}
        trigger="error"
      />
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error("useSupport must be used within a SupportProvider");
  }
  return context;
}

export default SupportContext;
