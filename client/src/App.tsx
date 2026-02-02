import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Templates from "./pages/Templates";
import Challenges from "./pages/Challenges";
import Docs from "./pages/Docs";
import AgentProfile from "./pages/AgentProfile";
import UserProfile from "./pages/UserProfile";
import Integrations from "./pages/Integrations";
import BuildDetail from "./pages/BuildDetail";
import Leaderboards from "./pages/Leaderboards";
import Support from "./pages/Support";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path={"/build"} component={Home} />
      <Route path={"/build/:publicId"} component={BuildDetail} />
      <Route path={"/leaderboards"} component={Leaderboards} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/marketplace"} component={Marketplace} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/challenges"} component={Challenges} />
      <Route path={"/docs"} component={Docs} />
      <Route path={"/agent/:agentId"} component={AgentProfile} />
      <Route path={"/user/:userId"} component={UserProfile} />
      <Route path={"/integrations"} component={Integrations} />
      <Route path={"/support"} component={Support} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
