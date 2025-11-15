import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Onboarding from "@/pages/onboarding";
import { useQuery } from "@tanstack/react-query";
import { useEffect, Suspense } from "react";
import { StackHandler, StackProvider, StackTheme, useUser } from '@stackframe/react';
import { stackClientApp } from './stack';
import { AuthSync } from '@/components/auth-sync';

function HandlerRoutes() {
  const [location] = useLocation();
  return (
    <StackHandler app={stackClientApp} location={location} fullPage />
  );
}

// Protected route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user === null) {
      // User is not logged in, redirect to sign-in
      navigate("/handler/sign-in");
    }
  }, [user, navigate]);

  // Show loading state while checking auth
  if (user === undefined) {
    return <div>Loading...</div>; // Or your loading component
  }

  // If not authenticated, don't render children (redirect will happen)
  if (user === null) {
    return null;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}

function Router() {
  const [location, navigate] = useLocation();
  const user = useUser();
  
  // Check if user has completed onboarding
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activities"],
    enabled: user !== null && user !== undefined, // Only fetch if user is logged in
  });
  
  const hasCompletedOnboarding = Array.isArray(activities) && activities.length > 0;
  
  useEffect(() => {
    // Don't redirect if user is still loading or on auth/handler pages
    if (user === undefined || location.startsWith("/handler")) {
      return;
    }

    // If user is not logged in, redirect to sign-in
    if (user === null) {
      navigate("/handler/sign-in");
      return;
    }

    // If user is logged in but hasn't completed onboarding
    if (!isLoading && !hasCompletedOnboarding && location !== "/onboarding") {
      navigate("/onboarding");
    }
  }, [user, isLoading, hasCompletedOnboarding, location, navigate]);

  return (
    <Switch>
      <Route path="/handler/*" component={HandlerRoutes} />
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Suspense fallback={null}>
      <StackProvider app={stackClientApp}>
        <StackTheme>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <AuthSync />
              <Router />
            </TooltipProvider>
          </QueryClientProvider>
        </StackTheme>
      </StackProvider>
    </Suspense>
  );
}

export default App;
