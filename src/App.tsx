import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Root from "./pages/Root";
import Dashboard from "./pages/Dashboard";
import SiteDetails from "./pages/SiteDetails";
import Analytics from "./pages/Analytics";
import ClientReport from "./pages/ClientReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/site/:siteId" element={<SiteDetails />} />
          <Route path="/dashboard/analytics/:siteId" element={<Analytics />} />
          <Route path="/report/:token" element={<ClientReport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
