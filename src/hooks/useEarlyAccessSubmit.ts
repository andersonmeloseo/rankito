import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EarlyAccessLeadInput {
  full_name: string;
  email: string;
  whatsapp: string;
  num_sites: string;
  main_pain: string;
  accept_communication: boolean;
  utm_params?: Record<string, string | null>;
}

export const useEarlyAccessSubmit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EarlyAccessLeadInput) => {
      const { data: result, error } = await supabase
        .from("early_access_leads")
        .insert({
          full_name: data.full_name,
          email: data.email,
          whatsapp: data.whatsapp,
          num_sites: data.num_sites,
          main_pain: data.main_pain,
          accept_communication: data.accept_communication,
          utm_params: data.utm_params,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Este email já está cadastrado na lista de espera!");
        }
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["early-access-leads"] });
      
      toast({
        title: "🎉 Vaga Garantida!",
        description: "Verifique seu email para próximos passos. Você receberá atualizações exclusivas em breve.",
      });

      // Redirect to success page or show modal
      setTimeout(() => {
        window.location.href = "/?early-access=success";
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao garantir vaga",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};