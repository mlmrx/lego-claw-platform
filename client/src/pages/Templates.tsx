/**
 * Templates Page - Browse and manage build templates
 */

import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Search, Heart, Download, Star, Plus, Blocks, 
  Sparkles, Clock, Users, Filter, Grid3X3
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Templates() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    theme: "",
    difficulty: "intermediate" as const,
  });

  // Fetch templates
  const { data: publicTemplates = [], isLoading: loadingPublic } = trpc.templates.list.useQuery({ limit: 50 });
  const { data: featuredTemplates = [], isLoading: loadingFeatured } = trpc.templates.featured.useQuery({ limit: 6 });
  const { data: myTemplates = [], isLoading: loadingMy } = trpc.templates.myTemplates.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const useTemplateMutation = trpc.templates.use.useMutation({
    onSuccess: () => {
      toast.success("Template loaded! Start building.");
    },
  });

  const likeTemplateMutation = trpc.templates.like.useMutation({
    onSuccess: () => {
      toast.success("Template liked!");
    },
  });

  const filteredTemplates = publicTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.theme?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-orange-100 text-orange-800";
      case "expert": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
              <Grid3X3 className="w-8 h-8 text-primary" />
              Build Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Save and share your favorite LEGO designs
            </p>
          </div>
          {isAuthenticated && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="ml-auto rounded-xl gap-2">
                  <Plus className="w-4 h-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Save a build design as a reusable template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      placeholder="My Awesome Build"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe your template..."
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Input
                        placeholder="e.g., Space, Medieval"
                        value={newTemplate.theme}
                        onChange={(e) => setNewTemplate({ ...newTemplate, theme: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={newTemplate.difficulty}
                        onValueChange={(v: any) => setNewTemplate({ ...newTemplate, difficulty: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    toast.info("Template creation requires an active build. Start building first!");
                    setCreateDialogOpen(false);
                  }}>
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Featured Templates */}
        {featuredTemplates.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Featured Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTemplates.map((template, i) => (
                <motion.div
                  key={template.publicId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Blocks className="w-16 h-16 text-primary/40" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {template.description || "A beautiful LEGO creation"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Blocks className="w-4 h-4" />
                          {template.totalBricks} bricks
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          {template.usageCount} uses
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => likeTemplateMutation.mutate({ publicId: template.publicId })}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        {template.likes}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => useTemplateMutation.mutate({ publicId: template.publicId })}
                      >
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Search and Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="popular">Most Popular</TabsTrigger>
            {isAuthenticated && <TabsTrigger value="my">My Templates</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loadingPublic ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-24 bg-muted" />
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="p-12 text-center">
                <Blocks className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Be the first to create a template!"}
                </p>
                {isAuthenticated && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates.map((template, i) => (
                  <motion.div
                    key={template.publicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Blocks className="w-12 h-12 text-primary/30" />
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                          {template.difficulty && (
                            <Badge className={getDifficultyColor(template.difficulty)} variant="secondary">
                              {template.difficulty}
                            </Badge>
                          )}
                        </div>
                        {template.theme && (
                          <Badge variant="outline" className="w-fit">
                            {template.theme}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Blocks className="w-3 h-3" />
                            {template.totalBricks}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {template.usageCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {template.likes}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likeTemplateMutation.mutate({ publicId: template.publicId })}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => useTemplateMutation.mutate({ publicId: template.publicId })}
                        >
                          Use
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...filteredTemplates]
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 12)
                .map((template, i) => (
                  <motion.div
                    key={template.publicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                        <Blocks className="w-12 h-12 text-primary/30" />
                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                          #{i + 1}
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {template.usageCount} uses
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => useTemplateMutation.mutate({ publicId: template.publicId })}
                        >
                          Use Template
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="my">
              {loadingMy ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-24 bg-muted" />
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : myTemplates.length === 0 ? (
                <Card className="p-12 text-center">
                  <Blocks className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Save your builds as templates to reuse them later
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Template
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTemplates.map((template) => (
                    <Card key={template.publicId} className="overflow-hidden">
                      <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Blocks className="w-12 h-12 text-primary/30" />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {template.description || "Your custom template"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{template.totalBricks} bricks</span>
                          <span>{template.usageCount} uses</span>
                          <span>{template.likes} likes</span>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1">
                          Use
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
