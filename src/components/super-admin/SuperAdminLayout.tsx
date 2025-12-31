import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, KeyRound, Globe, UserCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ResetUserPasswordDialog } from "@/components/super-admin/ResetUserPasswordDialog";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useState } from "react";

interface SuperAdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SuperAdminLayout({ children, activeTab, onTabChange }: SuperAdminLayoutProps) {
  const navigate = useNavigate();
  const { user } = useRole();
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSubtitle={false} />
      
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 w-full">
          <SuperAdminSidebar activeTab={activeTab} onTabChange={onTabChange} />
          
          <SidebarInset className="flex flex-col flex-1">
            <div className="flex items-center gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border" />
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Super Admin Dashboard</span>
                  {user?.email && (
                    <span className="text-xs text-muted-foreground">({user.email})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <NotificationCenter />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setResetPasswordOpen(true)}
                    className="gap-2 h-8"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Resetar Senha</span>
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm" 
                    onClick={() => navigate("/dashboard")}
                    className="gap-2 h-8"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ver como Cliente</span>
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm" 
                    onClick={() => navigate("/end-client-portal")}
                    className="gap-2 h-8"
                  >
                    <UserCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Portal End Client</span>
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm" 
                    onClick={handleSignOut}
                    className="gap-2 h-8"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </div>
              </div>
            </div>
            
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto px-4 lg:px-8 py-8 pb-32 space-y-8">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      
      <Footer />
      <ResetUserPasswordDialog 
        open={resetPasswordOpen} 
        onOpenChange={setResetPasswordOpen} 
      />
    </div>
  );
}
