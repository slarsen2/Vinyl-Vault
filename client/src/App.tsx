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
import makeMatcher from "wouter/matcher";

// Get the repository name from the base URL
const getBasePath = () => {
  // For GitHub Pages: Use the repository name in production
  // For local development: Use empty string
  if (import.meta.env.DEV) {
    return "";
  }
  
  // Extract the repository name from the URL
  // The URL would be like: https://username.github.io/repo-name/
  const pathSegments = window.location.pathname.split('/');
  if (pathSegments.length > 1) {
    return `/${pathSegments[1]}`;
  }
  
  return "";
};

// Create a custom location hook that handles the base path
const useLocationWithBasename = () => {
  const basePath = getBasePath();
  const [location, setLocation] = useLocation();
  
  // Remove the base path from the location
  const effectiveLocation = location.startsWith(basePath) 
    ? location.substring(basePath.length) || "/" 
    : location;
  
  // Add the base path when setting the location
  const setEffectiveLocation = (to) => {
    setLocation(to.startsWith('/') ? `${basePath}${to}` : to);
  };
  
  return [effectiveLocation, setEffectiveLocation];
};

// Create a Router with basename support
function Router() {
  return (
    // The custom location hook handles adding/removing the base path
    <Switch hook={useLocationWithBasename}>
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