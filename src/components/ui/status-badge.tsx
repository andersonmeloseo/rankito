import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "indexed" | "pending" | "error" | "processing" | "not_submitted" | "success" | "warning" | "info";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig = {
  indexed: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Indexado",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  success: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Sucesso",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  pending: {
    variant: "warning" as const,
    icon: Clock,
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  warning: {
    variant: "warning" as const,
    icon: AlertCircle,
    label: "Aviso",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  error: {
    variant: "destructive" as const,
    icon: XCircle,
    label: "Erro",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  processing: {
    variant: "info" as const,
    icon: Loader2,
    label: "Processando",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  not_submitted: {
    variant: "outline" as const,
    icon: Info,
    label: "Não Enviado",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  info: {
    variant: "info" as const,
    icon: Info,
    label: "Info",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

export const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", config.className, className)}>
      <Icon className={cn("w-3.5 h-3.5", status === "processing" && "animate-spin")} />
      {displayLabel}
    </Badge>
  );
};
