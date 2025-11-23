import { useState } from "react";
import { useGBPProfileReviews } from "@/hooks/useGBPProfileReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GBPProfileReviewsManagerProps {
  profileId: string;
}

export const GBPProfileReviewsManager = ({ profileId }: GBPProfileReviewsManagerProps) => {
  const { reviews, isLoading, replyToReview, isReplying, markAsRead, metrics } = useGBPProfileReviews(profileId);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

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

  const handleReply = () => {
    if (selectedReview && replyText.trim()) {
      replyToReview({ reviewId: selectedReview.id, reply: replyText });
      setReplyText("");
      setSelectedReview(null);
    }
  };

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

      {/* Lista de Reviews */}
      <div className="space-y-4">
        {reviews?.map((review) => (
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

        {reviews?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma review encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Resposta */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Review</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-semibold">{selectedReview.reviewer_name}</div>
                <div className="flex mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < selectedReview.star_rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm">{selectedReview.review_text}</p>
              </div>

              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Digite sua resposta..."
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Cancelar
            </Button>
            <Button onClick={handleReply} disabled={isReplying || !replyText.trim()}>
              {isReplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Resposta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
