import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Calendar, TrendingUp } from 'lucide-react';

interface MapboxLimitReachedProps {
  currentCount: number;
  limit: number;
  resetDate: string;
}

export const MapboxLimitReached = ({ currentCount, limit, resetDate }: MapboxLimitReachedProps) => {
  const percentage = Math.round((currentCount / limit) * 100);
  
  // Format reset date
  const formattedDate = new Date(resetDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Card className="overflow-hidden">
      <div className="relative w-full h-[600px] flex items-center justify-center bg-gradient-to-br from-muted/50 via-muted/30 to-background">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <CardContent className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 p-8 max-w-2xl">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative bg-background border-2 border-border rounded-full p-6">
              <MapPin className="w-16 h-16 text-primary" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Badge variant="destructive" className="text-sm px-4 py-1">
              Limite Mensal Atingido
            </Badge>
            <h3 className="text-2xl font-semibold text-foreground">
              Visualização de Mapas Pausada
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Você atingiu o limite de {limit.toLocaleString('pt-BR')} carregamentos de mapas permitidos no plano gratuito do Mapbox
            </p>
          </div>

          {/* Usage stats */}
          <Alert className="max-w-md">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uso do Mês:</span>
                <span className="text-sm font-semibold text-destructive">
                  {currentCount.toLocaleString('pt-BR')} / {limit.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-destructive transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                {percentage}% do limite utilizado
              </div>
            </AlertDescription>
          </Alert>

          {/* Reset date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span>
              Os mapas voltarão a funcionar em <strong className="text-foreground">{formattedDate}</strong>
            </span>
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
            O contador é resetado automaticamente todo dia 1º de cada mês. 
            Você poderá visualizar os mapas de geolocalização novamente após essa data.
          </p>
        </CardContent>
      </div>
    </Card>
  );
};
