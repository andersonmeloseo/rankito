import * as React from "react";
import { TabsTrigger } from "@/components/ui/tabs";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClickUpTabTriggerProps {
  value: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export const ClickUpTabTrigger = ({ 
  value, 
  icon: Icon, 
  children,
  className 
}: ClickUpTabTriggerProps) => {
  return (
    <TabsTrigger 
      value={value}
      className={cn(
        "relative px-4 py-3 rounded-t-none font-medium text-sm",
        "data-[state=inactive]:bg-transparent",
        "data-[state=inactive]:text-gray-600",
        "data-[state=inactive]:hover:bg-gray-50",
        "data-[state=active]:bg-blue-600",
        "data-[state=active]:text-white",
        "data-[state=active]:shadow-sm",
        "transition-all duration-200",
        "border-0",
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 mr-2 inline-block" />}
      {children}
    </TabsTrigger>
  );
};
