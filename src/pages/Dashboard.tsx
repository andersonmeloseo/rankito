import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewCards } from "@/components/rank-rent/OverviewCards";
import { SitesList } from "@/components/rank-rent/SitesList";
import { AddSiteDialog } from "@/components/rank-rent/AddSiteDialog";
import { ClientsList } from "@/components/rank-rent/ClientsList";
import { PluginDownloadCard } from "@/components/rank-rent/PluginDownloadCard";
import { PluginInstallationGuide } from "@/components/rank-rent/PluginInstallationGuide";
import { PluginStatusMonitor } from "@/components/rank-rent/PluginStatusMonitor";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSite, setShowAddSite] = useState(false);
  const [showPluginGuide, setShowPluginGuide] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate("/");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Rank & Rent Manager</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddSite(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Site
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="plugin">Plugin WordPress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewCards userId={user.id} />
            <SitesList userId={user.id} />
          </TabsContent>

          <TabsContent value="sites">
            <SitesList userId={user.id} />
          </TabsContent>

          <TabsContent value="clients">
            <ClientsList userId={user.id} />
          </TabsContent>

          <TabsContent value="plugin" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PluginDownloadCard onOpenGuide={() => setShowPluginGuide(true)} />
              <PluginStatusMonitor userId={user.id} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AddSiteDialog
        open={showAddSite}
        onOpenChange={setShowAddSite}
        userId={user.id}
      />

      <PluginInstallationGuide
        open={showPluginGuide}
        onOpenChange={setShowPluginGuide}
      />
    </div>
  );
};

export default Dashboard;
