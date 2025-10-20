import { Building2 } from "lucide-react";

interface ClientPortalHeaderProps {
  companyName?: string | null;
  showSubtitle?: boolean;
}

export const ClientPortalHeader = ({ 
  companyName, 
  showSubtitle = true 
}: ClientPortalHeaderProps) => {
  const displayTitle = companyName 
    ? `Portal da ${companyName}` 
    : 'Portal Analítico';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Building2 className="h-8 w-8 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {displayTitle}
              </h1>
              {showSubtitle && (
                <p className="text-xs text-muted-foreground">
                  Análise de Performance Digital
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
