import { Switch, Route } from "wouter";
import { createContext, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { AdminLogin } from "@/pages/AdminLogin";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { AdminAuthContext, useAdminAuthProvider } from "@/hooks/useAdminAuth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminRouter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  const { admin, isLoading } = useAdminAuthProvider();
  const [authAttempted, setAuthAttempted] = useState(false);

  if (isLoading && !authAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return (
      <AdminLogin 
        onLoginSuccess={() => setAuthAttempted(true)} 
      />
    );
  }

  return <AdminDashboard />;
}

function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const authData = useAdminAuthProvider();
  
  return (
    <AdminAuthContext.Provider value={authData}>
      {children}
    </AdminAuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
