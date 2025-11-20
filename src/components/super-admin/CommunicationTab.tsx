import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, User } from "lucide-react";
import { useAllTickets, useTicketMessages, useSendMessage, useUpdateTicketStatus, useUpdateTicketPriority, useTicketStats } from "@/hooks/useSupportTickets";
import { StatusBadge } from "@/components/support/StatusBadge";
import { PriorityBadge } from "@/components/support/PriorityBadge";
import { CategoryIcon } from "@/components/support/CategoryIcon";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CommunicationTab() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    search: '',
  });

  const { data: tickets } = useAllTickets(filters);
  const { data: messages } = useTicketMessages(selectedTicketId || undefined);
  const { data: stats } = useTicketStats();
  const sendMessage = useSendMessage();
  const updateStatus = useUpdateTicketStatus();
  const updatePriority = useUpdateTicketPriority();

  const selectedTicket = tickets?.find(t => t.id === selectedTicketId);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicketId) return;

    sendMessage.mutate(
      {
        ticket_id: selectedTicketId,
        message: newMessage,
        is_admin_reply: true,
      },
      {
        onSuccess: () => {
          setNewMessage("");
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_open || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.in_progress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.waiting_user || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolvidos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.resolved_today || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Tickets List */}
        <div className="col-span-4">
          <Card className="h-[calc(100vh-300px)]">
            <CardHeader>
              <CardTitle className="text-lg">Tickets</CardTitle>
              <CardDescription>Todos os tickets de suporte</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters */}
              <div className="px-4 pb-4 space-y-2">
                <Input
                  placeholder="Buscar por assunto..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="waiting_user">Aguardando</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.priority} onValueChange={(v) => setFilters(f => ({ ...f, priority: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Prioridades</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tickets List */}
              <ScrollArea className="h-[calc(100%-140px)]">
                <div className="px-4 space-y-2 pb-4">
                  {tickets && tickets.length > 0 ? (
                    tickets.map((ticket) => {
                      const userName = ticket.user_profile?.full_name || ticket.user_profile?.email || 'Usuário';
                      const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                        <Card
                          key={ticket.id}
                          className={`p-3 cursor-pointer transition-colors ${
                            selectedTicketId === ticket.id ? 'bg-accent' : 'hover:bg-accent/50'
                          }`}
                          onClick={() => setSelectedTicketId(ticket.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusBadge status={ticket.status} className="text-xs" />
                                {ticket.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">Urgente</Badge>
                                )}
                                {ticket.unread_admin_count > 0 && (
                                  <Badge className="text-xs">{ticket.unread_admin_count}</Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium truncate">{userName}</p>
                              <p className="text-xs text-muted-foreground truncate mb-1">{ticket.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(ticket.last_message_at), { 
                                  addSuffix: true,
                                  locale: ptBR 
                                })}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum ticket encontrado</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="col-span-8">
          <Card className="h-[calc(100vh-300px)] flex flex-col">
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{selectedTicket.subject}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {selectedTicket.user_profile?.full_name || selectedTicket.user_profile?.email}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <CategoryIcon category={selectedTicket.category} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={selectedTicket.priority}
                        onValueChange={(v) => updatePriority.mutate({ ticket_id: selectedTicket.id, priority: v })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(v) => updateStatus.mutate({ ticket_id: selectedTicket.id, status: v })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aberto</SelectItem>
                          <SelectItem value="in_progress">Em Progresso</SelectItem>
                          <SelectItem value="waiting_user">Aguardando Usuário</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {messages?.map((message) => {
                      const senderName = message.profiles?.full_name || message.profiles?.email || 'Usuário';
                      const initials = senderName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.is_admin_reply ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={message.is_admin_reply ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[70%]`}>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-sm font-medium">{senderName}</span>
                              {message.is_admin_reply && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                            <div
                              className={`rounded-lg p-3 ${
                                message.is_admin_reply
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
                {selectedTicket.status !== 'closed' && (
                  <div className="p-6 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua resposta... (Ctrl+Enter para enviar)"
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
                      {newMessage.length}/5000 caracteres • Ctrl+Enter para enviar
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Selecione um ticket para visualizar</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
