import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface GaugeChartProps {
  value: number;
  max?: number;
  title: string;
  subtitle?: string;
  unit?: string;
  isLoading?: boolean;
}

export const GaugeChart = ({ 
  value, 
  max = 100, 
  title, 
  subtitle, 
  unit = "%",
  isLoading 
}: GaugeChartProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = Math.min((value / max) * 100, 100);
  const rotation = (percentage / 100) * 180 - 90;

  // Define cor baseada no valor
  const getColor = () => {
    if (percentage >= 75) return "hsl(142, 71%, 45%)"; // verde
    if (percentage >= 50) return "hsl(48, 96%, 53%)"; // amarelo
    if (percentage >= 25) return "hsl(25, 95%, 53%)"; // laranja
    return "hsl(0, 72%, 51%)"; // vermelho
  };

  const getStatus = () => {
    if (percentage >= 75) return "Excelente";
    if (percentage >= 50) return "Bom";
    if (percentage >= 25) return "Regular";
    return "Crítico";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-square max-w-[200px] mx-auto">
          {/* Arco de fundo */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="20"
              strokeDasharray="251.2 251.2"
              strokeDashoffset="125.6"
            />
            {/* Arco de progresso */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={getColor()}
              strokeWidth="20"
              strokeDasharray="251.2 251.2"
              strokeDashoffset={125.6 + (251.2 * (100 - percentage)) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
            />
          </svg>

          {/* Ponteiro */}
          <div 
            className="absolute top-1/2 left-1/2 w-1 h-16 origin-bottom transition-transform duration-1000 ease-out"
            style={{ 
              transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
              background: `linear-gradient(to top, ${getColor()}, transparent)`
            }}
          >
            <div 
              className="absolute top-0 left-1/2 w-3 h-3 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: getColor(), boxShadow: `0 0 10px ${getColor()}` }}
            />
          </div>

          {/* Centro */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-3xl font-bold" style={{ color: getColor() }}>
              {animatedValue.toFixed(1)}{unit}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {getStatus()}
            </div>
          </div>
        </div>

        {/* Escala */}
        <div className="flex justify-between text-xs text-muted-foreground mt-4">
          <span>0{unit}</span>
          <span>{(max / 2).toFixed(0)}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
};
