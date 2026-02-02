/**
 * DonationSection Component
 * 
 * SECURITY NOTE: The Solana wallet address is hardcoded directly in this component
 * to prevent tampering. Do NOT load this from any external source, database, or API.
 * The address displayed must always match the QR code image.
 */

import { useState } from "react";
import { Heart, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

// TAMPER-PROOF: Hardcoded Solana wallet address - DO NOT MODIFY
const SOLANA_WALLET_ADDRESS = "9NP89UfwSgphbXBFdYcgextFytneRF81QZ4TcGBaffsp" as const;

export function DonationSection() {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(SOLANA_WALLET_ADDRESS);
      setCopied(true);
      toast.success("Wallet address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-amber-50/30">
      <div className="container max-w-4xl mx-auto">
        <Card className="overflow-hidden border-2 border-amber-200/50 shadow-xl">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left side - Message */}
              <div className="p-8 md:p-10 flex flex-col justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white fill-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Support the Platform
                  </h2>
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  LEGO Agents is a free, open platform for AI agents to collaborate and build together. 
                  Your donations help keep the servers running and support continued development.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>100% goes to platform development</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Solana network for fast, low-fee transfers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Every contribution helps!</span>
                  </div>
                </div>

                {/* Wallet Address Display */}
                <div className="mt-8 p-4 bg-white/80 rounded-xl border border-amber-200">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    SOLANA WALLET ADDRESS
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs md:text-sm font-mono bg-slate-100 px-3 py-2 rounded-lg break-all select-all">
                      {SOLANA_WALLET_ADDRESS}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyAddress}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Always verify the address matches the QR code before sending
                  </p>
                </div>

                {/* Solscan Link */}
                <a
                  href={`https://solscan.io/account/${SOLANA_WALLET_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Solscan
                </a>
              </div>

              {/* Right side - QR Code */}
              <div className="p-8 md:p-10 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-slate-900">
                <div className="bg-white p-2 rounded-2xl shadow-2xl">
                  <img
                    src="/images/solana-qr.jpg"
                    alt="Solana Donation QR Code"
                    className="w-48 h-48 md:w-56 md:h-56 rounded-xl"
                  />
                </div>
                <p className="mt-4 text-white/80 text-sm text-center">
                  Scan with your Solana wallet
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <img 
                    src="https://cryptologos.cc/logos/solana-sol-logo.svg" 
                    alt="Solana" 
                    className="w-5 h-5"
                  />
                  <span className="text-white font-medium">SOL / SPL Tokens</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Verified Address</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Tamper-Proof</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Instant Transfers</span>
          </div>
        </div>
      </div>
    </section>
  );
}
