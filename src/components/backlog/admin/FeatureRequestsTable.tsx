import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye, ThumbsUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFeatureRequests, FeatureRequest } from "@/hooks/useFeatureRequests";
import { AcceptRequestDialog } from "./AcceptRequestDialog";
import { RejectRequestDialog } from "./RejectRequestDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels = {
  pending: 'Pendente',
  under_review: 'Em Análise',
  accepted: 'Aceita',
  rejected: 'Rejeitada',
  implemented: 'Implementada',
};

const statusColors = {
  pending: 'bg-yellow-500',
  under_review: 'bg-blue-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  implemented: 'bg-purple-500',
};

const categoryLabels = {
  new_feature: 'Nova Feature',
  improvement: 'Melhoria',
  integration: 'Integração',
  other: 'Outro',
};

export const FeatureRequestsTable = () => {
  const { requests, isLoading } = useFeatureRequests(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [acceptRequest, setAcceptRequest] = useState<FeatureRequest | null>(null);
  const [rejectRequest, setRejectRequest] = useState<FeatureRequest | null>(null);

  const filteredRequests = requests.filter(
    (r) => statusFilter === 'all' || r.status === statusFilter
  );

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Solicitações de Usuários</CardTitle>
            <CardDescription>
              Gerencie as solicitações de features enviadas pelos usuários
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="under_review">Em Análise</SelectItem>
              <SelectItem value="accepted">Aceitas</SelectItem>
              <SelectItem value="rejected">Rejeitadas</SelectItem>
              <SelectItem value="implemented">Implementadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Votos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {request.profiles?.full_name || 'Sem nome'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.profiles?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {request.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{categoryLabels[request.category]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span className="text-sm">{request.votes_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAcceptRequest(request)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRejectRequest(request)}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {acceptRequest && (
        <AcceptRequestDialog
          request={acceptRequest}
          open={!!acceptRequest}
          onOpenChange={(open) => !open && setAcceptRequest(null)}
        />
      )}

      {rejectRequest && (
        <RejectRequestDialog
          request={rejectRequest}
          open={!!rejectRequest}
          onOpenChange={(open) => !open && setRejectRequest(null)}
        />
      )}
    </Card>
  );
};
