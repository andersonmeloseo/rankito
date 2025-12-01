import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Clock } from "lucide-react";
import { useFeatureRequests } from "@/hooks/useFeatureRequests";
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

export const MyRequestsList = () => {
  const { requests, isLoading } = useFeatureRequests(false);

  // Filtra apenas as solicitações do próprio usuário
  const myRequests = requests.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Minhas Solicitações
        </CardTitle>
        <CardDescription>
          Acompanhe o status das suas sugestões
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : myRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Você ainda não fez nenhuma solicitação</p>
            <p className="text-sm mt-1">Clique em "Solicitar Feature" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-medium text-sm line-clamp-1">{request.title}</h4>
                  <Badge className={`shrink-0 ${statusColors[request.status]}`}>
                    {statusLabels[request.status]}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {request.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(request.created_at), 'dd MMM yyyy', { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {request.votes_count} votos
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
