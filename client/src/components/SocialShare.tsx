import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Twitter, Link2, Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SocialShareProps {
  type: "build" | "agent" | "challenge";
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  hashtags?: string[];
  className?: string;
}

export function SocialShare({
  type,
  title,
  description,
  url,
  imageUrl,
  hashtags = ["LEGOAgents", "AIBuilders"],
  className,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  // Generate the share URL
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  // Generate Twitter/X share text based on type
  const getShareText = () => {
    switch (type) {
      case "build":
        return `🧱 Check out this amazing LEGO build: "${title}"${description ? ` - ${description}` : ""}\n\nBuilt by AI agents on @LEGOAgents`;
      case "agent":
        return `🤖 Meet ${title}, an AI builder on @LEGOAgents!${description ? `\n\n${description}` : ""}\n\nWatch them build amazing LEGO creations`;
      case "challenge":
        return `🏆 Join the "${title}" challenge on @LEGOAgents!${description ? `\n\n${description}` : ""}\n\nCompete with AI agents`;
      default:
        return title;
    }
  };

  // Generate Twitter/X share URL
  const getTwitterShareUrl = () => {
    const text = encodeURIComponent(getShareText());
    const urlParam = encodeURIComponent(shareUrl);
    const hashtagsParam = hashtags.join(",");
    return `https://twitter.com/intent/tweet?text=${text}&url=${urlParam}&hashtags=${hashtagsParam}`;
  };

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Share on Twitter/X
  const shareOnTwitter = () => {
    window.open(getTwitterShareUrl(), "_blank", "width=550,height=420");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={shareOnTwitter} className="cursor-pointer">
          <Twitter className="w-4 h-4 mr-2" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Standalone Twitter/X share button
export function TwitterShareButton({
  text,
  url,
  hashtags = ["LEGOAgents"],
  className,
}: {
  text: string;
  url?: string;
  hashtags?: string[];
  className?: string;
}) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = () => {
    const tweetText = encodeURIComponent(text);
    const urlParam = encodeURIComponent(shareUrl);
    const hashtagsParam = hashtags.join(",");
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${urlParam}&hashtags=${hashtagsParam}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={className}
    >
      <Twitter className="w-4 h-4 mr-2" />
      Share on X
    </Button>
  );
}

// Share card preview component for generating OG images
export function SharePreviewCard({
  type,
  title,
  description,
  imageUrl,
  stats,
}: {
  type: "build" | "agent" | "challenge";
  title: string;
  description?: string;
  imageUrl?: string;
  stats?: { label: string; value: string | number }[];
}) {
  const getTypeIcon = () => {
    switch (type) {
      case "build":
        return "🧱";
      case "agent":
        return "🤖";
      case "challenge":
        return "🏆";
      default:
        return "✨";
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "build":
        return "LEGO Build";
      case "agent":
        return "AI Agent";
      case "challenge":
        return "Challenge";
      default:
        return "LEGO Agents";
    }
  };

  return (
    <div className="w-[600px] h-[315px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden flex">
      {/* Left side - Image or placeholder */}
      <div className="w-[315px] h-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-8xl">{getTypeIcon()}</span>
        )}
      </div>

      {/* Right side - Content */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">
          {getTypeLabel()}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{description}</p>
        )}

        {stats && stats.length > 0 && (
          <div className="mt-auto grid grid-cols-2 gap-2">
            {stats.slice(0, 4).map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-bold text-red-600">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <span className="font-bold text-red-600">LEGO</span>
          <span>Agents</span>
        </div>
      </div>
    </div>
  );
}
