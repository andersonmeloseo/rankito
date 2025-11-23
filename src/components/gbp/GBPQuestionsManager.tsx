import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ThumbsUp, CheckCircle, Clock } from "lucide-react";
import { useGBPQuestions } from "@/hooks/useGBPQuestions";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GBPQuestionsManagerProps {
  profileId: string;
}

export const GBPQuestionsManager = ({ profileId }: GBPQuestionsManagerProps) => {
  const { questions, isLoading, answerQuestion, isAnswering } = useGBPQuestions(profileId);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  const handleSubmitAnswer = (questionId: string) => {
    if (!answerText.trim()) return;
    answerQuestion({ questionId, answerText });
    setAnswerText("");
    setSelectedQuestion(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma pergunta encontrada</p>
      </Card>
    );
  }

  const unansweredQuestions = questions.filter(q => !q.is_answered);
  const answeredQuestions = questions.filter(q => q.is_answered);

  return (
    <div className="space-y-6">
      {/* Unanswered Questions */}
      {unansweredQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Perguntas Pendentes</h2>
            <Badge variant="secondary">{unansweredQuestions.length}</Badge>
          </div>

          {unansweredQuestions.map((question) => (
            <Card key={question.id} className="p-6 border-orange-200 bg-orange-50/50">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{question.asked_by}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(question.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-lg">{question.question_text}</p>
                    {question.upvotes > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{question.upvotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedQuestion === question.id ? (
                  <div className="space-y-3 border-t pt-4">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmitAnswer(question.id)}
                        disabled={isAnswering || !answerText.trim()}
                      >
                        Enviar Resposta
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedQuestion(null);
                          setAnswerText("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedQuestion(question.id)}
                  >
                    Responder
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Answered Questions */}
      {answeredQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Perguntas Respondidas</h2>
            <Badge variant="secondary">{answeredQuestions.length}</Badge>
          </div>

          {answeredQuestions.map((question) => (
            <Card key={question.id} className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{question.asked_by}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(question.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-lg">{question.question_text}</p>
                  {question.upvotes > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">{question.upvotes}</span>
                    </div>
                  )}
                </div>

                <div className="border-l-4 border-primary pl-4 bg-muted/30 py-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-xs">Resposta</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(question.answered_at!), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{question.answer_text}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
