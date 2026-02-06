import { Loader2 } from "lucide-react";

interface PageLoadingFallbackProps {
  /** Use "page" for route-level, "tab" for tab-level */
  variant?: "page" | "tab";
  message?: string;
}

export const PageLoadingFallback = ({ 
  variant = "page", 
  message = "Carregando..." 
}: PageLoadingFallbackProps) => {
  if (variant === "tab") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
