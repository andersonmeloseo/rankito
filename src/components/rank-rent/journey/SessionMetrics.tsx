import { Users, UserCheck, UserPlus, Repeat, Clock, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { MetricCard } from "./MetricCard";

interface SessionMetricsProps {
  metrics: {
    totalSessions: number;
    uniqueVisitors: number;
    newVisitors: number;
    returningVisitors: number;
    avgDuration: number;
    avgPagesPerSession: number;
    engagementRate: number;
    bounceRate: number;
  };
  periodDays: number;
}

export const SessionMetrics = ({ metrics, periodDays }: SessionMetricsProps) => {
  const newPercentage = metrics.uniqueVisitors > 0 
    ? ((metrics.newVisitors / metrics.uniqueVisitors) * 100).toFixed(0) 
    : "0";
  const returningPercentage = metrics.uniqueVisitors > 0 
    ? ((metrics.returningVisitors / metrics.uniqueVisitors) * 100).toFixed(0) 
    : "0";

  return (
    <div className="space-y-4">
      {/* Linha 1: Audiência */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Audiência
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Sessões"
            value={metrics.totalSessions.toLocaleString()}
            subtitle={`Últimos ${periodDays} dias`}
            icon={Users}
            metricKey="totalSessions"
          />
          <MetricCard 
            title="Usuários Únicos"
            value={metrics.uniqueVisitors.toLocaleString()}
            subtitle="Visitantes diferentes"
            icon={UserCheck}
            metricKey="uniqueVisitors"
          />
          <MetricCard 
            title="Novos"
            value={`${metrics.newVisitors.toLocaleString()} (${newPercentage}%)`}
            subtitle="Primeira visita"
            icon={UserPlus}
            metricKey="newVisitors"
          />
          <MetricCard 
            title="Retornantes"
            value={`${metrics.returningVisitors.toLocaleString()} (${returningPercentage}%)`}
            subtitle="Voltaram ao site"
            icon={Repeat}
            metricKey="returningVisitors"
          />
        </div>
      </div>

      {/* Linha 2: Comportamento */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Comportamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Duração Média"
            value={formatTime(metrics.avgDuration)}
            subtitle="Tempo por sessão"
            icon={Clock}
            metricKey="avgDuration"
          />
          <MetricCard 
            title="Páginas/Sessão"
            value={metrics.avgPagesPerSession}
            subtitle="Profundidade de navegação"
            icon={FileText}
            metricKey="avgPagesPerSession"
          />
          <MetricCard 
            title="Taxa Engajamento"
            value={`${metrics.engagementRate.toFixed(1)}%`}
            subtitle="Interagiram com site"
            icon={TrendingUp}
            metricKey="engagementRate"
          />
          <MetricCard 
            title="Taxa Rejeição"
            value={`${metrics.bounceRate.toFixed(1)}%`}
            subtitle="Saíram sem interagir"
            icon={TrendingDown}
            metricKey="bounceRate"
          />
        </div>
      </div>
    </div>
  );
};
