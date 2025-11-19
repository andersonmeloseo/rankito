import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GSCSitemap {
  id?: string;
  sitemap_url: string;
  sitemap_type: 'index' | 'regular';
  gsc_status: string;
  gsc_last_submitted: string | null;
  gsc_last_downloaded: string | null;
  urls_submitted: number;
  urls_indexed: number;
  gsc_errors_count: number;
  gsc_warnings_count: number;
  source?: 'gsc' | 'database';
  in_database?: boolean;
  possibly_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UseGSCSitemapsParams {
  siteId: string | null;
}

export function useGSCSitemaps({ siteId }: UseGSCSitemapsParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sitemaps (direto do banco local)
  const { data: sitemaps, isLoading, error, refetch } = useQuery({
    queryKey: ['gsc-sitemaps', siteId],
    queryFn: async () => {
      if (!siteId) return [];

      console.log('🔍 Fetching sitemaps from database for site:', siteId);

      const { data, error } = await supabase
        .from('gsc_sitemap_submissions')
        .select('*')
        .eq('site_id', siteId)
        .order('gsc_last_submitted', { ascending: false });

      if (error) {
        console.error('❌ Error fetching sitemaps:', error);
        throw new Error(error.message);
      }

      console.log('✅ Sitemaps fetched from database:', data?.length || 0);
      return data as GSCSitemap[];
    },
    enabled: !!siteId,
  });

  // Submit sitemap mutation (sistema escolhe integração automaticamente)
  const submitSitemap = useMutation({
    mutationFn: async ({ sitemap_url }: { sitemap_url: string }) => {
      if (!siteId) throw new Error('No site selected');

      // Buscar primeira integração ativa
      const { data: integrations, error: intError } = await supabase
        .from('google_search_console_integrations')
        .select('id')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .limit(1);

      if (intError || !integrations || integrations.length === 0) {
        throw new Error('Nenhuma integração ativa encontrada');
      }

      const integrationId = integrations[0].id;

      console.log('📤 Submitting sitemap:', sitemap_url);

      const { data, error } = await supabase.functions.invoke('gsc-submit-sitemap', {
        body: {
          integration_id: integrationId,
          sitemap_url,
        },
      });

      if (error) {
        console.error('❌ Error submitting sitemap:', error);
        throw new Error(error.message || 'Failed to submit sitemap');
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sitemap submetido!",
        description: "Sitemap foi enviado ao Google Search Console com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps', siteId] });
    },
    onError: (error: any) => {
      // Detectar erro de permissões e mostrar instruções
      const isPermissionError = error.message?.includes('Permissões Insuficientes') || 
                                error.message?.includes('403') || 
                                error.message?.includes('forbidden');
      
      if (isPermissionError) {
        toast({
          title: "⚠️ Permissões Insuficientes no GSC",
          description: "A Service Account precisa ser adicionada como Proprietário no Google Search Console. Veja as instruções no console.",
          variant: "destructive",
          duration: 10000,
        });
        
        console.error('═══════════════════════════════════════════════════════════');
        console.error('📋 COMO RESOLVER O ERRO DE PERMISSÕES DO GSC:');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('1. Acesse: https://search.google.com/search-console');
        console.error('2. Selecione sua propriedade no GSC');
        console.error('3. Clique em "Configurações" (ícone de engrenagem)');
        console.error('4. Vá em "Usuários e permissões"');
        console.error('5. Clique em "ADICIONAR USUÁRIO"');
        console.error('6. Cole o email da Service Account (verifique na integração)');
        console.error('7. Selecione permissão "PROPRIETÁRIO" (obrigatório!)');
        console.error('8. Clique em "Adicionar"');
        console.error('9. Aguarde 2-3 minutos para propagação');
        console.error('10. Tente novamente');
        console.error('═══════════════════════════════════════════════════════════');
      } else {
        toast({
          title: "Erro ao submeter sitemap",
          description: error.message,
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps', siteId] });
    },
  });

  // Delete sitemap mutation
  const deleteSitemap = useMutation({
    mutationFn: async ({ sitemap_url }: { sitemap_url: string }) => {
      if (!siteId) throw new Error('No site selected');

      // Buscar primeira integração ativa
      const { data: integrations, error: intError } = await supabase
        .from('google_search_console_integrations')
        .select('id')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .limit(1);

      if (intError || !integrations || integrations.length === 0) {
        throw new Error('Nenhuma integração ativa encontrada');
      }

      const integrationId = integrations[0].id;

      console.log('🗑️ Deleting sitemap:', sitemap_url);

      const { data, error } = await supabase.functions.invoke('gsc-delete-sitemap', {
        body: {
          integration_id: integrationId,
          sitemap_url,
        },
      });

      if (error) {
        console.error('❌ Error deleting sitemap:', error);
        throw new Error(error.message || 'Failed to delete sitemap');
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sitemap removido!",
        description: "Sitemap foi removido do Google Search Console.",
      });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps', siteId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover sitemap",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sitemaps: sitemaps || [],
    isLoading,
    error,
    refetch,
    submitSitemap,
    deleteSitemap,
    isSubmitting: submitSitemap.isPending,
    isDeleting: deleteSitemap.isPending,
  };
}
