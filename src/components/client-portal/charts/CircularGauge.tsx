import { Card, CardContent } from '@/components/ui/card';

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CircularGauge = ({ 
  value, 
  max, 
  label, 
  icon,
  color = 'hsl(var(--chart-1))',
  size = 'md'
}: CircularGaugeProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizes = {
    sm: { container: 120, text: 'text-2xl', label: 'text-xs' },
    md: { container: 160, text: 'text-4xl', label: 'text-sm' },
    lg: { container: 200, text: 'text-5xl', label: 'text-base' },
  };

  const config = sizes[size];

  return (
    <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="relative" style={{ width: config.container, height: config.container }}>
          <svg className="transform -rotate-90" width={config.container} height={config.container}>
            {/* Background circle */}
            <circle
              cx={config.container / 2}
              cy={config.container / 2}
              r={45}
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={config.container / 2}
              cy={config.container / 2}
              r={45}
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${color}40)`
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {icon && <div className="mb-2 text-primary">{icon}</div>}
            <div className={`${config.text} font-bold`} style={{ color }}>
              {value}
            </div>
            <div className="text-xs text-muted-foreground">de {max}</div>
          </div>
        </div>
        
        <div className={`${config.label} font-medium text-center mt-4 text-muted-foreground`}>
          {label}
        </div>
        
        <div className="text-2xl font-bold text-primary mt-2">
          {percentage.toFixed(0)}%
        </div>
      </CardContent>
    </Card>
  );
};
