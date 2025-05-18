import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

// Simple handler for GitHub Pages routing
function useHashLocation() {
  const [loc, setLoc] = useLocation();
  
  // If we're in production and on GitHub Pages
  if (window.location.hostname.includes('github.io')) {
    // Return a basic router that works with the base path
    const base = '/Vinyl-Vault';
    const currentLoc = loc.startsWith(base) 
      ? loc.substring(base.length) || '/'
      : loc;
      
    const setCurrentLoc = (to) => {
      setLoc(to.startsWith('/') ? `${base}${to}` : to);
    };
    
    return [currentLoc, setCurrentLoc];
  }
  
  // In development, use the standard location
  return [loc, setLoc];
}

function Router() {
  return (
    <Switch hook={useHashLocation}>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;