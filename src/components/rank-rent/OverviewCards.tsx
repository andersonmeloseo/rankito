import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, DollarSign, Globe, TrendingUp, LucideIcon } from "lucide-react";
import { SkeletonMetricCards } from "@/components/ui/skeleton-modern";

interface OverviewCardsProps {
  userId: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  iconVariant: "blue" | "green" | "orange" | "emerald";
  onClick?: () => void;
}

const MetricCard = ({ title, value, icon: Icon, description, iconVariant, onClick }: MetricCardProps) => {
  const iconClasses = {
    blue: "icon-gradient-blue",
    green: "icon-gradient-green",
    orange: "icon-gradient-orange",
    emerald: "icon-gradient-emerald",
  };

  return (
    <div
      className="card-interactive p-6 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className={`icon-container-sm ${iconClasses[iconVariant]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="metric-value text-foreground">{value}</div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
};

export const OverviewCards = ({ userId }: OverviewCardsProps) => {
  const navigate = useNavigate();
  
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
    refetchInterval: 30000,
  });

  const handleCardClick = (cardTitle: string) => {
    if (cardTitle === "Projetos Alugados") {
      navigate("/dashboard", { state: { tab: "sites" } });
    } else if (cardTitle === "Receita Mensal Total") {
      navigate("/dashboard", { state: { tab: "financial" } });
    } else if (cardTitle === "Contratos Vencendo") {
      navigate("/dashboard", { state: { tab: "sites" } });
    } else if (cardTitle === "Taxa de Ocupação") {
      navigate("/dashboard", { state: { tab: "sites" } });
    }
  };

  const cards = [
    {
      title: "Projetos Alugados",
      value: metrics?.rentedSites || 0,
      icon: Globe,
      description: `${metrics?.availableSites || 0} disponíveis`,
      iconVariant: "blue" as const,
    },
    {
      title: "Receita Mensal Total",
      value: `R$ ${(metrics?.monthlyRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Soma de todos os aluguéis",
      iconVariant: "green" as const,
    },
    {
      title: "Contratos Vencendo",
      value: metrics?.expiringContracts || 0,
      icon: TrendingUp,
      description: "Próximos 30 dias",
      iconVariant: "orange" as const,
    },
    {
      title: "Taxa de Ocupação",
      value: `${metrics?.occupancyRate || 0}%`,
      icon: BarChart3,
      description: `${metrics?.rentedSites || 0} de ${metrics?.totalSites || 0} projetos`,
      iconVariant: "emerald" as const,
    },
  ];

  if (isLoading) {
    return <SkeletonMetricCards count={4} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-fade-in">
      {cards.map((card) => (
        <MetricCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          description={card.description}
          iconVariant={card.iconVariant}
          onClick={() => handleCardClick(card.title)}
        />
      ))}
    </div>
  );
};
