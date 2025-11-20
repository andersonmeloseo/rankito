import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface TopUser {
  userId: string;
  userName: string;
  userEmail: string;
  totalSites: number;
  totalPages: number;
  totalConversions: number;
}

interface TopUsersConsumptionTableProps {
  topUsers: TopUser[];
}

const calculateConsumptionScore = (user: TopUser): number => {
  return Math.round(
    user.totalSites * 10 +
    user.totalPages * 1 +
    user.totalConversions * 0.1
  );
};

export const TopUsersConsumptionTable = ({ topUsers }: TopUsersConsumptionTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Top 10 Usuários por Consumo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-right">Sites</TableHead>
              <TableHead className="text-right">Páginas</TableHead>
              <TableHead className="text-right">Conversões</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              topUsers.map((user, index) => {
                const score = calculateConsumptionScore(user);
                return (
                  <TableRow key={user.userId} className="h-16">
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.totalSites}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.totalPages.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.totalConversions.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={score > 1000 ? "destructive" : "default"}>
                        {score.toLocaleString('pt-BR')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
