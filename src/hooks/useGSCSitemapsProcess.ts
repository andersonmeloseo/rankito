import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SitemapsProcessParams {
  siteId: string;
  sitemapUrls?: string[]; // Se vazio, processa todos os sitemaps do site
}

interface SitemapsProcessResult {
  success: boolean;
  sitemaps_processed: number;
  urls_inserted: number;
  message?: string;
}

export function useGSCSitemapsProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, sitemapUrls }: SitemapsProcessParams) => {
      console.log('📄 Starting Sitemaps Processing:', { siteId, sitemapUrls });

      const { data, error } = await supabase.functions.invoke<SitemapsProcessResult>(
        'gsc-sitemaps-process',
        {
          body: { site_id: siteId, sitemap_urls: sitemapUrls },
        }
      );

      if (error) {
        console.error('❌ Error processing sitemaps:', error);
        throw new Error(error.message || 'Failed to process sitemaps');
      }

      console.log('✅ Sitemaps processing completed:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.sitemaps_processed} sitemaps processados`, {
        description: `${data.urls_inserted} URLs extraídas e inseridas`,
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['gsc-discovered-urls'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-sitemaps'] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-jobs'] });
    },
    onError: (error: Error) => {
      console.error('❌ Sitemap processing failed:', error);
      toast.error('Falha ao processar sitemaps', {
        description: error.message,
      });
    },
  });
}
