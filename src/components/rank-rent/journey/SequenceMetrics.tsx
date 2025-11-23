import { Badge } from "@/components/ui/badge";
import { Users, FileStack, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getRankStyle } from "@/lib/journey-utils";

interface SequenceMetricsProps {
  rank: number;
  sessionCount: number;
  percentage: number;
  pageCount: number;
  firstAccessTime?: string;
}

export const SequenceMetrics = ({ rank, sessionCount, percentage, pageCount, firstAccessTime }: SequenceMetricsProps) => {
  const rankStyle = getRankStyle(rank);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge className={cn("text-sm font-bold px-3 py-1", rankStyle.badge)}>
            {rankStyle.emoji}
          </Badge>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-semibold">{sessionCount}</span>
            <span>{sessionCount === 1 ? 'sessão' : 'sessões'}</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <FileStack className="h-4 w-4" />
            <span className="font-semibold">{pageCount}</span>
            <span>{pageCount === 1 ? 'página' : 'páginas'}</span>
          </div>

          {firstAccessTime && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(firstAccessTime), "dd/MM/yyyy", { locale: ptBR })}</span>
              <Clock className="h-3 w-3 ml-1" />
              <span>{format(new Date(firstAccessTime), "HH:mm", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <Badge variant="outline" className="text-sm font-semibold">
          {percentage.toFixed(1)}% do total
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
