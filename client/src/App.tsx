import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useState, useEffect } from "react";

// Hash-based routing hook for GitHub Pages
function useHashLocation() {
  // Get initial hash location when component mounts
  const [hash, setHash] = useState(window.location.hash.replace('#', '') || '/');

  useEffect(() => {
    // Update state when the hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '') || '/';
      setHash(newHash);
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Clean up
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Return current location and a function to change it
  const navigate = (to) => {
    window.location.hash = to;
  };

  return [hash, navigate];
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
