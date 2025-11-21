import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSendAdminMessage } from "@/hooks/useSendAdminMessage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Users, Send, Loader2 } from "lucide-react";

interface AdminMessageComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminMessageComposer({ open, onOpenChange }: AdminMessageComposerProps) {
  const [type, setType] = useState<'broadcast' | 'individual'>('individual');
  const [recipientId, setRecipientId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("question");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");

  const sendMessage = useSendAdminMessage();

  const { data: users } = useQuery({
    queryKey: ["active-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("is_active", true)
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
    enabled: open && type === 'individual'
  });

  const handleSubmit = () => {
    if (!subject || !message) return;
    if (type === 'individual' && !recipientId) return;

    sendMessage.mutate({
      type,
      recipient_user_id: type === 'individual' ? recipientId : undefined,
      subject,
      category,
      priority,
      message
    }, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset form
        setType('individual');
        setRecipientId("");
        setSubject("");
        setCategory("question");
        setPriority("medium");
        setMessage("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Nova Mensagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de Mensagem */}
          <div className="space-y-3">
            <Label>Tipo de Mensagem</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                  <Radio className="w-4 h-4" />
                  Individual - Enviar para um usuário específico
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="broadcast" id="broadcast" />
                <Label htmlFor="broadcast" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Broadcast - Enviar para todos os usuários ativos
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Destinatário (se individual) */}
          {type === 'individual' && (
            <div className="space-y-2">
              <Label htmlFor="recipient">Destinatário</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger id="recipient">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Nova funcionalidade disponível"
              maxLength={200}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="question">❓ Pergunta/Dúvida</SelectItem>
                <SelectItem value="technical_support">🛠️ Suporte Técnico</SelectItem>
                <SelectItem value="bug_report">🐛 Relatório de Bug</SelectItem>
                <SelectItem value="feature_request">✨ Solicitação de Funcionalidade</SelectItem>
                <SelectItem value="other">📝 Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              className="min-h-[150px]"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/5000 caracteres
            </p>
          </div>

          {/* Preview */}
          {type === 'broadcast' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Atenção:</strong> Esta mensagem será enviada para todos os usuários ativos da plataforma.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!subject || !message || (type === 'individual' && !recipientId) || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
