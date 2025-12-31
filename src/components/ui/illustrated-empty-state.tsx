import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

type IllustrationType = "projects" | "deals" | "clients" | "conversions" | "charts" | "search" | "notifications" | "files" | "analytics";

interface IllustratedEmptyStateProps {
  illustration?: IllustrationType;
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const illustrations: Record<IllustrationType, React.ReactNode> = {
  projects: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="50" width="60" height="80" rx="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <rect x="40" y="60" width="40" height="6" rx="3" fill="hsl(var(--primary) / 0.3)"/>
      <rect x="40" y="72" width="30" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.3)"/>
      <rect x="40" y="82" width="35" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.3)"/>
      <rect x="110" y="70" width="60" height="80" rx="8" fill="hsl(var(--muted))" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 4"/>
      <circle cx="140" cy="110" r="15" fill="hsl(var(--primary) / 0.1)"/>
      <path d="M135 110h10M140 105v10" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  deals: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="40" width="120" height="30" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <rect x="40" y="80" width="120" height="30" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <rect x="40" y="120" width="120" height="30" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <circle cx="60" cy="55" r="8" fill="hsl(var(--primary) / 0.3)"/>
      <circle cx="60" cy="95" r="8" fill="hsl(var(--warning) / 0.3)"/>
      <circle cx="60" cy="135" r="8" fill="hsl(var(--success) / 0.3)"/>
      <rect x="75" y="51" width="60" height="8" rx="4" fill="hsl(var(--muted-foreground) / 0.3)"/>
      <rect x="75" y="91" width="50" height="8" rx="4" fill="hsl(var(--muted-foreground) / 0.3)"/>
      <rect x="75" y="131" width="55" height="8" rx="4" fill="hsl(var(--muted-foreground) / 0.3)"/>
    </svg>
  ),
  clients: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="70" r="30" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <circle cx="100" cy="60" r="12" fill="hsl(var(--primary) / 0.3)"/>
      <path d="M80 85 Q100 100 120 85" stroke="hsl(var(--primary) / 0.3)" strokeWidth="3" fill="none"/>
      <path d="M55 140 Q100 170 145 140" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <circle cx="60" cy="120" r="15" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <circle cx="140" cy="120" r="15" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
    </svg>
  ),
  conversions: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 140 L70 110 L100 125 L130 80 L160 95" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M40 140 L70 110 L100 125 L130 80 L160 95 L160 160 L40 160 Z" fill="hsl(var(--primary) / 0.1)"/>
      <circle cx="40" cy="140" r="6" fill="hsl(var(--primary))"/>
      <circle cx="70" cy="110" r="6" fill="hsl(var(--primary))"/>
      <circle cx="100" cy="125" r="6" fill="hsl(var(--primary))"/>
      <circle cx="130" cy="80" r="6" fill="hsl(var(--primary))"/>
      <circle cx="160" cy="95" r="6" fill="hsl(var(--primary))"/>
      <path d="M150 50 L165 65 L180 50" stroke="hsl(var(--success))" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M165 50 V75" stroke="hsl(var(--success))" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  charts: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="100" width="25" height="60" rx="4" fill="hsl(var(--primary) / 0.3)"/>
      <rect x="75" y="70" width="25" height="90" rx="4" fill="hsl(var(--primary) / 0.5)"/>
      <rect x="110" y="90" width="25" height="70" rx="4" fill="hsl(var(--primary) / 0.4)"/>
      <rect x="145" y="50" width="25" height="110" rx="4" fill="hsl(var(--primary) / 0.6)"/>
      <line x1="30" y1="160" x2="180" y2="160" stroke="hsl(var(--border))" strokeWidth="2"/>
      <line x1="30" y1="40" x2="30" y2="160" stroke="hsl(var(--border))" strokeWidth="2"/>
    </svg>
  ),
  search: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="90" r="40" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="3"/>
      <circle cx="90" cy="90" r="25" fill="hsl(var(--background))" stroke="hsl(var(--primary) / 0.3)" strokeWidth="2"/>
      <line x1="120" y1="120" x2="155" y2="155" stroke="hsl(var(--muted-foreground))" strokeWidth="8" strokeLinecap="round"/>
      <circle cx="90" cy="90" r="8" fill="hsl(var(--primary) / 0.2)"/>
    </svg>
  ),
  notifications: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 40 C70 40 50 65 50 95 L50 120 L40 140 L160 140 L150 120 L150 95 C150 65 130 40 100 40" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <circle cx="100" cy="155" r="12" fill="hsl(var(--primary) / 0.3)"/>
      <circle cx="140" cy="55" r="15" fill="hsl(var(--muted))" stroke="hsl(var(--success))" strokeWidth="2"/>
      <path d="M135 55 L140 60 L148 50" stroke="hsl(var(--success))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  files: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 40 L120 40 L150 70 L150 160 L50 160 Z" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <path d="M120 40 L120 70 L150 70" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2"/>
      <rect x="70" y="90" width="60" height="6" rx="3" fill="hsl(var(--muted-foreground) / 0.3)"/>
      <rect x="70" y="105" width="45" height="6" rx="3" fill="hsl(var(--muted-foreground) / 0.3)"/>
      <rect x="70" y="120" width="50" height="6" rx="3" fill="hsl(var(--muted-foreground) / 0.3)"/>
    </svg>
  ),
  analytics: (
    <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 150 L60 120 L90 130 L120 80 L150 100 L180 60" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 150 L60 120 L90 130 L120 80 L150 100 L180 60 L180 150 L30 150 Z" fill="hsl(var(--primary) / 0.1)"/>
      <circle cx="60" cy="120" r="5" fill="hsl(var(--primary))"/>
      <circle cx="90" cy="130" r="5" fill="hsl(var(--primary))"/>
      <circle cx="120" cy="80" r="5" fill="hsl(var(--primary))"/>
      <circle cx="150" cy="100" r="5" fill="hsl(var(--primary))"/>
      <circle cx="180" cy="60" r="5" fill="hsl(var(--primary))"/>
      <rect x="30" y="40" width="40" height="20" rx="4" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1"/>
      <rect x="35" y="45" width="20" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.3)"/>
      <rect x="35" y="52" width="28" height="3" rx="1" fill="hsl(var(--muted-foreground) / 0.2)"/>
    </svg>
  ),
};

export function IllustratedEmptyState({
  illustration,
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: IllustratedEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in",
        className
      )}
    >
      {illustration && illustrations[illustration] && (
        <div className="mb-6 opacity-80">{illustrations[illustration]}</div>
      )}
      {Icon && !illustration && (
        <div className="mb-6 p-4 rounded-2xl bg-muted">
          <Icon className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      <div className="flex items-center gap-3">
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            {action.icon && <action.icon className="w-4 h-4" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
