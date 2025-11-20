import { useState, useEffect, useRef } from "react";
import { useUserTickets, useTicketMessages, useSendMessage, useMarkMessagesAsRead, useUploadAttachment } from "@/hooks/useSupportTickets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Plus, Send, Radio, Mail, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { SupportTicketDialog } from "@/components/support/SupportTicketDialog";
import { TicketActionsMenu } from "@/components/support/TicketActionsMenu";
import { EmojiPickerButton } from "@/components/support/EmojiPickerButton";
import { AttachmentButton } from "@/components/support/AttachmentButton";
import { AttachmentPreview } from "@/components/support/AttachmentPreview";
import { MessageAttachment } from "@/components/support/MessageAttachment";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export function UserCommunicationsTab() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const { data: tickets = [] } = useUserTickets(userId || undefined);
  const { data: messages = [] } = useTicketMessages(selectedTicketId || undefined);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();
  const uploadAttachment = useUploadAttachment();

  // Separar mensagens do admin e tickets do usuário
  const adminMessages = tickets.filter(t => t.initiated_by === 'admin');
  const userTickets = tickets.filter(t => t.initiated_by === 'user');

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Marcar como lido quando selecionar ticket
  useEffect(() => {
    if (selectedTicketId && selectedTicket?.unread_user_count > 0) {
      markAsRead.mutate({ ticket_id: selectedTicketId, is_admin: false });
    }
  }, [selectedTicketId]);

  // Realtime
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-communications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets',
        filter: `user_id=eq.${userId}`
      }, () => {
        // Invalidar queries via react-query seria melhor, mas por ora forçar reload
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleSendMessage = async () => {
    if (!selectedTicketId || !newMessage.trim()) return;

    try {
      // Upload attachments first
      const attachments = [];
      if (selectedFiles.length > 0 && userId) {
        toast({
          title: "Enviando anexos...",
          description: `Fazendo upload de ${selectedFiles.length} arquivo(s)`,
        });

        for (const file of selectedFiles) {
          const attachment = await uploadAttachment.mutateAsync({
            file,
            userId,
          });
          attachments.push(attachment);
        }
      }

      // Send message with attachments
      await sendMessage.mutateAsync({
        ticket_id: selectedTicketId,
        message: newMessage.trim(),
        is_admin_reply: false,
        attachments,
      } as any);

      setNewMessage("");
      setSelectedFiles([]);
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || newMessage.length;
    const newText =
      newMessage.slice(0, start) + emoji + newMessage.slice(start);
    setNewMessage(newText);

    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, icon: any }> = {
      open: { variant: "default", icon: AlertCircle },
      in_progress: { variant: "secondary", icon: Clock },
      waiting_user: { variant: "warning", icon: Clock },
      resolved: { variant: "success", icon: CheckCircle2 },
      closed: { variant: "outline", icon: CheckCircle2 }
    };

    const config = variants[status] || variants.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status === 'open' && 'Aberto'}
        {status === 'in_progress' && 'Em Progresso'}
        {status === 'waiting_user' && 'Aguardando'}
        {status === 'resolved' && 'Resolvido'}
        {status === 'closed' && 'Fechado'}
      </Badge>
    );
  };

  const getTicketTypeBadge = (ticket: any) => {
    if (ticket.initiated_by === 'admin') {
      if (ticket.is_broadcast) {
        return <Badge variant="secondary" className="flex items-center gap-1"><Radio className="w-3 h-3" />Mensagem para Todos</Badge>;
      }
      return <Badge variant="default" className="flex items-center gap-1"><Mail className="w-3 h-3" />Mensagem Direta</Badge>;
    }
    return <Badge variant="outline">🎫 Seu Ticket</Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px] lg:min-h-[600px] max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-280px)]">
      {/* Sidebar */}
      <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 h-full">
        <Button onClick={() => setShowCreateDialog(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Criar Ticket de Suporte
        </Button>

        {/* Mensagens do Admin */}
        <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Mensagens do Admin
              {adminMessages.length > 0 && (
                <Badge variant="secondary">{adminMessages.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {adminMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda</p>
                ) : (
                  adminMessages.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTicketId === ticket.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">{ticket.subject}</h4>
                        {ticket.unread_user_count > 0 && (
                          <Badge variant="destructive" className="shrink-0 px-1.5 py-0">
                            {ticket.unread_user_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {getTicketTypeBadge(ticket)}
                        <span>
                          {formatDistanceToNow(new Date(ticket.last_message_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Meus Tickets */}
        <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base">
              Meus Tickets
              {userTickets.length > 0 && (
                <Badge variant="secondary" className="ml-2">{userTickets.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {userTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Precisa de ajuda? Crie um ticket de suporte
                  </p>
                ) : (
                  userTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTicketId === ticket.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">{ticket.subject}</h4>
                        {ticket.unread_user_count > 0 && (
                          <Badge variant="destructive" className="shrink-0 px-1.5 py-0">
                            {ticket.unread_user_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(ticket.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.last_message_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat View */}
      <div className="col-span-1 lg:col-span-8 h-full">
        <Card className="h-full flex flex-col">
          {!selectedTicketId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha uma mensagem ou ticket na barra lateral para visualizar
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <CardHeader className="flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{selectedTicket?.subject}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getTicketTypeBadge(selectedTicket)}
                      {getStatusBadge(selectedTicket?.status || 'open')}
                    </div>
                  </div>
                  {selectedTicketId && (
                    <TicketActionsMenu
                      ticketId={selectedTicketId}
                      ticketStatus={selectedTicket?.status || "open"}
                      chatContainerRef={chatContainerRef}
                    />
                  )}
                </div>
              </CardHeader>
              <Separator />

              {/* Messages */}
              <CardContent className="flex-1 min-h-0 p-4" ref={chatContainerRef}>
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          msg.is_admin_reply 
                            ? 'bg-muted' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((attachment, idx) => (
                                <MessageAttachment
                                  key={idx}
                                  attachment={attachment}
                                />
                              ))}
                            </div>
                          )}

                          <p className="text-xs mt-2 opacity-70">
                            {formatDistanceToNow(new Date(msg.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input */}
              {selectedTicket?.status !== 'closed' && (
                <>
                  <Separator />
                  <div className="p-4 flex-shrink-0">
                    <div className="flex flex-col gap-2">
                      {/* Preview de anexos */}
                      {selectedFiles.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {selectedFiles.map((file, idx) => (
                            <AttachmentPreview
                              key={idx}
                              file={file}
                              onRemove={() => handleRemoveFile(idx)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Input de mensagem */}
                      <div className="flex gap-2">
                        <div className="flex gap-1">
                          <AttachmentButton
                            onFilesSelected={handleFilesSelected}
                          />
                          <EmojiPickerButton
                            onEmojiSelect={handleEmojiSelect}
                          />
                        </div>

                        <Textarea
                          ref={textareaRef}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Digite sua mensagem..."
                          className="resize-none min-h-[80px]"
                        />

                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendMessage.isPending}
                          size="icon"
                          className="h-[80px]"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </Card>
      </div>

      <SupportTicketDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
