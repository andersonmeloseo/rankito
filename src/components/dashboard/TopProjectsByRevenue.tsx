import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface TopProject {
  siteId: string;
  siteName: string;
  revenue: number;
  orders: number;
  aov: number;
}

interface TopProjectsByRevenueProps {
  projects: TopProject[];
  isLoading?: boolean;
}

export const TopProjectsByRevenue = ({ projects, isLoading }: TopProjectsByRevenueProps) => {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRankingIcon = (index: number) => {
    const icons = ['🥇', '🥈', '🥉'];
    return icons[index] || `${index + 1}º`;
  };

  const maxRevenue = projects.length > 0 ? projects[0].revenue : 0;

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg">
              Projetos com Mais Receita
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Últimos 30 dias
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma venda registrada
            </p>
            <p className="text-sm text-muted-foreground/70">
              Instale o pixel em sites com e-commerce para começar a rastrear vendas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-lg">
            Projetos com Mais Receita
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Últimos 30 dias
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project, index) => {
          const progressValue = maxRevenue > 0 ? (project.revenue / maxRevenue) * 100 : 0;
          
          return (
            <div
              key={project.siteId}
              onClick={() => navigate(`/dashboard/site/${project.siteId}`)}
              className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge 
                    variant="secondary"
                    className="text-base font-bold shrink-0"
                  >
                    {getRankingIcon(index)}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">
                        {project.siteName}
                      </h4>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.orders} pedidos
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-bold text-green-600">
                    {formatCurrency(project.revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <TrendingUp className="h-3 w-3" />
                    {formatCurrency(project.aov)} AOV
                  </p>
                </div>
              </div>
              
              <Progress value={progressValue} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const ShoppingCart = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
