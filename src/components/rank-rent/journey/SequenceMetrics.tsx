import { Badge } from "@/components/ui/badge";
import { Users, FileStack } from "lucide-react";
import { cn } from "@/lib/utils";

interface SequenceMetricsProps {
  rank: number;
  sessionCount: number;
  percentage: number;
  pageCount: number;
}

export const SequenceMetrics = ({ rank, sessionCount, percentage, pageCount }: SequenceMetricsProps) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: "🥇", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" };
    if (rank === 2) return { emoji: "🥈", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100" };
    if (rank === 3) return { emoji: "🥉", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" };
    return { emoji: `#${rank}`, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" };
  };

  const rankBadge = getRankBadge(rank);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge className={cn("text-sm font-bold px-3 py-1", rankBadge.color)}>
            {rankBadge.emoji}
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
