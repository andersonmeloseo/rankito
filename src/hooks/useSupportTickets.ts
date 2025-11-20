import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: 'bug_report' | 'feature_request' | 'question' | 'technical_support' | 'other';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  last_message_at: string;
  unread_admin_count: number;
  unread_user_count: number;
  metadata: Record<string, any>;
  initiated_by: 'user' | 'admin';
  is_broadcast: boolean;
  recipient_user_id: string | null;
  profiles?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachments: Array<{ name: string; url: string; size: number }>;
  is_admin_reply: boolean;
  is_read: boolean;
  is_internal_note: boolean;
  created_at: string;
  edited_at: string | null;
  profiles?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

// User hooks
export function useUserTickets(userId?: string) {
  return useQuery({
    queryKey: ['support-tickets', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user_profile:profiles!user_id (full_name, email, avatar_url)
        `)
        .or(`user_id.eq.${userId},recipient_user_id.eq.${userId},is_broadcast.eq.true`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });
}

// Admin hooks
export function useAllTickets(filters?: {
  status?: string;
  category?: string;
  priority?: string;
  assigned_to?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['support-tickets-all', filters],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user_profile:profiles!user_id (full_name, email, avatar_url)
        `)
        .order('last_message_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as any);
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category as any);
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority as any);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.search) {
        query = query.or(`subject.ilike.%${filters.search}%,metadata->>page_url.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useTicketById(ticketId?: string) {
  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user_profile:profiles!user_id (full_name, email, avatar_url)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useTicketMessages(ticketId?: string) {
  return useQuery({
    queryKey: ['support-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          profiles:sender_id (full_name, email, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!ticketId,
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: ['support-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, priority, created_at');

      if (error) throw error;

      const stats = {
        total_open: data.filter(t => t.status === 'open').length,
        in_progress: data.filter(t => t.status === 'in_progress').length,
        waiting_user: data.filter(t => t.status === 'waiting_user').length,
        resolved_today: data.filter(t => 
          t.status === 'resolved' && 
          new Date(t.created_at).toDateString() === new Date().toDateString()
        ).length,
      };

      return stats;
    },
  });
}

// Mutations
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      subject: string;
      category: string;
      message: string;
      metadata?: Record<string, any>;
    }) => {
      console.log('🎫 Tentando criar ticket:', { subject: data.subject, category: data.category });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ Usuário autenticado:', user.id);

      // Create ticket with explicit fields
      const ticketPayload = {
        user_id: user.id,
        subject: data.subject,
        category: data.category as any,
        metadata: data.metadata || {},
        initiated_by: 'user' as const,
        is_broadcast: false,
      };
      
      console.log('📤 Payload do ticket:', ticketPayload);

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert([ticketPayload])
        .select()
        .single();

      if (ticketError) {
        console.error('❌ Erro ao criar ticket:', ticketError);
        throw ticketError;
      }
      
      console.log('✅ Ticket criado:', ticket.id);

      // Create first message
      const messagePayload = {
        ticket_id: ticket.id,
        sender_id: user.id,
        message: data.message,
        is_admin_reply: false,
      };
      
      console.log('📤 Payload da mensagem:', messagePayload);

      const { error: messageError } = await supabase
        .from('support_messages')
        .insert([messagePayload]);

      if (messageError) {
        console.error('❌ Erro ao criar mensagem:', messageError);
        throw messageError;
      }
      
      console.log('✅ Mensagem criada com sucesso');

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro detalhado ao criar ticket:', error);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao criar ticket';
      
      if (error.message.includes('permission') || error.message.includes('policy')) {
        errorMessage = 'Sem permissão para criar ticket. Verifique sua conta.';
      } else if (error.message.includes('user_id')) {
        errorMessage = 'Erro ao identificar usuário. Tente fazer login novamente.';
      } else if (error.message.includes('constraint')) {
        errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
      } else if (error.message.includes('autenticado')) {
        errorMessage = 'Você precisa estar autenticado para criar tickets.';
      } else {
        errorMessage = `Erro ao criar ticket: ${error.message}`;
      }
      
      toast.error(errorMessage);
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticket_id: string;
      message: string;
      is_admin_reply: boolean;
      is_internal_note?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: data.ticket_id,
          sender_id: user.id,
          message: data.message,
          is_admin_reply: data.is_admin_reply,
          is_internal_note: data.is_internal_note || false,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', variables.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticket_id] });
      toast.success('Mensagem enviada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar mensagem: ' + error.message);
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticket_id: string; status: string }) => {
      const updates: any = { status: data.status, updated_at: new Date().toISOString() };
      
      if (data.status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      } else if (data.status === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', data.ticket_id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticket_id] });
      toast.success('Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });
}

export function useUpdateTicketPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticket_id: string; priority: string }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ priority: data.priority as any, updated_at: new Date().toISOString() })
        .eq('id', data.ticket_id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticket_id] });
      toast.success('Prioridade atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar prioridade: ' + error.message);
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticket_id: string; admin_id: string | null }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: data.admin_id, updated_at: new Date().toISOString() })
        .eq('id', data.ticket_id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticket_id] });
      toast.success('Ticket atribuído!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atribuir ticket: ' + error.message);
    },
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticket_id: string; is_admin: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Mark messages as read
      const { error: messagesError } = await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('ticket_id', data.ticket_id)
        .eq('is_admin_reply', !data.is_admin);

      if (messagesError) throw messagesError;

      // Reset unread counter
      const counterField = data.is_admin ? 'unread_admin_count' : 'unread_user_count';
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({ [counterField]: 0 })
        .eq('id', data.ticket_id);

      if (ticketError) throw ticketError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', variables.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticket_id] });
    },
  });
}
