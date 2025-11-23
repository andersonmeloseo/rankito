import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FlowConnection {
  from: string;
  to: string;
  count: number;
}

interface JourneyFlowDiagramProps {
  connections: FlowConnection[];
  topPages: string[];
}

export const JourneyFlowDiagram = ({ connections, topPages }: JourneyFlowDiagramProps) => {
  // Pegar top 10 páginas mais populares
  const displayPages = topPages.slice(0, 10);
  
  // Calcular máximo para normalização de largura
  const maxCount = Math.max(...connections.map(c => c.count), 1);
  
  const formatPageName = (url: string) => {
    try {
      const path = new URL(url).pathname;
      if (path === '/') return 'Home';
      const segments = path.split('/').filter(Boolean);
      return segments[segments.length - 1] || 'Home';
    } catch {
      return url.split('/').pop() || url;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Fluxo entre Páginas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayPages.map((page, index) => {
            // Encontrar conexões desta página para outras
            const outgoingConnections = connections
              .filter(c => c.from === page)
              .sort((a, b) => b.count - a.count)
              .slice(0, 3); // Top 3 destinos

            if (outgoingConnections.length === 0) return null;

            return (
              <div key={index} className="space-y-2">
                {/* Página de origem */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-medium">
                    {formatPageName(page)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({outgoingConnections.reduce((acc, c) => acc + c.count, 0)} sessões)
                  </span>
                </div>

                {/* Conexões */}
                <div className="pl-6 space-y-2">
                  {outgoingConnections.map((connection, idx) => {
                    const width = (connection.count / maxCount) * 100;
                    
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatPageName(connection.to)}</span>
                          <span className="text-xs text-muted-foreground">
                            ({connection.count})
                          </span>
                        </div>
                        {/* Barra de fluxo */}
                        <div className="ml-5 h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                            style={{ width: `${Math.max(width, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {displayPages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Dados insuficientes para gerar diagrama de fluxo.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
