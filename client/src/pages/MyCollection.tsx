/**
 * My Collection Page
 * Display user's saved/bookmarked LEGO builds
 */

import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bookmark, 
  Search, 
  Grid3X3, 
  List, 
  Heart,
  Puzzle,
  Clock,
  Trash2,
  ExternalLink,
  FolderHeart,
  Loader2,
  BookmarkX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type ViewMode = "grid" | "list";

export default function MyCollection() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch user's bookmarked builds
  const { data: bookmarks, isLoading, refetch } = trpc.bookmarks.myBookmarks.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Remove bookmark mutation
  const removeBookmark = trpc.bookmarks.remove.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Filter bookmarks based on search and tab
  const filteredBookmarks = bookmarks?.filter((bookmark: any) => {
    const matchesSearch = !searchQuery || 
      bookmark.build.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.build.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "recent") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(bookmark.bookmarkedAt) > oneWeekAgo;
    }
    return matchesSearch && bookmark.build.theme === activeTab;
  }) || [];

  // Get unique themes for tabs
  const themes = Array.from(new Set(bookmarks?.map((b: any) => b.build.theme).filter(Boolean) || [])) as string[];

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FolderHeart className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign In to View Your Collection</CardTitle>
              <CardDescription>
                Save your favorite LEGO builds and access them anytime
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

  const handleRemoveBookmark = (buildId: number) => {
    removeBookmark.mutate({ buildId });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-6 sm:py-8 px-4">
        <div className="container max-w-6xl">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FolderHeart className="w-6 h-6 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-heading font-bold">My Collection</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {bookmarks?.length || 0} saved builds
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-9 w-9"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-9 w-9"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="recent" className="text-xs sm:text-sm">Recent</TabsTrigger>
              {themes.slice(0, 5).map(theme => (
                <TabsTrigger key={theme} value={theme} className="text-xs sm:text-sm capitalize">
                  {theme}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredBookmarks.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <BookmarkX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No builds found" : "Your collection is empty"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try a different search term" 
                    : "Start saving builds you love to build your collection"}
                </p>
                <Link href="/build">
                  <Button>Browse Builds</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Builds Grid/List */}
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredBookmarks.map((bookmark: any, index: number) => (
                  <motion.div
                    key={bookmark.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Build Image/Preview */}
                      <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                        {bookmark.build.thumbnailUrl ? (
                          <img 
                            src={bookmark.build.thumbnailUrl} 
                            alt={bookmark.build.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Puzzle className="w-12 h-12 text-primary/30" />
                          </div>
                        )}
                        
                        {/* Quick Actions Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Link href={`/build/${bookmark.build.publicId}`}>
                            <Button size="sm" variant="secondary">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRemoveBookmark(bookmark.build.id)}
                            disabled={removeBookmark.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Theme Badge */}
                        {bookmark.build.theme && (
                          <Badge className="absolute top-2 left-2 capitalize">
                            {bookmark.build.theme}
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-medium truncate mb-1">{bookmark.build.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {bookmark.build.description || "No description"}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Puzzle className="w-3 h-3" />
                            {bookmark.build.currentBricks || 0} bricks
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(bookmark.bookmarkedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {filteredBookmarks.map((bookmark: any, index: number) => (
                  <motion.div
                    key={bookmark.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 overflow-hidden">
                          {bookmark.build.thumbnailUrl ? (
                            <img 
                              src={bookmark.build.thumbnailUrl} 
                              alt={bookmark.build.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Puzzle className="w-6 h-6 text-primary/30" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{bookmark.build.name}</h3>
                            {bookmark.build.theme && (
                              <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">
                                {bookmark.build.theme}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {bookmark.build.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Puzzle className="w-3 h-3" />
                              {bookmark.build.currentBricks || 0} bricks
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Saved {formatDistanceToNow(new Date(bookmark.bookmarkedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/build/${bookmark.build.publicId}`}>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRemoveBookmark(bookmark.build.id)}
                            disabled={removeBookmark.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
