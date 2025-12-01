import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePublicRoadmap } from "@/hooks/usePublicRoadmap";
import { RoadmapCard } from "./RoadmapCard";
import { Loader2 } from "lucide-react";

const statusLabels = {
  planned: 'Próximas Features',
  in_progress: 'Em Desenvolvimento',
  testing: 'Em Teste',
  completed: 'Concluídas',
};

export const RoadmapTimeline = () => {
  const { items, isLoading } = usePublicRoadmap();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredItems = items.filter(
    (item) => statusFilter === 'all' || item.status === statusFilter
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roadmap Público</CardTitle>
        <CardDescription>
          Veja o que está por vir e o que já foi implementado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              Todas
              <Badge variant="secondary" className="ml-2">{items.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="planned" className="flex-1">
              Próximas
              <Badge variant="secondary" className="ml-2">
                {items.filter((i) => i.status === 'planned').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1">
              Em Dev
              <Badge variant="secondary" className="ml-2">
                {items.filter((i) => i.status === 'in_progress').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              Concluídas
              <Badge variant="secondary" className="ml-2">
                {items.filter((i) => i.status === 'completed').length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma feature encontrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <RoadmapCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
