import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGSCSitemaps } from "@/hooks/useGSCSitemaps";
import { Plus, RefreshCw, Trash2, FileText, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GSCSitemapsManagerProps {
  integrationId: string;
  integrationName: string;
}

export function GSCSitemapsManager({ integrationId, integrationName }: GSCSitemapsManagerProps) {
  const [newSitemapUrl, setNewSitemapUrl] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sitemapToDelete, setSitemapToDelete] = useState<string | null>(null);

  const {
    sitemaps,
    isLoading,
    refetch,
    submitSitemap,
    deleteSitemap,
    isSubmitting,
    isDeleting,
  } = useGSCSitemaps({ integrationId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSitemapUrl.trim()) return;

    await submitSitemap.mutateAsync({ sitemap_url: newSitemapUrl.trim() });
    setNewSitemapUrl("");
    setShowAddForm(false);
  };

  const handleDeleteClick = (sitemapUrl: string) => {
    setSitemapToDelete(sitemapUrl);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sitemapToDelete) return;
    await deleteSitemap.mutateAsync({ sitemap_url: sitemapToDelete });
    setDeleteDialogOpen(false);
    setSitemapToDelete(null);
  };

  const getStatusBadge = (sitemap: any) => {
    if (sitemap.possibly_deleted) {
      return <Badge variant="outline" className="bg-gray-50"><XCircle className="h-3 w-3 mr-1" />Removido do GSC</Badge>;
    }
    
    if (sitemap.gsc_errors_count > 0) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro ({sitemap.gsc_errors_count})</Badge>;
    }
    
    if (sitemap.gsc_warnings_count > 0) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><AlertTriangle className="h-3 w-3 mr-1" />Aviso ({sitemap.gsc_warnings_count})</Badge>;
    }
    
    return <Badge variant="outline" className="border-green-500 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Sucesso</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sitemaps do {integrationName}
              </CardTitle>
              <CardDescription className="mt-2">
                Gerencie os sitemaps submetidos ao Google Search Console para esta integração
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Sitemap
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showAddForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="sitemap-url">URL do Sitemap</Label>
                <Input
                  id="sitemap-url"
                  type="url"
                  placeholder="https://exemplo.com/sitemap.xml"
                  value={newSitemapUrl}
                  onChange={(e) => setNewSitemapUrl(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Cole a URL completa do sitemap (XML, RSS, Atom ou sitemap index)
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || !newSitemapUrl.trim()}>
                  {isSubmitting ? "Submetendo..." : "Submeter Sitemap"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSitemapUrl("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {sitemaps.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum sitemap encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione seu primeiro sitemap para começar a monitorar a indexação
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Sitemap
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">URL do Sitemap</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">URLs Submetidas</TableHead>
                    <TableHead className="text-right">URLs Indexadas</TableHead>
                    <TableHead>Última Submissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sitemaps.map((sitemap) => (
                    <TableRow key={sitemap.sitemap_url}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <a
                            href={sitemap.sitemap_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {sitemap.sitemap_url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {sitemap.sitemap_type === 'index' ? 'Index' : 'Regular'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sitemap)}</TableCell>
                      <TableCell className="text-right">
                        {sitemap.urls_submitted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          {sitemap.urls_indexed.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(sitemap.gsc_last_submitted)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(sitemap.sitemap_url)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover sitemap do GSC?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o sitemap do Google Search Console e do banco de dados.
              O Google poderá continuar a processar URLs deste sitemap por algum tempo.
              <br /><br />
              <strong>Sitemap:</strong> {sitemapToDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
