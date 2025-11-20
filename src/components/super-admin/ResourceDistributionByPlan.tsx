import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "lucide-react";

interface PlanDistribution {
  planName: string;
  userCount: number;
  sitesCount: number;
  pagesCount: number;
}

interface ResourceDistributionByPlanProps {
  distribution: PlanDistribution[];
}

export const ResourceDistributionByPlan = ({ distribution }: ResourceDistributionByPlanProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Distribuição de Recursos por Plano
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead className="text-right">Usuários</TableHead>
              <TableHead className="text-right">Sites</TableHead>
              <TableHead className="text-right">Páginas</TableHead>
              <TableHead className="text-right">Média Sites/User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distribution.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                  Nenhum plano ativo encontrado
                </TableCell>
              </TableRow>
            ) : (
              distribution.map((plan) => (
                <TableRow key={plan.planName} className="h-16">
                  <TableCell>
                    <Badge>{plan.planName}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {plan.userCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {plan.sitesCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {plan.pagesCount.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {plan.userCount > 0
                      ? (plan.sitesCount / plan.userCount).toFixed(1)
                      : '0.0'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
