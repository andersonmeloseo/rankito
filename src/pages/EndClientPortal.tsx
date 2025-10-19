import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Globe, TrendingUp, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { useQuery } from "@tanstack/react-query";
import { SuperAdminBanner } from "@/components/super-admin/SuperAdminBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const EndClientPortal = () => {
  const navigate = useNavigate();
  const { isEndClient, isSuperAdmin, isLoading, user } = useRole();

  useEffect(() => {
    if (!isLoading && !isEndClient && !isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [isEndClient, isSuperAdmin, isLoading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ['end-client-profile', user?.id],
    enabled: !!user?.id && isEndClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: rentedSites } = useQuery({
    queryKey: ['end-client-sites', user?.id],
    enabled: !!user?.id && isEndClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_sites')
        .select('*')
        .eq('is_rented', true);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: pages } = useQuery({
    queryKey: ['end-client-pages', user?.id],
    enabled: !!user?.id && isEndClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_pages')
        .select('*')
        .eq('is_rented', true);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: conversions } = useQuery({
    queryKey: ['end-client-conversions', user?.id],
    enabled: !!user?.id && isEndClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_conversions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-primary/10">
      {isSuperAdmin && <SuperAdminBanner currentView="end_client" />}
      <Header showSubtitle={false} />
      <div className="flex-1">
        <div className="container mx-auto p-6 pb-64 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Portal do Cliente
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.full_name || user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sites Contratados</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rentedSites?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Sites ativos no plano
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Páginas</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pages?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total de páginas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total de conversões
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Sites */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Sites</CardTitle>
            <CardDescription>
              Sites contratados no seu plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rentedSites && rentedSites.length > 0 ? (
              <div className="space-y-4">
                {rentedSites.map((site) => (
                  <div key={site.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{site.site_name}</h3>
                    <p className="text-sm text-muted-foreground">{site.site_url}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span>Nicho: {site.niche}</span>
                      <span>Localização: {site.location}</span>
                      <span className="text-primary">R$ {site.monthly_rent_value}/mês</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum site contratado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Últimas Conversões */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Conversões</CardTitle>
            <CardDescription>
              Conversões recentes dos seus sites
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversions && conversions.length > 0 ? (
              <div className="space-y-2">
                {conversions.slice(0, 10).map((conversion) => (
                  <div key={conversion.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{conversion.event_type}</p>
                      <p className="text-sm text-muted-foreground">{conversion.page_path}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conversion.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma conversão registrada
              </p>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EndClientPortal;
