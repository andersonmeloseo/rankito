import { Mountain } from "lucide-react";

interface HeaderProps {
  showSubtitle?: boolean;
}

export const Header = ({ showSubtitle = true }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Modern Logo with Gradient */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-gradient-to-br from-primary to-accent p-2.5 rounded-xl shadow-lg transition-transform duration-200 group-hover:scale-105">
                <Mountain className="h-6 w-6 text-white" />
              </div>
            </div>
            
            {/* Title with Better Typography */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Rankito
              </h1>
              {showSubtitle && (
                <p className="text-xs font-medium text-muted-foreground tracking-wide">
                  Gestão de Rank & Rent
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
