import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdsTrackingMetrics {
  total_events: number;
  with_gclid: number;
  with_fbclid: number;
  with_fbc: number;
  with_fbp: number;
  with_utm_source: number;
  with_utm_campaign: number;
  gclid_percentage: number;
  fbclid_percentage: number;
  utm_percentage: number;
}

export interface RecentAdsEvent {
  id: string;
  created_at: string;
  event_type: string;
  page_url: string;
  gclid: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

export const useAdsTrackingMetrics = (siteId: string) => {
  return useQuery({
    queryKey: ['ads-tracking-metrics', siteId],
    queryFn: async (): Promise<AdsTrackingMetrics> => {
      const { data, error } = await supabase
        .from('rank_rent_conversions')
        .select('gclid, fbclid, fbc, fbp, utm_source, utm_campaign')
        .eq('site_id', siteId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .range(0, 9999);

      if (error) throw error;

      const total = data?.length || 0;
      const withGclid = data?.filter(d => d.gclid).length || 0;
      const withFbclid = data?.filter(d => d.fbclid).length || 0;
      const withFbc = data?.filter(d => d.fbc).length || 0;
      const withFbp = data?.filter(d => d.fbp).length || 0;
      const withUtmSource = data?.filter(d => d.utm_source).length || 0;
      const withUtmCampaign = data?.filter(d => d.utm_campaign).length || 0;

      return {
        total_events: total,
        with_gclid: withGclid,
        with_fbclid: withFbclid,
        with_fbc: withFbc,
        with_fbp: withFbp,
        with_utm_source: withUtmSource,
        with_utm_campaign: withUtmCampaign,
        gclid_percentage: total > 0 ? Math.round((withGclid / total) * 100) : 0,
        fbclid_percentage: total > 0 ? Math.round((withFbclid / total) * 100) : 0,
        utm_percentage: total > 0 ? Math.round((withUtmSource / total) * 100) : 0,
      };
    },
    enabled: !!siteId,
    staleTime: 60000,
  });
};

export const useRecentAdsEvents = (siteId: string) => {
  return useQuery({
    queryKey: ['recent-ads-events', siteId],
    queryFn: async (): Promise<RecentAdsEvent[]> => {
      const { data, error } = await supabase
        .from('rank_rent_conversions')
        .select('id, created_at, event_type, page_url, gclid, fbclid, fbc, fbp, utm_source, utm_medium, utm_campaign')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []) as RecentAdsEvent[];
    },
    enabled: !!siteId,
    staleTime: 30000,
  });
};
