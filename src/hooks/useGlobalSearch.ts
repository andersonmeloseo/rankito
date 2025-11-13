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
          const { data: user } = await supabase.auth.getUser();
          if (!user.user) {
            setResults(allResults);
            setLoading(false);
            return;
          }

          // Buscar sites
          const { data: sites } = await supabase
            .from("rank_rent_sites")
            .select("id, site_name, site_url")
            .eq("user_id", user.user.id)
            .ilike("site_name", `%${searchQuery}%`)
            .limit(5);

          if (sites) {
            sites.forEach((site) => {
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
          const { data: clients } = await supabase
            .from("rank_rent_clients")
            .select("id, name, email")
            .eq("user_id", user.user.id)
            .ilike("name", `%${searchQuery}%`)
            .limit(5);

          if (clients) {
            clients.forEach((client) => {
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
          const { data: deals } = await supabase
            .from("crm_deals")
            .select("id, title, contact_name")
            .eq("user_id", user.user.id)
            .ilike("title", `%${searchQuery}%`)
            .limit(5);

          if (deals) {
            deals.forEach((deal) => {
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
