import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { 
  Plus, 
  Trash2, 
  Settings, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Activity,
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff,
  BarChart3,
  Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";

type Platform = {
  id: string;
  name: string;
  icon: string;
  color: string;
  requiresOAuth: boolean;
};

export default function Integrations() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    apiKey: "",
    apiSecret: "",
    platformUsername: "",
    channelId: "",
    channelUrl: "",
    autoStream: false,
    notifyOnLive: true,
  });

  const { data: platforms } = trpc.integrations.platforms.useQuery();
  const { data: integrations, refetch: refetchIntegrations } = trpc.integrations.myIntegrations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.integrations.create.useMutation({
    onSuccess: () => {
      toast.success("Integration added successfully!");
      setShowAddDialog(false);
      resetForm();
      refetchIntegrations();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add integration");
    },
  });

  const deleteMutation = trpc.integrations.delete.useMutation({
    onSuccess: () => {
      toast.success("Integration removed");
      refetchIntegrations();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove integration");
    },
  });

  const verifyMutation = trpc.integrations.verify.useMutation({
    onSuccess: () => {
      toast.success("Integration verified!");
      refetchIntegrations();
    },
    onError: (error) => {
      toast.error(error.message || "Verification failed");
    },
  });

  const resetForm = () => {
    setSelectedPlatform("");
    setFormData({
      apiKey: "",
      apiSecret: "",
      platformUsername: "",
      channelId: "",
      channelUrl: "",
      autoStream: false,
      notifyOnLive: true,
    });
  };

  const handleSubmit = () => {
    if (!selectedPlatform) {
      toast.error("Please select a platform");
      return;
    }

    createMutation.mutate({
      platform: selectedPlatform as any,
      apiKey: formData.apiKey || undefined,
      apiSecret: formData.apiSecret || undefined,
      platformUsername: formData.platformUsername || undefined,
      channelId: formData.channelId || undefined,
      channelUrl: formData.channelUrl || undefined,
      autoStream: formData.autoStream,
      notifyOnLive: formData.notifyOnLive,
    });
  };

  const getPlatformInfo = (platformId: string): Platform | undefined => {
    return platforms?.find(p => p.id === platformId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Streaming Integrations</h1>
          <p className="text-muted-foreground mb-8">
            Connect streaming platforms to broadcast Krewdoo crew missions.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign in to manage integrations</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Streaming Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect your streaming platforms to broadcast builds live
            </p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Streaming Integration</DialogTitle>
                <DialogDescription>
                  Connect a streaming platform using your API credentials
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms?.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          <span className="flex items-center gap-2">
                            <span>{platform.icon}</span>
                            <span>{platform.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPlatform && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key / Client ID</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your API key"
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your API key is encrypted and stored securely
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiSecret">API Secret (optional)</Label>
                      <Input
                        id="apiSecret"
                        type="password"
                        placeholder="Enter your API secret"
                        value={formData.apiSecret}
                        onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Platform Username</Label>
                      <Input
                        id="username"
                        placeholder="Your username on this platform"
                        value={formData.platformUsername}
                        onChange={(e) => setFormData({ ...formData, platformUsername: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="channelUrl">Channel URL (optional)</Label>
                      <Input
                        id="channelUrl"
                        type="url"
                        placeholder="https://..."
                        value={formData.channelUrl}
                        onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-stream builds</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically start streaming when building
                        </p>
                      </div>
                      <Switch
                        checked={formData.autoStream}
                        onCheckedChange={(checked) => setFormData({ ...formData, autoStream: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notify when live</Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified when your stream goes live
                        </p>
                      </div>
                      <Switch
                        checked={formData.notifyOnLive}
                        onCheckedChange={(checked) => setFormData({ ...formData, notifyOnLive: checked })}
                      />
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedPlatform || createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Integration
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active Integrations</TabsTrigger>
            <TabsTrigger value="health">Health Monitor</TabsTrigger>
            <TabsTrigger value="available">Available Platforms</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {integrations?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No integrations configured yet
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Integration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {integrations?.map((integration) => {
                  const platform = getPlatformInfo(integration.platform);
                  return (
                    <Card key={integration.publicId} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: platform?.color + '20' }}
                            >
                              {platform?.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {platform?.name || integration.platform}
                              </CardTitle>
                              {integration.platformUsername && (
                                <CardDescription>
                                  @{integration.platformUsername}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <Badge variant={integration.isVerified ? "default" : "secondary"}>
                            {integration.isVerified ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Verified</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" /> Unverified</>
                            )}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">API Key:</span>
                          <code className="bg-muted px-2 py-0.5 rounded text-xs">
                            {showApiKey[integration.publicId] 
                              ? `****${integration.keyHint || '****'}`
                              : '••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setShowApiKey(prev => ({
                              ...prev,
                              [integration.publicId]: !prev[integration.publicId]
                            }))}
                          >
                            {showApiKey[integration.publicId] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Streams:</span>
                            <span className="ml-2 font-medium">{integration.totalStreams}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Viewers:</span>
                            <span className="ml-2 font-medium">{integration.totalViewers}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className={integration.autoStream ? "text-green-600" : "text-muted-foreground"}>
                            {integration.autoStream ? "Auto-stream enabled" : "Manual streaming"}
                          </span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          {integration.channelUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={integration.channelUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Channel
                              </a>
                            </Button>
                          )}
                          {!integration.isVerified && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => verifyMutation.mutate({ publicId: integration.publicId })}
                              disabled={verifyMutation.isPending}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${verifyMutation.isPending ? 'animate-spin' : ''}`} />
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Remove this integration?")) {
                                deleteMutation.mutate({ publicId: integration.publicId });
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            {/* Health Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Integrations</p>
                      <p className="text-2xl font-bold">{integrations?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Healthy</p>
                      <p className="text-2xl font-bold text-green-600">
                        {integrations?.filter(i => i.isVerified && i.isActive).length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Needs Attention</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {integrations?.filter(i => !i.isVerified).length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Disconnected</p>
                      <p className="text-2xl font-bold text-red-600">
                        {integrations?.filter(i => !i.isActive).length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <WifiOff className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Health Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Integration Health Status
                </CardTitle>
                <CardDescription>
                  Real-time connection status and last sync times
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integrations?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No integrations to monitor
                  </p>
                ) : (
                  <div className="space-y-4">
                    {integrations?.map((integration) => {
                      const platform = getPlatformInfo(integration.platform);
                      const isHealthy = integration.isVerified && integration.isActive;
                      const needsAttention = !integration.isVerified;
                      const isDisconnected = !integration.isActive;
                      
                      // Calculate token expiry status (use lastVerifiedAt as proxy for health)
                      const lastVerified = integration.lastVerifiedAt ? new Date(integration.lastVerifiedAt) : null;
                      const daysSinceVerified = lastVerified ? (Date.now() - lastVerified.getTime()) / (24 * 60 * 60 * 1000) : null;
                      const isStale = daysSinceVerified !== null && daysSinceVerified > 7;
                      const isVeryStale = daysSinceVerified !== null && daysSinceVerified > 30;
                      
                      // Calculate health score
                      let healthScore = 100;
                      if (!integration.isVerified) healthScore -= 30;
                      if (!integration.isActive) healthScore -= 50;
                      if (isVeryStale) healthScore -= 40;
                      else if (isStale) healthScore -= 20;
                      healthScore = Math.max(0, healthScore);
                      
                      return (
                        <div 
                          key={integration.publicId}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                        >
                          {/* Platform Icon */}
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                            style={{ backgroundColor: platform?.color + '20' }}
                          >
                            {platform?.icon}
                          </div>
                          
                          {/* Platform Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {platform?.name || integration.platform}
                              </span>
                              {integration.platformUsername && (
                                <span className="text-sm text-muted-foreground">
                                  @{integration.platformUsername}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last sync: {integration.lastVerifiedAt 
                                  ? new Date(integration.lastVerifiedAt).toLocaleString()
                                  : 'Never'
                                }
                              </span>
                              {daysSinceVerified !== null && daysSinceVerified > 3 && (
                                <span className={`flex items-center gap-1 ${
                                  isVeryStale ? 'text-red-600' : 
                                  isStale ? 'text-yellow-600' : ''
                                }`}>
                                  {Math.floor(daysSinceVerified)} days since verified
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Health Score */}
                          <div className="w-32 flex-shrink-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Health</span>
                              <span className={`text-xs font-medium ${
                                healthScore >= 80 ? 'text-green-600' :
                                healthScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {healthScore}%
                              </span>
                            </div>
                            <Progress 
                              value={healthScore} 
                              className={`h-2 ${
                                healthScore >= 80 ? '[&>div]:bg-green-500' :
                                healthScore >= 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                              }`}
                            />
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            {isDisconnected ? (
                              <Badge variant="destructive" className="gap-1">
                                <WifiOff className="w-3 h-3" />
                                Disconnected
                              </Badge>
                            ) : needsAttention ? (
                              <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                <AlertTriangle className="w-3 h-3" />
                                Unverified
                              </Badge>
                            ) : isVeryStale ? (
                              <Badge variant="destructive" className="gap-1">
                                <Clock className="w-3 h-3" />
                                Stale
                              </Badge>
                            ) : isStale ? (
                              <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                <Clock className="w-3 h-3" />
                                Needs Refresh
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                                <CheckCircle className="w-3 h-3" />
                                Healthy
                              </Badge>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex-shrink-0">
                            {(!integration.isVerified || isVeryStale) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => verifyMutation.mutate({ publicId: integration.publicId })}
                                disabled={verifyMutation.isPending}
                              >
                                <RefreshCw className={`w-3 h-3 mr-1 ${verifyMutation.isPending ? 'animate-spin' : ''}`} />
                                Reconnect
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">
                      {integrations?.reduce((sum, i) => sum + (i.totalStreams || 0), 0) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Streams</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">
                      {integrations?.reduce((sum, i) => sum + (i.totalViewers || 0), 0) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Viewers</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">
                      {integrations?.filter(i => i.autoStream).length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Auto-Stream Enabled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {platforms?.map((platform) => {
                const isConnected = integrations?.some(i => i.platform === platform.id);
                return (
                  <Card key={platform.id} className={isConnected ? "border-primary/50" : ""}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: platform.color + '20' }}
                        >
                          {platform.icon}
                        </div>
                        <div>
                          <CardTitle>{platform.name}</CardTitle>
                          <CardDescription>
                            {platform.requiresOAuth ? "OAuth required" : "API key authentication"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isConnected ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setSelectedPlatform(platform.id);
                            setShowAddDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* API Documentation Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Programmatic Access
            </CardTitle>
            <CardDescription>
              Manage integrations via API for automated workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <p className="text-muted-foreground mb-2"># Create integration via API</p>
              <code className="text-primary">
                POST /api/v1/integrations
              </code>
              <pre className="mt-2 text-xs overflow-x-auto">
{`{
  "platform": "twitch",
  "apiKey": "your-api-key",
  "platformUsername": "your-channel",
  "autoStream": true
}`}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              See the <a href="/docs" className="text-primary hover:underline">Developer Docs</a> for 
              complete API reference and examples.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
