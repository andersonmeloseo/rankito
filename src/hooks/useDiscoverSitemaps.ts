import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiscoveredSitemap {
  url: string;
  name: string;
  urlCount: number;
  selected?: boolean;
  urls?: string[];
}

interface DiscoverSitemapsParams {
  siteId: string;
  userId: string;
}

export function useDiscoverSitemaps({ siteId, userId }: DiscoverSitemapsParams) {
  const { toast } = useToast();
  const [discoveredSitemaps, setDiscoveredSitemaps] = useState<DiscoveredSitemap[]>([]);
  const [expandedSitemaps, setExpandedSitemaps] = useState<Record<string, string[]>>({});

  // Discover sitemaps mutation
  const discoverMutation = useMutation({
    mutationFn: async (sitemapUrl: string) => {
      console.log('🔍 Discovering sitemaps from:', sitemapUrl);

      const { data, error } = await supabase.functions.invoke('discover-sitemaps', {
        body: { sitemap_url: sitemapUrl, site_id: siteId, user_id: userId },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      const sitemaps = data.sitemaps.map((s: any) => ({ ...s, selected: false }));
      setDiscoveredSitemaps(sitemaps);
      
      toast({
        title: "Sitemaps descobertos!",
        description: `${data.totalSitemaps} sitemap${data.totalSitemaps > 1 ? 's' : ''} encontrado${data.totalSitemaps > 1 ? 's' : ''} com ${data.totalUrls.toLocaleString()} URLs totais.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao descobrir sitemaps",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Expand sitemap to fetch individual URLs
  const expandSitemap = useMutation({
    mutationFn: async (sitemapUrl: string) => {
      console.log('📖 Fetching URLs from:', sitemapUrl);

      const response = await fetch(sitemapUrl);
      if (!response.ok) throw new Error('Failed to fetch sitemap');

      const xmlText = await response.text();
      const urlMatches = xmlText.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g);
      const urls = Array.from(urlMatches).map(match => match[1].trim());

      return { sitemapUrl, urls };
    },
    onSuccess: (data) => {
      setExpandedSitemaps(prev => ({
        ...prev,
        [data.sitemapUrl]: data.urls,
      }));
      
      toast({
        title: "URLs carregadas",
        description: `${data.urls.length} URLs encontradas neste sitemap.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar URLs",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-discover from common URLs
  const autoDiscover = useMutation({
    mutationFn: async (siteUrl: string) => {
      const baseUrl = siteUrl.replace(/\/$/, '');
      const commonPaths = [
        '/sitemap.xml',
        '/sitemap_index.xml',
        '/wp-sitemap.xml',
        '/sitemap/sitemap.xml',
      ];

      for (const path of commonPaths) {
        const testUrl = baseUrl + path;
        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          if (response.ok) {
            return testUrl;
          }
        } catch {
          continue;
        }
      }

      throw new Error('Nenhum sitemap encontrado nos caminhos comuns');
    },
    onSuccess: (sitemapUrl) => {
      discoverMutation.mutate(sitemapUrl);
    },
    onError: (error: Error) => {
      toast({
        title: "Auto-descoberta falhou",
        description: error.message + ". Por favor, insira a URL manualmente.",
        variant: "destructive",
      });
    },
  });

  // Toggle sitemap selection
  const toggleSitemapSelection = (sitemapUrl: string) => {
    setDiscoveredSitemaps(prev =>
      prev.map(s => s.url === sitemapUrl ? { ...s, selected: !s.selected } : s)
    );
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    const allSelected = discoveredSitemaps.every(s => s.selected);
    setDiscoveredSitemaps(prev =>
      prev.map(s => ({ ...s, selected: !allSelected }))
    );
  };

  // Remove individual sitemap
  const removeSitemap = (sitemapUrl: string) => {
    setDiscoveredSitemaps(prev => prev.filter(s => s.url !== sitemapUrl));
    
    // Remove from expanded if exists
    setExpandedSitemaps(prev => {
      const newExpanded = { ...prev };
      delete newExpanded[sitemapUrl];
      return newExpanded;
    });
  };

  // Get selected sitemaps
  const selectedSitemaps = discoveredSitemaps.filter(s => s.selected);

  // Reset discovery
  const reset = () => {
    setDiscoveredSitemaps([]);
    setExpandedSitemaps({});
  };

  return {
    discoveredSitemaps,
    selectedSitemaps,
    expandedSitemaps,
    isDiscovering: discoverMutation.isPending,
    isExpanding: expandSitemap.isPending,
    isAutoDiscovering: autoDiscover.isPending,
    discover: discoverMutation.mutate,
    expandSitemap: expandSitemap.mutate,
    autoDiscover: autoDiscover.mutate,
    toggleSitemapSelection,
    toggleSelectAll,
    removeSitemap,
    reset,
  };
}
