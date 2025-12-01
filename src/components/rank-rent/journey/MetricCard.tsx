import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { InfoIcon, LucideIcon } from "lucide-react";
import { metricExplanations, MetricExplanation } from "./metricExplanations";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  metricKey: string;
}

export const MetricCard = ({ title, value, subtitle, icon: Icon, metricKey }: MetricCardProps) => {
  const explanation: MetricExplanation = metricExplanations[metricKey];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="max-w-md p-4 space-y-3 pointer-events-auto"
                sideOffset={8}
              >
                <div>
                  <h4 className="font-semibold text-sm mb-1.5 text-foreground">
                    {explanation.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {explanation.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    📊 Como é calculada:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {explanation.calculation}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    🎯 Interpretação estratégica:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {explanation.interpretation}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ {explanation.benchmarks.excellent}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      • {explanation.benchmarks.good}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠ {explanation.benchmarks.poor}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ✕ {explanation.benchmarks.critical}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    💡 Ação recomendada:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {explanation.action}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
};
