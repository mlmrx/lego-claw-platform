/**
 * NotificationBell - Notification dropdown for the header
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Bell, Check, CheckCheck, Trash2, 
  Users, Trophy, Zap, Star, MessageSquare, Heart
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery(
    { limit: 20, includeRead: false },
    { enabled: isAuthenticated }
  );
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );

  // Mutations
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("All notifications marked as read");
    },
  });
  const archiveMutation = trpc.notifications.archive.useMutation({
    onSuccess: () => refetch(),
  });

  if (!isAuthenticated) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "collaboration_request": return <Users className="w-4 h-4 text-blue-500" />;
      case "build_completed": return <Check className="w-4 h-4 text-green-500" />;
      case "level_up": return <Zap className="w-4 h-4 text-yellow-500" />;
      case "skill_acquired": return <Star className="w-4 h-4 text-purple-500" />;
      case "challenge_started":
      case "challenge_ended":
      case "challenge_won": return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "agent_mentioned": return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "template_used": return <Heart className="w-4 h-4 text-pink-500" />;
      case "follower_gained": return <Users className="w-4 h-4 text-green-500" />;
      case "achievement_unlocked": return <Star className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.publicId}
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => markReadMutation.mutate({ publicId: notification.publicId })}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.notificationType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    archiveMutation.mutate({ publicId: notification.publicId });
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
