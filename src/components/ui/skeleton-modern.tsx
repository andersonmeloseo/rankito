import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonModernProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
}

const SkeletonModern = React.forwardRef<HTMLDivElement, SkeletonModernProps>(
  ({ className, variant = "rectangular", width, height, style, ...props }, ref) => {
    const variantClasses = {
      text: "h-4 rounded-md",
      circular: "rounded-full aspect-square",
      rectangular: "rounded-lg",
      card: "rounded-xl",
    };

    return (
      <div
        ref={ref}
        className={cn("skeleton-modern", variantClasses[variant], className)}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    );
  }
);
SkeletonModern.displayName = "SkeletonModern";

interface SkeletonCardProps {
  hasIcon?: boolean;
  hasAction?: boolean;
  lines?: number;
}

const SkeletonCard = ({ hasIcon = true, hasAction = false, lines = 2 }: SkeletonCardProps) => (
  <div className="card-modern p-6 space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        {hasIcon && <SkeletonModern variant="rectangular" className="w-12 h-12" />}
        <div className="space-y-2">
          <SkeletonModern variant="text" className="w-32" />
          <SkeletonModern variant="text" className="w-24 h-3" />
        </div>
      </div>
      {hasAction && <SkeletonModern variant="rectangular" className="w-8 h-8" />}
    </div>
    <div className="space-y-2">
      <SkeletonModern variant="text" className="w-20 h-8" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonModern
          key={i}
          variant="text"
          className={cn("h-3", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  </div>
);

interface SkeletonMetricCardProps {
  count?: number;
}

const SkeletonMetricCards = ({ count = 4 }: SkeletonMetricCardProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} hasIcon lines={1} />
    ))}
  </div>
);

interface SkeletonListProps {
  count?: number;
  hasAvatar?: boolean;
}

const SkeletonList = ({ count = 5, hasAvatar = false }: SkeletonListProps) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
        {hasAvatar && <SkeletonModern variant="circular" className="w-10 h-10" />}
        <div className="flex-1 space-y-2">
          <SkeletonModern variant="text" className="w-1/3" />
          <SkeletonModern variant="text" className="w-1/2 h-3" />
        </div>
        <SkeletonModern variant="rectangular" className="w-16 h-6" />
      </div>
    ))}
  </div>
);

export { SkeletonModern, SkeletonCard, SkeletonMetricCards, SkeletonList };
