import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Globe, TrendingUp } from "lucide-react";

interface OverviewCardsProps {
  userId: string;
}

export const OverviewCards = ({ userId }: OverviewCardsProps) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["overview-metrics", userId],
    queryFn: async () => {
      const { data: sites, error } = await supabase
        .from("rank_rent_sites")
        .select("*")
        .eq("owner_user_id", userId);

      if (error) throw error;

      const totalSites = sites?.length || 0;
      const rentedSites = sites?.filter((s) => s.is_rented).length || 0;
      const availableSites = totalSites - rentedSites;
      const monthlyRevenue = sites?.reduce((acc, s) => acc + Number(s.monthly_rent_value || 0), 0) || 0;

      // Contratos vencendo nos próximos 30 dias
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringContracts = sites?.filter((s) => {
        if (!s.contract_end_date || !s.is_rented) return false;
        const endDate = new Date(s.contract_end_date);
        return endDate >= today && endDate <= thirtyDaysFromNow;
      }).length || 0;

      // Taxa de ocupação
      const occupancyRate = totalSites > 0 ? Math.round((rentedSites / totalSites) * 100) : 0;

      // Ticket médio
      const averageTicket = rentedSites > 0 ? monthlyRevenue / rentedSites : 0;

      // Get total conversions
      const { data: conversions, error: convError } = await supabase
        .from("rank_rent_conversions")
        .select("id, site_id")
        .in(
          "site_id",
          sites?.map((s) => s.id) || []
        );

      if (convError) throw convError;

      const totalConversions = conversions?.length || 0;

      return {
        totalSites,
        rentedSites,
        availableSites,
        monthlyRevenue,
        expiringContracts,
        occupancyRate,
        averageTicket,
        totalConversions,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const cards = [
    {
      title: "Projetos Alugados",
      value: metrics?.rentedSites || 0,
      icon: Globe,
      description: `${metrics?.availableSites || 0} disponíveis`,
      color: "text-primary",
    },
    {
      title: "Receita Mensal Total",
      value: `R$ ${(metrics?.monthlyRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Soma de todos os aluguéis",
      color: "text-success",
    },
    {
      title: "Contratos Vencendo",
      value: metrics?.expiringContracts || 0,
      icon: TrendingUp,
      description: "Próximos 30 dias",
      color: "text-warning",
    },
    {
      title: "Taxa de Ocupação",
      value: `${metrics?.occupancyRate || 0}%`,
      icon: BarChart3,
      description: `${metrics?.rentedSites || 0} de ${metrics?.totalSites || 0} projetos`,
      color: "text-accent",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-40 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <Icon className={`w-5 h-5 ${card.color}`} />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-foreground mb-2">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
