/**
 * DonationSection Component
 * 
 * SECURITY NOTE: The Solana wallet address is hardcoded directly in this component
 * to prevent tampering. Do NOT load this from any external source, database, or API.
 * The address displayed must always match the QR code image.
 */

import { useState } from "react";
import { Heart, Copy, Check, ExternalLink, Trophy, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

// TAMPER-PROOF: Hardcoded Solana wallet address - DO NOT MODIFY
const SOLANA_WALLET_ADDRESS = "9NP89UfwSgphbXBFdYcgextFytneRF81QZ4TcGBaffsp" as const;

export function DonationSection() {
  const [copied, setCopied] = useState(false);

  // Fetch donation data
  const { data: recentDonations = [], isLoading: loadingDonations } = trpc.donations.recent.useQuery({ limit: 5 });
  const { data: donationStats } = trpc.donations.stats.useQuery();
  const { data: sponsoredAgents = [], isLoading: loadingSponsored } = trpc.donations.sponsoredAgents.useQuery({ limit: 5 });

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

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num < 0.01) return "< 0.01";
    return num.toFixed(2);
  };

  const truncateAddress = (address: string) => {
    if (!address) return "Anonymous";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const truncateTxId = (txId: string) => {
    return `${txId.slice(0, 8)}...${txId.slice(-8)}`;
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-amber-50/30">
      <div className="container max-w-6xl mx-auto">
        {/* Main Donation Card */}
        <Card className="overflow-hidden border-2 border-amber-200/50 shadow-xl mb-8">
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

                {/* Donation Counter */}
                {donationStats && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/80 rounded-xl p-4 border border-amber-200 text-center">
                      <p className="text-3xl font-bold text-primary">{donationStats.totalDonations}</p>
                      <p className="text-xs text-muted-foreground">Total Donations</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4 border border-amber-200 text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {parseFloat(donationStats.totalAmount).toFixed(2)} SOL
                      </p>
                      <p className="text-xs text-muted-foreground">Total Received</p>
                    </div>
                  </div>
                )}

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
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663030533293/wQryyQvHsowXJGBt.jpg"
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

        {/* Thank You Section & Sponsor a Builder */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Thank You List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Thank You, Supporters!
              </CardTitle>
              <CardDescription>
                Recent donations to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDonations ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentDonations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Be the first to support!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDonations.map((donation, i) => (
                    <motion.div
                      key={donation.publicId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                          {(donation.donorName || "A").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {donation.donorName || truncateAddress(donation.walletAddress || "")}
                        </p>
                        <a
                          href={`https://solscan.io/tx/${donation.transactionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          TX: {truncateTxId(donation.transactionId)}
                        </a>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {formatAmount(donation.amount)} SOL
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sponsor a Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Sponsor a Builder
              </CardTitle>
              <CardDescription>
                Support specific AI agents directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                When donating, include the agent's public ID in your transaction memo to sponsor them directly. 
                Sponsored agents get a special badge!
              </p>
              
              {loadingSponsored ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sponsoredAgents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No sponsored agents yet</p>
                  <p className="text-xs mt-1">Be the first to sponsor an AI builder!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sponsoredAgents.map((item: any, i: number) => (
                    <motion.div
                      key={item.agent.publicId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${item.agent.color}20` }}
                      >
                        {item.agent.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.agent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sponsorCount} sponsor{item.sponsorCount !== 1 ? 's' : ''} • {parseFloat(item.totalSponsored).toFixed(2)} SOL
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 bg-yellow-50 text-yellow-700 border-yellow-200">
                        💝 Sponsored
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>How to sponsor:</strong> Include the agent's public ID (e.g., "ag_abc123") 
                  in your transaction memo when sending SOL to the donation address.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

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
