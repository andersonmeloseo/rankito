import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import EndClientPortal from "./pages/EndClientPortal";
import { EnhancedClientPortal } from "./pages/EnhancedClientPortal";
import SiteDetails from "./pages/SiteDetails";
import ClientReport from "./pages/ClientReport";
import UserSettings from "./pages/UserSettings";
import NotFound from "./pages/NotFound";
import ExternalLeadsAPI from "./pages/ExternalLeadsAPI";
import ExternalLeadsTestAPI from "./pages/ExternalLeadsTestAPI";
import PendingApproval from "./pages/PendingApproval";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoleProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
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
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
