import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMarketingContentCalendar, CreateContentInput } from "@/hooks/useMarketingContentCalendar";
import { Plus, FileText, Calendar, Lightbulb, Edit2, Send, CheckCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const contentTypes = [
  { value: "blog", label: "📝 Blog Post" },
  { value: "linkedin", label: "💼 LinkedIn Post" },
  { value: "instagram", label: "📸 Instagram" },
  { value: "email", label: "📧 Email" },
  { value: "video", label: "🎬 Vídeo" },
  { value: "webinar", label: "🎤 Webinar" },
  { value: "ebook", label: "📚 E-book" },
  { value: "case", label: "📊 Case Study" },
];

const statusConfig = {
  idea: { label: "💡 Ideia", color: "bg-yellow-100 text-yellow-800", icon: Lightbulb },
  draft: { label: "✏️ Rascunho", color: "bg-blue-100 text-blue-800", icon: Edit2 },
  review: { label: "👁️ Revisão", color: "bg-purple-100 text-purple-800", icon: FileText },
  published: { label: "✅ Publicado", color: "bg-green-100 text-green-800", icon: CheckCircle },
};

export const ContentSEOManager = () => {
  const { content, isLoading, createContent, updateContent, deleteContent, contentByStatus } = useMarketingContentCalendar();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateContentInput>({
    title: "",
    type: "blog",
    channel: "",
    status: "idea",
    scheduled_date: "",
    target_keywords: [],
    notes: "",
  });
  const [keywordsInput, setKeywordsInput] = useState("");

  const handleCreate = async () => {
    await createContent.mutateAsync({
      ...formData,
      target_keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
    });
    setIsCreateOpen(false);
    setFormData({
      title: "",
      type: "blog",
      channel: "",
      status: "idea",
      scheduled_date: "",
      target_keywords: [],
      notes: "",
    });
    setKeywordsInput("");
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updates: Record<string, string | null> = { status: newStatus };
    if (newStatus === "published") {
      updates.published_date = new Date().toISOString().split("T")[0];
    }
    await updateContent.mutateAsync({ id, ...updates });
  };

  if (isLoading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário de Conteúdo
          </h2>
          <p className="text-sm text-muted-foreground">
            {content?.length || 0} itens no calendário
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Conteúdo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: 10 Dicas para Rank & Rent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Data Prevista</Label>
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="rank and rent, seo brasil, analytics"
                />
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalhes, outline, referências..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate}>Adicionar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(["idea", "draft", "review", "published"] as const).map((status) => {
          const config = statusConfig[status];
          const items = contentByStatus[status];

          return (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <config.icon className="h-4 w-4" />
                    {config.label}
                  </span>
                  <Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length > 0 ? (
                  items.map((item) => (
                    <Card key={item.id} className="p-3 hover:shadow-sm transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                          <Badge variant="outline" className="text-xs shrink-0 ml-2">
                            {contentTypes.find((t) => t.value === item.type)?.label.split(" ")[0]}
                          </Badge>
                        </div>

                        {item.scheduled_date && (
                          <p className="text-xs text-muted-foreground">
                            📅 {format(new Date(item.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}

                        {item.target_keywords && item.target_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.target_keywords.slice(0, 2).map((kw, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-1 pt-1">
                          {status === "idea" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => handleStatusChange(item.id, "draft")}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Rascunho
                            </Button>
                          )}
                          {status === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => handleStatusChange(item.id, "review")}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Revisão
                            </Button>
                          )}
                          {status === "review" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-green-600"
                              onClick={() => handleStatusChange(item.id, "published")}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Publicar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive ml-auto"
                            onClick={() => deleteContent.mutate(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhum item
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SEO Keywords Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Keywords Alvo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Set(
                content?.flatMap((c) => c.target_keywords || []) || []
              )
            ).map((keyword, idx) => (
              <Badge key={idx} variant="outline">
                {keyword}
              </Badge>
            ))}
            {(!content || content.length === 0) && (
              <p className="text-muted-foreground text-sm">Adicione conteúdo com keywords para ver o resumo aqui</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
