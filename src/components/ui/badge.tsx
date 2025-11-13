import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "bg-green-600 text-white border-green-600 hover:bg-green-700 dark:bg-green-500 dark:border-green-500 dark:hover:bg-green-600",
        warning: "bg-amber-600 text-white border-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:border-amber-500 dark:hover:bg-amber-600",
        info: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:border-blue-500 dark:hover:bg-blue-600",
        danger: "bg-red-600 text-white border-red-600 hover:bg-red-700 dark:bg-red-500 dark:border-red-500 dark:hover:bg-red-600",
        purple: "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:border-purple-500 dark:hover:bg-purple-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
