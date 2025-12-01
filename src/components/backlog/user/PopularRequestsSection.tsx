import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, TrendingUp } from "lucide-react";
import { useFeatureRequests } from "@/hooks/useFeatureRequests";
import { useFeatureVotes } from "@/hooks/useFeatureVotes";

export const PopularRequestsSection = () => {
  const { requests, isLoading } = useFeatureRequests(false);

  // Ordena por votos e pega as top 5
  const popularRequests = [...requests]
    .sort((a, b) => b.votes_count - a.votes_count)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Features Mais Votadas
        </CardTitle>
        <CardDescription>
          Vote nas ideias de outros usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : popularRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ainda não há solicitações públicas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {popularRequests.map((request, index) => (
              <RequestVoteCard key={request.id} request={request} rank={index + 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const RequestVoteCard = ({ request, rank }: { request: any; rank: number }) => {
  const { hasVoted, toggleVote } = useFeatureVotes(request.id);

  return (
    <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <Badge variant="outline" className="shrink-0 mt-1">
          #{rank}
        </Badge>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-1 mb-1">{request.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {request.description}
          </p>
        </div>

        <Button
          variant={hasVoted ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={() => toggleVote()}
        >
          <ThumbsUp className={`h-3 w-3 mr-1 ${hasVoted ? 'fill-current' : ''}`} />
          {request.votes_count}
        </Button>
      </div>
    </div>
  );
};
