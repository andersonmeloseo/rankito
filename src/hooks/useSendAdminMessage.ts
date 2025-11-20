import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendAdminMessageData {
  type: 'broadcast' | 'individual';
  recipient_user_id?: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
}

export function useSendAdminMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendAdminMessageData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      let userIds: string[] = [];

      if (data.type === 'broadcast') {
        // Buscar todos os usuários ativos
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id")
          .eq("is_active", true);

        if (profilesError) throw profilesError;
        userIds = profiles?.map(p => p.id) || [];
      } else {
        // Mensagem individual
        if (!data.recipient_user_id) throw new Error("Destinatário não especificado");
        userIds = [data.recipient_user_id];
      }

      // Criar tickets para cada usuário
      const tickets = userIds.map(userId => ({
        user_id: userId,
        subject: data.subject,
        category: data.category as any,
        priority: data.priority as any,
        status: 'open' as any,
        initiated_by: 'admin',
        is_broadcast: data.type === 'broadcast',
        recipient_user_id: data.type === 'individual' ? data.recipient_user_id : null
      }));

      const { data: createdTickets, error: ticketsError } = await supabase
        .from("support_tickets")
        .insert(tickets)
        .select();

      if (ticketsError) throw ticketsError;

      // Criar mensagem inicial para cada ticket
      const messages = createdTickets.map(ticket => ({
        ticket_id: ticket.id,
        sender_id: user.id,
        message: data.message,
        is_admin_reply: true,
        is_internal_note: false
      }));

      const { error: messagesError } = await supabase
        .from("support_messages")
        .insert(messages);

      if (messagesError) throw messagesError;

      return { ticketsCount: createdTickets.length };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["unread-communications"] });
      
      const message = variables.type === 'broadcast' 
        ? `Mensagem enviada para ${result.ticketsCount} usuários!`
        : "Mensagem enviada com sucesso!";
      
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    }
  });
}
