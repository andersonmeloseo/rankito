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

interface DashboardOverviewRPC {
  total_sites: number;
  rented_sites: number;
  available_sites: number;
  monthly_revenue: number;
  total_conversions: number;
  expiring_contracts: number;
  occupancy_rate: number;
  average_ticket: number;
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
      // Usar RPC otimizada que retorna todas as métricas em uma única query
      const { data, error } = await supabase.rpc('get_dashboard_overview', {
        p_user_id: userId
      });

      if (error) throw error;

      const rpcData = data as unknown as DashboardOverviewRPC;

      return {
        totalSites: rpcData?.total_sites || 0,
        rentedSites: rpcData?.rented_sites || 0,
        availableSites: rpcData?.available_sites || 0,
        monthlyRevenue: Number(rpcData?.monthly_revenue || 0),
        expiringContracts: rpcData?.expiring_contracts || 0,
        occupancyRate: Number(rpcData?.occupancy_rate || 0),
        averageTicket: Number(rpcData?.average_ticket || 0),
        totalConversions: rpcData?.total_conversions || 0,
      };
    },
    staleTime: 60000, // 1 minuto de cache
    gcTime: 120000, // 2 minutos em memória
    refetchInterval: 60000, // Refetch a cada 1 minuto
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
