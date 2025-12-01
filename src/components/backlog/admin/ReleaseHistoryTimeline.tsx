import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package } from "lucide-react";
import { useBacklogItems } from "@/hooks/useBacklogItems";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ReleaseHistoryTimeline = () => {
  const { items } = useBacklogItems();

  // Agrupa itens completados por versão
  const releases = items
    .filter((item) => item.status === 'completed' && item.release_version)
    .reduce((acc, item) => {
      const version = item.release_version || 'Sem versão';
      if (!acc[version]) {
        acc[version] = [];
      }
      acc[version].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

  const sortedReleases = Object.entries(releases).sort(
    ([, itemsA], [, itemsB]) => {
      const dateA = Math.max(...itemsA.map((i) => new Date(i.actual_end_date || i.updated_at).getTime()));
      const dateB = Math.max(...itemsB.map((i) => new Date(i.actual_end_date || i.updated_at).getTime()));
      return dateB - dateA;
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Releases</CardTitle>
        <CardDescription>
          Timeline de versões lançadas e features implementadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedReleases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma release concluída ainda</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedReleases.map(([version, releaseItems]) => {
              const latestDate = Math.max(
                ...releaseItems.map((i) => new Date(i.actual_end_date || i.updated_at).getTime())
              );

              return (
                <div key={version} className="relative pl-8 pb-8 border-l-2 border-border last:border-0">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-sm">
                        {version}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(latestDate), 'dd MMM yyyy', { locale: ptBR })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {releaseItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {item.category === 'new_feature' && (
                                <Badge variant="outline" className="text-[10px]">
                                  Nova Feature
                                </Badge>
                              )}
                              {item.category === 'improvement' && (
                                <Badge variant="outline" className="text-[10px]">
                                  Melhoria
                                </Badge>
                              )}
                              {item.category === 'bugfix' && (
                                <Badge variant="outline" className="text-[10px]">
                                  Correção
                                </Badge>
                              )}
                              {item.category === 'security' && (
                                <Badge variant="outline" className="text-[10px]">
                                  Segurança
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
