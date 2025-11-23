import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGBPMockData = (siteId: string) => {
  const queryClient = useQueryClient();

  const generateMockData = useMutation({
    mutationFn: async ({ clearExisting = false }: { clearExisting?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('gbp-seed-mock-data', {
        body: { site_id: siteId, clear_existing: clearExisting },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.profiles?.length || 0} perfis mockados criados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['gbp-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['gbp-site-profiles'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao gerar dados mockados: ${error.message}`);
    },
  });

  return {
    generateMockData: generateMockData.mutate,
    isGenerating: generateMockData.isPending,
  };
};
