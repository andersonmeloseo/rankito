import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  className?: string;
}

const priorityConfig = {
  low: { label: 'Baixa', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  medium: { label: 'Média', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800 hover:bg-red-100 animate-pulse' },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}
