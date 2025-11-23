import { useState } from "react";
import { useGBPProfileReviews } from "@/hooks/useGBPProfileReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RespondReviewDialog } from "./RespondReviewDialog";

interface GBPProfileReviewsManagerProps {
  profileId: string;
}

type FilterType = "all" | "unreplied" | "positive" | "negative";

export const GBPProfileReviewsManager = ({ profileId }: GBPProfileReviewsManagerProps) => {
  const { reviews, isLoading, replyToReview, isReplying, markAsRead, metrics } = useGBPProfileReviews(profileId);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const handleSubmitReply = (reviewId: string, replyText: string) => {
    replyToReview({ reviewId, reply: replyText });
    setSelectedReview(null);
  };

  const isUrgent = (review: any) => {
    if (review.is_replied) return false;
    const daysSinceReview = differenceInDays(new Date(), new Date(review.created_at));
    return daysSinceReview > 7;
  };

  const filteredReviews = reviews?.filter((review) => {
    if (filter === "unreplied") return !review.is_replied;
    if (filter === "positive") return review.star_rating === 5;
    if (filter === "negative") return review.star_rating <= 2;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.averageRating.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground">Rating Médio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-sm text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.responseRate.toFixed(0)}%</div>
            <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.unread}</div>
            <p className="text-sm text-muted-foreground">Não Lidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas ({reviews?.length || 0})</TabsTrigger>
          <TabsTrigger value="unreplied">
            Não Respondidas ({reviews?.filter(r => !r.is_replied).length || 0})
          </TabsTrigger>
          <TabsTrigger value="positive">5 Estrelas ({reviews?.filter(r => r.star_rating === 5).length || 0})</TabsTrigger>
          <TabsTrigger value="negative">1-2 Estrelas ({reviews?.filter(r => r.star_rating <= 2).length || 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de Reviews */}
      <div className="space-y-4">
        {filteredReviews?.map((review) => (
          <Card key={review.id} className={!review.is_read ? "border-primary" : ""}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.reviewer_photo_url || undefined} />
                  <AvatarFallback>{review.reviewer_name?.[0] || "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{review.reviewer_name}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.star_rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!review.is_read && <Badge variant="destructive">Nova</Badge>}
                      {isUrgent(review) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Urgente
                        </Badge>
                      )}
                      {review.is_replied && (
                        <Badge variant="secondary">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Respondida
                        </Badge>
                      )}
                    </div>
                  </div>

                  {review.review_text && (
                    <p className="text-sm text-muted-foreground">{review.review_text}</p>
                  )}

                  {review.review_reply && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="text-sm font-semibold mb-1">Resposta do Proprietário</div>
                      <p className="text-sm">{review.review_reply}</p>
                      {review.review_reply_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(review.review_reply_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      )}
                    </div>
                  )}

                  {!review.is_replied && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReview(review);
                        if (!review.is_read) markAsRead(review.id);
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Responder
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredReviews?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma review encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Resposta Avançado */}
      {selectedReview && (
        <RespondReviewDialog
          open={!!selectedReview}
          onOpenChange={(open) => {
            if (!open) setSelectedReview(null);
          }}
          review={{
            id: selectedReview.id,
            reviewer_name: selectedReview.reviewer_name || "Cliente",
            reviewer_photo_url: selectedReview.reviewer_photo_url,
            star_rating: selectedReview.star_rating,
            review_text: selectedReview.review_text || "",
            sentiment: selectedReview.sentiment || "neutral",
            created_at: selectedReview.created_at,
          }}
          onSubmit={handleSubmitReply}
          isSubmitting={isReplying}
        />
      )}
    </div>
  );
};
