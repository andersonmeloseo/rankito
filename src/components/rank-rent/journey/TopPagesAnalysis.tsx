import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, LogOut } from "lucide-react";

interface TopPage {
  page_url: string;
  entries: number;
  exits: number;
}

interface TopPagesAnalysisProps {
  entryPages: TopPage[];
  exitPages: TopPage[];
}

export const TopPagesAnalysis = ({ entryPages, exitPages }: TopPagesAnalysisProps) => {
  const formatUrl = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-green-500" />
            Top 10 Páginas de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entryPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado disponível
              </p>
            ) : (
              entryPages.map((page, index) => (
                <div key={page.page_url} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" title={page.page_url}>
                      {formatUrl(page.page_url)}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-sm font-semibold">
                    {page.entries}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-500" />
            Top 10 Páginas de Saída
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exitPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado disponível
              </p>
            ) : (
              exitPages.map((page, index) => (
                <div key={page.page_url} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" title={page.page_url}>
                      {formatUrl(page.page_url)}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-sm font-semibold">
                    {page.exits}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
