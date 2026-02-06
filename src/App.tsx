import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageLoadingFallback } from "@/components/ui/PageLoadingFallback";

// Lazy loaded pages - each becomes a separate bundle chunk
const LandingPage = lazy(() => import("./pages/LandingPage"));
const EarlyAccessPage = lazy(() => import("./pages/EarlyAccessPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const EndClientPortal = lazy(() => import("./pages/EndClientPortal"));
const EnhancedClientPortal = lazy(() => import("./pages/EnhancedClientPortal").then(m => ({ default: m.EnhancedClientPortal })));
const SiteDetails = lazy(() => import("./pages/SiteDetails"));
const ClientReport = lazy(() => import("./pages/ClientReport"));
const UserSettings = lazy(() => import("./pages/UserSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ExternalLeadsAPI = lazy(() => import("./pages/ExternalLeadsAPI"));
const ExternalLeadsTestAPI = lazy(() => import("./pages/ExternalLeadsTestAPI"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30s - dados considerados frescos
      gcTime: 300000,   // 5min - tempo em cache após não usado
      retry: 1,         // Apenas 1 retry em falhas
      refetchOnWindowFocus: false, // Não refetch ao focar janela
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoleProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoadingFallback variant="page" />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/early-access" element={<EarlyAccessPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/super-admin" 
                element={
                  <ProtectedRoute requiredRole="super_admin">
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/end-client-portal" 
                element={
                  <ProtectedRoute requiredRole="end_client">
                    <EndClientPortal />
                  </ProtectedRoute>
                } 
              />
              <Route path="/client-portal/:token" element={<EnhancedClientPortal />} />
              <Route 
                path="/dashboard/site/:siteId" 
                element={
                  <ProtectedRoute>
                    <SiteDetails />
                  </ProtectedRoute>
                } 
              />
              <Route path="/report/:token" element={<ClientReport />} />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <UserSettings />
                  </ProtectedRoute>
                } 
              />
              <Route path="/api/external-leads" element={<ExternalLeadsAPI />} />
              <Route path="/api/external-leads/test" element={<ExternalLeadsTestAPI />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
