import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  className?: string;
}

const statusConfig = {
  open: { label: 'Aberto', variant: 'default' as const, className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  in_progress: { label: 'Em Progresso', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  waiting_user: { label: 'Aguardando Usuário', variant: 'default' as const, className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  resolved: { label: 'Resolvido', variant: 'default' as const, className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  closed: { label: 'Fechado', variant: 'outline' as const, className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}
