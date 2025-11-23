import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useGBPReviews } from "@/hooks/useGBPReviews";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GBPReviewsManagerProps {
  siteId: string;
}

export const GBPReviewsManager = ({ siteId }: GBPReviewsManagerProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [replyDialogReview, setReplyDialogReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  const { reviews, metrics, isLoading, isResponding, respondReview, markAsRead } = useGBPReviews(siteId, {
    status: statusFilter,
    rating: ratingFilter,
  });

  const handleRespond = () => {
    if (!replyDialogReview || !replyText.trim()) return;
    
    respondReview({
      reviewId: replyDialogReview.id,
      replyText: replyText.trim(),
    });
    
    setReplyDialogReview(null);
    setReplyText("");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === 'positive') return <ThumbsUp className="w-4 h-4 text-green-600" />;
    if (sentiment === 'negative') return <ThumbsDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Metrics cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rating Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgRating}</div>
              <div className="flex gap-1 mt-1">
                {renderStars(Math.round(metrics.avgRating))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.replyRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distribuição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                {Object.entries(metrics.distribution).reverse().map(([rating, count]) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span>{rating}★</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400"
                        style={{ width: `${metrics.total > 0 ? (count as number / metrics.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unanswered">Não Respondidas</SelectItem>
                <SelectItem value="answered">Respondidas</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={ratingFilter?.toString() || 'all'} 
              onValueChange={(v) => setRatingFilter(v === 'all' ? undefined : parseInt(v))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ratings</SelectItem>
                <SelectItem value="5">5 Estrelas</SelectItem>
                <SelectItem value="4">4 Estrelas</SelectItem>
                <SelectItem value="3">3 Estrelas</SelectItem>
                <SelectItem value="2">2 Estrelas</SelectItem>
                <SelectItem value="1">1 Estrela</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews list */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Carregando avaliações...</p>
          </CardContent>
        </Card>
      ) : !reviews || reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Nenhuma avaliação encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage src={review.reviewer_photo_url || undefined} />
                      <AvatarFallback>{review.reviewer_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{review.reviewer_name}</span>
                        {getSentimentIcon(review.sentiment || 'neutral')}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {renderStars(review.star_rating)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {review.is_replied ? (
                    <Badge variant="secondary">Respondida</Badge>
                  ) : (
                    <Badge variant="outline">Sem resposta</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {review.review_text && (
                  <p className="text-sm mb-4">{review.review_text}</p>
                )}

                {review.review_reply && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-xs font-semibold">Resposta do negócio</p>
                    <p className="text-sm">{review.review_reply}</p>
                    {review.review_reply_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.review_reply_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}

                {!review.is_replied && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        setReplyDialogReview(review);
                        if (!review.is_read) {
                          markAsRead(review.id);
                        }
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply dialog */}
      <Dialog open={!!replyDialogReview} onOpenChange={() => setReplyDialogReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Avaliação</DialogTitle>
            <DialogDescription>
              Envie uma resposta pública que aparecerá no Google Business Profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {replyDialogReview && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex gap-1">
                  {renderStars(replyDialogReview.star_rating)}
                </div>
                <p className="text-sm">{replyDialogReview.review_text}</p>
              </div>
            )}
            <Textarea
              placeholder="Escreva sua resposta..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogReview(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRespond}
              disabled={!replyText.trim() || isResponding}
            >
              {isResponding ? 'Enviando...' : 'Enviar Resposta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
