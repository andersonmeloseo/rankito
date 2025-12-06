import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

export interface CampaignPerformance {
  utm_campaign: string | null;
  utm_source: string | null;
  source: 'google' | 'meta' | 'organic' | null;
  visits: number;
  conversions: number;
  conversion_rate: number;
}

export function useCampaignPerformance(siteId: string, days: number = 30) {
  return useQuery({
    queryKey: ['campaign-performance', siteId, days],
    queryFn: async () => {
      const startDate = addDays(new Date(), -days).toISOString();
      
      // Fetch all events for the period
      const { data: events, error } = await supabase
        .from('rank_rent_conversions')
        .select('utm_campaign, utm_source, gclid, fbclid, event_type')
        .eq('site_id', siteId)
        .gte('created_at', startDate)
        .range(0, 9999);

      if (error) throw error;

      // Group by campaign
      const campaignMap = new Map<string, {
        utm_campaign: string | null;
        utm_source: string | null;
        source: 'google' | 'meta' | 'organic' | null;
        visits: number;
        conversions: number;
      }>();

      events?.forEach(event => {
        const key = event.utm_campaign || '(direto)';
        const existing = campaignMap.get(key) || {
          utm_campaign: event.utm_campaign,
          utm_source: event.utm_source,
          source: null,
          visits: 0,
          conversions: 0
        };

        // Determine source
        if (event.gclid) {
          existing.source = 'google';
        } else if (event.fbclid) {
          existing.source = 'meta';
        } else if (event.utm_source) {
          if (event.utm_source.toLowerCase().includes('google')) {
            existing.source = 'google';
          } else if (event.utm_source.toLowerCase().includes('facebook') || event.utm_source.toLowerCase().includes('instagram') || event.utm_source.toLowerCase().includes('meta')) {
            existing.source = 'meta';
          } else {
            existing.source = 'organic';
          }
        }

        // Count
        if (event.event_type === 'page_view') {
          existing.visits++;
        } else if (['whatsapp_click', 'phone_click', 'email_click', 'button_click', 'form_submit'].includes(event.event_type)) {
          existing.conversions++;
        }

        campaignMap.set(key, existing);
      });

      // Convert to array and calculate rates
      const campaigns: CampaignPerformance[] = Array.from(campaignMap.values())
        .map(c => ({
          ...c,
          conversion_rate: c.visits > 0 ? (c.conversions / c.visits) * 100 : 0
        }))
        .sort((a, b) => b.conversions - a.conversions);

      return campaigns;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
