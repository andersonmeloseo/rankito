import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdsTrackingCoverageMetrics {
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

type CoverageRow = {
  event_type: string | null;
  gclid: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
};

async function fetchAllCoverageRows(siteId: string, startISO: string) {
  const pageSize = 1000;
  let from = 0;
  const all: CoverageRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("rank_rent_conversions")
      .select("event_type, gclid, fbclid, fbc, fbp, utm_source, utm_campaign")
      .eq("site_id", siteId)
      .gte("created_at", startISO)
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const batch = (data || []) as CoverageRow[];
    if (batch.length === 0) break;

    all.push(...batch);
    if (batch.length < pageSize) break;

    from += pageSize;
  }

  return all;
}

export const useAdsTrackingCoverage = (siteId: string, days: number = 30) => {
  return useQuery({
    queryKey: ["ads-tracking-coverage", siteId, days],
    queryFn: async (): Promise<AdsTrackingCoverageMetrics> => {
      const startISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const rows = await fetchAllCoverageRows(siteId, startISO);

      // For coverage, consider any event except page_exit (avoids double-counting with page_view)
      const events = rows.filter((r) => r.event_type && r.event_type !== "page_exit");

      const total = events.length;
      const withGclid = events.filter((d) => d.gclid).length;
      const withFbclid = events.filter((d) => d.fbclid).length;
      const withFbc = events.filter((d) => d.fbc).length;
      const withFbp = events.filter((d) => d.fbp).length;
      const withUtmSource = events.filter((d) => d.utm_source).length;
      const withUtmCampaign = events.filter((d) => d.utm_campaign).length;

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
