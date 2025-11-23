import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2, Lightbulb } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  reviewer_name: string | null;
  reviewer_photo_url: string | null;
  star_rating: number;
  review_text: string | null;
  created_at: string;
  sentiment: string | null;
}

interface RespondReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
  onSubmit: (reviewId: string, replyText: string) => void;
  isSubmitting: boolean;
}

const RESPONSE_TEMPLATES = {
  5: [
    "Agradecemos muito pelo feedback positivo! Ficamos muito felizes em saber que você teve uma experiência excelente. Esperamos vê-lo novamente em breve!",
    "Muito obrigado pela avaliação! É maravilhoso saber que superamos suas expectativas. Conte sempre conosco!",
    "Que alegria receber sua avaliação! Seu feedback nos motiva a continuar oferecendo o melhor serviço. Até a próxima!",
  ],
  4: [
    "Ficamos felizes com sua experiência! Agradecemos seu feedback e estamos sempre trabalhando para melhorar ainda mais. Obrigado!",
    "Obrigado pela avaliação! É ótimo saber que você teve uma boa experiência. Esperamos vê-lo novamente!",
  ],
  3: [
    "Agradecemos seu feedback. Gostaríamos de entender melhor como podemos melhorar sua experiência. Entre em contato conosco para conversarmos!",
    "Obrigado por compartilhar sua opinião. Estamos sempre buscando melhorar e seu feedback é muito importante para nós.",
  ],
  low: [
    "Lamentamos muito sua experiência. Seu feedback é extremamente importante para nós. Por favor, entre em contato para que possamos resolver a situação e melhorar nossos serviços.",
    "Pedimos desculpas pela experiência negativa. Gostaríamos muito de conversar com você para entender o que aconteceu e como podemos melhorar. Entre em contato conosco.",
  ],
};

function getTemplates(rating: number): string[] {
  if (rating === 5) return RESPONSE_TEMPLATES[5];
  if (rating === 4) return RESPONSE_TEMPLATES[4];
  if (rating === 3) return RESPONSE_TEMPLATES[3];
  return RESPONSE_TEMPLATES.low;
}

export function RespondReviewDialog({
  open,
  onOpenChange,
  review,
  onSubmit,
  isSubmitting,
}: RespondReviewDialogProps) {
  const [replyText, setReplyText] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const handleReset = () => {
    setReplyText("");
    setShowTemplates(false);
  };

  const handleSubmit = () => {
    if (!review || !replyText.trim()) return;
    onSubmit(review.id, replyText.trim());
    handleReset();
  };

  const handleUseTemplate = (template: string) => {
    setReplyText(template);
    setShowTemplates(false);
  };

  if (!review) return null;

  const templates = getTemplates(review.star_rating);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) handleReset();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Responder Avaliação</DialogTitle>
          <DialogDescription>
            Responda à avaliação do cliente de forma profissional e atenciosa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Review Card */}
          <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.reviewer_photo_url || undefined} />
                <AvatarFallback>
                  {review.reviewer_name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{review.reviewer_name || "Anônimo"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>

                  {review.sentiment && (
                    <Badge
                      variant={
                        review.sentiment === "positive"
                          ? "default"
                          : review.sentiment === "negative"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {review.sentiment === "positive"
                        ? "Positivo"
                        : review.sentiment === "negative"
                        ? "Negativo"
                        : "Neutro"}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-1">
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

                {review.review_text && (
                  <p className="text-sm whitespace-pre-wrap">{review.review_text}</p>
                )}
              </div>
            </div>
          </div>

          {/* Response Templates */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              {showTemplates ? "Ocultar Sugestões" : "Ver Sugestões de Resposta"}
            </Button>

            {showTemplates && (
              <div className="space-y-2 border rounded-lg p-3 bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground">
                  SUGESTÕES DE RESPOSTA
                </p>
                {templates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    className="w-full text-left text-sm p-3 rounded border bg-background hover:bg-muted/50 transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply Textarea */}
          <div className="space-y-2">
            <Label htmlFor="reply">
              Sua Resposta
              <span className="text-xs text-muted-foreground ml-2">
                {replyText.length} caracteres
              </span>
            </Label>
            <Textarea
              id="reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Digite sua resposta para o cliente..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          {replyText && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                PREVIEW DA RESPOSTA
              </p>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  EU
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1">Sua Empresa</p>
                  <p className="text-sm whitespace-pre-wrap">{replyText}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!replyText.trim() || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Resposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
