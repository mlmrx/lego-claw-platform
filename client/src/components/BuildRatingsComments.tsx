/**
 * BuildRatingsComments - Ratings and comments section for LEGO builds
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  Sparkles, 
  Palette, 
  Wrench,
  Reply,
  Edit2,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface BuildRatingsCommentsProps {
  buildPublicId: string;
  className?: string;
}

// Star rating component
function StarRating({ 
  value, 
  onChange, 
  readonly = false,
  size = "md"
}: { 
  value: number; 
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hoverValue, setHoverValue] = useState(0);
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hoverValue || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// Rating form component
function RatingForm({ 
  buildPublicId, 
  existingRating,
  onSuccess 
}: { 
  buildPublicId: string;
  existingRating?: {
    overallRating: number;
    creativityRating?: number | null;
    technicalRating?: number | null;
    aestheticsRating?: number | null;
  };
  onSuccess: () => void;
}) {
  const [overall, setOverall] = useState(existingRating?.overallRating || 0);
  const [creativity, setCreativity] = useState(existingRating?.creativityRating || 0);
  const [technical, setTechnical] = useState(existingRating?.technicalRating || 0);
  const [aesthetics, setAesthetics] = useState(existingRating?.aestheticsRating || 0);

  const rateMutation = trpc.ratings.rate.useMutation({
    onSuccess: () => {
      toast.success(existingRating ? "Rating updated!" : "Thanks for rating!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (overall === 0) {
      toast.error("Please provide an overall rating");
      return;
    }
    rateMutation.mutate({
      buildPublicId,
      overallRating: overall,
      creativityRating: creativity || undefined,
      technicalRating: technical || undefined,
      aestheticsRating: aesthetics || undefined,
    });
  };

  return (
    <Card className="bg-card/50">
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Rating *</span>
            <StarRating value={overall} onChange={setOverall} size="lg" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                Creativity
              </div>
              <StarRating value={creativity} onChange={setCreativity} size="sm" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Wrench className="w-3 h-3" />
                Technical
              </div>
              <StarRating value={technical} onChange={setTechnical} size="sm" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Palette className="w-3 h-3" />
                Aesthetics
              </div>
              <StarRating value={aesthetics} onChange={setAesthetics} size="sm" />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={rateMutation.isPending || overall === 0}
          className="w-full"
        >
          {rateMutation.isPending ? "Submitting..." : existingRating ? "Update Rating" : "Submit Rating"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Comment component
function Comment({ 
  comment, 
  buildPublicId,
  onReply,
  depth = 0 
}: { 
  comment: {
    id: number;
    publicId: string;
    userId: number;
    content: string;
    isEdited: boolean;
    likes: number;
    replyCount: number;
    createdAt: Date;
    userName: string | null;
    userDisplayName: string | null;
    userAvatarUrl: string | null;
  };
  buildPublicId: string;
  onReply: (parentPublicId: string) => void;
  depth?: number;
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const utils = trpc.useUtils();

  const { data: replies = [] } = trpc.comments.getBuildComments.useQuery(
    { buildPublicId, parentPublicId: comment.publicId },
    { enabled: showReplies && comment.replyCount > 0 }
  );

  const { data: hasLiked = false } = trpc.comments.hasLiked.useQuery(
    { publicId: comment.publicId },
    { enabled: !!user }
  );

  const likeMutation = trpc.comments.like.useMutation({
    onSuccess: () => {
      utils.comments.getBuildComments.invalidate();
      utils.comments.hasLiked.invalidate();
    },
  });

  const unlikeMutation = trpc.comments.unlike.useMutation({
    onSuccess: () => {
      utils.comments.getBuildComments.invalidate();
      utils.comments.hasLiked.invalidate();
    },
  });

  const updateMutation = trpc.comments.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.comments.getBuildComments.invalidate();
      toast.success("Comment updated");
    },
  });

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.getBuildComments.invalidate();
      toast.success("Comment deleted");
    },
  });

  const handleLikeToggle = () => {
    if (hasLiked) {
      unlikeMutation.mutate({ publicId: comment.publicId });
    } else {
      likeMutation.mutate({ publicId: comment.publicId });
    }
  };

  const displayName = comment.userDisplayName || comment.userName || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();
  const isOwner = user?.id === comment.userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-2", depth > 0 && "ml-8 pl-4 border-l-2 border-muted")}
    >
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.userAvatarUrl || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isEdited && (
              <Badge variant="outline" className="text-xs py-0">edited</Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ publicId: comment.publicId, content: editContent })}
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90">{comment.content}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", hasLiked && "text-primary")}
              onClick={handleLikeToggle}
              disabled={!user}
            >
              <ThumbsUp className={cn("w-3.5 h-3.5 mr-1", hasLiked && "fill-current")} />
              {comment.likes}
            </Button>

            {depth < 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => onReply(comment.publicId)}
                disabled={!user}
              >
                <Reply className="w-3.5 h-3.5 mr-1" />
                Reply
              </Button>
            )}

            {comment.replyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowReplies(!showReplies)}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                {showReplies ? "Hide" : "Show"} {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
              </Button>
            )}

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate({ publicId: comment.publicId })}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      <AnimatePresence>
        {showReplies && replies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {replies.map((reply: any) => (
              <Comment
                key={reply.publicId}
                comment={reply}
                buildPublicId={buildPublicId}
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function BuildRatingsComments({ buildPublicId, className }: BuildRatingsCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const utils = trpc.useUtils();

  // Queries
  const { data: ratingsData } = trpc.ratings.getBuildRatings.useQuery({ buildPublicId });
  const { data: myRating } = trpc.ratings.myRating.useQuery(
    { buildPublicId },
    { enabled: isAuthenticated }
  );
  const { data: comments = [] } = trpc.comments.getBuildComments.useQuery({ buildPublicId });
  const { data: commentCount = 0 } = trpc.comments.getCount.useQuery({ buildPublicId });

  // Mutations
  const createCommentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      setReplyingTo(null);
      utils.comments.getBuildComments.invalidate();
      utils.comments.getCount.invalidate();
      toast.success("Comment posted!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate({
      buildPublicId,
      content: newComment.trim(),
      parentPublicId: replyingTo || undefined,
    });
  };

  const averages = ratingsData?.averages;
  const totalRatings = averages?.totalRatings || 0;

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="ratings">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ratings" className="gap-2">
            <Star className="w-4 h-4" />
            Ratings ({totalRatings})
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments ({commentCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ratings" className="space-y-4 mt-4">
          {/* Average Ratings Summary */}
          {averages && totalRatings > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">
                      {(averages.avgOverall || 0).toFixed(1)}
                    </div>
                    <StarRating value={Math.round(averages.avgOverall || 0)} readonly size="sm" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2 border-l pl-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">Creativity</span>
                      <StarRating value={Math.round(averages.avgCreativity || 0)} readonly size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">Technical</span>
                      <StarRating value={Math.round(averages.avgTechnical || 0)} readonly size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">Aesthetics</span>
                      <StarRating value={Math.round(averages.avgAesthetics || 0)} readonly size="sm" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating Form */}
          {isAuthenticated ? (
            <div>
              <h4 className="text-sm font-medium mb-2">
                {myRating ? "Update your rating" : "Rate this build"}
              </h4>
              <RatingForm
                buildPublicId={buildPublicId}
                existingRating={myRating || undefined}
                onSuccess={() => {
                  utils.ratings.getBuildRatings.invalidate();
                  utils.ratings.myRating.invalidate();
                }}
              />
            </div>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="py-4 text-center text-sm text-muted-foreground">
                Sign in to rate this build
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4 mt-4">
          {/* Comment Form */}
          {isAuthenticated ? (
            <Card className="bg-card/50">
              <CardContent className="pt-4 space-y-3">
                {replyingTo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Reply className="w-4 h-4" />
                    Replying to comment
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <Textarea
                  placeholder="Share your thoughts about this build..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || createCommentMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="py-4 text-center text-sm text-muted-foreground">
                Sign in to leave a comment
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment: any) => (
                <Comment
                  key={comment.publicId}
                  comment={comment}
                  buildPublicId={buildPublicId}
                  onReply={setReplyingTo}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BuildRatingsComments;
