import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, MapPin, TrendingUp, Users } from "lucide-react";

interface GeolocationMetricsCardsProps {
  summary: {
    totalCountries: number;
    totalCities: number;
    totalConversions: number;
    topCountry: { name: string; percentage: number } | null;
    concentration: number;
  };
}

export const GeolocationMetricsCards = ({ summary }: GeolocationMetricsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Países</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalCountries}</div>
          <p className="text-xs text-muted-foreground">
            Países com conversões
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top País</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.topCountry?.name || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.topCountry ? `${summary.topCountry.percentage.toFixed(1)}% das conversões` : 'Sem dados'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concentração</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.concentration.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Conversões nos top 3 países
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cidades Ativas</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalCities}</div>
          <p className="text-xs text-muted-foreground">
            Cidades diferentes
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
