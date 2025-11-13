import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  type: "site" | "client" | "page" | "deal" | "action";
  url?: string;
  icon?: string;
};

export const useGlobalSearch = (searchQuery: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchData = async () => {
      if (searchQuery.length < 2 && searchQuery.length > 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      const allResults: SearchResult[] = [];

      // Ações rápidas (sempre visíveis)
      if (searchQuery.length === 0 || "adicionar".includes(searchQuery.toLowerCase())) {
        allResults.push({
          id: "action-add-site",
          title: "Adicionar Novo Site",
          type: "action",
          icon: "Plus",
        });
      }
      if (searchQuery.length === 0 || "cliente".includes(searchQuery.toLowerCase())) {
        allResults.push({
          id: "action-add-client",
          title: "Adicionar Novo Cliente",
          type: "action",
          icon: "UserPlus",
        });
      }

      if (searchQuery.length >= 2) {
        try {
          const userResponse = await supabase.auth.getUser();
          if (!userResponse.data.user) {
            setResults(allResults);
            setLoading(false);
            return;
          }

          const userId = userResponse.data.user.id;

          // Buscar sites
          // @ts-expect-error - Supabase type inference bug (TS2589)
          const sitesResponse = await supabase
            .from("rank_rent_sites")
            .select("id, site_name, site_url")
            .eq("user_id", userId)
            .ilike("site_name", `%${searchQuery}%`)
            .limit(5);

          if (sitesResponse.data) {
            sitesResponse.data.forEach((site: any) => {
              allResults.push({
                id: site.id,
                title: site.site_name,
                subtitle: site.site_url,
                type: "site",
                url: `/dashboard/site/${site.id}`,
                icon: "Globe",
              });
            });
          }

          // Buscar clientes
          const clientsResponse = await supabase
            .from("rank_rent_clients")
            .select("id, name, email")
            .eq("user_id", userId)
            .ilike("name", `%${searchQuery}%`)
            .limit(5);

          if (clientsResponse.data) {
            clientsResponse.data.forEach((client: any) => {
              allResults.push({
                id: client.id,
                title: client.name,
                subtitle: client.email || undefined,
                type: "client",
                icon: "User",
              });
            });
          }

          // Buscar deals
          const dealsResponse = await supabase
            .from("crm_deals")
            .select("id, title, contact_name")
            .eq("user_id", userId)
            .ilike("title", `%${searchQuery}%`)
            .limit(5);

          if (dealsResponse.data) {
            dealsResponse.data.forEach((deal: any) => {
              allResults.push({
                id: deal.id,
                title: deal.title,
                subtitle: deal.contact_name || undefined,
                type: "deal",
                icon: "Briefcase",
              });
            });
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      }

      setResults(allResults);
      setLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      searchData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return { results, loading };
};
