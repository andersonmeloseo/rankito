import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { useUserTickets, useCreateTicket } from "@/hooks/useSupportTickets";
import { StatusBadge } from "./StatusBadge";
import { CategoryIcon } from "./CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TicketChatView } from "./TicketChatView";
import { supabase } from "@/integrations/supabase/client";

interface SupportTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportTicketDialog({ open, onOpenChange }: SupportTicketDialogProps) {
  const [view, setView] = useState<'list' | 'create' | 'chat'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("question");
  const [message, setMessage] = useState("");

  const { data: tickets, isLoading } = useUserTickets(userId || undefined);
  const createTicket = useCreateTicket();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const handleCreateTicket = () => {
    if (!subject.trim() || !message.trim()) return;

    const metadata = {
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().toISOString(),
    };

    createTicket.mutate(
      { subject, category, message, metadata },
      {
        onSuccess: () => {
          setSubject("");
          setCategory("question");
          setMessage("");
          setView('list');
        },
      }
    );
  };

  const handleOpenTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setView('chat');
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
    setView('list');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        {view === 'chat' && selectedTicketId ? (
          <TicketChatView ticketId={selectedTicketId} onBack={handleBackToList} />
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  {view === 'create' && (
                    <Button variant="ghost" size="icon" onClick={() => setView('list')}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {view === 'list' ? 'Meus Tickets de Suporte' : 'Novo Ticket'}
                </DialogTitle>
                {view === 'list' && (
                  <Button onClick={() => setView('create')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Ticket
                  </Button>
                )}
              </div>
            </DialogHeader>

            {view === 'list' ? (
              <ScrollArea className="px-6 pb-6 max-h-[60vh]">
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : tickets && tickets.length > 0 ? (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleOpenTicket(ticket.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <StatusBadge status={ticket.status} />
                              <CategoryIcon category={ticket.category} className="text-muted-foreground" />
                              {ticket.unread_user_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {ticket.unread_user_count} nova{ticket.unread_user_count > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-medium truncate mb-1">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(ticket.created_at), { 
                                addSuffix: true,
                                locale: ptBR 
                              })}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Você ainda não tem tickets</p>
                    <Button onClick={() => setView('create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Ticket
                    </Button>
                  </div>
                )}
              </ScrollArea>
            ) : (
              <div className="px-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Descreva brevemente o problema ou solicitação"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug_report">🐛 Reportar Bug</SelectItem>
                      <SelectItem value="feature_request">✨ Propor Melhoria</SelectItem>
                      <SelectItem value="question">❓ Pergunta/Dúvida</SelectItem>
                      <SelectItem value="technical_support">🛠️ Suporte Técnico</SelectItem>
                      <SelectItem value="other">📋 Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Descrição *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva detalhadamente sua solicitação ou problema..."
                    rows={6}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/2000 caracteres
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setView('list')}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateTicket}
                    disabled={!subject.trim() || !message.trim() || createTicket.isPending}
                  >
                    {createTicket.isPending ? 'Enviando...' : 'Enviar Ticket'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
