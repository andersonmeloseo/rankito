import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, ExternalLink, Globe, CheckCircle2 } from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from '@/components/ui/pagination';
import { toast } from 'sonner';

interface IndexNowDiscoveredUrlsProps {
  siteId: string;
}

export const IndexNowDiscoveredUrls = ({ siteId }: IndexNowDiscoveredUrlsProps) => {
  const queryClient = useQueryClient();
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Query 1: Total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['gsc-discovered-urls-count', siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Query 2: Paginated URLs (server-side pagination)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;

  const { data: urls, isLoading } = useQuery({
    queryKey: ['gsc-discovered-urls-indexnow', siteId, currentPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_discovered_urls')
        .select('id, url, current_status, discovered_at, sent_to_indexnow')
        .eq('site_id', siteId)
        .order('discovered_at', { ascending: false })
        .range(startIndex, endIndex);
      
      if (error) throw error;
      return data;
    },
  });

  // Query 3: Already sent count
  const { data: alreadySentCount = 0 } = useQuery({
    queryKey: ['gsc-discovered-urls-sent-count', siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gsc_discovered_urls')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('sent_to_indexnow', true);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const sendToIndexNow = useMutation({
    mutationFn: async (urlList: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('indexnow-submit', {
        body: {
          urls: urlList,
          siteId,
          userId: user.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.urlsCount} URLs enviadas ao IndexNow`);
      setSelectedUrls([]);
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls-indexnow', siteId] });
      queryClient.invalidateQueries({ queryKey: ['indexnow-submissions', siteId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar URLs: ${error.message}`);
    },
  });

  const toggleUrl = (url: string) => {
    setSelectedUrls(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleAll = () => {
    if (!urls) return;
    if (selectedUrls.length === urls.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(urls.map(u => u.url));
    }
  };

  const handleSend = () => {
    if (selectedUrls.length === 0) {
      toast.error('Selecione ao menos uma URL');
      return;
    }
    sendToIndexNow.mutate(selectedUrls);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Descobertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{totalCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selecionadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{selectedUrls.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Já Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{alreadySentCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URLs Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>URLs Descobertas Disponíveis</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} URLs
              </p>
            </div>
            <Button
              onClick={handleSend}
              disabled={selectedUrls.length === 0 || sendToIndexNow.isPending}
            >
              <Send className={`h-4 w-4 mr-2 ${sendToIndexNow.isPending ? 'animate-spin' : ''}`} />
              Enviar {selectedUrls.length} URLs ao IndexNow
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={urls && selectedUrls.length === urls.length && urls.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Descoberta em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {urls && urls.length > 0 ? (
              urls.map((url) => (
                    <TableRow key={url.id} className="h-16">
                      <TableCell>
                        <Checkbox
                          checked={selectedUrls.includes(url.url)}
                          onCheckedChange={() => toggleUrl(url.url)}
                        />
                      </TableCell>
                      <TableCell className="max-w-md">
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <span className="truncate">{url.url}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {url.sent_to_indexnow ? (
                          <Badge className="bg-green-600">Enviado ✓</Badge>
                        ) : (
                          <Badge variant="outline">{url.current_status || 'Descoberto'}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {url.discovered_at 
                          ? new Date(url.discovered_at).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma URL descoberta ainda. Importe um sitemap para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && <PaginationEllipsis />}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
};