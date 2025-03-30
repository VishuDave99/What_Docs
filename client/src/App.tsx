import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";
import { AppProvider } from "@/context/AppContext";
import { ThemeBackground } from "@/components/ui/ThemeBackground";

function Router() {
  return (
    <Switch>
      {/* Main application route */}
      <Route path="/" component={AppLayout} />
      <Route path="/#:view" component={AppLayout} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeBackground />
        <Router />
        <Toaster />
      </AppProvider>
    </QueryClientProvider>
  );
}
