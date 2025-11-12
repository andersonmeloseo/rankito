import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Globe, TrendingUp, HelpCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const getIconGradient = (color: string) => {
    const gradients: Record<string, string> = {
      'text-primary': 'icon-gradient-blue',
      'text-success': 'icon-gradient-green',
      'text-warning': 'icon-gradient-orange',
      'text-accent': 'icon-gradient-emerald',
    };
    return gradients[color] || 'icon-gradient-blue';
  };

  const tooltipContent = {
    "Projetos Alugados": {
      title: "Projetos Alugados",
      description: "Quantidade de projetos atualmente sendo alugados para clientes.",
      calculation: "Contagem de sites onde is_rented = true. O número de disponíveis representa sites não alugados (is_rented = false)."
    },
    "Receita Mensal Total": {
      title: "Receita Mensal Total",
      description: "Soma de todos os valores mensais de aluguel dos projetos ativos.",
      calculation: "Σ(monthly_rent_value) de todos os sites com is_rented = true. Representa o MRR (Monthly Recurring Revenue) do seu portfólio."
    },
    "Contratos Vencendo": {
      title: "Contratos Vencendo",
      description: "Número de contratos que expiram nos próximos 30 dias.",
      calculation: "Contagem de sites onde contract_end_date está entre hoje e daqui 30 dias. Use esta métrica para planejar renovações e evitar perda de receita."
    },
    "Taxa de Ocupação": {
      title: "Taxa de Ocupação",
      description: "Percentual de projetos que estão atualmente alugados em relação ao total disponível.",
      calculation: "(Projetos Alugados / Total de Projetos) × 100. Uma taxa alta indica boa performance do portfólio."
    }
  };

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
          <Card 
            key={card.title} 
            className="group relative overflow-hidden border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 card-hover bg-gradient-to-br from-card to-muted/30"
          >
            {/* Subtle Gradient on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                  {card.title}
                </CardTitle>
                
                {/* Tooltip with Help Icon */}
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted/50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      align="start"
                      className="max-w-xs p-4 space-y-2 bg-white border-border/50 shadow-elevated"
                    >
                      <div>
                        <p className="font-semibold text-sm mb-1">
                          {tooltipContent[card.title as keyof typeof tooltipContent].title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tooltipContent[card.title as keyof typeof tooltipContent].description}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <p className="text-[0.625rem] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Como é calculado
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tooltipContent[card.title as keyof typeof tooltipContent].calculation}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Icon with Colored Background */}
              <div className={`p-2.5 rounded-xl ${getIconGradient(card.color)} shadow-sm transition-transform duration-200 group-hover:scale-110`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            
            <CardContent className="relative pt-1">
              <div className="text-3xl font-bold text-foreground tracking-tight mb-1">
                {card.value}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
