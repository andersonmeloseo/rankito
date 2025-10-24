import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import EndClientPortal from "./pages/EndClientPortal";
import { EnhancedClientPortal } from "./pages/EnhancedClientPortal";
import SiteDetails from "./pages/SiteDetails";
import ClientReport from "./pages/ClientReport";
import UserSettings from "./pages/UserSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoleProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/end-client-portal" element={<EndClientPortal />} />
            <Route path="/client-portal/:token" element={<EnhancedClientPortal />} />
            <Route path="/dashboard/site/:siteId" element={<SiteDetails />} />
            <Route path="/report/:token" element={<ClientReport />} />
            <Route path="/settings" element={<UserSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
