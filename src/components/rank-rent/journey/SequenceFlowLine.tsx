import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SequenceFlowLineProps {
  className?: string;
}

export const SequenceFlowLine = ({ className }: SequenceFlowLineProps) => {
  return (
    <div className={cn("flex justify-center my-2", className)}>
      <div className="flex flex-col items-center">
        <div className="w-0.5 h-6 bg-gradient-to-b from-blue-300 to-blue-500 dark:from-blue-600 dark:to-blue-400 animate-pulse" />
        <ChevronDown className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-bounce" />
      </div>
    </div>
  );
};
