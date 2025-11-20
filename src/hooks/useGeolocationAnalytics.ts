import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GeolocationFilters {
  startDate?: string;
  endDate?: string;
  siteId?: string;
  eventType?: string;
}

interface CountryData {
  country: string;
  country_code: string;
  conversions: number;
  percentage: number;
}

interface CityData {
  city: string;
  region: string;
  country: string;
  country_code: string;
  conversions: number;
  percentage: number;
}

interface RegionData {
  region: string;
  country: string;
  conversions: number;
  percentage: number;
}

interface GeolocationSummary {
  totalCountries: number;
  totalCities: number;
  totalConversions: number;
  topCountry: { name: string; percentage: number } | null;
  concentration: number;
}

interface GeolocationData {
  summary: GeolocationSummary;
  countries: CountryData[];
  cities: CityData[];
  regions: RegionData[];
}

export const useGeolocationAnalytics = (
  userId: string | undefined,
  filters?: GeolocationFilters
) => {
  return useQuery({
    queryKey: ['geolocation-analytics', userId, filters],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      // Build base query
      let query = supabase
        .from('rank_rent_conversions')
        .select('*')
        .not('country', 'is', null);

      // Get user's sites first
      const { data: sites } = await supabase
        .from('rank_rent_sites')
        .select('id')
        .eq('owner_user_id', userId);

      if (!sites || sites.length === 0) {
        return {
          summary: {
            totalCountries: 0,
            totalCities: 0,
            totalConversions: 0,
            topCountry: null,
            concentration: 0,
          },
          countries: [],
          cities: [],
          regions: [],
        };
      }

      const siteIds = sites.map(s => s.id);
      query = query.in('site_id', siteIds);

      // Apply filters
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.siteId && filters.siteId !== 'all') {
        query = query.eq('site_id', filters.siteId);
      }
      if (filters?.eventType && filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType as any);
      }

      const { data: conversions, error } = await query;

      if (error) throw error;
      if (!conversions || conversions.length === 0) {
        return {
          summary: {
            totalCountries: 0,
            totalCities: 0,
            totalConversions: 0,
            topCountry: null,
            concentration: 0,
          },
          countries: [],
          cities: [],
          regions: [],
        };
      }

      const totalConversions = conversions.length;

      // Aggregate by country
      const countryMap = new Map<string, { country: string; country_code: string; count: number }>();
      conversions.forEach(c => {
        if (c.country && c.country_code) {
          const key = c.country;
          const existing = countryMap.get(key) || { country: c.country, country_code: c.country_code, count: 0 };
          existing.count++;
          countryMap.set(key, existing);
        }
      });

      const countries: CountryData[] = Array.from(countryMap.values())
        .map(c => ({
          country: c.country,
          country_code: c.country_code,
          conversions: c.count,
          percentage: (c.count / totalConversions) * 100,
        }))
        .sort((a, b) => b.conversions - a.conversions);

      // Aggregate by city
      const cityMap = new Map<string, CityData>();
      conversions.forEach(c => {
        if (c.city && c.country) {
          const key = `${c.city}-${c.region || ''}-${c.country}`;
          const existing = cityMap.get(key) || {
            city: c.city,
            region: c.region || '',
            country: c.country,
            country_code: c.country_code || '',
            conversions: 0,
            percentage: 0,
          };
          existing.conversions++;
          cityMap.set(key, existing);
        }
      });

      const cities: CityData[] = Array.from(cityMap.values())
        .map(c => ({
          ...c,
          percentage: (c.conversions / totalConversions) * 100,
        }))
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 50);

      // Aggregate by region
      const regionMap = new Map<string, RegionData>();
      conversions.forEach(c => {
        if (c.region && c.country) {
          const key = `${c.region}-${c.country}`;
          const existing = regionMap.get(key) || {
            region: c.region,
            country: c.country,
            conversions: 0,
            percentage: 0,
          };
          existing.conversions++;
          regionMap.set(key, existing);
        }
      });

      const regions: RegionData[] = Array.from(regionMap.values())
        .map(r => ({
          ...r,
          percentage: (r.conversions / totalConversions) * 100,
        }))
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 30);

      // Calculate summary
      const totalCountries = countryMap.size;
      const totalCities = cityMap.size;
      const topCountry = countries[0] ? { name: countries[0].country, percentage: countries[0].percentage } : null;
      
      // Concentration: % of conversions in top 3 countries
      const top3Total = countries.slice(0, 3).reduce((sum, c) => sum + c.conversions, 0);
      const concentration = (top3Total / totalConversions) * 100;

      const result: GeolocationData = {
        summary: {
          totalCountries,
          totalCities,
          totalConversions,
          topCountry,
          concentration,
        },
        countries,
        cities,
        regions,
      };

      return result;
    },
    enabled: !!userId,
  });
};
