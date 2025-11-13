import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

interface BreadcrumbItemData {
  href?: string;
  label: string;
  icon?: LucideIcon;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItemData[];
  title: string;
  subtitle?: string | ReactNode;
  badge?: { label: string; variant?: "default" | "secondary" | "destructive" | "outline" };
  actions?: ReactNode;
}

export const PageHeader = ({ breadcrumbs, title, subtitle, badge, actions }: PageHeaderProps) => {
  return (
    <div className="border-b border-border/50 bg-gradient-to-r from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <div key={index} className="contents">
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href} className="flex items-center gap-2">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {badge && (
                <Badge variant={badge.variant || "default"}>{badge.label}</Badge>
              )}
            </div>
            {subtitle && (
              <div className="text-base text-muted-foreground">{subtitle}</div>
            )}
          </div>
          
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
