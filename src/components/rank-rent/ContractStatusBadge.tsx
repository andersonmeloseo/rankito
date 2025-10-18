import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { ContractStatus, PaymentStatus } from "@/hooks/useContractStatus";

interface ContractStatusBadgeProps {
  status: ContractStatus;
  daysRemaining?: number | null;
  className?: string;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  daysUntilPayment?: number | null;
  className?: string;
}

export const ContractStatusBadge = ({ status, daysRemaining, className }: ContractStatusBadgeProps) => {
  const statusConfig = {
    available: {
      label: "Disponível",
      icon: Clock,
      className: "bg-muted text-muted-foreground border-muted",
    },
    active: {
      label: "Contrato Ativo",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20",
    },
    expiring_soon: {
      label: daysRemaining ? `Vence em ${daysRemaining} dias` : "Vence em Breve",
      icon: AlertCircle,
      className: "bg-warning/10 text-warning border-warning/20",
    },
    expired: {
      label: "Contrato Vencido",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className} ${className || ""}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};

export const PaymentStatusBadge = ({ status, daysUntilPayment, className }: PaymentStatusBadgeProps) => {
  if (status === "not_applicable") return null;

  const statusConfig = {
    current: {
      label: "Pagamento em Dia",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20",
    },
    due_soon: {
      label: daysUntilPayment ? `Vence em ${daysUntilPayment} dias` : "Vence em Breve",
      icon: AlertCircle,
      className: "bg-warning/10 text-warning border-warning/20",
    },
    overdue: {
      label: "Pagamento Atrasado",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    not_applicable: {
      label: "",
      icon: Clock,
      className: "",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className} ${className || ""}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};
