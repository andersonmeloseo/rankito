import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConversionGoals, ConversionGoal } from '@/hooks/useConversionGoals';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface ConversionGoalsAnalyticsProps {
  siteId: string;
}

type PeriodOption = '7' | '30' | '90' | 'custom';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const ConversionGoalsAnalytics = ({ siteId }: ConversionGoalsAnalyticsProps) => {
  const { goals, isLoading: goalsLoading } = useConversionGoals(siteId);
  
  // Filter states
  const [period, setPeriod] = useState<PeriodOption>('30');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Calculate date range based on period selection
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    
    if (period === 'custom' && dateRange?.from) {
      return {
        startDate: dateRange.from,
        endDate: dateRange.to || new Date()
      };
    }
    
    const days = parseInt(period);
    start.setDate(start.getDate() - days);
    return { startDate: start, endDate: end };
  }, [period, dateRange]);
  
  // Fetch conversions with goal_id for analytics
  const { data: conversionsData, isLoading: conversionsLoading } = useQuery({
    queryKey: ['goal-conversions', siteId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_conversions')
        .select('goal_id, goal_name, conversion_value, created_at')
        .eq('site_id', siteId)
        .not('goal_id', 'is', null)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId && goals.length > 0,
  });

  // Filter conversions by selected goal
  const filteredConversions = useMemo(() => {
    if (!conversionsData) return [];
    if (selectedGoalId === 'all') return conversionsData;
    return conversionsData.filter(c => c.goal_id === selectedGoalId);
  }, [conversionsData, selectedGoalId]);

  const analytics = useMemo(() => {
    if (!filteredConversions || filteredConversions.length === 0) {
      return {
        totalConversions: 0,
        totalValue: 0,
        byGoal: [] as { name: string; goalId: string | null; conversions: number; value: number }[],
        topGoal: null as { name: string; conversions: number } | null,
      };
    }

    const byGoalMap = new Map<string, { goalId: string | null; conversions: number; value: number }>();
    
    filteredConversions.forEach((conv) => {
      const goalName = conv.goal_name || 'Sem meta';
      const current = byGoalMap.get(goalName) || { goalId: conv.goal_id, conversions: 0, value: 0 };
      byGoalMap.set(goalName, {
        goalId: conv.goal_id,
        conversions: current.conversions + 1,
        value: current.value + (conv.conversion_value || 0),
      });
    });

    const byGoal = Array.from(byGoalMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.conversions - a.conversions);

    const topGoal = byGoal.length > 0 ? { name: byGoal[0].name, conversions: byGoal[0].conversions } : null;

    return {
      totalConversions: filteredConversions.length,
      totalValue: filteredConversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0),
      byGoal,
      topGoal,
    };
  }, [filteredConversions]);
  
  const getPeriodLabel = () => {
    if (period === 'custom' && dateRange?.from) {
      const from = format(dateRange.from, 'dd/MM', { locale: ptBR });
      const to = dateRange.to ? format(dateRange.to, 'dd/MM', { locale: ptBR }) : 'hoje';
      return `${from} - ${to}`;
    }
    return `Últimos ${period} dias`;
  };

  const isLoading = goalsLoading || conversionsLoading;

  if (goals.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance das Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance das Metas
            </CardTitle>
            <CardDescription>
              {getPeriodLabel()} de conversões por meta configurada
            </CardDescription>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
              <SelectTrigger className="w-[130px] h-9">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="custom">Período</SelectItem>
              </SelectContent>
            </Select>
            
            {period === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    {dateRange?.from ? (
                      <>
                        {format(dateRange.from, 'dd/MM', { locale: ptBR })}
                        {dateRange.to && ` - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`}
                      </>
                    ) : (
                      'Selecionar'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
              <SelectTrigger className="w-[160px] h-9">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Todas metas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas metas</SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.goal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                  <p className="text-2xl font-bold">{analytics.totalConversions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">
                    R$ {analytics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meta Principal</p>
                  <p className="text-lg font-semibold truncate">
                    {analytics.topGoal?.name || 'Nenhuma'}
                  </p>
                  {analytics.topGoal && (
                    <p className="text-xs text-muted-foreground">
                      {analytics.topGoal.conversions} conversões
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {analytics.byGoal.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Conversões por Meta
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byGoal} layout="vertical">
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'conversions') return [value, 'Conversões'];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
                    {analytics.byGoal.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Goal Details */}
            <div className="space-y-2">
              {analytics.byGoal.map((goal, index) => (
                <div 
                  key={goal.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{goal.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="secondary">
                      {goal.conversions} {goal.conversions === 1 ? 'conversão' : 'conversões'}
                    </Badge>
                    {goal.value > 0 && (
                      <Badge variant="outline" className="text-green-600">
                        R$ {goal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.byGoal.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma conversão registrada com metas nos últimos 30 dias</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
