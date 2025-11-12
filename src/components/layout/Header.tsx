import { Mountain } from "lucide-react";

interface HeaderProps {
  showSubtitle?: boolean;
}

export const Header = ({ showSubtitle = true }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Mountain className="h-8 w-8 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Rankito
              </h1>
              {showSubtitle && (
                <p className="text-xs text-muted-foreground">
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
