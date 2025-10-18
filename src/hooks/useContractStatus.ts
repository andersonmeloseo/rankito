import { useMemo } from "react";
import { differenceInDays } from "date-fns";

export type ContractStatus = "available" | "active" | "expiring_soon" | "expired";
export type PaymentStatus = "not_applicable" | "current" | "due_soon" | "overdue";

interface UseContractStatusProps {
  isRented: boolean;
  contractEndDate?: string | null;
  nextPaymentDate?: string | null;
}

export const useContractStatus = ({
  isRented,
  contractEndDate,
  nextPaymentDate,
}: UseContractStatusProps) => {
  const contractStatus: ContractStatus = useMemo(() => {
    if (!isRented) return "available";
    if (!contractEndDate) return "active";

    const daysUntilExpiration = differenceInDays(new Date(contractEndDate), new Date());

    if (daysUntilExpiration < 0) return "expired";
    if (daysUntilExpiration <= 30) return "expiring_soon";
    return "active";
  }, [isRented, contractEndDate]);

  const paymentStatus: PaymentStatus = useMemo(() => {
    if (!isRented) return "not_applicable";
    if (!nextPaymentDate) return "current";

    const daysUntilPayment = differenceInDays(new Date(nextPaymentDate), new Date());

    if (daysUntilPayment < 0) return "overdue";
    if (daysUntilPayment <= 7) return "due_soon";
    return "current";
  }, [isRented, nextPaymentDate]);

  const daysRemaining = useMemo(() => {
    if (!contractEndDate) return null;
    return differenceInDays(new Date(contractEndDate), new Date());
  }, [contractEndDate]);

  const daysUntilPayment = useMemo(() => {
    if (!nextPaymentDate) return null;
    return differenceInDays(new Date(nextPaymentDate), new Date());
  }, [nextPaymentDate]);

  return {
    contractStatus,
    paymentStatus,
    daysRemaining,
    daysUntilPayment,
  };
};
