import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMarketingGoals } from "@/hooks/useMarketingGoals";
import { useMarketingStrategies } from "@/hooks/useMarketingStrategies";
import { Target, TrendingUp, Calendar, DollarSign, Users, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const GOAL_TARGET = 1000;
const GOAL_DEADLINE = "Março 2026";

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "completed":
      return "bg-green-100 text-green-800 border-green-300";
    case "paused":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Em Execução";
    case "completed":
      return "Concluída";
    case "paused":
      return "Pausada";
    default:
      return "Planejada";
  }
};

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case "google_ads":
      return "🎯";
    case "linkedin":
      return "💼";
    case "seo":
      return "🔍";
    case "referral":
      return "🤝";
    case "partnerships":
      return "🤝";
    case "email":
      return "📧";
    case "product":
      return "🚀";
    default:
      return "📊";
  }
};

export const MarketingPlanManager = () => {
  const { goals, isLoading: goalsLoading, totalActualConversions } = useMarketingGoals();
  const { strategies, isLoading: strategiesLoading } = useMarketingStrategies();

  const progressPercentage = Math.min(100, Math.round((totalActualConversions / GOAL_TARGET) * 100));
  const totalBudget = strategies?.reduce((sum, s) => sum + (s.budget_monthly || 0), 0) || 0;
  const activeStrategies = strategies?.filter((s) => s.status === "active").length || 0;

  if (goalsLoading || strategiesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Goal Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Meta: {GOAL_TARGET.toLocaleString()} Assinantes</CardTitle>
                <p className="text-muted-foreground">Prazo: {GOAL_DEADLINE}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">{totalActualConversions}</p>
              <p className="text-sm text-muted-foreground">assinantes atuais</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-4" />
            <p className="text-xs text-muted-foreground text-right">
              Faltam {(GOAL_TARGET - totalActualConversions).toLocaleString()} assinantes para a meta
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline de Metas Mensais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {goals?.map((goal) => {
              const monthName = format(new Date(goal.year, goal.month - 1), "MMM/yy", { locale: ptBR });
              const achieved = goal.actual_conversions >= goal.target_conversions;
              const monthProgress = goal.target_conversions > 0 
                ? Math.round((goal.actual_conversions / goal.target_conversions) * 100)
                : 0;

              return (
                <Card 
                  key={goal.id} 
                  className={`border-2 ${achieved ? "border-green-300 bg-green-50" : "border-border"}`}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="font-bold text-lg uppercase">{monthName}</p>
                      <div className="my-2">
                        <span className="text-3xl font-bold text-primary">{goal.target_conversions}</span>
                        <span className="text-sm text-muted-foreground ml-1">meta</span>
                      </div>
                      <Progress value={monthProgress} className="h-2 mb-2" />
                      <div className="flex justify-between text-xs">
                        <span>{goal.actual_conversions} atual</span>
                        <span>{monthProgress}%</span>
                      </div>
                      {goal.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{goal.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{strategies?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Estratégias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeStrategies}</p>
                <p className="text-xs text-muted-foreground">Em Execução</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {totalBudget.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Orçamento/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{strategies?.reduce((sum, s) => sum + s.target_leads, 0) || 0}</p>
                <p className="text-xs text-muted-foreground">Meta de Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategies Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Estratégias do Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies?.map((strategy) => (
              <Card key={strategy.id} className="border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getChannelIcon(strategy.channel)}</span>
                      <div>
                        <h4 className="font-semibold line-clamp-1">{strategy.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{strategy.type}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(strategy.status)}>
                      {getStatusLabel(strategy.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Orçamento</p>
                      <p className="font-medium">
                        {strategy.budget_monthly > 0 
                          ? `R$ ${strategy.budget_monthly.toLocaleString()}/mês` 
                          : "Orgânico"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Meta Leads</p>
                      <p className="font-medium">{strategy.target_leads}</p>
                    </div>
                  </div>

                  {strategy.kpis && strategy.kpis.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {strategy.kpis.slice(0, 2).map((kpi, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {kpi.name}: {kpi.target}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
