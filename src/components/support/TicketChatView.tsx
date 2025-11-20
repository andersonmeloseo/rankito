import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { useTicketById, useTicketMessages, useSendMessage, useMarkMessagesAsRead } from "@/hooks/useSupportTickets";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface TicketChatViewProps {
  ticketId: string;
  onBack: () => void;
}

export function TicketChatView({ ticketId, onBack }: TicketChatViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: ticket } = useTicketById(ticketId);
  const { data: messages } = useTicketMessages(ticketId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Mark messages as read when opening chat
  useEffect(() => {
    if (ticketId && ticket && ticket.unread_user_count > 0) {
      markAsRead.mutate({ ticket_id: ticketId, is_admin: false });
    }
  }, [ticketId, ticket]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessage.mutate(
      {
        ticket_id: ticketId,
        message: newMessage,
        is_admin_reply: false,
      },
      {
        onSuccess: () => {
          setNewMessage("");
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!ticket) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate mb-2">{ticket.subject}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-muted-foreground">
                #{ticket.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages?.map((message) => {
            const isOwnMessage = message.sender_id === userId;
            const senderName = message.profiles?.full_name || message.profiles?.email || 'Usuário';
            const initials = senderName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium">{senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      {ticket.status !== 'closed' && (
        <div className="px-6 pb-6 pt-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Enter para enviar)"
              rows={3}
              className="resize-none"
              maxLength={5000}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessage.isPending}
              size="icon"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {newMessage.length}/5000 caracteres
          </p>
        </div>
      )}

      {ticket.status === 'closed' && (
        <div className="px-6 pb-6 pt-4 border-t bg-muted/50">
          <p className="text-sm text-center text-muted-foreground">
            Este ticket foi fechado. Para continuar a conversa, abra um novo ticket.
          </p>
        </div>
      )}
    </div>
  );
}
