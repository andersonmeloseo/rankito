import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface EarlyAccessLead {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  num_sites: string;
  main_pain: string;
  accept_communication: boolean;
  referral_source: string | null;
  utm_params: any;
  created_at: string;
  status: 'pending' | 'contacted' | 'converted' | 'rejected';
  campaign_id: string | null;
  converted_to_user_id: string | null;
}

export const useEarlyAccessLeads = () => {
  return useQuery({
    queryKey: ["early-access-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("early_access_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EarlyAccessLead[];
    },
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("early_access_leads")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["early-access-leads"] });
      toast({
        title: "Status atualizado",
        description: "Lead atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};