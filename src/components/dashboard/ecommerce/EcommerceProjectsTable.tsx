import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useGlobalEcommerceMetrics } from "@/hooks/useGlobalEcommerceMetrics";

interface EcommerceProjectsTableProps {
  userId: string;
}

export const EcommerceProjectsTable = ({ userId }: EcommerceProjectsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useGlobalEcommerceMetrics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projetos com E-commerce</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando projetos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allProjects = metrics?.topProjects || [];
  const filteredProjects = allProjects.filter(project => 
    project.siteName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Projetos com E-commerce</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-2">
              {searchTerm ? "Nenhum projeto encontrado" : "Nenhum projeto com vendas"}
            </p>
            <p className="text-sm text-muted-foreground">
              Instale o pixel de e-commerce em seus sites
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Tendência</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project, index) => {
                const conversionRate = project.views > 0 
                  ? ((project.orders / project.views) * 100).toFixed(2)
                  : "0.00";
                
                // Mock trend (seria calculado com dados históricos)
                const trend = index % 3 === 0 ? 15 : index % 3 === 1 ? -8 : 0;

                return (
                  <TableRow 
                    key={project.siteId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/site/${project.siteId}?tab=pixel-ecommerce`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{index + 1}
                        </Badge>
                        {project.siteName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(project.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {project.orders} pedidos
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.aov)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{conversionRate}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getTrendIcon(trend)}
                        <span className={trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground"}>
                          {Math.abs(trend)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/site/${project.siteId}?tab=pixel-ecommerce`);
                        }}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Ver detalhes
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
