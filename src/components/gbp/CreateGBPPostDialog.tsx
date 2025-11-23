import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGBPPosts } from "@/hooks/useGBPPosts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateGBPPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
}

const CTA_TYPES = [
  { value: "BOOK", label: "Reservar" },
  { value: "ORDER", label: "Pedir" },
  { value: "SHOP", label: "Comprar" },
  { value: "LEARN_MORE", label: "Saiba Mais" },
  { value: "SIGN_UP", label: "Inscrever-se" },
  { value: "CALL", label: "Ligar" },
];

export function CreateGBPPostDialog({ open, onOpenChange, siteId }: CreateGBPPostDialogProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [postType, setPostType] = useState<string>("STANDARD");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ctaType, setCtaType] = useState<string>("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("");

  const { createPost, isCreating } = useGBPPosts(siteId);

  // Fetch GBP profiles for this site
  const { data: profiles } = useQuery({
    queryKey: ["gbp-profiles", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_business_profiles")
        .select("*")
        .eq("site_id", siteId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  const handleReset = () => {
    setSelectedProfile("");
    setPostType("STANDARD");
    setTitle("");
    setContent("");
    setCtaType("");
    setCtaUrl("");
    setScheduledDate(undefined);
    setScheduledTime("");
  };

  const handleSaveDraft = () => {
    if (!selectedProfile || !content) return;

    createPost(
      {
        profileId: selectedProfile,
        postType,
        title: title || undefined,
        content,
        ctaType: ctaType || undefined,
        ctaUrl: ctaUrl || undefined,
        scheduledFor: undefined, // Draft has no schedule
      },
      {
        onSuccess: () => {
          handleReset();
          onOpenChange(false);
        },
      }
    );
  };

  const handleSchedule = () => {
    if (!selectedProfile || !content || !scheduledDate || !scheduledTime) return;

    const [hours, minutes] = scheduledTime.split(":");
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(parseInt(hours), parseInt(minutes), 0);

    createPost(
      {
        profileId: selectedProfile,
        postType,
        title: title || undefined,
        content,
        ctaType: ctaType || undefined,
        ctaUrl: ctaUrl || undefined,
        scheduledFor: scheduled.toISOString(),
      },
      {
        onSuccess: () => {
          handleReset();
          onOpenChange(false);
        },
      }
    );
  };

  const handlePublishNow = () => {
    if (!selectedProfile || !content) return;

    createPost(
      {
        profileId: selectedProfile,
        postType,
        title: title || undefined,
        content,
        ctaType: ctaType || undefined,
        ctaUrl: ctaUrl || undefined,
        scheduledFor: new Date().toISOString(), // Immediate scheduling
      },
      {
        onSuccess: () => {
          handleReset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Post no Google Business</DialogTitle>
          <DialogDescription>
            Crie um novo post para publicar no perfil do Google Business
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Profile Selection */}
          <div className="space-y-2">
            <Label htmlFor="profile">Perfil GBP *</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.business_name || profile.connection_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Type */}
          <div className="space-y-2">
            <Label htmlFor="postType">Tipo de Post</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Padrão</SelectItem>
                <SelectItem value="EVENT">Evento</SelectItem>
                <SelectItem value="OFFER">Oferta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título (Opcional)
              <span className="text-xs text-muted-foreground ml-2">
                {title.length}/58
              </span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 58))}
              placeholder="Digite o título do post"
              maxLength={58}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Conteúdo *
              <span className="text-xs text-muted-foreground ml-2">
                {content.length}/1500
              </span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 1500))}
              placeholder="Digite o conteúdo do post"
              rows={6}
              maxLength={1500}
              className="resize-none"
            />
          </div>

          {/* CTA Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctaType">Call to Action (Opcional)</Label>
              <Select value={ctaType} onValueChange={setCtaType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um CTA" />
                </SelectTrigger>
                <SelectContent>
                  {CTA_TYPES.map((cta) => (
                    <SelectItem key={cta.value} value={cta.value}>
                      {cta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ctaUrl">URL do CTA</Label>
              <Input
                id="ctaUrl"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://exemplo.com"
                disabled={!ctaType}
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Agendamento (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Horário</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={!scheduledDate}
              />
            </div>
          </div>

          {/* Preview */}
          {content && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground mb-2">PREVIEW</p>
              {title && <h3 className="font-semibold mb-2">{title}</h3>}
              <p className="text-sm whitespace-pre-wrap">{content}</p>
              {ctaType && (
                <Button variant="outline" size="sm" className="mt-3" disabled>
                  {CTA_TYPES.find((c) => c.value === ctaType)?.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={!selectedProfile || !content || isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Rascunho
            </Button>

            {scheduledDate && scheduledTime ? (
              <Button
                onClick={handleSchedule}
                disabled={!selectedProfile || !content || isCreating}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agendar Publicação
              </Button>
            ) : (
              <Button
                onClick={handlePublishNow}
                disabled={!selectedProfile || !content || isCreating}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publicar Agora
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
