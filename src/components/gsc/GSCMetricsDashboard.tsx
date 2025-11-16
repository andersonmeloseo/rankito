import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGSCMetricsHistory } from "@/hooks/useGSCMetricsHistory";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { format } from "date-fns";

interface GSCMetricsDashboardProps {
  siteId: string;
}

const COLORS = {
  success: 'hsl(var(--chart-1))',
  failed: 'hsl(var(--chart-2))',
};

export function GSCMetricsDashboard({ siteId }: GSCMetricsDashboardProps) {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { data: metrics, isLoading } = useGSCMetricsHistory(siteId, range);

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = metrics.summary.overallSuccessRate;
  const pieData = [
    { name: 'Success', value: metrics.summary.successfulRequests },
    { name: 'Failed', value: metrics.summary.failedRequests },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
        <Select value={range} onValueChange={(v) => setRange(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.summary.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.summary.successfulRequests} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
              {successRate >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.summary.failedRequests} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.integrations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Processing requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indexing Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metrics.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => {
                  try {
                    return range === '24h' 
                      ? format(new Date(value), 'HH:mm')
                      : format(new Date(value), 'MM/dd');
                  } catch {
                    return value;
                  }
                }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => {
                  try {
                    return range === '24h'
                      ? format(new Date(value as string), 'MMM dd, HH:mm')
                      : format(new Date(value as string), 'MMM dd, yyyy');
                  } catch {
                    return value;
                  }
                }}
              />
              <Line 
                type="monotone" 
                dataKey="successful" 
                stroke={COLORS.success}
                strokeWidth={2}
                name="Successful"
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke={COLORS.failed}
                strokeWidth={2}
                name="Failed"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Success/Failure Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Success Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.success : COLORS.failed} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Indexed URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {metrics.topUrls.slice(0, 5).map((urlData, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex-1 truncate">
                    <p className="font-medium truncate">{new URL(urlData.url).pathname}</p>
                    <p className="text-xs text-muted-foreground">
                      {urlData.count} requests • {urlData.successRate.toFixed(0)}% success
                    </p>
                  </div>
                </div>
              ))}
              {metrics.topUrls.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integration Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.integrations.map((integration) => (
              <div key={integration.integration_id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">{integration.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{integration.total_requests} requests</p>
                  <p className="text-xs text-muted-foreground">
                    {integration.success_rate.toFixed(1)}% success
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
