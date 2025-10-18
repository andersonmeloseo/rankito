import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FolderOpen, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EditSiteDialog } from "./EditSiteDialog";

interface SitesListProps {
  userId: string;
}

export const SitesList = ({ userId }: SitesListProps) => {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);

  const handleEdit = (site: any) => {
    setSelectedSite(site);
    setShowEditDialog(true);
  };

  const { data: sites, isLoading } = useQuery({
    queryKey: ["rank-rent-sites", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_metrics")
        .select("*")
        .eq("user_id", userId)
        .order("total_conversions", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Meus Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Meus Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Você ainda não cadastrou nenhum site.</p>
            <p className="text-sm text-muted-foreground">Clique em "Adicionar Site" para começar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Meus Sites ({sites.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Site</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nicho</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Localização</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Page Views</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Conversões</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Taxa Conv.</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Aluguel/mês</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.site_id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div>
                        <div className="font-semibold text-foreground">{site.site_name}</div>
                        <a
                          href={site.site_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {new URL(site.site_url).hostname}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="p-3 text-foreground">{site.niche}</td>
                    <td className="p-3 text-foreground">{site.location}</td>
                    <td className="p-3 text-right text-foreground">
                      {site.total_page_views?.toLocaleString() || 0}
                    </td>
                    <td className="p-3 text-right font-semibold text-foreground">
                      {site.total_conversions || 0}
                    </td>
                    <td className="p-3 text-right text-foreground">{site.conversion_rate || 0}%</td>
                    <td className="p-3 text-right font-medium text-success">
                      R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      {site.is_rented ? (
                        <Badge className="bg-success text-success-foreground">Alugado</Badge>
                      ) : (
                        <Badge variant="outline">Disponível</Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(site)}
                          className="gap-1"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/dashboard/site/${site.site_id}`)}
                          className="gap-1"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Abrir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {selectedSite && (
        <EditSiteDialog
          site={selectedSite}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
};
