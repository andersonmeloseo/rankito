import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  isConnected: boolean;
  liveCount: number;
  onViewNew?: () => void;
}

export const LiveIndicator = ({ isConnected, liveCount, onViewNew }: LiveIndicatorProps) => {
  if (!isConnected) {
    return (
      <Badge variant="outline" className="gap-2">
        <span className="h-2 w-2 rounded-full bg-gray-400" />
        OFFLINE
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <Badge 
        variant="outline" 
        className={cn(
          "gap-2 border-green-500/50 bg-green-500/10",
          liveCount > 0 && "animate-pulse"
        )}
      >
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        AO VIVO
      </Badge>
      
      {liveCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewNew}
          className="h-7 gap-2 text-xs animate-scale-in"
        >
          <span className="font-semibold text-green-600">+{liveCount}</span>
          {liveCount === 1 ? 'nova conversão' : 'novas conversões'}
          <ArrowDown className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};